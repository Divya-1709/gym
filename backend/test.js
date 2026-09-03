import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

async function testMail() {
  try {
    let info = await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: "thirusolai1@gmail.com",   // 🔴 put your email
      subject: "Test Mail",
      text: "Working ✅",
    });

    console.log("SUCCESS:", info.response);
  } catch (err) {
    console.error("ERROR:", err);
  }
}

testMail();