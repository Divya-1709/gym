import cron from "node-cron";
import prisma from "../utils/db.js";
import {
  sendBirthdayMail,
  sendAnniversaryMail
} from "../utils/mailer.js";
import {
  sendBirthdayWhatsApp,
  sendAnniversaryWhatsApp
} from "../utils/whatsapp.js";

export const runWishesJob = async () => {
  console.log("🎯 Running Wishes Job");

  const today = new Date();
  const day = today.getDate();
  const month = today.getMonth() + 1;

  const users = await prisma.client.findMany();
  const results = [];

  for (let user of users) {
    const dob = user.dateOfBirth ? new Date(user.dateOfBirth) : null;

    if (
      dob &&
      !isNaN(dob.getTime()) &&
      dob.getDate() === day &&
      dob.getMonth() + 1 === month
    ) {
      if (user.email) await sendBirthdayMail(user.email, user.name);
      if (user.contactNumber) await sendBirthdayWhatsApp(user.contactNumber, user.name);
      results.push({ type: "Birthday", client: user.name, contact: user.contactNumber, email: user.email });
    }
  }

  return results;
};

cron.schedule("0 9 * * *", async () => {
  await runWishesJob();
});