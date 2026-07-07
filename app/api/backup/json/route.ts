import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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
  const [people, months, incomeSources, monthlyIncomes, categories, expenses, expenseCustomSplits, appSettings] = await Promise.all([
    prisma.person.findMany({ orderBy: { displayOrder: "asc" } }),
    prisma.month.findMany({ orderBy: { monthKey: "asc" } }),
    prisma.incomeSource.findMany({ orderBy: [{ personId: "asc" }, { sortOrder: "asc" }, { createdAt: "asc" }] }),
    prisma.monthlyIncome.findMany({ orderBy: [{ monthKey: "asc" }, { createdAt: "asc" }] }),
    prisma.category.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.expense.findMany({ orderBy: [{ monthKey: "asc" }, { date: "asc" }, { createdAt: "asc" }] }),
    prisma.expenseCustomSplit.findMany(),
    prisma.appSetting.findMany(),
  ]);

  const payload = {
    exportedAt: new Date().toISOString(),
    exportedAtBudapest: new Intl.DateTimeFormat("hu-HU", { dateStyle: "short", timeStyle: "medium", timeZone: "Europe/Budapest" }).format(new Date()),
    app: "RatioSplit",
    version: 1,
    data: { people, months, incomeSources, monthlyIncomes, categories, expenses, expenseCustomSplits, appSettings },
  };

  return new Response(JSON.stringify(payload, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="ratiosplit-export-${budapestStamp()}.json"`,
      "Cache-Control": "no-store",
    },
  });
}
