import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type SidebarProps = {
  stats: {
    markdownDocs: number;
    memoryFiles: number;
    openTasks: number;
    completedTasks: number;
    projectFiles: number;
  };
};

const sections = [
  { key: "memory", label: "Memory", hint: "Journal & notes" },
  { key: "docs", label: "Docs", hint: "Corpus workspace" },
  { key: "projects", label: "Projects", hint: "ARPAGONA focus" },
  { key: "tasks", label: "Tasks", hint: "Execution radar" },
];

export function MissionSidebar({ stats }: SidebarProps) {
  return (
    <Card className="rounded-3xl border-border/70 bg-card/80 shadow-sm">
      <CardHeader>
        <CardTitle className="text-base">Control stack</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          {sections.map((section) => (
            <a
              key={section.key}
              href={`#${section.key}`}
              className="flex items-center justify-between rounded-2xl border px-3 py-3 text-sm transition-colors hover:bg-muted/60"
            >
              <div>
                <p className="font-medium">{section.label}</p>
                <p className="text-xs text-muted-foreground">{section.hint}</p>
              </div>
              <span className="text-muted-foreground">→</span>
            </a>
          ))}
        </div>

        <div className="space-y-3 rounded-2xl border p-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Open tasks</span>
            <Badge variant="destructive">{stats.openTasks}</Badge>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Project files</span>
            <Badge variant="secondary">{stats.projectFiles}</Badge>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Memory files</span>
            <Badge variant="outline">{stats.memoryFiles}</Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
