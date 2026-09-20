import { BadgeCheck, MessageCircle, Smartphone } from "lucide-react";
import { formatMoney } from "@/lib/money";
import { cn } from "@/lib/utils";

function waLink(number: string) {
  const digits = number.replace(/\D/g, "");
  if (!digits) return null;
  return `https://wa.me/${digits.startsWith("0") ? `2${digits}` : digits}`;
}

/**
 * The headline rule, shown at the top of checkout so it is read before the form:
 * an order is only confirmed once the shipping fee arrives. `shippingFee` is 0
 * while no governorate is chosen yet, so the amount joins the sentence later.
 */
export function ConfirmationNotice({
  shippingFee,
  cashOnDelivery,
  paymentPhone,
  pending,
  className,
}: {
  shippingFee: number;
  cashOnDelivery: number;
  paymentPhone: string | null;
  /** True until a governorate is chosen, so the fee isn't known yet. */
  pending: boolean;
  className?: string;
}) {
  if (!paymentPhone || (!pending && shippingFee <= 0)) return null;

  return (
    <div className={cn("flex gap-3 rounded-[3px] border border-gold/40 bg-gold/5 p-4 sm:gap-4 sm:p-5", className)}>
      <BadgeCheck className="mt-0.5 size-5 shrink-0 text-gold" />
      <div className="space-y-1.5">
        <p className="font-medium">Your order is confirmed once you send the shipping fee</p>
        <p className="text-sm leading-relaxed text-muted">
          {pending ? (
            <>
              Choose your governorate below to see the fee, send it to{" "}
              <strong className="whitespace-nowrap text-fg tabular-nums">{paymentPhone}</strong> and share the screenshot with us. We confirm your order,
              email you the details, and the rest is paid in cash on delivery.
            </>
          ) : (
            <>
              Send <strong className="text-fg">{formatMoney(shippingFee)}</strong> to{" "}
              <strong className="whitespace-nowrap text-fg tabular-nums">{paymentPhone}</strong> and share the screenshot with us. We confirm your order,
              email you the details, and the remaining <strong className="text-fg">{formatMoney(cashOnDelivery)}</strong> is paid in cash on delivery.
            </>
          )}
        </p>
      </div>
    </div>
  );
}

/**
 * How the customer confirms an order: send the shipping fee to the store's number,
 * then send the screenshot. Shown at checkout and again on the order page.
 */
export function PaymentInstructions({
  shippingFee,
  paymentPhone,
  whatsapp,
  orderNumber,
  className,
}: {
  shippingFee: number;
  paymentPhone: string | null;
  whatsapp: string | null;
  orderNumber?: string;
  className?: string;
}) {
  if (shippingFee <= 0 || !paymentPhone) return null;
  const wa = waLink(whatsapp || paymentPhone);

  return (
    <div className={cn("rounded-[3px] border border-gold/40 bg-gold/5 p-4", className)}>
      <p className="text-[0.68rem] font-medium tracking-[0.2em] text-gold uppercase">To confirm your order</p>
      <ol className="mt-3 space-y-3 text-sm leading-relaxed">
        <li className="flex gap-3">
          <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-gold/15 text-xs font-medium text-gold">1</span>
          <span>
            Send the shipping fee of <strong className="text-fg">{formatMoney(shippingFee)}</strong> to{" "}
            <strong className="inline-flex items-center gap-1 whitespace-nowrap text-fg tabular-nums">
              <Smartphone className="size-3.5 text-gold" /> {paymentPhone}
            </strong>
          </span>
        </li>
        <li className="flex gap-3">
          <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-gold/15 text-xs font-medium text-gold">2</span>
          <span>
            Send us the screenshot{orderNumber ? ` with your order number ${orderNumber}` : ""}
            {wa && (
              <>
                {" "}
                on{" "}
                <a href={wa} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-gold underline underline-offset-4">
                  <MessageCircle className="size-3.5" /> WhatsApp
                </a>
              </>
            )}
            .
          </span>
        </li>
        <li className="flex gap-3">
          <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-gold/15 text-xs font-medium text-gold">3</span>
          <span>We confirm your order and email you. The rest is paid in cash when it arrives.</span>
        </li>
      </ol>
    </div>
  );
}
