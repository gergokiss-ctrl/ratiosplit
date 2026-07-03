import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseMoneyToMinor } from "@/lib/money";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const personId = String(body.personId ?? "");
    const name = String(body.name ?? "").trim();
    if (!personId) throw new Error("Person is required.");
    if (!name) throw new Error("Income source name is required.");
    const isOneTime = Boolean(body.isOneTime);
    const defaultAmountHufMinor = body.defaultAmount === "" || body.defaultAmount === null || body.defaultAmount === undefined ? null : parseMoneyToMinor(body.defaultAmount);
    const count = await prisma.incomeSource.count({ where: { personId } });
    const source = await prisma.incomeSource.create({ data: { personId, name, defaultAmountHufMinor, isOneTime, isEnabled: isOneTime ? false : (body.isEnabled ?? true), archivedAt: isOneTime ? new Date() : null, sortOrder: count + 1 } });
    if (isOneTime && body.monthKey) {
      const monthKey = String(body.monthKey);
      await prisma.month.upsert({ where: { monthKey }, update: {}, create: { monthKey } });
      await prisma.monthlyIncome.create({ data: { monthKey, personId, incomeSourceId: source.id, amountHufMinor: defaultAmountHufMinor, isIncluded: true } });
    }
    return NextResponse.json(source, { status: 201 });
  } catch (e:any) { return NextResponse.json({ error: e.message ?? "Something went wrong." }, { status: 400 }); }
}
