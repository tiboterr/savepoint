#!/usr/bin/env python3
import argparse
import datetime as dt
import glob
import json
import os
import sqlite3
from typing import Any, Dict, List, Optional


def iso(ts: Optional[float]) -> Optional[str]:
    if ts in (None, ""):
        return None
    try:
        return dt.datetime.fromtimestamp(float(ts), tz=dt.timezone.utc).isoformat()
    except Exception:
        return None


def stringify_part(part: Any) -> str:
    if part is None:
        return ""
    if isinstance(part, str):
        return part
    if isinstance(part, dict):
        if part.get("content_type") == "image_asset_pointer":
            ptr = part.get("asset_pointer") or part.get("asset_pointer_link") or "image"
            return f"[image:{ptr}]"
        if part.get("content_type") == "audio_asset_pointer":
            ptr = part.get("asset_pointer") or "audio"
            return f"[audio:{ptr}]"
        if part.get("content_type") == "video_asset_pointer":
            ptr = part.get("asset_pointer") or "video"
            return f"[video:{ptr}]"
        if "text" in part and isinstance(part["text"], str):
            return part["text"]
        return json.dumps(part, ensure_ascii=False)
    if isinstance(part, list):
        return "\n".join(p for p in (stringify_part(x) for x in part) if p)
    return str(part)


def extract_text(content: Dict[str, Any]) -> str:
    if not content:
        return ""
    ctype = content.get("content_type")
    if ctype == "text":
        return "\n".join(p for p in content.get("parts", []) if isinstance(p, str)).strip()
    if ctype == "multimodal_text":
        return "\n".join(p for p in (stringify_part(x) for x in content.get("parts", [])) if p).strip()
    if ctype == "code":
        lang = content.get("language") or "unknown"
        text = content.get("text", "")
        return f"```{lang}\n{text}\n```".strip()
    if ctype == "user_editable_context":
        bits = []
        if content.get("user_profile"):
            bits.append("[user_profile]\n" + content["user_profile"].strip())
        if content.get("user_instructions"):
            bits.append("[user_instructions]\n" + content["user_instructions"].strip())
        return "\n\n".join(bits).strip()
    if ctype == "tether_browsing_display":
        return (content.get("result") or "").strip()
    if ctype == "tether_quote":
        title = content.get("title") or "quote"
        url = content.get("url") or ""
        text = content.get("text") or ""
        prefix = f"[{title}] {url}".strip()
        return (prefix + "\n" + text).strip()
    if ctype == "execution_output":
        return str(content.get("text") or "").strip()
    if ctype == "computer_output":
        state = content.get("state") or {}
        url = state.get("url") or ""
        title = state.get("title") or ""
        shot = ((content.get("screenshot") or {}).get("asset_pointer")) or ""
        return f"[computer_output] {title} {url} {shot}".strip()
    if ctype == "reasoning_recap":
        return str(content.get("content") or "").strip()
    if ctype == "thoughts":
        thoughts = content.get("thoughts") or []
        parts = []
        for t in thoughts:
            summary = t.get("summary")
            body = t.get("content")
            if summary:
                parts.append(f"[summary] {summary}")
            if body:
                parts.append(body)
        return "\n\n".join(parts).strip()
    if ctype == "system_error":
        name = content.get("name") or "system_error"
        text = content.get("text") or ""
        return f"[{name}] {text}".strip()

    # generic fallback
    if "text" in content and isinstance(content.get("text"), str):
        return content["text"].strip()
    if "parts" in content:
        return "\n".join(p for p in (stringify_part(x) for x in content.get("parts", [])) if p).strip()
    return json.dumps(content, ensure_ascii=False)


def current_branch(mapping: Dict[str, Any], current_node: Optional[str]) -> List[Dict[str, Any]]:
    if not mapping:
        return []
    if not current_node or current_node not in mapping:
        return []
    ordered = []
    seen = set()
    node_id = current_node
    while node_id and node_id in mapping and node_id not in seen:
        seen.add(node_id)
        node = mapping[node_id]
        ordered.append(node)
        node_id = node.get("parent")
    ordered.reverse()
    return ordered


def visible_message(msg: Dict[str, Any]) -> bool:
    if not msg:
        return False
    meta = msg.get("metadata") or {}
    if meta.get("is_visually_hidden_from_conversation"):
        return False
    role = ((msg.get("author") or {}).get("role"))
    if role == "system" and not meta.get("is_user_system_message"):
        return False
    return True


def ensure_db(path: str) -> sqlite3.Connection:
    if os.path.exists(path):
        os.remove(path)
    conn = sqlite3.connect(path)
    conn.executescript(
        """
        PRAGMA journal_mode=WAL;
        CREATE TABLE conversations (
            id TEXT PRIMARY KEY,
            title TEXT,
            create_time TEXT,
            update_time TEXT,
            model_slug TEXT,
            current_node TEXT,
            message_count INTEGER,
            raw_json TEXT
        );
        CREATE TABLE messages (
            conversation_id TEXT,
            seq INTEGER,
            node_id TEXT,
            parent_id TEXT,
            role TEXT,
            author_name TEXT,
            content_type TEXT,
            create_time TEXT,
            text TEXT,
            raw_json TEXT
        );
        CREATE INDEX idx_messages_conv_seq ON messages(conversation_id, seq);
        CREATE VIRTUAL TABLE messages_fts USING fts5(
            conversation_id, title, role, text
        );
        """
    )
    return conn


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--input-dir", required=True)
    parser.add_argument("--output-dir", required=True)
    args = parser.parse_args()

    os.makedirs(args.output_dir, exist_ok=True)
    db_path = os.path.join(args.output_dir, "chatgpt_import.sqlite")
    conv_jsonl = os.path.join(args.output_dir, "conversations.jsonl")
    msg_jsonl = os.path.join(args.output_dir, "messages.jsonl")
    summary_path = os.path.join(args.output_dir, "summary.json")

    conn = ensure_db(db_path)
    manifest_path = os.path.join(args.input_dir, "export_manifest.json")
    manifest = json.load(open(manifest_path)) if os.path.exists(manifest_path) else {"export_files": []}

    files = sorted(glob.glob(os.path.join(args.input_dir, "conversations-*.json")))
    total_conversations = 0
    total_messages = 0
    role_counts: Dict[str, int] = {}
    content_counts: Dict[str, int] = {}
    first_ts = None
    last_ts = None

    with open(conv_jsonl, "w", encoding="utf-8") as conv_out, open(msg_jsonl, "w", encoding="utf-8") as msg_out:
        for fp in files:
            data = json.load(open(fp, encoding="utf-8"))
            for conv in data:
                total_conversations += 1
                ctime = conv.get("create_time")
                if ctime is not None:
                    first_ts = ctime if first_ts is None or ctime < first_ts else first_ts
                    last_ts = ctime if last_ts is None or ctime > last_ts else last_ts
                branch = current_branch(conv.get("mapping") or {}, conv.get("current_node"))
                rows = []
                for node in branch:
                    msg = node.get("message")
                    if not visible_message(msg):
                        continue
                    role = ((msg.get("author") or {}).get("role")) or "unknown"
                    role_counts[role] = role_counts.get(role, 0) + 1
                    content = msg.get("content") or {}
                    ctype = content.get("content_type") or "unknown"
                    content_counts[ctype] = content_counts.get(ctype, 0) + 1
                    text = extract_text(content)
                    row = {
                        "conversation_id": conv.get("id") or conv.get("conversation_id"),
                        "title": conv.get("title"),
                        "seq": len(rows) + 1,
                        "node_id": node.get("id"),
                        "parent_id": node.get("parent"),
                        "role": role,
                        "author_name": (msg.get("author") or {}).get("name"),
                        "content_type": ctype,
                        "create_time": iso(msg.get("create_time")),
                        "text": text,
                    }
                    rows.append(row)
                    total_messages += 1
                    msg_out.write(json.dumps(row, ensure_ascii=False) + "\n")
                    conn.execute(
                        "INSERT INTO messages (conversation_id, seq, node_id, parent_id, role, author_name, content_type, create_time, text, raw_json) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                        (
                            row["conversation_id"], row["seq"], row["node_id"], row["parent_id"], row["role"],
                            row["author_name"], row["content_type"], row["create_time"], row["text"],
                            json.dumps(node.get("message"), ensure_ascii=False),
                        ),
                    )
                    conn.execute(
                        "INSERT INTO messages_fts (conversation_id, title, role, text) VALUES (?, ?, ?, ?)",
                        (row["conversation_id"], conv.get("title"), row["role"], row["text"]),
                    )

                conv_row = {
                    "conversation_id": conv.get("id") or conv.get("conversation_id"),
                    "title": conv.get("title"),
                    "create_time": iso(conv.get("create_time")),
                    "update_time": iso(conv.get("update_time")),
                    "model_slug": conv.get("default_model_slug"),
                    "message_count": len(rows),
                }
                conv_out.write(json.dumps(conv_row, ensure_ascii=False) + "\n")
                conn.execute(
                    "INSERT INTO conversations (id, title, create_time, update_time, model_slug, current_node, message_count, raw_json) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                    (
                        conv_row["conversation_id"], conv_row["title"], conv_row["create_time"], conv_row["update_time"],
                        conv_row["model_slug"], conv.get("current_node"), conv_row["message_count"],
                        json.dumps(conv, ensure_ascii=False),
                    ),
                )

    conn.commit()
    conn.close()

    attachments = manifest.get("export_files", [])
    attachment_type_counts: Dict[str, int] = {}
    attachment_bytes = 0
    for item in attachments:
        attachment_bytes += int(item.get("size_bytes") or 0)
        parts = (item.get("path") or "").split("/")
        kind = parts[1] if len(parts) > 1 else "other"
        if kind not in {"audio", "image", "video", "file", "text"}:
            kind = os.path.splitext(parts[-1])[1].lstrip(".") or kind or "other"
        attachment_type_counts[kind] = attachment_type_counts.get(kind, 0) + 1

    summary = {
        "source_dir": os.path.abspath(args.input_dir),
        "output_dir": os.path.abspath(args.output_dir),
        "conversation_shards": len(files),
        "conversations": total_conversations,
        "messages_in_current_branches": total_messages,
        "role_counts": role_counts,
        "content_type_counts": content_counts,
        "attachments": len(attachments),
        "attachment_type_counts": attachment_type_counts,
        "attachment_size_bytes": attachment_bytes,
        "attachment_size_mb": round(attachment_bytes / 1024 / 1024, 2),
        "date_range": {
            "first_conversation_utc": iso(first_ts),
            "last_conversation_utc": iso(last_ts),
        },
        "artifacts": {
            "database": db_path,
            "conversations_jsonl": conv_jsonl,
            "messages_jsonl": msg_jsonl,
        },
    }
    with open(summary_path, "w", encoding="utf-8") as f:
        json.dump(summary, f, ensure_ascii=False, indent=2)

    print(json.dumps(summary, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
