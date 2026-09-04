export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/api/account-removal" && request.method === "POST") {
      return handleAccountRemoval(request, env);
    }
    return env.ASSETS.fetch(request);
  }
};

const json = (body, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" }
});

const clean = (value, maxLength) => String(value ?? "").trim().slice(0, maxLength);

async function handleAccountRemoval(request, env) {
  const contentLength = Number(request.headers.get("content-length") || 0);
  if (contentLength > 20_000) return json({ error: "Request is too large." }, 413);

  let body;
  try { body = await request.json(); } catch { return json({ error: "Invalid request." }, 400); }
  if (body.website) return json({ ok: true });

  const firstName = clean(body.firstName, 80);
  const lastName = clean(body.lastName, 80);
  const email = clean(body.email, 160);
  const accountUid = clean(body.accountUid, 100);
  const phone = clean(body.phone, 40);
  const reason = clean(body.reason, 2_000);
  if (!firstName || !lastName || !email || !accountUid || !phone) return json({ error: "Please complete all required fields." }, 400);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json({ error: "Please enter a valid email address." }, 400);

  if (!env.RESEND_API_KEY) return json({ error: "Email delivery is not configured.", code: "EMAIL_NOT_CONFIGURED" }, 503);

  const submittedAt = new Date().toISOString();
  const message = [
    "New ReferredBy account removal request", "",
    `Name: ${firstName} ${lastName}`, `Email: ${email}`, `Registered phone: ${phone}`,
    `Account UID: ${accountUid}`, `Submitted: ${submittedAt}`, "", "Reason:", reason || "Not provided",
    "", "The requester confirmed that they understand account deletion is permanent and may require identity verification."
  ].join("\n");

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { "authorization": `Bearer ${env.RESEND_API_KEY}`, "content-type": "application/json" },
    body: JSON.stringify({
      from: env.ACCOUNT_REMOVAL_FROM_EMAIL || "ReferredBy Website <no-reply@referredby.com.na>",
      to: ["support@referredby.com.na"], reply_to: email,
      subject: `Account removal request — ${firstName} ${lastName}`,
      text: message
    })
  });
  if (!response.ok) return json({ error: "We could not send your request. Please use the email option below." }, 502);
  const result = await response.json();
  return json({ ok: true, reference: result.id || submittedAt });
}
