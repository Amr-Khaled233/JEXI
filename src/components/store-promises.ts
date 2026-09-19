import { Gift, RotateCcw, ShieldCheck, Truck, type LucideIcon } from "lucide-react";

export type PromiseKey = "promiseShipping" | "promiseCod" | "promiseGift" | "promiseSupport";

/** The four items of the home page "store promises" strip; each can be shown or hidden in Admin → Home Page. */
export const STORE_PROMISES: { key: PromiseKey; icon: LucideIcon; title: string; text: string }[] = [
  { key: "promiseShipping", icon: Truck, title: "Free shipping", text: "Delivered across Egypt" },
  { key: "promiseCod", icon: ShieldCheck, title: "Cash on delivery", text: "Pay when it arrives" },
  { key: "promiseGift", icon: Gift, title: "Gift ready", text: "Signature JEXI packaging" },
  { key: "promiseSupport", icon: RotateCcw, title: "Easy support", text: "We're a message away" },
];
