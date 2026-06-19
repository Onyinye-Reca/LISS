import { PrismaClient, RegionKey } from "@prisma/client";

const prisma = new PrismaClient();

// The five fixed regions (PRD 4.5). Idempotent: upsert by key.
const regions: { key: RegionKey; name: string }[] = [
  { key: "SOUTH_SOUTH", name: "South-South" },
  { key: "SOUTH_EAST", name: "South-East" },
  { key: "SOUTH_WEST", name: "South-West" },
  { key: "NORTH", name: "North" },
  { key: "DIASPORA", name: "Diaspora" },
];

async function main() {
  for (const r of regions) {
    await prisma.region.upsert({
      where: { key: r.key },
      update: {}, // don't clobber EXCOS edits
      create: { key: r.key, name: r.name },
    });
  }
  // eslint-disable-next-line no-console
  console.log(`[seed] ensured ${regions.length} regions`);
}

main()
  .catch((e) => {
    // eslint-disable-next-line no-console
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
