# Mission Control ARPAGONA

Cockpit local-first pour piloter ARPAGONA depuis les **vraies données** du workspace OpenClaw.

## Stack

- Next.js (App Router)
- Tailwind CSS
- shadcn/ui
- lecture directe du filesystem local

## État actuel

La V1 affiche déjà des données réelles pour :

- **Memory** → fichiers dans `../memory`
- **Docs** → notes markdown/json du workspace
- **Projects** → fichiers stratégiques ARPAGONA
- **Tasks** → checklists détectées dans les fichiers live et certaines archives

## Lancer le cockpit

```bash
pnpm dev
```

Puis ouvrir :

- <http://localhost:3000>

## Vérification minimale

```bash
pnpm lint
pnpm build
```

## Structure utile

- `src/app/page.tsx` → UI principale du cockpit
- `src/components/mission-sidebar.tsx` → navigation latérale et résumé opérateur
- `src/lib/mission-control.ts` → agrégation des vraies données workspace

## Sources de vérité actuelles

- `../memory/`
- `../MEMORY.md`
- `../ARPAGONA_ACTION_PLAN.md`
- `../ARPAGONA_OFFRES.md`
- `../ARPAGONA_SALES_KIT.md`
- `../langflow/`
- `../imports/chatgpt-rag-ready/docs/`
- `../imports/chatgpt-elite-rag-ready/docs/`

## Direction suivante

- filtrer plus intelligemment les tâches live vs archives
- ajouter des vues `Calendar`, `Team`, `Visual Office`
- introduire des modèles locaux propres quand une source native manque
