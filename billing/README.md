# Black Star billing foundation

**Proposed and offline. No Stripe products, payment links, invoices, subscriptions or charges have been created.** This folder is the single price source for the proposed backend and internal package cards. The public website does not advertise these prices.

| File | Purpose |
| --- | --- |
| [catalog.json](catalog.json) | Versioned offer IDs, integer USD cents, exact opening/balance schedule, recurring rules, scope, costs and Stripe lookup aliases |
| [ECONOMICS.md](ECONOMICS.md) | Generated baseline contribution, price floors and labor-overrun scenarios |
| [STRIPE-SETUP.md](STRIPE-SETUP.md) | Products/prices mapping and safe quote-to-payment implementation sequence |
| [calculate.py](calculate.py) | Dependency-free catalog validator and offline fee/contribution calculator |
| [test_calculate.py](test_calculate.py) | Independent monetary fixtures and malformed-catalog rejection tests |
| [Packages](../docs/business/PRICING-AND-PACKAGES.md) | Human-readable offer and boundary decisions |
| [Evidence](../docs/business/PRICING-EVIDENCE.md) | Named competitor comparisons and current provider fee sources |

From the repository root:

```sh
python3 billing/calculate.py --check
python3 -m unittest discover -s billing -p 'test_*.py'
```

After an intentional proposal revision, regenerate `ECONOMICS.md` with `python3 billing/calculate.py --write-report`, review scope and arithmetic, and commit both files together. Editing the catalog never changes an accepted quote or authorizes money movement. Test fixture amounts are synthetic.

Schema v1 uses `catalog_version` and global `currency: "usd"`. Every product has an immutable `id`, `billing_mode`, `amount_cents`, `payment_schedule`, `economics`, and `stripe` aliases. A one-time product's schedule sums exactly to its engagement total. A monthly product's schedule covers one month; it does not sum all future renewals. The backend must select payable quote milestones, not let a browser supply arbitrary amounts or treat this proposed catalog as a live payment authority.
