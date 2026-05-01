import Link from "next/link";
import { ReactNode } from "react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { MissionControlData } from "@/lib/mission-control";

type ShellProps = {
  data: MissionControlData;
  current: "overview" | "memory" | "docs" | "projects" | "tasks" | "calendar" | "team" | "visual-office";
  title: string;
  description: string;
  children: ReactNode;
};

const sections = [
  { key: "overview", label: "Overview", href: "/" },
  { key: "memory", label: "Memory", href: "/memory" },
  { key: "docs", label: "Docs", href: "/docs" },
  { key: "projects", label: "Projects", href: "/projects" },
  { key: "tasks", label: "Tasks", href: "/tasks" },
  { key: "calendar", label: "Calendar", href: "/calendar" },
  { key: "team", label: "Team", href: "/team" },
  { key: "visual-office", label: "Visual Office", href: "/visual-office" },
] as const;

export function MissionControlShell({ data, current, title, description, children }: ShellProps) {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_20%_0%,rgba(34,211,238,0.1),transparent_20%),radial-gradient(circle_at_70%_10%,rgba(168,85,247,0.12),transparent_22%),radial-gradient(circle_at_50%_100%,rgba(244,63,94,0.08),transparent_24%)] px-0 py-0 text-foreground">
      <div className="mx-auto mb-0 flex w-[min(100vw,1900px)] items-center justify-between gap-6 border-b border-cyan-500/20 bg-[#0a1020]/90 px-8 py-4 backdrop-blur">
        <div className="flex items-center gap-3">
          <div className="h-3 w-3 rounded-full bg-cyan-400 shadow-[0_0_14px_rgba(34,211,238,0.7)]" />
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-300/70">ARPAGONA</p>
            <p className="text-sm font-medium text-white">Mission Control</p>
          </div>
        </div>
        <nav className="hidden flex-wrap items-center gap-4 md:flex">
          {sections.map((section) => {
            const active = section.key === current;
            return (
              <Link
                key={section.key}
                href={section.href}
                className={`text-xs font-semibold uppercase tracking-[0.24em] transition-colors ${
                  active ? "text-cyan-300" : "text-slate-400 hover:text-white"
                }`}
              >
                {section.label}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="mx-auto grid w-[min(100vw,1900px)] gap-0 xl:grid-cols-[340px_minmax(0,1fr)]">
        <aside className="min-h-screen border-r border-cyan-500/20 bg-[#0d1628] xl:sticky xl:top-0 xl:self-start">
          <Card className="rounded-none border-0 bg-transparent shadow-none">
            <CardHeader className="border-b border-cyan-500/20 px-6 py-8">
              <div className="space-y-4">
                <div className="text-5xl">🐙</div>
                <div className="rounded-2xl border border-cyan-500/30 bg-[#101c32] p-5 shadow-[0_0_25px_rgba(34,211,238,0.08)]">
                  <p className="text-center text-sm font-semibold uppercase tracking-[0.35em] text-white">Mission Control</p>
                </div>
                <div className="flex items-center gap-3 text-sm uppercase tracking-[0.2em] text-cyan-300">
                  <span className="h-2.5 w-2.5 rounded-full bg-cyan-400 shadow-[0_0_12px_rgba(34,211,238,0.7)]" />
                  ARPAGONA ONLINE
                </div>
                <CardTitle className="text-base text-slate-200">Control stack</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-6 px-4 py-6">
              <div className="space-y-2">
                {sections.map((section) => {
                  const active = section.key === current;
                  return (
                    <Link
                      key={section.key}
                      href={section.href}
                      className={`flex items-center justify-between rounded-2xl border px-4 py-4 text-base transition-colors ${
                        active
                          ? "border-cyan-400/50 bg-[#152848] text-white shadow-[0_0_20px_rgba(96,165,250,0.16)]"
                          : "border-transparent text-slate-300 hover:border-cyan-500/20 hover:bg-[#111d34]"
                      }`}
                    >
                      <span className="font-medium">{section.label}</span>
                      <span className={active ? "text-cyan-300" : "text-slate-500"}>•</span>
                    </Link>
                  );
                })}
              </div>

              <div className="space-y-3 rounded-2xl border border-cyan-500/20 bg-[#101a2d] p-4 text-sm text-slate-300">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Live open tasks</span>
                  <Badge variant="destructive">{data.stats.liveOpenTasks}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Archive tasks</span>
                  <Badge variant="outline">{data.stats.archiveTasks}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Project files</span>
                  <Badge variant="secondary">{data.stats.projectFiles}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Upcoming events</span>
                  <Badge variant="outline">{data.stats.upcomingEvents}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Memory files</span>
                  <Badge variant="outline">{data.stats.memoryFiles}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </aside>

        <div className="flex min-h-screen flex-col gap-6 bg-[#080d1a] px-8 py-8">
          <section className="relative overflow-hidden rounded-[2rem] border border-cyan-500/20 bg-[#090f1d] p-8 shadow-[0_0_40px_rgba(34,211,238,0.05)] backdrop-blur">
            <div className="absolute inset-x-0 top-0 h-32 bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.14),transparent_55%),radial-gradient(circle_at_20%_0%,rgba(168,85,247,0.16),transparent_35%),radial-gradient(circle_at_80%_0%,rgba(244,63,94,0.12),transparent_38%)]" />
            <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
              <div className="relative space-y-3">
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-300/70">Local-first cockpit</p>
                <h1 className="text-4xl font-semibold tracking-[0.01em] text-white sm:text-5xl">{title}</h1>
                <p className="max-w-3xl text-sm text-slate-400 sm:text-base">{description}</p>
              </div>
              <div className="grid gap-2 text-sm text-slate-400 sm:text-right">
                <span>Workspace: {data.workspaceRoot}</span>
                <span>Snapshot: {new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(data.generatedAt))}</span>
              </div>
            </div>

            <div className="relative mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-6">
              {[
                ["Docs indexés", data.stats.markdownDocs],
                ["Fichiers mémoire", data.stats.memoryFiles],
                ["Live open tasks", data.stats.liveOpenTasks],
                ["Archive tasks", data.stats.archiveTasks],
                ["Événements", data.stats.upcomingEvents],
                ["Fichiers projet", data.stats.projectFiles],
              ].map(([label, value]) => (
                <Card key={label as string} className="rounded-2xl border-cyan-500/15 bg-[#10182b] backdrop-blur">
                  <CardHeader className="pb-2">
                    <div className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-300/65">{label}</div>
                    <div className="text-3xl font-medium text-white">{String(value)}</div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </section>

          {children}
        </div>
      </div>
    </main>
  );
}
