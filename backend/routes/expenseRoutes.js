import express from "express";
import Expense from "../models/Expense.js";

const router = express.Router();

/* ➕ Add Expense */
router.post("/", async (req, res) => {
  try {
    const expense = new Expense(req.body);
    await expense.save();
    res.status(201).json(expense);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* 📥 Get All Expenses */
router.get("/", async (req, res) => {
  try {
    const expenses = await Expense.find().sort({ expenseDate: -1 });
    res.json(expenses);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* 📊 Monthly Summary */
router.get("/summary/monthly", async (req, res) => {
  try {
    const summary = await Expense.aggregate([
      {
        $group: {
          _id: { $month: "$expenseDate" },
          total: { $sum: "$amount" },
        },
      },
    ]);
    res.json(summary);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* ❌ Delete Expense */
router.delete("/:id", async (req, res) => {
  try {
    await Expense.findByIdAndDelete(req.params.id);
    res.json({ message: "Expense deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
