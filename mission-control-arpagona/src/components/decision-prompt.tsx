import { recordDecision } from "@/app/actions";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { DecisionPrompt, DecisionsState } from "@/lib/decision-engine";

export function DecisionPromptCard({ prompt, decisions }: { prompt: DecisionPrompt; decisions: DecisionsState }) {
  return (
    <Card className="rounded-3xl border-foreground/10 bg-background/85">
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <div>
            <CardTitle>Decision prompt</CardTitle>
            <CardDescription>{prompt.context}</CardDescription>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Badge variant="outline">{prompt.kind === "primary" ? "Primary" : "Secondary"}</Badge>
            {decisions.current ? <Badge variant="secondary">Dernier choix: {decisions.current.selectedLabel}</Badge> : null}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-xl font-semibold tracking-tight">{prompt.question}</p>
        </div>
        <div className="grid gap-3 lg:grid-cols-2">
          {prompt.options.map((option) => (
            <form key={option.id} action={recordDecision}>
              <input type="hidden" name="promptId" value={prompt.id} />
              <input type="hidden" name="kind" value={prompt.kind} />
              <input type="hidden" name="question" value={prompt.question} />
              <input type="hidden" name="selectedOptionId" value={option.id} />
              <input type="hidden" name="selectedLabel" value={option.label} />
              <button
                type="submit"
                className="flex h-full w-full flex-col items-start rounded-2xl border bg-background/70 p-4 text-left transition-colors hover:bg-muted/40"
              >
                <span className="font-medium">{option.label}</span>
                <span className="mt-2 text-sm text-muted-foreground">{option.rationale}</span>
              </button>
            </form>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
