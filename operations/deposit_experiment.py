"""One-lever planning experiment. Does not configure Stripe or approve pricing."""
import json
from partner_economics import percentage

FIXTURE = {
    'project_total_cents': 350000,
    'pre_review_labor_budget_cents': 117000,
    'pre_review_direct_cost_cents': 5000,
    'payment_and_invoice_bps': 330,
    'fixed_fee_cents': 30,
    'payments': 2,
}


def measure(opening_bps):
    if FIXTURE['payments'] != 2:
        raise ValueError('This experiment only models an opening payment and one balance')
    opening = percentage(FIXTURE['project_total_cents'], opening_bps)
    balance = FIXTURE['project_total_cents'] - opening
    fee = percentage(opening,FIXTURE['payment_and_invoice_bps']) + FIXTURE['fixed_fee_cents']
    total_fees = fee + percentage(balance,FIXTURE['payment_and_invoice_bps']) + FIXTURE['fixed_fee_cents']
    return {
        'opening_bps': opening_bps,
        'opening_cents': opening,
        'balance_cents': balance,
        'funding_gap_or_surplus_cents': opening - fee - FIXTURE['pre_review_labor_budget_cents'] - FIXTURE['pre_review_direct_cost_cents'],
        'total_payment_fees_cents': total_fees,
        'sums_to_total': opening + balance == FIXTURE['project_total_cents'],
    }


if __name__ == '__main__':
    # Exactly one proposed lever changes: opening-payment share. Repeated calls
    # demonstrate determinism, not independent samples of customer conversion.
    print(json.dumps({'status':'proposal-only', 'fixture':FIXTURE,
        'tolerance_cents':1,
        'baseline_runs':[measure(3000) for _ in range(3)],
        'candidate_runs':[measure(5000) for _ in range(3)]},indent=2))
