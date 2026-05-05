import Link from "next/link";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DecisionPromptCard } from "@/components/decision-prompt";
import { MissionControlShell } from "@/components/mission-control-shell";
import { MissionOverview } from "@/components/mission-overview";
import { DocsSection, MemorySection, ProjectsSection, TasksSection } from "@/components/mission-sections";
import { generateDecisionPrompt, generateSecondaryDecisionPrompt } from "@/lib/decision-engine";
import { getMissionControlData } from "@/lib/mission-control";

export default async function Home() {
  const data = await getMissionControlData();
  const decisionPrompt = generateDecisionPrompt(data);
  const secondaryDecisionPrompt = generateSecondaryDecisionPrompt(data);

  return (
    <MissionControlShell
      data={data}
      current="overview"
      title="Cockpit local branché sur les vraies données"
      description="Vue opérateur du workspace OpenClaw : mémoire, docs, projets et tâches détectées en direct depuis les fichiers locaux."
    >
      <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
        {[
          {
            title: "Memory",
            description: "Journal récent, mémoire de travail, événements importants.",
            href: "/memory",
            stats: data.stats.memoryFiles,
          },
          {
            title: "Docs",
            description: "Corpus markdown/json du workspace, prêt à explorer.",
            href: "/docs",
            stats: data.stats.markdownDocs,
          },
          {
            title: "Projects",
            description: "Sources stratégiques ARPAGONA à garder dans le faisceau.",
            href: "/projects",
            stats: data.stats.projectFiles,
          },
          {
            title: "Tasks",
            description: "Exécution live séparée du backlog archive.",
            href: "/tasks",
            stats: data.stats.liveOpenTasks,
          },
          {
            title: "Calendar",
            description: "Source canonique locale, prête pour les vrais événements.",
            href: "/calendar",
            stats: data.stats.upcomingEvents,
          },
          {
            title: "Team",
            description: "Modèle local pour membres, rôles et focus réels.",
            href: "/team",
            stats: data.stats.teamMembers,
          },
          {
            title: "Visual Office",
            description: "Modèle local pour espaces et états opérationnels.",
            href: "/visual-office",
            stats: data.stats.visualSpaces,
          },
        ].map((item) => (
          <Link key={item.href} href={item.href}>
            <Card className="h-full rounded-3xl transition-colors hover:bg-muted/40">
              <CardHeader>
                <CardTitle>{item.title}</CardTitle>
                <CardDescription>{item.description}</CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">Ouvrir la vue →</CardContent>
              <CardContent className="text-xs text-muted-foreground pt-0">
                {item.stats > 0 ? `${item.stats} ${item.title === "Tasks" ? "tâches" : item.title === "Docs" ? "docs" : item.title === "Projects" ? "projets" : item.title === "Memory" ? "fichiers" : item.title === "Calendar" ? "événements" : item.title === "Team" ? "membres" : "espaces"}` : "Aucune donnée"}
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid gap-6">
        <DecisionPromptCard prompt={decisionPrompt} decisions={data.decisions} />
        {secondaryDecisionPrompt ? <DecisionPromptCard prompt={secondaryDecisionPrompt} decisions={data.decisions} /> : null}
        <MissionOverview data={data} />
        <MemorySection memory={data.memory.slice(0, 3)} />
        <ProjectsSection projects={data.projects.slice(0, 4)} />
        <TasksSection tasks={data.tasks.slice(0, 12)} />
        <DocsSection docs={data.docs.slice(0, 6)} />
      </div>
    </MissionControlShell>
  );
}
