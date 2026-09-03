import cron from "node-cron";
import GymBill from "../models/GymBill.js";
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

  const users = await GymBill.find();
  const results = [];

  for (let user of users) {
    const dob = user.dateOfBirth ? new Date(user.dateOfBirth) : null;
    const ann = user.anniversary ? new Date(user.anniversary) : null;

    if (
      dob &&
      !isNaN(dob.getTime()) &&
      dob.getDate() === day &&
      dob.getMonth() + 1 === month
    ) {
      if (user.email) await sendBirthdayMail(user.email, user.client);
      if (user.contactNumber) await sendBirthdayWhatsApp(user.contactNumber, user.client);
      results.push({ type: "Birthday", client: user.client, contact: user.contactNumber, email: user.email });
    }

    if (
      ann &&
      !isNaN(ann.getTime()) &&
      ann.getDate() === day &&
      ann.getMonth() + 1 === month
    ) {
      if (user.email) await sendAnniversaryMail(user.email, user.client);
      if (user.contactNumber) await sendAnniversaryWhatsApp(user.contactNumber, user.client);
      results.push({ type: "Anniversary", client: user.client, contact: user.contactNumber, email: user.email });
    }
  }

  return results;
};

cron.schedule("0 9 * * *", async () => {
  await runWishesJob();
});