import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getDecisionFocusLabel } from "@/lib/decision-engine";
import type { MissionControlData } from "@/lib/mission-control";

export function MissionOverview({ data }: { data: MissionControlData }) {
  const nextEvent = data.calendar[0];
  const liveTasks = data.tasks.filter((task) => task.scope === "live" && !task.done).slice(0, 5);
  const currentFocus = getDecisionFocusLabel(data.decisions.current?.selectedOptionId);
  const activeMembers = data.team.filter((member) => member.status === "active");
  const occupiedRooms = data.visualOffice.filter((space) => data.team.some((member) => member.currentRoom === space.id));
  const topRooms = data.visualOffice
    .map((space) => ({
      ...space,
      occupants: data.team.filter((member) => member.currentRoom === space.id),
      openTasks: data.tasks.filter((task) => !task.done && (space.taskCategory ? task.category === space.taskCategory : task.scope === "live")),
    }))
    .sort((a, b) => b.occupants.length - a.occupants.length || b.openTasks.length - a.openTasks.length)
    .slice(0, 3);

  return (
    <div className="grid gap-6">
      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Card className="rounded-3xl">
          <CardHeader>
            <CardTitle>Operator picture</CardTitle>
            <CardDescription>Lecture cockpit plus stratégique: cap, exécution, équipe, rooms et pression immédiate.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {[
              { label: "Execution pressure", value: `${data.stats.liveOpenTasks} open`, href: "/tasks" },
              { label: "Active team", value: `${activeMembers.length} online`, href: "/team" },
              { label: "Occupied rooms", value: `${occupiedRooms.length}/${data.stats.visualSpaces}`, href: "/visual-office" },
              { label: "Calendar pressure", value: `${data.stats.upcomingEvents} upcoming`, href: "/calendar" },
            ].map((item) => (
              <Link key={item.label} href={item.href} className="rounded-2xl border p-4 transition-colors hover:bg-muted/40">
                <p className="text-sm text-muted-foreground">{item.label}</p>
                <p className="mt-1 text-xl font-medium">{item.value}</p>
              </Link>
            ))}
          </CardContent>
        </Card>

        <Card className="rounded-3xl">
          <CardHeader>
            <CardTitle>Next trigger</CardTitle>
            <CardDescription>Ce qui arrive en premier dans la fenêtre opérateur.</CardDescription>
          </CardHeader>
          <CardContent>
            {nextEvent ? (
              <div className="rounded-2xl border p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">{nextEvent.title}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(nextEvent.start))}</p>
                    {nextEvent.location ? <p className="mt-1 text-xs text-muted-foreground">{nextEvent.location}</p> : null}
                  </div>
                  <Badge variant="secondary">{nextEvent.source?.replace(/^google-calendar:/, "") || "calendar"}</Badge>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed p-4 text-sm text-muted-foreground">Aucun événement imminent détecté.</div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="rounded-3xl">
          <CardHeader>
            <CardTitle>Room pulse</CardTitle>
            <CardDescription>Les salles qui concentrent vraiment l’activité et la pression d’exécution.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 lg:grid-cols-3">
            {topRooms.map((room) => (
              <Link key={room.id} href={room.linkedView ?? "/visual-office"} className="rounded-2xl border p-4 transition-colors hover:bg-muted/30">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">{room.name}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{room.progressLabel ?? room.roomType ?? "room"}</p>
                  </div>
                  <Badge variant="outline">{room.occupants.length} agent{room.occupants.length > 1 ? "s" : ""}</Badge>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {room.occupants.map((member) => (
                    <Badge key={member.id} variant="secondary">{member.emoji ?? "•"} {member.name}</Badge>
                  ))}
                </div>
                <p className="mt-3 text-sm text-muted-foreground">{room.openTasks.length} task{room.openTasks.length > 1 ? "s" : ""} visibles dans cette room.</p>
              </Link>
            ))}
          </CardContent>
        </Card>

        <Card className="rounded-3xl">
          <CardHeader>
            <CardTitle>Focus stack</CardTitle>
            <CardDescription>Ce qui tient ensemble la décision active, l’équipe et les chantiers du moment.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-2xl border p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Current focus</p>
              <p className="mt-2 text-2xl font-semibold">{currentFocus}</p>
              <p className="mt-2 text-sm text-muted-foreground">
                {data.decisions.current ? `Choix actif: ${data.decisions.current.selectedLabel}` : "Aucun arbitrage explicite sélectionné pour l’instant."}
              </p>
            </div>
            <div className="rounded-2xl border p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Live owners</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {activeMembers.map((member) => (
                  <Badge key={member.id} variant="outline">{member.emoji ?? "•"} {member.name}</Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-3xl">
        <CardHeader>
          <CardTitle>Decision impact</CardTitle>
          <CardDescription>Le cockpit commence à refléter le dernier arbitrage choisi.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
          <div className="rounded-2xl border p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Current focus</p>
            <p className="mt-2 text-2xl font-semibold">{currentFocus}</p>
            <p className="mt-2 text-sm text-muted-foreground">
              {data.decisions.current ? `Choix actif: ${data.decisions.current.selectedLabel}` : "Aucun arbitrage explicite sélectionné pour l’instant."}
            </p>
          </div>
          <div className="rounded-2xl border p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Operational consequence</p>
            <p className="mt-2 text-sm text-muted-foreground">
              {data.decisions.current?.selectedOptionId === "prioritize-sales" && "Les signaux commerciaux deviennent prioritaires dans la lecture du cockpit et dans les prochains arbitrages."}
              {data.decisions.current?.selectedOptionId === "prioritize-delivery" && "Mission Control et l’exécution technique restent au centre de l’attention immédiate."}
              {data.decisions.current?.selectedOptionId === "prioritize-strategy" && "Le cockpit assume une lecture plus stratégique des signaux au lieu de pousser l’exécution brute."}
              {data.decisions.current?.selectedOptionId === "schedule-calendar-review" && "La pression calendrier devient un facteur majeur dans les prochains choix proposés."}
              {data.decisions.current?.selectedOptionId === "reduce-open-fronts" && "Le système pousse implicitement vers moins de dispersion et plus de concentration opérationnelle."}
              {!data.decisions.current && "Choisis un cap pour que le cockpit commence à refléter activement ta décision."}
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <Card className="rounded-3xl">
          <CardHeader>
            <CardTitle>Source readiness</CardTitle>
            <CardDescription>État réel des sources canoniques locales.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.sources.map((source) => (
              <div key={source.path} className="flex items-center justify-between rounded-2xl border p-3 text-sm">
                <div>
                  <p className="font-medium">{source.label}</p>
                  <p className="font-mono text-xs text-muted-foreground">{source.path}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={source.exists ? "secondary" : "destructive"}>{source.exists ? "ready" : "missing"}</Badge>
                  <Badge variant="outline">{source.entries}</Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="rounded-3xl">
          <CardHeader>
            <CardTitle>Live execution queue</CardTitle>
            <CardDescription>Extraits du flux d’exécution ARPAGONA vraiment vivant.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {liveTasks.length === 0 ? (
              <div className="rounded-2xl border border-dashed p-4 text-sm text-muted-foreground">Aucune tâche live ouverte détectée.</div>
            ) : (
              liveTasks.map((task) => (
                <div key={`${task.path}:${task.line}:${task.text}`} className="rounded-2xl border p-4">
                  <p className="font-medium">{task.text}</p>
                  <p className="mt-1 font-mono text-xs text-muted-foreground">{task.path}:{task.line}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Badge variant="outline">{task.category}</Badge>
                    <Badge variant={task.priority === "high" ? "destructive" : task.priority === "medium" ? "secondary" : "outline"}>
                      {task.priority}
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
