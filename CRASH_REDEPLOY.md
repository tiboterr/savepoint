# Crash redeploy - mode d'emploi

But : repartir vite après casse machine, corruption, ou perte partielle d'OpenClaw.

## 0. Ce qu'il faut avoir

- le repo GitHub : `git@github.com:tiboterr/savepoint.git`
- le coffre chiffré : `.secrets-backup/openclaw-secrets.tar.gpg` (copie externe)
- le mot de passe du coffre

## 1. Recloner le workspace

```bash
git clone git@github.com:tiboterr/savepoint.git ~/.openclaw/workspace
cd ~/.openclaw/workspace
```

## 2. Réinstaller l'environnement minimal

À minima :
- OpenClaw
- Node.js / pnpm
- git
- gpg

## 3. Restaurer les secrets

Remettre d'abord le coffre chiffré dans le workspace, puis :

```bash
cd ~/.openclaw/workspace
./tools/restore-secrets.sh
```

Cela remet notamment :
- `~/.openclaw/openclaw.json`
- `~/.openclaw/credentials/`
- le secret Google Calendar de Mission Control

## 4. Vérifier OpenClaw

- relancer OpenClaw si nécessaire
- vérifier que les providers sont bien reconnectés
- vérifier que les agents/workspaces attendus existent encore
- tester une réponse simple

## 5. Relancer Mission Control

```bash
cd ~/.openclaw/workspace/mission-control-arpagona
pnpm install
pnpm dev
```

Puis vérifier :
- `http://localhost:3000`
- chargement des vues principales
- accès calendrier si utilisé

## 6. Vérifier la sauvegarde GitHub

```bash
cd ~/.openclaw/workspace
./tools/github-backup.sh
```

Contrôles :
- remote `origin` présent
- SSH GitHub OK
- push OK
- tâche quotidienne toujours active

## 7. Vérifier les données critiques

- `MEMORY.md`
- `memory/`
- `state/calendar.json`
- `state/team.json`
- `state/visual-office.json`
- code `mission-control-arpagona/`
- fichiers `langflow/`

## 8. Si la machine est totalement neuve

Il faudra aussi recréer ou restaurer :
- la clé SSH GitHub backup
- les dépendances système
- OpenClaw lui-même
- toute intégration externe non présente dans le repo

## 9. Routine après reprise

1. tester OpenClaw
2. tester Mission Control
3. refaire immédiatement un coffre de secrets à jour
4. lancer un push GitHub de validation

## Résumé court

- repo GitHub = mémoire, code, structure, états utiles
- coffre chiffré = secrets et config sensible
- les deux ensemble = vraie capacité de reconstruction
