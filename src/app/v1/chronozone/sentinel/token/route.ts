export const runtime = "nodejs";

function b64(s: string) {
  return Buffer.from(s, "utf8").toString("base64");
}

export async function GET() {
  const clientId = process.env.SENTINEL_CLIENT_ID;
  const clientSecret = process.env.SENTINEL_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return new Response(JSON.stringify({ error: "MISSING_SENTINEL_CREDS" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const params = new URLSearchParams();
  params.set("grant_type", "client_credentials");

  const res = await fetch("https://services.sentinel-hub.com/oauth/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${b64(`${clientId}:${clientSecret}`)}`,
    },
    body: params.toString(),
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    return new Response(JSON.stringify({ error: "SENTINEL_TOKEN_FAILED", detail: txt }), {
      status: 502,
      headers: { "Content-Type": "application/json" },
    });
  }

  const data = await res.json();
  return Response.json({
    access_token: data.access_token,
    expires_in: data.expires_in,
    token_type: data.token_type,
  });
}
