import { NextResponse } from "next/server";

/** Serves /icon as SVG — avoids @vercel/og ImageResponse prerender failure on Windows. */
export async function GET() {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"><rect width="32" height="32" rx="6" fill="#0C447C"/><text x="16" y="21" font-size="14" font-weight="700" fill="#1D9E75" text-anchor="middle" font-family="system-ui,sans-serif" letter-spacing="-0.5">ETF</text></svg>`;
  return new NextResponse(svg, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
