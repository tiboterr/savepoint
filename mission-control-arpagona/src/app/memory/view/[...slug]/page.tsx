import { MissionControlShell } from "@/components/mission-control-shell";
import { FileViewer } from "@/components/file-viewer";
import { getMissionControlData } from "@/lib/mission-control";
import { decodeWorkspacePath, readWorkspaceFile } from "@/lib/workspace-files";

export default async function MemoryFilePage({ params }: { params: Promise<{ slug?: string[] }> }) {
  const [{ slug }, data] = await Promise.all([params, getMissionControlData()]);
  const relativePath = decodeWorkspacePath(slug);

  if (!relativePath) {
    throw new Error("Missing file path");
  }

  const file = await readWorkspaceFile(relativePath);

  return (
    <MissionControlShell
      data={data}
      current="memory"
      title="Memory"
      description="Lecture complète d’un fichier mémoire du workspace."
    >
      <FileViewer title={file.title} path={file.path} content={file.content} updatedAt={file.updatedAt} />
    </MissionControlShell>
  );
}
