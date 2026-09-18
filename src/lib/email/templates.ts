// Branded HTML emails. Table-based layout with inline styles so they render
// consistently in Gmail, Apple Mail and Outlook, on desktop and phone.
// Copy is written without decorative punctuation (no dashes, middle dots or "×").

import { COLORS, ORDER_FLOW, type ColorKey, type OrderStatusKey } from "@/lib/constants";
import { formatMoney } from "@/lib/money";
import { appUrl, escapeHtml as e, formatDate } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────

export type EmailBrand = {
  storeName: string;
  contactEmail: string | null;
  whatsapp: string | null;
  instagram: string | null;
};

export type EmailOrder = {
  id: string;
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
    image: string | null;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
    contents: unknown;
  }[];
};

// ─── Design tokens ────────────────────────────────────────

const C = {
  page: "#f3ede4",
  card: "#ffffff",
  dark: "#110c09",
  ink: "#1c140f",
  body: "#4a3d33",
  muted: "#8a7a6b",
  line: "#ece3d6",
  soft: "#faf6f0",
  gold: "#b8906a",
  goldText: "#9b7048",
  goldLight: "#dcb993",
  success: "#3f7a4e",
  danger: "#a8443a",
};
const SERIF = "Georgia, 'Times New Roman', Times, serif";
const SANS = "'Helvetica Neue', Helvetica, Arial, sans-serif";

// ─── Helpers ──────────────────────────────────────────────

/** Remove typographic dashes and dots that read as clutter ("2–4 days" becomes "2 to 4 days"). */
function tidy(s: string) {
  return s
    .replace(/(\d)\s*[–—]\s*(\d)/g, "$1 to $2")
    .replace(/\s*[–—]\s*/g, ", ")
    .replace(/\s*·\s*/g, ", ");
}

function absolute(src: string | null) {
  if (!src) return null;
  return /^https?:\/\//.test(src) ? src : appUrl(src);
}

function firstName(name: string) {
  return name.trim().split(/\s+/)[0] ?? name;
}

function whatsappLink(number: string | null) {
  if (!number) return null;
  const digits = number.replace(/\D/g, "");
  if (!digits) return null;
  return `https://wa.me/${digits.startsWith("0") ? `2${digits}` : digits}`;
}

function orderLink(order: EmailOrder) {
  return appUrl(`/order/${encodeURIComponent(order.orderNumber)}?t=${order.accessToken}`);
}

function colorLabel(color: ColorKey | null | undefined) {
  return color && COLORS[color] ? tidy(COLORS[color].label.replace(" / ", " or ")) : null;
}

// ─── Building blocks ──────────────────────────────────────

function layout(opts: { title: string; preheader: string; body: string; brand: EmailBrand; footerNote: string }) {
  const { title, preheader, body, brand, footerNote } = opts;
  const wa = whatsappLink(brand.whatsapp);
  const links = [
    `<a href="${appUrl("/shop")}" style="color:${C.goldText};text-decoration:none;white-space:nowrap;">Shop</a>`,
    `<a href="${appUrl("/track")}" style="color:${C.goldText};text-decoration:none;white-space:nowrap;">Track an order</a>`,
    brand.instagram ? `<a href="https://instagram.com/${e(brand.instagram.replace(/^@/, ""))}" style="color:${C.goldText};text-decoration:none;white-space:nowrap;">Instagram</a>` : null,
    wa ? `<a href="${wa}" style="color:${C.goldText};text-decoration:none;white-space:nowrap;">WhatsApp</a>` : null,
  ]
    .filter(Boolean)
    .join(`<span style="color:${C.line};">&nbsp;&nbsp;&nbsp;&nbsp;</span>`);

  return `<!doctype html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="x-apple-disable-message-reformatting">
<meta name="color-scheme" content="light only">
<meta name="supported-color-schemes" content="light only">
<title>${e(title)}</title>
<style>
  @media only screen and (max-width: 520px) {
    .px { padding-left: 22px !important; padding-right: 22px !important; }
    .stack td { display: block !important; width: auto !important; border-left: 0 !important; }
    .stack td + td { border-top: 1px solid ${C.line} !important; }
    .cols td { display: block !important; width: auto !important; padding: 0 0 12px !important; }
    .step-label { font-size: 9px !important; letter-spacing: 0 !important; }
  }
</style>
</head>
<body style="margin:0;padding:0;background:${C.page};-webkit-text-size-adjust:100%;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${e(preheader)}${"&#847;&zwnj;&nbsp;".repeat(60)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${C.page};">
<tr><td align="center" style="padding:32px 12px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;background:${C.card};border-radius:10px;overflow:hidden;border:1px solid ${C.line};">

<tr><td align="center" style="background:${C.dark};padding:42px 24px 36px;">
  <div style="font-family:${SERIF};font-size:34px;line-height:1;letter-spacing:14px;color:${C.goldLight};padding-left:14px;">JEXI</div>
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:14px auto;">
    <tr>
      <td style="width:46px;height:1px;background:${C.gold};font-size:0;line-height:0;">&nbsp;</td>
      <td style="padding:0 6px;"><div style="width:5px;height:5px;border-radius:5px;background:${C.gold};font-size:0;line-height:0;">&nbsp;</div></td>
      <td style="width:46px;height:1px;background:${C.gold};font-size:0;line-height:0;">&nbsp;</td>
    </tr>
  </table>
  <div style="font-family:${SANS};font-size:10px;letter-spacing:6px;color:${C.gold};padding-left:6px;">ACCESSORIES</div>
</td></tr>

${body}

<tr><td class="px" style="background:${C.soft};border-top:1px solid ${C.line};padding:30px 40px;text-align:center;font-family:${SANS};">
  <div style="font-size:13px;line-height:1.6;">${links}</div>
  <div style="font-size:12px;line-height:1.7;color:${C.muted};margin-top:14px;">${e(footerNote)}</div>
  <div style="font-size:11px;color:${C.muted};margin-top:10px;letter-spacing:1px;">&copy; ${new Date().getFullYear()} ${e(brand.storeName)}</div>
</td></tr>

</table>
</td></tr>
</table>
</body>
</html>`;
}

function intro(eyebrow: string, heading: string, text: string) {
  return `<tr><td class="px" style="padding:44px 44px 8px;font-family:${SANS};">
  <div style="font-size:11px;letter-spacing:3px;text-transform:uppercase;color:${C.goldText};font-weight:bold;">${e(eyebrow)}</div>
  <h1 style="margin:12px 0 14px;font-family:${SERIF};font-weight:normal;font-size:29px;line-height:1.25;color:${C.ink};">${e(heading)}</h1>
  <p style="margin:0;font-size:15px;line-height:1.7;color:${C.body};">${text}</p>
</td></tr>`;
}

function spacer(h = 28) {
  return `<tr><td style="height:${h}px;font-size:0;line-height:0;">&nbsp;</td></tr>`;
}

/** Five-step progress tracker, or a notice when the order was cancelled. */
function tracker(status: OrderStatusKey) {
  if (status === "CANCELLED") {
    return `<tr><td class="px" style="padding:24px 44px 0;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#fbf1ef;border-radius:8px;">
    <tr><td style="padding:16px 20px;font-family:${SANS};font-size:14px;color:${C.danger};">This order has been cancelled.</td></tr>
  </table>
</td></tr>`;
  }
  const labels: Record<string, string> = { PENDING: "Placed", CONFIRMED: "Confirmed", PROCESSING: "Preparing", SHIPPED: "On its way", DELIVERED: "Delivered" };
  const current = ORDER_FLOW.indexOf(status);
  const cells = ORDER_FLOW.map((s, i) => {
    const done = i <= current;
    const lineLeft = i === 0 ? "transparent" : i <= current ? C.gold : C.line;
    const lineRight = i === ORDER_FLOW.length - 1 ? "transparent" : i < current ? C.gold : C.line;
    const dot = done
      ? `<div style="width:24px;height:24px;border-radius:24px;background:${C.gold};color:#ffffff;font-family:${SANS};font-size:12px;line-height:24px;text-align:center;font-weight:bold;">&#10003;</div>`
      : `<div style="width:20px;height:20px;border-radius:20px;border:2px solid ${C.line};background:#ffffff;font-size:0;line-height:0;">&nbsp;</div>`;
    return `<td width="20%" align="center" valign="top" style="padding:0;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
        <td valign="middle" style="padding:0;"><div style="height:2px;background:${lineLeft};font-size:0;line-height:0;">&nbsp;</div></td>
        <td width="24" align="center" style="padding:0;">${dot}</td>
        <td valign="middle" style="padding:0;"><div style="height:2px;background:${lineRight};font-size:0;line-height:0;">&nbsp;</div></td>
      </tr></table>
      <div class="step-label" style="margin-top:8px;font-family:${SANS};font-size:11px;line-height:1.3;letter-spacing:0.5px;color:${done ? C.ink : C.muted};${i === current ? "font-weight:bold;" : ""}">${labels[s]}</div>
    </td>`;
  }).join("");
  return `<tr><td class="px" style="padding:30px 32px 0;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>${cells}</tr></table>
</td></tr>`;
}

function metaStrip(items: { label: string; value: string }[]) {
  const cells = items
    .map(
      (m, i) => `<td valign="top" style="padding:16px 18px;${i > 0 ? `border-left:1px solid ${C.line};` : ""}font-family:${SANS};">
      <div style="font-size:10px;letter-spacing:2px;text-transform:uppercase;color:${C.muted};">${e(m.label)}</div>
      <div style="margin-top:5px;font-size:14px;color:${C.ink};font-weight:bold;">${e(m.value)}</div>
    </td>`,
    )
    .join("");
  return `<tr><td class="px" style="padding:28px 44px 0;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="stack" style="background:${C.soft};border-radius:8px;"><tr>${cells}</tr></table>
</td></tr>`;
}

function sectionTitle(text: string) {
  return `<div style="font-family:${SANS};font-size:11px;letter-spacing:3px;text-transform:uppercase;color:${C.goldText};font-weight:bold;padding-bottom:6px;">${e(text)}</div>`;
}

function itemsBlock(order: EmailOrder, title: string) {
  const rows = order.items
    .map((item) => {
      const img = absolute(item.image);
      const details = [colorLabel(item.color), item.quantity > 1 ? `Qty ${item.quantity}` : null].filter(Boolean).join(", ");
      const contents = Array.isArray(item.contents)
        ? (item.contents as { name?: string; color?: ColorKey; quantity?: number }[])
            .map((c) => `${e(String(c.name ?? ""))}${colorLabel(c.color) ? ` in ${colorLabel(c.color)}` : ""}${(c.quantity ?? 1) > 1 ? `, Qty ${c.quantity}` : ""}`)
            .join("<br>")
        : "";
      return `<tr>
      <td width="76" valign="top" style="padding:16px 0;border-bottom:1px solid ${C.line};">
        ${
          img
            ? `<img src="${e(img)}" width="64" height="80" alt="" style="display:block;width:64px;height:80px;object-fit:cover;border-radius:6px;background:${C.soft};border:0;">`
            : `<div style="width:64px;height:80px;border-radius:6px;background:${C.soft};"></div>`
        }
      </td>
      <td valign="top" style="padding:16px 12px 16px 4px;border-bottom:1px solid ${C.line};font-family:${SANS};">
        <div style="font-family:${SERIF};font-size:17px;line-height:1.3;color:${C.ink};">${e(item.name)}</div>
        ${details ? `<div style="margin-top:4px;font-size:13px;color:${C.muted};">${e(details)}</div>` : ""}
        ${contents ? `<div style="margin-top:8px;font-size:12px;line-height:1.6;color:${C.muted};"><span style="color:${C.goldText};">Includes</span><br>${contents}</div>` : ""}
      </td>
      <td valign="top" align="right" style="padding:16px 0;border-bottom:1px solid ${C.line};font-family:${SANS};font-size:15px;color:${C.ink};white-space:nowrap;">${formatMoney(item.lineTotal)}</td>
    </tr>`;
    })
    .join("");

  const line = (label: string, value: string, color: string = C.body) =>
    `<tr><td style="padding:5px 0;font-family:${SANS};font-size:14px;color:${C.muted};">${label}</td><td align="right" style="padding:5px 0;font-family:${SANS};font-size:14px;color:${color};">${value}</td></tr>`;

  return `<tr><td class="px" style="padding:34px 44px 0;">
  ${sectionTitle(title)}
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">${rows}</table>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:14px;">
    ${line("Subtotal", formatMoney(order.subtotal))}
    ${order.discount > 0 ? line(`Discount${order.promoCode ? ` (${e(order.promoCode)})` : ""}`, `-${formatMoney(order.discount)}`, C.success) : ""}
    ${line("Shipping", order.shippingFee === 0 ? "Free" : formatMoney(order.shippingFee), order.shippingFee === 0 ? C.goldText : C.body)}
    <tr><td colspan="2" style="padding-top:10px;border-bottom:1px solid ${C.line};font-size:0;line-height:0;">&nbsp;</td></tr>
    <tr>
      <td style="padding:14px 0 0;font-family:${SANS};font-size:15px;color:${C.ink};font-weight:bold;">Total</td>
      <td align="right" style="padding:14px 0 0;font-family:${SANS};font-size:20px;font-weight:bold;color:${C.ink};">${formatMoney(order.total)}</td>
    </tr>
  </table>
</td></tr>`;
}

/** Two cards side by side on desktop, stacked on phones. */
function twoCards(left: { title: string; html: string }, right: { title: string; html: string }) {
  const card = (c: { title: string; html: string }) =>
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${C.soft};border-radius:8px;"><tr><td style="padding:18px 20px;font-family:${SANS};font-size:14px;line-height:1.65;color:${C.body};">
        <div style="font-size:10px;letter-spacing:2px;text-transform:uppercase;color:${C.muted};margin-bottom:6px;">${e(c.title)}</div>
        ${c.html}
      </td></tr></table>`;
  return `<tr><td class="px" style="padding:30px 44px 0;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="cols"><tr>
    <td width="50%" valign="top" style="padding-right:8px;">${card(left)}</td>
    <td width="50%" valign="top" style="padding-left:8px;">${card(right)}</td>
  </tr></table>
</td></tr>`;
}

function addressHtml(order: EmailOrder) {
  return `<strong style="color:${C.ink};">${e(order.customerName)}</strong><br>${e(order.address)}<br>${e(order.area)}, ${e(order.governorate)}<br>${e(order.phone)}${
    order.notes ? `<br><span style="color:${C.muted};font-style:italic;">${e(tidy(order.notes))}</span>` : ""
  }`;
}

function button(href: string, label: string, opts: { tone?: "dark" | "gold"; top?: number } = {}) {
  const dark = (opts.tone ?? "dark") === "dark";
  return `<tr><td class="px" align="center" style="padding:${opts.top ?? 36}px 44px 0;">
  <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
    <td align="center" style="background:${dark ? C.ink : C.gold};border-radius:4px;">
      <a href="${href}" style="display:inline-block;padding:16px 36px;font-family:${SANS};font-size:12px;letter-spacing:2.5px;text-transform:uppercase;color:${dark ? "#ecd3b1" : "#ffffff"};text-decoration:none;font-weight:bold;">${e(label)}</a>
    </td>
  </tr></table>
</td></tr>`;
}

function noteBox(title: string, text: string) {
  return `<tr><td class="px" style="padding:26px 44px 0;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-left:3px solid ${C.gold};background:${C.soft};border-radius:0 8px 8px 0;"><tr><td style="padding:16px 20px;font-family:${SANS};">
    <div style="font-size:10px;letter-spacing:2px;text-transform:uppercase;color:${C.muted};">${e(title)}</div>
    <div style="margin-top:6px;font-size:14px;line-height:1.65;color:${C.ink};">${e(text).replace(/\n/g, "<br>")}</div>
  </td></tr></table>
</td></tr>`;
}

function helpLine(brand: EmailBrand) {
  const wa = whatsappLink(brand.whatsapp);
  const text = wa
    ? `Questions about your order? Reply to this email or <a href="${wa}" style="color:${C.goldText};">message us on WhatsApp</a>.`
    : "Questions about your order? Just reply to this email and we will be happy to help.";
  return `<tr><td class="px" style="padding:30px 44px 44px;text-align:center;font-family:${SANS};font-size:13px;line-height:1.7;color:${C.muted};">${text}</td></tr>`;
}

function textFooter(brand: EmailBrand) {
  return `\n\n${brand.storeName}\n${appUrl()}`;
}

function textItems(order: EmailOrder) {
  const lines = order.items.map((i) => {
    const details = [colorLabel(i.color), i.quantity > 1 ? `Qty ${i.quantity}` : null].filter(Boolean).join(", ");
    return `${i.name}${details ? ` (${details})` : ""}: ${formatMoney(i.lineTotal)}`;
  });
  return [
    ...lines,
    "",
    `Subtotal: ${formatMoney(order.subtotal)}`,
    ...(order.discount > 0 ? [`Discount: -${formatMoney(order.discount)}`] : []),
    `Shipping: ${order.shippingFee === 0 ? "Free" : formatMoney(order.shippingFee)}`,
    `Total: ${formatMoney(order.total)}`,
  ].join("\n");
}

const paymentLabel = (order: EmailOrder) => (order.paymentMethod === "COD" ? "Cash on delivery" : order.paymentMethod);

// ─── Emails ───────────────────────────────────────────────

export function adminNewOrderEmail(order: EmailOrder, brand: EmailBrand) {
  const subject = `New order ${order.orderNumber} for ${formatMoney(order.total)}`;
  const wa = whatsappLink(order.phone);
  const body =
    intro(
      "New order",
      `New order from ${order.customerName}`,
      `Order <strong style="color:${C.ink};">${e(order.orderNumber)}</strong> was placed on ${e(formatDate(order.createdAt, true))}. Call the customer to confirm the delivery.`,
    ) +
    metaStrip([
      { label: "Order", value: order.orderNumber },
      { label: "Total", value: formatMoney(order.total) },
      { label: "Payment", value: paymentLabel(order) },
    ]) +
    itemsBlock(order, "Items ordered") +
    twoCards(
      { title: "Deliver to", html: addressHtml(order) },
      {
        title: "Contact",
        html: `<a href="tel:${e(order.phone)}" style="color:${C.goldText};text-decoration:none;">Call ${e(order.phone)}</a><br>${
          wa ? `<a href="${wa}" style="color:${C.goldText};text-decoration:none;">Open WhatsApp</a><br>` : ""
        }<a href="mailto:${e(order.email)}" style="color:${C.goldText};text-decoration:none;">${e(order.email)}</a>`,
      },
    ) +
    button(appUrl(`/admin/orders/${order.id}`), "Open in dashboard") +
    spacer(44);

  return {
    subject,
    html: layout({ title: subject, preheader: `${order.customerName} ordered ${order.items.length} ${order.items.length === 1 ? "item" : "items"} in ${order.governorate}`, body, brand, footerNote: `Sent by your ${brand.storeName} store.` }),
    text: `New order ${order.orderNumber}\n\n${textItems(order)}\n\nDeliver to: ${order.customerName}, ${order.address}, ${order.area}, ${order.governorate}\nPhone: ${order.phone}\nEmail: ${order.email}${order.notes ? `\nNote: ${order.notes}` : ""}\n\nOpen in dashboard: ${appUrl(`/admin/orders/${order.id}`)}`,
  };
}

export function customerConfirmationEmail(order: EmailOrder, brand: EmailBrand) {
  const name = firstName(order.customerName);
  const subject = `We received your JEXI order ${order.orderNumber}`;
  const body =
    intro(
      "Order received",
      `Thank you, ${name}`,
      "We have received your order and will call you shortly to confirm the delivery. You will get an email from us each time your order moves forward.",
    ) +
    tracker("PENDING") +
    metaStrip([
      { label: "Order number", value: order.orderNumber },
      { label: "Date", value: formatDate(order.createdAt) },
      { label: "Total", value: formatMoney(order.total) },
    ]) +
    itemsBlock(order, "Your pieces") +
    twoCards(
      { title: "Delivery address", html: addressHtml(order) },
      {
        title: "Payment",
        html: `<strong style="color:${C.ink};">${paymentLabel(order)}</strong><br>Please have ${formatMoney(order.total)} ready when your order arrives.`,
      },
    ) +
    button(orderLink(order), "View your order") +
    helpLine(brand);

  return {
    subject,
    html: layout({ title: subject, preheader: `Thank you ${name}. Your order ${order.orderNumber} for ${formatMoney(order.total)} is in.`, body, brand, footerNote: `You are receiving this email because you placed an order with ${brand.storeName}.` }),
    text: `Thank you, ${name}.\n\nWe have received your order ${order.orderNumber} and will call you shortly to confirm the delivery.\n\n${textItems(order)}\n\nDelivery address: ${order.address}, ${order.area}, ${order.governorate}\nPayment: Cash on delivery\n\nView your order: ${orderLink(order)}${textFooter(brand)}`,
  };
}

const STATUS_COPY: Record<OrderStatusKey, { eyebrow: string; subject: string; heading: (name: string) => string; text: string }> = {
  PENDING: {
    eyebrow: "Order received",
    subject: "We received your JEXI order",
    heading: (n) => `Thank you, ${n}`,
    text: "We have received your order and will call you shortly to confirm the delivery.",
  },
  CONFIRMED: {
    eyebrow: "Order confirmed",
    subject: "Your JEXI order is confirmed",
    heading: () => "Your order is confirmed",
    text: "Good news. Your order is confirmed and our team will start preparing your pieces.",
  },
  PROCESSING: {
    eyebrow: "Being prepared",
    subject: "Your JEXI order is being prepared",
    heading: () => "Your pieces are being prepared",
    text: "We are carefully preparing and packing your pieces in our signature JEXI packaging.",
  },
  SHIPPED: {
    eyebrow: "On its way",
    subject: "Your JEXI order is on its way",
    heading: () => "Your order is on its way",
    text: "Your order has left our studio and is heading to you. Our courier will call you before delivery.",
  },
  DELIVERED: {
    eyebrow: "Delivered",
    subject: "Your JEXI order has been delivered",
    heading: (n) => `Enjoy your new pieces, ${n}`,
    text: "Your order has been delivered. We hope you love it, and thank you for choosing JEXI.",
  },
  CANCELLED: {
    eyebrow: "Order cancelled",
    subject: "Your JEXI order has been cancelled",
    heading: () => "Your order has been cancelled",
    text: "Your order has been cancelled. If this is unexpected, or you would like to place it again, just reply to this email.",
  },
};

export function customerStatusEmail(order: EmailOrder, status: OrderStatusKey, brand: EmailBrand, opts: { note?: string | null; estimatedDelivery?: string | null } = {}) {
  const copy = STATUS_COPY[status];
  const name = firstName(order.customerName);
  const subject = `${copy.subject} ${order.orderNumber}`;
  const eta = status === "SHIPPED" && opts.estimatedDelivery ? tidy(opts.estimatedDelivery) : null;

  const meta = [
    { label: "Order number", value: order.orderNumber },
    eta ? { label: "Estimated delivery", value: eta } : { label: "Date", value: formatDate(order.createdAt) },
    { label: "Total", value: formatMoney(order.total) },
  ];

  const body =
    intro(copy.eyebrow, copy.heading(name), e(copy.text)) +
    tracker(status) +
    (opts.note?.trim() ? noteBox("A note from JEXI", opts.note.trim()) : "") +
    metaStrip(meta) +
    itemsBlock(order, status === "CANCELLED" ? "Cancelled items" : "Your pieces") +
    (status === "CANCELLED" ? "" : button(orderLink(order), status === "DELIVERED" ? "View your order" : "Track your order")) +
    (status === "DELIVERED" ? button(appUrl("/shop"), "Shop the collection", { tone: "gold", top: 12 }) : "") +
    helpLine(brand);

  return {
    subject,
    html: layout({ title: subject, preheader: copy.text, body, brand, footerNote: `You are receiving this email because you placed an order with ${brand.storeName}.` }),
    text: `${copy.heading(name)}\n\n${copy.text}${eta ? `\nEstimated delivery: ${eta}` : ""}${opts.note?.trim() ? `\n\nA note from JEXI: ${opts.note.trim()}` : ""}\n\nOrder ${order.orderNumber}\n${textItems(order)}\n\nTrack your order: ${orderLink(order)}${textFooter(brand)}`,
  };
}

const STATUS_PILL: Record<OrderStatusKey, { label: string; bg: string; fg: string }> = {
  PENDING: { label: "Received", bg: "#f6ecdc", fg: "#8a5a17" },
  CONFIRMED: { label: "Confirmed", bg: "#f3e9dd", fg: C.goldText },
  PROCESSING: { label: "Being prepared", bg: "#f3e9dd", fg: C.goldText },
  SHIPPED: { label: "On its way", bg: "#1c140f", fg: "#ecd3b1" },
  DELIVERED: { label: "Delivered", bg: "#e7f1ea", fg: C.success },
  CANCELLED: { label: "Cancelled", bg: "#fbf1ef", fg: C.danger },
};

/** Sent from Track Order: every recent order for an email address, each with its private link. */
export function customerOrdersEmail(
  orders: { orderNumber: string; accessToken: string; status: OrderStatusKey; total: number; createdAt: Date; itemCount: number }[],
  brand: EmailBrand,
) {
  const subject = orders.length === 1 ? "Your JEXI order" : `Your ${orders.length} JEXI orders`;
  const rows = orders
    .map((o) => {
      const pill = STATUS_PILL[o.status];
      const link = appUrl(`/order/${encodeURIComponent(o.orderNumber)}?t=${o.accessToken}`);
      return `<tr><td style="padding:18px 0;border-bottom:1px solid ${C.line};font-family:${SANS};">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
        <td valign="top">
          <div style="font-size:15px;font-weight:bold;color:${C.ink};">${e(o.orderNumber)}</div>
          <div style="margin-top:4px;font-size:13px;color:${C.muted};">${e(formatDate(o.createdAt))}, ${o.itemCount} ${o.itemCount === 1 ? "item" : "items"}, ${formatMoney(o.total)}</div>
          <div style="margin-top:10px;"><span style="display:inline-block;padding:4px 10px;border-radius:20px;background:${pill.bg};color:${pill.fg};font-size:11px;letter-spacing:1px;text-transform:uppercase;font-weight:bold;">${pill.label}</span></div>
        </td>
        <td valign="middle" align="right" style="white-space:nowrap;">
          <a href="${link}" style="display:inline-block;padding:10px 18px;border:1px solid ${C.ink};border-radius:4px;color:${C.ink};font-size:11px;letter-spacing:2px;text-transform:uppercase;text-decoration:none;font-weight:bold;">View</a>
        </td>
      </tr></table>
    </td></tr>`;
    })
    .join("");

  const body =
    intro("Track your order", orders.length === 1 ? "Here is your order" : "Here are your orders", "Tap an order to see its latest status and full details.") +
    `<tr><td class="px" style="padding:20px 44px 0;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">${rows}</table></td></tr>` +
    `<tr><td class="px" style="padding:24px 44px 0;font-family:${SANS};font-size:13px;line-height:1.7;color:${C.muted};">These links are private to you. Please don't forward this email.</td></tr>` +
    helpLine(brand);

  return {
    subject,
    html: layout({ title: subject, preheader: "Your order status and details", body, brand, footerNote: "You are receiving this email because someone asked to track orders for this address on our website." }),
    text: `Your JEXI orders\n\n${orders
      .map((o) => `${o.orderNumber}, ${formatDate(o.createdAt)}, ${formatMoney(o.total)}, ${STATUS_PILL[o.status].label}\n${appUrl(`/order/${encodeURIComponent(o.orderNumber)}?t=${o.accessToken}`)}`)
      .join("\n\n")}${textFooter(brand)}`,
  };
}

export function adminPasswordResetEmail(admin: { name: string; email: string }, link: string, ttlMinutes: number, brand: EmailBrand) {
  const subject = "Reset your JEXI dashboard password";
  const body =
    intro(
      "Password reset",
      "Reset your password",
      `A password reset was requested for the dashboard account <strong style="color:${C.ink};">${e(admin.name)}</strong> (${e(admin.email)}). Use the button below to choose a new password.`,
    ) +
    button(link, "Choose a new password") +
    `<tr><td class="px" style="padding:28px 44px 44px;font-family:${SANS};font-size:13px;line-height:1.7;color:${C.muted};text-align:center;">
      This link works once and expires in ${ttlMinutes} minutes.<br>If you did not request this, you can safely ignore this email. The password will not change.
      <div style="margin-top:18px;font-size:11px;color:${C.muted};word-break:break-all;">If the button does not work, copy this link into your browser:<br><a href="${link}" style="color:${C.goldText};">${e(link)}</a></div>
    </td></tr>`;

  return {
    subject,
    html: layout({ title: subject, preheader: `Password reset requested for ${admin.email}`, body, brand, footerNote: `Security email from your ${brand.storeName} dashboard.` }),
    text: `A password reset was requested for the dashboard account ${admin.name} (${admin.email}).\n\nChoose a new password here (works once, expires in ${ttlMinutes} minutes):\n${link}\n\nIf you did not request this, ignore this email. The password will not change.`,
  };
}
