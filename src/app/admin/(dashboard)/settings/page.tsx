import type { Metadata } from "next";
import { deleteAdminAction } from "@/app/admin/actions/store";
import { AddAdminForm, SettingsForm } from "@/components/admin/settings-forms";
import { PageTitle, Panel, Table } from "@/components/admin/ui";
import { Badge } from "@/components/ui/badge";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const me = await requireAdmin();
  const [settings, admins] = await Promise.all([getSettings(), db.adminUser.findMany({ orderBy: { createdAt: "asc" } })]);

  return (
    <>
      <PageTitle title="Settings" />
      <div className="space-y-6">
        <SettingsForm isOwner={me.role === "OWNER"} initial={settings} />

        <Panel title="Admin users">
          <p className="-mt-2 mb-4 text-sm text-muted">
            Each admin signs in with their own email. Anyone who forgets their password can use &ldquo;Forgot password?&rdquo; on the sign-in page, and the reset link is sent to their own email.
          </p>
          <Table compact className="mb-6">
            <thead>
              <tr>
                <th>Admin</th>
                <th className="hidden sm:table-cell">Last sign-in</th>
                <th>Role</th>
                {me.role === "OWNER" && <th />}
              </tr>
            </thead>
            <tbody>
              {admins.map((a) => (
                <tr key={a.id}>
                  <td>
                    <span className="font-medium">{a.name}</span>
                    <span className="block text-xs break-all text-muted">{a.email}</span>
                  </td>
                  <td className="hidden text-xs text-muted sm:table-cell">{a.lastLoginAt ? formatDate(a.lastLoginAt, true) : "Never"}</td>
                  <td>
                    <Badge tone={a.role === "OWNER" ? "gold" : "neutral"}>{a.role === "OWNER" ? "Owner" : "Staff"}</Badge>
                  </td>
                  {me.role === "OWNER" && (
                    <td className="text-right">
                      {a.id !== me.id && (
                        <form action={deleteAdminAction}>
                          <input type="hidden" name="id" value={a.id} />
                          <button type="submit" className="text-xs tracking-[0.12em] text-muted uppercase hover:text-danger">
                            Remove
                          </button>
                        </form>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </Table>
          {me.role === "OWNER" ? <AddAdminForm /> : <p className="text-sm text-muted">Only the owner can add or remove admins.</p>}
        </Panel>
      </div>
    </>
  );
}
