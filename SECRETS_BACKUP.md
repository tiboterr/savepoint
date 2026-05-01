# Sauvegarde chiffrée des secrets

Le repo GitHub ne doit pas contenir les secrets. Pour couvrir un crash total, on garde un coffre local chiffré séparé.

## Ce que le coffre inclut

- `~/.openclaw/openclaw.json`
- `~/.openclaw/credentials/`
- `mission-control-arpagona/client_secret_*.json`
- `mission-control-arpagona/.env`
- `mission-control-arpagona/.env.local`

## Création du coffre

Depuis le workspace :

```bash
./tools/backup-secrets.sh
```

Le script :
- copie les secrets vers une zone temporaire
- crée une archive tar
- chiffre l'archive avec `gpg --symmetric` (mot de passe demandé)
- produit :
  - `.secrets-backup/openclaw-secrets.tar.gpg`
  - `.secrets-backup/MANIFEST.txt`

## Restauration des secrets

```bash
./tools/restore-secrets.sh
```

Le script redépose automatiquement les fichiers aux bons endroits.

## Recommandation forte

Après avoir créé le coffre chiffré :
- copie `.secrets-backup/openclaw-secrets.tar.gpg` dans un endroit séparé du serveur
- garde le mot de passe hors machine
- idéalement : deux copies (ex: disque externe + cloud chiffré)

## Fréquence

À refaire quand tu modifies :
- la config OpenClaw
- un provider/token
- le client secret Google Calendar
- tout autre secret local utile à la reprise

## Important

Le coffre chiffré est **ignoré par git**. Il n'est pas poussé sur GitHub.
