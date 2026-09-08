import express from "express";
import prisma from "../utils/db.js";

const router = express.Router();

// ✅ Create a new inquiry
router.post("/", async (req, res) => {
  try {
    const counter = await prisma.counter.upsert({
      where: { name: "inquiryId" },
      update: { seq: { increment: 1 } },
      create: { name: "inquiryId", seq: 1 },
    });
    const baseNumber = 1000;
    const inquiryId = `INQ-${baseNumber + counter.seq}`;

    const inquiry = await prisma.inquiry.create({
      data: {
        ...req.body,
        inquiryId: req.body.inquiryId || inquiryId,
      },
      include: { assignedTrainer: true, followups: true }
    });

    res.status(201).json({ message: "Inquiry created successfully", inquiry });
  } catch (error) {
    res.status(500).json({ error: "Failed to create inquiry", details: error.message });
  }
});

// ✅ Get all inquiries
router.get("/", async (req, res) => {
  try {
    const inquiries = await prisma.inquiry.findMany({
      include: { assignedTrainer: true, followups: true },
      orderBy: { createdAt: "desc" },
    });
    res.json(inquiries);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch inquiries" });
  }
});

// ✅ Get a single inquiry by ID
router.get("/:id", async (req, res) => {
  try {
    const inquiry = await prisma.inquiry.findUnique({
      where: { id: req.params.id },
      include: { assignedTrainer: true, followups: true },
    });
    if (!inquiry) return res.status(404).json({ error: "Inquiry not found" });
    res.json(inquiry);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch inquiry" });
  }
});

// ✅ Update inquiry
router.put("/:id", async (req, res) => {
  try {
    const updated = await prisma.inquiry.update({
      where: { id: req.params.id },
      data: req.body,
      include: { assignedTrainer: true, followups: true },
    });

    res.json({ message: "Inquiry updated successfully", inquiry: updated });
  } catch (error) {
    res.status(500).json({ error: "Failed to update inquiry" });
  }
});

// ✅ Delete inquiry
router.delete("/:id", async (req, res) => {
  try {
    await prisma.inquiry.delete({ where: { id: req.params.id } });
    res.json({ message: "Inquiry deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete inquiry" });
  }
});

export default router;

