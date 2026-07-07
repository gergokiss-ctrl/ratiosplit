import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function stamp() {
  const d = new Date();
  return `${d.getFullYear()}${String(d.getMonth()+1).padStart(2,"0")}${String(d.getDate()).padStart(2,"0")}-${String(d.getHours()).padStart(2,"0")}${String(d.getMinutes()).padStart(2,"0")}${String(d.getSeconds()).padStart(2,"0")}`;
}

export async function GET() {
  const [
    people,
    months,
    incomeSources,
    monthlyIncomes,
    categories,
    expenses,
    expenseCustomSplits,
    appSettings,
  ] = await Promise.all([
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
    app: "RatioSplit",
    version: 1,
    data: {
      people,
      months,
      incomeSources,
      monthlyIncomes,
      categories,
      expenses,
      expenseCustomSplits,
      appSettings,
    },
  };

  return new Response(JSON.stringify(payload, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="ratiosplit-export-${stamp()}.json"`,
      "Cache-Control": "no-store",
    },
  });
}
