import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import path from "node:path";
import fs from "node:fs";
import * as schema from "./schema";

const dbPath =
  process.env.DATABASE_PATH || path.join(process.cwd(), "seo-agent.db");

const sqlite = new Database(dbPath);
sqlite.pragma("journal_mode = WAL");
sqlite.pragma("foreign_keys = ON");

export const db = drizzle(sqlite, { schema });
export { schema };

// Auto-apply migrations on first import in dev. In production we'd run them
// explicitly, but for a local-first internal tool this keeps setup to one
// command (`npm run dev`).
const migrationsDir = path.join(process.cwd(), "drizzle");
if (fs.existsSync(migrationsDir)) {
  // Lazy import so this only loads when needed
  import("drizzle-orm/better-sqlite3/migrator").then(({ migrate }) => {
    try {
      migrate(db, { migrationsFolder: migrationsDir });
    } catch (err) {
      console.error("[db] migration failed:", err);
    }
  });
}
