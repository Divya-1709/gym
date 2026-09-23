import express from "express";
import prisma from "../utils/db.js";

const router = express.Router();

/* ➕ Add Expense */
router.post("/", async (req, res) => {
  try {
    const { amount, date, expenseDate, title, category, paymentMode, notes, description } = req.body;
    const finalDate = date ? new Date(date) : (expenseDate ? new Date(expenseDate) : new Date());

    const expense = await prisma.expense.create({
      data: {
        title: title || "",
        category: category || "Other",
        amount: parseFloat(amount) || 0,
        paymentMode: paymentMode || "Cash",
        date: finalDate,
        expenseDate: finalDate,
        notes: notes || description || "",
        description: description || notes || "",
      },
    });
    res.status(201).json({
      ...expense,
      _id: expense.id,
    });
  } catch (err) {
    console.error("Error creating expense:", err);
    res.status(500).json({ message: err.message });
  }
});

/* 📥 Get All Expenses */
router.get("/", async (req, res) => {
  try {
    const expenses = await prisma.expense.findMany({
      orderBy: { createdAt: "desc" },
    });
    const formatted = expenses.map((exp) => ({
      ...exp,
      _id: exp.id,
      expenseDate: exp.expenseDate || exp.date || exp.createdAt,
    }));
    res.json(formatted);
  } catch (err) {
    console.error("Error fetching expenses:", err);
    res.status(500).json({ message: err.message });
  }
});

/* 📊 Monthly Summary */
router.get("/summary/monthly", async (req, res) => {
  try {
    const expenses = await prisma.expense.findMany();
    const monthlyMap = {};

    expenses.forEach((e) => {
      const expDate = e.expenseDate || e.date || e.createdAt;
      const month = new Date(expDate).getMonth() + 1; // 1-indexed
      monthlyMap[month] = (monthlyMap[month] || 0) + e.amount;
    });

    const summary = Object.keys(monthlyMap).map((m) => ({
      _id: parseInt(m),
      total: monthlyMap[m],
    }));

    res.json(summary);
  } catch (err) {
    console.error("Error fetching monthly expense summary:", err);
    res.status(500).json({ message: err.message });
  }
});

/* ❌ Delete Expense */
router.delete("/:id", async (req, res) => {
  try {
    await prisma.expense.delete({ where: { id: req.params.id } });
    res.json({ message: "Expense deleted" });
  } catch (err) {
    console.error("Error deleting expense:", err);
    res.status(500).json({ message: err.message });
  }
});

export default router;

