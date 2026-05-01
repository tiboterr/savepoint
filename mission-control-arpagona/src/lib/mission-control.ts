import { promises as fs } from "fs";
import path from "path";

import type { DecisionsState } from "@/lib/decision-engine";

const WORKSPACE_ROOT = "/home/thibaud/.openclaw/workspace";
const SKIP_DIRS = new Set([".git", "node_modules", ".next", ".pnpm-store"]);
const DOC_DIRS = [".", "memory", "langflow", "imports/chatgpt-rag-ready/docs", "imports/chatgpt-elite-rag-ready/docs"];
const PROJECT_FILES = [
  "ARPAGONA_ACTION_PLAN.md",
  "ARPAGONA_OFFRES.md",
  "ARPAGONA_SALES_KIT.md",
  "MEMORY.md",
  "USER.md",
];

export type FileSummary = {
  path: string;
  title: string;
  updatedAt: string;
  size: number;
  excerpt: string;
};

export type TaskItem = {
  path: string;
  line: number;
  text: string;
  done: boolean;
  scope: "live" | "archive";
  priority: "high" | "medium" | "low";
  category: "sales" | "offer" | "delivery" | "ops" | "memory" | "general";
  score: number;
};

export type CalendarEvent = {
  id: string;
  title: string;
  start: string;
  end?: string;
  status?: string;
  location?: string;
  notes?: string;
  source?: string;
};

export type TeamMember = {
  id: string;
  name: string;
  role?: string;
  status?: string;
  focus?: string;
  emoji?: string;
  currentRoom?: string;
  currentTask?: string;
  progress?: number;
};

export type VisualOfficeSpace = {
  id: string;
  name: string;
  status?: string;
  purpose?: string;
  zone?: string;
  linkedView?: string;
  sourcePath?: string;
  signal?: string;
  roomType?: string;
  progressLabel?: string;
  taskCategory?: TaskItem["category"];
};

export type StateSourceStatus = {
  path: string;
  exists: boolean;
  entries: number;
  label: string;
};

export type MissionControlData = {
  generatedAt: string;
  workspaceRoot: string;
  stats: {
    markdownDocs: number;
    memoryFiles: number;
    openTasks: number;
    completedTasks: number;
    liveOpenTasks: number;
    archiveTasks: number;
    projectFiles: number;
    upcomingEvents: number;
    teamMembers: number;
    visualSpaces: number;
  };
  memory: FileSummary[];
  docs: FileSummary[];
  projects: FileSummary[];
  tasks: TaskItem[];
  calendar: CalendarEvent[];
  team: TeamMember[];
  visualOffice: VisualOfficeSpace[];
  sources: StateSourceStatus[];
  decisions: DecisionsState;
};

async function statSafe(filePath: string) {
  try {
    return await fs.stat(filePath);
  } catch {
    return null;
  }
}

async function readTextSafe(filePath: string) {
  try {
    return await fs.readFile(filePath, "utf8");
  } catch {
    return "";
  }
}

async function listMarkdownFiles(dirPath: string, depth = 0, maxDepth = 2): Promise<string[]> {
  if (depth > maxDepth) return [];

  const entries = await fs.readdir(dirPath, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    if (entry.name.startsWith(".")) continue;
    const fullPath = path.join(dirPath, entry.name);

    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) continue;
      files.push(...(await listMarkdownFiles(fullPath, depth + 1, maxDepth)));
      continue;
    }

    if (/\.(md|mdx|txt|json)$/i.test(entry.name)) {
      files.push(fullPath);
    }
  }

  return files;
}

function toRelative(filePath: string) {
  return path.relative(WORKSPACE_ROOT, filePath) || ".";
}

function normalizeTitle(relativePath: string, content: string) {
  const firstHeading = content
    .split("\n")
    .find((line) => line.trim().startsWith("#"))
    ?.replace(/^#+\s*/, "")
    .trim();

  return firstHeading || path.basename(relativePath).replace(/\.[^.]+$/, "");
}

function excerptFrom(content: string) {
  return content
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => !line.startsWith("#"))
    .slice(0, 3)
    .join(" ")
    .slice(0, 220);
}

async function summarizeFile(filePath: string): Promise<FileSummary | null> {
  const [stat, content] = await Promise.all([statSafe(filePath), readTextSafe(filePath)]);
  if (!stat) return null;

  const relativePath = toRelative(filePath);

  return {
    path: relativePath,
    title: normalizeTitle(relativePath, content),
    updatedAt: stat.mtime.toISOString(),
    size: stat.size,
    excerpt: excerptFrom(content),
  };
}

async function getMemoryFiles() {
  const memoryDir = path.join(WORKSPACE_ROOT, "memory");
  const files = await listMarkdownFiles(memoryDir, 0, 2);
  const summaries = (await Promise.all(files.map(summarizeFile))).filter(Boolean) as FileSummary[];

  return summaries.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 8);
}

async function getDocFiles() {
  const collected = new Set<string>();

  for (const dir of DOC_DIRS) {
    const absoluteDir = path.join(WORKSPACE_ROOT, dir);
    const stat = await statSafe(absoluteDir);
    if (!stat?.isDirectory()) continue;

    const maxDepth = dir === "." ? 1 : 2;
    const files = await listMarkdownFiles(absoluteDir, 0, maxDepth);
    for (const file of files) {
      const relative = toRelative(file);
      if (relative.startsWith("mission-control-arpagona/")) continue;
      collected.add(file);
    }
  }

  const summaries = (await Promise.all(Array.from(collected).map(summarizeFile))).filter(Boolean) as FileSummary[];

  return summaries
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, 16);
}

async function getProjectFiles() {
  const summaries = (
    await Promise.all(
      PROJECT_FILES.map((file) => summarizeFile(path.join(WORKSPACE_ROOT, file)))
    )
  ).filter(Boolean) as FileSummary[];

  return summaries.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

async function readJsonSafe<T>(filePath: string, fallback: T): Promise<T> {
  try {
    const raw = await fs.readFile(filePath, "utf8");
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

async function getCalendarEvents() {
  const data = await readJsonSafe<{ events?: CalendarEvent[] }>(
    path.join(WORKSPACE_ROOT, "state/calendar.json"),
    { events: [] }
  );

  return (data.events ?? [])
    .filter((event) => event.title && event.start)
    .sort((a, b) => a.start.localeCompare(b.start));
}

async function getSourceStatuses(calendarCount: number, teamCount: number, visualCount: number): Promise<StateSourceStatus[]> {
  const sourceDefs = [
    { path: "state/calendar.json", label: "Calendar", entries: calendarCount },
    { path: "state/team.json", label: "Team", entries: teamCount },
    { path: "state/visual-office.json", label: "Visual Office", entries: visualCount },
    { path: "memory", label: "Memory", entries: 0 },
  ];

  return Promise.all(
    sourceDefs.map(async (source) => ({
      ...source,
      exists: Boolean(await statSafe(path.join(WORKSPACE_ROOT, source.path))),
    }))
  );
}

async function getTeamMembers() {
  const data = await readJsonSafe<{ members?: TeamMember[] }>(
    path.join(WORKSPACE_ROOT, "state/team.json"),
    { members: [] }
  );

  return (data.members ?? []).filter((member) => member.name);
}

async function getVisualOfficeSpaces() {
  const data = await readJsonSafe<{ spaces?: VisualOfficeSpace[] }>(
    path.join(WORKSPACE_ROOT, "state/visual-office.json"),
    { spaces: [] }
  );

  return (data.spaces ?? []).filter((space) => space.name);
}

async function getDecisionsState() {
  return readJsonSafe<DecisionsState>(
    path.join(WORKSPACE_ROOT, "state/decisions.json"),
    {
      meta: {
        name: "Mission Control Decisions",
        description: "Canonical local decision state for Mission Control ARPAGONA.",
        updatedAt: null,
      },
      current: null,
      history: [],
    }
  );
}

async function getTasks() {
  const liveFiles = [
    path.join(WORKSPACE_ROOT, "ARPAGONA_ACTION_PLAN.md"),
    path.join(WORKSPACE_ROOT, "ARPAGONA_OFFRES.md"),
    path.join(WORKSPACE_ROOT, "ARPAGONA_SALES_KIT.md"),
    path.join(WORKSPACE_ROOT, "memory/2026-05-01.md"),
  ];

  const archiveFiles = [
    ...(await listMarkdownFiles(path.join(WORKSPACE_ROOT, "imports/chatgpt-rag-ready/docs"), 0, 1)),
    ...(await listMarkdownFiles(path.join(WORKSPACE_ROOT, "imports/chatgpt-elite-rag-ready/docs"), 0, 1)),
  ];

  const buckets: Array<{ scope: "live" | "archive"; files: string[] }> = [
    { scope: "live", files: liveFiles },
    { scope: "archive", files: archiveFiles },
  ];

  const tasks: TaskItem[] = [];

  const classifyTask = (text: string, filePath: string, scope: "live" | "archive") => {
    const lower = text.toLowerCase();
    const source = filePath.toLowerCase();

    let category: TaskItem["category"] = "general";
    if (lower.includes("prospect") || lower.includes("outreach") || lower.includes("call") || lower.includes("message")) category = "sales";
    else if (lower.includes("offer") || lower.includes("offre") || lower.includes("pitch") || lower.includes("price")) category = "offer";
    else if (lower.includes("demo") || lower.includes("build") || lower.includes("workflow") || lower.includes("automation")) category = "delivery";
    else if (lower.includes("memory") || source.includes("memory")) category = "memory";
    else if (lower.includes("site") || lower.includes("contact") || lower.includes("page") || lower.includes("calendar")) category = "ops";

    let score = scope === "live" ? 100 : 40;
    if (source.includes("action_plan")) score += 20;
    if (lower.includes("paid") || lower.includes("revenue") || lower.includes("prospect") || lower.includes("outreach")) score += 20;
    if (lower.includes("demo") || lower.includes("build") || lower.includes("landing page") || lower.includes("site")) score += 10;
    if (lower.includes("monthly") || lower.includes("retainer")) score -= 10;

    const priority: TaskItem["priority"] = score >= 120 ? "high" : score >= 90 ? "medium" : "low";

    return { category, priority, score };
  };

  for (const bucket of buckets) {
    const uniqueFiles = Array.from(new Set(bucket.files));

    for (const filePath of uniqueFiles) {
      const content = await readTextSafe(filePath);
      if (!content) continue;

      for (const [index, line] of content.split("\n").entries()) {
        const match = line.match(/^\s*- \[([ xX])\]\s+(.+)$/);
        if (!match) continue;

        const text = match[2].trim();
        const classification = classifyTask(text, filePath, bucket.scope);

        tasks.push({
          path: toRelative(filePath),
          line: index + 1,
          text,
          done: match[1].toLowerCase() === "x",
          scope: bucket.scope,
          priority: classification.priority,
          category: classification.category,
          score: classification.score,
        });
      }
    }
  }

  const prioritized = tasks
    .filter((task) => task.scope === "live" || !task.done)
    .sort((a, b) => {
      if (a.scope !== b.scope) return a.scope === "live" ? -1 : 1;
      if (a.done !== b.done) return Number(a.done) - Number(b.done);
      if (a.score !== b.score) return b.score - a.score;
      return Number(a.done) - Number(b.done);
    });

  return prioritized.slice(0, 32);
}

export async function getMissionControlData(): Promise<MissionControlData> {
  const [memory, docs, projects, tasks, calendar, team, visualOffice, decisions] = await Promise.all([
    getMemoryFiles(),
    getDocFiles(),
    getProjectFiles(),
    getTasks(),
    getCalendarEvents(),
    getTeamMembers(),
    getVisualOfficeSpaces(),
    getDecisionsState(),
  ]);

  const sources = await getSourceStatuses(calendar.length, team.length, visualOffice.length);

  return {
    generatedAt: new Date().toISOString(),
    workspaceRoot: WORKSPACE_ROOT,
    stats: {
      markdownDocs: docs.length,
      memoryFiles: memory.length,
      openTasks: tasks.filter((task) => !task.done).length,
      completedTasks: tasks.filter((task) => task.done).length,
      liveOpenTasks: tasks.filter((task) => task.scope === "live" && !task.done).length,
      archiveTasks: tasks.filter((task) => task.scope === "archive").length,
      projectFiles: projects.length,
      upcomingEvents: calendar.length,
      teamMembers: team.length,
      visualSpaces: visualOffice.length,
    },
    memory,
    docs,
    projects,
    tasks,
    calendar,
    team,
    visualOffice,
    sources,
    decisions,
  };
}
