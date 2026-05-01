import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { CalendarEvent, TaskItem, TeamMember, VisualOfficeSpace } from "@/lib/mission-control";

function formatDay(value: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date(value));
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function calendarSourceLabel(source?: string) {
  return source?.replace(/^google-calendar:/, "") || "unknown";
}

export function CalendarSection({ events, nowIso }: { events: CalendarEvent[]; nowIso: string }) {
  const now = new Date(nowIso).getTime();
  const next24h = events.filter((event) => {
    const start = new Date(event.start).getTime();
    return start >= now && start <= now + 24 * 60 * 60 * 1000;
  });

  const groupedByDay = events.reduce<Record<string, CalendarEvent[]>>((acc, event) => {
    const key = new Date(event.start).toISOString().slice(0, 10);
    acc[key] ||= [];
    acc[key].push(event);
    return acc;
  }, {});

  const days = Object.entries(groupedByDay)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([day, dayEvents]) => ({
      day,
      events: dayEvents.sort((a, b) => a.start.localeCompare(b.start)),
    }));

  const sources = Array.from(new Set(events.map((event) => calendarSourceLabel(event.source)))).sort();

  return (
    <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
      <Card className="rounded-3xl">
        <CardHeader>
          <CardTitle>Calendar status</CardTitle>
          <CardDescription>Source canonique locale: `state/calendar.json`.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <div className="flex items-center justify-between rounded-2xl border p-3">
            <span>Upcoming events</span>
            <Badge variant="outline">{events.length}</Badge>
          </div>
          <div className="flex items-center justify-between rounded-2xl border p-3">
            <span>Next 24h</span>
            <Badge variant="secondary">{next24h.length}</Badge>
          </div>
          <div className="flex items-center justify-between rounded-2xl border p-3">
            <span>Visible calendars</span>
            <Badge variant="outline">{sources.length}</Badge>
          </div>
          <div className="rounded-2xl border p-3">
            <p className="mb-2 text-xs uppercase tracking-wide text-muted-foreground">Sources</p>
            <div className="flex flex-wrap gap-2">
              {sources.map((source) => (
                <Badge key={source} variant="outline">
                  {source}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-3xl">
        <CardHeader>
          <CardTitle>Upcoming timeline</CardTitle>
          <CardDescription>Groupé par jour, avec source calendrier visible sur chaque événement.</CardDescription>
        </CardHeader>
        <CardContent>
          {events.length === 0 ? (
            <div className="rounded-2xl border border-dashed p-6 text-sm text-muted-foreground">
              Aucun événement réel détecté pour le moment.
            </div>
          ) : (
            <div className="space-y-6">
              {days.map(({ day, events: dayEvents }) => (
                <section key={day} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium capitalize">{formatDay(day)}</h3>
                    <Badge variant="secondary">{dayEvents.length}</Badge>
                  </div>
                  <div className="space-y-3">
                    {dayEvents.map((event) => (
                      <article key={event.id} className="rounded-2xl border p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-medium">{event.title}</p>
                            <p className="mt-1 text-xs text-muted-foreground">
                              {formatTime(event.start)}
                              {event.end ? ` → ${formatTime(event.end)}` : ""}
                            </p>
                            {event.location ? <p className="mt-1 text-xs text-muted-foreground">{event.location}</p> : null}
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <Badge variant="outline">{event.status ?? "scheduled"}</Badge>
                            <Badge variant="secondary">{calendarSourceLabel(event.source)}</Badge>
                          </div>
                        </div>
                        {event.notes ? <p className="mt-3 text-sm text-muted-foreground">{event.notes}</p> : null}
                      </article>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export function TeamSection({ members }: { members: TeamMember[] }) {
  return (
    <Card className="rounded-3xl">
      <CardHeader>
        <CardTitle>Team</CardTitle>
        <CardDescription>Source canonique locale: `state/team.json`.</CardDescription>
      </CardHeader>
      <CardContent>
        {members.length === 0 ? (
          <div className="rounded-2xl border border-dashed p-6 text-sm text-muted-foreground">
            Aucun membre réel renseigné pour le moment.
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {members.map((member) => (
              <article key={member.id} className="rounded-2xl border p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">{member.emoji ? `${member.emoji} ` : ""}{member.name}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{member.role ?? "role undefined"}</p>
                  </div>
                  <Badge variant="outline">{member.status ?? "unknown"}</Badge>
                </div>
                {member.focus ? <p className="mt-3 text-sm text-muted-foreground">{member.focus}</p> : null}
              </article>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function VisualOfficeSection({ spaces, members, tasks }: { spaces: VisualOfficeSpace[]; members: TeamMember[]; tasks: TaskItem[] }) {
  const rooms = spaces.map((space) => {
    const occupants = members.filter((member) => member.currentRoom === space.id);
    const relevantTasks = tasks
      .filter((task) => !task.done)
      .filter((task) => (space.taskCategory ? task.category === space.taskCategory : true))
      .slice(0, 3);
    const avgProgress = occupants.length
      ? Math.round(occupants.reduce((sum, member) => sum + (member.progress ?? 0), 0) / occupants.length)
      : 0;

    return { ...space, occupants, relevantTasks, avgProgress };
  });

  const zoneOrder = ["executive-wing", "commercial-wing", "operations-wing", "coordination-wing", "knowledge-wing"];
  const grouped = zoneOrder
    .map((zone) => ({ zone, rooms: rooms.filter((room) => room.zone === zone) }))
    .filter((group) => group.rooms.length > 0);

  const highPriorityTasks = tasks.filter((task) => !task.done && task.priority === "high").slice(0, 6);
  const activeAgents = members.filter((member) => member.status === "active");

  return (
    <div className="grid gap-6">
      <Card className="rounded-3xl">
        <CardHeader>
          <CardTitle>Office live pulse</CardTitle>
          <CardDescription>Vue instantanée de l’entreprise symbolique: agents actifs, salles occupées, et pression d’exécution.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 lg:grid-cols-4">
            <div className="rounded-2xl border p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Active agents</p>
              <p className="mt-2 text-3xl font-semibold">{activeAgents.length}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {activeAgents.map((member) => (
                  <Badge key={member.id} variant="outline">{member.emoji ?? "•"} {member.name}</Badge>
                ))}
              </div>
            </div>
            <div className="rounded-2xl border p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Occupied rooms</p>
              <p className="mt-2 text-3xl font-semibold">{rooms.filter((room) => room.occupants.length > 0).length}</p>
              <p className="mt-3 text-sm text-muted-foreground">sur {rooms.length} salles définies</p>
            </div>
            <div className="rounded-2xl border p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">High priority tasks</p>
              <p className="mt-2 text-3xl font-semibold">{highPriorityTasks.length}</p>
              <p className="mt-3 text-sm text-muted-foreground">pression visible dans les rooms d’exécution</p>
            </div>
            <div className="rounded-2xl border p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Average progress</p>
              <p className="mt-2 text-3xl font-semibold">{Math.round(activeAgents.reduce((sum, member) => sum + (member.progress ?? 0), 0) / Math.max(activeAgents.length, 1))}%</p>
              <p className="mt-3 text-sm text-muted-foreground">moyenne des agents actifs</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
      <Card className="rounded-3xl">
        <CardHeader>
          <CardTitle>Company floor plan</CardTitle>
          <CardDescription>Une vraie entreprise symbolique: salles, agents présents, et progression visible.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative overflow-hidden rounded-[2rem] border bg-[radial-gradient(circle_at_top,rgba(251,191,36,0.12),transparent_35%),radial-gradient(circle_at_20%_20%,rgba(248,113,113,0.1),transparent_22%),radial-gradient(circle_at_80%_10%,rgba(96,165,250,0.1),transparent_25%)] p-4">
            <div className="pointer-events-none absolute inset-0 opacity-40">
              <div className="absolute left-1/2 top-12 h-[calc(100%-6rem)] w-px -translate-x-1/2 bg-border" />
              <div className="absolute left-12 right-12 top-1/2 h-px -translate-y-1/2 bg-border" />
            </div>
            <div className="grid gap-4 lg:grid-cols-2">
              {grouped.map((group) => (
                <section key={group.zone} className="rounded-[1.5rem] border bg-background/70 p-4 backdrop-blur">
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-sm font-semibold uppercase tracking-[0.22em] text-muted-foreground">{group.zone.replace(/-/g, " ")}</h3>
                    <Badge variant="outline">{group.rooms.length}</Badge>
                  </div>
                  <div className="grid gap-3">
                    {group.rooms.map((room) => (
                      <article key={room.id} className="rounded-[1.25rem] border bg-background/85 p-4 shadow-sm transition-transform hover:-translate-y-0.5">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-medium">{room.name}</p>
                            <p className="mt-1 text-xs text-muted-foreground">{room.purpose}</p>
                          </div>
                          <Badge variant="secondary">{room.status ?? "unknown"}</Badge>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <Badge variant="outline">{room.roomType ?? "room"}</Badge>
                          {room.linkedView ? <Badge variant="outline">{room.linkedView}</Badge> : null}
                        </div>
                        <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{room.progressLabel ?? "Progression"}</span>
                          <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                            <div className="h-full rounded-full bg-foreground" style={{ width: `${room.avgProgress}%` }} />
                          </div>
                          <span>{room.avgProgress}%</span>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {room.occupants.length > 0 ? room.occupants.map((member) => (
                            <Badge key={member.id} variant="outline">{member.emoji ?? "•"} {member.name}</Badge>
                          )) : <Badge variant="outline">No active agent</Badge>}
                        </div>
                      </article>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-3xl">
        <CardHeader>
          <CardTitle>Room boards</CardTitle>
          <CardDescription>Pour chaque salle: présence, mission en cours, et progression des tâches visibles.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            {rooms.map((room) => (
              <article key={room.id} className="rounded-2xl border p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">{room.name}</p>
                    <p className="mt-1 text-xs uppercase tracking-[0.18em] text-muted-foreground">{room.roomType ?? "room"}</p>
                  </div>
                  <Badge variant="outline">{room.linkedView}</Badge>
                </div>
                <p className="mt-3 text-sm text-muted-foreground">{room.signal}</p>

                <div className="mt-4 space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Agents in room</p>
                  {room.occupants.length > 0 ? room.occupants.map((member) => (
                    <div key={member.id} className="rounded-xl border px-3 py-2 text-sm">
                      <div className="flex items-center justify-between gap-3">
                        <span>{member.emoji ? `${member.emoji} ` : ""}{member.name}</span>
                        <span className="text-xs text-muted-foreground">{member.progress ?? 0}%</span>
                      </div>
                      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                        <div className="h-full rounded-full bg-foreground" style={{ width: `${member.progress ?? 0}%` }} />
                      </div>
                      {member.currentTask ? <p className="mt-1 text-xs text-muted-foreground">{member.currentTask}</p> : null}
                    </div>
                  )) : <div className="rounded-xl border border-dashed px-3 py-2 text-xs text-muted-foreground">No assigned agent.</div>}
                </div>

                <div className="mt-4 space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Visible task flow</p>
                  {room.relevantTasks.length > 0 ? room.relevantTasks.map((task) => (
                    <div key={`${room.id}:${task.path}:${task.line}`} className="rounded-xl border px-3 py-2 text-sm">
                      <div className="flex items-center justify-between gap-3">
                        <span>{task.text}</span>
                        <Badge variant={task.priority === "high" ? "destructive" : task.priority === "medium" ? "secondary" : "outline"}>{task.priority}</Badge>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">{task.category} · {task.path}:{task.line}</p>
                    </div>
                  )) : <div className="rounded-xl border border-dashed px-3 py-2 text-xs text-muted-foreground">No directly mapped live task.</div>}
                </div>
              </article>
            ))}
          </div>
        </CardContent>
      </Card>
      </div>
    </div>
  );
}
