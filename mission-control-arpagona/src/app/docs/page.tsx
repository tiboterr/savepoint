import { MissionControlShell } from "@/components/mission-control-shell";
import { DocsSection } from "@/components/mission-sections";
import { getMissionControlData } from "@/lib/mission-control";

export default async function DocsPage() {
  const data = await getMissionControlData();

  return (
    <MissionControlShell
      data={data}
      current="docs"
      title="Docs"
      description="Exploration des sources documentaires réelles du workspace."
    >
      <DocsSection docs={data.docs} />
    </MissionControlShell>
  );
}
