#!/usr/bin/env python3
import argparse
import json
import os
import re


def safe_name(s: str) -> str:
    s = (s or 'untitled').strip().lower()
    s = re.sub(r'[^a-z0-9àâçéèêëîïôûùüÿñæœ-]+', '-', s, flags=re.I)
    s = re.sub(r'-+', '-', s).strip('-')
    return s[:80] or 'untitled'


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--input', required=True)
    ap.add_argument('--out-dir', required=True)
    args = ap.parse_args()

    os.makedirs(args.out_dir, exist_ok=True)
    docs_dir = os.path.join(args.out_dir, 'docs')
    os.makedirs(docs_dir, exist_ok=True)

    data = json.load(open(args.input, encoding='utf-8'))
    manifest = []
    for idx, item in enumerate(data, start=1):
        title = item.get('title') or '(sans titre)'
        fname = f"{idx:03d}-{safe_name(title)}-{item['conversation_id'][:8]}.md"
        path = os.path.join(docs_dir, fname)
        with open(path, 'w', encoding='utf-8') as f:
            f.write(f"# {title}\n\n")
            f.write(f"- conversation_id: `{item['conversation_id']}`\n")
            f.write(f"- create_time: {item.get('create_time')}\n")
            f.write(f"- update_time: {item.get('update_time')}\n")
            f.write(f"- score: {item.get('score')}\n")
            f.write(f"- tags: {', '.join(item.get('tags', []))}\n")
            f.write(f"- model: {item.get('model_slug')}\n")
            f.write(f"- messages: {item.get('message_count')}\n\n")
            f.write('---\n\n')
            for m in item.get('messages', []):
                role = (m.get('role') or 'unknown').upper()
                text = (m.get('text') or '').strip()
                if not text:
                    continue
                f.write(f"## {role}\n\n{text}\n\n")
        manifest.append({
            'conversation_id': item['conversation_id'],
            'title': title,
            'tags': item.get('tags', []),
            'score': item.get('score'),
            'path': path,
        })

    with open(os.path.join(args.out_dir, 'manifest.json'), 'w', encoding='utf-8') as f:
        json.dump(manifest, f, ensure_ascii=False, indent=2)

    with open(os.path.join(args.out_dir, 'README.md'), 'w', encoding='utf-8') as f:
        f.write('# ChatGPT high-value corpus for RAG\n\n')
        f.write(f'- documents: {len(manifest)}\n')
        f.write('- format: one Markdown file per conversation\n')
        f.write('- intended use: ingestion in local RAG / vector DB / knowledge base\n\n')
        f.write('## Included files\n\n')
        f.write('- `docs/`: normalized Markdown conversations\n')
        f.write('- `manifest.json`: metadata index\n')

    print(json.dumps({'documents': len(manifest), 'docs_dir': docs_dir}, ensure_ascii=False, indent=2))


if __name__ == '__main__':
    main()
