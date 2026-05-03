# LOCO Discord Bot

Bot Discord simple et propre pour faire parler LOCO dans les salons, avec un backend LLM compatible OpenAI pointé vers GLM.

## Ce que le bot fait

- répond quand on mentionne directement le bot
- répond quand on mentionne le rôle `@loco`
- répond quand un message commence par `loco`, `@loco`, `loco:` ou `loco,`
- répond quand on répond à un de ses messages
- expose `/ask`
- expose `/loco-ping`
- récupère un peu de contexte récent du salon
- évite les pings parasites dans ses réponses
- se branche sur n’importe quel endpoint compatible OpenAI (`/v1/chat/completions`)

## Pourquoi ce comportement par défaut

Je l’ai rendu dispo partout, mais pas bavard partout.
C’est le bon compromis : présent dans tous les salons, sans transformer le serveur en fête foraine.

Si tu veux plus tard, on peut ajouter :
- salons où il répond sans mention
- mémoire longue
- RAG sur docs internes
- outils métier LOCO
- modération / support / analytics

## Installation

```bash
cd loco-discord-bot
npm install
cp .env.example .env
```

Remplis ensuite `.env`.

## Variables importantes

### Discord

- `DISCORD_TOKEN`: token du bot Discord
- `DISCORD_CLIENT_ID`: application ID Discord
- `DISCORD_GUILD_ID`: optionnel, pour enregistrer vite les slash commands sur un serveur de test
- `DISCORD_TRIGGER_ROLE_ID`: rôle Discord à écouter pour `@loco`
- `DISCORD_TRIGGER_NAME`: mot-clé simple à écouter, ex. `loco`
- `DISCORD_ALLOWED_CHANNEL_IDS`: liste d’IDs séparés par des virgules si tu veux limiter certains salons
- `DISCORD_IGNORED_CHANNEL_IDS`: liste d’IDs séparés par des virgules si tu veux en ignorer

### Modèle

- `LLM_BASE_URL`: endpoint LOCO / gateway compatible OpenAI
- `LLM_API_KEY`: clé API si nécessaire
- `LLM_MODEL`: nom du modèle GLM exposé par LOCO
- `LLM_TEMPERATURE`: température du modèle

### Bot

- `BOT_NAME`: nom affiché/logique du bot
- `MAX_CONTEXT_MESSAGES`: nombre de messages récents injectés en contexte
- `MAX_REPLY_CHARS`: taille max d’un bloc de réponse Discord
- `SYSTEM_PROMPT`: personnalité de base

## Exemple de config LOCO / GLM

Si LOCO expose un endpoint local OpenAI-compatible :

```env
LLM_BASE_URL=http://localhost:8000/v1
LLM_MODEL=glm-4.5
LLM_API_KEY=dummy
```

Adapte selon ton serveur réel.

## Déclencheurs de réponse

Le bot répond si :
- on mentionne directement le bot
- on mentionne le rôle configuré dans `DISCORD_TRIGGER_ROLE_ID`
- le message commence par `loco`, `@loco`, `loco:` ou `loco,`
- on répond à un message du bot

## Lancer

```bash
npm run dev
```

ou

```bash
npm start
```

## Permissions Discord à activer

Dans Discord Developer Portal :

- Bot
  - Message Content Intent: ON
- OAuth2 URL Generator
  - scopes: `bot`, `applications.commands`
  - permissions conseillées:
    - View Channels
    - Send Messages
    - Read Message History
    - Use Slash Commands
    - Attach Files

## Vérification rapide

1. démarre le bot
2. vérifie `/loco-ping`
3. envoie `@loco salut`
4. vérifie qu’il répond sans ping tout le monde

## Notes

- Discord limite les messages à 2000 caractères, le bot découpe les réponses longues.
- Le SDK OpenAI est utilisé ici comme client HTTP compatible.
- Si ton backend GLM n’est pas 100% OpenAI-compatible, je peux te faire l’adaptateur exact.
