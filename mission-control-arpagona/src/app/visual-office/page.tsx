import { MissionControlShell } from "@/components/mission-control-shell";
import { MissionEmptyState } from "@/components/mission-empty-state";
import { VisualOfficeSection } from "@/components/mission-ops-sections";
import { getMissionControlData } from "@/lib/mission-control";

export default async function VisualOfficePage() {
  const data = await getMissionControlData();

  return (
    <MissionControlShell
      data={data}
      current="visual-office"
      title="Visual Office"
      description="Vue spatiale locale-first pour représenter les espaces, écrans et états réels."
    >
      {data.visualOffice.length === 0 ? (
        <MissionEmptyState
          title="Visual Office source not populated yet"
          description="La vue existe déjà, mais elle doit encore être nourrie par des espaces et états réellement définis."
          sourcePath="state/visual-office.json"
          schemaPath="mission-control-arpagona/STATE_SCHEMAS.md"
        />
      ) : (
        <VisualOfficeSection spaces={data.visualOffice} members={data.team} tasks={data.tasks} />
      )}
    </MissionControlShell>
  );
}
