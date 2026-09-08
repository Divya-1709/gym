import express from "express";
import prisma from "../utils/db.js";

const router = express.Router();

// GET all group classes
router.get("/", async (req, res) => {
  try {
    const classes = await prisma.groupClass.findMany({
      include: { instructor: true },
      orderBy: { createdAt: "desc" },
    });
    res.json(classes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST new group class
router.post("/", async (req, res) => {
  try {
    const { title, instructorId, schedule, capacity } = req.body;
    const groupClass = await prisma.groupClass.create({
      data: {
        title,
        instructorId,
        schedule,
        capacity: capacity ? parseInt(capacity) : undefined,
      },
    });
    res.status(201).json(groupClass);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT update group class
router.put("/:id", async (req, res) => {
  try {
    const updated = await prisma.groupClass.update({
      where: { id: req.params.id },
      data: req.body,
    });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE group class
router.delete("/:id", async (req, res) => {
  try {
    await prisma.groupClass.delete({ where: { id: req.params.id } });
    res.json({ message: "Deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;

