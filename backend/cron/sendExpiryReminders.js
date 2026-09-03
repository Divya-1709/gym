import cron from "node-cron";
import GymBill from "../models/GymBill.js";
import { sendExpiryMail } from "../utils/mailer.js";
import { sendExpiryReminderWhatsApp } from "../utils/whatsapp.js";

export const runExpiryRemindersJob = async () => {
  console.log("🎯 Running Subscription Expiry Reminders Job");

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const users = await GymBill.find({ status: "Active" });
  const results = [];

  for (let user of users) {
    if (!user.endDate) continue;

    const endDate = new Date(user.endDate);
    if (isNaN(endDate.getTime())) continue;

    endDate.setHours(0, 0, 0, 0);
    const diffTime = endDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    // Send reminder if:
    // diffDays === 0 (expiring today)
    // diffDays > 0 && diffDays <= 3 (expiring in 1-3 days)
    // diffDays < 0 && diffDays >= -7 (expired in the last 7 days)
    if (diffDays <= 3 && diffDays >= -7) {
      let waResult = null;
      let emailResult = false;

      if (user.contactNumber) {
        waResult = await sendExpiryReminderWhatsApp(
          user.contactNumber,
          user.client,
          user.endDate,
          user.memberId,
          user.package,
          user.balance || 0
        );
      }

      if (user.email) {
        await sendExpiryMail(
          user.email,
          user.client,
          user.endDate,
          user.package,
          user.balance || 0
        );
        emailResult = true;
      }

      results.push({
        client: user.client,
        memberId: user.memberId,
        contact: user.contactNumber,
        email: user.email,
        endDate: user.endDate,
        daysRemaining: diffDays,
        whatsappSent: waResult?.apiSent || false,
        whatsappLink: waResult?.link || null,
        emailSent: emailResult,
      });
    }
  }

  console.log(`✅ [Expiry Reminders] Processed ${results.length} reminder(s).`);
  return results;
};

// Schedule daily cron job at 9:00 AM
cron.schedule("0 9 * * *", async () => {
  await runExpiryRemindersJob();
});
