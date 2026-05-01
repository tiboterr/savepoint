import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import type { FileSummary, TaskItem } from "@/lib/mission-control";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatSize(size: number) {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

export function MemorySection({ memory }: { memory: FileSummary[] }) {
  return (
    <Card className="rounded-3xl">
      <CardHeader>
        <CardTitle>Memory feed</CardTitle>
        <CardDescription>Derniers fichiers mémoire réellement présents dans le workspace.</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[620px] pr-4">
          <div className="space-y-4">
                    {memory.map((item) => (
                      <Link key={item.path} href={`/memory/view/${item.path.split("/").map(encodeURIComponent).join("/")}`}>
                      <article className="rounded-2xl border p-4 transition-colors hover:bg-muted/30">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <h3 className="font-medium">{item.title}</h3>
                    <p className="font-mono text-xs text-muted-foreground">{item.path}</p>
                  </div>
                  <Badge variant="outline">{formatDate(item.updatedAt)}</Badge>
                        </div>
                        <p className="mt-3 text-sm text-muted-foreground">{item.excerpt || "Aperçu indisponible."}</p>
                      </article>
                      </Link>
                    ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

export function DocsSection({ docs }: { docs: FileSummary[] }) {
  return (
    <Card className="rounded-3xl">
      <CardHeader>
        <CardTitle>Docs explorer</CardTitle>
        <CardDescription>Markdown, JSON et notes repérés dans les zones utiles du workspace.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 lg:grid-cols-2">
          {docs.map((item) => (
            <Link key={item.path} href={`/docs/view/${item.path.split("/").map(encodeURIComponent).join("/")}`}>
            <article className="rounded-2xl border p-4 transition-colors hover:bg-muted/30">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-medium">{item.title}</h3>
                  <p className="mt-1 font-mono text-xs text-muted-foreground">{item.path}</p>
                </div>
                <Badge variant="outline">{formatSize(item.size)}</Badge>
              </div>
              <Separator className="my-3" />
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{formatDate(item.updatedAt)}</span>
              </div>
              <p className="mt-3 text-sm text-muted-foreground">{item.excerpt || "Aperçu indisponible."}</p>
            </article>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function ProjectsSection({ projects }: { projects: FileSummary[] }) {
  return (
    <Card className="rounded-3xl">
      <CardHeader>
        <CardTitle>Project focus</CardTitle>
        <CardDescription>Sources stratégiques ARPAGONA actuellement suivies.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 lg:grid-cols-2">
          {projects.map((item) => (
            <article key={item.path} className="rounded-2xl border p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-medium">{item.title}</h3>
                  <p className="mt-1 font-mono text-xs text-muted-foreground">{item.path}</p>
                </div>
                <Badge>{formatDate(item.updatedAt)}</Badge>
              </div>
              <p className="mt-3 text-sm text-muted-foreground">{item.excerpt || "Aperçu indisponible."}</p>
            </article>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function TasksSection({ tasks }: { tasks: TaskItem[] }) {
  const liveTasks = tasks.filter((task) => task.scope === "live");
  const archiveTasks = tasks.filter((task) => task.scope === "archive");

  return (
    <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
      <Card className="rounded-3xl">
        <CardHeader>
          <CardTitle>Live execution</CardTitle>
          <CardDescription>Signal prioritaire pour l’exécution ARPAGONA en cours.</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[620px] pr-4">
            <div className="space-y-3">
              {liveTasks.map((task) => (
                <TaskRow key={`${task.path}:${task.line}:${task.text}`} task={task} />
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      <Card className="rounded-3xl">
        <CardHeader>
          <CardTitle>Archive backlog</CardTitle>
          <CardDescription>Références anciennes gardées visibles, mais séparées du flux live.</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[620px] pr-4">
            <div className="space-y-3">
              {archiveTasks.map((task) => (
                <TaskRow key={`${task.path}:${task.line}:${task.text}`} task={task} />
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}

function TaskRow({ task }: { task: TaskItem }) {
  return (
    <article className="rounded-2xl border p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-medium">{task.text}</p>
          <p className="mt-1 font-mono text-xs text-muted-foreground">
            {task.path}:{task.line}
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            <Badge variant="outline">{task.category}</Badge>
            <Badge variant={task.priority === "high" ? "destructive" : task.priority === "medium" ? "secondary" : "outline"}>
              {task.priority}
            </Badge>
          </div>
        </div>
        <Badge variant={task.done ? "secondary" : "destructive"}>{task.done ? "Done" : "Open"}</Badge>
      </div>
    </article>
  );
}
