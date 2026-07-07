import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function ensurePerson(displayOrder: number, name: string) {
  const existing = await prisma.person.findFirst({ where: { displayOrder } });
  if (existing) {
    return prisma.person.update({
      where: { id: existing.id },
      data: { name, isActive: true },
    });
  }

  return prisma.person.create({
    data: { name, displayOrder, isActive: true },
  });
}

async function ensureCategory(input: { name: string; icon: string; color: string; sortOrder: number }) {
  const existingByName = await prisma.category.findUnique({ where: { name: input.name } });

  if (existingByName) {
    return prisma.category.update({
      where: { id: existingByName.id },
      data: {
        icon: input.icon,
        color: input.color,
        sortOrder: input.sortOrder,
        isActive: existingByName.isActive,
      },
    });
  }

  return prisma.category.create({
    data: {
      name: input.name,
      icon: input.icon,
      color: input.color,
      sortOrder: input.sortOrder,
      isActive: true,
    },
  });
}

async function ensureIncomeSource(input: { personId: string; name: string; defaultAmountHufMinor?: number | null; sortOrder: number }) {
  const existing = await prisma.incomeSource.findFirst({
    where: {
      personId: input.personId,
      name: input.name,
      archivedAt: null,
      isOneTime: false,
    },
  });

  if (existing) {
    return prisma.incomeSource.update({
      where: { id: existing.id },
      data: {
        sortOrder: input.sortOrder,
        isEnabled: existing.isEnabled,
        defaultAmountHufMinor: existing.defaultAmountHufMinor ?? input.defaultAmountHufMinor ?? null,
      },
    });
  }

  return prisma.incomeSource.create({
    data: {
      personId: input.personId,
      name: input.name,
      defaultAmountHufMinor: input.defaultAmountHufMinor ?? null,
      isEnabled: true,
      isOneTime: false,
      sortOrder: input.sortOrder,
    },
  });
}

async function ensureAppSettings(person1Id: string, person2Id: string) {
  const existing = await prisma.appSetting.findFirst();
  if (existing) {
    return prisma.appSetting.update({
      where: { id: existing.id },
      data: {
        baseCurrency: existing.baseCurrency,
        locale: existing.locale || "hu-HU",
        timezone: existing.timezone || "Europe/Budapest",
        person1Id: existing.person1Id ?? person1Id,
        person2Id: existing.person2Id ?? person2Id,
      },
    });
  }

  return prisma.appSetting.create({
    data: {
      baseCurrency: "HUF",
      locale: "hu-HU",
      timezone: "Europe/Budapest",
      person1Id,
      person2Id,
    },
  });
}

async function main() {
  const person1 = await ensurePerson(1, "Gergő");
  const person2 = await ensurePerson(2, "Judit");

  const categories = [
    { name: "Groceries", icon: "shopping-cart", color: "#22C55E", sortOrder: 10 },
    { name: "Restaurant", icon: "utensils", color: "#F97316", sortOrder: 20 },
    { name: "Car", icon: "car", color: "#3B82F6", sortOrder: 30 },
    { name: "Utilities", icon: "bolt", color: "#EAB308", sortOrder: 40 },
    { name: "Home", icon: "home", color: "#8B5CF6", sortOrder: 50 },
    { name: "Other", icon: "circle-dot", color: "#64748B", sortOrder: 999 },
  ];

  for (const category of categories) {
    await ensureCategory(category);
  }

  await ensureIncomeSource({ personId: person1.id, name: "Salary", sortOrder: 10 });
  await ensureIncomeSource({ personId: person2.id, name: "Salary", sortOrder: 10 });

  await ensureAppSettings(person1.id, person2.id);

  console.log("Seed completed safely.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
