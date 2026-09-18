"use client";

import { useActionState } from "react";
import { changePasswordAction, createAdminAction, saveSettingsAction } from "@/app/admin/actions/store";
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
  instagram: string | null;
  notificationEmail: string | null;
  freeShippingEnabled: boolean;
  freeShippingThreshold: string;
  defaultShippingFee: string;
  defaultTheme: string;
  lowStockThreshold: number;
};

export function SettingsForm({ initial, isOwner }: { initial: SettingsValues; isOwner: boolean }) {
  const [state, action, pending] = useActionState(saveSettingsAction, undefined);
  return (
    <form action={action} className="space-y-6">
      <Panel title="Store">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Store name" htmlFor="storeName">
            <Input id="storeName" name="storeName" defaultValue={initial.storeName} required />
          </Field>
          <Field label="Tagline" htmlFor="tagline">
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
          <Field label="WhatsApp number" htmlFor="whatsapp">
            <Input id="whatsapp" name="whatsapp" defaultValue={initial.whatsapp ?? ""} placeholder="01XXXXXXXXX" />
          </Field>
          <Field label="Instagram handle" htmlFor="instagram">
            <Input id="instagram" name="instagram" defaultValue={initial.instagram ?? ""} placeholder="jexi.accessories" />
          </Field>
        </div>
      </Panel>

      <Panel title="Notifications & appearance">
        <div className="grid gap-4 sm:grid-cols-3">
          <Field
            label="New-order notification email"
            htmlFor="notificationEmail"
            hint={isOwner ? "New-order alerts and admin password-reset links are sent here." : "Only the store owner can change this, because password-reset links are sent here."}
            className="sm:col-span-3"
          >
            <Input id="notificationEmail" name="notificationEmail" type="email" defaultValue={initial.notificationEmail ?? ""} readOnly={!isOwner} className={isOwner ? undefined : "opacity-60"} />
          </Field>
          <Field label="Default theme" htmlFor="defaultTheme" hint="Visitors can still switch.">
            <Select id="defaultTheme" name="defaultTheme" defaultValue={initial.defaultTheme}>
              <option value="dark">Dark (black & gold)</option>
              <option value="light">Light (ivory & bronze)</option>
              <option value="system">Match device</option>
            </Select>
          </Field>
          <Field label="Low-stock alert at" htmlFor="lowStockThreshold" hint="Units per color.">
            <Input id="lowStockThreshold" name="lowStockThreshold" type="number" min={0} defaultValue={initial.lowStockThreshold} />
          </Field>
        </div>
      </Panel>

      <Panel title="Shipping">
        <div className="grid gap-4 sm:grid-cols-2">
          <Checkbox name="freeShippingEnabled" defaultChecked={initial.freeShippingEnabled} label="Free shipping (default for every zone without its own fee)" className="sm:col-span-2" />
          <Field label="Default shipping fee (EGP)" htmlFor="defaultShippingFee" hint="Used when free shipping is off.">
            <Input id="defaultShippingFee" name="defaultShippingFee" type="number" min={0} step="0.01" defaultValue={initial.defaultShippingFee} />
          </Field>
          <Field label="Free shipping over (EGP)" htmlFor="freeShippingThreshold" hint="Optional. Waives any fee above this order total.">
            <Input id="freeShippingThreshold" name="freeShippingThreshold" type="number" min={0} step="0.01" defaultValue={initial.freeShippingThreshold} />
          </Field>
        </div>
      </Panel>

      <div className="flex items-center gap-4">
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

export function ChangePasswordForm() {
  const [state, action, pending] = useActionState(changePasswordAction, undefined);
  return (
    <form action={action} className="grid max-w-xl gap-3 sm:grid-cols-2" key={state?.success}>
      {state?.error && <Alert tone="error" className="sm:col-span-2">{state.error}</Alert>}
      {state?.success && <Alert tone="success" className="sm:col-span-2">{state.success}</Alert>}
      <Field label="Current password" htmlFor="current">
        <Input id="current" name="current" type="password" required autoComplete="current-password" className="h-10" />
      </Field>
      <Field label="New password" htmlFor="next">
        <Input id="next" name="next" type="password" required minLength={10} autoComplete="new-password" className="h-10" />
      </Field>
      <div>
        <Button type="submit" variant="outline" size="sm" loading={pending}>
          Update password
        </Button>
      </div>
    </form>
  );
}
