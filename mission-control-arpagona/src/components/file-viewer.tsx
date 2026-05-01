import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type FileViewerProps = {
  title: string;
  path: string;
  content: string;
  updatedAt?: string;
};

export function FileViewer({ title, path, content, updatedAt }: FileViewerProps) {
  return (
    <Card className="rounded-3xl">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>
          <span className="font-mono text-xs">{path}</span>
          {updatedAt ? (
            <span className="ml-3 text-xs text-muted-foreground">
              {new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(updatedAt))}
            </span>
          ) : null}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <pre className="overflow-x-auto whitespace-pre-wrap rounded-2xl border bg-background/60 p-4 text-sm leading-6 text-foreground">
          {content}
        </pre>
      </CardContent>
    </Card>
  );
}
