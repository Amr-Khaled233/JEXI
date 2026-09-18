import type { Metadata } from "next";
import { TrackForm } from "@/components/store/track-form";

export const metadata: Metadata = { title: "Track your order" };

export default function TrackPage() {
  return (
    <div className="container-page max-w-3xl py-12 md:py-20">
      <div className="text-center">
        <h1 className="text-4xl md:text-5xl">Track your order</h1>
        <p className="mt-3 text-muted">Enter your email to track your order.</p>
      </div>
      <TrackForm />
    </div>
  );
}
