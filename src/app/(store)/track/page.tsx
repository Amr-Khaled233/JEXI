import type { Metadata } from "next";
import { Inbox, Mail, PackageSearch } from "lucide-react";
import { TrackForm } from "@/components/store/track-form";

export const metadata: Metadata = { title: "Track your order" };

const STEPS = [
  { icon: Mail, title: "Enter your email", text: "Use the email address you checked out with." },
  { icon: Inbox, title: "Check your inbox", text: "We'll email you a private link to each of your orders." },
  { icon: PackageSearch, title: "Follow your order", text: "See its status, from confirmed to delivered." },
];

export default function TrackPage() {
  return (
    <div className="container-page py-10 md:py-16">
      <div className="mx-auto grid max-w-5xl grid-cols-1 overflow-hidden rounded-lg border border-border md:grid-cols-2">
        <section className="bg-[#120d0a] px-6 py-10 text-[#f1e8dc] sm:px-10 md:py-14">
          <p className="eyebrow text-[#c9a27a]">Order status</p>
          <h1 className="mt-3 text-4xl leading-tight md:text-5xl">Track your order</h1>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-[#bfae9c]">
            No account or password needed. We&apos;ll send your orders to your inbox so only you can see them.
          </p>
          <ol className="mt-10 space-y-6">
            {STEPS.map(({ icon: Icon, title, text }, i) => (
              <li key={title} className="flex gap-4">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full border border-[#c9a27a]/40 text-[#e0bf98]">
                  <Icon className="size-4.5" strokeWidth={1.5} />
                </span>
                <div>
                  <p className="text-xs tracking-[0.2em] text-[#c9a27a] uppercase">Step {i + 1}</p>
                  <p className="mt-1 font-serif text-xl">{title}</p>
                  <p className="mt-0.5 text-sm text-[#a8988a]">{text}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>
        <section className="flex items-center bg-surface px-6 py-10 sm:px-10 md:py-14">
          <TrackForm />
        </section>
      </div>
    </div>
  );
}
