import { useState, useEffect, ChangeEvent, FormEvent } from "react";
import axios from "axios";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { API_URI } from "../api/api";
import {
  UserCircle,
  FileText,
  PlusCircle,
  Download,
  Trash2,
  X,
  ChevronDown,
} from "lucide-react";

interface Trainer {
  id?: string;
  name: string;
  contactNumber: string;
  email: string;
  specialization?: string;
  experience: string;
}

interface Payslip {
  id: string;
  trainerName: string;
  month: string;
  year: string;
  basicSalary: number;
  allowances: number;
  deductions: number;
  netSalary: number;
  paymentMode: string;
  notes: string;
  createdAt: string;
}

const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 5 }, (_, i) => String(CURRENT_YEAR - i));

const emptyPayslip = {
  trainerName: "",
  month: MONTHS[new Date().getMonth()],
  year: String(CURRENT_YEAR),
  basicSalary: "",
  allowances: "",
  deductions: "",
  paymentMode: "Cash",
  notes: "",
};

export default function TrainerPage() {
  const [activeTab, setActiveTab] = useState<"trainers" | "payslips">("trainers");

  // ── Trainers ──────────────────────────────────────────────
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [formData, setFormData] = useState<Trainer>({
    name: "",
    contactNumber: "",
    email: "",
    specialization: "",
    experience: "",
  });
  const [editTrainer, setEditTrainer] = useState<Trainer | null>(null);
  const [trainerMsg, setTrainerMsg] = useState("");

  // ── Payslips ──────────────────────────────────────────────
  const [payslips, setPayslips] = useState<Payslip[]>([]);
  const [payslipForm, setPayslipForm] = useState(emptyPayslip);
  const [payslipMsg, setPayslipMsg] = useState("");
  const [showPayslipForm, setShowPayslipForm] = useState(false);
  const [filterTrainer, setFilterTrainer] = useState("All");
  const [filterMonth, setFilterMonth] = useState("All");
  const [filterYear, setFilterYear] = useState("All");

  // ─────────────────────────────────────────────────────────
  const fetchTrainers = async () => {
    try {
      const res = await axios.get<Trainer[]>(`${API_URI}/trainers`);
      setTrainers(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error(err);
      setTrainers([]);
    }
  };

  const fetchPayslips = async () => {
    try {
      const res = await axios.get<Payslip[]>(`${API_URI}/trainer-payslips`);
      setPayslips(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error(err);
      setPayslips([]);
    }
  };

  useEffect(() => {
    fetchTrainers();
    fetchPayslips();
  }, []);

  // ── Trainer handlers ────────────────────────────────────
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleEditChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (!editTrainer) return;
    const { name, value } = e.target;
    setEditTrainer({ ...editTrainer, [name]: value });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URI}/trainers`, formData);
      setTrainerMsg("Trainer added successfully!");
      setFormData({ name: "", contactNumber: "", email: "", specialization: "", experience: "" });
      fetchTrainers();
      setTimeout(() => setTrainerMsg(""), 3000);
    } catch (err) {
      console.error(err);
      setTrainerMsg("Failed to add trainer.");
    }
  };

  const handleUpdate = async (e: FormEvent) => {
    e.preventDefault();
    if (!editTrainer?.id) return;
    try {
      await axios.put(`${API_URI}/trainers/${editTrainer.id}`, editTrainer);
      setTrainerMsg("Trainer updated successfully!");
      setEditTrainer(null);
      fetchTrainers();
      setTimeout(() => setTrainerMsg(""), 3000);
    } catch (err) {
      console.error(err);
      setTrainerMsg("Failed to update trainer.");
    }
  };

  const handleDelete = async (id: string | undefined) => {
    if (!id) return;
    if (!window.confirm("Are you sure you want to delete this trainer?")) return;
    try {
      await axios.delete(`${API_URI}/trainers/${id}`);
      setTrainerMsg("Trainer deleted successfully!");
      fetchTrainers();
      setTimeout(() => setTrainerMsg(""), 3000);
    } catch (err) {
      console.error(err);
      setTrainerMsg("Failed to delete trainer.");
    }
  };

  // ── Payslip handlers ────────────────────────────────────
  const handlePayslipChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setPayslipForm((prev) => ({ ...prev, [name]: value }));
  };

  const getNetSalary = () => {
    const basic = parseFloat(payslipForm.basicSalary) || 0;
    const allow = parseFloat(payslipForm.allowances) || 0;
    const ded = parseFloat(payslipForm.deductions) || 0;
    return basic + allow - ded;
  };

  const handlePayslipSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!payslipForm.trainerName) {
      setPayslipMsg("Please select a trainer.");
      return;
    }
    try {
      await axios.post(`${API_URI}/trainer-payslips`, {
        ...payslipForm,
        netSalary: getNetSalary(),
      });
      setPayslipMsg("Payslip saved successfully!");
      setPayslipForm(emptyPayslip);
      setShowPayslipForm(false);
      fetchPayslips();
      setTimeout(() => setPayslipMsg(""), 3000);
    } catch (err) {
      console.error(err);
      setPayslipMsg("Failed to save payslip.");
    }
  };

  const handleDeletePayslip = async (id: string) => {
    if (!window.confirm("Delete this payslip?")) return;
    try {
      await axios.delete(`${API_URI}/trainer-payslips/${id}`);
      fetchPayslips();
    } catch (err) {
      console.error(err);
    }
  };

  // ── PDF Download ────────────────────────────────────────
  const downloadPayslipPDF = (p: Payslip) => {
    const doc = new jsPDF();

    // Header bar (taller to fit address)
    doc.setFillColor(234, 179, 8);
    doc.rect(0, 0, 210, 40, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text("SALARY PAYSLIP", 105, 12, { align: "center" });
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Elite Fitness Kovilpatti", 105, 22, { align: "center" });
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text("Nagajothi Campus, Ilayarasanendal Road, (Opp. EB Office), Nadarajapuram, Kovilpatti, TN - 628502", 105, 29, { align: "center" });
    doc.text("Phone: +91 87782 85877  |  Email: elitefitnesskvp@gmail.com", 105, 35, { align: "center" });


    // Reset
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("Trainer Details", 14, 52);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);

    const details: [string, string][] = [
      ["Trainer Name", p.trainerName],
      ["Pay Period", `${p.month} ${p.year}`],
      ["Payment Mode", p.paymentMode],
      ["Payslip Date", new Date(p.createdAt).toLocaleDateString("en-IN")],
    ];

    details.forEach(([label, val], i) => {
      const y = 62 + i * 8;
      doc.setFont("helvetica", "bold");
      doc.text(`${label}:`, 14, y);
      doc.setFont("helvetica", "normal");
      doc.text(val, 75, y);

    });

    autoTable(doc, {
      startY: 92,
      head: [["Description", "Amount (₹)"]],
      body: [
        ["Basic Salary", `Rs. ${p.basicSalary.toFixed(2)}`],
        ["PT Share", `Rs. ${p.allowances.toFixed(2)}`],
        ["Deductions", `- Rs. ${p.deductions.toFixed(2)}`],
      ],
      headStyles: { fillColor: [234, 179, 8], textColor: [255, 255, 255], fontStyle: "bold" },
      alternateRowStyles: { fillColor: [254, 249, 195] },
      styles: { fontSize: 10 },
      columnStyles: { 1: { halign: "right" } },
    });

    const finalY = (doc as any).lastAutoTable.finalY || 130;

    doc.setFillColor(234, 179, 8);
    doc.roundedRect(14, finalY + 6, 182, 16, 3, 3, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("NET SALARY", 24, finalY + 17);
    doc.text(`Rs. ${p.netSalary.toFixed(2)}`, 186, finalY + 17, { align: "right" });

    if (p.notes) {
      doc.setTextColor(0, 0, 0);
      doc.setFont("helvetica", "italic");
      doc.setFontSize(9);
      doc.text(`Notes: ${p.notes}`, 14, finalY + 30);
    }

    doc.setTextColor(150, 150, 150);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text("Generated by Gym Management System", 105, 285, { align: "center" });

    doc.save(`Payslip_${p.trainerName}_${p.month}_${p.year}.pdf`);
  };

  // ── Filtered payslips ───────────────────────────────────
  const filteredPayslips = payslips.filter((p) => {
    const matchTrainer = filterTrainer === "All" || p.trainerName === filterTrainer;
    const matchMonth = filterMonth === "All" || p.month === filterMonth;
    const matchYear = filterYear === "All" || p.year === filterYear;
    return matchTrainer && matchMonth && matchYear;
  });

  const uniqueTrainerNames = [...new Set(trainers.map((t) => t.name))];

  return (
    <div className="p-4 md:p-6 w-full text-sm">
      {/* Page Header */}
      <h2 className="text-xl md:text-2xl font-semibold mb-4 text-yellow-600 flex items-center gap-2">
        <UserCircle size={26} /> Trainer Management
      </h2>

      {/* Tab Switcher */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab("trainers")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition text-sm ${
            activeTab === "trainers"
              ? "bg-yellow-500 text-white shadow"
              : "bg-white border border-yellow-300 text-yellow-700 hover:bg-yellow-50"
          }`}
        >
          <UserCircle size={16} /> Trainers
        </button>
        <button
          onClick={() => setActiveTab("payslips")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition text-sm ${
            activeTab === "payslips"
              ? "bg-yellow-500 text-white shadow"
              : "bg-white border border-yellow-300 text-yellow-700 hover:bg-yellow-50"
          }`}
        >
          <FileText size={16} /> Payslips
        </button>
      </div>

      {/* ══════════ TRAINERS TAB ══════════ */}
      {activeTab === "trainers" && (
        <>
          {trainerMsg && (
            <p className="mb-4 text-green-600 font-medium">{trainerMsg}</p>
          )}

          {/* Add Trainer Form */}
          <form
            onSubmit={handleSubmit}
            className="bg-white p-4 md:p-6 rounded-2xl mb-6 shadow-md border border-yellow-300"
          >
            <h3 className="text-lg md:text-xl font-bold mb-4 text-yellow-600">
              Add Trainer
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <input
                className="p-2 border rounded w-full"
                placeholder="Name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
              />
              <input
                className="p-2 border rounded w-full"
                placeholder="Contact Number"
                name="contactNumber"
                value={formData.contactNumber}
                onChange={handleChange}
              />
              <input
                className="p-2 border rounded w-full"
                placeholder="Email"
                name="email"
                value={formData.email}
                onChange={handleChange}
              />
              <input
                className="p-2 border rounded w-full"
                placeholder="Specialization"
                name="specialization"
                value={formData.specialization}
                onChange={handleChange}
              />
              <input
                className="p-2 border rounded w-full"
                placeholder="Experience (e.g. 3 years)"
                name="experience"
                value={formData.experience}
                onChange={handleChange}
              />
            </div>
            <button
              type="submit"
              className="mt-4 w-full md:w-auto bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600 transition"
            >
              Add Trainer
            </button>
          </form>

          {/* Trainer Table */}
          <div className="w-full overflow-x-auto">
            <table className="min-w-[700px] w-full border border-gray-200 text-xs md:text-sm">
              <thead className="bg-yellow-100 text-yellow-800">
                <tr>
                  <th className="p-2 border">Name</th>
                  <th className="p-2 border">Contact</th>
                  <th className="p-2 border">Email</th>
                  <th className="p-2 border">Specialization</th>
                  <th className="p-2 border">Experience</th>
                  <th className="p-2 border">Action</th>
                </tr>
              </thead>
              <tbody>
                {trainers.map((t) => (
                  <tr key={t.id} className="text-center hover:bg-yellow-50">
                    <td className="p-2 border">{t.name}</td>
                    <td className="p-2 border">{t.contactNumber}</td>
                    <td className="p-2 border">{t.email}</td>
                    <td className="p-2 border">{t.specialization}</td>
                    <td className="p-2 border">{t.experience}</td>
                    <td className="p-2 border">
                      <div className="flex flex-col md:flex-row gap-2 justify-center">
                        <button
                          onClick={() => {
                            setEditTrainer({ ...t });
                            setTrainerMsg("");
                          }}
                          className="bg-yellow-400 text-white px-3 py-1 rounded w-full md:w-auto hover:bg-yellow-500 transition"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(t.id)}
                          className="bg-red-500 text-white px-3 py-1 rounded w-full md:w-auto hover:bg-red-600 transition"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Edit Modal */}
          {editTrainer && (
            <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
              <div className="bg-white p-4 md:p-6 rounded-2xl w-full max-w-md shadow-lg border-2 border-yellow-400">
                <h3 className="text-lg md:text-xl font-bold mb-4 text-yellow-600">
                  Edit Trainer
                </h3>
                <form onSubmit={handleUpdate}>
                  <div className="grid gap-4">
                    <input
                      className="p-2 border rounded w-full"
                      placeholder="Name"
                      name="name"
                      value={editTrainer.name}
                      onChange={handleEditChange}
                      required
                    />
                    <input
                      className="p-2 border rounded w-full"
                      placeholder="Contact"
                      name="contactNumber"
                      value={editTrainer.contactNumber}
                      onChange={handleEditChange}
                    />
                    <input
                      className="p-2 border rounded w-full"
                      placeholder="Email"
                      name="email"
                      value={editTrainer.email}
                      onChange={handleEditChange}
                    />
                    <input
                      className="p-2 border rounded w-full"
                      placeholder="Specialization"
                      name="specialization"
                      value={editTrainer.specialization || ""}
                      onChange={handleEditChange}
                    />
                    <input
                      className="p-2 border rounded w-full"
                      placeholder="Experience"
                      name="experience"
                      value={editTrainer.experience}
                      onChange={handleEditChange}
                    />
                  </div>
                  <div className="flex flex-col md:flex-row justify-end gap-2 mt-4">
                    <button
                      type="button"
                      onClick={() => setEditTrainer(null)}
                      className="w-full md:w-auto bg-gray-300 px-4 py-2 rounded hover:bg-gray-400 transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="w-full md:w-auto bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600 transition"
                    >
                      Save
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </>
      )}

      {/* ══════════ PAYSLIPS TAB ══════════ */}
      {activeTab === "payslips" && (
        <>
          {payslipMsg && (
            <p className="mb-4 text-green-600 font-medium">{payslipMsg}</p>
          )}

          {/* Action Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <h3 className="text-lg font-bold text-yellow-700 flex items-center gap-2">
              <FileText size={20} /> Payslip Records
            </h3>
            <button
              onClick={() => setShowPayslipForm(true)}
              className="flex items-center gap-2 bg-yellow-500 text-white px-4 py-2 rounded-xl hover:bg-yellow-600 transition shadow text-sm font-medium"
            >
              <PlusCircle size={16} /> Add Payslip
            </button>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-xl border border-yellow-200 p-3 mb-4 flex flex-wrap gap-3 items-center">
            <div className="relative">
              <select
                value={filterTrainer}
                onChange={(e) => setFilterTrainer(e.target.value)}
                className="pl-3 pr-8 py-2 border border-gray-200 rounded-lg text-sm appearance-none bg-white"
              >
                <option value="All">All Trainers</option>
                {uniqueTrainerNames.map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-2 top-3 text-gray-400 pointer-events-none" />
            </div>
            <div className="relative">
              <select
                value={filterMonth}
                onChange={(e) => setFilterMonth(e.target.value)}
                className="pl-3 pr-8 py-2 border border-gray-200 rounded-lg text-sm appearance-none bg-white"
              >
                <option value="All">All Months</option>
                {MONTHS.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
              <ChevronDown size={14} className="absolute right-2 top-3 text-gray-400 pointer-events-none" />
            </div>
            <div className="relative">
              <select
                value={filterYear}
                onChange={(e) => setFilterYear(e.target.value)}
                className="pl-3 pr-8 py-2 border border-gray-200 rounded-lg text-sm appearance-none bg-white"
              >
                <option value="All">All Years</option>
                {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
              <ChevronDown size={14} className="absolute right-2 top-3 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* Payslips Table */}
          <div className="w-full overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
            <table className="min-w-[800px] w-full text-xs md:text-sm">
              <thead className="bg-yellow-100 text-yellow-800">
                <tr>
                  <th className="p-2 border text-left">Trainer</th>
                  <th className="p-2 border">Month</th>
                  <th className="p-2 border">Year</th>
                  <th className="p-2 border">Basic (Rs.)</th>
                  <th className="p-2 border">PT Share (Rs.)</th>
                  <th className="p-2 border">Deductions (Rs.)</th>
                  <th className="p-2 border font-bold">Net Salary (Rs.)</th>
                  <th className="p-2 border">Mode</th>
                  <th className="p-2 border">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPayslips.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="text-center py-8 text-gray-400">
                      No payslips found. Click "Add Payslip" to create one.
                    </td>
                  </tr>
                ) : (
                  filteredPayslips.map((p) => (
                    <tr key={p.id} className="hover:bg-yellow-50 text-center">
                      <td className="p-2 border text-left font-medium">{p.trainerName}</td>
                      <td className="p-2 border">{p.month}</td>
                      <td className="p-2 border">{p.year}</td>
                      <td className="p-2 border">Rs.{p.basicSalary.toFixed(2)}</td>
                      <td className="p-2 border text-green-600">+Rs.{p.allowances.toFixed(2)}</td>
                      <td className="p-2 border text-red-500">-Rs.{p.deductions.toFixed(2)}</td>
                      <td className="p-2 border font-bold text-yellow-700">
                        Rs.{p.netSalary.toFixed(2)}
                      </td>
                      <td className="p-2 border">{p.paymentMode}</td>
                      <td className="p-2 border">
                        <div className="flex justify-center gap-2">
                          <button
                            onClick={() => downloadPayslipPDF(p)}
                            title="Download PDF"
                            className="flex items-center gap-1 bg-yellow-500 text-white px-2 py-1 rounded hover:bg-yellow-600 transition text-xs"
                          >
                            <Download size={12} /> PDF
                          </button>
                          <button
                            onClick={() => handleDeletePayslip(p.id)}
                            title="Delete"
                            className="flex items-center gap-1 bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600 transition text-xs"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ══════════ ADD PAYSLIP MODAL ══════════ */}
      {showPayslipForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border-2 border-yellow-400 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between bg-yellow-500 px-5 py-4 rounded-t-2xl">
              <h3 className="text-white font-bold text-lg flex items-center gap-2">
                <FileText size={20} /> Generate Payslip
              </h3>
              <button
                onClick={() => { setShowPayslipForm(false); setPayslipForm(emptyPayslip); }}
                className="text-white hover:text-yellow-100 transition"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handlePayslipSubmit} className="p-5 grid gap-4">
              {/* Trainer dropdown */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  Trainer Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    name="trainerName"
                    value={payslipForm.trainerName}
                    onChange={handlePayslipChange}
                    required
                    className="w-full p-2 border border-gray-300 rounded-lg appearance-none bg-white text-sm pr-8"
                  >
                    <option value="">-- Select Trainer --</option>
                    {trainers.map((t) => (
                      <option key={t.id} value={t.name}>{t.name}</option>
                    ))}
                  </select>
                  <ChevronDown size={14} className="absolute right-3 top-3 text-gray-400 pointer-events-none" />
                </div>
              </div>

              {/* Month & Year */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Month</label>
                  <div className="relative">
                    <select
                      name="month"
                      value={payslipForm.month}
                      onChange={handlePayslipChange}
                      className="w-full p-2 border border-gray-300 rounded-lg appearance-none bg-white text-sm pr-8"
                    >
                      {MONTHS.map((m) => <option key={m} value={m}>{m}</option>)}
                    </select>
                    <ChevronDown size={14} className="absolute right-3 top-3 text-gray-400 pointer-events-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Year</label>
                  <div className="relative">
                    <select
                      name="year"
                      value={payslipForm.year}
                      onChange={handlePayslipChange}
                      className="w-full p-2 border border-gray-300 rounded-lg appearance-none bg-white text-sm pr-8"
                    >
                      {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
                    </select>
                    <ChevronDown size={14} className="absolute right-3 top-3 text-gray-400 pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* Salary fields */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Basic Salary (Rs.)</label>
                  <input
                    type="number"
                    name="basicSalary"
                    value={payslipForm.basicSalary}
                    onChange={handlePayslipChange}
                    placeholder="0"
                    min="0"
                    className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-green-600 mb-1">PT Share (Rs.)</label>
                  <input
                    type="number"
                    name="allowances"
                    value={payslipForm.allowances}
                    onChange={handlePayslipChange}
                    placeholder="0"
                    min="0"
                    className="w-full p-2 border border-green-200 rounded-lg text-sm bg-green-50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-red-500 mb-1">Deductions (Rs.)</label>
                  <input
                    type="number"
                    name="deductions"
                    value={payslipForm.deductions}
                    onChange={handlePayslipChange}
                    placeholder="0"
                    min="0"
                    className="w-full p-2 border border-red-200 rounded-lg text-sm bg-red-50"
                  />
                </div>
              </div>

              {/* Net Salary Preview */}
              <div className="bg-yellow-50 border border-yellow-300 rounded-xl p-3 flex justify-between items-center">
                <span className="text-sm font-semibold text-gray-700">Net Salary</span>
                <span className="text-xl font-bold text-yellow-600">
                  Rs. {getNetSalary().toFixed(2)}
                </span>
              </div>

              {/* Payment Mode */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Payment Mode</label>
                <div className="relative">
                  <select
                    name="paymentMode"
                    value={payslipForm.paymentMode}
                    onChange={handlePayslipChange}
                    className="w-full p-2 border border-gray-300 rounded-lg appearance-none bg-white text-sm pr-8"
                  >
                    <option value="Cash">Cash</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="UPI">UPI</option>
                    <option value="Cheque">Cheque</option>
                  </select>
                  <ChevronDown size={14} className="absolute right-3 top-3 text-gray-400 pointer-events-none" />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Notes (optional)</label>
                <textarea
                  name="notes"
                  value={payslipForm.notes}
                  onChange={handlePayslipChange}
                  rows={2}
                  placeholder="Any additional notes..."
                  className="w-full p-2 border border-gray-300 rounded-lg text-sm resize-none"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowPayslipForm(false); setPayslipForm(emptyPayslip); }}
                  className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-xl hover:bg-gray-300 transition font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-yellow-500 text-white py-2 rounded-xl hover:bg-yellow-600 transition font-medium shadow"
                >
                  Save Payslip
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

