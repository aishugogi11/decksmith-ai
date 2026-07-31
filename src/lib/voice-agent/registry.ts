import type { EditorActionDefinition } from "@/lib/voice-agent/types";

const ACTIONS = new Map<string, EditorActionDefinition>();

/** Register an editor action. Adding a new voice command = register here only. */
export function registerEditorAction(def: EditorActionDefinition): void {
  ACTIONS.set(def.name, def);
}

export function getEditorAction(name: string): EditorActionDefinition | undefined {
  return ACTIONS.get(name);
}

export function listEditorActions(): EditorActionDefinition[] {
  return [...ACTIONS.values()];
}

/** Compact catalog injected into the LLM system prompt. */
export function actionsCatalogForPrompt(): string {
  return listEditorActions()
    .map((a) => {
      const params = a.params
        .map(
          (p) =>
            `    - ${p.name} (${p.type}${p.required ? ", required" : ""}${
              p.enumValues ? `: ${p.enumValues.join("|")}` : ""
            }): ${p.description}`
        )
        .join("\n");
      return [
        `### ${a.name}`,
        a.description,
        "Params:",
        params || "    (none)",
        `Examples: ${a.examples.map((e) => `"${e}"`).join("; ")}`,
      ].join("\n");
    })
    .join("\n\n");
}

export function knownActionNames(): string[] {
  return [...ACTIONS.keys()];
}
