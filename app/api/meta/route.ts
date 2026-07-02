import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const [people, categories] = await Promise.all([
    prisma.person.findMany({ where:{ isActive:true }, orderBy:{ displayOrder:"asc" } }),
    prisma.category.findMany({ where:{ isActive:true }, orderBy:{ sortOrder:"asc" } }),
  ]);
  return NextResponse.json({ people, categories });
}
