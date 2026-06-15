/**
 * Netlify function to proxy API calls to the backend.
 * Allows HTTPS frontend on Netlify to reach HTTP backend.
 * 
 * Frontend calls: /.netlify/functions/api-proxy?path=/auth/login
 * Backend receives: http://182.176.88.81/dtms/api/auth/login
 */

const BACKEND_URL = process.env.BACKEND_API_URL || "http://182.176.88.81/dtms/api";

export default async (req: Request): Promise<Response> => {
  try {
    // Extract the target path from query parameter
    const url = new URL(req.url);
    const path = url.searchParams.get("path") || "";

    if (!path) {
      return new Response(
        JSON.stringify({ error: "Missing 'path' query parameter" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const targetUrl = `${BACKEND_URL}${path}`;

    // Build headers, forwarding all from the request
    const headers = new Headers();
    for (const [key, value] of req.headers.entries()) {
      // Skip hop-by-hop headers
      if (
        [
          "connection",
          "keep-alive",
          "transfer-encoding",
          "upgrade",
          "host",
        ].includes(key.toLowerCase())
      ) {
        continue;
      }
      headers.set(key, value);
    }

    // Forward the request to the backend
    const response = await fetch(targetUrl, {
      method: req.method,
      headers,
      body:
        req.method !== "GET" && req.method !== "HEAD" ? await req.text() : null,
    });

    // Return the response with CORS headers
    const responseHeaders = new Headers(response.headers);
    responseHeaders.set("Access-Control-Allow-Origin", "*");
    responseHeaders.set("Access-Control-Allow-Methods", "*");
    responseHeaders.set("Access-Control-Allow-Headers", "*");

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error occurred";
    return new Response(
      JSON.stringify({ error: "Proxy error", details: message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
