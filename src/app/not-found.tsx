import Link from "next/link";
import { Logo } from "@/components/logo";
import { buttonClasses } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-8 px-6 text-center">
      <Logo size="lg" />
      <div>
        <h1 className="text-4xl">Page not found</h1>
        <p className="mt-3 text-muted">The page you&apos;re looking for has moved or no longer exists.</p>
      </div>
      <Link href="/" className={buttonClasses("primary")}>
        Back to the shop
      </Link>
    </div>
  );
}
