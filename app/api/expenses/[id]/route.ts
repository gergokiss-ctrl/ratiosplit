import { NextResponse } from "next/server";
import { CurrencyCode, SplitType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { convertToHufMinor, monthKeyFromDate, parseMoneyToMinor, parsePercentToBps, parseRateToMicros } from "@/lib/money";

async function assertMonthOpen(monthKey: string, message: string) {
  const month = await prisma.month.upsert({ where:{ monthKey }, update:{}, create:{ monthKey } });
  if (month.status === "LOCKED") throw new Error(message);
}

export async function PATCH(req: Request, ctx: { params: Promise<{ id:string }> }) {
  try {
    const { id } = await ctx.params;
    const body = await req.json();
    const existing = await prisma.expense.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Expense not found." }, { status: 404 });

    await assertMonthOpen(existing.monthKey, "This month is locked. Unlock it before editing expenses.");

    const date = new Date(`${body.date}T00:00:00`);
    if (Number.isNaN(date.getTime())) throw new Error("Invalid date.");
    const monthKey = monthKeyFromDate(date);
    await assertMonthOpen(monthKey, "The target month is locked. Unlock it before moving expenses into it.");

    const description = String(body.description ?? "").trim();
    if (!description) throw new Error("Description is required.");

    const currency = body.currency as CurrencyCode;
    const splitType = body.splitType as SplitType;
    const amountOriginalMinor = parseMoneyToMinor(body.amount);
    if (amountOriginalMinor <= 0) throw new Error("Amount must be positive.");

    const exchangeRateToHufMicros = currency === "HUF" ? 1_000_000 : parseRateToMicros(body.exchangeRate);
    const amountHufMinor = convertToHufMinor(amountOriginalMinor, exchangeRateToHufMicros);

    const expense = await prisma.expense.update({
      where: { id },
      data: {
        date, monthKey, description, currency,
        amountOriginalMinor, exchangeRateToHufMicros, amountHufMinor,
        paidByPersonId: body.paidByPersonId,
        splitType,
        categoryId: body.categoryId || null,
        note: body.note || null,
      },
    });

    await prisma.expenseCustomSplit.deleteMany({ where: { expenseId: id } });
    if (splitType === "CUSTOM_PERCENT") {
      const people = await prisma.person.findMany({ where:{ isActive:true }, orderBy:{ displayOrder:"asc" }, take:2 });
      const p1Bps = parsePercentToBps(body.customPerson1Percent ?? "50");
      const p2Bps = 10_000 - p1Bps;
      await prisma.expenseCustomSplit.createMany({ data:[
        { expenseId: id, personId: people[0].id, ratioBps:p1Bps },
        { expenseId: id, personId: people[1].id, ratioBps:p2Bps },
      ]});
    }

    return NextResponse.json({ ...expense, monthKey });
  } catch (e:any) {
    const message = e.message ?? "Something went wrong.";
    return NextResponse.json({ error: message }, { status: message.includes("locked") ? 423 : 400 });
  }
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id:string }> }) {
  try {
    const { id } = await ctx.params;
    const existing = await prisma.expense.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Expense not found." }, { status: 404 });
    await assertMonthOpen(existing.monthKey, "This month is locked. Unlock it before deleting expenses.");
    await prisma.expense.update({ where:{ id }, data:{ deletedAt:new Date() } });
    return NextResponse.json({ ok:true });
  } catch (e:any) {
    const message = e.message ?? "Something went wrong.";
    return NextResponse.json({ error: message }, { status: message.includes("locked") ? 423 : 400 });
  }
}
