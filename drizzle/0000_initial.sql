CREATE TABLE `clients` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`website_url` text,
	`region` text DEFAULT 'US' NOT NULL,
	`industry` text,
	`contact_email` text,
	`notes` text,
	`status` text DEFAULT 'active' NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `geo_prompts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`project_id` integer NOT NULL,
	`prompt_text` text NOT NULL,
	`tags` text,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `geo_results` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`run_id` integer NOT NULL,
	`prompt_id` integer NOT NULL,
	`provider` text NOT NULL,
	`model` text,
	`response_text` text NOT NULL,
	`brand_cited` integer DEFAULT false NOT NULL,
	`competitors_cited_json` text DEFAULT '[]' NOT NULL,
	`sources_json` text DEFAULT '[]' NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`run_id`) REFERENCES `geo_runs`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`prompt_id`) REFERENCES `geo_prompts`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `geo_runs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`project_id` integer NOT NULL,
	`started_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`finished_at` integer,
	`status` text DEFAULT 'running' NOT NULL,
	`error_message` text,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `local_profiles` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`project_id` integer NOT NULL,
	`gbp_place_id` text,
	`name` text NOT NULL,
	`address` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `local_rankings` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`project_id` integer NOT NULL,
	`keyword` text NOT NULL,
	`location` text NOT NULL,
	`rank` integer,
	`checked_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `prog_pages` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`site_id` integer NOT NULL,
	`slug` text NOT NULL,
	`title` text NOT NULL,
	`content_md` text NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`pr_url` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`site_id`) REFERENCES `prog_sites`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `prog_sites` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`project_id` integer NOT NULL,
	`github_repo` text,
	`deploy_url` text,
	`template_name` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `projects` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`client_id` integer NOT NULL,
	`name` text NOT NULL,
	`module` text NOT NULL,
	`config_json` text DEFAULT '{}' NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`client_id`) REFERENCES `clients`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `settings` (
	`id` integer PRIMARY KEY DEFAULT 1 NOT NULL,
	`default_provider` text DEFAULT 'claude-cli' NOT NULL,
	`default_region` text DEFAULT 'US' NOT NULL,
	`anthropic_api_key` text,
	`openai_api_key` text,
	`perplexity_api_key` text,
	`google_api_key` text,
	`serpapi_key` text,
	`github_token` text,
	`github_owner` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
