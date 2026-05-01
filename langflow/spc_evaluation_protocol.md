# SPC Evaluation Protocol — Synthetic Cortical Column (Stable)

## Purpose
Evaluate whether `Synthetic Cortical Column - Stable` behaves like a useful executive-control architecture rather than a cosmetically structured prompt chain.

## Target workflow
- Flow name: `Synthetic Cortical Column - Stable`
- Flow id: `778a6970-6205-407c-a8f1-2000bd85a58c`

## Research questions
1. Does the workflow preserve the goal under distracting context?
2. Does it satisfy constraints better than a simple single-pass LLM baseline?
3. Does it reject seductive but weak policies?
4. Does it manage uncertainty honestly rather than hallucinating closure?
5. Does it produce a more actionable first step than a baseline answer?

## Experimental philosophy
This is not a publication-grade benchmark, but it should be:
- reproducible
- scored explicitly
- comparable to a baseline
- capable of falsifying our optimism

## Conditions
### Condition A — Baseline
Single LLM answer to the same test case.
Prompt style: simple direct response, no explicit cortical architecture.

### Condition B — SPC Stable
Run the same case through `Synthetic Cortical Column - Stable`.

## Controlled variables
Keep fixed across both conditions whenever possible:
- same underlying model family
- same temperature
- same max token budget range
- same language
- same test input

## Recommended run count
- Minimum: 1 run per case per condition for quick screening
- Better: 3 runs per case per condition
- Stronger: 5 runs per case per condition

Use the same test order for both conditions.

## Core metrics (0–10)
### 1. Goal adherence
Did the response stay aligned to the stated objective?

### 2. Constraint satisfaction
Did the response respect explicit constraints (time, budget, feasibility, etc.)?

### 3. Inhibition quality
Did it reject tempting but poor strategies when relevant?

### 4. Uncertainty calibration
Did it correctly identify ambiguity / missing information instead of inventing certainty?

### 5. Policy quality
Was the selected policy coherent, realistic, and internally consistent?

### 6. Policy diversity (SPC only primary metric, optional baseline = N/A or 0)
Were the candidate policies meaningfully different rather than paraphrases?

### 7. First-action usefulness
Is the proposed first action specific, executable, and well chosen?

### 8. Failure-mode awareness
Did it identify plausible failure modes or fragilities?

### 9. Overall executive quality
Human overall assessment of executive-control usefulness.

## Optional metrics
- verbosity penalty
- hallucination count
- reversibility awareness
- long-term vs short-term balance

## Scoring rubric
### 0–2
Very poor / absent / misleading.

### 3–4
Weak, shallow, or partially wrong.

### 5–6
Adequate but unremarkable.

### 7–8
Strong and useful.

### 9–10
Excellent, precise, robust, and hard to improve materially.

## Test set
Use the companion file `spc_test_cases.json`.

## Execution steps
1. Pick one test case.
2. Run Baseline condition.
3. Run SPC Stable condition.
4. Score both independently using the rubric.
5. Write qualitative notes.
6. Repeat for all cases.
7. Aggregate scores by metric and condition.

## Analysis questions
After the runs, answer:
- Does SPC outperform baseline on constraint satisfaction?
- Does SPC outperform baseline on inhibition and failure awareness?
- Does SPC become too verbose or bureaucratic?
- Is the gain worth the extra complexity?
- Which failure mode shows up most often?

## Decision thresholds
### Promising
SPC mean score exceeds baseline by >= 1.0 on:
- constraint satisfaction
- inhibition quality
- failure-mode awareness
without losing > 1.0 on first-action usefulness.

### Mixed
SPC is better on structure but not clearly better on decisions.

### Not yet worth it
SPC adds complexity without meaningful score improvement.

## Recommended first pass
Start with 5 cases only:
- TC01 Goal shielding
- TC02 Seductive bad option
- TC03 Ambiguous constraints
- TC04 Replanning shock
- TC05 Working-memory overload

## Reporting template
For each case, store:
- case_id
- condition
- raw_output
- scores by metric
- strengths
- weaknesses
- notable failure modes

## Integrity note
Do not move goalposts after seeing outputs.
Score from the rubric, not from affection for the architecture.
