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
    const defaultAmountHufMinor = body.defaultAmount === "" || body.defaultAmount === null || body.defaultAmount === undefined ? null : parseMoneyToMinor(body.defaultAmount);
    const count = await prisma.incomeSource.count({ where: { personId } });
    const source = await prisma.incomeSource.create({ data: { personId, name, defaultAmountHufMinor, isEnabled: body.isEnabled ?? true, sortOrder: count + 1 } });
    return NextResponse.json(source, { status: 201 });
  } catch (e:any) {
    return NextResponse.json({ error: e.message ?? "Something went wrong." }, { status: 400 });
  }
}
