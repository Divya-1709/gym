import express from "express";
import prisma from "../utils/db.js";

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const { packageName, name, type, days, durationDays, price } = req.body;
    const pkgName = name || packageName;
    const pkgDays = parseInt(durationDays || days || 30);
    const pkgPrice = parseFloat(price || 0);

    if (!pkgName || !pkgPrice)
      return res.status(400).json({ message: "Package name and price are required" });

    const newPackage = await prisma.package.create({
      data: {
        name: pkgName,
        type: type || "General",
        durationDays: pkgDays,
        price: pkgPrice,
      },
    });
    res.status(201).json(newPackage);
  } catch (error) {
    res.status(500).json({ message: "Error creating package", error: error.message });
  }
});

router.get("/", async (req, res) => {
  try {
    const packages = await prisma.package.findMany({
      orderBy: { createdAt: "desc" },
    });
    res.json(packages);
  } catch (error) {
    res.status(500).json({ message: "Error fetching packages", error: error.message });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const updatedPackage = await prisma.package.update({
      where: { id: req.params.id },
      data: req.body,
    });
    res.json(updatedPackage);
  } catch (error) {
    res.status(500).json({ message: "Error updating package", error: error.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    await prisma.package.delete({ where: { id: req.params.id } });
    res.json({ message: "Package deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting package", error: error.message });
  }
});

export default router;

