import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Person = { id: string; name: string };

function csvCell(value: unknown) {
  const text = value === null || value === undefined ? "" : String(value);
  if (/[",\n\r;]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

function csvRow(values: unknown[]) {
  return values.map(csvCell).join(";");
}

function huf(minor: number) {
  return new Intl.NumberFormat("hu-HU", { style: "currency", currency: "HUF", maximumFractionDigits: 0 }).format(minor / 100);
}

function formatDate(date: Date | string) {
  return new Intl.DateTimeFormat("hu-HU", { timeZone: "Europe/Budapest", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(date));
}

function budapestStamp() {
  const parts = new Intl.DateTimeFormat("hu-HU", { timeZone: "Europe/Budapest", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }).formatToParts(new Date());
  const map = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${map.year}${map.month}${map.day}-${map.hour}${map.minute}${map.second}`;
}

function calculateIncomeRatios(people: Person[], monthlyIncomes: any[]) {
  const totalsByPerson: Record<string, number> = {};
  for (const person of people) totalsByPerson[person.id] = 0;
  for (const row of monthlyIncomes) {
    if (row.isIncluded) totalsByPerson[row.personId] = (totalsByPerson[row.personId] ?? 0) + (row.amountHufMinor ?? 0);
  }
  const total = Object.values(totalsByPerson).reduce((a, b) => a + b, 0);
  if (people.length < 2 || total <= 0) return null;
  const p1 = Math.round(((totalsByPerson[people[0].id] ?? 0) * 10000) / total);
  return { person1RatioBps: p1, person2RatioBps: 10000 - p1, totalsByPerson, total };
}

function expenseShares(expense: any, people: Person[], ratios: { person1RatioBps: number; person2RatioBps: number }) {
  const [p1, p2] = people;
  if (expense.splitType === "EXCLUDED") return { [p1.id]: 0, [p2.id]: 0 };
  if (expense.splitType === "EQUAL") return { [p1.id]: Math.round(expense.amountHufMinor / 2), [p2.id]: expense.amountHufMinor - Math.round(expense.amountHufMinor / 2) };
  if (expense.splitType === "PERSON_1_ONLY") return { [p1.id]: expense.amountHufMinor, [p2.id]: 0 };
  if (expense.splitType === "PERSON_2_ONLY") return { [p1.id]: 0, [p2.id]: expense.amountHufMinor };
  if (expense.splitType === "CUSTOM_PERCENT" && expense.customSplits?.length) {
    const result: Record<string, number> = { [p1.id]: 0, [p2.id]: 0 };
    for (const split of expense.customSplits) {
      if (split.ratioBps !== null && split.ratioBps !== undefined) result[split.personId] = Math.round((expense.amountHufMinor * split.ratioBps) / 10000);
      else if (split.amountHufMinor !== null && split.amountHufMinor !== undefined) result[split.personId] = split.amountHufMinor;
    }
    return result;
  }
  const p1Share = Math.round((expense.amountHufMinor * ratios.person1RatioBps) / 10000);
  return { [p1.id]: p1Share, [p2.id]: expense.amountHufMinor - p1Share };
}

function settlementText(people: Person[], amount: number, direction: string) {
  const [p1, p2] = people;
  if (direction === "NONE" || amount === 0) return "Nothing to settle.";
  if (direction === "PERSON_2_TO_PERSON_1") return `${p2.name} should pay ${p1.name}: ${huf(amount)}`;
  return `${p1.name} should pay ${p2.name}: ${huf(amount)}`;
}

export async function GET(_req: Request, ctx: { params: Promise<{ monthKey: string }> }) {
  const { monthKey } = await ctx.params;
  const [people, month, expenses, monthlyIncomes] = await Promise.all([
    prisma.person.findMany({ where: { isActive: true }, orderBy: { displayOrder: "asc" }, take: 2 }),
    prisma.month.findUnique({ where: { monthKey } }),
    prisma.expense.findMany({ where: { monthKey, deletedAt: null }, include: { paidByPerson: true, category: true, customSplits: true }, orderBy: [{ date: "asc" }, { createdAt: "asc" }] }),
    prisma.monthlyIncome.findMany({ where: { monthKey }, include: { person: true, incomeSource: true } }),
  ]);

  if (people.length < 2) return Response.json({ error: "Two active people are required for export." }, { status: 400 });

  const incomeRatio = calculateIncomeRatios(people, monthlyIncomes);
  const person1RatioBps = month?.ratioMode === "AUTO_FROM_INCOME" && incomeRatio ? incomeRatio.person1RatioBps : (month?.person1RatioBps ?? 5000);
  const person2RatioBps = month?.ratioMode === "AUTO_FROM_INCOME" && incomeRatio ? incomeRatio.person2RatioBps : (month?.person2RatioBps ?? 5000);
  const ratios = { person1RatioBps, person2RatioBps };

  const paid: Record<string, number> = { [people[0].id]: 0, [people[1].id]: 0 };
  const owed: Record<string, number> = { [people[0].id]: 0, [people[1].id]: 0 };
  let trackedTotal = 0;
  let excludedTotal = 0;

  for (const expense of expenses) {
    if (expense.splitType === "EXCLUDED") excludedTotal += expense.amountHufMinor;
    else trackedTotal += expense.amountHufMinor;
    if (expense.splitType !== "EXCLUDED") paid[expense.paidByPersonId] = (paid[expense.paidByPersonId] ?? 0) + expense.amountHufMinor;
    const shares = expenseShares(expense, people, ratios);
    owed[people[0].id] += shares[people[0].id] ?? 0;
    owed[people[1].id] += shares[people[1].id] ?? 0;
  }

  const balance1 = (paid[people[0].id] ?? 0) - (owed[people[0].id] ?? 0);
  const balance2 = (paid[people[1].id] ?? 0) - (owed[people[1].id] ?? 0);
  const direction = balance1 > 0 ? "PERSON_2_TO_PERSON_1" : balance2 > 0 ? "PERSON_1_TO_PERSON_2" : "NONE";
  const settlementAmount = Math.abs(balance1);

  const rows: string[] = [];
  rows.push(csvRow(["RatioSplit export", monthKey]));
  rows.push(csvRow(["Generated", new Intl.DateTimeFormat("hu-HU", { dateStyle: "short", timeStyle: "medium", timeZone: "Europe/Budapest" }).format(new Date())]));
  rows.push("");
  rows.push(csvRow(["Summary"]));
  rows.push(csvRow(["Person", "Paid HUF", "Owed HUF", "Balance HUF", "Ratio"]));
  rows.push(csvRow([people[0].name, (paid[people[0].id] / 100).toFixed(2), (owed[people[0].id] / 100).toFixed(2), (balance1 / 100).toFixed(2), `${(person1RatioBps / 100).toFixed(1)}%`]));
  rows.push(csvRow([people[1].name, (paid[people[1].id] / 100).toFixed(2), (owed[people[1].id] / 100).toFixed(2), (balance2 / 100).toFixed(2), `${(person2RatioBps / 100).toFixed(1)}%`]));
  rows.push(csvRow(["Tracked expenses", (trackedTotal / 100).toFixed(2)]));
  rows.push(csvRow(["Excluded expenses", (excludedTotal / 100).toFixed(2)]));
  rows.push(csvRow(["Settlement", settlementText(people, settlementAmount, direction)]));
  rows.push("");
  rows.push(csvRow(["Incomes"]));
  rows.push(csvRow(["Person", "Income source", "Amount HUF", "Included", "One-time"]));
  for (const income of monthlyIncomes) rows.push(csvRow([income.person.name, income.incomeSource.name, income.amountHufMinor == null ? "" : (income.amountHufMinor / 100).toFixed(2), income.isIncluded ? "Yes" : "No", income.incomeSource.isOneTime ? "Yes" : "No"]));
  rows.push("");
  rows.push(csvRow(["Expenses"]));
  rows.push(csvRow(["Date", "Description", "Original amount", "Currency", "HUF value", "Paid by", "Split", "Category"]));
  for (const expense of expenses) rows.push(csvRow([formatDate(expense.date), expense.description, (expense.amountOriginalMinor / 100).toFixed(2), expense.currency, (expense.amountHufMinor / 100).toFixed(2), expense.paidByPerson.name, expense.splitType, expense.category?.name ?? ""]));

  const csv = "\ufeff" + rows.join("\r\n");
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="ratiosplit-${monthKey}-${budapestStamp()}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
