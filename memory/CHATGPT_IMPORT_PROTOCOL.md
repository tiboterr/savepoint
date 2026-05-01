# CHATGPT_IMPORT_PROTOCOL.md

## But
Exploiter l'historique importé de ChatGPT dans OpenClaw **sans surconsommer de tokens**.

Ce protocole valide le travail fait sur :
- l'import brut normalisé
- le corpus élite
- le catalogue léger indexé en mémoire
- la lecture ciblée à la demande

Référence catalogue : `memory/chatgpt-elite-catalog.md`

---

## Règle mère
**Ne jamais charger le corpus entier.**

Toujours suivre cet ordre :
1. chercher dans le catalogue
2. identifier la bonne conversation
3. lire seulement le document utile
4. extraire seulement ce qui sert à la tâche en cours
5. promouvoir dans `MEMORY.md` uniquement les apprentissages durables

---

## Arborescence utile

### 1) Catalogue léger
- `memory/chatgpt-elite-catalog.md`

Usage : point d’entrée principal pour retrouver rapidement une conversation pertinente.

### 2) Corpus élite lisible
- `imports/chatgpt-elite-rag-ready/docs/`

Usage : lire une conversation précise quand le catalogue montre qu’elle est vraiment pertinente.

### 3) Corpus élite structuré
- `imports/chatgpt-elite/elite_corpus.json`
- `imports/chatgpt-elite/elite_index.jsonl`
- `imports/chatgpt-elite/elite_rag_chunks.jsonl`

Usage : backend / traitement / RAG avancé, pas pour injection directe dans le prompt courant.

### 4) Archive de travail complète
- `imports/chatgpt-normalized/chatgpt_import.sqlite`

Usage : exploitation technique, audits, exports, scripts.

---

## Procédure standard

### Cas A — question probablement couverte par l’ancien historique ChatGPT
Exemples :
- “on avait déjà parlé de ça ?”
- “est-ce qu’on a déjà travaillé sur OpenClaw / ARPAGONA / trading / business model ?”
- “retrouve la conversation où…”

Procédure :
1. utiliser `memory_search` sur le catalogue
2. repérer le titre + chemin du document
3. lire uniquement ce document
4. répondre à partir de ce document et du contexte courant
5. si besoin, citer le chemin du doc lu

### Cas B — tâche courante sans besoin historique fort
Exemples :
- simple question technique locale
- action immédiate indépendante
- tâche purement opérationnelle

Procédure :
1. ne pas charger le catalogue par réflexe
2. travailler normalement
3. n’utiliser l’historique ChatGPT que si un vrai besoin apparaît

### Cas C — synthèse transversale ou question identitaire / stratégique
Exemples :
- “quelles sont mes idées récurrentes ?”
- “quels projets AI reviennent souvent ?”
- “quelles décisions importantes j’ai déjà envisagées ?”

Procédure :
1. chercher d’abord dans le catalogue
2. sélectionner 2 à 5 documents maximum
3. lire seulement ces documents
4. produire une synthèse compacte
5. si la synthèse est durable, l’ajouter ensuite à `MEMORY.md`

---

## Quand lire un document complet
Lire un document du corpus élite seulement si au moins une condition est vraie :
- le sujet du user correspond clairement à une entrée du catalogue
- la réponse risque d’être incomplète sans historique
- il faut retrouver une ancienne réflexion, un plan, un cadrage ou une décision
- il faut comparer le présent avec un travail antérieur

Sinon : ne pas le lire.

---

## Quand ne surtout pas charger l’historique
- pour une tâche triviale
- pour une réponse courte sans enjeu mémoire
- quand le sujet est manifestement nouveau
- quand seule une action locale est nécessaire
- quand le coût contexte serait supérieur à l’utilité attendue

---

## Politique de promotion vers MEMORY.md
Ne pas verser des transcripts dans `MEMORY.md`.

Promouvoir uniquement :
- décisions durables
- orientations stratégiques stables
- préférences récurrentes
- projets structurants
- leçons importantes
- informations identitaires ou de fonctionnement utiles à long terme

Ne pas promouvoir :
- longs échanges bruts
- brainstorming faible signal
- analyses temporaires vite périmées
- détails techniques jetables

---

## Budget de sobriété
Règles pratiques :
- 1 recherche catalogue avant toute lecture historique
- 1 document lu par défaut
- 3 documents max dans la plupart des cas
- 5 documents max seulement pour vraie synthèse transverse
- pas de lecture en chaîne sans justification claire

---

## Hiérarchie des sources
Quand plusieurs sources existent :
1. contexte courant
2. `MEMORY.md`
3. catalogue ChatGPT élite
4. document élite ciblé
5. archive technique complète

Le corpus ChatGPT importé doit aider la décision, **pas remplacer le jugement courant**.

---

## Validation du système
Ce protocole considère le travail validé si :
- le catalogue est retrouvable via `memory_search`
- les chemins vers les docs élite sont exploitables
- les réponses peuvent s’appuyer sur lecture ciblée seulement
- aucun besoin d’injecter le corpus complet n’apparaît dans l’usage normal

État actuel : **validé en mode Option 1**.

---

## Résumé ultra-court
**Chercher petit → lire ciblé → répondre compact → mémoriser seulement l’essentiel.**
