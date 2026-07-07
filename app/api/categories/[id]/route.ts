import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: Request, ctx: { params: Promise<{ id:string }> }) {
  try {
    const { id } = await ctx.params;
    const body = await req.json();
    const data: any = {};

    if (body.name !== undefined) {
      const name = String(body.name ?? "").trim();
      if (!name) throw new Error("Category name is required.");
      data.name = name;
    }
    if (body.color !== undefined) data.color = String(body.color ?? "#64748B").trim() || "#64748B";
    if (body.icon !== undefined) data.icon = String(body.icon ?? "circle-dot").trim() || "circle-dot";
    if (body.isActive !== undefined) data.isActive = Boolean(body.isActive);
    if (body.sortOrder !== undefined) data.sortOrder = Number(body.sortOrder) || 0;

    const category = await prisma.category.update({ where: { id }, data });
    return NextResponse.json(category);
  } catch (e:any) {
    return NextResponse.json({ error: e.message ?? "Something went wrong." }, { status: 400 });
  }
}

export async function DELETE(req: Request, ctx: { params: Promise<{ id:string }> }) {
  try {
    const { id } = await ctx.params;
    const url = new URL(req.url);
    const hardDelete = url.searchParams.get("hard") === "1" || url.searchParams.get("hard") === "true";

    if (!hardDelete) {
      await prisma.category.update({ where: { id }, data: { isActive: false } });
      return NextResponse.json({ ok: true, mode: "hidden" });
    }

    const category = await prisma.category.findUnique({ where: { id } });
    if (!category) return NextResponse.json({ error: "Category not found." }, { status: 404 });
    if (category.isActive) {
      return NextResponse.json({ error: "Hide the category before deleting it." }, { status: 400 });
    }

    const expenseCount = await prisma.expense.count({ where: { categoryId: id, deletedAt: null } });
    if (expenseCount > 0) {
      return NextResponse.json({
        error: `This category is used by ${expenseCount} expense item(s). Keep it hidden instead of deleting it to preserve history.`,
      }, { status: 400 });
    }

    await prisma.category.delete({ where: { id } });
    return NextResponse.json({ ok: true, mode: "deleted" });
  } catch (e:any) {
    return NextResponse.json({ error: e.message ?? "Something went wrong." }, { status: 400 });
  }
}
