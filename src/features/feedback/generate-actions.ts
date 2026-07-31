import { uid } from "@/lib/utils";
import type { Presentation } from "@/lib/types";
import type {
  FeedbackIssue,
  RedesignAction,
  SlideIssueMap,
} from "@/features/feedback/types";

/**
 * Step 3 — Generate deterministic editor commands (not prose).
 */
export function generateRedesignActions(
  presentation: Presentation,
  issues: FeedbackIssue[],
  slideMap: SlideIssueMap[]
): RedesignAction[] {
  const actions: RedesignAction[] = [];
  const issueById = new Map(issues.map((i) => [i.id, i]));

  for (const row of slideMap) {
    for (const issueId of row.issueIds) {
      const issue = issueById.get(issueId);
      if (!issue) continue;
      const slide = row.slideIndex + 1;

      switch (issue.category) {
        case "too_much_text":
          actions.push(
            make(
              issueId,
              `Reduce text on slide ${slide}`,
              {
                action: "replace_text_with_bullets",
                params: { slide },
              }
            ),
            make(
              issueId,
              `Minimize dense copy on slide ${slide}`,
              {
                action: "adjust_textbox",
                params: { slide, mode: "minimize", type: "textbox" },
              }
            )
          );
          break;
        case "needs_visuals":
          actions.push(
            make(issueId, `Insert image on slide ${slide}`, {
              action: "insert_image",
              params: {
                slide,
                query: "business growth illustration · soft daylight",
                imageHint: "business growth illustration · soft daylight",
              },
            })
          );
          break;
        case "needs_chart":
          actions.push(
            make(issueId, `Add chart on slide ${slide}`, {
              action: "create_chart",
              params: {
                slide,
                chartHint: "Bar chart · key metrics",
              },
            })
          );
          break;
        case "weak_conclusion":
          actions.push(
            make(issueId, `Rewrite conclusion on slide ${slide}`, {
              action: "rewrite_conclusion",
              params: { slide },
            })
          );
          break;
        case "weak_intro":
          actions.push(
            make(issueId, `Strengthen intro on slide ${slide}`, {
              action: "set_slide_field",
              params: {
                slide,
                field: "subtitle",
                value:
                  "One sharp promise — why this matters right now.",
              },
            })
          );
          break;
        case "poor_hierarchy":
          actions.push(
            make(issueId, `Improve layout (Apple-style)`, {
              action: "improve_layout",
              params: { style: "apple", slide },
            })
          );
          break;
        case "brand_inconsistent":
          actions.push(
            make(issueId, "Apply company / brand colors", {
              action: "change_theme",
              params: { themeId: "apple" },
            })
          );
          break;
        case "pacing":
          if (presentation.slides.length > 8) {
            actions.push(
              make(issueId, "Trim dense slide copy", {
                action: "replace_text_with_bullets",
                params: { slide },
              })
            );
          }
          break;
        default:
          actions.push(
            make(issueId, `Tighten slide ${slide}`, {
              action: "replace_text_with_bullets",
              params: { slide },
            })
          );
      }
    }
  }

  // Deduplicate by action+slide
  const seen = new Set<string>();
  return actions.filter((a) => {
    const key = `${a.command.action}:${JSON.stringify(a.command.params)}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function make(
  issueId: string,
  label: string,
  command: RedesignAction["command"]
): RedesignAction {
  return {
    id: uid("rdx"),
    issueId,
    label,
    command,
    status: "pending",
  };
}
