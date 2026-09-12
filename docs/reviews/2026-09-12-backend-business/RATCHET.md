# One-lever experiment and retained verification gates

**Scope: proposed billing math, not a live price experiment.** The supplied [LOOP-18 reference](../../references/loops/LOOP-18-the-ratchet.md) calls for one changed lever, identical measurement and explicit uncertainty. This is a bounded adaptation: no complete PROTOCOL/runtime was supplied, no live financial configuration is changed, and no irreversible weld or market-performance claim is made.

## Measured opening-payment hypothesis

Metric: funding gap/surplus against a defined pre-review labor/direct-cost budget; higher is better. Lever: proposed opening-payment share, **30% → 50%**. All other inputs are fixed: $3,500 total, $1,170 labor budget (18 × $65), $50 direct cost, two payments, 3.3% + $0.30 per payment. This is an assumed delivery budget, not an observed bank cash balance or the full package labor budget. The fixture assumes all of the catalog's $50 direct-cost budget is incurred before review.

Command: `python3 operations/deposit_experiment.py`. The harness evaluates baseline and candidate three times each in the same invocation/environment. It is deterministic integer-cent arithmetic; repeated outputs demonstrate reproducibility, not statistical evidence of customer behavior. Caller-supplied tolerance is one cent, justified by the model's minor-unit rounding. All outputs, including the baseline, are preserved in [deposit-experiment.json](deposit-experiment.json).

| Measurement | 30% baseline | 50% candidate |
| --- | ---: | ---: |
| Opening payment | $1,050.00 | $1,750.00 |
| Remaining project balance | $2,450.00 | $1,750.00 |
| Opening payment less fees and pre-review budget | −$204.95 | +$471.95 |
| Total fees over two collections | $116.10 | $116.10 |
| Opening + balance equals $3,500 | Yes | Yes |

The candidate improves modeled early funding by **$676.90**, with the same project total and modeled collection cost. Retain 50% as a **proposal default** subject to the signed scope, business approval and actual cost timing. The price comparison also found an actual seller using 50%/50%, but that does not prove Black Star buyers will accept it.

Independent review found the original fixture had $100 direct cost while the catalog budgeted $50, and its printed payment-count field was not enforced. The builder aligned both baseline and candidate to the catalog's $50 budget, reran the entire identical harness, and added a failure for any payment count other than two. Both absolute funding results improve by $50; the one-lever delta remains $676.90. This correction is a re-baseline, not evidence of an extra tuning gain.

Unknowns: conversion effect, cancellation behavior, delivery effort, actual payment-method fees, founder cash compensation and the timing of collaborator commitments. If early commitments exceed the opening payment, re-scope the payment schedule before booking. A deposit is not all profit or automatically nonrefundable. No production rate, cost limit or security threshold was tuned.

## Ratchet the evidence, not the story

`python3 scripts/verify-business.py` reruns catalog arithmetic, generated economics consistency, collaborator stress cases, backend regressions, the exact deposit snapshot and document/site checks. Changing a proposed price or input requires regenerating and reviewing the evidence; an old passing report cannot bless a new catalog.

Independent reviewer findings and builder resolutions are preserved in the review artifacts. New regressions keep their tests. Missing production tests remain release gates rather than being relabeled passing. Provider configuration, SQL execution, a real sandbox payment sequence and live delivery remain separate work.

Future business experiment: after enough comparable proposals, change one public package lever at a time with a predeclared cohort, metric and stop rule. Record qualified lead mix, win/loss reasons and contribution. Never treat the subjective idea-arena score or higher modeled margin as proof of better real-world conversion.
