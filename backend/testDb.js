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

async function test() {
  try {
    await prisma.$connect();
    console.log("✅ NEON CONNECTED VIA PRISMA PG ADAPTER!");
    const count = await prisma.user.count();
    console.log("✅ User count in DB:", count);
    await prisma.$disconnect();
    await pool.end();
    process.exit(0);
  } catch (e) {
    console.error("❌ FAIL:", e);
    process.exit(1);
  }
}

test();

