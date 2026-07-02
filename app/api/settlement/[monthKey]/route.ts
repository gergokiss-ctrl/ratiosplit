import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { calculateSettlement } from "@/lib/settlement";

function calculateIncomeRatios(people: any[], monthlyIncomes: any[]) {
  const totalsByPerson: Record<string, number> = {};
  for (const person of people) totalsByPerson[person.id] = 0;
  for (const income of monthlyIncomes) {
    if (income.isIncluded) totalsByPerson[income.personId] = (totalsByPerson[income.personId] ?? 0) + (income.amountHufMinor ?? 0);
  }
  const total = Object.values(totalsByPerson).reduce((a, b) => a + b, 0);
  if (people.length < 2 || total <= 0) return null;
  const p1 = Math.round((totalsByPerson[people[0].id] * 10000) / total);
  return { person1RatioBps: p1, person2RatioBps: 10000 - p1, totalsByPerson, total };
}

export async function GET(_req: Request, ctx: { params: Promise<{ monthKey:string }> }) {
  const { monthKey } = await ctx.params;
  const [people, month] = await Promise.all([
    prisma.person.findMany({ where:{ isActive:true }, orderBy:{ displayOrder:"asc" }, take:2 }),
    prisma.month.upsert({ where:{ monthKey }, update:{}, create:{ monthKey } }),
  ]);
  if (people.length < 2) return NextResponse.json({ settlement:null, error:"Two active people are not configured." }, { status:400 });

  const [expenses, monthlyIncomes] = await Promise.all([
    prisma.expense.findMany({ where:{ monthKey, deletedAt:null }, include:{ customSplits:true } }),
    prisma.monthlyIncome.findMany({ where: { monthKey } }),
  ]);

  const incomeRatio = calculateIncomeRatios(people, monthlyIncomes);
  const shouldUseIncome = month.ratioMode === "AUTO_FROM_INCOME" && incomeRatio !== null;
  const person1RatioBps = shouldUseIncome ? incomeRatio!.person1RatioBps : (month.person1RatioBps ?? 5000);
  const person2RatioBps = shouldUseIncome ? incomeRatio!.person2RatioBps : (month.person2RatioBps ?? 5000);

  const settlement = calculateSettlement({ person1Id: people[0].id, person2Id: people[1].id, person1RatioBps, person2RatioBps, expenses });
  return NextResponse.json({ settlement, month, people, effectiveRatio: { person1RatioBps, person2RatioBps, source: shouldUseIncome ? "income" : "manual_or_default", income: incomeRatio } });
}
