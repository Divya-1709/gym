import express from "express";
import PersonalTraining from "../models/PersonalTraining.js";

const router = express.Router();

// GET all PT sessions
router.get("/", async (req, res) => {
  const pts = await PersonalTraining.find();
  res.json(pts);
});

// POST new PT session
router.post("/", async (req, res) => {
  const pt = new PersonalTraining(req.body);
  await pt.save();
  res.json(pt);
});

// PUT update PT session
router.put("/:id", async (req, res) => {
  const updated = await PersonalTraining.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(updated);
});

// DELETE PT session
router.delete("/:id", async (req, res) => {
  await PersonalTraining.findByIdAndDelete(req.params.id);
  res.json({ message: "Deleted" });
});

export default router;
