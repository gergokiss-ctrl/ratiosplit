import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import path from "node:path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function enabled(value: string | undefined) {
  return ["1", "true", "yes", "on"].includes(String(value ?? "").toLowerCase());
}

function dbPath() {
  return String(process.env.DATABASE_URL ?? "file:/data/ratiosplit.db").replace(/^file:/, "");
}

function backupDir() {
  return process.env.AUTO_DB_BACKUP_DIR || "/backups";
}

function statusFile() {
  return process.env.AUTO_DB_BACKUP_STATUS_FILE || path.join(backupDir(), "status.json");
}

async function readStatus() {
  try { return JSON.parse(await readFile(statusFile(), "utf8")); }
  catch { return null; }
}

export async function GET() {
  return Response.json({
    ok: true,
    config: {
      enabled: enabled(process.env.AUTO_DB_BACKUP_ENABLED),
      databasePath: dbPath(),
      backupDir: backupDir(),
      backupDirMounted: existsSync(backupDir()),
      timeHHMM: process.env.AUTO_DB_BACKUP_TIME ?? process.env.AUTO_DB_BACKUP_TIME_HHMM ?? null,
      intervalHours: process.env.AUTO_DB_BACKUP_INTERVAL_HOURS ?? "24",
      retentionDays: process.env.AUTO_DB_BACKUP_RETENTION_DAYS ?? "14",
      maxFiles: process.env.AUTO_DB_BACKUP_MAX_FILES ?? "14",
      statusFile: statusFile(),
    },
    status: await readStatus(),
    checkedAt: new Date().toISOString(),
    checkedAtBudapest: new Intl.DateTimeFormat("hu-HU", { dateStyle: "short", timeStyle: "medium", timeZone: "Europe/Budapest" }).format(new Date()),
  });
}
