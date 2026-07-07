import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function dbPathFromEnv() {
  const url = process.env.DATABASE_URL ?? "file:/data/ratiosplit.db";
  if (!url.startsWith("file:")) return "/data/ratiosplit.db";
  return url.replace(/^file:/, "");
}

function budapestStamp() {
  const parts = new Intl.DateTimeFormat("hu-HU", {
    timeZone: "Europe/Budapest",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(new Date());
  const map = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${map.year}${map.month}${map.day}-${map.hour}${map.minute}${map.second}`;
}

export async function GET() {
  const dbPath = dbPathFromEnv();

  if (!existsSync(dbPath)) {
    return Response.json({ error: `Database file not found at ${dbPath}` }, { status: 404 });
  }

  const buffer = await readFile(dbPath);

  return new Response(buffer, {
    headers: {
      "Content-Type": "application/vnd.sqlite3",
      "Content-Disposition": `attachment; filename="ratiosplit-${budapestStamp()}.db"`,
      "Cache-Control": "no-store",
    },
  });
}
