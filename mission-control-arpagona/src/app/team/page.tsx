import { MissionControlShell } from "@/components/mission-control-shell";
import { MissionEmptyState } from "@/components/mission-empty-state";
import { TeamSection } from "@/components/mission-ops-sections";
import { getMissionControlData } from "@/lib/mission-control";

export default async function TeamPage() {
  const data = await getMissionControlData();

  return (
    <MissionControlShell
      data={data}
      current="team"
      title="Team"
      description="Vue équipe locale-first, prête à refléter les membres et rôles réels."
    >
      {data.team.length === 0 ? (
        <MissionEmptyState
          title="Team source not populated yet"
          description="Le cockpit est prêt, mais il attend encore des membres réels pour rendre cette vue utile."
          sourcePath="state/team.json"
          schemaPath="mission-control-arpagona/STATE_SCHEMAS.md"
        />
      ) : (
        <TeamSection members={data.team} />
      )}
    </MissionControlShell>
  );
}
