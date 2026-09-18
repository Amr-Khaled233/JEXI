import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { RegisterForm } from "@/components/store/auth-forms";
import { getCustomer } from "@/lib/auth";

export const metadata: Metadata = { title: "Create account" };

export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  if (await getCustomer()) redirect("/account");
  return (
    <div className="container-page max-w-md py-14 md:py-20">
      <h1 className="mb-2 text-center text-4xl">Create your account</h1>
      <p className="mb-8 text-center text-muted">Track orders and check out faster with saved addresses.</p>
      <div className="card p-6">
        <RegisterForm next={next} />
      </div>
    </div>
  );
}
