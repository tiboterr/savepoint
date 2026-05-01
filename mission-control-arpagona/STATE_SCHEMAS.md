# Mission Control ARPAGONA — State Schemas

## `state/calendar.json`

```json
{
  "meta": {
    "name": "Mission Control Calendar",
    "timezone": "Europe/Paris",
    "description": "Canonical local calendar source for Mission Control ARPAGONA. Real events only."
  },
  "events": [
    {
      "id": "event-001",
      "title": "Prospect call",
      "start": "2026-05-02T14:00:00+02:00",
      "end": "2026-05-02T14:30:00+02:00",
      "status": "scheduled",
      "location": "Google Meet",
      "notes": "Discuss ARPAGONA diagnostic express",
      "source": "manual"
    }
  ]
}
```

Required per event:
- `id`
- `title`
- `start`

Recommended:
- `end`
- `status`
- `location`
- `notes`
- `source`

## `state/team.json`

```json
{
  "meta": {
    "name": "Mission Control Team",
    "description": "Canonical local team source for Mission Control ARPAGONA."
  },
  "members": [
    {
      "id": "thibaud",
      "name": "Thibaud",
      "role": "Founder",
      "status": "active",
      "focus": "Build ARPAGONA into a real profitable business"
    }
  ]
}
```

Required per member:
- `id`
- `name`

Recommended:
- `role`
- `status`
- `focus`

## `state/visual-office.json`

```json
{
  "meta": {
    "name": "Mission Control Visual Office",
    "description": "Canonical local visual office source for Mission Control ARPAGONA."
  },
  "spaces": [
    {
      "id": "main-desk",
      "name": "Main Desk",
      "status": "online",
      "purpose": "Primary operator station"
    }
  ]
}
```

Required per space:
- `id`
- `name`

Recommended:
- `status`
- `purpose`
