import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * Proxies Place Photos so the browser never needs the server API key.
 * GET /api/photo?name=places%2F...%2Fphotos%2F...&max=900
 */
export async function GET(request: NextRequest) {
  const key = process.env.GOOGLE_MAPS_API_KEY?.trim();
  if (!key) {
    return NextResponse.json({ error: "Missing API key" }, { status: 503 });
  }

  const name = request.nextUrl.searchParams.get("name");
  const max = Math.min(
    1600,
    Math.max(100, Number(request.nextUrl.searchParams.get("max") ?? 800))
  );

  if (!name || !name.startsWith("places/") || name.includes("..")) {
    return NextResponse.json({ error: "Invalid photo name" }, { status: 400 });
  }

  const url = new URL(`https://places.googleapis.com/v1/${name}/media`);
  url.searchParams.set("maxHeightPx", String(max));
  url.searchParams.set("skipHttpRedirect", "false");
  url.searchParams.set("key", key);

  try {
    const upstream = await fetch(url, { cache: "force-cache" });
    if (!upstream.ok) {
      return NextResponse.json(
        { error: `Photo fetch failed (${upstream.status})` },
        { status: 502 }
      );
    }

    const contentType = upstream.headers.get("content-type") ?? "image/jpeg";
    const buffer = await upstream.arrayBuffer();

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Photo proxy failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
