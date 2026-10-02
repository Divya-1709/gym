import dotenv from "dotenv";
dotenv.config();
import dns from "dns";
dns.setDefaultResultOrder("ipv4first");

import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const TARGET_MEMBER_ID = "1082";

  // First, find and display the record
  const client = await prisma.gymBill.findUnique({
    where: { memberId: TARGET_MEMBER_ID },
  });

  if (!client) {
    console.log(`❌ No client found with memberId ${TARGET_MEMBER_ID}`);
    return;
  }

  console.log("🔍 Found client to delete:");
  console.log(`   Name:        ${client.client}`);
  console.log(`   MemberId:    ${client.memberId}`);
  console.log(`   Contact:     ${client.contactNumber}`);
  console.log(`   Status:      ${client.status}`);
  console.log(`   AmountPaid:  ₹${client.amountPaid}`);
  console.log(`   Balance:     ₹${client.balance}`);
  console.log(`   Package:     ${client.package}`);
  console.log(`   JoiningDate: ${client.joiningDate}`);

  // Hard delete the record (removes all payment history, renewal history etc. too)
  await prisma.gymBill.delete({ where: { memberId: TARGET_MEMBER_ID } });
  console.log(`\n✅ Client "${client.client}" (memberId ${TARGET_MEMBER_ID}) and all associated data permanently deleted.`);

  // Final count
  const total = await prisma.gymBill.count();
  console.log(`📋 Remaining clients in DB: ${total}`);

  await prisma.$disconnect();
  await pool.end();
}

main().catch(async (err) => {
  console.error("💥 Error:", err);
  await prisma.$disconnect();
  await pool.end();
  process.exit(1);
});
