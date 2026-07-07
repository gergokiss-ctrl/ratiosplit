import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseMoneyToMinor } from "@/lib/money";

async function ensureMonthCompatible(tx: any, monthKey: string) {
  const existing = await tx.month.findUnique({ where: { monthKey } });
  if (!existing) {
    await tx.month.create({ data: { id: monthKey, monthKey } });
    return;
  }

  // Older Patch 16 builds could create a SQLite FK from MonthlyIncome.monthKey to Month.id.
  // Keeping Month.id equal to monthKey makes both the old and the corrected schema work.
  if (existing.id !== monthKey) {
    try {
      await tx.month.update({ where: { id: existing.id }, data: { id: monthKey } });
    } catch {
      // If the primary key cannot be updated for any reason, continue; the corrected schema
      // still works in fresh DBs. Existing bad-FK DBs are handled wherever the update succeeds.
    }
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const personId = String(body.personId ?? "");
    const name = String(body.name ?? "").trim();
    if (!personId) throw new Error("Person is required.");
    if (!name) throw new Error("Income source name is required.");

    const isOneTime = Boolean(body.isOneTime);
    const defaultAmountHufMinor = body.defaultAmount === "" || body.defaultAmount === null || body.defaultAmount === undefined
      ? null
      : parseMoneyToMinor(body.defaultAmount);
    const count = await prisma.incomeSource.count({ where: { personId } });

    const result = await prisma.$transaction(async (tx) => {
      const source = await tx.incomeSource.create({
        data: {
          personId,
          name,
          defaultAmountHufMinor,
          isOneTime,
          isEnabled: isOneTime ? false : (body.isEnabled ?? true),
          archivedAt: isOneTime ? new Date() : null,
          sortOrder: count + 1,
        },
      });

      if (isOneTime && body.monthKey) {
        const monthKey = String(body.monthKey);
        await ensureMonthCompatible(tx, monthKey);
        await tx.monthlyIncome.create({
          data: {
            monthKey,
            personId,
            incomeSourceId: source.id,
            amountHufMinor: defaultAmountHufMinor,
            isIncluded: true,
          },
        });
      }

      return source;
    });

    return NextResponse.json(result, { status: 201 });
  } catch (e:any) {
    return NextResponse.json({ error: e.message ?? "Something went wrong." }, { status: 400 });
  }
}
