import express from "express";
import prisma from "../utils/db.js";

const router = express.Router();

// GET all trainers
router.get("/", async (req, res) => {
  try {
    const trainers = await prisma.trainer.findMany();
    res.json(trainers);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch trainers" });
  }
});

// POST new trainer
router.post("/", async (req, res) => {
  try {
    const trainer = await prisma.trainer.create({
      data: req.body
    });
    res.status(201).json(trainer);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to add trainer" });
  }
});

// DELETE a trainer
router.delete("/:id", async (req, res) => {
  try {
    await prisma.trainer.delete({
      where: { id: req.params.id }
    });
    res.json({ message: "Trainer deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete trainer" });
  }
});

// PUT / edit a trainer
router.put("/:id", async (req, res) => {
  try {
    const updatedTrainer = await prisma.trainer.update({
      where: { id: req.params.id },
      data: req.body
    });
    res.json(updatedTrainer);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update trainer" });
  }
});

export default router;

