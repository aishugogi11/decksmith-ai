import type { EditorCommand } from "@/lib/editor/types";
import type { VoiceCommand } from "@/lib/voice-agent/types";

/**
 * Map semantic EditorCommand → registered voice-agent action name.
 * Unmapped future ops (ALIGN_OBJECTS, GROUP_OBJECTS, …) stay uppercase
 * until registered — execute will report unknown action cleanly.
 */
const SEMANTIC_TO_ACTION: Record<string, string> = {
  CREATE_TEXTBOX: "create_textbox",
  CREATE_IMAGE: "create_image",
  CREATE_ICON: "create_icon",
  CREATE_CHART: "create_chart",
  DELETE_OBJECT: "delete_object",
  MOVE_OBJECT: "move_object",
  RESIZE_OBJECT: "resize_object",
  UPDATE_TEXT: "set_text",
  SET_FONT_SIZE: "set_font_size",
  ADJUST_TEXTBOX: "adjust_textbox",
  CHANGE_THEME: "change_theme",
  DUPLICATE_SLIDE: "duplicate_slide",
  DELETE_SLIDE: "delete_slide",
  ADD_SLIDE: "add_slide",
  SELECT_OBJECT: "select_object",
  SET_SLIDE_FIELD: "set_slide_field",
  REPLACE_TEXT_WITH_BULLETS: "replace_text_with_bullets",
  IMPROVE_LAYOUT: "improve_layout",
  REWRITE_CONCLUSION: "rewrite_conclusion",
  REPLACE_ICONS_STYLE: "replace_icons_style",
  INSERT_IMAGE: "insert_image",
};

export function toVoiceCommand(command: EditorCommand): VoiceCommand {
  const key = command.type.trim();
  const upper = key.toUpperCase();
  const action =
    SEMANTIC_TO_ACTION[upper] ??
    (/^[a-z][a-z0-9_]*$/.test(key) ? key : key.toLowerCase());

  return {
    action,
    params: { ...(command.params ?? {}) },
  };
}

export function toVoiceCommands(commands: EditorCommand[]): VoiceCommand[] {
  return commands.map(toVoiceCommand);
}
