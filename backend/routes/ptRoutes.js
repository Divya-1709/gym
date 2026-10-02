import express from "express";
import prisma from "../utils/db.js";

const router = express.Router();

// GET all PT sessions
router.get("/", async (req, res) => {
  try {
    const pts = await prisma.personalTraining.findMany({
      include: { client: true, trainer: true },
      orderBy: { createdAt: "desc" },
    });
    res.json(pts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST new PT session
router.post("/", async (req, res) => {
  try {
    const { clientId, trainerId, sessions, price, clientName } = req.body;
    const data = {
      sessions: parseInt(sessions || 1),
      price: parseFloat(price || 0),
      clientName: clientName || null,
    };
    // Only connect clientId if it's a valid Client record (skip for GymBill-based PT)
    if (clientId) data.clientId = clientId;
    if (trainerId) data.trainerId = trainerId;

    const pt = await prisma.personalTraining.create({ data });
    res.status(201).json(pt);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT update PT session
router.put("/:id", async (req, res) => {
  try {
    const updated = await prisma.personalTraining.update({
      where: { id: req.params.id },
      data: req.body,
    });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE PT session
router.delete("/:id", async (req, res) => {
  try {
    await prisma.personalTraining.delete({ where: { id: req.params.id } });
    res.json({ message: "Deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;

