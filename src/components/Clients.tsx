import React, { useEffect, useState } from "react";
import axios from "axios";
async function getPDFModules() {
  const jsPDF = (await import('jspdf')).default;
  const autoTable = (await import('jspdf-autotable')).default;
  return { jsPDF, autoTable };
}
import { generateCurrentPackageBill } from "../components/BillGenerator";

import logo from  "../assets/logo.jpeg"
import { API_URI } from "../api/api";

interface GymBill {
  _id: string;
  memberId: string;
  client: string;
  contactNumber: string;
  alternateContact?: string;
  email: string;
  clientSource?: string;
  gender?: string;
  dateOfBirth?: string;
  anniversary?: string;
  profession?: string;
  taxId?: string;
  workoutHours?: string;
  areaAddress?: string;
  remarks?: string;

  package: string;
  joiningDate: string;
  endDate: string;

  price?: number;
  admissionCharges?: number;
  tax?: number;
  amountPayable?: number;
  amountPaid?: number;
  balance?: number;
  amount?: number;
  discountAmount?: number;

  initialPaymentMode?: string;
  paymentMethodDetail?: string;

  followupDate?: string;
  clientRep?: string;
  appointTrainer?: string;

  status: string;

  paymentHistory?: {
    amount: number;
    mode: string;
    note?: string;
    date: string;
  }[];

  balanceHistory?: {
    previousBalance: number;
    newBalance: number;
    change: number;
    reason: string;
    date: string;
  }[];

  renewalHistory?: any[];
}

interface Trainer {
  _id: string;
  name: string;
}

const Clients: React.FC = () => {
const [clients, setClients] = useState<GymBill[]>([]);
const [selectedClient, setSelectedClient] = useState<GymBill | null>(null);
const [selectedClients, setSelectedClients] = useState<string[]>([]);
const [filteredClients, setFilteredClients] = useState<GymBill[]>([]);
const [trainers, setTrainers] = useState<Trainer[]>([]);
const [editRenewData, setEditRenewData] = useState<any>(null);
const [editRenewId, setEditRenewId] = useState<string | null>(null);
const [editClientId, setEditClientId] = useState<string | null>(null);
const refreshSelectedClient = async (clientId: string) => {
  try {
    const res = await axios.get(`${API_URI}/gymbill/${clientId}`);
    setSelectedClient(res.data); // update modal data
  } catch (err) {
    console.error("Failed to refresh selected client", err);
  }
};

// ✅ Move filters here (before useEffect)
const [filters, setFilters] = useState({
  search: "",
  package: "",
  status: "",
  trainer: "",
  endDate: "",
  month: "", // ✅ added
});
const openRenewalEditModal = (renew: any, clientId: string) => {
  setEditRenewData({ ...renew });
  setEditRenewId(renew._id);
  setEditClientId(clientId);
};
const handleEditRenewSave = async () => {
  if (!editClientId || !editRenewId) return;

  try {
    await axios.put(
  `${API_URI}/gymbill/renew/edit/${editClientId}/${editRenewId}`,
  editRenewData
);

alert("Renewal updated successfully");

// Close popup
setEditRenewId(null);

// Refresh full list
fetchClients();

// 🔥 Refresh the currently opened client in View modal
if (selectedClient && selectedClient._id === editClientId) {
  refreshSelectedClient(editClientId);
}

  } catch (err) {
    console.error("❌ Renewal update failed:", err);
  }
};
const handleDeleteRenew = async (renewId: string, clientId: string) => {
  if (!window.confirm("Are you sure you want to delete this renewal?")) return;

  try {
    await axios.delete(
      `${API_URI}/gymbill/renew/delete/${clientId}/${renewId}`
    );

    alert("Renewal entry deleted");
    fetchClients(); // Refresh data
  } catch (err) {
    console.error("Delete failed", err);
    alert("Failed to delete");
  }
};


useEffect(() => {
  let filtered = [...clients];
  if (filters.search) {
    const term = filters.search.toLowerCase();
    filtered = filtered.filter(
      (c) =>
        c.client?.toLowerCase().includes(term) ||
        c.contactNumber?.includes(term)
    );
  }
  if (filters.package) filtered = filtered.filter((c) => c.package === filters.package);
  if (filters.status) filtered = filtered.filter((c) => c.status === filters.status);
  if (filters.trainer)
  filtered = filtered.filter((c) => c.appointTrainer === filters.trainer);
  if (filters.endDate)
    filtered = filtered.filter(
      (c) => new Date(c.endDate) <= new Date(filters.endDate)
    );

  // 👉 ✅ Add the below block right here
  // ✅ Month-wise filter (based on END DATE)
  if (filters.month !== "") {
    filtered = filtered.filter((c) => {
      const end = new Date(c.endDate);
      return end.getMonth() === Number(filters.month);

      // 👇 Optional: use joiningDate instead if needed
      // const join = new Date(c.joiningDate);
      // return join.getMonth().toString() === filters.month;
    });
  }

  setFilteredClients(filtered);
}, [filters, clients]);


useEffect(() => {
  fetchClients();
  fetchPackages();
  fetchTrainers();
}, []);

const fetchTrainers = async () => {
  try {
    const res = await axios.get(`${API_URI}/trainers`);
    setTrainers(res.data);
  } catch (err) {
    console.error("❌ Error fetching trainers:", err);
  }
};


const [renewData, setRenewData] = useState({
  joiningDate: "",
  endDate: "",
  package: "",
  days: "", // ✅ ADD THIS
  price: "",
  discount: "",
  discountAmount: "",
  amountPaid: "",
  balance: "",
  remarks: "",
  admissionCharges: "", 
  trainer: "",
  paymentMethod: "",
});
  const [showRenewForm, setShowRenewForm] = useState<string | null>(null);
  const [packages, setPackages] = useState<
  { _id: string; packageName: string; days: number; price: number }[]
>([]);


  
const fetchPackages = async () => {
  try {
    const res = await axios.get(`${API_URI}/packages`);
    setPackages(res.data);
  } catch (err) {
    console.error("❌ Error fetching packages:", err);
  }
};

  

  const fetchClients = async () => {
    try {
      const res = await axios.get(`${API_URI}/gymbill`);
      setClients(res.data);
      setFilteredClients(res.data); 
    } catch (err) {
      console.error("❌ Error fetching clients:", err);
    }
  };
  

  const handleRenew = async (id: string) => {
    try {
      await axios.put(`${API_URI}/gymbill/renew/${id}`, renewData);
      alert("✅ Subscription renewed successfully!");
      setShowRenewForm(null);
      fetchClients();
    } catch (err) {
      console.error("❌ Renewal failed:", err);
      alert("Renewal failed.");
    }
  };

  const getProfileImage = (id?: string) => {
  return id
    ? `${API_URI}/gymbill/image/${id}`
    : "/default-avatar.png";
};





const handleDownloadPDF = async () => {
  try {
    // ✅ Dynamically import modules at runtime
    const { jsPDF, autoTable } = await getPDFModules();

    const doc = new jsPDF();
    const selectedData = clients.filter((c) => selectedClients.includes(c._id));

    if (selectedData.length === 0) {
      alert("Please select at least one client!");
      return;
    }

    const currentDate = new Date().toLocaleDateString("en-GB").replace(/\//g, "-");
    const tableData = selectedData.map((c, index) => [
      index + 1,
      c.memberId,
      c.client,
      c.contactNumber,
      c.package,
      c.joiningDate,
      c.endDate,
    ]);

    const img = new Image();
    img.src = logo;

    img.onload = () => {
      const imgWidth = 20;
      const imgHeight = 20;

      doc.addImage(img, "PNG", 14, 10, imgWidth, imgHeight);
      doc.setFontSize(12);
      doc.text(`Renewal List - ${currentDate}`, 40, 22);
      doc.setFontSize(10);

      autoTable(doc, {
        head: [["S.No", "Member ID", "Client", "Contact", "Package", "Joining", "End"]],
        body: tableData,
        startY: 35,
        theme: "grid",
        headStyles: {
          fillColor: [255, 235, 59],
          textColor: [0, 0, 0],
          fontStyle: "bold",
        },
        bodyStyles: {
          fillColor: [255, 255, 255],
          textColor: [0, 0, 0],
        },
        alternateRowStyles: {
          fillColor: [255, 249, 196],
        },
        styles: {
          lineColor: [0, 0, 0],
          lineWidth: 0.1,
          fontSize: 9,
        },
      });

      doc.save(`Renewal_List_${currentDate}.pdf`);
    };
  } catch (err) {
    console.error("❌ Error generating PDF:", err);
    alert("PDF generation failed. Check console for details.");
  }
};

const calculateEndDate = (joiningDate: string, days: number) => {
  if (!joiningDate || !days) return "";
  const start = new Date(joiningDate);
  start.setDate(start.getDate() + days);
  return start.toISOString().split("T")[0];
};



  return (
    <div className="p-4 text-sm">
<div className="flex justify-between items-center mb-4">
  <h2 className="text-xl font-bold text-yellow-700">Client List</h2>
  
  <button
    onClick={handleDownloadPDF}
    disabled={selectedClients.length === 0}
    className={`px-3 py-1.5 rounded-md ${
      selectedClients.length === 0
        ? "bg-gray-400 cursor-not-allowed"
        : "bg-yellow-500 hover:bg-yellow-600 text-white"
    }`}
  >
    Download Selected PDF
  </button>
</div>


<div className="flex flex-wrap items-end gap-6 mb-4">
  {/* 🔍 Search */}
  <div className="flex flex-col">
    <label className="text-sm font-semibold mb-1">Search</label>
    <input
      type="text"
      placeholder="Search by name or contact"
      value={filters.search}
      onChange={(e) => setFilters({ ...filters, search: e.target.value })}
      className="border px-3 py-2 rounded-md w-56"
    />
  </div>

  {/* 📦 Package */}
  <div className="flex flex-col">
    <label className="text-sm font-semibold mb-1">Package</label>
    <select
      value={filters.package}
      onChange={(e) => setFilters({ ...filters, package: e.target.value })}
      className="border px-3 py-2 rounded-md w-40"
    >
      <option value="">All Packages</option>
      <option value="Monthly">Monthly</option>
      <option value="Quarterly">Quarterly</option>
      <option value="Yearly">Yearly</option>
    </select>
  </div>

  {/* 📊 Status */}
  <div className="flex flex-col">
    <label className="text-sm font-semibold mb-1">Status</label>
    <select
      value={filters.status}
      onChange={(e) => setFilters({ ...filters, status: e.target.value })}
      className="border px-3 py-2 rounded-md w-44"
    >
      <option value="">All Status</option>
      <option value="Active">Active</option>
      <option value="Expired">InActive</option>
    </select>
  </div>

  {/* 📅 Expire Date */}
  <div className="flex flex-col">
    <label htmlFor="expireDate" className="text-sm font-semibold mb-1">
      Expire Date
    </label>
    <input
      id="expireDate"
      type="date"
      value={filters.endDate}
      onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
      className="border px-3 py-2 rounded-md w-44"
    />
  
  </div>

    {/* 🗓 Month Filter */}
<div className="flex flex-col">
  <label className="text-sm font-semibold mb-1">Month</label>
  <select
    value={filters.month}
    onChange={(e) => setFilters({ ...filters, month: e.target.value })}
    className="border px-3 py-2 rounded-md w-44"
  >
    <option value="">All Months</option>
    <option value="0">January</option>
    <option value="1">February</option>
    <option value="2">March</option>
    <option value="3">April</option>
    <option value="4">May</option>
    <option value="5">June</option>
    <option value="6">July</option>
    <option value="7">August</option>
    <option value="8">September</option>
    <option value="9">October</option>
    <option value="10">November</option>
    <option value="11">December</option>
  </select>
</div>

  {/* 🔁 Reset */}
  <div className="flex flex-col">
    <label className="text-sm font-semibold mb-1 opacity-0">Reset</label>
  <button
  onClick={() => {
    setFilters({
      search: "",
      package: "",
      status: "",
      trainer: "",
      endDate: "",
      month: "",
    });
  }}
  className="bg-gray-400 hover:bg-gray-500 text-white px-3 py-2 rounded-md w-24"
>
  Reset
</button>


  </div>
</div>



      <div className="overflow-x-auto shadow-lg rounded-lg">
        <table className="min-w-full bg-white border border-gray-200">
          <thead className="bg-yellow-400 text-white">
  <tr>
    <th className="py-1.5 px-3 text-left">
      <input
        type="checkbox"
        onChange={(e) => {
          if (e.target.checked) {
            setSelectedClients(filteredClients.map((c) => c._id));
          } else {
            setSelectedClients([]);
          }
        }}
        checked={selectedClients.length === clients.length && clients.length > 0}
      />
    </th>
    <th className="py-1.5 px-3 text-left">Member ID</th>
    <th className="py-1.5 px-3 text-left">Client Name</th>
    <th className="py-1.5 px-3 text-left">Contact</th>
    <th className="py-1.5 px-3 text-left">Package</th>
    <th className="py-1.5 px-3 text-left">Joining Date</th>
    <th className="py-1.5 px-3 text-left">End Date</th>
    <th className="py-1.5 px-3 text-left">Status</th>
<th className="p-2 border">Actions</th>

  </tr>
</thead>

         <tbody>
  {filteredClients.length > 0 ? (
  filteredClients.map((client) => {

      const today = new Date();
      const end = new Date(client.endDate);
      const diffDays = Math.ceil(
        (end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      );

      let statusText = "Valid";
      let statusColor = "text-green-600 font-semibold";

      if (diffDays <= 0) {
        statusText = "Expired";
        statusColor = "text-red-600 font-semibold";
      } else if (diffDays <= 3) {
        statusText = "Need to Renew";
        statusColor = "text-yellow-600 font-semibold";
      }

      return (
        <React.Fragment key={client._id}>
          <tr className="border-b hover:bg-yellow-50 transition">
            {/* ✅ Selection Checkbox */}
            <td className="py-1.5 px-3">
              <input
                type="checkbox"
                checked={selectedClients.includes(client._id)}
                onChange={(e) => {
                  if (e.target.checked) {
                    setSelectedClients([...selectedClients, client._id]);
                  } else {
                    setSelectedClients(
                      selectedClients.filter((id) => id !== client._id)
                    );
                  }
                }}
              />
            </td>

            <td className="py-1.5 px-3">{client.memberId}</td>
            <td className="py-1.5 px-3">{client.client}</td>
            <td className="py-1.5 px-3">{client.contactNumber}</td>
            <td className="py-1.5 px-3">{client.package}</td>
            <td className="py-1.5 px-3">{client.joiningDate}</td>
            <td className="py-1.5 px-3">{client.endDate}</td>
            <td className={`py-1.5 px-3 ${statusColor}`}>{statusText}</td>

            <td className="py-1.5 px-3 text-center space-x-2">
              <button
                onClick={() => setSelectedClient(client)}
                className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded-md"
              >
                View
              </button>
              <button
                onClick={() =>
                  setShowRenewForm(
                    showRenewForm === client._id ? null : client._id
                  )
                }
                className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded-md"
              >
                Renew
              </button>

              <button
  onClick={() => generateCurrentPackageBill(client)}
  className="bg-blue-500 text-white px-4 py-1 rounded-md"
>
  Download Bill
</button>

              

            </td>
          </tr>

          {/* 🔁 Renewal Modal */}
        {showRenewForm === client._id && (
  <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
    <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl p-4 relative">
      <button
        onClick={() => setShowRenewForm(null)}
        className="absolute top-2 right-4 text-xl font-bold text-gray-700 hover:text-red-600"
      >
        ×
      </button>

      <h3 className="text-xl font-bold text-yellow-700 mb-4">
        Renew Membership – {client.client}
      </h3>

      <div className="grid grid-cols-2 gap-4">
        
        {/* Joining Date */}
        <div>
          <label className="text-xs text-gray-600">New Joining Date</label>
          <input
            type="date"
            className="w-full border p-2 rounded"
            value={renewData.joiningDate}
            onChange={(e) => {
              const newJoin = e.target.value;
              const end = calculateEndDate(newJoin, Number(renewData.days) || 0);
              setRenewData({ ...renewData, joiningDate: newJoin, endDate: end });
            }}
          />
        </div>

        {/* End Date */}
        <div>
          <label className="text-xs text-gray-600">End Date</label>
          <input
            type="date"
            value={renewData.endDate}
            readOnly
            className="w-full border p-2 rounded bg-gray-100"
          />
        </div>

        {/* Package Dropdown */}
        <div>
          <label className="text-xs text-gray-600">Package</label>
          <select
            className="w-full border p-2 rounded"
            value={renewData.package}
            onChange={(e) => {
              const selected = packages.find(
                (p) => p.packageName === e.target.value
              );
              const newDays = selected ? selected.days : 0;
              const newPrice = selected ? selected.price : 0;
              const newEndDate = calculateEndDate(
                renewData.joiningDate,
                newDays
              );
              setRenewData({
                ...renewData,
                package: e.target.value,
                days: newDays.toString(),
                price: newPrice.toString(),
                endDate: newEndDate,
              });
            }}
          >
            <option value="">Select Package</option>
            {packages.map((p) => (
              <option key={p._id} value={p.packageName}>
                {p.packageName}
              </option>
            ))}
          </select>
        </div>

        {/* Days */}
        <div>
          <label className="text-xs text-gray-600">Days</label>
          <input
            type="number"
            value={renewData.days}
            readOnly
            className="w-full border p-2 rounded bg-gray-100"
          />
        </div>

        {/* Price */}
        <div>
          <label className="text-xs text-gray-600">Price (₹)</label>
          <input
            type="number"
            value={renewData.price}
            onChange={(e) => {
              const price = Number(e.target.value) || 0;
              const discountAmount = Number(renewData.discountAmount) || 0;
              const amountPaid = price - discountAmount;
              setRenewData({
                ...renewData,
                price: price.toString(),
                amountPaid: amountPaid.toFixed(2),
              });
            }}
            className="w-full border p-2 rounded"
          />
        </div>

        {/* Discount Amount */}
        <div>
          <label className="text-xs text-gray-600">Discount Amount (₹)</label>
          <input
            type="number"
            value={renewData.discountAmount}
            onChange={(e) => {
              const discountAmount = Number(e.target.value) || 0;
              const price = Number(renewData.price) || 0;
              const amountPaid = price - discountAmount;
              setRenewData({
                ...renewData,
                discountAmount: discountAmount.toString(),
                amountPaid: amountPaid.toFixed(2),
                balance: "0",
              });
            }}
            className="w-full border p-2 rounded"
          />
        </div>

        {/* Amount Paid */}
        <div>
          <label className="text-xs text-gray-600">Amount Paid (₹)</label>
          <input
            type="number"
            value={renewData.amountPaid}
            onChange={(e) => {
              const amountPaid = Number(e.target.value) || 0;
              const price = Number(renewData.price) || 0;
              const discountAmount = Number(renewData.discountAmount) || 0;
              const balance = price - discountAmount - amountPaid;
              setRenewData({
                ...renewData,
                amountPaid: amountPaid.toString(),
                balance: balance.toFixed(2),
              });
            }}
            className="w-full border p-2 rounded"
          />
        </div>

        {/* Balance */}
        <div>
          <label className="text-xs text-gray-600">Balance (₹)</label>
          <input
            type="number"
            value={renewData.balance}
            readOnly
            className="w-full border p-2 rounded bg-gray-100"
          />
        </div>

        {/* ⭐ PAYMENT METHOD (NEW FIELD) */}
        <div>
          <label className="text-xs text-gray-600">Payment Method</label>
          <select
            className="w-full border p-2 rounded"
            value={renewData.paymentMethod}
            onChange={(e) =>
              setRenewData({ ...renewData, paymentMethod: e.target.value })
            }
          >
            <option value="">Select Method</option>
            <option value="Cash">Cash</option>
            <option value="Card">Card</option>
            <option value="UPI">UPI</option>
            <option value="Bank Transfer">Bank Transfer</option>
          </select>
        </div>

        {/* Remarks */}
        <div className="col-span-2">
          <label className="text-xs text-gray-600">Remarks</label>
          <textarea
            value={renewData.remarks}
            onChange={(e) =>
              setRenewData({ ...renewData, remarks: e.target.value })
            }
            className="w-full border p-2 rounded"
          />
        </div>

      </div>

      <div className="flex justify-end mt-6 space-x-3">
        <button
          onClick={() => setShowRenewForm(null)}
          className="bg-gray-300 px-3 py-1.5 rounded-md"
        >
          Cancel
        </button>
        <button
          onClick={() => handleRenew(client._id)}
          className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1.5 rounded-md"
        >
          Save Renewal
        </button>
      </div>
    </div>
  </div>
)}


        </React.Fragment>
      );
    })
  ) : (
    <tr>
      <td colSpan={9} className="text-center text-gray-500 py-4 italic">
        No clients found.
      </td>
    </tr>
  )}
</tbody>

        </table>
      </div>


      {editRenewId && (
  <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[9999]">
    <div className="bg-white w-full max-w-lg p-4 rounded-xl shadow-lg">
      <h3 className="text-lg font-bold text-yellow-700">Edit Renewal Entry</h3>

      <div className="grid grid-cols-2 gap-4 mt-3">
        <div>
          <label className="text-xs">Joining Date</label>
          <input 
            type="date"
            className="w-full border p-2 rounded"
            value={editRenewData.joiningDate}
            onChange={(e) =>
              setEditRenewData({ ...editRenewData, joiningDate: e.target.value })
            }
          />
        </div>

        <div>
          <label className="text-xs">End Date</label>
          <input 
            type="date"
            className="w-full border p-2 rounded"
            value={editRenewData.endDate}
            onChange={(e) =>
              setEditRenewData({ ...editRenewData, endDate: e.target.value })
            }
          />
        </div>

        <div>
          <label className="text-xs">Price</label>
          <input
            type="number"
            value={editRenewData.price}
            className="w-full border p-2 rounded"
            onChange={(e) =>
              setEditRenewData({ ...editRenewData, price: e.target.value })
            }
          />
        </div>

        <div>
          <label className="text-xs">Discount Amount</label>
          <input
            type="number"
            value={editRenewData.discountAmount}
            className="w-full border p-2 rounded"
            onChange={(e) =>
              setEditRenewData({
                ...editRenewData,
                discountAmount: e.target.value,
              })
            }
          />
        </div>

        <div>
          <label className="text-xs">Amount Paid</label>
          <input
            type="number"
            value={editRenewData.amountPaid}
            className="w-full border p-2 rounded"
            onChange={(e) =>
              setEditRenewData({
                ...editRenewData,
                amountPaid: e.target.value,
              })
            }
          />
        </div>

        <div>
          <label className="text-xs">Balance</label>
          <input
            type="number"
            value={editRenewData.balance}
            className="w-full border p-2 rounded"
            onChange={(e) =>
              setEditRenewData({
                ...editRenewData,
                balance: e.target.value,
              })
            }
          />
        </div>

        <div className="col-span-2">
          <label className="text-xs">Remarks</label>
          <textarea
            className="w-full border p-2 rounded"
            value={editRenewData.remarks}
            onChange={(e) =>
              setEditRenewData({
                ...editRenewData,
                remarks: e.target.value,
              })
            }
          />
        </div>
      </div>

      <div className="flex justify-end gap-3 mt-4">
        <button
          onClick={() => setEditRenewId(null)}
          className="bg-gray-300 px-3 py-1 rounded-md"
        >
          Cancel
        </button>

        <button
          onClick={handleEditRenewSave}
          className="bg-yellow-500 text-white px-3 py-1 rounded-md"
        >
          Save Changes
        </button>
      </div>
    </div>
  </div>
)}

      {/* 👁 Full Client Details Modal */}
    {/* 👁 Full Client Details Modal */}
{selectedClient && (
  <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
    <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl p-6 relative overflow-y-auto max-h-[90vh]">

      {/* ❌ Close */}
      <button
        onClick={() => setSelectedClient(null)}
        className="absolute top-3 right-5 text-2xl font-bold text-gray-500 hover:text-red-600"
      >
        ×
      </button>

      {/* 👤 Header */}
      <div className="flex items-center gap-5 border-b pb-4 mb-6">
        <img
          src={getProfileImage(selectedClient._id)}
          alt="Profile"
          className="w-28 h-28 rounded-full border-4 border-yellow-400 object-cover"
        />
        <div>
          <h3 className="text-2xl font-bold text-gray-800">
            {selectedClient.client}
          </h3>
          <p className="text-sm text-gray-500">
            Member ID: {selectedClient.memberId}
          </p>
          <span className={`text-sm font-semibold ${
            selectedClient.status === "Active"
              ? "text-green-600"
              : "text-red-600"
          }`}>
            {selectedClient.status}
          </span>
        </div>
      </div>

      {/* 🧾 MAIN GRID */}
      <div className="grid grid-cols-2 gap-6 text-sm text-gray-700">

        {/* 👤 Personal Details */}
        <div className="space-y-2">
          <h4 className="font-bold text-yellow-700">Personal Details</h4>
          <p><strong>Gender:</strong> {selectedClient.gender || "-"}</p>
          <p><strong>DOB:</strong> {selectedClient.dateOfBirth || "-"}</p>
          <p><strong>Anniversary:</strong> {selectedClient.anniversary || "-"}</p>
          <p><strong>Profession:</strong> {selectedClient.profession || "-"}</p>
          <p><strong>Contact:</strong> {selectedClient.contactNumber}</p>
          <p><strong>Alternate:</strong> {selectedClient.alternateContact || "-"}</p>
          <p><strong>Email:</strong> {selectedClient.email || "-"}</p>
          <p><strong>Address:</strong> {selectedClient.areaAddress || "-"}</p>
          <p><strong>Source:</strong> {selectedClient.clientSource || "-"}</p>
          <p><strong>Client Rep:</strong> {selectedClient.clientRep || "-"}</p>
        </div>

        {/* 📦 Package Details */}
        <div className="space-y-2">
          <h4 className="font-bold text-yellow-700">Package Details</h4>
          <p><strong>Package:</strong> {selectedClient.package}</p>
          <p><strong>Joining Date:</strong> {selectedClient.joiningDate}</p>
          <p><strong>End Date:</strong> {selectedClient.endDate}</p>
          <p><strong>Workout Hours:</strong> {selectedClient.workoutHours || "-"}</p>
          <p><strong>Trainer:</strong> {selectedClient.appointTrainer || "-"}</p>
          <p><strong>Remarks:</strong> {selectedClient.remarks || "-"}</p>
        </div>

        {/* 💰 Payment Summary */}
        <div className="col-span-2 bg-yellow-50 p-4 rounded-xl">
          <h4 className="font-bold text-yellow-700 mb-3">Payment Summary</h4>
          <div className="grid grid-cols-3 gap-4">
            <p><strong>Price:</strong> ₹{selectedClient.price || 0}</p>
            <p><strong>Discount:</strong> ₹{selectedClient.discountAmount || 0}</p>
            <p><strong>Admission:</strong> ₹{selectedClient.admissionCharges || 0}</p>
            <p><strong>Tax:</strong> ₹{selectedClient.tax || 0}</p>
            <p><strong>Paid:</strong> ₹{selectedClient.amountPaid || 0}</p>
            <p><strong>Balance:</strong> ₹{selectedClient.balance || 0}</p>
            <p><strong>Payable:</strong> ₹{selectedClient.amountPayable || 0}</p>
          {/*  <p><strong>Initial Mode:</strong> {selectedClient.initialPaymentMode || "-"}</p>*/}
            <p><strong>Initial Pay Mode:</strong> {selectedClient.paymentMethodDetail || "-"}</p>
          </div>
        </div>

        {/* 🔁 Renewal History */}
        <div className="col-span-2">
          <h4 className="font-bold text-yellow-700 mb-2">Renewal History</h4>

          {selectedClient.renewalHistory?.length ? (
            <table className="w-full border text-xs">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-2 border">Date</th>
                  <th className="p-2 border">Join</th>
                  <th className="p-2 border">End</th>
                  <th className="p-2 border">Package</th>
                  <th className="p-2 border">Price</th>
                  <th className="p-2 border">Paid</th>
                  <th className="p-2 border">Balance</th>
                  <th className="p-2 border">Action</th>
                </tr>
              </thead>
              <tbody>
                {selectedClient.renewalHistory.map((r) => (
                  <tr key={r._id}>
                    <td className="p-2 border">{r.date?.split("T")[0]}</td>
                    <td className="p-2 border">{r.joiningDate}</td>
                    <td className="p-2 border">{r.endDate}</td>
                    <td className="p-2 border">{r.package}</td>
                    <td className="p-2 border">₹{r.price}</td>
                    <td className="p-2 border">₹{r.amountPaid}</td>
                    <td className="p-2 border">₹{r.balance}</td>
                    <td className="p-2 border text-center space-x-1">
                      <button
                        onClick={() => openRenewalEditModal(r, selectedClient._id)}
                        className="bg-blue-500 text-white px-2 py-1 rounded text-xs"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteRenew(r._id, selectedClient._id)}
                        className="bg-red-500 text-white px-2 py-1 rounded text-xs"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="italic text-gray-500 text-sm">
              No renewal history available
            </p>
          )}
        </div>

        {/* 📜 Payment History */}
        <div className="col-span-2">
          <h4 className="font-bold text-yellow-700 mb-2">Payment History</h4>

          {selectedClient.paymentHistory?.length ? (
            <table className="w-full border text-xs">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-2 border">Date</th>
                  <th className="p-2 border">Amount</th>
                  <th className="p-2 border">Mode</th>
                  <th className="p-2 border">Note</th>
                </tr>
              </thead>
              <tbody>
                {selectedClient.paymentHistory.map((p, i) => (
                  <tr key={i}>
                    <td className="p-2 border">{p.date?.split("T")[0]}</td>
                    <td className="p-2 border">₹{p.amount}</td>
                    <td className="p-2 border">{p.mode}</td>
                    <td className="p-2 border">{p.note || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="italic text-gray-500 text-sm">
              No payment history available
            </p>
          )}
        </div>

      </div>
    </div>
  </div>
)}

    </div>
  );
};

export default Clients;
