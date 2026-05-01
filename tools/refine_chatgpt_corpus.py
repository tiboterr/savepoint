#!/usr/bin/env python3
import argparse
import hashlib
import json
import math
import os
import re
from collections import Counter, defaultdict

CATEGORY_KEYWORDS = {
    'ai_projects': [
        'openclaw','langflow','agent','agents','workflow','rag','llm','prompt','prompts','automation','n8n','flowise',
        'spc','synthetic prefrontal','cortex','cortexus','vector db','embedding','knowledge base','model context protocol',
        'mcp','ai company','mission control','orchestration'
    ],
    'business': [
        'business','entreprise','startup','client','clients','offre','offer','pricing','price','tarif','vente','sales',
        'marketing','positioning','positionnement','brand','branding','marché','market','mvp','pitch','deck','acquisition',
        'profit','profitable','funnel','landing page','formation','education','training'
    ],
    'personal_deep': [
        'vie','life','identity','identité','purpose','sens','meaning','relation','relationship','amour','émotion','emotion',
        'burnout','motivation','valeurs','values','peur','fear','solitude','loneliness','journal','introspection'
    ],
    'technical': [
        'python','api','sqlite','postgres','docker','linux','ubuntu','javascript','typescript','bash','script','code',
        'github','git','server','proxmox','gpu','coinbase','backtest','trading bot','bot', 'installation'
    ],
    'decisions_plans': [
        'plan','roadmap','priorité','priorities','decision','décision','choix','strategy','stratégie','next step',
        'prochaine étape','recommendation','recommandation','go/no-go','should i'
    ],
    'creative_ideas': [
        'idée','idea','concept','invent','inventer','opportunité','opportunity','vision','brainstorm','brainstorming',
        'new business','side project','prototype'
    ],
}

NOISE_PATTERNS = [
    'new chat', 'untitled', 'image', 'translate', 'traduction'
]


def norm(s: str) -> str:
    return re.sub(r'\s+', ' ', (s or '').lower()).strip()


def short_hash(text: str) -> str:
    return hashlib.sha1(text.encode('utf-8', errors='ignore')).hexdigest()[:16]


def fingerprint_messages(messages):
    parts = []
    for m in messages:
        if m.get('role') not in ('user', 'assistant'):
            continue
        t = norm((m.get('text') or '')[:400])
        if t:
            parts.append(f"{m.get('role')}:{t}")
    joined = '\n'.join(parts[:8])
    return short_hash(joined), joined


def categorize(title, preview_text):
    title_n = norm(title)
    text_n = norm(preview_text)
    hits = Counter()
    for cat, kws in CATEGORY_KEYWORDS.items():
        for kw in kws:
            h = text_n.count(kw) + title_n.count(kw) * 3
            if h:
                hits[cat] += h
    ordered = [cat for cat, _ in hits.most_common()]
    return ordered, dict(hits)


def quality_score(item, cats, hits, preview_text):
    title_n = norm(item.get('title') or '')
    msgs = item.get('messages', [])
    user_msgs = sum(1 for m in msgs if m.get('role') == 'user' and (m.get('text') or '').strip())
    assistant_msgs = sum(1 for m in msgs if m.get('role') == 'assistant' and (m.get('text') or '').strip())
    total_chars = sum(len(m.get('text') or '') for m in msgs if m.get('role') in ('user','assistant'))
    tool_heavy_penalty = sum(1 for m in msgs if m.get('role') == 'tool') * 0.15

    score = 0.0
    score += min(user_msgs, 10) * 1.8
    score += min(assistant_msgs, 12) * 1.0
    score += min(total_chars / 1800.0, 10)
    score += sum(min(v, 10) for v in hits.values()) * 1.2
    score += min(len(cats), 3) * 2.5
    if item.get('score'):
        score += min(float(item['score']) / 12.0, 8)

    if any(p == title_n for p in NOISE_PATTERNS):
        score -= 5
    if total_chars < 500:
        score -= 3
    if user_msgs < 2:
        score -= 2
    if 'USER:' not in preview_text and user_msgs == 0:
        score -= 5
    score -= tool_heavy_penalty
    return round(score, 2), {
        'user_messages': user_msgs,
        'assistant_messages': assistant_msgs,
        'total_chars': total_chars,
        'tool_heavy_penalty': round(tool_heavy_penalty, 2),
    }


def build_preview(messages, max_chars=5000):
    chunks = []
    used = 0
    for m in messages:
        if m.get('role') not in ('user', 'assistant'):
            continue
        text = (m.get('text') or '').strip()
        if not text:
            continue
        piece = f"{m['role'].upper()}: {text}"
        if used + len(piece) > max_chars:
            remain = max_chars - used
            if remain > 80:
                chunks.append(piece[:remain])
            break
        chunks.append(piece)
        used += len(piece) + 2
    return '\n\n'.join(chunks)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--input', required=True)
    ap.add_argument('--out-dir', required=True)
    ap.add_argument('--elite', type=int, default=120)
    args = ap.parse_args()

    os.makedirs(args.out_dir, exist_ok=True)
    data = json.load(open(args.input, encoding='utf-8'))

    refined = []
    dup_groups = defaultdict(list)
    for item in data:
        preview = build_preview(item.get('messages', []))
        cats, hits = categorize(item.get('title') or '', preview)
        fp, fp_text = fingerprint_messages(item.get('messages', []))
        qscore, qmeta = quality_score(item, cats, hits, preview)
        rec = {
            **item,
            'primary_category': cats[0] if cats else 'misc',
            'categories': cats or ['misc'],
            'category_hits': hits,
            'quality_score': qscore,
            'preview_text': preview,
            'fingerprint': fp,
            'fingerprint_basis': fp_text,
            **qmeta,
        }
        refined.append(rec)
        dup_groups[fp].append(rec)

    refined.sort(key=lambda x: (x['quality_score'], x.get('score', 0), x.get('message_count', 0)), reverse=True)

    deduped = []
    duplicates = []
    seen = set()
    for item in refined:
        fp = item['fingerprint']
        if fp in seen:
            duplicates.append(item)
            continue
        seen.add(fp)
        deduped.append(item)

    # drop weak items
    strong = [x for x in deduped if x['quality_score'] >= 18 and x['user_messages'] >= 2 and x['total_chars'] >= 700]
    elite = strong[:args.elite]

    json.dump(refined, open(os.path.join(args.out_dir, 'refined_all.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=2)
    json.dump(deduped, open(os.path.join(args.out_dir, 'deduped.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=2)
    json.dump(duplicates, open(os.path.join(args.out_dir, 'duplicates_removed.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=2)
    json.dump(elite, open(os.path.join(args.out_dir, 'elite_corpus.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=2)

    with open(os.path.join(args.out_dir, 'elite_index.jsonl'), 'w', encoding='utf-8') as f:
        for item in elite:
            slim = {k: v for k, v in item.items() if k not in ('messages', 'preview_text', 'fingerprint_basis')}
            f.write(json.dumps(slim, ensure_ascii=False) + '\n')

    with open(os.path.join(args.out_dir, 'elite_report.md'), 'w', encoding='utf-8') as f:
        f.write('# Elite ChatGPT corpus\n\n')
        f.write(f'- input conversations: {len(data)}\n')
        f.write(f'- deduped conversations: {len(deduped)}\n')
        f.write(f'- duplicates removed: {len(duplicates)}\n')
        f.write(f'- elite conversations: {len(elite)}\n\n')
        f.write('## Top conversations\n\n')
        for i, item in enumerate(elite[:80], start=1):
            f.write(f"## {i}. {item.get('title') or '(sans titre)'}\n")
            f.write(f"- id: `{item['conversation_id']}`\n")
            f.write(f"- category: {item['primary_category']}\n")
            f.write(f"- categories: {', '.join(item['categories'])}\n")
            f.write(f"- quality_score: {item['quality_score']}\n")
            f.write(f"- messages: {item.get('message_count')}\n")
            f.write(f"- date: {item.get('create_time')}\n")
            preview_line = item['preview_text'][:350].replace('\n', ' ')
            f.write(f"- aperçu: {preview_line}\n\n")

    rag_jsonl = os.path.join(args.out_dir, 'elite_rag_chunks.jsonl')
    with open(rag_jsonl, 'w', encoding='utf-8') as f:
        for item in elite:
            chunk_lines = []
            used = 0
            idx = 1
            base = {
                'conversation_id': item['conversation_id'],
                'title': item.get('title'),
                'primary_category': item['primary_category'],
                'categories': item['categories'],
                'quality_score': item['quality_score'],
                'create_time': item.get('create_time'),
            }
            for m in item.get('messages', []):
                if m.get('role') not in ('user', 'assistant'):
                    continue
                text = (m.get('text') or '').strip()
                if not text:
                    continue
                line = f"{m['role'].upper()}: {text}"
                if used + len(line) > 2600 and chunk_lines:
                    rec = {**base, 'chunk_id': f"{item['conversation_id']}#{idx}", 'text': '\n\n'.join(chunk_lines)}
                    f.write(json.dumps(rec, ensure_ascii=False) + '\n')
                    idx += 1
                    chunk_lines = []
                    used = 0
                chunk_lines.append(line)
                used += len(line) + 2
            if chunk_lines:
                rec = {**base, 'chunk_id': f"{item['conversation_id']}#{idx}", 'text': '\n\n'.join(chunk_lines)}
                f.write(json.dumps(rec, ensure_ascii=False) + '\n')

    summary = {
        'input_conversations': len(data),
        'deduped_conversations': len(deduped),
        'duplicates_removed': len(duplicates),
        'elite_conversations': len(elite),
        'category_distribution': dict(Counter(x['primary_category'] for x in elite)),
        'artifacts': {
            'refined_all': os.path.join(args.out_dir, 'refined_all.json'),
            'deduped': os.path.join(args.out_dir, 'deduped.json'),
            'duplicates_removed': os.path.join(args.out_dir, 'duplicates_removed.json'),
            'elite_corpus': os.path.join(args.out_dir, 'elite_corpus.json'),
            'elite_index': os.path.join(args.out_dir, 'elite_index.jsonl'),
            'elite_report': os.path.join(args.out_dir, 'elite_report.md'),
            'elite_rag_chunks': rag_jsonl,
        },
    }
    json.dump(summary, open(os.path.join(args.out_dir, 'summary.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=2)
    print(json.dumps(summary, ensure_ascii=False, indent=2))

if __name__ == '__main__':
    main()
