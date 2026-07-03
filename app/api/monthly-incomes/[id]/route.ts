import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseMoneyToMinor } from "@/lib/money";

export async function PATCH(req: Request, ctx: { params: Promise<{ id:string }> }) {
  try {
    const { id } = await ctx.params;
    const existing = await prisma.monthlyIncome.findUnique({ where: { id }, include: { month: true } });
    if (!existing) return NextResponse.json({ error: "Income row not found." }, { status: 404 });
    if (existing.month.status === "LOCKED") {
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
