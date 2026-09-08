import express from "express";
import prisma from "../utils/db.js";

const router = express.Router();

/* ➕ Add Expense */
router.post("/", async (req, res) => {
  try {
    const { amount, date, ...rest } = req.body;
    const expense = await prisma.expense.create({
      data: {
        ...rest,
        amount: parseFloat(amount),
        date: date ? new Date(date) : new Date(),
      },
    });
    res.status(201).json(expense);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* 📥 Get All Expenses */
router.get("/", async (req, res) => {
  try {
    const expenses = await prisma.expense.findMany({
      orderBy: { date: "desc" },
    });
    res.json(expenses);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* 📊 Monthly Summary */
router.get("/summary/monthly", async (req, res) => {
  try {
    const expenses = await prisma.expense.findMany();
    const monthlyMap = {};

    expenses.forEach((e) => {
      const month = new Date(e.date).getMonth() + 1; // 1-indexed
      monthlyMap[month] = (monthlyMap[month] || 0) + e.amount;
    });

    const summary = Object.keys(monthlyMap).map((m) => ({
      _id: parseInt(m),
      total: monthlyMap[m],
    }));

    res.json(summary);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* ❌ Delete Expense */
router.delete("/:id", async (req, res) => {
  try {
    await prisma.expense.delete({ where: { id: req.params.id } });
    res.json({ message: "Expense deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;

