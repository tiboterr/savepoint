import { MissionControlShell } from "@/components/mission-control-shell";
import { CalendarSection } from "@/components/mission-ops-sections";
import { getMissionControlData } from "@/lib/mission-control";

export default async function CalendarPage() {
  const data = await getMissionControlData();

  return (
    <MissionControlShell
      data={data}
      current="calendar"
      title="Calendar"
      description="Vue calendrier locale-first, branchée sur une source canonique réelle du workspace."
    >
      <CalendarSection events={data.calendar} nowIso={data.generatedAt} />
    </MissionControlShell>
  );
}
