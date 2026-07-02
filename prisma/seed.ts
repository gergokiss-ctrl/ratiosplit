import { PrismaClient, CurrencyCode } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const existing = await prisma.appSetting.findFirst();
  if (existing) {
    console.log("Seed már korábban lefutott.");
    return;
  }

  const gergo = await prisma.person.create({ data: { name: "Gergo", displayOrder: 1 } });
  const partner = await prisma.person.create({ data: { name: "Partner", displayOrder: 2 } });

  await prisma.appSetting.create({
    data: {
      baseCurrency: CurrencyCode.HUF,
      locale: "hu-HU",
      timezone: "Europe/Budapest",
      person1Id: gergo.id,
      person2Id: partner.id,
    },
  });

  const categories: Array<[string, string, string]> = [
    ["Élelmiszer", "shopping-cart", "#16a34a"],
    ["Lakás", "home", "#2563eb"],
    ["Autó", "car", "#f97316"],
    ["Étterem", "utensils", "#dc2626"],
    ["Utazás", "plane", "#7c3aed"],
    ["Egészség", "heart-pulse", "#db2777"],
    ["Egyéb", "circle-dot", "#64748b"],
  ];

  for (let i = 0; i < categories.length; i++) {
    await prisma.category.create({
      data: { name: categories[i][0], icon: categories[i][1], color: categories[i][2], sortOrder: i + 1 },
    });
  }
  console.log("Seed kész.");
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(async () => prisma.$disconnect());
