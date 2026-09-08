import cron from "node-cron";
import prisma from "../utils/db.js";
import { sendExpiryMail } from "../utils/mailer.js";
import { sendRenewalReminderWhatsApp } from "../utils/whatsapp.js";

/**
 * Finds all GymBill clients whose membership expires in exactly 2 days
 * OR expires today, and sends them a WhatsApp + Email renewal reminder.
 */
export const runExpiryRemindersJob = async () => {
  console.log("🔔 Running Membership Expiry Reminder Job...");

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Target dates: 2 days from now AND today (expiry day)
  const twoDaysLater = new Date(today);
  twoDaysLater.setDate(today.getDate() + 2);

  // Fetch all active clients whose endDate falls on today OR 2 days from now
  const clientsToRemind = await prisma.gymBill.findMany({
    where: {
      status: "Active",
      endDate: {
        in: [
          today.toISOString().split("T")[0],
          twoDaysLater.toISOString().split("T")[0],
        ],
      },
    },
  });

  console.log(`📋 Found ${clientsToRemind.length} client(s) to remind.`);

  const results = [];

  for (const bill of clientsToRemind) {
    const endDate = new Date(bill.endDate);
    endDate.setHours(0, 0, 0, 0);
    const diffDays = Math.round(
      (endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );

    const isExpiringToday = diffDays === 0;
    const isExpiringSoon = diffDays === 2;

    let waResult = null;
    let emailSent = false;

    // ── WhatsApp ──
    if (bill.contactNumber) {
      waResult = await sendRenewalReminderWhatsApp(
        bill.contactNumber,
        bill.client,
        bill.endDate,
        bill.memberId,
        bill.package,
        bill.balance || 0,
        diffDays
      );
    }

    // ── Email ──
    if (bill.email) {
      try {
        await sendExpiryMail(
          bill.email,
          bill.client,
          bill.endDate,
          bill.package,
          bill.balance || 0
        );
        emailSent = true;
      } catch (err) {
        console.error(`❌ Email failed for ${bill.client}:`, err.message);
      }
    }

    results.push({
      client: bill.client,
      memberId: bill.memberId,
      contact: bill.contactNumber,
      email: bill.email,
      endDate: bill.endDate,
      daysRemaining: diffDays,
      label: isExpiringToday ? "Expires TODAY" : "Expires in 2 days",
      whatsappSent: waResult?.apiSent || false,
      whatsappLink: waResult?.link || null,
      emailSent,
    });

    console.log(
      `✅ Reminded: ${bill.client} (Member: ${bill.memberId}) — ${
        isExpiringToday ? "Expires TODAY" : "Expires in 2 days"
      }`
    );
  }

  console.log(
    `✅ [Expiry Reminders] Done. Sent ${results.length} reminder(s).`
  );
  return results;
};

// ─── Schedule: runs every day at 9:00 AM ───────────────────────────────────
cron.schedule("0 9 * * *", async () => {
  console.log("⏰ [CRON] 9 AM — Triggering Expiry Reminders Job");
  await runExpiryRemindersJob();
});
