import express from "express";
import prisma from "../utils/db.js";

const router = express.Router();

// Create single membership
router.post("/", async (req, res) => {
  try {
    const { durationMonths, price, ...rest } = req.body;
    const membership = await prisma.membership.create({
      data: {
        ...rest,
        durationMonths: parseInt(durationMonths || 1),
        price: parseFloat(price || 0),
      },
    });
    res.status(201).json(membership);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Bulk create memberships
router.post("/bulk", async (req, res) => {
  try {
    const { memberships } = req.body;
    if (!Array.isArray(memberships)) {
      return res.status(400).json({ message: "memberships[] required" });
    }
    const docs = memberships.map((m) => ({
      ...m,
      durationMonths: parseInt(m.durationMonths || 1),
      price: parseFloat(m.price || 0),
    }));

    await prisma.membership.createMany({ data: docs });
    const allCreated = await prisma.membership.findMany({ orderBy: { createdAt: "desc" } });
    res.status(201).json(allCreated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Get all memberships
router.get("/", async (req, res) => {
  try {
    const memberships = await prisma.membership.findMany({
      orderBy: { createdAt: "desc" },
    });
    res.json(memberships);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update membership details
router.put("/:id", async (req, res) => {
  try {
    const updated = await prisma.membership.update({
      where: { id: req.params.id },
      data: req.body,
    });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delete membership
router.delete("/:id", async (req, res) => {
  try {
    await prisma.membership.delete({ where: { id: req.params.id } });
    res.json({ message: "Membership deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;

