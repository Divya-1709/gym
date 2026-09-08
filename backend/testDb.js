import dotenv from "dotenv";
dotenv.config();
import dns from "dns";
dns.setDefaultResultOrder("ipv4first");
dns.setServers(["8.8.8.8", "1.1.1.1"]);
import prisma from "./utils/db.js";

async function test() {
  try {
    await prisma.$connect();
    console.log("✅ NEON CONNECTED VIA IPV4 & GOOGLE DNS");
    process.exit(0);
  } catch (e) {
    console.error("❌ FAIL:", e.message);
    process.exit(1);
  }
}

test();
