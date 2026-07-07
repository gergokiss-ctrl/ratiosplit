import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function dbPathFromEnv() {
  const url = process.env.DATABASE_URL ?? "file:/data/ratiosplit.db";
  if (!url.startsWith("file:")) return "/data/ratiosplit.db";
  return url.replace(/^file:/, "");
}

function stamp() {
  const d = new Date();
  return `${d.getFullYear()}${String(d.getMonth()+1).padStart(2,"0")}${String(d.getDate()).padStart(2,"0")}-${String(d.getHours()).padStart(2,"0")}${String(d.getMinutes()).padStart(2,"0")}${String(d.getSeconds()).padStart(2,"0")}`;
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
      "Content-Disposition": `attachment; filename="ratiosplit-${stamp()}.db"`,
      "Cache-Control": "no-store",
    },
  });
}
