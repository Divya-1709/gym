import dotenv from "dotenv";
dotenv.config();
import axios from "axios";

/**
 * Clean phone number & format with country code (defaults to 91 for India if 10 digits)
 */
export const formatPhoneNumber = (phone) => {
  if (!phone) return null;
  let cleaned = String(phone).replace(/\D/g, ""); // Remove non-numeric characters
  while (cleaned.startsWith("0")) {
    cleaned = cleaned.substring(1);
  }
  if (cleaned.startsWith("910") && cleaned.length === 13) {
    cleaned = "91" + cleaned.substring(3);
  }
  if (cleaned.length === 10) {
    cleaned = `91${cleaned}`;
  }
  return cleaned;
};

/**
 * Returns direct WhatsApp Web chat URL that opens the client's conversation pane directly
 */
export const getDirectWhatsAppUrl = (phone, message = "") => {
  const formattedPhone = formatPhoneNumber(phone);
  if (!formattedPhone) return "";
  return `https://web.whatsapp.com/send/?phone=${formattedPhone}&text=${encodeURIComponent(message)}`;
};

/**
 * Sends WhatsApp message using configured API or logs fallback link
 */
export const sendWhatsAppMessage = async (phone, message) => {
  const formattedPhone = formatPhoneNumber(phone);
  if (!formattedPhone) {
    console.log("⚠️ [WhatsApp] Invalid phone number provided:", phone);
    return { success: false, link: null };
  }

  const apiUrl = process.env.WHATSAPP_API_URL;
  const token = process.env.WHATSAPP_TOKEN;
  const instanceId = process.env.WHATSAPP_INSTANCE_ID;

  const waMeLink = getDirectWhatsAppUrl(formattedPhone, message);

  console.log(`📱 [WhatsApp Prepared] To: +${formattedPhone}`);
  console.log(`💬 Message: "${message}"`);
  console.log(`🔗 Direct Link: ${waMeLink}`);

  if (apiUrl && (token || instanceId)) {
    try {
      const response = await axios.post(apiUrl, {
        token: token,
        instanceId: instanceId,
        to: formattedPhone,
        phone: formattedPhone,
        body: message,
        message: message,
      }, {
        headers: { "Content-Type": "application/json" },
        timeout: 10000,
      });

      console.log("✅ [WhatsApp] Message sent via API successfully:", response.data);
      return { success: true, apiSent: true, link: waMeLink, data: response.data };
    } catch (err) {
      console.error("❌ [WhatsApp API Error]:", err.response?.data || err.message);
      return { success: false, apiSent: false, link: waMeLink, error: err.message };
    }
  } else {
    console.log("ℹ️ [WhatsApp] WHATSAPP_API_URL / TOKEN not configured in .env. Logged link above for reference.");
    return { success: true, apiSent: false, link: waMeLink };
  }
};

// ================= TEMPLATES & HELPERS =================

export const sendNewClientWhatsApp = async (phone, name, memberId) => {
  const message = `Welcome to Elite Fitness 💪\nHi ${name},\nYour membership (Member ID: ${memberId}) has been created successfully. We're excited to have you on board! 🏋️‍♂️`;
  return sendWhatsAppMessage(phone, message);
};

export const sendBirthdayWhatsApp = async (phone, name) => {
  const message = `🎂 Happy Birthday ${name}!\n\nElite Fitness wishes you a fantastic day filled with joy, health, and strength. Keep shining! 💪🎉`;
  return sendWhatsAppMessage(phone, message);
};

export const sendAnniversaryWhatsApp = async (phone, name) => {
  const message = `🎉 Happy Anniversary ${name}!\n\nWishing you a healthy, happy, and blessed life together from all of us at Elite Fitness! ❤️🏋️‍♂️`;
  return sendWhatsAppMessage(phone, message);
};

export const sendExpiryReminderWhatsApp = async (phone, name, endDate, memberId, packageName, balance = 0) => {
  const balanceText = balance > 0 ? `\nPending Balance: ₹${balance}` : "";
  const message = `🔔 *Subscription Expiry Reminder*\n\nHi *${name}* (Member ID: *${memberId || "N/A"}*),\n\nYour gym membership (${packageName || "Package"}) at *Elite Fitness* is expiring / has expired on *${endDate}*.${balanceText}\n\nPlease renew your monthly membership to continue your workout regime without interruption. 💪🏋️‍♂️\n\nThank you!\nElite Fitness`;
  return sendWhatsAppMessage(phone, message);
};

/**
 * Renewal reminder — sent 2 days before OR on expiry day
 * @param {string} phone
 * @param {string} name
 * @param {string} endDate  — "YYYY-MM-DD"
 * @param {string} memberId
 * @param {string} packageName
 * @param {number} balance
 * @param {number} daysRemaining — 0 = expires today, 2 = expires in 2 days
 */
export const sendRenewalReminderWhatsApp = async (
  phone,
  name,
  endDate,
  memberId,
  packageName,
  balance = 0,
  daysRemaining = 2
) => {
  const isToday = daysRemaining === 0;
  const urgencyLine = isToday
    ? `⚠️ Your membership *expires TODAY* (${endDate}).`
    : `⏳ Your membership expires in *2 days* on *${endDate}*.`;

  const balanceText = balance > 0 ? `\n💰 Pending Balance: ₹${balance}` : "";

  const message =
    `🏋️ *Elite Fitness*\n` +
    `🔔 *Renewal Reminder*\n\n` +
    `Hi *${name}* (Member ID: *${memberId || "N/A"}*),\n\n` +
    `${urgencyLine}\n` +
    `📦 Package: *${packageName || "Monthly Membership"}*` +
    `${balanceText}\n\n` +
    `Renew now to keep your fitness journey going without any break! 💪\n\n` +
    `📞 Contact us to renew: Visit the gym or call us.\n\n` +
    `Thank you for being part of our family! 🙏\n` +
    `— Elite Fitness`;

  return sendWhatsAppMessage(phone, message);
};

/**
 * Sends a PDF/document attachment via WhatsApp API (e.g. UltraMsg, GreenAPI, Twilio, Meta Cloud API)
 */
export const sendWhatsAppDocument = async (phone, documentUrl, filename, caption = "") => {
  const formattedPhone = formatPhoneNumber(phone);
  if (!formattedPhone) {
    console.log("⚠️ [WhatsApp] Invalid phone number for document:", phone);
    return { success: false, link: null };
  }

  const apiUrl = process.env.WHATSAPP_API_URL;
  const token = process.env.WHATSAPP_TOKEN;
  const instanceId = process.env.WHATSAPP_INSTANCE_ID;

  const waMeLink = getDirectWhatsAppUrl(formattedPhone, caption);

  console.log(`📱 [WhatsApp Document Prepared] To: +${formattedPhone}`);
  console.log(`📄 Document: "${filename}" -> ${documentUrl}`);
  console.log(`💬 Caption: "${caption}"`);

  if (apiUrl && (token || instanceId)) {
    try {
      let endpoint = apiUrl;
      if (apiUrl.includes("ultramsg.com") && !apiUrl.endsWith("/messages/document")) {
        endpoint = apiUrl.replace(/\/messages\/?$/, "") + "/messages/document";
      }

      const response = await axios.post(
        endpoint,
        {
          token: token,
          instanceId: instanceId,
          to: formattedPhone,
          phone: formattedPhone,
          chatId: `${formattedPhone}@c.us`,
          document: documentUrl,
          urlFile: documentUrl,
          mediaUrl: documentUrl,
          filename: filename,
          fileName: filename,
          caption: caption,
        },
        {
          headers: { "Content-Type": "application/json" },
          timeout: 15000,
        }
      );

      console.log("✅ [WhatsApp Document] Document sent via API successfully:", response.data);
      return { success: true, apiSent: true, link: waMeLink, data: response.data };
    } catch (err) {
      console.error("❌ [WhatsApp Document API Error]:", err.response?.data || err.message);
      // Fallback to text message
      return sendWhatsAppMessage(phone, caption);
    }
  } else {
    console.log("ℹ️ [WhatsApp Document] API credentials not set. Prepared WhatsApp Web link.");
    return { success: true, apiSent: false, link: waMeLink };
  }
};

/**
 * Renewal success message with invoice attachment
 */
export const sendRenewalSuccessWhatsApp = async (
  phone,
  name,
  memberId,
  packageName,
  joiningDate,
  endDate,
  amountPaid,
  balance = 0
) => {
  const balanceText = balance > 0 ? `\n💳 *Pending Balance:* ₹${balance}` : "";

  const message =
    `✅ *Membership Renewal Successful!* 🎉\n\n` +
    `Hi *${name}* (Member ID: *${memberId || "N/A"}*),\n\n` +
    `Your gym membership has been renewed successfully at *Elite Fitness*! 💪🏋️‍♂️\n\n` +
    `📦 *Package:* ${packageName || "Membership Package"}\n` +
    `📅 *Valid From:* ${joiningDate}\n` +
    `📅 *Valid Till:* ${endDate}\n` +
    `💰 *Amount Paid:* ₹${amountPaid}${balanceText}\n\n` +
    `📎 Please find your invoice attached to this message.\n\n` +
    `Thank you for renewing your journey with *Elite Fitness*! Stay fit & strong! 💪🏋️‍♂️\n` +
    `— *Elite Fitness*`;

  return sendWhatsAppMessage(phone, message);
};

