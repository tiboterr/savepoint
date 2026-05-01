import Link from "next/link";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type EmptyStateProps = {
  title: string;
  description: string;
  sourcePath: string;
  schemaPath: string;
};

export function MissionEmptyState({ title, description, sourcePath, schemaPath }: EmptyStateProps) {
  return (
    <Card className="rounded-3xl border-dashed">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 text-sm text-muted-foreground">
        <div className="rounded-2xl border p-3">
          <p className="font-medium text-foreground">Source attendue</p>
          <p className="font-mono text-xs">{sourcePath}</p>
        </div>
        <div className="rounded-2xl border p-3">
          <p className="font-medium text-foreground">Schéma de référence</p>
          <p className="font-mono text-xs">{schemaPath}</p>
        </div>
        <Link href="/docs" className="inline-flex rounded-xl border px-3 py-2 text-foreground transition-colors hover:bg-muted/40">
          Revenir au cockpit docs →
        </Link>
      </CardContent>
    </Card>
  );
}
