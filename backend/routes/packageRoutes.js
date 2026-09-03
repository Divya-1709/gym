import express from "express";
import Package from "../models/Package.js";

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const { packageName, days, price } = req.body;
    if (!packageName || !days || !price)
      return res.status(400).json({ message: "All fields are required" });

    const newPackage = new Package({ packageName, days, price });
    await newPackage.save();
    res.status(201).json(newPackage);
  } catch (error) {
    res.status(500).json({ message: "Error creating package", error });
  }
});

router.get("/", async (req, res) => {
  try {
    const packages = await Package.find().sort({ createdAt: -1 });
    res.json(packages);
  } catch (error) {
    res.status(500).json({ message: "Error fetching packages", error });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const updatedPackage = await Package.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updatedPackage) return res.status(404).json({ message: "Package not found" });
    res.json(updatedPackage);
  } catch (error) {
    res.status(500).json({ message: "Error updating package", error });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const deletedPackage = await Package.findByIdAndDelete(req.params.id);
    if (!deletedPackage) return res.status(404).json({ message: "Package not found" });
    res.json({ message: "Package deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting package", error });
  }
});

export default router;
