import mongoose from "mongoose";

const expenseSchema = new mongoose.Schema(
  {
    title: { type: String, required: true }, // Rent, Salary, Electricity
    category: {
      type: String,
      enum: [
        "Rent",
        "Salary",
        "Electricity",
        "Maintenance",
        "Marketing",
        "Equipment",
        "Other",
      ],
      required: true,
    },
    amount: { type: Number, required: true },
    paymentMode: {
      type: String,
      enum: ["Cash", "UPI", "Card", "Bank Transfer"],
      required: true,
    },
    expenseDate: { type: Date, default: Date.now },
    notes: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model("Expense", expenseSchema);
