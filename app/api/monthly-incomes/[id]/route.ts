import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseMoneyToMinor } from "@/lib/money";

async function getExistingMonthlyIncome(id: string) {
  const existing = await prisma.monthlyIncome.findUnique({
    where: { id },
    include: { incomeSource: true },
  });
  if (!existing) return null;
  const month = await prisma.month.findUnique({ where: { monthKey: existing.monthKey } });
  return { ...existing, month };
}

export async function PATCH(req: Request, ctx: { params: Promise<{ id:string }> }) {
  try {
    const { id } = await ctx.params;
    const existing = await getExistingMonthlyIncome(id);
    if (!existing) return NextResponse.json({ error: "Income row not found." }, { status: 404 });
    if (existing.month?.status === "LOCKED") {
      return NextResponse.json({ error: "This month is locked. Unlock it before editing incomes." }, { status: 423 });
    }

    const body = await req.json();
    const data: any = {};
    if (body.amount !== undefined) data.amountHufMinor = body.amount === "" || body.amount === null ? null : parseMoneyToMinor(body.amount);
    if (body.isIncluded !== undefined) data.isIncluded = Boolean(body.isIncluded);
    const monthlyIncome = await prisma.monthlyIncome.update({ where: { id }, data });
    return NextResponse.json(monthlyIncome);
  } catch (e:any) {
    return NextResponse.json({ error: e.message ?? "Something went wrong." }, { status: 400 });
  }
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id:string }> }) {
  try {
    const { id } = await ctx.params;
    const existing = await getExistingMonthlyIncome(id);
    if (!existing) return NextResponse.json({ error: "Income row not found." }, { status: 404 });
    if (existing.month?.status === "LOCKED") {
      return NextResponse.json({ error: "This month is locked. Unlock it before removing incomes." }, { status: 423 });
    }

    await prisma.$transaction(async (tx) => {
      await tx.monthlyIncome.delete({ where: { id } });
      if (existing.incomeSource.isOneTime) {
        await tx.incomeSource.update({
          where: { id: existing.incomeSourceId },
          data: { isEnabled: false, archivedAt: new Date() },
        });
      }
    });

    return NextResponse.json({ ok: true });
  } catch (e:any) {
    return NextResponse.json({ error: e.message ?? "Something went wrong." }, { status: 400 });
  }
}
