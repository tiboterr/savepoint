#!/usr/bin/env python3
import argparse
import json
import os
from collections import defaultdict


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--elite-json', required=True)
    ap.add_argument('--docs-dir', required=True)
    ap.add_argument('--out', required=True)
    args = ap.parse_args()

    data = json.load(open(args.elite_json, encoding='utf-8'))
    by_cat = defaultdict(list)
    for idx, item in enumerate(data, start=1):
        title = item.get('title') or '(sans titre)'
        conv_id = item['conversation_id']
        prefix = f"{idx:03d}-"
        match = None
        for name in os.listdir(args.docs_dir):
            if name.startswith(prefix) and conv_id[:8] in name:
                match = name
                break
        rec = {
            'title': title,
            'conversation_id': conv_id,
            'quality_score': item.get('quality_score'),
            'categories': item.get('categories', []),
            'primary_category': item.get('primary_category'),
            'create_time': item.get('create_time'),
            'path': f"imports/chatgpt-elite-rag-ready/docs/{match}" if match else None,
        }
        by_cat[rec['primary_category']].append(rec)

    lines = []
    lines.append('# ChatGPT elite catalog for OpenClaw')
    lines.append('')
    lines.append('But: permettre à OpenClaw de retrouver vite une conversation utile sans indexer tout le corpus brut dans MEMORY.md.')
    lines.append('')
    lines.append('Mode d’emploi:')
    lines.append('- utiliser memory_search pour retrouver une entrée par sujet/catégorie')
    lines.append('- lire ensuite uniquement le fichier markdown ciblé si besoin')
    lines.append('- éviter de charger le corpus complet dans le prompt')
    lines.append('')
    total = sum(len(v) for v in by_cat.values())
    lines.append(f'Total conversations élite: {total}')
    lines.append('')
    for cat in sorted(by_cat):
        items = sorted(by_cat[cat], key=lambda x: x['quality_score'], reverse=True)
        lines.append(f'## {cat}')
        lines.append('')
        for item in items:
            lines.append(f"- {item['title']} | score={item['quality_score']} | date={item['create_time']} | id={item['conversation_id']} | path={item['path']}")
        lines.append('')

    os.makedirs(os.path.dirname(args.out), exist_ok=True)
    with open(args.out, 'w', encoding='utf-8') as f:
        f.write('\n'.join(lines) + '\n')

    print(json.dumps({'output': args.out, 'categories': list(sorted(by_cat)), 'total': total}, ensure_ascii=False, indent=2))


if __name__ == '__main__':
    main()
