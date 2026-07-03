import { NextResponse } from "next/server";
import { MonthStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { parsePercentToBps } from "@/lib/money";

function isStatusChangeOnly(body: any) {
  const keys = Object.keys(body ?? {});
  return keys.length === 1 && keys[0] === "status";
}

export async function GET(_req: Request, ctx: { params: Promise<{ monthKey:string }> }) {
  const { monthKey } = await ctx.params;
  const month = await prisma.month.upsert({ where:{ monthKey }, update:{}, create:{ monthKey } });
  return NextResponse.json(month);
}

export async function PATCH(req: Request, ctx: { params: Promise<{ monthKey:string }> }) {
  try {
    const { monthKey } = await ctx.params;
    const body = await req.json();
    const existing = await prisma.month.upsert({ where:{ monthKey }, update:{}, create:{ monthKey } });

    if (existing.status === "LOCKED" && !isStatusChangeOnly(body)) {
      return NextResponse.json({ error: "This month is locked. Unlock it before editing ratio settings." }, { status: 423 });
    }

    const data: any = {};

    if (body.status !== undefined) {
      if (body.status !== "OPEN" && body.status !== "LOCKED") {
        return NextResponse.json({ error: "Invalid month status." }, { status: 400 });
      }
      data.status = body.status as MonthStatus;
    }

    if (body.person1Percent !== undefined && body.person1Percent !== "") {
      const person1RatioBps = parsePercentToBps(body.person1Percent);
      data.person1RatioBps = person1RatioBps;
      data.person2RatioBps = 10_000 - person1RatioBps;
    }

    if (body.ratioMode === "AUTO_FROM_INCOME" || body.ratioMode === "MANUAL") {
      data.ratioMode = body.ratioMode;
    }

    const month = await prisma.month.update({ where:{ monthKey }, data });
    return NextResponse.json(month);
  } catch(e:any) {
    return NextResponse.json({ error:e.message ?? "Something went wrong." }, { status:400 });
  }
}
