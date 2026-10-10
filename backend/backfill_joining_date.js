import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function backfill() {
  const bills = await prisma.gymBill.findMany({
    where: {
      originalJoiningDate: null,
      joiningDate: { not: null },
    },
  });
  console.log("Bills to backfill:", bills.length);
  for (const b of bills) {
    await prisma.gymBill.update({
      where: { id: b.id },
      data: { originalJoiningDate: b.joiningDate },
    });
  }
  console.log("Done backfilling originalJoiningDate for all existing clients.");
  await prisma.$disconnect();
}

backfill().catch((e) => {
  console.error(e);
  process.exit(1);
});
