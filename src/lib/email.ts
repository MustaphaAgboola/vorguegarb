import { adminEmails } from "@/lib/admin";

export type OrderEmailData = {
  id: string;
  total: number;
  full_name: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  notes?: string | null;
  order_items: { name: string; unit_price: number; size: string | null; quantity: number }[];
};

const naira = (n: number) =>
  new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(n);

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const shortId = (id: string) => id.slice(0, 8).toUpperCase();

const itemLabel = (i: OrderEmailData["order_items"][number]) =>
  `${i.name}${i.size ? ` (${i.size})` : ""} x ${i.quantity}`;

const itemRowsHtml = (items: OrderEmailData["order_items"]) =>
  items
    .map(
      (i) =>
        `<tr><td style="padding:6px 0">${esc(itemLabel(i))}</td>` +
        `<td style="padding:6px 0;text-align:right">${naira(i.unit_price * i.quantity)}</td></tr>`
    )
    .join("");

const itemLinesText = (items: OrderEmailData["order_items"]) =>
  items.map((i) => `- ${itemLabel(i)}: ${naira(i.unit_price * i.quantity)}`).join("\n");

/** Posts one transactional message to Brevo. Throws on a non-2xx response. */
async function send({
  to,
  subject,
  html,
  text,
}: {
  to: { email: string; name?: string }[];
  subject: string;
  html: string;
  text: string;
}) {
  const apiKey = process.env.BREVO_API_KEY;
  const fromEmail = process.env.BREVO_FROM_EMAIL;
  const fromName = process.env.BREVO_FROM_NAME ?? "VogueGarb";
  if (!apiKey || !fromEmail) throw new Error("Brevo env vars missing");

  const res = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: { "api-key": apiKey, "content-type": "application/json", accept: "application/json" },
    body: JSON.stringify({
      sender: { name: fromName, email: fromEmail },
      to,
      subject,
      htmlContent: html,
      textContent: text,
    }),
  });

  if (!res.ok) throw new Error(`Brevo ${res.status}: ${await res.text()}`);
}

export async function sendOrderConfirmation({ to, order }: { to: string; order: OrderEmailData }) {
  const ref = shortId(order.id);

  const html = `
  <div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;color:#111">
    <h2 style="margin-bottom:4px">Thank you for your order, ${esc(order.full_name)}!</h2>
    <p style="margin-top:0;color:#555">Order #${ref}</p>
    <table style="width:100%;border-collapse:collapse;border-top:1px solid #ddd;border-bottom:1px solid #ddd">${itemRowsHtml(order.order_items)}</table>
    <p style="text-align:right;font-size:18px"><strong>Total: ${naira(order.total)}</strong></p>
    <h4 style="margin-bottom:4px">Delivery details</h4>
    <p style="margin-top:0">${esc(order.address)}, ${esc(order.city)}, ${esc(order.state)}<br>${esc(order.phone)}</p>
    <p style="color:#555">We'll be in touch to confirm delivery. - VogueGarb</p>
  </div>`;

  const text =
    `Thank you for your order, ${order.full_name}!\nOrder #${ref}\n\n` +
    itemLinesText(order.order_items) +
    `\n\nTotal: ${naira(order.total)}\n\nDelivery: ${order.address}, ${order.city}, ${order.state}\n${order.phone}\n\n- VogueGarb`;

  await send({
    to: [{ email: to, name: order.full_name }],
    subject: `VogueGarb order #${ref} confirmed`,
    html,
    text,
  });
}

/**
 * Tells the store owners a new order came in. Recipients are the same
 * ADMIN_EMAILS allowlist that guards /admin, so there is only one list to keep
 * up to date. A no-op when the allowlist is empty.
 */
export async function sendAdminOrderNotification({
  order,
  customerEmail,
}: {
  order: OrderEmailData;
  customerEmail: string | null;
}) {
  if (adminEmails.length === 0) return;

  const ref = shortId(order.id);
  const ordersUrl = `${(process.env.NEXT_PUBLIC_SITE_URL ?? "").replace(/\/$/, "")}/orders`;

  const html = `
  <div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;color:#111">
    <h2 style="margin-bottom:4px">New order #${ref}</h2>
    <p style="margin-top:0;color:#555">${naira(order.total)} &middot; ${order.order_items.length} line item(s)</p>
    <table style="width:100%;border-collapse:collapse;border-top:1px solid #ddd;border-bottom:1px solid #ddd">${itemRowsHtml(order.order_items)}</table>
    <p style="text-align:right;font-size:18px"><strong>Total: ${naira(order.total)}</strong></p>
    <h4 style="margin-bottom:4px">Customer</h4>
    <p style="margin-top:0">
      ${esc(order.full_name)}<br>
      ${esc(order.phone)}${customerEmail ? `<br>${esc(customerEmail)}` : ""}
    </p>
    <h4 style="margin-bottom:4px">Deliver to</h4>
    <p style="margin-top:0">${esc(order.address)}, ${esc(order.city)}, ${esc(order.state)}</p>
    ${order.notes ? `<h4 style="margin-bottom:4px">Notes</h4><p style="margin-top:0">${esc(order.notes)}</p>` : ""}
    <p><a href="${esc(ordersUrl)}" style="color:#111">View all orders</a></p>
  </div>`;

  const text =
    `New order #${ref}\n\n` +
    itemLinesText(order.order_items) +
    `\n\nTotal: ${naira(order.total)}\n\n` +
    `Customer: ${order.full_name}\n${order.phone}${customerEmail ? `\n${customerEmail}` : ""}\n\n` +
    `Deliver to: ${order.address}, ${order.city}, ${order.state}\n` +
    (order.notes ? `\nNotes: ${order.notes}\n` : "") +
    `\n${ordersUrl}`;

  await send({
    to: adminEmails.map((email) => ({ email })),
    subject: `New VogueGarb order #${ref} — ${naira(order.total)}`,
    html,
    text,
  });
}
