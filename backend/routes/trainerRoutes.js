import express from "express";
import Trainer from "../models/Trainer.js";

const router = express.Router();

// GET all trainers
router.get("/", async (req, res) => {
  try {
    const trainers = await Trainer.find();
    res.json(trainers);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch trainers" });
  }
});

// POST new trainer
router.post("/", async (req, res) => {
  try {
    const trainer = new Trainer(req.body);
    await trainer.save();
    res.status(201).json(trainer);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to add trainer" });
  }
});

// DELETE a trainer
router.delete("/:id", async (req, res) => {
  try {
    await Trainer.findByIdAndDelete(req.params.id);
    res.json({ message: "Trainer deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete trainer" });
  }
});

// PUT / edit a trainer
router.put("/:id", async (req, res) => {
  try {
    const updatedTrainer = await Trainer.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true } // return the updated document
    );
    res.json(updatedTrainer);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update trainer" });
  }
});

export default router;
