/**
 * Dev-only proxy: forwards /api/proxy/* to the backend, bypassing browser CORS.
 * In production, Netlify functions handle this instead (netlify/functions/api-proxy.ts).
 */

const BACKEND_URL = process.env.BACKEND_API_URL || "http://182.176.88.81/dtms/api";

const HOP_BY_HOP = new Set([
  "connection",
  "keep-alive",
  "transfer-encoding",
  "upgrade",
  "host",
  "content-length",
]);

async function handler(req: Request, ctx: RouteContext<"/api/proxy/[...path]">): Promise<Response> {
  const { path } = await ctx.params;
  const targetPath = "/" + path.join("/");

  const incomingUrl = new URL(req.url);
  const targetUrl = `${BACKEND_URL}${targetPath}${incomingUrl.search}`;

  const headers = new Headers();
  for (const [key, value] of req.headers.entries()) {
    if (!HOP_BY_HOP.has(key.toLowerCase())) {
      headers.set(key, value);
    }
  }

  let body: BodyInit | null = null;
  if (req.method !== "GET" && req.method !== "HEAD") {
    const buf = await req.arrayBuffer();
    if (buf.byteLength > 0) {
      body = buf;
      if (!headers.has("Content-Type")) {
        headers.set("Content-Type", "application/json");
      }
    }
  }

  const response = await fetch(targetUrl, { method: req.method, headers, body });

  const responseHeaders = new Headers(response.headers);
  responseHeaders.set("Access-Control-Allow-Origin", "*");
  responseHeaders.set("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
  responseHeaders.set("Access-Control-Allow-Headers", "Content-Type, Authorization, Accept");

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: responseHeaders,
  });
}

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;
export const OPTIONS = handler;
