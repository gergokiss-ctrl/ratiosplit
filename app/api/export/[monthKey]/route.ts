import { prisma } from "@/lib/prisma";
import { calculateSettlement } from "@/lib/settlement";
import { formatHuf } from "@/lib/money";

function csvEscape(v: unknown) {
  const s = String(v ?? "");
  return `"${s.replaceAll('"','""')}"`;
}

export async function GET(_req: Request, ctx: { params: Promise<{ monthKey:string }> }) {
  const { monthKey } = await ctx.params;
  const [people, month, expenses] = await Promise.all([
    prisma.person.findMany({ where:{ isActive:true }, orderBy:{ displayOrder:"asc" }, take:2 }),
    prisma.month.upsert({ where:{ monthKey }, update:{}, create:{ monthKey } }),
    prisma.expense.findMany({ where:{ monthKey, deletedAt:null }, include:{ paidByPerson:true, category:true, customSplits:true }, orderBy:{ date:"asc" } }),
  ]);
  const settlement = calculateSettlement({ person1Id:people[0].id, person2Id:people[1].id, person1RatioBps:month.person1RatioBps ?? 5000, person2RatioBps:month.person2RatioBps ?? 5000, expenses });
  const rows = [
    ["Típus","Dátum","Leírás","Eredeti összeg","Deviza","HUF érték","Fizette","Split","Kategória"],
    ...expenses.map(e => ["Költség", e.date.toISOString().slice(0,10), e.description, (e.amountOriginalMinor/100).toFixed(2), e.currency, (e.amountHufMinor/100).toFixed(2), e.paidByPerson.name, e.splitType, e.category?.name ?? ""]),
    [],
    ["Összesítő", "", "", "", "", "", "", "", ""],
    ["Gergo fizetett", "", "", "", "", formatHuf(settlement.paid1), "", "", ""],
    ["Partner fizetett", "", "", "", "", formatHuf(settlement.paid2), "", "", ""],
    ["Gergo része", "", "", "", "", formatHuf(settlement.owed1), "", "", ""],
    ["Partner része", "", "", "", "", formatHuf(settlement.owed2), "", "", ""],
    ["Rendezendő", "", "", "", "", formatHuf(settlement.settlementAmount), settlement.settlementDirection, "", ""],
  ];
  const csv = rows.map(r => r.map(csvEscape).join(";")).join("\n");
  return new Response("\ufeff" + csv, { headers:{ "Content-Type":"text/csv; charset=utf-8", "Content-Disposition":`attachment; filename="ratiosplit-${monthKey}.csv"` }});
}
