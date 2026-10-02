export type OrderEmailData = {
  id: string;
  total: number;
  full_name: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  order_items: { name: string; unit_price: number; size: string | null; quantity: number }[];
};

const naira = (n: number) =>
  new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(n);

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export async function sendOrderConfirmation({ to, order }: { to: string; order: OrderEmailData }) {
  const base = process.env.MAILGUN_API_BASE ?? "https://api.mailgun.net";
  const domain = process.env.MAILGUN_DOMAIN;
  const apiKey = process.env.MAILGUN_API_KEY;
  const from = process.env.MAILGUN_FROM ?? `VogueGarb <orders@${domain}>`;
  if (!domain || !apiKey) throw new Error("Mailgun env vars missing");

  const shortId = order.id.slice(0, 8).toUpperCase();

  const rowsHtml = order.order_items
    .map(
      (i) =>
        `<tr><td style="padding:6px 0">${esc(i.name)}${i.size ? ` (${esc(i.size)})` : ""} x ${i.quantity}</td>` +
        `<td style="padding:6px 0;text-align:right">${naira(i.unit_price * i.quantity)}</td></tr>`
    )
    .join("");

  const html = `
  <div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;color:#111">
    <h2 style="margin-bottom:4px">Thank you for your order, ${esc(order.full_name)}!</h2>
    <p style="margin-top:0;color:#555">Order #${shortId}</p>
    <table style="width:100%;border-collapse:collapse;border-top:1px solid #ddd;border-bottom:1px solid #ddd">${rowsHtml}</table>
    <p style="text-align:right;font-size:18px"><strong>Total: ${naira(order.total)}</strong></p>
    <h4 style="margin-bottom:4px">Delivery details</h4>
    <p style="margin-top:0">${esc(order.address)}, ${esc(order.city)}, ${esc(order.state)}<br>${esc(order.phone)}</p>
    <p style="color:#555">We'll be in touch to confirm delivery. - VogueGarb</p>
  </div>`;

  const text =
    `Thank you for your order, ${order.full_name}!\nOrder #${shortId}\n\n` +
    order.order_items
      .map((i) => `- ${i.name}${i.size ? ` (${i.size})` : ""} x ${i.quantity}: ${naira(i.unit_price * i.quantity)}`)
      .join("\n") +
    `\n\nTotal: ${naira(order.total)}\n\nDelivery: ${order.address}, ${order.city}, ${order.state}\n${order.phone}\n\n- VogueGarb`;

  const res = await fetch(`${base}/v3/${domain}/messages`, {
    method: "POST",
    headers: { Authorization: "Basic " + Buffer.from(`api:${apiKey}`).toString("base64") },
    body: new URLSearchParams({ from, to, subject: `VogueGarb order #${shortId} confirmed`, text, html }),
  });

  if (!res.ok) throw new Error(`Mailgun ${res.status}: ${await res.text()}`);
}