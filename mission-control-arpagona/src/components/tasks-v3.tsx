import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import type { TaskItem, TeamMember, VisualOfficeSpace } from "@/lib/mission-control";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatDay(value: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date(value));
}

export function TasksV3Section({
  tasks,
  team,
  visualOffice,
}: {
  tasks: TaskItem[];
  team: TeamMember[];
  visualOffice: VisualOfficeSpace[];
}) {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay()); // Monday
  
  // Categorize tasks by time horizon
  const todayTasks = tasks.filter((task) => {
    const taskDate = new Date(task.createdAt || now);
    return taskDate >= todayStart && taskDate < new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);
  });
  
  const thisWeekTasks = tasks.filter((task) => {
    const taskDate = new Date(task.createdAt || now);
    return taskDate >= weekStart && taskDate < new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000);
  });
  
  const liveTasks = tasks.filter((task) => task.scope === "live");
  const archiveTasks = tasks.filter((task) => task.scope === "archive");
  
  // Calculate business impact metrics
  const revenueTasks = liveTasks.filter(task => 
    task.text.toLowerCase().includes("prospect") || 
    task.text.toLowerCase().includes("outreach") ||
    task.text.toLowerCase().includes("call") ||
    task.text.toLowerCase().includes("message") ||
    task.text.toLowerCase().includes("paid") ||
    task.text.toLowerCase().includes("revenue")
  );
  
  const deliveryTasks = liveTasks.filter(task => 
    task.text.toLowerCase().includes("build") || 
    task.text.toLowerCase().includes("demo") ||
    task.text.toLowerCase().includes("landing page") ||
    task.text.toLowerCase().includes("site")
  );
  
  const operationalTasks = liveTasks.filter(task => 
    task.text.toLowerCase().includes("memory") || 
    task.text.toLowerCase().includes("site") ||
    task.text.toLowerCase().includes("contact") ||
    task.text.toLowerCase().includes("page") ||
    task.text.toLowerCase().includes("calendar")
  );
  
  // Connect tasks to rooms and agents
  const roomTasks = visualOffice.map(room => ({
    room,
    tasks: liveTasks.filter(task => 
      room.taskCategory ? task.category === room.taskCategory : true
    ).slice(0, 3)
  }));
  
  const agentTasks = team.map(agent => ({
    agent,
    tasks: liveTasks.filter(task => 
      agent.currentTask && task.text.toLowerCase().includes(agent.currentTask.toLowerCase())
    ).slice(0, 2)
  }));

  return (
    <div className="grid gap-6">
      {/* Business Execution Overview */}
      <Card className="rounded-3xl">
        <CardHeader>
          <CardTitle>Business Execution Dashboard</CardTitle>
          <CardDescription>Exécution ARPAGONA connectée aux objectifs stratégiques et opérationnels.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 lg:grid-cols-4">
            <div className="rounded-2xl border p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Live Tasks</p>
              <p className="mt-2 text-3xl font-semibold">{liveTasks.length}</p>
              <p className="mt-3 text-sm text-muted-foreground">tâches prioritaires en cours</p>
            </div>
            <div className="rounded-2xl border p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Revenue Tasks</p>
              <p className="mt-2 text-3xl font-semibold">{revenueTasks.length}</p>
              <p className="mt-3 text-sm text-muted-foreground">tâches liées à la génération de revenus</p>
            </div>
            <div className="rounded-2xl border p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Delivery Tasks</p>
              <p className="mt-2 text-3xl font-semibold">{deliveryTasks.length}</p>
              <p className="mt-3 text-sm text-muted-foreground">tâches de livraison et construction</p>
            </div>
            <div className="rounded-2xl border p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Operational Tasks</p>
              <p className="mt-2 text-3xl font-semibold">{operationalTasks.length}</p>
              <p className="mt-3 text-sm text-muted-foreground">tâches opérationnelles et mémoire</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Time-Based Execution */}
      <Card className="rounded-3xl">
        <CardHeader>
          <CardTitle>Exécution par horizon temporel</CardTitle>
          <CardDescription>Priorisation dynamique basée sur l'urgence et l'impact business.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="space-y-4">
              <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">Aujourd'hui</h3>
              {todayTasks.length > 0 ? (
                todayTasks.map((task) => (
                  <TaskCard key={`${task.path}:${task.line}:${task.text}`} task={task} />
                ))
              ) : (
                <div className="rounded-2xl border border-dashed p-6 text-sm text-muted-foreground">
                  Aucun task aujourd'hui
                </div>
              )}
            </div>
            
            <div className="space-y-4">
              <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">Cette Semaine</h3>
              {thisWeekTasks.length > 0 ? (
                thisWeekTasks.map((task) => (
                  <TaskCard key={`${task.path}:${task.line}:${task.text}`} task={task} />
                ))
              ) : (
                <div className="rounded-2xl border border-dashed p-6 text-sm text-muted-foreground">
                  Aucun task cette semaine
                </div>
              )}
            </div>
            
            <div className="space-y-4">
              <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">Live Prioritaires</h3>
              {liveTasks.length > 0 ? (
                liveTasks.slice(0, 5).map((task) => (
                  <TaskCard key={`${task.path}:${task.line}:${task.text}`} task={task} />
                ))
              ) : (
                <div className="rounded-2xl border border-dashed p-6 text-sm text-muted-foreground">
                  Aucun task live
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Room-Based Execution */}
      <Card className="rounded-3xl">
        <CardHeader>
          <CardTitle>Exécution par salle</CardTitle>
          <CardDescription>Tâches visibles dans chaque salle opérationnelle.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 lg:grid-cols-2">
            {roomTasks.map(({ room, tasks: roomTasks }) => (
              <div key={room.id} className="rounded-2xl border p-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">{room.name}</h3>
                  <Badge variant="outline">{roomTasks.length}</Badge>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{room.purpose}</p>
                <div className="mt-3 space-y-2">
                  {roomTasks.length > 0 ? (
                    roomTasks.map((task) => (
                      <TaskCard key={`${room.id}:${task.path}:${task.line}`} task={task} compact />
                    ))
                  ) : (
                    <div className="rounded-xl border border-dashed px-3 py-2 text-xs text-muted-foreground">
                      Aucun task visible
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Agent Assignment */}
      <Card className="rounded-3xl">
        <CardHeader>
          <CardTitle>Assignation aux agents</CardTitle>
          <CardDescription>Tâches connectées aux agents et à leur focus actuel.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 lg:grid-cols-2">
            {agentTasks.map(({ agent, tasks: agentTasks }) => (
              <div key={agent.id} className="rounded-2xl border p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{agent.emoji} {agent.name}</p>
                    <p className="text-xs text-muted-foreground">{agent.role}</p>
                  </div>
                  <Badge variant="outline">{agentTasks.length}</Badge>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{agent.currentTask}</p>
                <div className="mt-3 space-y-2">
                  {agentTasks.length > 0 ? (
                    agentTasks.map((task) => (
                      <TaskCard key={`${agent.id}:${task.path}:${task.line}`} task={task} compact />
                    ))
                  ) : (
                    <div className="rounded-xl border border-dashed px-3 py-2 text-xs text-muted-foreground">
                      Aucun task assigné
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Business Impact View */}
      <Card className="rounded-3xl">
        <CardHeader>
          <CardTitle>Impact Business</CardTitle>
          <CardDescription>Tâches classées par impact sur les objectifs ARPAGONA.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 lg:grid-cols-3">
            <div className="space-y-4">
              <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">Revenue</h3>
              {revenueTasks.length > 0 ? (
                revenueTasks.map((task) => (
                  <TaskCard key={`${task.path}:${task.line}:${task.text}`} task={task} />
                ))
              ) : (
                <div className="rounded-2xl border border-dashed p-6 text-sm text-muted-foreground">
                  Aucun task de revenue
                </div>
              )}
            </div>
            
            <div className="space-y-4">
              <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">Livraison</h3>
              {deliveryTasks.length > 0 ? (
                deliveryTasks.map((task) => (
                  <TaskCard key={`${task.path}:${task.line}:${task.text}`} task={task} />
                ))
              ) : (
                <div className="rounded-2xl border border-dashed p-6 text-sm text-muted-foreground">
                  Aucun task de livraison
                </div>
              )}
            </div>
            
            <div className="space-y-4">
              <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">Opérationnel</h3>
              {operationalTasks.length > 0 ? (
                operationalTasks.map((task) => (
                  <TaskCard key={`${task.path}:${task.line}:${task.text}`} task={task} />
                ))
              ) : (
                <div className="rounded-2xl border border-dashed p-6 text-sm text-muted-foreground">
                  Aucun task opérationnel
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Archive Reference */}
      <Card className="rounded-3xl">
        <CardHeader>
          <CardTitle>Archive des tâches</CardTitle>
          <CardDescription>Références historiques séparées du flux live.</CardDescription>
          <Badge variant="outline" className="ml-auto">
            {archiveTasks.length}
          </Badge>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-3">
              {archiveTasks.length > 0 ? (
                archiveTasks.map((task) => (
                  <TaskCard key={`${task.path}:${task.line}:${task.text}`} task={task} />
                ))
              ) : (
                <div className="flex h-full items-center justify-center text-muted-foreground">
                  Aucun signal archivé disponible
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}

function TaskCard({ task, compact = false }: { task: TaskItem; compact?: boolean }) {
  return (
    <article className="rounded-2xl border p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-medium">{task.text}</p>
          <p className="mt-1 font-mono text-xs text-muted-foreground">
            {task.path}:{task.line}
          </p>
          {!compact && (
            <div className="mt-2 flex flex-wrap gap-2">
              <Badge variant="outline">{task.category}</Badge>
              <Badge variant={task.priority === "high" ? "destructive" : task.priority === "medium" ? "secondary" : "outline"}>
                {task.priority}
              </Badge>
            </div>
          )}
        </div>
        <Badge variant={task.done ? "secondary" : "destructive"}>{task.done ? "Done" : "Open"}</Badge>
      </div>
      {task.createdAt && !compact && (
        <p className="mt-2 text-xs text-muted-foreground">
          Créé: {formatDate(task.createdAt)}
        </p>
      )}
    </article>
  );
}
