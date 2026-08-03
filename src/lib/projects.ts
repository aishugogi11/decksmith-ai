import type { Presentation } from "@/lib/types";

export const PROJECTS_STORAGE_KEY = "echoflow-projects";

export type SavedProject = {
  id: string;
  name: string;
  updatedAt: string;
  createdAt: string;
  presentation: Presentation;
};

function readRaw(): unknown {
  if (typeof window === "undefined") return null;
  try {
    const raw =
      localStorage.getItem(PROJECTS_STORAGE_KEY) ??
      localStorage.getItem("glide-projects") ??
      localStorage.getItem("decksmith-projects");
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function loadSavedProjects(): SavedProject[] {
  const parsed = readRaw();
  if (!Array.isArray(parsed)) return [];
  return parsed
    .filter(
      (p): p is SavedProject =>
        Boolean(p) &&
        typeof p === "object" &&
        typeof (p as SavedProject).id === "string" &&
        typeof (p as SavedProject).name === "string" &&
        (p as SavedProject).presentation &&
        typeof (p as SavedProject).presentation === "object"
    )
    .map((p) => ({
      ...p,
      name: p.name.slice(0, 100) || "Untitled project",
      presentation: {
        ...p.presentation,
        title: p.name.slice(0, 100) || p.presentation.title || "Untitled project",
      },
    }))
    .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
}

export function persistSavedProjects(projects: SavedProject[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(
      PROJECTS_STORAGE_KEY,
      JSON.stringify(projects.slice(0, 40))
    );
  } catch {
    /* quota / private mode */
  }
}

export function presentationToSavedProject(
  presentation: Presentation,
  name?: string
): SavedProject {
  const now = new Date().toISOString();
  const projectName =
    (name ?? presentation.title ?? "Untitled project").trim().slice(0, 100) ||
    "Untitled project";
  return {
    id: presentation.id,
    name: projectName,
    createdAt: presentation.createdAt || now,
    updatedAt: now,
    presentation: {
      ...structuredClone(presentation),
      title: projectName,
      updatedAt: now,
    },
  };
}

export function upsertSavedProject(
  projects: SavedProject[],
  project: SavedProject
): SavedProject[] {
  const rest = projects.filter((p) => p.id !== project.id);
  return [project, ...rest].slice(0, 40);
}
