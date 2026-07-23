import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function calculateIncomeSummary(people: any[], monthlyIncomes: any[]) {
  const totalsByPerson: Record<string, number> = {};
  for (const person of people) totalsByPerson[person.id] = 0;
  for (const income of monthlyIncomes) {
    if (income.isIncluded) totalsByPerson[income.personId] = (totalsByPerson[income.personId] ?? 0) + (income.amountHufMinor ?? 0);
  }
  const total = Object.values(totalsByPerson).reduce((a, b) => a + b, 0);
  const ratiosByPerson: Record<string, number | null> = {};
  for (const person of people) ratiosByPerson[person.id] = total > 0 ? Math.round((totalsByPerson[person.id] * 10000) / total) : null;
  if (people.length >= 2 && ratiosByPerson[people[1].id] == null) ratiosByPerson[people[1].id] = 10000 - (ratiosByPerson[people[0].id] ?? 0);
  return { totalsByPerson, total, ratiosByPerson };
}

export async function GET(_req: Request, ctx: { params: Promise<{ monthKey: string }> }) {
  const { monthKey } = await ctx.params;

  const people = await prisma.person.findMany({ where: { isActive: true }, orderBy: { displayOrder: "asc" }, take: 2 });
  const sources = await prisma.incomeSource.findMany({
    where: { personId: { in: people.map((p) => p.id) }, archivedAt: null, isOneTime: false },
    include: { person: true },
    orderBy: [{ personId: "asc" }, { sortOrder: "asc" }, { createdAt: "asc" }],
  });

  // GET must stay read-only. Existing monthly rows are returned from the database;
  // enabled recurring sources without a row are represented as virtual rows.
  const existingRows = await prisma.monthlyIncome.findMany({
    where: { monthKey },
    include: { incomeSource: true, person: true },
    orderBy: [{ personId: "asc" }, { createdAt: "asc" }],
  });

  const existingBySource = new Map(existingRows.map((row) => [row.incomeSourceId, row]));
  const virtualRows = sources
    .filter((source) => source.isEnabled && !existingBySource.has(source.id))
    .map((source) => ({
      id: `virtual:${monthKey}:${source.id}`,
      monthKey,
      personId: source.personId,
      incomeSourceId: source.id,
      amountHufMinor: source.defaultAmountHufMinor ?? 0,
      isIncluded: true,
      createdAt: source.createdAt,
      updatedAt: source.createdAt,
      person: source.person,
      incomeSource: source,
      isVirtual: true,
    }));

  const monthlyIncomes = [...existingRows, ...virtualRows].sort((a, b) => {
    const personCompare = a.personId.localeCompare(b.personId);
    if (personCompare !== 0) return personCompare;
    const aOrder = a.incomeSource?.sortOrder ?? 0;
    const bOrder = b.incomeSource?.sortOrder ?? 0;
    if (aOrder !== bOrder) return aOrder - bOrder;
    return String(a.createdAt).localeCompare(String(b.createdAt));
  });

  return NextResponse.json({ people, sources, monthlyIncomes, summary: calculateIncomeSummary(people, monthlyIncomes) });
}
