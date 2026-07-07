import { copyFile, mkdir, readdir, readFile, stat, unlink, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

const yes = (value) => ["1", "true", "yes", "on"].includes(String(value ?? "").toLowerCase());
const numberEnv = (name, fallback) => {
  const value = Number(process.env[name]);
  return Number.isFinite(value) && value > 0 ? value : fallback;
};
const dbPath = () => String(process.env.DATABASE_URL || "file:/data/ratiosplit.db").replace(/^file:/, "");
const backupDir = () => process.env.AUTO_DB_BACKUP_DIR || "/backups";
const statusFile = () => process.env.AUTO_DB_BACKUP_STATUS_FILE || path.join(backupDir(), "status.json");

function huDate(date = new Date()) {
  return new Intl.DateTimeFormat("hu-HU", { dateStyle: "short", timeStyle: "medium", timeZone: "Europe/Budapest" }).format(date);
}

function budapestParts(date = new Date()) {
  return Object.fromEntries(new Intl.DateTimeFormat("hu-HU", {
    timeZone: "Europe/Budapest",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(date).map((part) => [part.type, part.value]));
}

function stamp(date = new Date()) {
  const parts = budapestParts(date);
  return `${parts.year}${parts.month}${parts.day}-${parts.hour}${parts.minute}${parts.second}`;
}

function parseBackupTime(value) {
  const match = String(value || "").trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return null;
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null;
  return { hour, minute };
}

function millisecondsUntilBudapestTime(time) {
  const now = budapestParts();
  const nowMinutes = Number(now.hour) * 60 + Number(now.minute);
  const targetMinutes = time.hour * 60 + time.minute;
  let diffMinutes = targetMinutes - nowMinutes;
  if (diffMinutes <= 0) diffMinutes += 24 * 60;
  return diffMinutes * 60 * 1000;
}

function config() {
  const time = parseBackupTime(process.env.AUTO_DB_BACKUP_TIME || process.env.AUTO_DB_BACKUP_TIME_HHMM);
  return {
    enabled: yes(process.env.AUTO_DB_BACKUP_ENABLED),
    databasePath: dbPath(),
    backupDir: backupDir(),
    intervalHours: numberEnv("AUTO_DB_BACKUP_INTERVAL_HOURS", 24),
    timeHHMM: time ? `${String(time.hour).padStart(2, "0")}:${String(time.minute).padStart(2, "0")}` : null,
    retentionDays: numberEnv("AUTO_DB_BACKUP_RETENTION_DAYS", 14),
    maxFiles: numberEnv("AUTO_DB_BACKUP_MAX_FILES", 14),
    statusFile: statusFile(),
  };
}

async function readStatus() {
  try { return JSON.parse(await readFile(statusFile(), "utf8")); }
  catch { return {}; }
}

async function writeStatus(patch) {
  await mkdir(path.dirname(statusFile()), { recursive: true });
  await writeFile(statusFile(), JSON.stringify({
    ...(await readStatus()),
    ...patch,
    config: config(),
    updatedAt: new Date().toISOString(),
    updatedAtBudapest: huDate(),
  }, null, 2), "utf8");
}

async function pruneBackups(dir, retentionDays, maxFiles) {
  const entries = await readdir(dir).catch(() => []);
  const files = [];
  for (const entry of entries) {
    if (!entry.startsWith("ratiosplit-auto-") || !entry.endsWith(".db")) continue;
    const fullPath = path.join(dir, entry);
    const info = await stat(fullPath).catch(() => null);
    if (info) files.push({ fullPath, entry, mtimeMs: info.mtimeMs });
  }

  const now = Date.now();
  const retentionMs = retentionDays * 24 * 60 * 60 * 1000;

  for (const file of files) {
    if (now - file.mtimeMs > retentionMs) {
      await unlink(file.fullPath).catch(() => {});
      console.log(`[auto-backup] Pruned old backup: ${file.entry}`);
    }
  }

  const remaining = files.filter((file) => now - file.mtimeMs <= retentionMs).sort((a, b) => b.mtimeMs - a.mtimeMs);
  for (const file of remaining.slice(maxFiles)) {
    await unlink(file.fullPath).catch(() => {});
    console.log(`[auto-backup] Pruned backup over max file count: ${file.entry}`);
  }
}

async function runBackup(reason) {
  const current = config();
  if (!current.enabled) return;
  if (!existsSync(current.databasePath)) {
    const message = `Database file not found: ${current.databasePath}`;
    console.warn(`[auto-backup] ${message}`);
    await writeStatus({ lastError: message, lastErrorAt: new Date().toISOString() });
    return;
  }

  await mkdir(current.backupDir, { recursive: true });
  const filename = `ratiosplit-auto-${stamp()}.db`;
  const target = path.join(current.backupDir, filename);
  await copyFile(current.databasePath, target);
  const info = await stat(target);
  await pruneBackups(current.backupDir, current.retentionDays, current.maxFiles);

  await writeStatus({
    lastRunAt: new Date().toISOString(),
    lastRunAtBudapest: huDate(),
    lastBackupFile: target,
    lastBackupFileName: filename,
    lastBackupSizeBytes: info.size,
    lastRunReason: reason,
    lastError: null,
  });
  console.log(`[auto-backup] Backup created: ${target}`);
}

function scheduleNext() {
  const current = config();
  if (!current.enabled) return;
  const time = parseBackupTime(process.env.AUTO_DB_BACKUP_TIME || process.env.AUTO_DB_BACKUP_TIME_HHMM);
  const delayMs = time ? millisecondsUntilBudapestTime(time) : current.intervalHours * 60 * 60 * 1000;
  const next = new Date(Date.now() + delayMs);
  writeStatus({ nextRunAt: next.toISOString(), nextRunAtBudapest: huDate(next) }).catch(() => {});

  setTimeout(async () => {
    await runBackup(time ? "daily-time" : "interval").catch((error) => console.error("[auto-backup] Backup failed:", error));
    scheduleNext();
  }, delayMs);
}

async function main() {
  const current = config();
  await mkdir(current.backupDir, { recursive: true }).catch(() => {});

  if (!current.enabled) {
    console.log("[auto-backup] Disabled. Set AUTO_DB_BACKUP_ENABLED=true to enable scheduled DB backups.");
    await writeStatus({ disabledReason: "AUTO_DB_BACKUP_ENABLED is not true", nextRunAt: null, nextRunAtBudapest: null });
    return;
  }

  console.log(`[auto-backup] Enabled. Backup dir: ${current.backupDir}`);
  if (current.timeHHMM) console.log(`[auto-backup] Daily time: ${current.timeHHMM} Europe/Budapest`);
  else console.log(`[auto-backup] Interval: ${current.intervalHours}h`);

  setTimeout(() => {
    runBackup("startup").catch((error) => console.error("[auto-backup] Startup backup failed:", error));
  }, numberEnv("AUTO_DB_BACKUP_STARTUP_DELAY_SECONDS", 30) * 1000);

  scheduleNext();
}

main().catch((error) => console.error("[auto-backup] Fatal:", error));
