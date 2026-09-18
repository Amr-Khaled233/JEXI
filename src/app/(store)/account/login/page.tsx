import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/store/auth-forms";
import { getCustomer } from "@/lib/auth";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  if (await getCustomer()) redirect(next?.startsWith("/") && !next.startsWith("//") ? next : "/account");
  return (
    <div className="container-page max-w-md py-14 md:py-20">
      <h1 className="mb-2 text-center text-4xl">Welcome back</h1>
      <p className="mb-8 text-center text-muted">Sign in to see your orders and saved addresses.</p>
      <div className="card p-6">
        <LoginForm next={next} />
      </div>
    </div>
  );
}
