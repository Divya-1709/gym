import express from "express";
import crypto from "crypto";
import multer from "multer";
import prisma from "../utils/db.js";
import path from "path";
import fs from "fs";
import { generateInvoicePDF } from "../utils/generateInvoice.js";
import {
  sendNewClientMail,
  sendRenewalMail,
  sendExpiryMail
} from "../utils/mailer.js";
import {
  sendNewClientWhatsApp,
  sendExpiryReminderWhatsApp,
  sendRenewalSuccessWhatsApp,
} from "../utils/whatsapp.js";
import { runWishesJob } from "../cron/sendWishes.js";
import { runExpiryRemindersJob } from "../cron/sendExpiryReminders.js";

const router = express.Router();
const upload = multer({ dest: "uploads/" });

const ALLOWED_BILL_FIELDS = [
  "invoiceId", "invoiceDate", "memberId", "client", "contactNumber", "alternateContact",
  "email", "clientSource", "gender", "dateOfBirth", "anniversary", "profession",
  "taxId", "workoutHours", "areaAddress", "remarks", "package", "days", "joiningDate",
  "endDate", "sessions", "price", "discount", "discountAmount", "admissionCharges",
  "tax", "amountPayable", "amountPaid", "balance", "amount", "initialPaymentMode",
  "followupDate", "status", "paymentMethodDetail", "appointTrainer", "clientRep",
  "profilePicture", "ptAmount", "ptTrainer"
];

function sanitizeBillInput(body) {
  const sanitized = {};
  for (const field of ALLOWED_BILL_FIELDS) {
    if (body[field] !== undefined && body[field] !== null) {
      if (["sessions"].includes(field)) {
        sanitized[field] = Number(body[field]) || 0;
      } else if (["price", "discountAmount", "admissionCharges", "tax", "amountPayable", "amountPaid", "balance", "amount", "ptAmount"].includes(field)) {
        sanitized[field] = Number(body[field]) || 0;
      } else {
        sanitized[field] = String(body[field]);
      }
    }
  }
  return sanitized;
}

// ----------------------
// 🎯 Manual Trigger Wishes
// ----------------------
router.post("/trigger-wishes", async (req, res) => {
  try {
    const results = await runWishesJob();
    res.json({ message: "Wishes job executed", count: results.length, data: results });
  } catch (error) {
    console.error("Error running wishes job:", error);
    res.status(500).json({ message: "Failed to run wishes job", error: error.message });
  }
});

// ----------------------------------
// 🎯 Trigger Expiry Reminders Job
// ----------------------------------
router.post("/trigger-expiry-reminders", async (req, res) => {
  try {
    const results = await runExpiryRemindersJob();
    res.json({ message: "Expiry reminders job executed", count: results.length, data: results });
  } catch (error) {
    console.error("Error running expiry reminders job:", error);
    res.status(500).json({ message: "Failed to run expiry reminders job", error: error.message });
  }
});

// ----------------------------------
// 📱 Send Expiry Reminder for Single Client
// ----------------------------------
router.post("/send-expiry-reminder/:id", async (req, res) => {
  try {
    const bill = await prisma.gymBill.findUnique({ where: { id: req.params.id } });
    if (!bill) return res.status(404).json({ message: "Client bill not found" });

    let waResult = null;
    let emailSent = false;

    if (bill.contactNumber) {
      waResult = await sendExpiryReminderWhatsApp(
        bill.contactNumber,
        bill.client,
        bill.endDate,
        bill.memberId,
        bill.package,
        bill.balance || 0
      );
    }

    if (bill.email) {
      await sendExpiryMail(
        bill.email,
        bill.client,
        bill.endDate,
        bill.package,
        bill.balance || 0
      );
      emailSent = true;
    }

    res.json({
      message: "Expiry reminder sent successfully",
      whatsappApiSent: waResult?.apiSent || false,
      whatsappLink: waResult?.link || null,
      emailSent,
    });
  } catch (error) {
    console.error("Error sending expiry reminder:", error);
    res.status(500).json({ message: "Failed to send expiry reminder", error: error.message });
  }
});

// ----------------------------
// 🔢 Get Next Member ID
// ----------------------------
router.get("/next-member-id", async (req, res) => {
  try {
    const counter = await prisma.counter.findUnique({
      where: { name: "memberId" },
    });
    const nextId = (counter?.seq || 1092) + 1;
    res.json({ nextMemberId: String(nextId) });
  } catch (error) {
    console.error("Error fetching next member id:", error);
    res.status(500).json({ error: error.message });
  }
});

// ---------------------
// 🧾 Create New Gym Bill
// ---------------------
router.post("/", upload.single("profilePicture"), async (req, res) => {
  try {
    if (!req.body || Object.keys(req.body).length === 0)
      return res.status(400).json({ message: "No data provided" });

    let memberId;
    if (req.body.memberId && String(req.body.memberId).trim()) {
      memberId = String(req.body.memberId).trim();
      const num = parseInt(memberId, 10);
      if (!isNaN(num)) {
        await prisma.counter.upsert({
          where: { name: "memberId" },
          update: { seq: num },
          create: { name: "memberId", seq: num },
        });
      }
    } else {
      const counter = await prisma.counter.upsert({
        where: { name: "memberId" },
        update: { seq: { increment: 1 } },
        create: { name: "memberId", seq: 1092 },
      });
      memberId = String(counter.seq);
    }

    let status = req.body.status?.trim();
    if (!status || !["Active", "Inactive"].includes(status)) {
      status = "Active";
    }

    const priceNum = Number(req.body.price) || 0;
    const admissionCharges = Number(req.body.admissionCharges) || 0;
    const discountAmt = Number(req.body.discountAmount) || 0;
    const paidAmt = Number(req.body.amountPaid) || 0;
    const firstBalance = priceNum + admissionCharges - discountAmt - paidAmt;

    const sanitizedData = sanitizeBillInput(req.body);

    const initialHistory = paidAmt > 0
      ? [{ amount: paidAmt, mode: req.body.initialPaymentMode || "Cash", note: "Initial Payment", date: new Date() }]
      : [];

    const newBill = await prisma.gymBill.create({
      data: {
        ...sanitizedData,
        memberId,
        status,
        admissionCharges,
        balance: firstBalance,
        discountAmount: discountAmt,
        price: priceNum,
        sessions: Number(req.body.sessions) || 0,
        tax: Number(req.body.tax) || 0,
        amountPayable: Number(req.body.amountPayable) || 0,
        amountPaid: paidAmt,
        amount: Number(req.body.amount) || 0,
        ptAmount: Number(req.body.ptAmount) || 0,
        ptTrainer: req.body.ptTrainer || null,
        paymentHistory: initialHistory,
        renewalHistory: [],
      },
    });

    if (newBill.email) {
      await sendNewClientMail(newBill.email, newBill.client, newBill.memberId);
    }

    let waResult = null;
    if (newBill.contactNumber) {
      waResult = await sendNewClientWhatsApp(newBill.contactNumber, newBill.client, newBill.memberId);
    }

    res.status(201).json({
      message: "✅ Gym Bill Created Successfully",
      memberId: newBill.memberId,
      data: newBill,
      whatsappLink: waResult?.link,
      whatsappApiSent: waResult?.apiSent,
    });
  } catch (error) {
    console.error("❌ Error creating gym bill:", error);
    res.status(500).json({ message: "Error creating gym bill", error: error.message });
  }
});

// ------------------
// 🔁 Renew Membership
// ------------------
router.put("/renew/:id", async (req, res) => {
  try {
    const {
      joiningDate,
      endDate,
      package: pkg,
      price,
      admissionCharges,
      discountAmount,
      amountPaid,
      remarks,
      trainer,
      paymentMethod,
      ptAmount,
      ptTrainer,
    } = req.body;

    const client = await prisma.gymBill.findUnique({ where: { id: req.params.id } });
    if (!client) return res.status(404).json({ message: "Client not found" });

    const renewId = crypto.randomUUID();
    const previousCycle = {
      _id: renewId,
      id: renewId,
      joiningDate: client.joiningDate,
      endDate: client.endDate,
      package: client.package,
      price: client.price,
      admissionCharges: client.admissionCharges,
      discountAmount: client.discountAmount,
      amountPaid: client.amountPaid,
      balance: client.balance,
      remarks: client.remarks,
      trainer: client.appointTrainer,
      modeOfPayment: paymentMethod || client.initialPaymentMode,
      ptAmount: client.ptAmount || 0,
      ptTrainer: client.ptTrainer || null,
      date: new Date(),
    };

    const priceNum = Number(price) || 0;
    const adm = Number(admissionCharges) || 0;
    const disc = Number(discountAmount) || 0;
    const paid = Number(amountPaid) || 0;
    const newBalance = priceNum + adm - disc - paid;

    const currentHistory = Array.isArray(client.renewalHistory) ? client.renewalHistory : [];
    const updatedRenewalHistory = [...currentHistory, previousCycle];

    const updated = await prisma.gymBill.update({
      where: { id: req.params.id },
      data: {
        renewalHistory: updatedRenewalHistory,
        joiningDate,
        endDate,
        package: pkg,
        price: priceNum,
        admissionCharges: adm,
        discountAmount: disc,
        amountPaid: paid,
        balance: newBalance,
        remarks,
        appointTrainer: trainer,
        initialPaymentMode: paymentMethod || client.initialPaymentMode,
        ptAmount: Number(ptAmount) || 0,
        ptTrainer: ptTrainer || null,
        status: "Active",
      },
    });

    if (updated.email) {
      await sendRenewalMail(updated.email, updated.client, updated.endDate);
    }

    // 📱 Send WhatsApp renewal success notification
    if (updated.contactNumber) {
      try {
        await sendRenewalSuccessWhatsApp(
          updated.contactNumber,
          updated.client,
          updated.memberId,
          updated.package,
          updated.joiningDate,
          updated.endDate,
          updated.amountPaid,
          updated.balance
        );
      } catch (waErr) {
        console.error("WhatsApp renewal error:", waErr);
      }
    }

    res.status(200).json({
      message: "Renewal updated successfully",
      data: updated,
    });
  } catch (err) {
    console.error("Renewal error:", err);
    res.status(500).json({ error: err.message });
  }
});

// ------------------
// ✏️ Edit Renewal Entry
// ------------------
router.put("/renew/edit/:clientId/:renewId", async (req, res) => {
  try {
    const { clientId, renewId } = req.params;

    const client = await prisma.gymBill.findUnique({ where: { id: clientId } });
    if (!client) return res.status(404).json({ message: "Client not found" });

    const currentHistory = Array.isArray(client.renewalHistory) ? [...client.renewalHistory] : [];

    const index = currentHistory.findIndex(
      (r, idx) =>
        String(r._id) === String(renewId) ||
        String(r.id) === String(renewId) ||
        `${clientId}-renew-${idx}` === String(renewId)
    );

    if (index === -1) {
      return res.status(404).json({ message: "Renewal entry not found" });
    }

    const cleanFields = { ...req.body };
    if (cleanFields.price !== undefined) cleanFields.price = Number(cleanFields.price) || 0;
    if (cleanFields.admissionCharges !== undefined) cleanFields.admissionCharges = Number(cleanFields.admissionCharges) || 0;
    if (cleanFields.discountAmount !== undefined) cleanFields.discountAmount = Number(cleanFields.discountAmount) || 0;
    if (cleanFields.amountPaid !== undefined) cleanFields.amountPaid = Number(cleanFields.amountPaid) || 0;
    if (cleanFields.balance !== undefined) cleanFields.balance = Number(cleanFields.balance) || 0;
    if (cleanFields.ptAmount !== undefined) cleanFields.ptAmount = Number(cleanFields.ptAmount) || 0;

    const existingEntry = currentHistory[index];
    const finalId = existingEntry._id || existingEntry.id || renewId;

    currentHistory[index] = {
      ...existingEntry,
      ...cleanFields,
      _id: finalId,
      id: finalId,
    };

    const updated = await prisma.gymBill.update({
      where: { id: clientId },
      data: { renewalHistory: currentHistory },
    });

    res.json({ message: "Renewal entry updated", data: updated });
  } catch (error) {
    console.error("Renewal edit error:", error);
    res.status(500).json({ error: error.message });
  }
});

// ------------------
// 🗑 Delete Renewal Entry
// ------------------
router.delete("/renew/delete/:clientId/:renewId", async (req, res) => {
  try {
    const { clientId, renewId } = req.params;

    const client = await prisma.gymBill.findUnique({ where: { id: clientId } });
    if (!client) return res.status(404).json({ message: "Client not found" });

    const currentHistory = Array.isArray(client.renewalHistory) ? client.renewalHistory : [];
    const updatedRenewalHistory = currentHistory.filter(
      (r, idx) =>
        String(r._id) !== String(renewId) &&
        String(r.id) !== String(renewId) &&
        `${clientId}-renew-${idx}` !== String(renewId)
    );

    const updated = await prisma.gymBill.update({
      where: { id: clientId },
      data: { renewalHistory: updatedRenewalHistory },
    });

    res.json({ message: "Renewal entry deleted", data: updated });
  } catch (err) {
    console.error("Error deleting renewal:", err);
    res.status(500).json({ message: "Deletion failed", error: err.message });
  }
});

// -----------------------------
// 📄 Get / Download Invoice PDF
// -----------------------------
router.get("/invoice-pdf/:id", async (req, res) => {
  try {
    const bill = await prisma.gymBill.findUnique({
      where: { id: req.params.id },
    });
    if (!bill) return res.status(404).send("Invoice not found");

    let profilePicBuffer = null;
    if (bill.profilePicture) {
      const picPath = path.join(process.cwd(), "uploads", bill.profilePicture);
      if (fs.existsSync(picPath)) {
        try {
          profilePicBuffer = fs.readFileSync(picPath);
        } catch (e) {}
      }
    }

    const pdfBuffer = await generateInvoicePDF(bill, profilePicBuffer);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `inline; filename="invoice_${bill.memberId || bill.id}.pdf"`
    );
    res.send(pdfBuffer);
  } catch (err) {
    console.error("Error generating invoice PDF:", err);
    res.status(500).send("Error generating invoice PDF: " + err.message);
  }
});

// -----------------
// ✏️ Update Gym Bill
// -----------------
router.put("/:id", upload.single("profilePicture"), async (req, res) => {
  try {
    const sanitizedData = sanitizeBillInput(req.body);

    if (sanitizedData.status && !["Active", "Inactive"].includes(sanitizedData.status)) {
      sanitizedData.status = "Active";
    }

    const updated = await prisma.gymBill.update({
      where: { id: req.params.id },
      data: sanitizedData,
    });

    res.json(updated);
  } catch (err) {
    console.error("❌ Update error:", err);
    res.status(500).json({ error: err.message });
  }
});

// -------------------
// ❌ Delete Gym Client
// -------------------
router.delete("/:id", async (req, res) => {
  try {
    await prisma.gymBill.delete({ where: { id: req.params.id } });
    res.json({ message: "Client deleted successfully" });
  } catch (err) {
    console.error("❌ Delete error:", err);
    res.status(500).json({ error: err.message });
  }
});

// ---------------------------
// 💰 Update Payment
// ---------------------------
router.put("/payment/:id", async (req, res) => {
  try {
    const { amountPaid, balance, mode, note } = req.body;

    const oldBill = await prisma.gymBill.findUnique({ where: { id: req.params.id } });
    if (!oldBill) return res.status(404).json({ message: "Client not found" });

    const previousPaid = oldBill.amountPaid || 0;
    const newPaidTotal = Number(amountPaid) || 0;
    const paidNow = newPaidTotal - previousPaid;

    const paymentEntry = {
      amount: paidNow,
      mode,
      note: note || "",
      date: new Date(),
    };

    const currentHistory = Array.isArray(oldBill.paymentHistory) ? oldBill.paymentHistory : [];
    const updatedHistory = [...currentHistory, paymentEntry];

    const updatedBill = await prisma.gymBill.update({
      where: { id: req.params.id },
      data: {
        amountPaid: newPaidTotal,
        balance: Number(balance) || 0,
        paymentHistory: updatedHistory,
      },
    });

    return res.status(200).json({
      message: "Payment updated & history saved",
      data: updatedBill,
    });
  } catch (error) {
    console.error("❌ Payment update error:", error);
    res.status(500).json({ error: error.message });
  }
});

// ----------------------------
// ✏️ Edit Payment History Entry
// ----------------------------
router.put("/payment/edit/:clientId/:paymentId", async (req, res) => {
  try {
    const { clientId, paymentId } = req.params;
    const client = await prisma.gymBill.findUnique({ where: { id: clientId } });
    if (!client) return res.status(404).json({ message: "Client not found" });

    const currentHistory = Array.isArray(client.paymentHistory) ? [...client.paymentHistory] : [];
    const index = currentHistory.findIndex(
      (p, idx) =>
        String(p._id) === String(paymentId) ||
        String(p.id) === String(paymentId) ||
        `${clientId}-pay-${idx}` === String(paymentId) ||
        String(idx) === String(paymentId)
    );

    if (index === -1) {
      return res.status(404).json({ message: "Payment entry not found" });
    }

    const oldEntry = currentHistory[index];
    const oldAmount = Number(oldEntry.amount) || 0;
    const newAmount = req.body.amount !== undefined ? (Number(req.body.amount) || 0) : oldAmount;
    const diff = newAmount - oldAmount;

    const finalId = oldEntry._id || oldEntry.id || paymentId;
    currentHistory[index] = {
      ...oldEntry,
      amount: newAmount,
      mode: req.body.mode !== undefined ? req.body.mode : oldEntry.mode,
      note: req.body.note !== undefined ? req.body.note : (oldEntry.note || ""),
      date: req.body.date ? new Date(req.body.date) : oldEntry.date,
      _id: finalId,
      id: finalId,
    };

    const newAmountPaid = (client.amountPaid || 0) + diff;
    const newBalance = Math.max(0, (client.balance || 0) - diff);

    const updated = await prisma.gymBill.update({
      where: { id: clientId },
      data: {
        paymentHistory: currentHistory,
        amountPaid: newAmountPaid,
        balance: newBalance,
      },
    });

    res.json({ message: "Payment entry updated", data: updated });
  } catch (error) {
    console.error("Payment edit error:", error);
    res.status(500).json({ error: error.message });
  }
});

// ------------------------------
// 🗑 Delete Payment History Entry
// ------------------------------
router.delete("/payment/delete/:clientId/:paymentId", async (req, res) => {
  try {
    const { clientId, paymentId } = req.params;
    const client = await prisma.gymBill.findUnique({ where: { id: clientId } });
    if (!client) return res.status(404).json({ message: "Client not found" });

    const currentHistory = Array.isArray(client.paymentHistory) ? [...client.paymentHistory] : [];
    const index = currentHistory.findIndex(
      (p, idx) =>
        String(p._id) === String(paymentId) ||
        String(p.id) === String(paymentId) ||
        `${clientId}-pay-${idx}` === String(paymentId) ||
        String(idx) === String(paymentId)
    );

    if (index === -1) {
      return res.status(404).json({ message: "Payment entry not found" });
    }

    const removedEntry = currentHistory[index];
    const removedAmount = Number(removedEntry.amount) || 0;
    const updatedHistory = currentHistory.filter((_, idx) => idx !== index);

    const newAmountPaid = Math.max(0, (client.amountPaid || 0) - removedAmount);
    const newBalance = (client.balance || 0) + removedAmount;

    const updated = await prisma.gymBill.update({
      where: { id: clientId },
      data: {
        paymentHistory: updatedHistory,
        amountPaid: newAmountPaid,
        balance: newBalance,
      },
    });

    res.json({ message: "Payment entry deleted", data: updated });
  } catch (err) {
    console.error("Error deleting payment:", err);
    res.status(500).json({ message: "Deletion failed", error: err.message });
  }
});

// ---------------------------------------------
// 🕒 Helper: Compute status based on expiry date
// ---------------------------------------------
function computeClientStatus(bill) {
  let effectiveEndDate = bill.endDate ? String(bill.endDate).trim() : "";
  if (!effectiveEndDate && Array.isArray(bill.renewalHistory) && bill.renewalHistory.length > 0) {
    const latest = [...bill.renewalHistory].reverse().find(r => r.endDate && String(r.endDate).trim());
    if (latest) {
      effectiveEndDate = String(latest.endDate).trim();
    }
  }

  if (!effectiveEndDate) {
    return "Inactive";
  }

  const end = new Date(effectiveEndDate);
  if (isNaN(end.getTime())) {
    return "Inactive";
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);

  return end.getTime() >= today.getTime() ? "Active" : "Inactive";
}

// ---------------------
// 📥 Get All Gym Bills
// ---------------------
router.get("/", async (req, res) => {
  try {
    let bills = await prisma.gymBill.findMany({
      orderBy: { createdAt: "desc" },
    });

    bills = bills.map((bill) => {
      const rawRenewalHistory = Array.isArray(bill.renewalHistory) ? bill.renewalHistory : [];
      const rawPaymentHistory = Array.isArray(bill.paymentHistory) ? bill.paymentHistory : [];

      const renewalHistory = rawRenewalHistory.map((r, idx) => {
        const id = r._id || r.id || `${bill.id}-renew-${idx}`;
        return {
          ...r,
          _id: id,
          id: id,
        };
      });

      const paymentHistory = rawPaymentHistory.map((p, idx) => {
        const id = p._id || p.id || `${bill.id}-pay-${idx}`;
        return {
          ...p,
          _id: id,
          id: id,
        };
      });

      const renewalTotal = renewalHistory.reduce(
        (sum, r) => sum + (r.amountPaid || 0),
        0
      );

      const totalPaidIncludingRenewals = (bill.amountPaid || 0) + renewalTotal;
      const computedStatus = computeClientStatus(bill);

      return {
        ...bill,
        _id: bill.id, // Frontend backward compatibility
        status: computedStatus,
        paymentHistory,
        renewalHistory,
        totalPaidIncludingRenewals,
      };
    });

    res.status(200).json(bills);
  } catch (error) {
    res.status(500).json({ message: "Error fetching bills", error: error.message });
  }
});

// ---------------------
// 📥 Get Single Gym Bill
// ---------------------
router.get("/:id", async (req, res) => {
  try {
    const bill = await prisma.gymBill.findUnique({
      where: { id: req.params.id },
    });
    if (!bill) return res.status(404).json({ message: "Bill not found" });

    const rawRenewalHistory = Array.isArray(bill.renewalHistory) ? bill.renewalHistory : [];
    const renewalHistory = rawRenewalHistory.map((r, idx) => {
      const id = r._id || r.id || `${bill.id}-renew-${idx}`;
      return {
        ...r,
        _id: id,
        id: id,
      };
    });

    const rawPaymentHistory = Array.isArray(bill.paymentHistory) ? bill.paymentHistory : [];
    const paymentHistory = rawPaymentHistory.map((p, idx) => {
      const id = p._id || p.id || `${bill.id}-pay-${idx}`;
      return {
        ...p,
        _id: id,
        id: id,
      };
    });

    const computedStatus = computeClientStatus(bill);

    res.json({
      ...bill,
      _id: bill.id,
      status: computedStatus,
      paymentHistory,
      renewalHistory,
    });
  } catch (error) {
    res.status(500).json({ message: "Error fetching bill", error: error.message });
  }
});

export default router;
