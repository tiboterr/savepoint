# Google Calendar Sync Setup

Mission Control ARPAGONA reste **local-first**:

- Google Calendar = source distante lue en lecture seule
- `state/calendar.json` = source canonique locale utilisée par le cockpit

## 1. Créer les credentials Google

Dans Google Cloud:

1. créer un projet
2. activer **Google Calendar API**
3. configurer l’écran de consentement OAuth
4. créer un client OAuth **Desktop App**
5. télécharger le JSON

Déposer ce fichier ici:

```bash
~/.config/mission-control/google-oauth.json
```

## 2. Lancer la première synchro

Depuis le projet:

```bash
cd /home/thibaud/.openclaw/workspace/mission-control-arpagona
pnpm calendar:sync
```

Au premier lancement:
- un navigateur s’ouvre pour l’autorisation OAuth
- un token local est ensuite sauvegardé ici:

```bash
~/.config/mission-control/google-token.json
```

## 3. Résultat attendu

Le script écrit les événements dans:

```bash
/home/thibaud/.openclaw/workspace/state/calendar.json
```

## Variables utiles

Optionnelles:

```bash
GOOGLE_CALENDAR_ID=primary
GOOGLE_CALENDAR_MAX_RESULTS=100
GOOGLE_CALENDAR_TIME_MIN=2026-05-01T00:00:00+02:00
GOOGLE_CALENDAR_TIME_MAX=2026-06-01T00:00:00+02:00
```

Par défaut:
- calendriers = **tous les calendriers visibles/sélectionnés** dans Google Calendar
- fenêtre = maintenant → +30 jours

Si tu veux forcer un calendrier unique :
- `GOOGLE_CALENDAR_ID=<calendar-id>`

## Cron ensuite

Quand la première synchro marche, on pourra ajouter un cron local du style:

```bash
cd /home/thibaud/.openclaw/workspace/mission-control-arpagona && pnpm calendar:sync
```

## Sécurité

- ne pas committer les credentials
- ne pas mettre les tokens dans le workspace
- garder `google-oauth.json` et `google-token.json` hors repo
