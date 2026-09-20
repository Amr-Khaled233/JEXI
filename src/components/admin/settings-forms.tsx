"use client";

import { useActionState } from "react";
import { createAdminAction, saveSettingsAction } from "@/app/admin/actions/store";
import { Panel } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { Alert, Checkbox, Field, Input, Select } from "@/components/ui/field";

type SettingsValues = {
  storeName: string;
  tagline: string | null;
  announcement: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  whatsapp: string | null;
  paymentPhone: string | null;
  instagram: string | null;
  facebook: string | null;
  tiktok: string | null;
  showInstagram: boolean;
  showFacebook: boolean;
  showTiktok: boolean;
  notificationEmail: string | null;
  defaultTheme: string;
  lowStockThreshold: number;
};

const SOCIALS = [
  { key: "instagram", show: "showInstagram", label: "Instagram", placeholder: "jexi.accessories" },
  { key: "facebook", show: "showFacebook", label: "Facebook", placeholder: "jexiaccessories" },
  { key: "tiktok", show: "showTiktok", label: "TikTok", placeholder: "@jexi.accessories" },
] as const;

export function SettingsForm({ initial, isOwner }: { initial: SettingsValues; isOwner: boolean }) {
  const [state, action, pending] = useActionState(saveSettingsAction, undefined);
  return (
    <form action={action} className="space-y-6">
      <Panel title="Store">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Store name" htmlFor="storeName">
            <Input id="storeName" name="storeName" defaultValue={initial.storeName} required />
          </Field>
          <Field label="Tagline" htmlFor="tagline" hint="Shown in the footer.">
            <Input id="tagline" name="tagline" defaultValue={initial.tagline ?? ""} />
          </Field>
          <Field label="Announcement bar" htmlFor="announcement" hint="Shown at the top of every page. Leave blank to hide." className="sm:col-span-2">
            <Input id="announcement" name="announcement" defaultValue={initial.announcement ?? ""} />
          </Field>
          <Field label="Contact email" htmlFor="contactEmail" hint="Shown in the footer and used as reply-to on customer emails.">
            <Input id="contactEmail" name="contactEmail" type="email" defaultValue={initial.contactEmail ?? ""} />
          </Field>
          <Field label="Contact phone" htmlFor="contactPhone">
            <Input id="contactPhone" name="contactPhone" defaultValue={initial.contactPhone ?? ""} />
          </Field>
          <Field label="New-order notification email" htmlFor="notificationEmail" hint={isOwner ? "New orders are emailed here." : "Only the store owner can change this."} className="sm:col-span-2">
            <Input id="notificationEmail" name="notificationEmail" type="email" defaultValue={initial.notificationEmail ?? ""} readOnly={!isOwner} className={isOwner ? undefined : "opacity-60"} />
          </Field>
        </div>
      </Panel>

      <Panel title="Social links">
        <p className="-mt-2 mb-5 text-sm text-muted">Add your accounts and choose which ones appear in the footer. You can enter a username or a full link.</p>
        <div className="space-y-4">
          {SOCIALS.map((net) => (
            <div key={net.key} className="grid items-end gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
              <Field label={net.label} htmlFor={net.key}>
                <Input id={net.key} name={net.key} defaultValue={initial[net.key] ?? ""} placeholder={net.placeholder} />
              </Field>
              <Checkbox name={net.show} defaultChecked={initial[net.show]} label="Show in footer" className="h-11" />
            </div>
          ))}
          <Field label="WhatsApp number" htmlFor="whatsapp" hint="Shown as a WhatsApp button in the footer and in customer emails. Leave blank to hide.">
            <Input id="whatsapp" name="whatsapp" defaultValue={initial.whatsapp ?? ""} placeholder="01XXXXXXXXX" />
          </Field>
          <Field
            label="Shipping fee number"
            htmlFor="paymentPhone"
            hint="The wallet or phone number customers send the shipping fee to before you confirm their order. Shown at checkout and on the order page."
          >
            <Input id="paymentPhone" name="paymentPhone" defaultValue={initial.paymentPhone ?? ""} placeholder="01XXXXXXXXX" />
          </Field>
        </div>
      </Panel>

      <Panel title="Appearance">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Default theme" htmlFor="defaultTheme" hint="Visitors can still switch.">
            <Select id="defaultTheme" name="defaultTheme" defaultValue={initial.defaultTheme}>
              <option value="dark">Dark (black and gold)</option>
              <option value="light">Light (ivory and bronze)</option>
              <option value="system">Match device</option>
            </Select>
          </Field>
          <Field label="Low-stock alert at" htmlFor="lowStockThreshold" hint="Units per color.">
            <Input id="lowStockThreshold" name="lowStockThreshold" type="number" min={0} defaultValue={initial.lowStockThreshold} />
          </Field>
        </div>
      </Panel>

      <div className="flex flex-wrap items-center gap-4">
        <Button type="submit" loading={pending}>
          Save settings
        </Button>
        {state?.error && <span className="text-sm text-danger">{state.error}</span>}
        {state?.success && <span className="text-sm text-success">{state.success}</span>}
      </div>
    </form>
  );
}

export function AddAdminForm() {
  const [state, action, pending] = useActionState(createAdminAction, undefined);
  return (
    <form action={action} className="grid gap-3 sm:grid-cols-2" key={state?.success}>
      {state?.error && <Alert tone="error" className="sm:col-span-2">{state.error}</Alert>}
      {state?.success && <Alert tone="success" className="sm:col-span-2">{state.success}</Alert>}
      <Field label="Name" htmlFor="admin-name">
        <Input id="admin-name" name="name" required className="h-10" />
      </Field>
      <Field label="Email" htmlFor="admin-email">
        <Input id="admin-email" name="email" type="email" required className="h-10" />
      </Field>
      <Field label="Temporary password" htmlFor="admin-password" hint="At least 10 characters.">
        <Input id="admin-password" name="password" type="password" required minLength={10} autoComplete="new-password" className="h-10" />
      </Field>
      <Field label="Role" htmlFor="admin-role">
        <Select id="admin-role" name="role" defaultValue="STAFF" className="h-10">
          <option value="STAFF">Staff</option>
          <option value="OWNER">Owner</option>
        </Select>
      </Field>
      <div>
        <Button type="submit" variant="outline" size="sm" loading={pending}>
          Add admin
        </Button>
      </div>
    </form>
  );
}
