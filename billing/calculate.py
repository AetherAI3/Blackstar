#!/usr/bin/env python3
"""Offline proposal economics. No Stripe client, credentials, network, or invoices."""
import argparse
import json
from decimal import Decimal, ROUND_CEILING, ROUND_HALF_UP
from pathlib import Path

ROOT = Path(__file__).resolve().parent


def cents(value):
    return int(Decimal(value).quantize(Decimal('1'), rounding=ROUND_HALF_UP))


def require_int(value, field, minimum=0):
    if type(value) is not int or value < minimum:
        raise ValueError(f'{field} must be an integer >= {minimum}')


def validate(catalog):
    if catalog.get('schema_version') != 1 or catalog.get('currency') != 'usd':
        raise ValueError('Unsupported schema or currency')
    if catalog.get('status') != 'proposed' or catalog.get('public_checkout_enabled') is not False:
        raise ValueError('This planning catalog must stay proposed and checkout disabled')
    if not catalog.get('catalog_version') or catalog.get('effective_date') is not None:
        raise ValueError('Proposal needs a version and no live effective date')
    for name, fee in catalog['fee_models'].items():
        for key, value in fee.items():
            require_int(value, f'{name}.{key}')
            if 'bps' in key and value >= 10000:
                raise ValueError('Fee rate must be below 100%')
    ids, aliases = set(), set()
    if not catalog['products']:
        raise ValueError('Empty catalog')
    for p in catalog['products']:
        if p['id'] in ids:
            raise ValueError('Duplicate offer id')
        ids.add(p['id'])
        if p['status'] != 'proposed' or p['requires_approved_scope'] is not True:
            raise ValueError('Every product needs proposal status and approved scope')
        require_int(p['amount_cents'], 'amount_cents', 1)
        if p['billing_mode'] not in ('monthly', 'one_time'):
            raise ValueError('Unknown billing mode')
        if not p['scope'] or not p['exclusions']:
            raise ValueError('Scope and exclusions are required')
        schedule = p['payment_schedule']
        if not schedule or len({s['key'] for s in schedule}) != len(schedule):
            raise ValueError('Missing or duplicate milestones')
        for s in schedule:
            require_int(s['amount_cents'], 'milestone amount', 1)
        if sum(s['amount_cents'] for s in schedule) != p['amount_cents']:
            raise ValueError('Payment schedule must equal the offer amount exactly')
        keys = [s['key'] for s in schedule]
        if p['billing_mode'] == 'monthly' and keys != ['monthly']:
            raise ValueError('Monthly service is one prepaid period, not a deposit')
        if p['billing_mode'] == 'one_time' and keys not in (['deposit', 'balance'], ['prepayment']):
            raise ValueError('Unsupported project payment schedule')
        e = p['economics']
        for key in ('loaded_hourly_cost_cents', 'contingency_bps', 'direct_cost_cents', 'target_contribution_bps'):
            require_int(e[key], key)
        if e['target_contribution_bps'] >= 10000 or e['contingency_bps'] >= 10000:
            raise ValueError('Contribution/reserve rate out of range')
        hours = Decimal(str(e['delivery_hours']))
        if not hours.is_finite() or hours <= 0:
            raise ValueError('Delivery hours must be positive and finite')
        prices = p['stripe']['prices']
        if len(prices) != len(schedule):
            raise ValueError('Each milestone needs exactly one price alias')
        if p['stripe']['product_key'] in aliases:
            raise ValueError('Duplicate product alias')
        aliases.add(p['stripe']['product_key'])
        for s, price in zip(schedule, prices):
            require_int(price['unit_amount_cents'], 'Stripe alias amount', 1)
            if price['lookup_key'] in aliases:
                raise ValueError('Duplicate lookup key')
            aliases.add(price['lookup_key'])
            if price['purpose'] != s['key'] or price['unit_amount_cents'] != s['amount_cents']:
                raise ValueError('Price alias must exactly match its milestone')
            expected = 'month' if p['billing_mode'] == 'monthly' else None
            if price['recurring_interval'] != expected:
                raise ValueError('Recurring interval mismatch')
    return catalog


def fee_for_payment(amount, mode, model, rail='card'):
    require_int(amount, 'payment amount', 1)
    if rail == 'card':
        card = model['domestic_card']
        processing = cents(Decimal(amount) * card['rate_bps'] / 10000) + card['fixed_cents']
    elif rail == 'ach':
        ach = model['ach_debit']
        processing = min(cents(Decimal(amount) * ach['rate_bps'] / 10000), ach['cap_cents'])
    else:
        raise ValueError('Unknown payment rail')
    extra = model['monthly_billing' if mode == 'monthly' else 'one_time_invoice']['additional_rate_bps']
    return processing + cents(Decimal(amount) * extra / 10000)


def economics(product, model, labor_multiplier=None):
    e = product['economics']
    base = Decimal(str(e['delivery_hours'])) * e['loaded_hourly_cost_cents']
    multiplier = Decimal(str(labor_multiplier)) if labor_multiplier is not None else 1 + Decimal(e['contingency_bps']) / 10000
    labor = cents(base * multiplier)
    fees = sum(fee_for_payment(s['amount_cents'], product['billing_mode'], model) for s in product['payment_schedule'])
    ach_fees = sum(fee_for_payment(s['amount_cents'], product['billing_mode'], model, 'ach') for s in product['payment_schedule'])
    contribution = product['amount_cents'] - labor - e['direct_cost_cents'] - fees
    margin = Decimal(contribution) / product['amount_cents'] * 100
    # Conservative project floor: preserves full fixed transaction fees; price rounded up to $25.
    fee_bps = model['domestic_card']['rate_bps'] + model['monthly_billing' if product['billing_mode'] == 'monthly' else 'one_time_invoice']['additional_rate_bps']
    denominator = 1 - Decimal(fee_bps + e['target_contribution_bps']) / 10000
    if denominator <= 0:
        raise ValueError('Fee and target rates leave no room for labor')
    fixed = model['domestic_card']['fixed_cents'] * len(product['payment_schedule'])
    exact_floor = Decimal(labor + e['direct_cost_cents'] + fixed) / denominator
    floor = int((exact_floor / 2500).quantize(Decimal('1'), rounding=ROUND_CEILING)) * 2500
    return dict(labor_cents=labor, fee_cents=fees, ach_fee_cents=ach_fees, contribution_cents=contribution, margin=margin, floor_cents=floor)


def money(n):
    return f'${n / 100:,.2f}'


def report(catalog):
    rows = ['# Proposed package economics', '', f'Catalog: `{catalog["catalog_version"]}`. Generated by `python3 billing/calculate.py --write-report`.', '',
        'USD, internal planning assumptions. Project totals are full engagement totals; monthly rows cover one service month. Labor includes all delivery, review, QA and coordination time plus a 15% labor reserve. Contribution remains before company overhead and tax; it is not net profit. Founder labor is costed even if no cash wage is paid.', '',
        '| Offer | Total / month | Budgeted labor | Direct costs | Card + invoice/billing fees | Contribution | Margin | Target floor, rounded to $25 |',
        '| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |']
    for p in catalog['products']:
        e = economics(p, catalog['fee_models'])
        rows.append(f'| {p["name"]}{" / mo" if p["billing_mode"] == "monthly" else ""} | {money(p["amount_cents"])} | {money(e["labor_cents"])} | {money(p["economics"]["direct_cost_cents"])} | {money(e["fee_cents"])} | {money(e["contribution_cents"])} | {e["margin"]:.2f}% | {money(e["floor_cents"])} |')
    rows.extend(['', '## Stress test: labor exceeds the original estimate', '', '25% and 50% overruns are measured against original estimated hours, replacing the 15% baseline reserve. These scenarios do not add a second contingency. Direct costs and collection schedules stay fixed. Unknown integrations can exceed either case and need discovery.', '', '| Offer | Baseline with 15% reserve | Actual labor +25% | Actual labor +50% | ACH modeled saving vs card |', '| --- | ---: | ---: | ---: | ---: |'])
    for p in catalog['products']:
        e = economics(p, catalog['fee_models'])
        a = economics(p, catalog['fee_models'], '1.25')
        b = economics(p, catalog['fee_models'], '1.5')
        rows.append(f'| {p["name"]} | {e["margin"]:.2f}% | {a["margin"]:.2f}% | {b["margin"]:.2f}% | {money(e["fee_cents"] - e["ach_fee_cents"])} |')
    rows.extend(['', 'Fee assumptions: domestic US online card 2.9% + $0.30 per transaction; Invoicing Starter adds 0.4% for one-time paid invoices; Billing adds 0.7% for monthly subscriptions. The two software surcharges are alternatives in this model. ACH is 0.8%, capped at $5 per payment, plus the applicable software charge. Tax, international cards, currency conversion, refunds, disputes, optional products and account-specific pricing are excluded. Actual provider reconciliation remains authoritative. See [fee evidence](../docs/business/PRICING-EVIDENCE.md).', '', 'The floor is an internal estimate guard, not permission to discount or send an invoice. Re-estimate if scope, subcontractor cost, hours, provider fees, or tax treatment changes.'])
    return '\n'.join(rows) + '\n'


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--check', action='store_true', help='Validate catalog, baseline target margins and checked-in report')
    parser.add_argument('--write-report', action='store_true')
    args = parser.parse_args()
    catalog = validate(json.loads((ROOT / 'catalog.json').read_text()))
    output = report(catalog)
    for p in catalog['products']:
        if economics(p, catalog['fee_models'])['margin'] < Decimal(p['economics']['target_contribution_bps']) / 100:
            raise ValueError(f'{p["id"]}: baseline contribution below its target')
    if args.write_report:
        (ROOT / 'ECONOMICS.md').write_text(output)
        print('Wrote billing/ECONOMICS.md')
    elif args.check:
        if (ROOT / 'ECONOMICS.md').read_text() != output:
            raise ValueError('Economics report drift: regenerate and review')
        print(f'PASS: {len(catalog["products"])} proposals; exact payment sums, aliases, margins and report verified. No network calls.')
    else:
        print(output)


if __name__ == '__main__':
    main()
