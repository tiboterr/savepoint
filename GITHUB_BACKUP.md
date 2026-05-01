# Sauvegarde GitHub quotidienne

## Ce qui est mis en place

- le workspace est versionné en git
- `tools/github-backup.sh` crée un commit si quelque chose a changé puis pousse vers `origin`
- une tâche quotidienne OpenClaw peut lancer ce script automatiquement

## Avant que le push fonctionne

Il faut configurer un dépôt GitHub privé comme remote `origin` et une méthode d'authentification (clé SSH ou token HTTPS).

Exemple :

```bash
git remote add origin git@github.com:<toi>/openclaw-backup.git
```

ou

```bash
git remote add origin https://github.com/<toi>/openclaw-backup.git
```

## Test manuel

```bash
./tools/github-backup.sh
```

## Restauration

1. cloner le repo
2. remettre le contenu dans le workspace OpenClaw
3. reconfigurer séparément les secrets et tokens qui ne sont pas sauvegardés dans ce repo

## Important

Ce repo exclut volontairement certains secrets et fichiers runtime locaux, notamment `.openclaw/`, `.env*`, clés privées, caches et `node_modules/`.
