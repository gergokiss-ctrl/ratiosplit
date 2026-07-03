import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseMoneyToMinor } from "@/lib/money";

export async function PATCH(req: Request, ctx: { params: Promise<{ id:string }> }) {
  try {
    const { id } = await ctx.params;
    const body = await req.json();
    const data: any = {};
    if (body.name !== undefined) data.name = String(body.name).trim();
    if (body.isEnabled !== undefined) data.isEnabled = Boolean(body.isEnabled);
    if (body.defaultAmount !== undefined) data.defaultAmountHufMinor = body.defaultAmount === "" || body.defaultAmount === null ? null : parseMoneyToMinor(body.defaultAmount);
    const source = await prisma.incomeSource.update({ where: { id }, data });
    return NextResponse.json(source);
  } catch (e:any) {
    return NextResponse.json({ error: e.message ?? "Something went wrong." }, { status: 400 });
  }
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id:string }> }) {
  const { id } = await ctx.params;
  await prisma.incomeSource.update({ where: { id }, data: { isEnabled: false, archivedAt: new Date() } });
  return NextResponse.json({ ok: true });
}
