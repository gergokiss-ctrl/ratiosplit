import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseMoneyToMinor } from "@/lib/money";

function parseVirtualId(id: string) {
  if (!id.startsWith("virtual:")) return null;
  const parts = id.split(":");
  if (parts.length < 4) return null;
  const monthKey = `${parts[1]}:${parts[2]}`;
  const incomeSourceId = parts.slice(3).join(":");
  if (!/^\d{4}-\d{2}$/.test(monthKey) || !incomeSourceId) return null;
  return { monthKey, incomeSourceId };
}

async function ensureMonthCompatible(monthKey: string) {
  const existing = await prisma.month.findUnique({ where: { monthKey } });
  if (!existing) {
    await prisma.month.create({ data: { id: monthKey, monthKey } });
    return;
  }
  if (existing.id !== monthKey) {
    try { await prisma.month.update({ where: { id: existing.id }, data: { id: monthKey } }); } catch {}
  }
}

async function getExistingMonthlyIncome(id: string) {
  const existing = await prisma.monthlyIncome.findUnique({ where: { id }, include: { incomeSource: true } });
  if (!existing) return null;
  const month = await prisma.month.findUnique({ where: { monthKey: existing.monthKey } });
  return { ...existing, month };
}

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    const body = await req.json();
    const virtual = parseVirtualId(id);

    if (virtual) {
      const source = await prisma.incomeSource.findUnique({ where: { id: virtual.incomeSourceId } });
      if (!source || source.archivedAt) return NextResponse.json({ error: "Income source not found." }, { status: 404 });

      const existingMonth = await prisma.month.findUnique({ where: { monthKey: virtual.monthKey } });
      if (existingMonth?.status === "LOCKED") {
        return NextResponse.json({ error: "This month is locked. Unlock it before editing income." }, { status: 423 });
      }

      await ensureMonthCompatible(virtual.monthKey);
      const amountHufMinor = body.amount !== undefined
        ? (body.amount === "" || body.amount === null ? null : parseMoneyToMinor(body.amount))
        : source.defaultAmountHufMinor;
      const isIncluded = body.isIncluded !== undefined ? Boolean(body.isIncluded) : true;

      const monthlyIncome = await prisma.monthlyIncome.upsert({
        where: { monthKey_incomeSourceId: { monthKey: virtual.monthKey, incomeSourceId: source.id } },
        update: { amountHufMinor, isIncluded },
        create: {
          monthKey: virtual.monthKey,
          personId: source.personId,
          incomeSourceId: source.id,
          amountHufMinor,
          isIncluded,
        },
        include: { incomeSource: true, person: true },
      });
      return NextResponse.json(monthlyIncome);
    }

    const existing = await getExistingMonthlyIncome(id);
    if (!existing) return NextResponse.json({ error: "Income row not found." }, { status: 404 });
    if (existing.month?.status === "LOCKED") return NextResponse.json({ error: "This month is locked. Unlock it before editing income." }, { status: 423 });

    const data: any = {};
    if (body.amount !== undefined) data.amountHufMinor = body.amount === "" || body.amount === null ? null : parseMoneyToMinor(body.amount);
    if (body.isIncluded !== undefined) data.isIncluded = Boolean(body.isIncluded);
    const monthlyIncome = await prisma.monthlyIncome.update({ where: { id }, data });
    return NextResponse.json(monthlyIncome);
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? "Something went wrong." }, { status: 400 });
  }
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    if (parseVirtualId(id)) return NextResponse.json({ error: "This income row has not been saved yet." }, { status: 400 });

    const existing = await getExistingMonthlyIncome(id);
    if (!existing) return NextResponse.json({ error: "Income row not found." }, { status: 404 });
    if (existing.month?.status === "LOCKED") return NextResponse.json({ error: "This month is locked. Unlock it before removing income." }, { status: 423 });

    await prisma.$transaction(async (tx) => {
      await tx.monthlyIncome.delete({ where: { id } });
      if (existing.incomeSource.isOneTime) {
        await tx.incomeSource.update({ where: { id: existing.incomeSourceId }, data: { isEnabled: false, archivedAt: new Date() } });
      }
    });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? "Something went wrong." }, { status: 400 });
  }
}
