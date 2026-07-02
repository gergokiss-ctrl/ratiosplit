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
  if (people.length >= 2 && total > 0) ratiosByPerson[people[1].id] = 10000 - (ratiosByPerson[people[0].id] ?? 0);
  return { totalsByPerson, total, ratiosByPerson };
}

export async function GET(_req: Request, ctx: { params: Promise<{ monthKey:string }> }) {
  const { monthKey } = await ctx.params;
  await prisma.month.upsert({ where: { monthKey }, update: {}, create: { monthKey } });

  const people = await prisma.person.findMany({ where: { isActive: true }, orderBy: { displayOrder: "asc" }, take: 2 });
  const sources = await prisma.incomeSource.findMany({ where: { personId: { in: people.map(p => p.id) } }, orderBy: [{ personId: "asc" }, { sortOrder: "asc" }, { createdAt: "asc" }] });

  for (const source of sources.filter(s => s.isEnabled)) {
    await prisma.monthlyIncome.upsert({
      where: { monthKey_incomeSourceId: { monthKey, incomeSourceId: source.id } },
      update: {},
      create: { monthKey, personId: source.personId, incomeSourceId: source.id, amountHufMinor: source.defaultAmountHufMinor, isIncluded: true },
    });
  }

  const monthlyIncomes = await prisma.monthlyIncome.findMany({ where: { monthKey }, include: { incomeSource: true, person: true }, orderBy: [{ personId: "asc" }, { createdAt: "asc" }] });
  return NextResponse.json({ people, sources, monthlyIncomes, summary: calculateIncomeSummary(people, monthlyIncomes) });
}
