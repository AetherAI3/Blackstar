"""Offline proposal economics. No accounting, payment or payroll side effects."""
from decimal import Decimal, ROUND_HALF_UP, ROUND_CEILING
import json
from pathlib import Path


def cents(value):
    if type(value) is not int or value < 0:
        raise ValueError('Money must be nonnegative integer cents')
    return value


def percentage(amount, basis_points):
    cents(amount)
    if type(basis_points) is not int or not 0 <= basis_points <= 10000:
        raise ValueError('Rate must be integer basis points from 0 to 10000')
    return int((Decimal(amount) * basis_points / 10000).quantize(Decimal('1'), rounding=ROUND_HALF_UP))


def evaluate(case):
    """Net service revenue excludes tax, reimbursed pass-through spend and refunds.

    Fees are actual/estimated cents supplied by the user, including fees on excluded
    amounts where applicable. Labor is valued whether or not founders take cash.
    Retained contribution is before fixed overhead and income tax, not net profit.
    """
    revenue = cents(case['net_service_revenue_cents'])
    if not revenue:
        raise ValueError('Positive service revenue is required')
    partner = cents(case['partner_fee_cents'])
    founder = cents(case['founder_labor_cents'])
    direct = cents(case['direct_cost_cents'])
    fees = cents(case['payment_fees_cents'])
    calculated_referral = min(percentage(revenue, case['referral_bps']), cents(case['referral_cap_cents']))
    # A refund does not automatically claw back a commission already paid.
    referral = max(calculated_referral, cents(case.get('referral_already_paid_cents', 0)))
    reserve = percentage(revenue, case['risk_reserve_bps'])
    target = percentage(revenue, case['target_retained_bps'])
    contribution = revenue - partner - founder - direct - fees - referral
    retained = contribution - reserve
    return {
        'id': case['id'], 'net_service_revenue_cents': revenue,
        'partner_fee_cents': partner, 'founder_labor_cents': founder,
        'direct_cost_cents': direct, 'payment_fees_cents': fees,
        'referral_cents': referral, 'risk_reserve_cents': reserve,
        'economic_contribution_cents': contribution,
        'retained_before_overhead_and_tax_cents': retained,
        'retained_percent': str((Decimal(retained) * 100 / revenue).quantize(Decimal('.001'))),
        'meets_proposed_floor': retained >= target,
    }


def minimum_quote(cost_cents, fixed_fee_cents, variable_fee_bps, referral_bps, reserve_bps, retained_bps):
    """Conservative continuous formula; referral cap ignored. Not a tax engine.

    cost includes delivery labor, founder QA/PM and direct expense. Round up, then
    check provider-specific per-transaction rounding in the final quote.
    """
    for rate in (variable_fee_bps, referral_bps, reserve_bps, retained_bps):
        percentage(10000, rate)
    denominator = 10000 - variable_fee_bps - referral_bps - reserve_bps - retained_bps
    if denominator <= 0:
        raise ValueError('Costs and target shares leave no delivery budget')
    return int((Decimal(cents(cost_cents) + cents(fixed_fee_cents)) * 10000 / denominator).to_integral_value(rounding=ROUND_CEILING))


if __name__ == '__main__':
    cases = json.loads(Path(__file__).with_name('partner-scenarios.json').read_text())
    print(json.dumps([evaluate(case) for case in cases], indent=2))
