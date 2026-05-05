import { access, readFile } from "node:fs/promises";
import path from "node:path";

const handler = async (event: any) => {
  if (event?.type !== "agent" || event?.action !== "bootstrap") return;

  const context = event.context;
  const workspaceDir = context?.workspaceDir;
  const bootstrapFiles = context?.bootstrapFiles;

  if (!workspaceDir || !Array.isArray(bootstrapFiles)) return;

  await Promise.all(
    bootstrapFiles.map(async (file: any) => {
      if (!file?.name || typeof file.name !== "string") return;
      if (!file.name.endsWith(".md")) return;

      const compactName = file.name.replace(/\.md$/i, ".compact.md");
      const compactPath = path.join(workspaceDir, compactName);

      try {
        await access(compactPath);
        const compactContent = await readFile(compactPath, "utf8");
        if (compactContent.trim()) {
          file.content = compactContent;
          file.compactSourcePath = compactPath;
        }
      } catch {
        // No compact variant: keep original injected content.
      }
    })
  );
};

export default handler;
