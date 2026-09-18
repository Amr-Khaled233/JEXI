import type { Metadata } from "next";
import { deleteAdminAction } from "@/app/admin/actions/store";
import { AddAdminForm, ChangePasswordForm, SettingsForm } from "@/components/admin/settings-forms";
import { PageTitle, Panel } from "@/components/admin/ui";
import { Badge } from "@/components/ui/badge";
import { Alert } from "@/components/ui/field";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { isEmailConfigured } from "@/lib/email/mailer";
import { fromMinor } from "@/lib/money";
import { getNotificationEmail, getSettings } from "@/lib/settings";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const me = await requireAdmin();
  const [settings, admins, notifyTo] = await Promise.all([getSettings(), db.adminUser.findMany({ orderBy: { createdAt: "asc" } }), getNotificationEmail()]);

  return (
    <>
      <PageTitle title="Settings" />
      <div className="space-y-6">
        <Panel title="Email notifications">
          {isEmailConfigured() ? (
            <Alert tone="success">
              Sending from <strong>{process.env.GMAIL_USER}</strong>. New-order alerts go to <strong>{notifyTo ?? "—"}</strong>.
            </Alert>
          ) : (
            <Alert tone="info">
              SMTP isn&apos;t configured, so emails are skipped (and logged). Set <code>GMAIL_USER</code> and <code>GMAIL_APP_PASSWORD</code> in your environment (see the README).
            </Alert>
          )}
        </Panel>

        <SettingsForm
          isOwner={me.role === "OWNER"}
          initial={{
            ...settings,
            freeShippingThreshold: settings.freeShippingThreshold != null ? String(fromMinor(settings.freeShippingThreshold)) : "",
            defaultShippingFee: String(fromMinor(settings.defaultShippingFee)),
          }}
        />

        <Panel title="Admin users">
          <ul className="mb-6 divide-y divide-border">
            {admins.map((a) => (
              <li key={a.id} className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm">
                <span>
                  <span className="font-medium">{a.name}</span> <span className="text-muted">· {a.email}</span>
                  <span className="block text-xs text-muted">{a.lastLoginAt ? `Last sign-in ${formatDate(a.lastLoginAt, true)}` : "Never signed in"}</span>
                </span>
                <span className="flex items-center gap-3">
                  <Badge tone={a.role === "OWNER" ? "gold" : "neutral"}>{a.role === "OWNER" ? "Owner" : "Staff"}</Badge>
                  {me.role === "OWNER" && a.id !== me.id && (
                    <form action={deleteAdminAction}>
                      <input type="hidden" name="id" value={a.id} />
                      <button type="submit" className="text-xs text-muted uppercase hover:text-danger">
                        Remove
                      </button>
                    </form>
                  )}
                </span>
              </li>
            ))}
          </ul>
          {me.role === "OWNER" ? <AddAdminForm /> : <p className="text-sm text-muted">Only the owner can add or remove admins.</p>}
        </Panel>

        <Panel title="Your password">
          <ChangePasswordForm />
        </Panel>
      </div>
    </>
  );
}
