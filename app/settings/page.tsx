import { getMaskedSettings } from "@/lib/settings";
import { claudeCliProvider } from "@/lib/providers/anthropic-cli";
import { saveSettings } from "./actions";

export const dynamic = "force-dynamic";

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

export default async function SettingsPage() {
  const s = await getMaskedSettings();
  const claudeAvailable = await claudeCliProvider.isAvailable();

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-neutral-600 dark:text-neutral-400 mt-1 text-sm">
          API keys are stored in the local SQLite database. Leave a field
          blank to keep the existing value. Type <code>__clear__</code> to
          remove a saved value.
        </p>
      </div>

      <form action={saveSettings} className="space-y-8">
        <Section title="Defaults">
          <Field label="Default LLM provider" hint="Used for content generation tasks (programmatic SEO content, summaries, drafts). The GEO tracker uses all configured providers.">
            <select
              name="defaultProvider"
              defaultValue={s.defaultProvider}
              className={inputCls}
            >
              <option value="claude-cli">
                Claude Code CLI (subscription) {claudeAvailable ? "" : "— not detected"}
              </option>
              <option value="anthropic-api">Anthropic API</option>
              <option value="openai">OpenAI</option>
              <option value="gemini">Google Gemini</option>
              <option value="perplexity">Perplexity</option>
            </select>
          </Field>
          <Field label="Default region" hint="ISO country code. Per-client region overrides this.">
            <select
              name="defaultRegion"
              defaultValue={s.defaultRegion}
              className={inputCls}
            >
              {REGIONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </Field>
        </Section>

        <Section title="LLM API keys">
          <KeyField
            name="anthropicApiKey"
            label="Anthropic API key"
            configured={s.hasAnthropicApiKey}
            hint="Only needed if not using the Claude Code CLI subscription."
          />
          <KeyField
            name="openaiApiKey"
            label="OpenAI API key"
            configured={s.hasOpenaiApiKey}
            hint="Required for GEO tracker (ChatGPT citations) and content generation."
          />
          <KeyField
            name="googleApiKey"
            label="Google AI Studio key"
            configured={s.hasGoogleApiKey}
            hint="Required for GEO tracker (Gemini + Google AI Overview citations)."
          />
          <KeyField
            name="perplexityApiKey"
            label="Perplexity API key"
            configured={s.hasPerplexityApiKey}
            hint="Required for GEO tracker (Perplexity citations)."
          />
        </Section>

        <Section title="Other integrations">
          <KeyField
            name="serpapiKey"
            label="SerpAPI key"
            configured={s.hasSerpapiKey}
            hint="Used by Local SEO module for rank tracking. Optional."
          />
          <KeyField
            name="githubToken"
            label="GitHub personal access token"
            configured={s.hasGithubToken}
            hint="Used by Programmatic SEO module to create repos and PRs. Needs `repo` scope."
          />
          <Field label="GitHub owner (user or org)">
            <input
              type="text"
              name="githubOwner"
              defaultValue={s.githubOwner ?? ""}
              placeholder="uttora-byte"
              className={inputCls}
            />
          </Field>
        </Section>

        <div className="flex gap-3">
          <button
            type="submit"
            className="rounded-md bg-neutral-900 dark:bg-neutral-100 dark:text-neutral-900 text-white px-4 py-2 text-sm font-medium hover:opacity-90"
          >
            Save settings
          </button>
        </div>
      </form>
    </div>
  );
}

const inputCls =
  "w-full rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-400";

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-4">
      <h2 className="font-semibold text-sm uppercase tracking-wide text-neutral-500">
        {title}
      </h2>
      <div className="space-y-4 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5">
        {children}
      </div>
    </section>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-medium">{label}</span>
      {children}
      {hint ? (
        <span className="block text-xs text-neutral-500">{hint}</span>
      ) : null}
    </label>
  );
}

function KeyField({
  name,
  label,
  configured,
  hint,
}: {
  name: string;
  label: string;
  configured: boolean;
  hint?: string;
}) {
  return (
    <Field
      label={`${label}${configured ? " — saved" : ""}`}
      hint={hint}
    >
      <input
        type="password"
        name={name}
        autoComplete="new-password"
        placeholder={configured ? "•••••••• (leave blank to keep)" : "Paste key…"}
        className={inputCls}
      />
    </Field>
  );
}
