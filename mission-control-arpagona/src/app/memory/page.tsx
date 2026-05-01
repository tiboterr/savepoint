import { MissionControlShell } from "@/components/mission-control-shell";
import { MemorySection } from "@/components/mission-sections";
import { getMissionControlData } from "@/lib/mission-control";

export default async function MemoryPage() {
  const data = await getMissionControlData();

  return (
    <MissionControlShell
      data={data}
      current="memory"
      title="Memory"
      description="Journal vivant et mémoire de travail du workspace OpenClaw."
    >
      <MemorySection memory={data.memory} />
    </MissionControlShell>
  );
}
