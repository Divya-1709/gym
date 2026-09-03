import { useEffect, useState } from "react";
import axios from "axios";
import { Trash2, PlusCircle, Filter } from "lucide-react";
import { API_URI } from "../api/api";

const API_URL = `${API_URI}/expenses`;

export default function Expenses() {
  const [expenses, setExpenses] = useState<any[]>([]);
  const [filteredExpenses, setFilteredExpenses] = useState<any[]>([]);

  const [form, setForm] = useState({
    title: "",
    category: "Rent",
    amount: "",
    paymentMode: "Cash",
    notes: "",
  });

  const [filters, setFilters] = useState({
    category: "All",
    paymentMode: "All",
    fromDate: "",
    toDate: "",
  });

  const fetchExpenses = async () => {
    const res = await axios.get(API_URL);
    setExpenses(res.data);
    setFilteredExpenses(res.data);
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  /* 🔍 Filter Logic */
  useEffect(() => {
    let data = [...expenses];

    if (filters.category !== "All") {
      data = data.filter((e) => e.category === filters.category);
    }

    if (filters.paymentMode !== "All") {
      data = data.filter((e) => e.paymentMode === filters.paymentMode);
    }

    if (filters.fromDate) {
      data = data.filter(
        (e) => new Date(e.expenseDate) >= new Date(filters.fromDate)
      );
    }

    if (filters.toDate) {
      data = data.filter(
        (e) => new Date(e.expenseDate) <= new Date(filters.toDate)
      );
    }

    setFilteredExpenses(data);
  }, [filters, expenses]);

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    await axios.post(API_URL, form);
    setForm({
      title: "",
      category: "Rent",
      amount: "",
      paymentMode: "Cash",
      notes: "",
    });
    fetchExpenses();
  };

  const deleteExpense = async (id: string) => {
    await axios.delete(`${API_URL}/${id}`);
    fetchExpenses();
  };

  const totalAmount = filteredExpenses.reduce(
    (sum, e) => sum + Number(e.amount),
    0
  );

  return (
    <div className="p-6 space-y-6">

      {/* 🟡 Header */}
      <div className="bg-gradient-to-r from-yellow-400 to-yellow-500 p-5 rounded-lg text-white shadow">
        <h2 className="text-2xl font-bold">💰 Expense Management</h2>
        <p className="text-sm opacity-90">
          Track & filter your gym expenses easily
        </p>
      </div>

      {/* 🔍 Filters */}
      <div className="bg-white p-4 rounded-lg shadow space-y-3">
        <div className="flex items-center gap-2 text-yellow-600 font-semibold">
          <Filter size={18} /> Filters
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <select
            className="border rounded p-2"
            value={filters.category}
            onChange={(e) =>
              setFilters({ ...filters, category: e.target.value })
            }
          >
            <option>All</option>
            <option>Rent</option>
            <option>Salary</option>
            <option>Electricity</option>
            <option>Maintenance</option>
            <option>Marketing</option>
            <option>Equipment</option>
            <option>Other</option>
          </select>

          <select
            className="border rounded p-2"
            value={filters.paymentMode}
            onChange={(e) =>
              setFilters({ ...filters, paymentMode: e.target.value })
            }
          >
            <option>All</option>
            <option>Cash</option>
            <option>UPI</option>
            <option>Card</option>
            <option>Bank Transfer</option>
          </select>

          <input
            type="date"
            className="border rounded p-2"
            value={filters.fromDate}
            onChange={(e) =>
              setFilters({ ...filters, fromDate: e.target.value })
            }
          />

          <input
            type="date"
            className="border rounded p-2"
            value={filters.toDate}
            onChange={(e) =>
              setFilters({ ...filters, toDate: e.target.value })
            }
          />

          <button
            onClick={() =>
              setFilters({
                category: "All",
                paymentMode: "All",
                fromDate: "",
                toDate: "",
              })
            }
            className="bg-yellow-500 text-white rounded hover:bg-yellow-600"
          >
            Clear
          </button>
        </div>
      </div>

      {/* ➕ Add Expense */}
      <form
        onSubmit={handleSubmit}
        className="bg-white p-4 rounded-lg shadow grid grid-cols-1 md:grid-cols-5 gap-3"
      >
        <input
          className="border rounded p-2"
          placeholder="Title"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          required
        />

        <select
          className="border rounded p-2"
          value={form.category}
          onChange={(e) => setForm({ ...form, category: e.target.value })}
        >
          <option>Rent</option>
          <option>Salary</option>
          <option>Electricity</option>
          <option>Maintenance</option>
          <option>Marketing</option>
          <option>Equipment</option>
          <option>Other</option>
        </select>

        <input
          type="number"
          className="border rounded p-2"
          placeholder="Amount"
          value={form.amount}
          onChange={(e) => setForm({ ...form, amount: e.target.value })}
          required
        />

        <select
          className="border rounded p-2"
          value={form.paymentMode}
          onChange={(e) =>
            setForm({ ...form, paymentMode: e.target.value })
          }
        >
          <option>Cash</option>
          <option>UPI</option>
          <option>Card</option>
          <option>Bank Transfer</option>
        </select>

        <button className="bg-yellow-500 text-white rounded flex items-center justify-center gap-2 hover:bg-yellow-600">
          <PlusCircle size={18} /> Add
        </button>

        <textarea
          className="border rounded p-2 md:col-span-5"
          placeholder="Notes"
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
        />
      </form>

      {/* 📊 Summary */}
      <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg font-semibold text-yellow-800">
        Total Expense: ₹ {totalAmount}
      </div>

      {/* 📋 Table */}
      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-yellow-100">
            <tr>
              <th className="p-3 text-left">Title</th>
              <th className="p-3 text-center">Category</th>
              <th className="p-3 text-center">Amount</th>
              <th className="p-3 text-center">Payment</th>
              <th className="p-3 text-center">Date</th>
              <th className="p-3 text-center">Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredExpenses.map((exp) => (
              <tr key={exp._id} className="border-t hover:bg-yellow-50">
                <td className="p-2">{exp.title}</td>
                <td className="p-2 text-center">{exp.category}</td>
                <td className="p-2 text-center font-bold text-yellow-600">
                  ₹{exp.amount}
                </td>
                <td className="p-2 text-center">{exp.paymentMode}</td>
                <td className="p-2 text-center">
                  {new Date(exp.expenseDate).toLocaleDateString()}
                </td>
                <td className="p-2 text-center">
                  <button
                    onClick={() => deleteExpense(exp._id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
