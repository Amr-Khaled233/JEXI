import type { Metadata } from "next";
import { PageHeader } from "@/components/store/product-listing";
import { TrackForm } from "@/components/store/track-form";

export const metadata: Metadata = { title: "Track your order" };

export default function TrackPage() {
  return (
    <>
      <PageHeader eyebrow="Order status" title="Track your order" description="Enter your order number and the email or phone number you used at checkout." />
      <div className="container-page max-w-md py-12">
        <TrackForm />
      </div>
    </>
  );
}
