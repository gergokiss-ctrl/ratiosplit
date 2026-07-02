import { PrismaClient, CurrencyCode } from "@prisma/client";
const prisma = new PrismaClient();

async function ensureDefaultIncomeSource(personId: string, name: string, sortOrder: number) {
  const existing = await prisma.incomeSource.findFirst({ where: { personId, name } });
  if (!existing) {
    await prisma.incomeSource.create({ data: { personId, name, sortOrder, isEnabled: true, defaultAmountHufMinor: null } });
  }
}

async function main() {
  let settings = await prisma.appSetting.findFirst();

  let gergo = await prisma.person.findFirst({ where: { displayOrder: 1 } });
  if (!gergo) gergo = await prisma.person.create({ data: { name: "Gergő", displayOrder: 1 } });
  else if (gergo.name !== "Gergő") gergo = await prisma.person.update({ where: { id: gergo.id }, data: { name: "Gergő" } });

  let judit = await prisma.person.findFirst({ where: { displayOrder: 2 } });
  if (!judit) judit = await prisma.person.create({ data: { name: "Judit", displayOrder: 2 } });
  else if (judit.name !== "Judit") judit = await prisma.person.update({ where: { id: judit.id }, data: { name: "Judit" } });

  if (!settings) {
    settings = await prisma.appSetting.create({ data: { baseCurrency: CurrencyCode.HUF, locale: "en-US", timezone: "Europe/Budapest", person1Id: gergo.id, person2Id: judit.id } });
  } else {
    await prisma.appSetting.update({ where: { id: settings.id }, data: { locale: "en-US", timezone: "Europe/Budapest", person1Id: gergo.id, person2Id: judit.id } });
  }

  await ensureDefaultIncomeSource(gergo.id, "Salary", 1);
  await ensureDefaultIncomeSource(judit.id, "Salary", 1);

  const categories: Array<[string, string, string]> = [
    ["Groceries", "shopping-cart", "#77C043"],
    ["Home", "home", "#00539B"],
    ["Car", "car", "#FF8A1D"],
    ["Restaurant", "utensils", "#F97316"],
    ["Travel", "plane", "#38BDF8"],
    ["Health", "heart-pulse", "#22C55E"],
    ["Other", "circle-dot", "#64748B"],
  ];

  for (let i = 0; i < categories.length; i++) {
    const [name, icon, color] = categories[i];
    const sortOrder = i + 1;
    const existingBySortOrder = await prisma.category.findFirst({ where: { sortOrder } });
    if (existingBySortOrder) await prisma.category.update({ where: { id: existingBySortOrder.id }, data: { name, icon, color, isActive: true } });
    else await prisma.category.upsert({ where: { name }, update: { icon, color, sortOrder, isActive: true }, create: { name, icon, color, sortOrder, isActive: true } });
  }

  console.log("Seed/update completed.");
}
main().catch((error) => { console.error(error); process.exit(1); }).finally(async () => prisma.$disconnect());
