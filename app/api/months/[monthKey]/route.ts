import { NextResponse } from "next/server";
import { MonthStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { parsePercentToBps } from "@/lib/money";

function isStatusChangeOnly(body: any) {
  const keys = Object.keys(body ?? {});
  return keys.length === 1 && keys[0] === "status";
}

async function validateMonthCanBeLocked(monthKey: string) {
  const people = await prisma.person.findMany({
    where: { isActive: true },
    orderBy: { displayOrder: "asc" },
    take: 2,
  });

  const enabledSources = await prisma.incomeSource.findMany({
    where: {
      isEnabled: true,
      personId: { in: people.map((p) => p.id) },
    },
    include: { person: true },
    orderBy: [{ personId: "asc" }, { sortOrder: "asc" }, { createdAt: "asc" }],
  });

  const missing: string[] = [];

  for (const source of enabledSources) {
    const row = await prisma.monthlyIncome.findUnique({
      where: { monthKey_incomeSourceId: { monthKey, incomeSourceId: source.id } },
    });

    if (!row || row.amountHufMinor === null || row.amountHufMinor === undefined) {
      missing.push(`${source.person.name}: ${source.name}`);
    }
  }

  if (missing.length > 0) {
    return `Cannot lock this month. Missing income values: ${missing.join(", ")}.`;
  }

  return null;
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

      if (body.status === "LOCKED") {
        const validationError = await validateMonthCanBeLocked(monthKey);
        if (validationError) {
          return NextResponse.json({ error: validationError }, { status: 400 });
        }
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
