import { MissionControlShell } from "@/components/mission-control-shell";
import { TasksV3Section } from "@/components/tasks-v3";
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
      <TasksV3Section tasks={data.tasks} team={data.team} visualOffice={data.visualOffice} />
    </MissionControlShell>
  );
}
