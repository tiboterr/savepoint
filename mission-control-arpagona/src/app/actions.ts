"use server";

import { promises as fs } from "fs";
import { revalidatePath } from "next/cache";

import { DECISIONS_STATE_PATH, type DecisionsState } from "@/lib/decision-engine";

async function readDecisionState(): Promise<DecisionsState> {
  try {
    const raw = await fs.readFile(DECISIONS_STATE_PATH, "utf8");
    return JSON.parse(raw) as DecisionsState;
  } catch {
    return {
      meta: {
        name: "Mission Control Decisions",
        description: "Canonical local decision state for Mission Control ARPAGONA.",
        updatedAt: null,
      },
      current: null,
      history: [],
    };
  }
}

export async function recordDecision(formData: FormData) {
  const promptId = String(formData.get("promptId") || "");
  const kind = String(formData.get("kind") || "primary") as "primary" | "secondary";
  const question = String(formData.get("question") || "");
  const selectedOptionId = String(formData.get("selectedOptionId") || "");
  const selectedLabel = String(formData.get("selectedLabel") || "");

  if (!promptId || !selectedOptionId || !selectedLabel) return;

  const state = await readDecisionState();
  const record = {
    promptId,
    kind,
    question,
    selectedOptionId,
    selectedLabel,
    selectedAt: new Date().toISOString(),
  };

  const nextState: DecisionsState = {
    meta: {
      ...state.meta,
      updatedAt: record.selectedAt,
    },
    current: record,
    history: [record, ...state.history].slice(0, 20),
  };

  await fs.writeFile(DECISIONS_STATE_PATH, `${JSON.stringify(nextState, null, 2)}\n`, "utf8");
  revalidatePath("/");
}
