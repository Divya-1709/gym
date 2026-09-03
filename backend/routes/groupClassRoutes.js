import express from "express";
import GroupClass from "../models/GroupClass.js";

const router = express.Router();

// GET all group classes
router.get("/", async (req, res) => {
  const classes = await GroupClass.find();
  res.json(classes);
});

// POST new group class
router.post("/", async (req, res) => {
  const groupClass = new GroupClass(req.body);
  await groupClass.save();
  res.json(groupClass);
});

// PUT update group class
router.put("/:id", async (req, res) => {
  const updated = await GroupClass.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(updated);
});

// DELETE group class
router.delete("/:id", async (req, res) => {
  await GroupClass.findByIdAndDelete(req.params.id);
  res.json({ message: "Deleted" });
});

export default router;
