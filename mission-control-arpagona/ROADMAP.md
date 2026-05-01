# Mission Control ARPAGONA Roadmap

## Current state

Implemented and validated:

- real-data local cockpit
- pages: `/`, `/memory`, `/docs`, `/projects`, `/tasks`
- task split between `live` and `archive`
- lint/build passing

## Next useful expansions

### 1. Calendar

Current finding:

- no obvious native calendar source found yet in the workspace
- only detected event-like file: `memory/.dreams/events.jsonl` (likely not the business calendar source we want)

Recommended approach:

- define a canonical local source for calendar events
- possible formats: `state/calendar.json`, `state/calendar/*.json`, or imported `.ics`
- then render:
  - next 24h
  - next 7 days
  - overdue / missed items

### 2. Team

Possible first local model:

- `state/team.json`
- members, roles, active projects, current status

### 3. Visual Office

Possible first local model:

- `state/visual-office.json`
- rooms, screens, active systems, ambient signals

### 4. Tasks V3

Improve execution relevance with:

- source weighting
- priority tags
- project tags
- stale task detection
- explicit extraction from ARPAGONA live docs only
