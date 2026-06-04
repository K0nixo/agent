// Serverless proxy. Holds the API key server-side so it never touches the browser.
// Optional password gate so randos can't burn your credits.

export async function POST(req) {
  const requiredPw = process.env.APP_PASSWORD;
  if (requiredPw && req.headers.get("x-app-password") !== requiredPw) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return Response.json({ error: "ANTHROPIC_API_KEY not set on server" }, { status: 500 });

  let body;
  try { body = await req.json(); } catch { return Response.json({ error: "bad request" }, { status: 400 }); }

  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      // default = Haiku 4.5 (nejlevnější, na sales/posty stačí).
      // Chceš lepší kvalitu? přepni na "claude-sonnet-4-6" (balanc) nebo "claude-opus-4-8" (nejlepší).
      // aktuální názvy ověř na https://docs.claude.com
      model: body.model || "claude-haiku-4-5-20251001",
      max_tokens: body.max_tokens || 1024,
      system: body.system,
      messages: body.messages,
    }),
  });

  const data = await r.json();
  return Response.json(data, { status: r.status });
}
