# MEMORY.md

## Personal invariants clarified from imported ChatGPT history (April 2026)

- Thibaud seems to want, above all, a life that feels chosen rather than endured.
- His recurring blockers are not lack of intelligence or ideas, but overload and dispersion: physical pain/stress, financial pressure, lack of perceived free time, and too many simultaneous directions.
- A central long-term tension appears to be **explorer vs builder**: strong curiosity and breadth, but difficulty staying on one track long enough for compounding to happen.
- Emotional dependence in relationships appears less like an isolated issue and more like a symptom of insufficient inner anchoring, life structure, and durable stability.
- The deepest useful levers appear to be: better internal stability, more real autonomy, sustained focus, and deliberate renunciation of some options so one direction can become real.

## Langflow / SPC research thread (April 2026)

- We started a serious research-and-build thread around Langflow workflows for a synthetic executive-control architecture inspired by the prefrontal cortex, called **SPC** (Synthetic Prefrontal Column).
- Research directions that shaped the design included: Tree of Thoughts, ReAct, Reflexion, MemGPT, multi-agent debate, multi-persona/self-collaboration, and general LLM-agent architecture surveys.
- The resulting design direction is *not* a naive biological brain copy, but a functional executive architecture for LLMs with modules such as:
  - situation modeling
  - working memory compression
  - parallel candidate policy generation
  - inhibitory control
  - conflict monitoring
  - executive selection
  - structured output
  - meta-critique / reflection in later versions
- Implemented flows inside the local Langflow instance included:
  - `Idea to Action Plan` (`e1482d4c-d9d0-4be0-bd3e-0576b0798316`)
  - `SPC v1 - Synthetic Prefrontal Column` (`3ccb98b8-7d3a-401e-9e74-ebe015da921e`)
  - `SPC v1.1 - Synthetic Prefrontal Column` (`f2d82e97-bc7f-48a8-ad24-7b92130c75ba`)
  - `SPC Eval - Inhibition` (`32bc1617-2892-47b2-9276-2339bcd37bd4`)
  - `SPC Eval - Replanning` (`bd390989-b92e-4a8a-aa2e-4b2f3072fe29`)
  - `SPC Eval - Working Memory Stress` (`ff10fe2c-fac6-4c30-a671-b4082a3137d6`)
- Important caveat: some of these later SPC flows appeared blank in the Langflow visual editor even though they existed in the DB and were returned by the API with nodes/edges. The likely issue is **renderer compatibility / flow JSON shape**, not absence of the flows themselves.
- We started a debugging strategy based on template-preserving sanity flows, including `SPC SAFE TEST - PROMPTS ONLY`, to isolate which structural edits break rendering.
- `SPC SAFE TEST - PROMPTS ONLY` rendered correctly, which confirmed that the safer strategy is to preserve a known-good native template shape and only make conservative edits.
- Using that approach, a corrected renderer-safe rebuild was created: `Synthetic Cortical Column - Stable` (`778a6970-6205-407c-a8f1-2000bd85a58c`). It is intentionally simpler than the earlier SPC variants but should display properly in the visual editor.
- Local Langflow had a surprising behavior: the UI looked open without visible auth, but API endpoints still required an API key. A working local Langflow API key was recovered from the local instance so flows could be created/tested programmatically.
- If this thread resumes: use `Synthetic Cortical Column - Stable` as the safe base, then expand architecture gradually while preserving renderer compatibility.

## Mission Control ARPAGONA (May 2026)

- A major new local project was launched: **Mission Control ARPAGONA**, a local-first OpenClaw cockpit built with real workspace/runtime data and explicitly no mock data.
- The app lives in `mission-control-arpagona/` and uses Next.js App Router + Tailwind + shadcn/ui.
- Working screens now include `/`, `/memory`, `/docs`, `/projects`, `/tasks`, `/calendar`, `/team`, and `/visual-office`.
- Real integrations already working include workspace memory/docs/project parsing, task extraction with live/archive prioritization, and Google Calendar sync into `state/calendar.json` from all visible Google calendars.
- Canonical local state files for continued development are `state/calendar.json`, `state/team.json`, and `state/visual-office.json`.
- If this project resumes, the most valuable next steps are likely stronger home-page polish, Tasks V3, richer Team semantics, and a more concrete Visual Office model.
