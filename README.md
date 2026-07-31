# Decksmith AI

**Design presentations by talking.**

Premium AI presentation workspace — ChatGPT conversation meets Canva polish and Figma-style editing. Frontend-first with mock AI (ready for OpenAI / Anthropic / Grok / Gemini).

## Stack

- Next.js 15 · React · TypeScript · Tailwind CSS v4
- Framer Motion · Lucide · Zustand · Radix primitives (shadcn-style)

## Run

```bash
npm install
cp .env.example .env.local
# Add your ElevenLabs API key to .env.local
npm run dev
```

- Landing: http://localhost:3000  
- Workspace: http://localhost:3000/app  
- Demo flow: http://localhost:3000/app?demo=1  

## Voice (ElevenLabs)

Decksmith speaks slide content and AI replies through [ElevenLabs](https://elevenlabs.io) TTS.

1. Create an API key at elevenlabs.io → Profile → API Key  
2. Put it in `.env.local` as `ELEVENLABS_API_KEY=`  
3. Restart `npm run dev`  
4. In `/app`: use the speaker icon on the slide toolbar, or enable **Auto-speak AI replies** in the Voice section  

Brand personality maps to different ElevenLabs voices. Optional overrides:

```bash
ELEVENLABS_VOICE_ID=21m00Tcm4TlvDq8ikWAM
ELEVENLABS_MODEL_ID=eleven_flash_v2_5
```

Mic dictation uses the browser Web Speech API (Chrome/Edge). TTS always goes through `POST /api/tts` so the API key stays server-side.

## Architecture

```
src/
  app/                 # routes (landing + /app workspace + API)
  components/
    landing/           # marketing page
    app/               # studio editor + recommended templates panel
    slides/            # SlideCanvas + layout variants
    ui/                # Button, GlassCard
    brand/             # Logo
  lib/
    types.ts           # Presentation / Slide models
    themes.ts          # Apple → Luxury themes
    templates.ts       # First-party template catalog
    template-engine/   # Modular TemplateProvider + metadata
    ai/                # Intent, embeddings, semantic rank, customize
    mock-ai.ts         # Streaming mock generator (edit flow)
  store/
    presentation-store.ts
```

## Templates, export & import

**Open pack (MIT):** ~130 original programmatic templates in `src/lib/template-packs/` (plus ~30 curated). Not scraped from Canva. Licensed under MIT — see `src/lib/template-packs/LICENSE.md`.

**Providers** (`src/lib/template-engine/`):
- `decksmith` — curated catalog
- `open-pack` — MIT open skeletons for AI customization
- `user` — imports (PPTX text extract or Decksmith JSON)

**Creative collaborator:**
1. Vague asks (“Make me a pitch deck”) → interview (audience, focus, dark mode, charts)
2. Live voice/text edits (“Make this slide more minimal”, “Apple-style”, “Turn this into a timeline”)
3. Smart template match (e.g. YC / AI startup → pitch templates) + AI customize
4. Research pass (stats, citations, chart/image hints — stub swap-ready for live APIs)
5. Presentation coach (crowding, story gaps, runtime, likely questions)

**Export:** slide toolbar download icon → `.pptx` via [PPTXGenJS](https://gitbrent.github.io/PptxGenJS/).

**Import:** Design library → **Uploads** → `.pptx` or `.json`, then **AI fill** to redesign.

## What’s included

- Dark, minimalist UI (Linear / Arc energy)
- Split workspace: AI chat + live editable preview
- Varied slide layouts (hero, stats, timeline, quote, comparison, …)
- Inline text editing, add / duplicate / delete slides, undo / redo
- One-click themes
- Suggested prompts + streaming mock responses

## Next (backend-ready)

Wire `mockStreamAssistant` in `src/lib/mock-ai.ts` to your provider of choice. Export paths (PPT / Google Slides) and collaboration can plug into the same store.
