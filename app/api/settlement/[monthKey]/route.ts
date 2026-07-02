import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { calculateSettlement } from "@/lib/settlement";
export async function GET(_req: Request, ctx: { params: Promise<{ monthKey:string }> }) {
  const { monthKey } = await ctx.params;
  const [people, month] = await Promise.all([prisma.person.findMany({ where:{ isActive:true }, orderBy:{ displayOrder:"asc" }, take:2 }), prisma.month.upsert({ where:{ monthKey }, update:{}, create:{ monthKey } })]);
  if (people.length < 2) return NextResponse.json({ settlement:null, error:"Two active people are not configured." }, { status:400 });
  const expenses = await prisma.expense.findMany({ where:{ monthKey, deletedAt:null }, include:{ customSplits:true } });
  const settlement = calculateSettlement({ person1Id: people[0].id, person2Id: people[1].id, person1RatioBps: month.person1RatioBps ?? 5000, person2RatioBps: month.person2RatioBps ?? 5000, expenses });
  return NextResponse.json({ settlement, month, people });
}
