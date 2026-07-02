import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseMoneyToMinor } from "@/lib/money";

export async function PATCH(req: Request, ctx: { params: Promise<{ id:string }> }) {
  try {
    const { id } = await ctx.params;
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
