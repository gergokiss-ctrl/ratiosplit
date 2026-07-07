import { existsSync, statSync } from "node:fs";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function dbPathFromEnv() {
  const url = process.env.DATABASE_URL ?? "file:/data/ratiosplit.db";
  if (!url.startsWith("file:")) return "/data/ratiosplit.db";
  return url.replace(/^file:/, "");
}

export async function GET() {
  const dbPath = dbPathFromEnv();
  const exists = existsSync(dbPath);
  const sizeBytes = exists ? statSync(dbPath).size : null;

  const [people, months, expenses, monthlyIncomes, incomeSources] = await Promise.all([
    prisma.person.count(),
    prisma.month.count(),
    prisma.expense.count({ where: { deletedAt: null } }),
    prisma.monthlyIncome.count(),
    prisma.incomeSource.count(),
  ]);

  return Response.json({
    ok: true,
    database: {
      path: dbPath,
      exists,
      sizeBytes,
    },
    counts: {
      people,
      months,
      expenses,
      monthlyIncomes,
      incomeSources,
    },
    checkedAt: new Date().toISOString(),
  });
}
