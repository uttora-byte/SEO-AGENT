import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

const timestamps = {
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
};

// Singleton settings row (id always 1). Stores per-install config:
// LLM provider keys, default provider, default region, GitHub token.
export const settings = sqliteTable("settings", {
  id: integer("id").primaryKey().default(1),
  defaultProvider: text("default_provider").notNull().default("claude-cli"),
  defaultRegion: text("default_region").notNull().default("US"),
  anthropicApiKey: text("anthropic_api_key"),
  openaiApiKey: text("openai_api_key"),
  perplexityApiKey: text("perplexity_api_key"),
  googleApiKey: text("google_api_key"),
  serpapiKey: text("serpapi_key"),
  githubToken: text("github_token"),
  githubOwner: text("github_owner"),
  ...timestamps,
});

export const clients = sqliteTable("clients", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  websiteUrl: text("website_url"),
  region: text("region").notNull().default("US"),
  industry: text("industry"),
  contactEmail: text("contact_email"),
  notes: text("notes"),
  status: text("status", { enum: ["active", "paused", "churned"] })
    .notNull()
    .default("active"),
  ...timestamps,
});

export const projects = sqliteTable("projects", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  clientId: integer("client_id")
    .notNull()
    .references(() => clients.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  module: text("module", {
    enum: ["geo", "programmatic", "local"],
  }).notNull(),
  configJson: text("config_json").notNull().default("{}"),
  status: text("status", { enum: ["active", "paused", "archived"] })
    .notNull()
    .default("active"),
  ...timestamps,
});

// ---------- GEO module ----------

export const geoPrompts = sqliteTable("geo_prompts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  projectId: integer("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  promptText: text("prompt_text").notNull(),
  tags: text("tags"),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  ...timestamps,
});

export const geoRuns = sqliteTable("geo_runs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  projectId: integer("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  startedAt: integer("started_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
  finishedAt: integer("finished_at", { mode: "timestamp_ms" }),
  status: text("status", {
    enum: ["running", "complete", "failed"],
  })
    .notNull()
    .default("running"),
  errorMessage: text("error_message"),
});

export const geoResults = sqliteTable("geo_results", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  runId: integer("run_id")
    .notNull()
    .references(() => geoRuns.id, { onDelete: "cascade" }),
  promptId: integer("prompt_id")
    .notNull()
    .references(() => geoPrompts.id, { onDelete: "cascade" }),
  provider: text("provider").notNull(),
  model: text("model"),
  responseText: text("response_text").notNull(),
  brandCited: integer("brand_cited", { mode: "boolean" }).notNull().default(false),
  competitorsCitedJson: text("competitors_cited_json").notNull().default("[]"),
  sourcesJson: text("sources_json").notNull().default("[]"),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
});

// ---------- Programmatic SEO module ----------

export const progSites = sqliteTable("prog_sites", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  projectId: integer("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  githubRepo: text("github_repo"),
  deployUrl: text("deploy_url"),
  templateName: text("template_name"),
  ...timestamps,
});

export const progPages = sqliteTable("prog_pages", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  siteId: integer("site_id")
    .notNull()
    .references(() => progSites.id, { onDelete: "cascade" }),
  slug: text("slug").notNull(),
  title: text("title").notNull(),
  contentMd: text("content_md").notNull(),
  status: text("status", {
    enum: ["draft", "pr_open", "merged", "live"],
  })
    .notNull()
    .default("draft"),
  prUrl: text("pr_url"),
  ...timestamps,
});

// ---------- Local SEO module ----------

export const localProfiles = sqliteTable("local_profiles", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  projectId: integer("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  gbpPlaceId: text("gbp_place_id"),
  name: text("name").notNull(),
  address: text("address"),
  ...timestamps,
});

export const localRankings = sqliteTable("local_rankings", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  projectId: integer("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  keyword: text("keyword").notNull(),
  location: text("location").notNull(),
  rank: integer("rank"),
  checkedAt: integer("checked_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
});

export type Client = typeof clients.$inferSelect;
export type NewClient = typeof clients.$inferInsert;
export type Project = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;
export type Settings = typeof settings.$inferSelect;
