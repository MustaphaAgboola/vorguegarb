// Brevo deliverability check.
//
// Sends a test message with the same credentials the app uses, then reports
// what Brevo did with it (requests / delivered / soft or hard bounce / spam).
// Note: a key scoped to transactional sending only gets an empty {} from the
// event log, so "no final delivery event yet" is expected with such a key and
// does not mean the mail failed — check the inbox or Transactional -> Logs.
// A send from an unverified sender is rejected outright with HTTP 400, so an
// auth failure here almost always means BREVO_FROM_EMAIL is not verified under
// Senders, Domains & Dedicated IPs.
//
// Usage:
//   node scripts/test-email.mjs you@example.com
//
// Reads config from .env.local (never commit real values there).

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(here, "..", ".env.local");

function loadEnvLocal() {
  let raw;
  try {
    raw = readFileSync(envPath, "utf8");
  } catch {
    console.error(`Could not read ${envPath}. Copy .env.example to .env.local first.`);
    process.exit(1);
  }
  for (const line of raw.split("\n")) {
    const match = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(line);
    if (!match) continue;
    const [, key, value] = match;
    // Strip surrounding quotes and inline comments (# ...), keep it simple.
    process.env[key] ??= value.replace(/^["']|["']$/g, "").replace(/\s+#.*$/, "").trim();
  }
}

loadEnvLocal();

const to = process.argv[2];
if (!to) {
  console.error("Usage: node scripts/test-email.mjs <recipient@example.com>");
  process.exit(1);
}

const apiKey = process.env.BREVO_API_KEY;
const fromEmail = process.env.BREVO_FROM_EMAIL;
const fromName = process.env.BREVO_FROM_NAME ?? "VogueGarb";

if (!apiKey || !fromEmail) {
  console.error("BREVO_API_KEY and BREVO_FROM_EMAIL must be set in .env.local.");
  process.exit(1);
}

const headers = { "api-key": apiKey, "content-type": "application/json", accept: "application/json" };

console.log(`From   : ${fromName} <${fromEmail}>`);
console.log(`To     : ${to}\n`);

async function main() {
  // 1. Report the account if the key is allowed to read it. A key scoped to
  // transactional email only gets permission_denied here, which is fine — the
  // send below is the real check.
  const account = await fetch("https://api.brevo.com/v3/account", { headers });
  if (account.ok) {
    const { email: accountEmail, plan = [] } = await account.json();
    const free = plan.find((p) => p.type === "free");
    console.log(`Account: ${accountEmail}${free ? `  (free, ${free.credits} credits left)` : ""}`);
  } else {
    console.log(`Account: not readable with this key (HTTP ${account.status}) — scoped key, carrying on`);
  }

  // 2. Send the test message.
  const send = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers,
    body: JSON.stringify({
      sender: { name: fromName, email: fromEmail },
      to: [{ email: to }],
      subject: "VogueGarb email test",
      textContent: "If you see this, Brevo sending works from your account.",
      htmlContent: "<p>If you see this, Brevo sending works from your account.</p>",
    }),
  });
  const sendBody = await send.text();
  console.log(`Send   : HTTP ${send.status} ${sendBody}`);
  if (!send.ok) {
    if (send.status === 400 && sendBody.includes("sender")) {
      console.error(`\n⚠  Brevo rejected the sender. Verify ${fromEmail} under Senders, Domains & Dedicated IPs.`);
    }
    process.exit(1);
  }

  // 3. Poll the event log so we can report actual delivery, not just "accepted".
  const final = ["delivered", "hardBounces", "softBounces", "blocked", "spam", "invalid"];
  for (let attempt = 1; attempt <= 5; attempt++) {
    await new Promise((r) => setTimeout(r, 3000));
    const url = `https://api.brevo.com/v3/smtp/statistics/events?limit=10&email=${encodeURIComponent(to)}`;
    const events = await fetch(url, { headers });
    if (!events.ok) continue;
    const { events: items = [] } = await events.json();
    const hit = items.find((e) => final.includes(e.event));
    if (!hit) continue;

    console.log(`Event  : ${hit.event.toUpperCase()}`);
    console.log(`Detail : ${hit.reason || "—"}`);
    if (hit.event === "delivered") {
      console.log("\n✅ Delivered. If it is not in the inbox, check the Spam folder.");
    } else {
      console.log("\n⚠  Not delivered. See Transactional → Logs in the Brevo dashboard.");
    }
    return;
  }
  console.log("No final delivery event yet. Check Transactional → Logs in the Brevo dashboard.");
}

main().catch((err) => {
  console.error("Unexpected error:", err);
  process.exit(1);
});
