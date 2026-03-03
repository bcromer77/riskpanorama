export async function getSentinelToken() {
  const clientId = process.env.SENTINEL_CLIENT_ID;
  const clientSecret = process.env.SENTINEL_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("Missing Sentinel credentials");
  }

  const params = new URLSearchParams();
  params.append("grant_type", "client_credentials");

  const basicAuth = Buffer.from(
    `${clientId}:${clientSecret}`
  ).toString("base64");

  const res = await fetch("https://services.sentinel-hub.com/oauth/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${basicAuth}`,
    },
    body: params,
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Token fetch failed: ${err}`);
  }

  const data = await res.json();
  return data.access_token;
}
