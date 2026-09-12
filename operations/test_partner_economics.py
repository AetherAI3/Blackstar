import unittest
from partner_economics import evaluate, minimum_quote, percentage
from deposit_experiment import measure, FIXTURE


class EconomicsTests(unittest.TestCase):
    def setUp(self):
        self.case = dict(id='fixture', net_service_revenue_cents=400000,
            partner_fee_cents=200000, founder_labor_cents=48000, direct_cost_cents=10000,
            payment_fees_cents=13260, referral_bps=500, referral_cap_cents=50000,
            risk_reserve_bps=500, target_retained_bps=2000)

    def test_all_dollars_reconcile_and_founder_labor_is_cost(self):
        result = evaluate(self.case)
        self.assertEqual(result['retained_before_overhead_and_tax_cents'], 88740)
        self.assertEqual(sum(result[k] for k in ('partner_fee_cents','founder_labor_cents',
            'direct_cost_cents','payment_fees_cents','referral_cents','risk_reserve_cents',
            'retained_before_overhead_and_tax_cents')),400000)

    def test_a_popular_split_can_fail_the_cost_floor(self):
        self.case['partner_fee_cents'] = 240000
        self.assertFalse(evaluate(self.case)['meets_proposed_floor'])

    def test_referral_cap_and_partial_refund_do_not_erase_costs(self):
        self.case['net_service_revenue_cents'] = 2000000
        self.assertEqual(evaluate(self.case)['referral_cents'],50000)
        self.case['net_service_revenue_cents'] = 320000
        r = evaluate(self.case)
        self.assertEqual(r['retained_before_overhead_and_tax_cents'],16740)
        self.assertEqual(r['partner_fee_cents'],200000)
        self.case['referral_already_paid_cents'] = 20000
        self.assertEqual(evaluate(self.case)['retained_before_overhead_and_tax_cents'],12740)

    def test_invalid_money_or_impossible_percentages_fail(self):
        for value in (-1, True, 5.5):
            self.case['net_service_revenue_cents'] = value
            with self.assertRaises(ValueError): evaluate(self.case)
        with self.assertRaises(ValueError): minimum_quote(10000,30,330,500,500,9000)

    def test_minimum_price_and_cent_rounding(self):
        self.assertEqual(minimum_quote(258000,60,330,500,500,2000),386897)
        self.assertEqual(percentage(101,5000),51)

    def test_deposit_experiment_rejects_misleading_transaction_count(self):
        before = FIXTURE['payments']
        try:
            FIXTURE['payments'] = 3
            with self.assertRaises(ValueError): measure(5000)
        finally:
            FIXTURE['payments'] = before

    def test_deposit_funding_delta_and_total_are_preserved(self):
        a, b = measure(3000), measure(5000)
        self.assertEqual(a['funding_gap_or_surplus_cents'],-20495)
        self.assertEqual(b['funding_gap_or_surplus_cents'],47195)
        self.assertEqual(b['funding_gap_or_surplus_cents']-a['funding_gap_or_surplus_cents'],67690)
        self.assertEqual(a['total_payment_fees_cents'], b['total_payment_fees_cents'])


if __name__ == '__main__': unittest.main()
