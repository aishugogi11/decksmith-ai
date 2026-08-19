# Lumen — Know where to go

AI-powered place discovery MVP. Lumen helps people decide *where* to go — ranking cafés, restaurants, and nearby stores by vibe, parking, travel time, price, and amenities — not just how to get there.

**Demo Mode** works with zero API keys. **Live Mode** uses real-time GPS, Google Places within 10 km, and Google Maps navigation.

## Features

- Real-time location awareness (GPS watch + city/ZIP fallback)
- “Searching near you.” when GPS is active — no city typing required
- Every search uses current coordinates within a configurable radius (default **10 km**)
- AI intent parsing → Google Places → ranking → recommendation cards
- Navigate button opens Google Maps directions from your location
- Service architecture: Location / Places / AIRecommendation / Navigation
- Voice search (mic), Demo Mode, and Explore nearby media picks

## Location-aware search flow

Current location (GPS or saved city/ZIP)
→ AI understands the request (category + preferences)
→ Google Places query with lat / lng / radius
→ Rank results
→ Recommendation cards (name, distance, travel time, rating, open now, address, why it matches, Navigate)

## Quick start (Demo Mode)

```bash
cd lumen
npm install
npm run dev
```

Open [http://127.0.0.1:3000](http://127.0.0.1:3000) and tap **Try Demo**.

### Nearby place discovery

If port 3000 is already taken, Next.js may start Lumen on **3001**. Open the URL printed in the terminal (for example [http://127.0.0.1:3001/voice](http://127.0.0.1:3001/voice)), or from the Lumen home page tap **Explore nearby**.

Type where you want to go, e.g.:

> Mission District

Below your search you’ll get:
1. **From Instagram & media** — curated spots that keep showing up on Instagram, TikTok, YouTube, and travel media (with explore links)
2. **Nearby options** — live Google Places when configured, otherwise curated picks

Instagram doesn’t offer a general public places feed API, so media results are a curated social index (not a scrape), optionally enriched with photogenic Google Places matches.

## Live Google search setup

1. Create a project in [Google Cloud Console](https://console.cloud.google.com/).
2. Enable these APIs:
   - **Places API (New)**
   - **Geocoding API** (city/ZIP fallback)
   - **Maps JavaScript API**
3. Create an API key (ideally two keys with different restrictions):
   - Server key → `GOOGLE_MAPS_API_KEY` (Places + Geocoding). Restrict by IP if you can.
   - Browser key → `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` (Maps JS). Restrict by HTTP referrer.
4. Copy env vars:

```bash
cp .env.example .env.local
```

```bash
GOOGLE_MAPS_API_KEY=your_server_key
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_browser_key
# optional:
# GOOGLE_SEARCH_RADIUS_METERS=10000
```

5. Restart `npm run dev`.
6. Allow **location** on first launch (or enter a city/ZIP if denied).
7. Search — e.g. “Find a quiet coffee shop” — no city needed when GPS is on.

## Project structure

```
src/
  app/api/
    search/            # Location-aware Places search
    geocode/           # City/ZIP → coordinates
    photo/             # Place photo proxy
  components/
    location/          # City/ZIP fallback form
    search/ results/ map/ ...
  hooks/
    useLocationAwareness.ts   # First-launch GPS + watch + fallback
  lib/services/
    LocationService.ts
    PlacesService.ts
    AIRecommendationEngine.ts
    NavigationService.ts      # Maps-provider-agnostic directions
  lib/google/places.ts        # Google Places adapter only
```

## Notes

- GPS permission shows **Searching near you.** and pins you on the map.
- Denied GPS → enter city/ZIP (saved in localStorage) as fallback origin.
- Navigate opens Google Maps directions; swap `NavigationProvider` to change maps apps.
- Without `GOOGLE_MAPS_API_KEY`, live search shows a setup message; **Try Demo** still works.

## Tech

Next.js · React · TypeScript · Tailwind CSS · Framer Motion · Lucide · Google Places API (New) · Google Maps JavaScript API
