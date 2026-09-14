import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
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

// ─── CSV Parser ───────────────────────────────────────────────────────────────
function parseCSV(text) {
  const rows = [];
  let row = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      row.push(current.trim());
      current = "";
    } else if ((char === "\r" || char === "\n") && !inQuotes) {
      if (char === "\r" && nextChar === "\n") i++;
      row.push(current.trim());
      if (row.some((c) => c !== "")) rows.push(row);
      row = [];
      current = "";
    } else {
      current += char;
    }
  }
  if (current || row.length > 0) {
    row.push(current.trim());
    if (row.some((c) => c !== "")) rows.push(row);
  }
  return rows;
}

// ─── Date Converter: DD-MM-YYYY → YYYY-MM-DD ──────────────────────────────────
function convertDate(str) {
  if (!str) return null;
  const lines = str.split("\n").map((s) => s.trim()).filter(Boolean);
  // Use the LAST date (most recent end date for multi-package rows)
  const last = lines[lines.length - 1];
  if (!last) return null;
  const parts = last.split("-");
  if (parts.length !== 3) return null;
  const [dd, mm, yyyy] = parts;
  if (!dd || !mm || !yyyy || yyyy.length !== 4) return null;
  return `${yyyy}-${mm}-${dd}`;
}

// ─── Date Converter: use FIRST date (joiningDate) ─────────────────────────────
function convertFirstDate(str) {
  if (!str) return null;
  const lines = str.split("\n").map((s) => s.trim()).filter(Boolean);
  const first = lines[0];
  if (!first) return null;
  const parts = first.split("-");
  if (parts.length !== 3) return null;
  const [dd, mm, yyyy] = parts;
  if (!dd || !mm || !yyyy || yyyy.length !== 4) return null;
  return `${yyyy}-${mm}-${dd}`;
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log("🚀 Starting client import from Google Sheet CSV...\n");

  // 1. Read CSV file (from project root)
  const csvPath = path.resolve("../sheet_data.csv");
  if (!fs.existsSync(csvPath)) {
    console.error("❌ sheet_data.csv not found at:", csvPath);
    process.exit(1);
  }
  const content = fs.readFileSync(csvPath, "utf-8");
  const rows = parseCSV(content);
  // Remove header row and trailing "Total" summary row
  const data = rows.slice(1).filter((r) => r[0] && r[0].toLowerCase() !== "total");
  console.log(`📋 Parsed ${data.length} client rows from CSV\n`);

  // 2. Remove existing test records
  console.log("🗑️  Removing existing test records (memberId 72 & 73)...");
  const deleteResult = await prisma.gymBill.deleteMany({
    where: { memberId: { in: ["72", "73"] } },
  });
  console.log(`   Deleted ${deleteResult.count} test record(s)\n`);

  // 3. Seed trainers
  const trainerNames = [
    "Ajay", "Madhan", "Sankar Raj", "Kamesh",
    "Ezhil", "Krishnaveni", "Priya", "Sukin", "Pavi"
  ];
  console.log("👥 Seeding trainers...");
  for (const name of trainerNames) {
    const existing = await prisma.trainer.findFirst({ where: { name } });
    if (!existing) {
      await prisma.trainer.create({ data: { name, isActive: true } });
      console.log(`   ✅ Created trainer: ${name}`);
    } else {
      console.log(`   ⏩ Already exists: ${name}`);
    }
  }
  console.log();

  // 4. Import clients in batches
  console.log("📥 Importing clients into GymBill table...");
  let successCount = 0;
  let skippedCount = 0;
  let errorCount = 0;
  const errors = [];
  const BATCH_SIZE = 50;

  for (let i = 0; i < data.length; i += BATCH_SIZE) {
    const batch = data.slice(i, Math.min(i + BATCH_SIZE, data.length));
    const batchData = [];

    for (const r of batch) {
      const [
        clientName,
        contactNo,
        pkgDetails,
        pkgValidity,
        trainerName,
        rep,
        src,
        status,
        createdOn,
        lastFollowup,
        nextFollowup,
        pendingPayment,
        clientId,
        membershipId,
      ] = r;

      if (!clientId) {
        skippedCount++;
        continue;
      }

      // Clean & join multi-line values
      const packageStr = pkgDetails
        ? pkgDetails.split("\n").map((s) => s.trim()).filter(Boolean).join(", ")
        : "";
      const trainerStr = trainerName
        ? trainerName.split("\n").map((s) => s.trim()).filter(Boolean).join(", ")
        : "";

      // Convert dates
      const joiningDate = convertFirstDate(createdOn);
      const endDate = convertDate(pkgValidity);
      const followupDate = convertFirstDate(nextFollowup);

      // Parse balance
      let balance = 0;
      if (pendingPayment) {
        const lines = pendingPayment.split("\n").map((s) => s.trim()).filter(Boolean);
        for (const l of lines) {
          const num = parseFloat(l);
          if (!isNaN(num)) balance += num;
        }
      }

      // Normalize status: ACTIVE → Active, everything else → Inactive
      const normalizedStatus = status.toUpperCase() === "ACTIVE" ? "Active" : "Inactive";

      batchData.push({
        memberId: clientId.trim(),
        invoiceId: membershipId ? membershipId.trim() : null,
        client: clientName.trim(),
        contactNumber: contactNo ? contactNo.trim() : "",
        clientSource: src ? src.trim() : null,
        status: normalizedStatus,
        joiningDate: joiningDate || null,
        endDate: endDate || null,
        package: packageStr || null,
        appointTrainer: trainerStr || null,
        clientRep: rep ? rep.trim() : null,
        balance: balance,
        followupDate: followupDate || null,
        paymentHistory: [],
        renewalHistory: [],
      });
    }

    // Upsert batch (skip already-existing memberIds)
    for (const clientData of batchData) {
      try {
        // Check if memberId already exists
        const existing = await prisma.gymBill.findUnique({
          where: { memberId: clientData.memberId },
        });
        if (existing) {
          skippedCount++;
          continue;
        }
        await prisma.gymBill.create({ data: clientData });
        successCount++;
      } catch (err) {
        errorCount++;
        errors.push({ memberId: clientData.memberId, client: clientData.client, error: err.message });
      }
    }

    // Progress indicator
    const processed = Math.min(i + BATCH_SIZE, data.length);
    process.stdout.write(`\r   Progress: ${processed}/${data.length} rows processed...`);
  }

  console.log(`\n\n✅ Import complete!\n`);
  console.log(`   Inserted:  ${successCount}`);
  console.log(`   Skipped:   ${skippedCount} (already existed or empty clientId)`);
  console.log(`   Errors:    ${errorCount}`);

  if (errors.length > 0) {
    console.log("\n❌ Errors:");
    for (const e of errors.slice(0, 10)) {
      console.log(`   memberId ${e.memberId} (${e.client}): ${e.error}`);
    }
  }

  // 5. Update counter to 1080
  console.log("\n🔢 Updating memberId counter to 1080...");
  await prisma.counter.upsert({
    where: { name: "memberId" },
    update: { seq: 1080 },
    create: { name: "memberId", seq: 1080 },
  });
  console.log("   ✅ Counter updated\n");

  // 6. Final stats
  const totalBills = await prisma.gymBill.count();
  const activeBills = await prisma.gymBill.count({ where: { status: "Active" } });
  const inactiveBills = await prisma.gymBill.count({ where: { status: "Inactive" } });
  const totalTrainers = await prisma.trainer.count();
  const balanceSum = await prisma.gymBill.aggregate({ _sum: { balance: true } });
  const totalBalance = balanceSum._sum.balance || 0;

  console.log("📊 Database Summary:");
  console.log(`   Total GymBill records: ${totalBills}`);
  console.log(`   Active clients:        ${activeBills}`);
  console.log(`   Inactive clients:      ${inactiveBills}`);
  console.log(`   Total trainers:        ${totalTrainers}`);
  console.log(`   Total pending balance: ₹${totalBalance.toLocaleString("en-IN")}`);
  console.log(`   Expected pending:      ₹3,75,845`);

  await prisma.$disconnect();
  await pool.end();
  console.log("\n🎉 Done! You can now open the app to see all clients.");
}

main().catch(async (err) => {
  console.error("💥 Fatal error:", err);
  await prisma.$disconnect();
  await pool.end();
  process.exit(1);
});
