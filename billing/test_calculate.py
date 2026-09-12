"""Executable billing invariants and independent hand-calculated fixtures."""
import copy
import json
import unittest
from pathlib import Path
from calculate import economics, fee_for_payment, validate

BASE = json.loads((Path(__file__).parent / 'catalog.json').read_text())


class BillingMathTests(unittest.TestCase):
    def mutated(self, change):
        data = copy.deepcopy(BASE)
        change(data)
        with self.assertRaises(ValueError):
            validate(data)

    def test_exact_website_invoice_fixture(self):
        # 2 x $1750; each costs $51.05 processing + $7 invoicing.
        web = next(p for p in BASE['products'] if p['id'] == 'website_launch')
        result = economics(web, BASE['fee_models'])
        self.assertEqual(result['fee_cents'], 11610)
        self.assertEqual(result['labor_cents'], 209300)
        self.assertEqual(result['contribution_cents'], 124090)

    def test_monthly_fee_does_not_stack_invoicing(self):
        # $1500 x (2.9% + 0.7%) + $0.30 = $54.30, not $60.30.
        self.assertEqual(fee_for_payment(150000, 'monthly', BASE['fee_models']), 5430)

    def test_ach_cap_is_per_payment(self):
        # $1750 invoice: $5 ACH cap + $7 invoice software = $12.
        self.assertEqual(fee_for_payment(175000, 'one_time', BASE['fee_models'], 'ach'), 1200)
        self.assertEqual(fee_for_payment(10000, 'one_time', BASE['fee_models'], 'ach'), 120)

    def test_cent_rounding(self):
        self.assertEqual(fee_for_payment(10001, 'one_time', BASE['fee_models']), 360)

    def test_rejects_milestone_drift(self):
        self.mutated(lambda d: d['products'][0]['payment_schedule'][0].update(amount_cents=175001))

    def test_rejects_browser_style_fractional_price(self):
        self.mutated(lambda d: d['products'][0].update(amount_cents=3500.00))

    def test_rejects_boolean_cents(self):
        self.mutated(lambda d: d['products'][0].update(amount_cents=True))

    def test_rejects_recurring_deposit(self):
        self.mutated(lambda d: d['products'][3]['payment_schedule'][0].update(key='deposit'))

    def test_rejects_live_catalog(self):
        self.mutated(lambda d: d.update(public_checkout_enabled=True))

    def test_rejects_price_alias_drift(self):
        self.mutated(lambda d: d['products'][0]['stripe']['prices'][0].update(unit_amount_cents=1))

    def test_rejects_duplicate_ids(self):
        self.mutated(lambda d: d['products'][1].update(id=d['products'][0]['id']))

    def test_unknown_payment_rail(self):
        with self.assertRaises(ValueError):
            fee_for_payment(10000, 'one_time', BASE['fee_models'], 'crypto')


if __name__ == '__main__':
    unittest.main()
