import type { Client } from "@/lib/db/schema";

const REGIONS = [
  "US",
  "CA",
  "UK",
  "AU",
  "DE",
  "FR",
  "ES",
  "IT",
  "BR",
  "MX",
  "IN",
  "JP",
  "SG",
  "AE",
  "ZA",
  "BD",
  "GLOBAL",
];

const inputCls =
  "w-full rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-400";

export function ClientForm({
  action,
  defaults,
  submitLabel,
}: {
  action: (formData: FormData) => void;
  defaults?: Partial<Client>;
  submitLabel: string;
}) {
  return (
    <form action={action} className="space-y-5 max-w-xl">
      <Field label="Name" required>
        <input
          type="text"
          name="name"
          required
          defaultValue={defaults?.name ?? ""}
          className={inputCls}
        />
      </Field>
      <Field label="Website URL">
        <input
          type="url"
          name="websiteUrl"
          placeholder="https://example.com"
          defaultValue={defaults?.websiteUrl ?? ""}
          className={inputCls}
        />
      </Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Region" required>
          <select
            name="region"
            defaultValue={defaults?.region ?? "US"}
            className={inputCls}
          >
            {REGIONS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Status">
          <select
            name="status"
            defaultValue={defaults?.status ?? "active"}
            className={inputCls}
          >
            <option value="active">Active</option>
            <option value="paused">Paused</option>
            <option value="churned">Churned</option>
          </select>
        </Field>
      </div>
      <Field label="Industry">
        <input
          type="text"
          name="industry"
          placeholder="e.g. SaaS, e-commerce, healthcare"
          defaultValue={defaults?.industry ?? ""}
          className={inputCls}
        />
      </Field>
      <Field label="Contact email">
        <input
          type="email"
          name="contactEmail"
          defaultValue={defaults?.contactEmail ?? ""}
          className={inputCls}
        />
      </Field>
      <Field label="Notes">
        <textarea
          name="notes"
          rows={4}
          defaultValue={defaults?.notes ?? ""}
          className={inputCls}
        />
      </Field>
      <button
        type="submit"
        className="rounded-md bg-neutral-900 dark:bg-neutral-100 dark:text-neutral-900 text-white px-4 py-2 text-sm font-medium hover:opacity-90"
      >
        {submitLabel}
      </button>
    </form>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-medium">
        {label}
        {required ? <span className="text-rose-500"> *</span> : null}
      </span>
      {children}
    </label>
  );
}
