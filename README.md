# Lumen — Know where to go

AI-powered place discovery MVP. Lumen helps people decide *where* to go — ranking cafés and restaurants by vibe, parking, travel time, price, and amenities — not just how to get there.

Built as a highly shareable demo for X / Twitter. **Demo Mode works with zero API keys.**

## Features

- Cycling AI search prompts on the hero
- Thinking animation + ranked results
- Destination cards with match score, parking, tags, AI rationale
- Interactive stylized map with pins + animated parking → walk route
- Smart parking panel (garage, street, EV, accessibility)
- Weighted ranking engine (travel, parking, reviews, price, open now, amenities)
- Mobile-first polish for phone screen recordings

## Quick start

```bash
cd lumen
npm install
npm run dev
```

Open [http://127.0.0.1:3000](http://127.0.0.1:3000) and tap **Try Demo**.

## Project structure

```
src/
  app/                 # Next.js App Router shell
  components/
    brand/             # Logo
    hero/              # Landing composition
    search/            # Search box, prompt cycler, thinking UI
    results/           # Cards, badges, results layout
    map/               # Stylized map, pins, route animation
    parking/           # Smart parking panel + flow
    ui/                # Glass cards, shimmer, badges
  lib/
    types.ts           # Strong domain types
    demoData.ts        # Sample London destinations
    scoring.ts         # Weighted ranking
    parsePreferences.ts
    search.ts          # Swap this for live APIs later
    prompts.ts
```

## Swapping mock data for live APIs

Replace `runSearch` in `src/lib/search.ts` with:

1. Places API (Google / Mapbox) for inventory
2. An LLM call for preference parsing (optional — local parser already works)
3. Real parking providers

Keep returning `SearchResult` so the UI stays unchanged.

## Tech

Next.js · React · TypeScript · Tailwind CSS · Framer Motion · Lucide
