import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const categories = await prisma.category.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });
  return NextResponse.json(categories);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const name = String(body.name ?? "").trim();
    if (!name) throw new Error("Category name is required.");

    const color = String(body.color ?? "#64748B").trim() || "#64748B";
    const icon = String(body.icon ?? "circle-dot").trim() || "circle-dot";
    const last = await prisma.category.findFirst({ orderBy: { sortOrder: "desc" } });
    const nextSortOrder = (last?.sortOrder ?? 0) + 10;

    const category = await prisma.category.create({
      data: {
        name,
        color,
        icon,
        sortOrder: nextSortOrder,
        isActive: body.isActive ?? true,
      },
    });

    return NextResponse.json(category, { status: 201 });
  } catch (e:any) {
    return NextResponse.json({ error: e.message ?? "Something went wrong." }, { status: 400 });
  }
}
