import { MissionControlShell } from "@/components/mission-control-shell";
import { ProjectsSection } from "@/components/mission-sections";
import { getMissionControlData } from "@/lib/mission-control";

export default async function ProjectsPage() {
  const data = await getMissionControlData();

  return (
    <MissionControlShell
      data={data}
      current="projects"
      title="Projects"
      description="Sources stratégiques ARPAGONA actuellement suivies."
    >
      <ProjectsSection projects={data.projects} />
    </MissionControlShell>
  );
}
