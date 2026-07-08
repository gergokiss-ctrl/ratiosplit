import { existsSync } from "node:fs";
import { readdir, stat } from "node:fs/promises";
import path from "node:path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function backupDir() {
  return process.env.AUTO_DB_BACKUP_DIR || "/backups";
}

function formatHu(date: Date) {
  return new Intl.DateTimeFormat("hu-HU", {
    dateStyle: "short",
    timeStyle: "medium",
    timeZone: "Europe/Budapest",
  }).format(date);
}

export async function GET() {
  const dir = backupDir();

  if (!existsSync(dir)) {
    return Response.json({ ok: true, backupDir: dir, exists: false, files: [] });
  }

  const entries = await readdir(dir).catch(() => []);
  const files = [];

  for (const entry of entries) {
    if (!entry.startsWith("ratiosplit-auto-") || !entry.endsWith(".db")) continue;
    const fullPath = path.join(dir, entry);
    const info = await stat(fullPath).catch(() => null);
    if (!info) continue;
    files.push({
      name: entry,
      path: fullPath,
      sizeBytes: info.size,
      modifiedAt: info.mtime.toISOString(),
      modifiedAtBudapest: formatHu(info.mtime),
    });
  }

  files.sort((a, b) => b.modifiedAt.localeCompare(a.modifiedAt));

  return Response.json({ ok: true, backupDir: dir, exists: true, files });
}
