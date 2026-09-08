import express from "express";
import prisma from "../utils/db.js";

const router = express.Router();

// ✅ CREATE follow-up
router.post("/", async (req, res) => {
  try {
    const { inquiryId, date, notes, status } = req.body;

    const followup = await prisma.followup.create({
      data: {
        inquiryId,
        date: date ? new Date(date) : new Date(),
        notes,
        status: status || "Pending",
      },
      include: { inquiry: true },
    });

    res.status(201).json(followup);
  } catch (err) {
    console.error("❌ Error:", err.message);
    res.status(500).json({ message: err.message });
  }
});

// ✅ GET all follow-ups
router.get("/", async (req, res) => {
  try {
    const followups = await prisma.followup.findMany({
      include: { inquiry: true },
      orderBy: { createdAt: "desc" },
    });

    res.status(200).json(followups);
  } catch (err) {
    console.error("❌ Error fetching follow-ups:", err.message);
    res.status(500).json({ message: "Error fetching follow-ups" });
  }
});

// ✅ UPDATE status
router.put("/:id/status", async (req, res) => {
  try {
    const { status } = req.body;

    const updated = await prisma.followup.update({
      where: { id: req.params.id },
      data: { status },
      include: { inquiry: true },
    });

    res.status(200).json(updated);
  } catch (err) {
    console.error("❌ Error updating status:", err.message);
    res.status(500).json({ message: "Error updating status" });
  }
});

// ✅ DELETE
router.delete("/:id", async (req, res) => {
  try {
    await prisma.followup.delete({ where: { id: req.params.id } });
    res.status(200).json({ message: "Follow-up deleted successfully" });
  } catch (err) {
    console.error("❌ Error deleting:", err.message);
    res.status(500).json({ message: "Error deleting follow-up" });
  }
});

export default router;