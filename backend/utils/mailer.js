import dotenv from "dotenv";
dotenv.config();
import nodemailer from "nodemailer";
import { generateInvoicePDF } from "../utils/generateInvoice.js";


// ✅ MOVE THIS UP
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const sendInvoiceMail = async (email, name, bill, profilePic) => {
  try {
    // 1️⃣ Generate PDF
    const pdfBuffer = await generateInvoicePDF(bill, profilePic);

    // 2️⃣ Send email with attachment
    await transporter.sendMail({
      from: `"H4 fitnessstudio Semmancheri 💪" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Your Invoice - H4 fitnessstudio Semmancheri 💪",
      html: `
        <h2>Hi ${name},</h2>
        <p>Your invoice is attached below.</p>
      `,
      attachments: [
        {
          filename: `invoice_${bill.memberId}.pdf`,
          content: pdfBuffer,
        },
      ],
    });

    console.log("✅ Invoice mail sent");
  } catch (err) {
    console.error("❌ Invoice mail error:", err);
  }
};

// ================= SEND MAIL =================
const sendMail = async (to, subject, html, attachments = []) => {
  try {
    await transporter.sendMail({
      from: `"H4 fitnessstudio Semmancheri 💪" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
      attachments, // ✅ ADD THIS
    });

    console.log("✅ Mail sent to:", to);
  } catch (err) {
    console.error("❌ Mail error:", err);
  }
};

// ================= TEMPLATES =================
const templates = {
  newClient: (name, memberId) => `
    <h2>Welcome to H4 fitnessstudio Semmancheri 💪</h2>
    <p>Hi ${name},</p>
    <p>Your membership is created successfully.</p>
    <p><b>Member ID:</b> ${memberId}</p>
  `,

  renewal: (name, endDate) => `
    <h2>Membership Renewed 🔁</h2>
    <p>Hi ${name},</p>
    <p>Your membership is renewed successfully.</p>
    <p><b>Valid till:</b> ${endDate}</p>
  `,

  birthday: (name) => `
    <h2>🎂 Happy Birthday ${name}!</h2>
    <p>Stay fit & strong 💪</p>
  `,

  anniversary: (name) => `
    <h2>🎉 Happy Anniversary ${name}!</h2>
    <p>Wishing you a healthy life together ❤️</p>
  `,
};

// ================= EXPORT FUNCTIONS =================
export const sendNewClientMail = (email, name, memberId) => {
  return sendMail(email, "Welcome to H4 fitnessstudio Semmancheri 💪", templates.newClient(name, memberId));
};

export const sendRenewalMail = (email, name, endDate) => {
  return sendMail(email, "Membership Renewed 🔁", templates.renewal(name, endDate));
};

export const sendBirthdayMail = (email, name) => {
  return sendMail(email, "Happy Birthday 🎂", templates.birthday(name));
};

export const sendAnniversaryMail = (email, name) => {
  return sendMail(email, "Happy Anniversary 🎉", templates.anniversary(name));
};