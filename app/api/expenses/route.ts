import { NextResponse } from "next/server";
import { CurrencyCode, SplitType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { convertToHufMinor, monthKeyFromDate, parseMoneyToMinor, parsePercentToBps, parseRateToMicros } from "@/lib/money";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const monthKey = searchParams.get("monthKey") ?? monthKeyFromDate(new Date());
  const expenses = await prisma.expense.findMany({
    where: { monthKey, deletedAt: null },
    include: { paidByPerson:true, category:true, customSplits:true },
    orderBy: [{ date:"desc" }, { createdAt:"desc" }],
  });
  return NextResponse.json(expenses);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const date = new Date(`${body.date}T00:00:00`);
    if (Number.isNaN(date.getTime())) throw new Error("Érvénytelen dátum.");
    const monthKey = monthKeyFromDate(date);
    const description = String(body.description ?? "").trim();
    if (!description) throw new Error("A leírás kötelező.");

    const currency = body.currency as CurrencyCode;
    const splitType = body.splitType as SplitType;
    const amountOriginalMinor = parseMoneyToMinor(body.amount);
    if (amountOriginalMinor <= 0) throw new Error("Az összegnek pozitívnak kell lennie.");
    const exchangeRateToHufMicros = currency === "HUF" ? 1_000_000 : parseRateToMicros(body.exchangeRate);
    const amountHufMinor = convertToHufMinor(amountOriginalMinor, exchangeRateToHufMicros);

    await prisma.month.upsert({ where:{ monthKey }, update:{}, create:{ monthKey } });

    const expense = await prisma.expense.create({
      data: {
        date, monthKey, description, currency,
        amountOriginalMinor, exchangeRateToHufMicros, amountHufMinor,
        paidByPersonId: body.paidByPersonId,
        splitType,
        categoryId: body.categoryId || null,
        note: body.note || null,
      },
    });

    if (splitType === "CUSTOM_PERCENT") {
      const people = await prisma.person.findMany({ where:{ isActive:true }, orderBy:{ displayOrder:"asc" }, take:2 });
      const p1Bps = parsePercentToBps(body.customPerson1Percent ?? "50");
      const p2Bps = 10_000 - p1Bps;
      await prisma.expenseCustomSplit.createMany({ data:[
        { expenseId: expense.id, personId: people[0].id, ratioBps:p1Bps },
        { expenseId: expense.id, personId: people[1].id, ratioBps:p2Bps },
      ]});
    }

    return NextResponse.json({ ...expense, monthKey }, { status:201 });
  } catch (e:any) {
    return NextResponse.json({ error:e.message ?? "Hiba történt." }, { status:400 });
  }
}
