import express from "express";
import prisma from "../utils/db.js";

const router = express.Router();

// GET all payslips
router.get("/", async (req, res) => {
  try {
    const payslips = await prisma.trainerPayslip.findMany({
      orderBy: { createdAt: "desc" },
    });
    res.json(payslips);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch payslips" });
  }
});

// GET payslips for a specific trainer
router.get("/trainer/:name", async (req, res) => {
  try {
    const payslips = await prisma.trainerPayslip.findMany({
      where: { trainerName: req.params.name },
      orderBy: { createdAt: "desc" },
    });
    res.json(payslips);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch payslips" });
  }
});

// POST create payslip
router.post("/", async (req, res) => {
  try {
    const { trainerName, month, year, basicSalary, allowances, deductions, netSalary, paymentMode, notes } = req.body;
    const payslip = await prisma.trainerPayslip.create({
      data: {
        trainerName,
        month,
        year,
        basicSalary: parseFloat(basicSalary) || 0,
        allowances: parseFloat(allowances) || 0,
        deductions: parseFloat(deductions) || 0,
        netSalary: parseFloat(netSalary) || 0,
        paymentMode: paymentMode || "Cash",
        notes: notes || "",
      },
    });
    res.status(201).json(payslip);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create payslip" });
  }
});

// DELETE payslip
router.delete("/:id", async (req, res) => {
  try {
    await prisma.trainerPayslip.delete({
      where: { id: req.params.id },
    });
    res.json({ message: "Payslip deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete payslip" });
  }
});

export default router;
