import { promises as fs } from "fs";
import path from "path";

const WORKSPACE_ROOT = "/home/thibaud/.openclaw/workspace";

export function decodeWorkspacePath(segments: string[] | undefined) {
  if (!segments || segments.length === 0) return null;
  return segments.map(decodeURIComponent).join("/");
}

export async function readWorkspaceFile(relativePath: string) {
  const normalized = path.posix.normalize(relativePath).replace(/^\/+/, "");
  const fullPath = path.join(WORKSPACE_ROOT, normalized);
  const resolved = path.resolve(fullPath);

  if (!resolved.startsWith(WORKSPACE_ROOT)) {
    throw new Error("Forbidden path");
  }

  const [content, stat] = await Promise.all([
    fs.readFile(resolved, "utf8"),
    fs.stat(resolved),
  ]);

  return {
    path: normalized,
    content,
    updatedAt: stat.mtime.toISOString(),
    title: path.basename(normalized),
  };
}
