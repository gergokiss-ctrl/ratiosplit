import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parsePercentToBps } from "@/lib/money";
export async function GET(_req: Request, ctx: { params: Promise<{ monthKey:string }> }) {
  const { monthKey } = await ctx.params;
  const month = await prisma.month.upsert({ where:{ monthKey }, update:{}, create:{ monthKey } });
  return NextResponse.json(month);
}
export async function PATCH(req: Request, ctx: { params: Promise<{ monthKey:string }> }) {
  try {
    const { monthKey } = await ctx.params;
    const body = await req.json();
    const person1RatioBps = parsePercentToBps(body.person1Percent);
    const person2RatioBps = 10_000 - person1RatioBps;
    const month = await prisma.month.upsert({ where:{ monthKey }, create:{ monthKey, person1RatioBps, person2RatioBps }, update:{ person1RatioBps, person2RatioBps } });
    return NextResponse.json(month);
  } catch(e:any) { return NextResponse.json({ error:e.message ?? "Something went wrong." }, { status:400 }); }
}
