#!/usr/bin/env python3
import argparse
import json
import math
import os
import re
import sqlite3
from collections import Counter

KEYWORDS = {
    'project': [
        'projet', 'project', 'startup', 'business', 'entreprise', 'client', 'offre', 'pricing', 'vente', 'funnel',
        'langflow', 'openclaw', 'agent', 'rag', 'workflow', 'automation', 'saas', 'formation', 'education',
        'cours', 'training', 'cortex', 'spc', 'synthetic', 'architecture', 'product', 'roadmap', 'strategy',
        'vision', 'market', 'positioning', 'brand', 'landing page', 'pitch', 'deck', 'mvp'
    ],
    'decision': [
        'decision', 'décision', 'choix', 'plan', 'stratégie', 'priorité', 'priorities', 'next step', 'prochaine étape',
        'recommandation', 'recommendation', 'should i', 'est-ce que je dois', 'go/no-go'
    ],
    'personal': [
        'journal', 'réflexion', 'life', 'vie', 'relationship', 'relation', 'identity', 'purpose', 'meaning',
        'émotion', 'emotion', 'burnout', 'motivation', 'values', 'valeurs', 'vision de vie'
    ],
    'knowledge': [
        'compare', 'comparison', 'guide', 'framework', 'tutorial', 'explain', 'analyse', 'analysis', 'research',
        'benchmark', 'best practices', 'how to', 'comment faire'
    ]
}

STOP_TITLES = {'new chat', 'image', 'untitled'}


def norm(s: str) -> str:
    return re.sub(r'\s+', ' ', (s or '').lower()).strip()


def score_conversation(title: str, texts: list[str], roles: list[str]) -> tuple[float, dict]:
    title_n = norm(title)
    text = '\n'.join(texts)
    text_n = norm(text)
    assistant_msgs = sum(1 for r in roles if r == 'assistant')
    user_msgs = sum(1 for r in roles if r == 'user')
    total_chars = len(text)

    cat_hits = Counter()
    for cat, kws in KEYWORDS.items():
        for kw in kws:
            hit = text_n.count(kw) + title_n.count(kw) * 3
            if hit:
                cat_hits[cat] += hit

    score = 0.0
    score += min(user_msgs, 8) * 1.2
    score += min(assistant_msgs, 10) * 0.8
    score += min(total_chars / 1200.0, 8)
    score += sum(min(v, 12) for v in cat_hits.values()) * 1.4

    if title_n in STOP_TITLES:
        score -= 4
    if len(title_n) < 6:
        score -= 1
    if user_msgs < 2:
        score -= 2
    if total_chars < 300:
        score -= 1.5

    tags = [cat for cat, v in cat_hits.items() if v >= 2]
    if not tags:
        if cat_hits:
            tags = [cat_hits.most_common(1)[0][0]]
        else:
            tags = ['misc']

    return score, {
        'user_messages': user_msgs,
        'assistant_messages': assistant_msgs,
        'total_chars': total_chars,
        'keyword_hits': dict(cat_hits),
        'tags': tags,
    }


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--db', required=True)
    ap.add_argument('--out-dir', required=True)
    ap.add_argument('--top', type=int, default=250)
    args = ap.parse_args()

    os.makedirs(args.out_dir, exist_ok=True)
    conn = sqlite3.connect(args.db)
    conn.row_factory = sqlite3.Row
    cur = conn.cursor()

    conversations = []
    conv_rows = list(cur.execute('select id, title, create_time, update_time, model_slug, message_count from conversations order by create_time'))
    for conv in conv_rows:
        msgs = list(conn.execute('select seq, role, text, content_type, create_time from messages where conversation_id=? order by seq', (conv['id'],)))
        texts = [m['text'] or '' for m in msgs if m['role'] in ('user', 'assistant')]
        roles = [m['role'] for m in msgs]
        score, meta = score_conversation(conv['title'] or '', texts, roles)
        conversations.append({
            'conversation_id': conv['id'],
            'title': conv['title'],
            'create_time': conv['create_time'],
            'update_time': conv['update_time'],
            'model_slug': conv['model_slug'],
            'message_count': conv['message_count'],
            'score': round(score, 2),
            **meta,
            'messages': [dict(m) for m in msgs],
        })

    conversations.sort(key=lambda x: x['score'], reverse=True)
    top = conversations[:args.top]

    json.dump(top, open(os.path.join(args.out_dir, 'high_value_conversations.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=2)

    with open(os.path.join(args.out_dir, 'high_value_index.jsonl'), 'w', encoding='utf-8') as f:
        for item in top:
            slim = {k: v for k, v in item.items() if k != 'messages'}
            f.write(json.dumps(slim, ensure_ascii=False) + '\n')

    md_path = os.path.join(args.out_dir, 'high_value_report.md')
    with open(md_path, 'w', encoding='utf-8') as f:
        f.write('# High-value ChatGPT conversations\n\n')
        f.write(f'Total selected: {len(top)}\n\n')
        for i, item in enumerate(top[:100], start=1):
            f.write(f"## {i}. {item['title'] or '(sans titre)'}\n")
            f.write(f"- id: `{item['conversation_id']}`\n")
            f.write(f"- date: {item['create_time']}\n")
            f.write(f"- score: {item['score']}\n")
            f.write(f"- tags: {', '.join(item['tags'])}\n")
            f.write(f"- messages: {item['message_count']}\n")
            preview = ''
            for m in item['messages']:
                if m['role'] == 'user' and (m['text'] or '').strip():
                    preview = (m['text'] or '').strip().replace('\n', ' ')
                    break
            if preview:
                f.write(f"- aperçu: {preview[:300]}\n")
            f.write('\n')

    rag_jsonl = os.path.join(args.out_dir, 'rag_chunks.jsonl')
    with open(rag_jsonl, 'w', encoding='utf-8') as f:
        for item in top:
            base_meta = {
                'conversation_id': item['conversation_id'],
                'title': item['title'],
                'create_time': item['create_time'],
                'score': item['score'],
                'tags': item['tags'],
            }
            chunk_lines = []
            chunk_idx = 1
            char_budget = 0
            for m in item['messages']:
                if m['role'] not in ('user', 'assistant', 'tool'):
                    continue
                text = (m['text'] or '').strip()
                if not text:
                    continue
                line = f"{m['role'].upper()}: {text}"
                if char_budget + len(line) > 3500 and chunk_lines:
                    rec = {
                        **base_meta,
                        'chunk_id': f"{item['conversation_id']}#{chunk_idx}",
                        'text': '\n\n'.join(chunk_lines),
                    }
                    f.write(json.dumps(rec, ensure_ascii=False) + '\n')
                    chunk_idx += 1
                    chunk_lines = []
                    char_budget = 0
                chunk_lines.append(line)
                char_budget += len(line)
            if chunk_lines:
                rec = {
                    **base_meta,
                    'chunk_id': f"{item['conversation_id']}#{chunk_idx}",
                    'text': '\n\n'.join(chunk_lines),
                }
                f.write(json.dumps(rec, ensure_ascii=False) + '\n')

    summary = {
        'selected_conversations': len(top),
        'top_score': top[0]['score'] if top else None,
        'min_selected_score': top[-1]['score'] if top else None,
        'tag_distribution': dict(Counter(tag for item in top for tag in item['tags'])),
        'artifacts': {
            'full_json': os.path.join(args.out_dir, 'high_value_conversations.json'),
            'index_jsonl': os.path.join(args.out_dir, 'high_value_index.jsonl'),
            'report_md': md_path,
            'rag_chunks_jsonl': rag_jsonl,
        }
    }
    json.dump(summary, open(os.path.join(args.out_dir, 'summary.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=2)
    print(json.dumps(summary, ensure_ascii=False, indent=2))


if __name__ == '__main__':
    main()
