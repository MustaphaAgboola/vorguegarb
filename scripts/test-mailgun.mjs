// Mailgun deliverability check.
//
// Sends a test message with the same credentials the app uses, then reports
// what Mailgun did with it (accepted / delivered / failed + spam reason).
// Sandbox domains commonly land in spam: a "delivered" event with a
// "DMARC:Quarantine" note means the mail arrived but was filed as spam.
//
// Usage:
//   node scripts/test-mailgun.mjs you@example.com
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
  console.error("Usage: node scripts/test-mailgun.mjs <recipient@example.com>");
  process.exit(1);
}

const base = process.env.MAILGUN_API_BASE ?? "https://api.mailgun.net";
const domain = process.env.MAILGUN_DOMAIN;
const apiKey = process.env.MAILGUN_API_KEY;
const from = process.env.MAILGUN_FROM ?? `VogueGarb <orders@${domain}>`;

if (!domain || !apiKey) {
  console.error("MAILGUN_DOMAIN and MAILGUN_API_KEY must be set in .env.local.");
  process.exit(1);
}

const auth = "Basic " + Buffer.from(`api:${apiKey}`).toString("base64");
const isSandbox = domain.includes("sandbox");

console.log(`Domain : ${domain}${isSandbox ? "  (SANDBOX — expect spam)" : ""}`);
console.log(`From   : ${from}`);
console.log(`Base   : ${base}`);
console.log(`To     : ${to}\n`);

async function main() {
  // 1. Confirm the key/domain are valid.
  const check = await fetch(`${base}/v3/domains/${domain}`, { headers: { Authorization: auth } });
  if (!check.ok) {
    console.error(`Auth/domain check failed: HTTP ${check.status}\n${await check.text()}`);
    process.exit(1);
  }

  // 2. Send the test message.
  const send = await fetch(`${base}/v3/${domain}/messages`, {
    method: "POST",
    headers: { Authorization: auth },
    body: new URLSearchParams({
      from,
      to,
      subject: "VogueGarb mailgun test",
      text: "If you see this, Mailgun sending works from your account.",
      html: "<p>If you see this, Mailgun sending works from your account.</p>",
    }),
  });
  const sendBody = await send.text();
  console.log(`Send   : HTTP ${send.status} ${sendBody}`);
  if (!send.ok) process.exit(1);

  // 3. Poll the event log so we can report actual delivery, not just "queued".
  for (let attempt = 1; attempt <= 5; attempt++) {
    await new Promise((r) => setTimeout(r, 3000));
    const events = await fetch(`${base}/v3/${domain}/events?limit=10`, { headers: { Authorization: auth } });
    const { items = [] } = await events.json();
    const mine = items.filter((e) => e.recipient === to);
    const final = mine.find((e) => ["delivered", "failed", "rejected"].includes(e.event));
    if (!final) continue;

    // The delivery-status message is populated a moment after the event, so
    // on the last attempts re-read it before deciding on the spam verdict.
    const status = final.deliveryStatus ?? {};
    let detail = status.message || status.description || "";
    if (!detail && attempt < 5) continue;

    console.log(`Event  : ${final.event.toUpperCase()}${final.reason ? ` (${final.reason})` : ""}`);
    console.log(`Detail : ${detail || "—"}`);
    if (final.event === "delivered") {
      const lower = detail.toLowerCase();
      if (lower.includes("quarantine")) {
        console.log("\n⚠  Delivered, but flagged as SPAM. Verify a custom domain (SPF+DKIM) for inbox delivery.");
      } else if (lower.includes("spam")) {
        console.log("\n⚠  Delivered, but flagged as SPAM. Verify a custom domain (SPF+DKIM) for inbox delivery.");
      } else if (isSandbox) {
        console.log("\n⚠  Delivered. Sandbox domains commonly land in spam — check the Spam folder.");
      } else {
        console.log("\n✅ Delivered to the inbox.");
      }
    }
    return;
  }
  console.log("No final delivery event yet. Check Sending → Logs in the Mailgun dashboard.");
}

main().catch((err) => {
  console.error("Unexpected error:", err);
  process.exit(1);
});