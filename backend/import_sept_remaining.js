/**
 * import_sept_remaining.js
 *
 * Imports remaining September 2026 gym register entries into the GymBill table.
 * These are NEW clients (upsert by memberId) and RENEWAL entries added to renewalHistory.
 *
 * Data extracted from handwritten register photos (3 pages).
 *
 * Run from the /backend directory:
 *   node import_sept_remaining.js
 */

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

// ─── Helper: convert DD.MM.YY → YYYY-MM-DD ────────────────────────────────────
function parseDate(str) {
  if (!str) return null;
  const parts = str.split(".");
  if (parts.length !== 3) return null;
  const [dd, mm, yy] = parts;
  const fullYear = Number(yy) < 50 ? `20${yy}` : `19${yy}`;
  return `${fullYear}-${mm}-${dd}`;
}

// ─── Helper: add N months to a date string YYYY-MM-DD ─────────────────────────
function addMonths(dateStr, months) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  d.setMonth(d.getMonth() + months);
  return d.toISOString().split("T")[0];
}

// ─── Helper: add N days to a date string YYYY-MM-DD ──────────────────────────
function addDays(dateStr, days) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

// ─── September Remaining Data ─────────────────────────────────────────────────
const septemberData = [
  // ── Page 1 ──────────────────────────────────────────────────────────────────

  // Row 26: 11.09.26, New, Aruna Jeyaraj, monthly 2000, PhonePe, student discount 800
  { type: "new", date: "11.09.26", client: "Aruna Jeyaraj", package: "Monthly", amountPaid: 2000, paymentMode: "PhonePe", contactNumber: "", notes: "Student discount 800" },

  // Row 27: 11.09.26, New, Priyal, monthly 2000, PhonePe
  { type: "new", date: "11.09.26", client: "Priyal", package: "Monthly", amountPaid: 2000, paymentMode: "PhonePe", contactNumber: "" },

  // Row 28: 15.09.26, Renewal 74, Vighilvanian, monthly 3000
  { type: "renewal", date: "15.09.26", memberId: "74", client: "Vighilvanian", package: "Monthly", amountPaid: 3000, paymentMode: "Cash" },

  // Row 29: 16.09.26, New, Sudha, monthly+PT 5000
  { type: "new", date: "16.09.26", client: "Sudha", package: "Monthly + PT", amountPaid: 5000, paymentMode: "Cash", contactNumber: "" },

  // Row 30-31: 16.09.26, Renewal 901, Valli Selvi, monthly 2000, PhonePe
  { type: "renewal", date: "16.09.26", memberId: "901", client: "Valli Selvi", package: "Monthly", amountPaid: 2000, paymentMode: "PhonePe" },

  // Row 32: 16.09.26, Renewal 105, Gnanadhi, monthly 2000, PhonePe
  { type: "renewal", date: "16.09.26", memberId: "105", client: "Gnanadhi", package: "Monthly", amountPaid: 2000, paymentMode: "PhonePe" },

  // Row 33-34: 17.09.26, Renewal 104, Muthu Lakshmi, monthly 2000, GPay
  { type: "renewal", date: "17.09.26", memberId: "104", client: "Muthu Lakshmi", package: "Monthly", amountPaid: 2000, paymentMode: "GPay" },

  // Row 35: 19.09.26, Renewal 1025, Karthikeyan, monthly 1600, GPay
  { type: "renewal", date: "19.09.26", memberId: "1025", client: "Karthikeyan", package: "Monthly", amountPaid: 1600, paymentMode: "GPay" },

  // Row 36: 19.09.26, Renewal 1023, Vabuke, monthly 1600
  { type: "renewal", date: "19.09.26", memberId: "1023", client: "Vabuke", package: "Monthly", amountPaid: 1600, paymentMode: "Cash" },

  // Row 37: 21.09.26, Renewal 639
  { type: "renewal", date: "21.09.26", memberId: "639", client: "", package: "Monthly", amountPaid: 0, paymentMode: "Cash" },

  // ── Page 2 ──────────────────────────────────────────────────────────────────

  // Row 38: 21.09.26, Renewal 1033, Radhika, monthly 2000
  { type: "renewal", date: "21.09.26", memberId: "1033", client: "Radhika", package: "Monthly", amountPaid: 2000, paymentMode: "Cash" },

  // Row 39: 21.09.26, New, Vasim, monthly 10000
  { type: "new", date: "21.09.26", client: "Vasim", package: "Monthly", amountPaid: 10000, paymentMode: "Cash", contactNumber: "" },

  // Row 40: 21.09.26, Renewal 1026, Sankaran, yearly 11000
  { type: "renewal", date: "21.09.26", memberId: "1026", client: "Sankaran", package: "Yearly", amountPaid: 11000, paymentMode: "Cash" },

  // Row 42-43: 22.09.26, New, Santosh, monthly FPT 7000
  { type: "new", date: "22.09.26", client: "Santosh", package: "Monthly FPT", amountPaid: 7000, paymentMode: "Cash", contactNumber: "" },

  // Row 44: 23.09.26, Renewal 1046, Ajeesh, monthly 2800
  { type: "renewal", date: "23.09.26", memberId: "1046", client: "Ajeesh", package: "Monthly", amountPaid: 2800, paymentMode: "Cash" },

  // Row 45: 23.09.26, Renewal 1045, Ajeesh (2nd entry), monthly 1500
  { type: "renewal", date: "23.09.26", memberId: "1045", client: "Ajeesh", package: "Monthly", amountPaid: 1500, paymentMode: "Cash" },

  // Row 46: 23.09.26, New, Jaya, monthly 2000
  { type: "new", date: "23.09.26", client: "Jaya", package: "Monthly", amountPaid: 2000, paymentMode: "Cash", contactNumber: "" },

  // Row 47: 23.09.26, New, Sandhya (new), monthly 100
  { type: "new", date: "23.09.26", client: "Sandhya New", package: "Monthly", amountPaid: 100, paymentMode: "Cash", contactNumber: "" },

  // Row 48: 24.09.26, Renewal 1038, Santhosh Kumar, monthly 2860
  { type: "renewal", date: "24.09.26", memberId: "1038", client: "Santhosh Kumar", package: "Monthly", amountPaid: 2860, paymentMode: "Cash" },

  // Row 49: 25.09.26, Renewal 1040, Sandhya, monthly 1000
  { type: "renewal", date: "25.09.26", memberId: "1040", client: "Sandhya", package: "Monthly", amountPaid: 1000, paymentMode: "Cash" },

  // ── Page 3 ──────────────────────────────────────────────────────────────────

  // Row 50: 26.09.26, Annual 453, Akhil, yearly 10000, GPay
  { type: "renewal", date: "26.09.26", memberId: "453", client: "Akhil", package: "Yearly", amountPaid: 10000, paymentMode: "GPay" },

  // Row 51: 26.09.26, Annual 1013, Manikkandan, yearly 5000, Cash
  { type: "renewal", date: "26.09.26", memberId: "1013", client: "Manikkandan", package: "Yearly", amountPaid: 5000, paymentMode: "Cash" },

  // Row 52: 26.09.26, Renewal 1015, Jaya Kumar, monthly 2500, Cash
  { type: "renewal", date: "26.09.26", memberId: "1015", client: "Jaya Kumar", package: "Monthly", amountPaid: 2500, paymentMode: "Cash" },

  // Row 53: 26.09.26, Renewal 182, Chidambaram Preethi, yearly 10000, Cash
  { type: "renewal", date: "26.09.26", memberId: "182", client: "Chidambaram Preethi", package: "Yearly", amountPaid: 10000, paymentMode: "Cash" },

  // Row 54: 24.09.26, Renewal 52, Prathap, monthly 2500, Cash
  { type: "renewal", date: "24.09.26", memberId: "52", client: "Prathap", package: "Monthly", amountPaid: 2500, paymentMode: "Cash" },

  // Row 55: 24.09.26, New, Aravind Balaji, monthly 2000, PhonePe
  { type: "new", date: "24.09.26", client: "Aravind Balaji", package: "Monthly", amountPaid: 2000, paymentMode: "PhonePe", contactNumber: "" },

  // Row 56: Skipped - marked as "Remove"

  // Row 57: 29.09.26, Renewal 1058, Mani Kanda Prabhu, monthly 2000, PhonePe
  { type: "renewal", date: "29.09.26", memberId: "1058", client: "Mani Kanda Prabhu", package: "Monthly", amountPaid: 2000, paymentMode: "PhonePe" },
];

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log("🚀 Starting September remaining data import...\n");

  let newCount = 0;
  let renewalCount = 0;
  let skippedCount = 0;
  let errorCount = 0;
  const errors = [];

  // Get current max memberId counter
  const counter = await prisma.counter.findUnique({ where: { name: "memberId" } });
  let nextSeq = counter ? counter.seq : 1080;
  console.log(`📌 Current memberId counter: ${nextSeq}\n`);

  for (const entry of septemberData) {
    const joiningDate = parseDate(entry.date);
    const endDate =
      entry.package?.toLowerCase().includes("yearly")
        ? addDays(joiningDate, 365)
        : addMonths(joiningDate, 1);

    try {
      if (entry.type === "new") {
        // ── CREATE NEW GYMBILL ──────────────────────────────────────────────
        // Idempotency: skip if client name already exists
        if (entry.client) {
          const existing = await prisma.gymBill.findFirst({
            where: { client: { equals: entry.client, mode: "insensitive" } },
          });
          if (existing) {
            console.log(`  ⏩ NEW: "${entry.client}" already exists (memberId ${existing.memberId}) - skipping`);
            skippedCount++;
            continue;
          }
        }

        nextSeq++;
        const memberId = String(nextSeq);

        await prisma.gymBill.create({
          data: {
            memberId,
            client: entry.client,
            contactNumber: entry.contactNumber || "",
            package: entry.package,
            joiningDate,
            endDate,
            price: entry.amountPaid,
            amountPaid: entry.amountPaid,
            balance: 0,
            status: "Active",
            initialPaymentMode: entry.paymentMode,
            remarks: entry.notes || null,
            paymentHistory: [
              {
                amount: entry.amountPaid,
                mode: entry.paymentMode,
                note: "Initial Payment (Sept data import)",
                date: new Date(joiningDate),
              },
            ],
            renewalHistory: [],
          },
        });

        console.log(`  ✅ NEW: ${entry.client} → memberId ${memberId} (${joiningDate}) ₹${entry.amountPaid}`);
        newCount++;

      } else if (entry.type === "renewal") {
        // ── ADD RENEWAL TO EXISTING GYMBILL ────────────────────────────────
        if (!entry.memberId) {
          console.log(`  ⚠️  RENEWAL: No memberId for "${entry.client}" - skipping`);
          skippedCount++;
          continue;
        }

        const existing = await prisma.gymBill.findUnique({
          where: { memberId: entry.memberId },
        });

        if (!existing) {
          console.log(`  ❌ RENEWAL: memberId ${entry.memberId} ("${entry.client}") NOT FOUND - skipping`);
          skippedCount++;
          continue;
        }

        // Save current state to renewalHistory
        const previousCycle = {
          joiningDate: existing.joiningDate,
          endDate: existing.endDate,
          package: existing.package,
          price: existing.price,
          amountPaid: existing.amountPaid,
          balance: existing.balance,
          modeOfPayment: existing.initialPaymentMode,
          date: new Date().toISOString(),
          note: "Auto-imported from Sept register",
        };

        const renewalHistory = Array.isArray(existing.renewalHistory)
          ? existing.renewalHistory
          : [];

        await prisma.gymBill.update({
          where: { memberId: entry.memberId },
          data: {
            joiningDate,
            endDate,
            package: entry.package,
            price: entry.amountPaid,
            amountPaid: entry.amountPaid,
            balance: 0,
            status: "Active",
            initialPaymentMode: entry.paymentMode,
            renewalHistory: [...renewalHistory, previousCycle],
          },
        });

        console.log(
          `  🔁 RENEWAL: memberId ${entry.memberId} "${existing.client}" → ${joiningDate} ₹${entry.amountPaid}`
        );
        renewalCount++;
      }
    } catch (err) {
      errorCount++;
      errors.push({ client: entry.client, memberId: entry.memberId, error: err.message });
      console.error(`  ❌ ERROR: ${entry.client || entry.memberId}: ${err.message}`);
    }
  }

  // Update counter for new members
  if (newCount > 0) {
    await prisma.counter.upsert({
      where: { name: "memberId" },
      update: { seq: nextSeq },
      create: { name: "memberId", seq: nextSeq },
    });
    console.log(`\n🔢 Counter updated to: ${nextSeq}`);
  }

  // Summary
  console.log("\n📊 Import Summary:");
  console.log(`   ✅ New clients added:  ${newCount}`);
  console.log(`   🔁 Renewals updated:   ${renewalCount}`);
  console.log(`   ⏩ Skipped:            ${skippedCount}`);
  console.log(`   ❌ Errors:             ${errorCount}`);

  if (errors.length > 0) {
    console.log("\n❌ Error Details:");
    errors.forEach((e) =>
      console.log(`   - memberId:${e.memberId} "${e.client}": ${e.error}`)
    );
  }

  // Final DB counts
  const totalBills = await prisma.gymBill.count();
  const activeBills = await prisma.gymBill.count({ where: { status: "Active" } });
  console.log(`\n📋 DB Stats after import: ${totalBills} total clients, ${activeBills} active`);

  await prisma.$disconnect();
  await pool.end();
  console.log("\n🎉 Done!");
}

main().catch(async (err) => {
  console.error("💥 Fatal error:", err);
  await prisma.$disconnect();
  await pool.end();
  process.exit(1);
});
