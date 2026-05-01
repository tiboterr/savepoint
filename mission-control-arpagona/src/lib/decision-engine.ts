import path from "path";

import type { MissionControlData } from "@/lib/mission-control";

export type DecisionOption = {
  id: string;
  label: string;
  rationale: string;
};

export type DecisionPrompt = {
  id: string;
  kind: "primary" | "secondary";
  question: string;
  context: string;
  options: DecisionOption[];
};

export type DecisionRecord = {
  promptId: string;
  kind?: "primary" | "secondary";
  question: string;
  selectedOptionId: string;
  selectedLabel: string;
  selectedAt: string;
};

export type DecisionsState = {
  meta: {
    name: string;
    description: string;
    updatedAt: string | null;
  };
  current: DecisionRecord | null;
  history: DecisionRecord[];
};

export const DECISIONS_STATE_PATH = path.join("/home/thibaud/.openclaw/workspace", "state", "decisions.json");

export function getDecisionFocusLabel(optionId?: string | null) {
  switch (optionId) {
    case "prioritize-sales":
      return "Focus commercial";
    case "prioritize-delivery":
      return "Focus delivery";
    case "prioritize-strategy":
      return "Focus stratégie";
    case "schedule-calendar-review":
      return "Focus agenda";
    case "reduce-open-fronts":
      return "Focus réduction des fronts";
    default:
      return "Cap non figé";
  }
}

export function generateDecisionPrompt(data: MissionControlData): DecisionPrompt {
  const nextEvent = data.calendar[0];
  const topLiveTask = data.tasks.find((task) => task.scope === "live" && !task.done);
  const salesPressure = data.tasks.filter((task) => !task.done && task.category === "sales").length;
  const deliveryPressure = data.tasks.filter((task) => !task.done && task.category === "delivery").length;

  const contextParts = [
    topLiveTask ? `Tâche live dominante: ${topLiveTask.text}` : null,
    nextEvent ? `Prochain événement: ${nextEvent.title}` : null,
    salesPressure > 0 ? `${salesPressure} signaux commerciaux ouverts` : null,
    deliveryPressure > 0 ? `${deliveryPressure} signaux delivery ouverts` : null,
  ].filter(Boolean);

  return {
    id: `overview-${new Date(data.generatedAt).toISOString().slice(0, 13)}`,
    kind: "primary",
    question: "Quel arbitrage doit primer maintenant dans ARPAGONA ?",
    context: contextParts.join(" · ") || "Aucun signal dominant détecté, choisis un cap explicite.",
    options: [
      {
        id: "prioritize-sales",
        label: "Prioriser la traction commerciale",
        rationale: "Basculer l’attention vers l’offre, la prospection et la conversion.",
      },
      {
        id: "prioritize-delivery",
        label: "Finir Mission Control / delivery",
        rationale: "Consolider l’outil et les briques techniques avant d’ouvrir plus de fronts.",
      },
      {
        id: "prioritize-strategy",
        label: "Recentrer la stratégie ARPAGONA",
        rationale: "Clarifier le cap, les priorités et le message avant d’exécuter plus fort.",
      },
      {
        id: "hold-position",
        label: "Garder le cap actuel",
        rationale: "Ne pas re-router maintenant, continuer avec l’inertie opérationnelle actuelle.",
      },
    ],
  };
}

export function generateSecondaryDecisionPrompt(data: MissionControlData): DecisionPrompt | null {
  const nextEvent = data.calendar[0];
  const highPriorityTasks = data.tasks.filter((task) => !task.done && task.priority === "high");

  if (highPriorityTasks.length >= 2) {
    return {
      id: `secondary-load-${new Date(data.generatedAt).toISOString().slice(0, 13)}`,
      kind: "secondary",
      question: "Comment veux-tu réduire la dispersion opérationnelle ?",
      context: `${highPriorityTasks.length} tâches high priority sont ouvertes simultanément.`,
      options: [
        {
          id: "reduce-open-fronts",
          label: "Réduire les fronts ouverts",
          rationale: "On ferme les fronts secondaires pour concentrer l’exécution.",
        },
        {
          id: "keep-multi-front",
          label: "Assumer le multi-front",
          rationale: "On garde plusieurs pistes actives malgré le coût cognitif.",
        },
      ],
    };
  }

  if (nextEvent) {
    return {
      id: `secondary-calendar-${new Date(data.generatedAt).toISOString().slice(0, 13)}`,
      kind: "secondary",
      question: "Quel rapport veux-tu entre l’agenda et l’exécution ?",
      context: `Prochain événement: ${nextEvent.title}`,
      options: [
        {
          id: "schedule-calendar-review",
          label: "Faire primer l’agenda",
          rationale: "On aligne les prochaines décisions sur la pression temporelle visible.",
        },
        {
          id: "ignore-calendar-noise",
          label: "Protéger le focus malgré l’agenda",
          rationale: "On garde le cap courant et on limite les dérives contextuelles.",
        },
      ],
    };
  }

  return null;
}
