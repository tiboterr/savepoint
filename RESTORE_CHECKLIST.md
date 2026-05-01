# Restore checklist

Ce repo GitHub sauvegarde le coeur du workspace OpenClaw, mais pas tous les secrets ni tous les artefacts lourds.

## Sauvegardé dans ce repo

- identité et contexte agent (`AGENTS.md`, `SOUL.md`, `IDENTITY.md`, `USER.md`, `TOOLS.md`)
- mémoire utile (`MEMORY.md`, `memory/`)
- documents et plans du workspace
- projet `mission-control-arpagona/` (code source, scripts, docs)
- états utiles de Mission Control (`state/*.json`)
- scripts utilitaires (`tools/`)
- fichiers Langflow présents dans `langflow/`

## Non sauvegardé volontairement

- `.openclaw/` (runtime local, tokens, logs, DB runtime, queue, config secrète)
- `imports/` (archives importées et corpus bruts)
- `HISTO GPT/` (export brut)
- `node_modules/`, `.next/`, caches, logs
- `client_secret_*.json`, `.env*`, clés privées, certificats
- gros fichiers SQLite locaux

## Eléments importants à reconstruire manuellement

### OpenClaw

- réinstaller OpenClaw si nécessaire
- reconnecter les providers et secrets (OpenAI, Discord, ElevenLabs, etc.)
- reconfigurer les accès/authentifications locaux
- vérifier que la tâche cron `daily-github-backup` existe encore si on repart d'une nouvelle instance

### Mission Control

- réinstaller les dépendances dans `mission-control-arpagona/`
- remettre le fichier Google OAuth local si la synchro calendrier est nécessaire
- relancer : `pnpm dev`

### GitHub backup

- remettre une clé SSH valide pour GitHub sur la machine
- vérifier que le remote du repo pointe toujours sur `git@github.com:tiboterr/savepoint.git`
- tester `./tools/github-backup.sh`

## Commandes de reprise utiles

```bash
# cloner la sauvegarde
git clone git@github.com:tiboterr/savepoint.git

# lancer Mission Control
cd mission-control-arpagona
pnpm install
pnpm dev

# tester la sauvegarde GitHub
cd ..
./tools/github-backup.sh
```

## Notes

Le but de cette sauvegarde est d'assurer la continuité du travail, de la mémoire, du code et de la structure.
Les secrets sont exclus pour éviter de les exposer sur GitHub, même en privé.
