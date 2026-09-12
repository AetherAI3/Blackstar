# Independent audit of the proposed opening-payment experiment

**September 12, 2026 · Offline planning review · No financial configuration changed.**

**Final verdict after round 2: pass for the bounded planning comparison; RA-01 and RA-02 are resolved and independently reproduced.** The original review below is retained as history. The correction and fresh evidence appear in the appended round-2 section.

## Round 1 — original review

**Verdict at the reviewed revision: arithmetic and one-lever comparison pass; two evidence-maintenance findings remain open.** This is a review of a deterministic planning model, not approval of a live price, a claimed improvement in sales, or a complete LOOP-18 protocol pass. The reviewer edited only this audit artifact and did not modify the experiment or catalog.

## Reproduction

From the repository root, the reviewer independently ran exactly:

```sh
python3 operations/deposit_experiment.py
```

Environment: Python **3.12.14**. The baseline and candidate are computed three times each by the same `measure()` implementation during one invocation. All six resulting records matched the saved [deposit experiment](deposit-experiment.json). A separate integer-arithmetic check recomputed each opening amount, balance, individual collection fee, funding result and total invariant without importing the experiment's percentage helper. It reproduced all six records.

| Check | Independently reproduced result | Assessment |
| --- | --- | --- |
| Baseline opening/balance | $1,050.00 / $2,450.00 | Sum is $3,500.00 |
| Candidate opening/balance | $1,750.00 / $1,750.00 | Sum is $3,500.00 |
| Baseline opening collection fee | $34.95 | 3.3% × $1,050 + $0.30 |
| Candidate opening collection fee | $58.05 | 3.3% × $1,750 + $0.30 |
| Baseline modeled early funding | −$254.95 | Opening less opening fee, $1,170 labor and $100 direct budget |
| Candidate modeled early funding | +$421.95 | Same formula and same budgets |
| Improvement | **$676.90** | $700 extra opening payment less $23.10 extra early fee |
| Full two-payment fee total | $116.10 in both cases | Timing changes; modeled total does not |
| Declared tolerance | $0.01 | Difference exceeds the threshold by $676.89 |

The only changed input between cases is opening share, 3,000 → 5,000 basis points. Balance is a derived result of that change, not a second independent lever. Both cases use the same project total, cost budgets, fee formula, precision and execution environment. Three identical repetitions demonstrate determinism; they are not three independent observations of customer behavior.

## Findings

| ID | Severity for this planning artifact | Finding and consequence | Required resolution |
| --- | --- | --- | --- |
| RA-01 | Medium | The fixture's **$100 pre-review direct cost** exceeds the [website catalog](../../../billing/catalog.json) **$50 direct-cost budget for the entire project**. The experiment describes an assumed budget, but does not explicitly reconcile this difference with the related package. Its absolute surplus should not be mistaken for the catalog cash-flow forecast. The $676.90 comparative delta is unaffected. | Either label the extra $50 as an intentional stress allowance independent of the catalog, or align the fixture with the package and regenerate the saved baseline, candidate and explanatory table. Preserve both cases under the same revised fixture. |
| RA-02 | Low | `FIXTURE['payments']` is displayed as an input but never used by `measure()`, which unconditionally charges exactly two payments. The current value of two is correct, but a later fixture edit could claim a different payment count while retaining the two-payment arithmetic. | Assert the supported value is two, remove the unused input, or actually derive the supported payment schedule from it. A narrow two-payment experiment does not need a general scheduling engine. |

These are actual source/document findings, not hypothetical attacks on a deployed billing system. They were reported to the builder. A later response or correction should be appended to this record rather than silently relabeling the reviewed revision as clean.

## Tolerance and interpretation

The one-cent tolerance is a declared minor-unit threshold, not a measured confidence interval. It is adequate for this deterministic fixed-input comparison, whose outputs reproduce exactly. No claim about uncertainty in labor estimates, customer conversion or payment-provider behavior follows from it. The source correctly describes the exercise as a bounded adaptation and makes no irreversible-weld claim.

The 50% candidate only covers the chosen **pre-review** budget in this scenario. The package's full budgeted labor is $2,093 before $50 direct costs; $1,750 less its opening collection fee leaves $1,691.95. If all those costs become due before the final payment, the opening collection alone is **$451.05 short** of that full $2,143 cost budget. This is an interpretation limit, not a contradiction in a model that explicitly targets pre-review funding. It means the result cannot establish that a 50% opening payment funds every delivery stage. Cost timing and any middle milestone still require review in the actual quote.

The 3.3% + $0.30 model agrees with the catalog's domestic card plus one-time invoice assumptions. It does not cover tax, international cards, currency conversion, refund/dispute costs or account-specific pricing. Those exclusions and the absence of live customer evidence are material and already acknowledged in the surrounding documents.

## Evidence identity

SHA-256 values record the files reviewed; subsequent builder changes require a fresh reproduction before this audit is cited for those changes.

| File | SHA-256 |
| --- | --- |
| `operations/deposit_experiment.py` | `2f3403193cfec4160a73cbe3264efd2782cd1a0ce4e514f8f6b20df663e9852c` |
| `operations/partner_economics.py` | `975a4b28dd916db3b174e95f57705cced4202528f43ba954bd17e38b387080dc` |
| `docs/reviews/2026-09-12-backend-business/deposit-experiment.json` | `70e91c1d0d92dba5de9ffbc05dd77f5c4b4465fe2a965bc130216f0f4fcf981e` |
| `billing/catalog.json` | `949862b191e228be0769189b819326629ad985ffdbdefcdeaafa21fc9e33ea49` |

No sales conversion, profitability, production reliability or Stripe-account outcome was measured. The defensible finding is narrower: increasing the opening share from 30% to 50% improves this fixed-budget early-funding model by $676.90 while preserving the total and modeled collection fees.

## Round 2 — builder correction and independent remeasurement

The builder aligned the pre-review direct-cost budget with the catalog's **$50** and added an explicit rejection when the printed `payments` count differs from the supported two-payment schedule. The experiment documentation now records these corrections and identifies the changed cost input as a **fresh baseline**, not another tuning gain. The old $100-fixture absolute figures above are historical only.

The reviewer reran the exact command `python3 operations/deposit_experiment.py` under Python 3.12.14. All six records again matched the regenerated JSON; the independent integer-arithmetic recomputation passed on all six. The reviewer also compared the fixture directly with the website catalog and reproduced the unsupported-payment rejection using an in-memory value of three. The function raised `ValueError: This experiment only models an opening payment and one balance`; the original in-memory value was restored. No source edit or financial action occurred.

| Measurement | Rebased 30% | Rebased 50% | Assessment |
| --- | ---: | ---: | --- |
| Direct budget before review | $50.00 | $50.00 | Matches total catalog direct budget; assumed entirely incurred before review |
| Opening payment | $1,050.00 | $1,750.00 | Unchanged from round 1 |
| Opening less fee and pre-review budget | −$204.95 | +$471.95 | Both rise by $50 because of the shared baseline correction |
| Delta between shares | — | **+$676.90** | Unchanged; still exceeds the one-cent threshold |
| Full modeled collection fees | $116.10 | $116.10 | Unchanged |

**RA-01 resolved:** the catalog and scenario now share the direct-cost budget, and the scenario explicitly identifies its timing assumption. **RA-02 resolved:** the printed payment count can no longer silently disagree with the hardcoded two-payment model. A retained regression checks that rejection; another checks both rebased funding figures, the $676.90 delta and fee equality. These corrections address the identified inconsistency classes rather than merely revising prose around the original output.

The rebased experiment still changes exactly one lever between its baseline and candidate: opening share. The cross-round cost correction affects both sides and is not compared against the old baseline to claim an improvement. The limitation concerning full pre-final-payment cost coverage remains: a positive pre-review surplus is not evidence that the whole project is self-funding.

| Updated evidence | SHA-256 after correction |
| --- | --- |
| `operations/deposit_experiment.py` | `acb6738aca7eddaf7e0d34906b98de54947b6b53b1f46ca5b4f38c6fd4f78aa9` |
| `docs/reviews/2026-09-12-backend-business/deposit-experiment.json` | `84a9ac417ef6a93c36e6264b105de5ea565e447a66e5e3a823f4c484dedb99b6` |

The helper and catalog hashes remained unchanged from round 1. **No open finding remains in this bounded audit.** Passing supports the declared modeled early-funding comparison only. It does not approve live billing, establish optimal deposit terms, measure buyer acceptance, or certify a complete LOOP-18 run or irreversible weld.
