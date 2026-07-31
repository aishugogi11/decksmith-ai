export type {
  PresentationIntent,
  PresentationType,
  TemplateMatch,
  TemplateProvider,
  TemplateRecord,
  Tone,
  VisualStyle,
} from "@/lib/template-engine/types";
export { deckTemplateToRecord } from "@/lib/template-engine/metadata";
export {
  getTemplateProviders,
  getTemplateRecordById,
  listAllTemplates,
  registerTemplateProvider,
  userTemplateProvider,
} from "@/lib/template-engine/providers/registry";
export { DecksmithTemplateProvider } from "@/lib/template-engine/providers/decksmith-provider";
export { OpenPackTemplateProvider } from "@/lib/template-engine/providers/open-pack-provider";
export { templateRecordToPresentation } from "@/lib/template-engine/to-presentation";
export { OPEN_PACK_LICENSE, OPEN_TEMPLATE_PACK } from "@/lib/template-packs/open-pack";
