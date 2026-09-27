import { describe, expect, it } from "vitest";
import {
  adminNewOrderEmail,
  customerConfirmationEmail,
  customerOrderPlacedEmail,
  customerStatusEmail,
  type EmailBrand,
  type EmailOrder,
} from "@/lib/email/templates";

const brand: EmailBrand = { storeName: "JEXI Accessories", contactEmail: "hello@jexi.store", whatsapp: "01012345678", instagram: "@jexi" };

const order: EmailOrder = {
  id: "order_1",
  orderNumber: "JX260920-45499",
  accessToken: "secret-token",
  status: "PENDING",
  customerName: "Nour Hassan",
  email: "nour@example.com",
  phone: "01098765432",
  governorate: "Cairo",
  area: "Maadi",
  address: "12 Road 9",
  notes: null,
  paymentMethod: "COD",
  subtotal: 95000,
  discount: 0,
  shippingFee: 6000,
  total: 101000,
  promoCode: null,
  createdAt: new Date("2026-09-20T12:00:00Z"),
  items: [{ name: "Aurelia Pendant Necklace", colorName: "Gold", image: "/uploads/a.jpg", quantity: 1, unitPrice: 95000, lineTotal: 95000, contents: null }],
};

/** The copy rule for every customer email: no decorative dashes, dots or crosses. */
const STRAY = /[–—·×]/;

describe("customerOrderPlacedEmail", () => {
  const mail = customerOrderPlacedEmail(order, brand, { paymentPhone: "01012345678" });

  it("puts the amount in the subject, where it is read first", () => {
    expect(mail.subject).toBe("Send EGP 60 shipping to confirm order JX260920-45499");
  });

  it("shows the fee and the number from the dashboard", () => {
    expect(mail.html).toContain("EGP 60");
    expect(mail.html).toContain("01012345678");
    expect(mail.html).toContain("To confirm your order");
  });

  it("says what is left to pay in cash", () => {
    expect(mail.html).toContain("EGP 950");
    expect(mail.html).toContain("cash when it arrives");
  });

  it("spells the steps out in the plain-text part too, for clients that show it", () => {
    expect(mail.text).toContain("1. Send EGP 60 to 01012345678");
    expect(mail.text).toContain("2. Send us the screenshot");
  });

  it("links the order with its access token, since there are no accounts", () => {
    expect(mail.html).toContain("t=secret-token");
  });

  it("asks for nothing when no number is set to receive the money", () => {
    const plain = customerOrderPlacedEmail(order, brand, { paymentPhone: null });
    expect(plain.subject).toBe("We received your JEXI order JX260920-45499");
    expect(plain.html).not.toContain("To confirm your order");
  });

  it("asks for nothing when shipping is free", () => {
    const free = customerOrderPlacedEmail({ ...order, shippingFee: 0, total: 95000 }, brand, { paymentPhone: "01012345678" });
    expect(free.html).not.toContain("To confirm your order");
  });

  it("keeps the copy free of stray punctuation", () => {
    expect(mail.html).not.toMatch(STRAY);
    expect(mail.text).not.toMatch(STRAY);
  });
});

describe("customerConfirmationEmail", () => {
  const mail = customerConfirmationEmail({ ...order, status: "CONFIRMED" }, brand);

  it("announces the confirmation", () => {
    expect(mail.subject).toBe("Your JEXI order JX260920-45499 is confirmed");
  });

  it("stops asking for the fee, because it has arrived", () => {
    expect(mail.html).not.toContain("To confirm your order");
    expect(mail.html).toContain("Shipping of EGP 60 received");
  });

  it("asks for the balance, not the whole total, once the fee is in", () => {
    expect(mail.html).toContain("have EGP 950 ready");
  });

  it("asks for the whole total when shipping was free", () => {
    const free = customerConfirmationEmail({ ...order, status: "CONFIRMED", shippingFee: 0, total: 95000 }, brand);
    expect(free.html).toContain("have EGP 950 ready");
    expect(free.html).not.toContain("received");
  });

  it("keeps the copy free of stray punctuation", () => {
    expect(mail.html).not.toMatch(STRAY);
  });
});

describe("customerStatusEmail", () => {
  it("names the delivery estimate when the order ships", () => {
    const mail = customerStatusEmail({ ...order, status: "SHIPPED" }, "SHIPPED", brand, { estimatedDelivery: "2–4 business days" });
    expect(mail.html).toContain("2 to 4 business days");
    expect(mail.html).not.toMatch(STRAY);
  });

  it("carries the admin's note through to the customer", () => {
    const mail = customerStatusEmail({ ...order, status: "SHIPPED" }, "SHIPPED", brand, { note: "Courier calls before 6pm" });
    expect(mail.html).toContain("Courier calls before 6pm");
  });

  it("drops the tracking button on a cancelled order", () => {
    const mail = customerStatusEmail({ ...order, status: "CANCELLED" }, "CANCELLED", brand);
    expect(mail.html).toContain("This order has been cancelled.");
    expect(mail.html).not.toContain("Track your order");
  });

  it("invites the customer back after delivery", () => {
    const mail = customerStatusEmail({ ...order, status: "DELIVERED" }, "DELIVERED", brand);
    expect(mail.html).toContain("Shop the collection");
  });

  it("escapes anything the customer typed, so a note cannot inject markup", () => {
    const mail = customerStatusEmail({ ...order, status: "SHIPPED" }, "SHIPPED", brand, { note: "<script>alert(1)</script>" });
    expect(mail.html).not.toContain("<script>");
    expect(mail.html).toContain("&lt;script&gt;");
  });
});

describe("adminNewOrderEmail", () => {
  const mail = adminNewOrderEmail(order, brand);

  it("leads with the customer and the total", () => {
    expect(mail.subject).toBe("New order JX260920-45499 for EGP 1,010");
    expect(mail.html).toContain("Nour Hassan");
  });

  it("gives the admin a way to reach the customer", () => {
    expect(mail.html).toContain("tel:01098765432");
    expect(mail.html).toContain("https://wa.me/201098765432");
  });

  it("links straight to the order in the dashboard", () => {
    expect(mail.html).toContain("/admin/orders/order_1");
  });

  it("escapes a customer name that contains markup", () => {
    const evil = adminNewOrderEmail({ ...order, customerName: '<img src=x onerror="alert(1)">' }, brand);
    expect(evil.html).not.toContain("<img src=x");
  });
});
