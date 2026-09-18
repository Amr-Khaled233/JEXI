import { COLORS, ORDER_STATUSES, type ColorKey, type OrderStatusKey } from "@/lib/constants";
import { formatMoney } from "@/lib/money";
import { PAYMENT_LABELS } from "@/lib/payments";
import { appUrl, escapeHtml as e, formatDate } from "@/lib/utils";

export type EmailOrder = {
  orderNumber: string;
  accessToken: string;
  status: OrderStatusKey;
  customerName: string;
  email: string;
  phone: string;
  governorate: string;
  area: string;
  address: string;
  notes: string | null;
  paymentMethod: "COD";
  subtotal: number;
  discount: number;
  shippingFee: number;
  total: number;
  promoCode: string | null;
  createdAt: Date;
  items: {
    name: string;
    color: ColorKey | null;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
    contents: unknown;
  }[];
};

const GOLD = "#b8906a";
const INK = "#1a130e";
const MUTED = "#7a6a5b";
const LINE = "#e8dfd2";

function layout(title: string, preheader: string, body: string) {
  return `<!doctype html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${e(title)}</title></head>
<body style="margin:0;padding:0;background:#f6f1ea;font-family:Helvetica,Arial,sans-serif;color:${INK};">
<span style="display:none;max-height:0;overflow:hidden;opacity:0;">${e(preheader)}</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6f1ea;padding:24px 12px;">
<tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:6px;overflow:hidden;">
<tr><td align="center" style="background:#120d0a;padding:32px 24px;">
  <div style="font-family:Georgia,'Times New Roman',serif;font-size:30px;letter-spacing:14px;color:#d4b08c;padding-left:14px;">JEXI</div>
  <div style="width:90px;height:1px;background:${GOLD};margin:12px auto;"></div>
  <div style="font-size:10px;letter-spacing:6px;color:#c9a27a;padding-left:6px;">ACCESSORIES</div>
</td></tr>
<tr><td style="padding:32px 28px;">${body}</td></tr>
<tr><td style="padding:20px 28px;border-top:1px solid ${LINE};font-size:12px;color:${MUTED};text-align:center;">
  JEXI Accessories · <a href="${appUrl()}" style="color:${GOLD};">${e(appUrl().replace(/^https?:\/\//, ""))}</a>
</td></tr>
</table>
</td></tr></table>
</body></html>`;
}

function heading(text: string) {
  return `<h1 style="font-family:Georgia,'Times New Roman',serif;font-weight:normal;font-size:24px;margin:0 0 12px;color:${INK};">${e(text)}</h1>`;
}

function paragraph(html: string) {
  return `<p style="font-size:14px;line-height:1.6;margin:0 0 16px;color:#3b2f26;">${html}</p>`;
}

function button(href: string, label: string) {
  return `<a href="${href}" style="display:inline-block;background:${INK};color:#e9cfae;text-decoration:none;padding:12px 26px;font-size:12px;letter-spacing:2px;text-transform:uppercase;border-radius:2px;">${e(label)}</a>`;
}

function contentsList(contents: unknown) {
  if (!Array.isArray(contents)) return "";
  return contents
    .map((c: { name?: string; color?: ColorKey; quantity?: number }) => {
      const color = c.color && COLORS[c.color] ? ` · ${COLORS[c.color].label}` : "";
      return `<div style="font-size:12px;color:${MUTED};">— ${e(String(c.name ?? ""))}${color}${(c.quantity ?? 1) > 1 ? ` × ${c.quantity}` : ""}</div>`;
    })
    .join("");
}

function itemsTable(order: EmailOrder) {
  const rows = order.items
    .map(
      (i) => `<tr>
  <td style="padding:10px 0;border-bottom:1px solid ${LINE};font-size:14px;">
    ${e(i.name)}${i.color ? `<div style="font-size:12px;color:${MUTED};">${COLORS[i.color].label}</div>` : ""}
    ${contentsList(i.contents)}
  </td>
  <td style="padding:10px 0;border-bottom:1px solid ${LINE};font-size:14px;text-align:center;white-space:nowrap;">× ${i.quantity}</td>
  <td style="padding:10px 0;border-bottom:1px solid ${LINE};font-size:14px;text-align:right;white-space:nowrap;">${formatMoney(i.lineTotal)}</td>
</tr>`,
    )
    .join("");

  const totalRow = (label: string, value: string, bold = false) =>
    `<tr><td colspan="2" style="padding:4px 0;font-size:14px;${bold ? "font-weight:bold;" : `color:${MUTED};`}">${label}</td><td style="padding:4px 0;font-size:14px;text-align:right;${bold ? "font-weight:bold;" : ""}">${value}</td></tr>`;

  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:8px 0 20px;">
${rows}
<tr><td colspan="3" style="height:10px;"></td></tr>
${totalRow("Subtotal", formatMoney(order.subtotal))}
${order.discount > 0 ? totalRow(`Discount${order.promoCode ? ` (${e(order.promoCode)})` : ""}`, `− ${formatMoney(order.discount)}`) : ""}
${totalRow("Shipping", order.shippingFee === 0 ? "Free Shipping" : formatMoney(order.shippingFee))}
${totalRow("Total", formatMoney(order.total), true)}
</table>`;
}

function addressBlock(order: EmailOrder) {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#faf6f0;border-radius:4px;margin-bottom:20px;"><tr><td style="padding:16px;font-size:13px;line-height:1.6;">
  <strong>${e(order.customerName)}</strong><br>
  ${e(order.address)}<br>
  ${e(order.area)}, ${e(order.governorate)}<br>
  ${e(order.phone)} · ${e(order.email)}
  ${order.notes ? `<br><em style="color:${MUTED};">Note: ${e(order.notes)}</em>` : ""}
  <br><span style="color:${MUTED};">Payment: ${PAYMENT_LABELS[order.paymentMethod]}</span>
</td></tr></table>`;
}

function textSummary(order: EmailOrder) {
  const items = order.items.map((i) => `- ${i.name}${i.color ? ` (${COLORS[i.color].label})` : ""} x${i.quantity}: ${formatMoney(i.lineTotal)}`);
  return [
    `Order ${order.orderNumber}`,
    ...items,
    `Subtotal: ${formatMoney(order.subtotal)}`,
    ...(order.discount > 0 ? [`Discount: -${formatMoney(order.discount)}`] : []),
    `Shipping: ${order.shippingFee === 0 ? "Free" : formatMoney(order.shippingFee)}`,
    `Total: ${formatMoney(order.total)}`,
    "",
    `Ship to: ${order.customerName}, ${order.address}, ${order.area}, ${order.governorate}. Phone: ${order.phone}`,
  ].join("\n");
}

function orderLink(order: EmailOrder) {
  return appUrl(`/order/${encodeURIComponent(order.orderNumber)}?t=${order.accessToken}`);
}

// ─── Templates ────────────────────────────────────────────

export function adminNewOrderEmail(order: EmailOrder) {
  const subject = `New order ${order.orderNumber} — ${formatMoney(order.total)}`;
  const html = layout(
    subject,
    `${order.customerName} placed an order for ${formatMoney(order.total)}`,
    heading("New order received") +
      paragraph(`Order <strong>${e(order.orderNumber)}</strong> was placed on ${e(formatDate(order.createdAt, true))}.`) +
      addressBlock(order) +
      itemsTable(order) +
      `<div style="text-align:center;">${button(appUrl("/admin/orders"), "Open in dashboard")}</div>`,
  );
  return { subject, html, text: `New order received.\n\n${textSummary(order)}\n\nDashboard: ${appUrl("/admin/orders")}` };
}

export function customerConfirmationEmail(order: EmailOrder) {
  const subject = `Your JEXI order ${order.orderNumber} is confirmed`;
  const html = layout(
    subject,
    `Thank you, ${order.customerName.split(" ")[0]} — we've received your order.`,
    heading(`Thank you, ${order.customerName.split(" ")[0]}`) +
      paragraph(
        `We've received your order <strong>${e(order.orderNumber)}</strong> and will contact you shortly to confirm delivery. You'll receive an email each time its status changes.`,
      ) +
      itemsTable(order) +
      addressBlock(order) +
      paragraph(
        `Track your order any time at <a href="${appUrl("/track")}" style="color:${GOLD};">${e(appUrl("/track").replace(/^https?:\/\//, ""))}</a> using your order number and email or phone.`,
      ) +
      `<div style="text-align:center;">${button(orderLink(order), "View your order")}</div>`,
  );
  return {
    subject,
    html,
    text: `Thank you for your order!\n\n${textSummary(order)}\n\nView your order: ${orderLink(order)}\nTrack: ${appUrl("/track")}`,
  };
}

const STATUS_HEADLINES: Record<OrderStatusKey, string> = {
  PENDING: "We've received your order",
  CONFIRMED: "Your order is confirmed",
  PROCESSING: "Your order is being prepared",
  SHIPPED: "Your order has shipped!",
  DELIVERED: "Your order was delivered",
  CANCELLED: "Your order was cancelled",
};

export function customerStatusEmail(order: EmailOrder, status: OrderStatusKey, note?: string | null) {
  const headline = STATUS_HEADLINES[status];
  const subject = `${headline} — ${order.orderNumber}`;
  const html = layout(
    subject,
    ORDER_STATUSES[status].description,
    heading(headline) +
      paragraph(`${e(ORDER_STATUSES[status].description)}`) +
      paragraph(`Order <strong>${e(order.orderNumber)}</strong> · Status: <strong>${ORDER_STATUSES[status].label}</strong>`) +
      (note ? paragraph(`<em>${e(note)}</em>`) : "") +
      itemsTable(order) +
      `<div style="text-align:center;">${button(orderLink(order), "Track your order")}</div>`,
  );
  return {
    subject,
    html,
    text: `${headline}\n\n${ORDER_STATUSES[status].description}${note ? `\n\n${note}` : ""}\n\n${textSummary(order)}\n\nTrack: ${orderLink(order)}`,
  };
}
