import { useEffect, useState, useMemo } from "react";
import axios from "axios";
import {
  Trash2,
  PlusCircle,
  Filter,
  ChevronDown,
  ChevronRight,
  List,
  Layers,
  Download,
  X,
  FileText,
  Table2,
} from "lucide-react";
import { API_URI } from "../api/api";

const API_URL = `${API_URI}/expenses`;

const CATEGORY_ICONS: Record<string, string> = {
  Rent: "🏠",
  Salary: "💼",
  Electricity: "⚡",
  Maintenance: "🔧",
  Marketing: "📢",
  Equipment: "🏋️",
  Other: "📁",
};

export default function Expenses() {
  const [expenses, setExpenses] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);

  // Which category is currently expanded in accordion view
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});

  // View mode: "grouped" (shows category totals first, click to show individual expenses) or "flat" (shows all rows)
  const [viewMode, setViewMode] = useState<"grouped" | "flat">("grouped");

  // Download modal state
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [downloadCategories, setDownloadCategories] = useState<string[]>(["All"]);

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
    try {
      const res = await axios.get(API_URL);
      const data = Array.isArray(res.data) ? res.data : [];
      setExpenses(data);
    } catch (err) {
      console.error("Failed to fetch expenses:", err);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  // Filtered expenses based on all active filters
  const filteredExpenses = useMemo(() => {
    let data = [...expenses];

    if (filters.category !== "All") {
      data = data.filter((e) => e.category === filters.category);
    }

    if (filters.paymentMode !== "All") {
      data = data.filter((e) => e.paymentMode === filters.paymentMode);
    }

    if (filters.fromDate) {
      data = data.filter((e) => {
        const d = e.expenseDate || e.date;
        return d && new Date(d) >= new Date(filters.fromDate);
      });
    }

    if (filters.toDate) {
      data = data.filter((e) => {
        const d = e.expenseDate || e.date;
        return d && new Date(d) <= new Date(`${filters.toDate}T23:59:59`);
      });
    }

    return data;
  }, [expenses, filters]);

  // Group filtered expenses by category to show category totals
  const categoryGroups = useMemo(() => {
    const groups: Record<
      string,
      {
        total: number;
        items: any[];
      }
    > = {};

    filteredExpenses.forEach((item) => {
      const cat = item.category || "Other";
      if (!groups[cat]) {
        groups[cat] = { total: 0, items: [] };
      }
      groups[cat].total += Number(item.amount || 0);
      groups[cat].items.push(item);
    });

    return groups;
  }, [filteredExpenses]);

  // Toggle accordion expansion for a category
  const toggleCategory = (catName: string) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [catName]: !prev[catName],
    }));
  };

  // If user selects a specific category from the filter dropdown, auto-expand it
  useEffect(() => {
    if (filters.category !== "All") {
      setExpandedCategories({ [filters.category]: true });
    }
  }, [filters.category]);

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    if (!form.title.trim()) {
      alert("Please enter a title");
      return;
    }
    if (!form.amount || isNaN(Number(form.amount)) || Number(form.amount) <= 0) {
      alert("Please enter a valid amount");
      return;
    }

    try {
      setSubmitting(true);
      await axios.post(API_URL, {
        title: form.title.trim(),
        category: form.category,
        amount: Number(form.amount),
        paymentMode: form.paymentMode,
        notes: form.notes.trim(),
        date: new Date().toISOString(),
        expenseDate: new Date().toISOString(),
      });

      setForm({
        title: "",
        category: "Rent",
        amount: "",
        paymentMode: "Cash",
        notes: "",
      });

      await fetchExpenses();
    } catch (err: any) {
      console.error("Failed to add expense:", err);
      alert(err.response?.data?.message || "Failed to add expense. Please check your connection.");
    } finally {
      setSubmitting(false);
    }
  };

  const deleteExpense = async (id: string) => {
    if (!id) return;
    if (!window.confirm("Are you sure you want to delete this expense?")) return;
    try {
      await axios.delete(`${API_URL}/${id}`);
      await fetchExpenses();
    } catch (err: any) {
      console.error("Failed to delete expense:", err);
      alert(err.response?.data?.message || "Failed to delete expense");
    }
  };

  const totalAmount = filteredExpenses.reduce(
    (sum, e) => sum + Number(e.amount || 0),
    0
  );

  const categoryNames = Object.keys(categoryGroups);

  // All available categories from filtered data
  const availableCategories = Object.keys(categoryGroups);

  // Toggle category selection in download modal
  const toggleDownloadCategory = (cat: string) => {
    if (cat === "All") {
      setDownloadCategories(["All"]);
      return;
    }
    setDownloadCategories((prev) => {
      const withoutAll = prev.filter((c) => c !== "All");
      if (withoutAll.includes(cat)) {
        const next = withoutAll.filter((c) => c !== cat);
        return next.length === 0 ? ["All"] : next;
      } else {
        const next = [...withoutAll, cat];
        return next.length === availableCategories.length ? ["All"] : next;
      }
    });
  };

  // Get expenses for download based on selected categories
  const getDownloadExpenses = () => {
    if (downloadCategories.includes("All")) return filteredExpenses;
    return filteredExpenses.filter((e) => downloadCategories.includes(e.category || "Other"));
  };

  // Download as CSV
  const downloadCSV = () => {
    const data = getDownloadExpenses();
    const headers = ["Title", "Category", "Amount (₹)", "Payment Mode", "Date", "Notes"];
    const rows = data.map((e) => [
      `"${(e.title || "").replace(/"/g, '""')}"`,
      `"${e.category || ""}"`,
      e.amount || 0,
      `"${e.paymentMode || ""}"`,
      e.expenseDate || e.date ? new Date(e.expenseDate || e.date).toLocaleDateString("en-IN") : "-",
      `"${(e.notes || e.description || "").replace(/"/g, '""')}"`,
    ]);

    // Summary rows
    const categorySummary = downloadCategories.includes("All") ? availableCategories : downloadCategories;
    const summaryRows = [
      [],
      ["=== CATEGORY SUMMARY ==="],
      ["Category", "Total (₹)", "Count"],
      ...categorySummary.map((cat) => {
        const group = categoryGroups[cat];
        return [cat, group ? group.total : 0, group ? group.items.length : 0];
      }),
      [],
      ["GRAND TOTAL", data.reduce((s, e) => s + Number(e.amount || 0), 0), data.length],
    ];

    const csvContent =
      [headers, ...rows, ...summaryRows]
        .map((r) => r.join(","))
        .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `expenses_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    setShowDownloadModal(false);
  };

  // Download as PDF (using print)
  const downloadPDF = () => {
    const data = getDownloadExpenses();
    const categorySummary = downloadCategories.includes("All") ? availableCategories : downloadCategories;
    const grandTotal = data.reduce((s, e) => s + Number(e.amount || 0), 0);

    const summaryRows = categorySummary
      .map((cat) => {
        const group = categoryGroups[cat];
        const icon = CATEGORY_ICONS[cat] || "📁";
        return `<tr style="border-bottom:1px solid #fde68a">
          <td style="padding:8px 12px">${icon} ${cat}</td>
          <td style="padding:8px 12px;text-align:right;font-weight:bold;color:#d97706">₹${group ? group.total.toLocaleString("en-IN") : 0}</td>
          <td style="padding:8px 12px;text-align:center;color:#6b7280">${group ? group.items.length : 0}</td>
        </tr>`;
      })
      .join("");

    const detailRows = data
      .map((e) => {
        const expDate = e.expenseDate || e.date;
        return `<tr style="border-bottom:1px solid #f3f4f6">
          <td style="padding:6px 10px">${e.title || "-"}</td>
          <td style="padding:6px 10px;text-align:center">${e.category || "-"}</td>
          <td style="padding:6px 10px;text-align:right;font-weight:600;color:#d97706">₹${Number(e.amount || 0).toLocaleString("en-IN")}</td>
          <td style="padding:6px 10px;text-align:center">${e.paymentMode || "-"}</td>
          <td style="padding:6px 10px;text-align:center">${expDate ? new Date(expDate).toLocaleDateString("en-IN") : "-"}</td>
          <td style="padding:6px 10px;color:#6b7280;font-size:12px">${e.notes || e.description || "-"}</td>
        </tr>`;
      })
      .join("");

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>Expense Report</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 32px; color: #1f2937; }
    h1 { color: #d97706; margin-bottom: 4px; }
    .subtitle { color: #6b7280; font-size: 13px; margin-bottom: 24px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 28px; }
    th { background: #fef3c7; padding: 10px 12px; text-align: left; font-size: 13px; }
    .grand-total { background: #fef3c7; font-weight: bold; }
    @media print { body { padding: 16px; } }
  </style>
</head>
<body>
  <h1>💰 Expense Report</h1>
  <div class="subtitle">Generated on ${new Date().toLocaleDateString("en-IN", { dateStyle: "long" })} • ${downloadCategories.includes("All") ? "All Categories" : downloadCategories.join(", ")}</div>

  <h2 style="color:#92400e;font-size:16px;margin-bottom:8px">Category Summary</h2>
  <table>
    <thead><tr><th>Category</th><th style="text-align:right">Total Amount</th><th style="text-align:center">Count</th></tr></thead>
    <tbody>
      ${summaryRows}
      <tr class="grand-total">
        <td style="padding:10px 12px">GRAND TOTAL</td>
        <td style="padding:10px 12px;text-align:right;color:#d97706">₹${grandTotal.toLocaleString("en-IN")}</td>
        <td style="padding:10px 12px;text-align:center">${data.length} expenses</td>
      </tr>
    </tbody>
  </table>

  <h2 style="color:#92400e;font-size:16px;margin-bottom:8px">Individual Expenses</h2>
  <table>
    <thead><tr><th>Title</th><th style="text-align:center">Category</th><th style="text-align:right">Amount</th><th style="text-align:center">Payment</th><th style="text-align:center">Date</th><th>Notes</th></tr></thead>
    <tbody>${detailRows}</tbody>
  </table>
</body>
</html>`;

    const win = window.open("", "_blank");
    if (win) {
      win.document.write(html);
      win.document.close();
      win.focus();
      setTimeout(() => { win.print(); }, 400);
    }
    setShowDownloadModal(false);
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
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
            <option value="All">All</option>
            <option value="Rent">Rent</option>
            <option value="Salary">Salary</option>
            <option value="Electricity">Electricity</option>
            <option value="Maintenance">Maintenance</option>
            <option value="Marketing">Marketing</option>
            <option value="Equipment">Equipment</option>
            <option value="Other">Other</option>
          </select>

          <select
            className="border rounded p-2"
            value={filters.paymentMode}
            onChange={(e) =>
              setFilters({ ...filters, paymentMode: e.target.value })
            }
          >
            <option value="All">All</option>
            <option value="Cash">Cash</option>
            <option value="UPI">UPI</option>
            <option value="Card">Card</option>
            <option value="Bank Transfer">Bank Transfer</option>
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
            className="bg-yellow-500 text-white rounded hover:bg-yellow-600 py-2 font-medium"
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
          <option value="Rent">Rent</option>
          <option value="Salary">Salary</option>
          <option value="Electricity">Electricity</option>
          <option value="Maintenance">Maintenance</option>
          <option value="Marketing">Marketing</option>
          <option value="Equipment">Equipment</option>
          <option value="Other">Other</option>
        </select>

        <input
          type="number"
          step="any"
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
          <option value="Cash">Cash</option>
          <option value="UPI">UPI</option>
          <option value="Card">Card</option>
          <option value="Bank Transfer">Bank Transfer</option>
        </select>

        <button
          type="submit"
          disabled={submitting}
          className="bg-yellow-500 text-white rounded flex items-center justify-center gap-2 hover:bg-yellow-600 disabled:opacity-50 py-2 font-medium"
        >
          <PlusCircle size={18} /> {submitting ? "Adding..." : "Add"}
        </button>

        <textarea
          className="border rounded p-2 md:col-span-5"
          placeholder="Notes"
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
        />
      </form>

      {/* 📊 Summary Banner & View Toggle */}
      <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 font-semibold text-yellow-800">
        <div className="flex items-center gap-2">
          <span>Total Expense: ₹ {totalAmount.toLocaleString("en-IN")}</span>
          {filters.category !== "All" && (
            <span className="text-xs bg-yellow-200 text-yellow-900 px-2 py-0.5 rounded-full font-normal">
              Filtered by: <b>{filters.category}</b>
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 text-xs font-normal">
          <span className="text-gray-600">View:</span>
          <button
            type="button"
            onClick={() => setViewMode("grouped")}
            className={`px-2.5 py-1 rounded font-medium flex items-center gap-1 transition ${
              viewMode === "grouped"
                ? "bg-yellow-500 text-white shadow-xs"
                : "bg-white text-gray-700 hover:bg-yellow-100 border border-yellow-200"
            }`}
          >
            <Layers size={13} />
            <span>By Category Totals</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode("flat")}
            className={`px-2.5 py-1 rounded font-medium flex items-center gap-1 transition ${
              viewMode === "flat"
                ? "bg-yellow-500 text-white shadow-xs"
                : "bg-white text-gray-700 hover:bg-yellow-100 border border-yellow-200"
            }`}
          >
            <List size={13} />
            <span>All Expenses</span>
          </button>

          {/* ⬇️ Download Button */}
          <button
            type="button"
            onClick={() => {
              setDownloadCategories(["All"]);
              setShowDownloadModal(true);
            }}
            className="px-2.5 py-1 rounded font-medium flex items-center gap-1 transition bg-green-500 text-white hover:bg-green-600 shadow-sm ml-1"
          >
            <Download size={13} />
            <span>Download</span>
          </button>
        </div>
      </div>

      {/* ⬇️ Download Modal */}
      {showDownloadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-yellow-400 to-yellow-500 px-6 py-4 flex items-center justify-between">
              <div>
                <h3 className="text-white font-bold text-lg flex items-center gap-2">
                  <Download size={18} /> Download Expense Report
                </h3>
                <p className="text-yellow-100 text-xs mt-0.5">Select categories to include in the report</p>
              </div>
              <button
                onClick={() => setShowDownloadModal(false)}
                className="text-white hover:bg-white/20 rounded-full p-1 transition"
              >
                <X size={20} />
              </button>
            </div>

            {/* Category Selection */}
            <div className="px-6 py-4 space-y-3">
              <p className="text-sm font-semibold text-gray-700 mb-2">Choose Categories:</p>

              {/* All option */}
              <label className="flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition hover:bg-yellow-50"
                style={{ borderColor: downloadCategories.includes("All") ? "#f59e0b" : "#e5e7eb",
                         background: downloadCategories.includes("All") ? "#fffbeb" : "white" }}>
                <input
                  type="checkbox"
                  checked={downloadCategories.includes("All")}
                  onChange={() => toggleDownloadCategory("All")}
                  className="accent-yellow-500 w-4 h-4"
                />
                <span className="text-lg">📊</span>
                <div className="flex-1">
                  <span className="font-semibold text-gray-800">All Categories</span>
                  <span className="text-xs text-gray-500 block">{filteredExpenses.length} expenses • ₹{totalAmount.toLocaleString("en-IN")}</span>
                </div>
              </label>

              {/* Individual categories */}
              <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                {availableCategories.length === 0 ? (
                  <p className="text-gray-400 text-sm text-center py-4">No expenses available</p>
                ) : (
                  availableCategories.map((cat) => {
                    const group = categoryGroups[cat];
                    const icon = CATEGORY_ICONS[cat] || "📁";
                    const isChecked = downloadCategories.includes("All") || downloadCategories.includes(cat);
                    return (
                      <label
                        key={cat}
                        className="flex items-center gap-3 p-2.5 rounded-lg border cursor-pointer transition hover:bg-yellow-50"
                        style={{ borderColor: isChecked ? "#fcd34d" : "#e5e7eb",
                                 background: isChecked ? "#fffde7" : "white" }}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleDownloadCategory(cat)}
                          className="accent-yellow-500 w-4 h-4"
                        />
                        <span className="text-base">{icon}</span>
                        <div className="flex-1">
                          <span className="font-medium text-gray-800 text-sm">{cat}</span>
                          <span className="text-xs text-gray-500 block">
                            {group.items.length} {group.items.length === 1 ? "expense" : "expenses"} • ₹{group.total.toLocaleString("en-IN")}
                          </span>
                        </div>
                      </label>
                    );
                  })
                )}
              </div>

              {/* Selected summary */}
              {!downloadCategories.includes("All") && downloadCategories.length > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm">
                  <span className="font-semibold text-yellow-800">
                    Selected: {downloadCategories.join(", ")}
                  </span>
                  <span className="text-yellow-700 block mt-0.5">
                    {getDownloadExpenses().length} expenses • ₹{getDownloadExpenses().reduce((s, e) => s + Number(e.amount || 0), 0).toLocaleString("en-IN")}
                  </span>
                </div>
              )}
            </div>

            {/* Download Buttons */}
            <div className="px-6 pb-6 flex gap-3">
              <button
                onClick={downloadCSV}
                disabled={availableCategories.length === 0}
                className="flex-1 flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white font-semibold py-2.5 rounded-lg transition disabled:opacity-50"
              >
                <Table2 size={16} />
                Download CSV
              </button>
              <button
                onClick={downloadPDF}
                disabled={availableCategories.length === 0}
                className="flex-1 flex items-center justify-center gap-2 bg-yellow-500 hover:bg-yellow-600 text-white font-semibold py-2.5 rounded-lg transition disabled:opacity-50"
              >
                <FileText size={16} />
                Download PDF
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 📋 TABLE (Shows category total first -> click category to show individual expenses) */}
      <div className="bg-white rounded-lg shadow overflow-x-auto">
        {viewMode === "grouped" ? (
          /* 📂 CATEGORY TOTALS VIEW (Click row to expand individual expenses) */
          <table className="w-full text-sm">
            <thead className="bg-yellow-100">
              <tr>
                <th className="p-3 text-left w-12"></th>
                <th className="p-3 text-left">Category</th>
                <th className="p-3 text-center">Total Expense</th>
                <th className="p-3 text-center">Count</th>
                <th className="p-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {categoryNames.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-6 text-gray-400">
                    No expenses found.
                  </td>
                </tr>
              ) : (
                categoryNames.map((catName) => {
                  const group = categoryGroups[catName];
                  const isExpanded = !!expandedCategories[catName];
                  const icon = CATEGORY_ICONS[catName] || "📁";

                  return (
                    <tr key={catName} className="border-t">
                      <td colSpan={5} className="p-0">
                        {/* 🟡 Category Summary Row (Clickable) */}
                        <div
                          onClick={() => toggleCategory(catName)}
                          className="flex items-center justify-between p-3.5 hover:bg-yellow-50/80 cursor-pointer transition select-none bg-white"
                        >
                          <div className="flex items-center gap-3">
                            <button
                              type="button"
                              className="text-yellow-600 hover:text-yellow-700 p-0.5 rounded transition"
                              aria-label="Toggle"
                            >
                              {isExpanded ? (
                                <ChevronDown size={20} className="text-yellow-600 font-bold" />
                              ) : (
                                <ChevronRight size={20} className="text-gray-400" />
                              )}
                            </button>
                            <span className="text-xl">{icon}</span>
                            <span className="font-bold text-gray-900 text-base">
                              {catName}
                            </span>
                          </div>

                          <div className="flex items-center gap-6 sm:gap-12">
                            <div className="text-center">
                              <span className="text-xs text-gray-400 block font-normal sm:hidden">Total</span>
                              <span className="font-bold text-yellow-600 text-base">
                                ₹{group.total}
                              </span>
                            </div>

                            <div className="text-center min-w-[70px]">
                              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-yellow-100 text-yellow-800">
                                {group.items.length} {group.items.length === 1 ? "expense" : "expenses"}
                              </span>
                            </div>

                            <div className="text-xs font-medium text-yellow-600 hover:text-yellow-800 flex items-center gap-1">
                              <span>{isExpanded ? "Hide Details" : "Show Details"}</span>
                            </div>
                          </div>
                        </div>

                        {/* 🔽 EXPANDED INDIVIDUAL EXPENSES FOR THIS CATEGORY */}
                        {isExpanded && (
                          <div className="bg-yellow-50/40 px-4 py-3 border-t border-b border-yellow-100">
                            <table className="w-full text-sm bg-white rounded border border-yellow-200 overflow-hidden shadow-xs">
                              <thead className="bg-yellow-100/70 text-gray-700 font-semibold text-xs">
                                <tr>
                                  <th className="p-2.5 text-left">Title</th>
                                  <th className="p-2.5 text-center">Category</th>
                                  <th className="p-2.5 text-center">Amount</th>
                                  <th className="p-2.5 text-center">Payment</th>
                                  <th className="p-2.5 text-center">Date</th>
                                  <th className="p-2.5 text-left">Notes</th>
                                  <th className="p-2.5 text-center">Action</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-100">
                                {group.items.map((exp) => {
                                  const expId = exp.id || exp._id;
                                  const expDate = exp.expenseDate || exp.date;

                                  return (
                                    <tr key={expId} className="hover:bg-yellow-50/60">
                                      <td className="p-2.5 font-medium text-gray-800">
                                        {exp.title || "-"}
                                      </td>
                                      <td className="p-2.5 text-center text-gray-600">
                                        {exp.category}
                                      </td>
                                      <td className="p-2.5 text-center font-bold text-yellow-600">
                                        ₹{exp.amount}
                                      </td>
                                      <td className="p-2.5 text-center text-gray-600">
                                        {exp.paymentMode || "-"}
                                      </td>
                                      <td className="p-2.5 text-center text-gray-600">
                                        {expDate
                                          ? new Date(expDate).toLocaleDateString("en-IN")
                                          : "-"}
                                      </td>
                                      <td className="p-2.5 text-left text-gray-500 text-xs">
                                        {exp.notes || exp.description || "-"}
                                      </td>
                                      <td className="p-2.5 text-center">
                                        <button
                                          type="button"
                                          onClick={() => deleteExpense(expId)}
                                          className="text-red-500 hover:text-red-700 transition p-1"
                                          title="Delete Expense"
                                        >
                                          <Trash2 size={16} />
                                        </button>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        ) : (
          /* 📋 STANDARD ALL EXPENSES FLAT TABLE */
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
              {filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-6 text-gray-400">
                    No expenses found.
                  </td>
                </tr>
              ) : (
                filteredExpenses.map((exp) => {
                  const expId = exp.id || exp._id;
                  const expDate = exp.expenseDate || exp.date;

                  return (
                    <tr key={expId} className="border-t hover:bg-yellow-50">
                      <td className="p-2 font-medium">{exp.title || "-"}</td>
                      <td className="p-2 text-center">{exp.category}</td>
                      <td className="p-2 text-center font-bold text-yellow-600">
                        ₹{exp.amount}
                      </td>
                      <td className="p-2 text-center">{exp.paymentMode || "-"}</td>
                      <td className="p-2 text-center">
                        {expDate ? new Date(expDate).toLocaleDateString("en-IN") : "-"}
                      </td>
                      <td className="p-2 text-center">
                        <button
                          type="button"
                          onClick={() => deleteExpense(expId)}
                          className="text-red-500 hover:text-red-700 transition"
                          title="Delete Expense"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
