import { MissionControlShell } from "@/components/mission-control-shell";
import { TasksSection } from "@/components/mission-sections";
import { getMissionControlData } from "@/lib/mission-control";

export default async function TasksPage() {
  const data = await getMissionControlData();

  return (
    <MissionControlShell
      data={data}
      current="tasks"
      title="Tasks"
      description="Radar d’exécution : live d’abord, archives séparées pour éviter le bruit."
    >
      <TasksSection tasks={data.tasks} />
    </MissionControlShell>
  );
}
