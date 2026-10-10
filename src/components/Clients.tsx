import React, { useEffect, useState } from "react";
import axios from "axios";
async function getPDFModules() {
  const jsPDF = (await import('jspdf')).default;
  const autoTable = (await import('jspdf-autotable')).default;
  return { jsPDF, autoTable };
}
import { generateCurrentPackageBill, getInvoicePDFFile } from "../components/BillGenerator";
import { formatWhatsAppPhone, getDirectWhatsAppUrl, openDirectWhatsApp, getWhatsAppDesktopAppUrl } from "../utils/whatsapp";

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
  profilePicture?: string;

  package: string;
  joiningDate: string;
  originalJoiningDate?: string;
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
    _id?: string;
    id?: string;
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
  id?: string;
  _id?: string;
  name: string;
}

export interface RenewalTarget {
  clientId?: string;
  search?: string;
  openRenewModal?: boolean;
}

interface ClientsProps {
  initialTarget?: RenewalTarget | null;
  onClearTarget?: () => void;
}

const Clients: React.FC<ClientsProps> = ({ initialTarget, onClearTarget }) => {
const [clients, setClients] = useState<GymBill[]>([]);
const [selectedClient, setSelectedClient] = useState<GymBill | null>(null);
const [selectedClients, setSelectedClients] = useState<string[]>([]);
const [filteredClients, setFilteredClients] = useState<GymBill[]>([]);
const [_trainers, setTrainers] = useState<Trainer[]>([]);
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
  search: initialTarget?.search || "",
  package: "",
  status: "",
  trainer: "",
  endDate: "",
  month: "", // ✅ added
});
const openRenewalEditModal = (renew: any, clientId: string) => {
  const renewId = renew._id || renew.id;
  setEditRenewData({
    ...renew,
    _id: renewId,
    id: renewId,
    joiningDate: renew.joiningDate ? renew.joiningDate.split("T")[0] : "",
    endDate: renew.endDate ? renew.endDate.split("T")[0] : "",
    date: renew.date ? renew.date.split("T")[0] : "",
    price: renew.price ?? "",
    discountAmount: renew.discountAmount ?? "",
    amountPaid: renew.amountPaid ?? "",
    balance: renew.balance ?? "",
    remarks: renew.remarks ?? "",
    package: renew.package ?? "",
  });
  setEditRenewId(renewId);
  setEditClientId(clientId);
};

const handleEditRenewSave = async () => {
  if (!editClientId || !editRenewId) {
    alert("Missing renewal or client ID");
    return;
  }

  try {
    await axios.put(
      `${API_URI}/gymbill/renew/edit/${editClientId}/${editRenewId}`,
      editRenewData
    );

    alert("Renewal updated successfully");

    // Close popup
    setEditRenewId(null);
    setEditRenewData(null);

    // Refresh full list
    fetchClients();

    // 🔥 Refresh the currently opened client in View modal
    if (selectedClient && (selectedClient._id === editClientId || (selectedClient as any).id === editClientId)) {
      refreshSelectedClient(editClientId);
    }
  } catch (err: any) {
    console.error("❌ Renewal update failed:", err);
    alert("Renewal update failed: " + (err.response?.data?.message || err.message));
  }
};

const handleDeleteRenew = async (renewId: string, clientId: string) => {
  if (!renewId || !clientId) {
    alert("Missing renewal entry ID or client ID");
    return;
  }

  if (!window.confirm("Are you sure you want to delete this renewal?")) return;

  try {
    await axios.delete(
      `${API_URI}/gymbill/renew/delete/${clientId}/${renewId}`
    );

    alert("Renewal entry deleted");
    fetchClients(); // Refresh data

    // 🔥 Refresh the currently opened client in View modal
    if (selectedClient && (selectedClient._id === clientId || (selectedClient as any).id === clientId)) {
      refreshSelectedClient(clientId);
    }
  } catch (err: any) {
    console.error("Delete failed", err);
    alert("Failed to delete renewal: " + (err.response?.data?.message || err.message));
  }
};

const [editPaymentData, setEditPaymentData] = useState<any>(null);
const [editPaymentId, setEditPaymentId] = useState<string | null>(null);
const [editPaymentClientId, setEditPaymentClientId] = useState<string | null>(null);

const openPaymentEditModal = (payment: any, pId: string, clientId: string) => {
  setEditPaymentData({
    ...payment,
    _id: pId,
    id: pId,
    date: payment.date ? payment.date.split("T")[0] : "",
    amount: payment.amount ?? "",
    mode: payment.mode ?? "Cash",
    note: payment.note ?? "",
  });
  setEditPaymentId(pId);
  setEditPaymentClientId(clientId);
};

const handleEditPaymentSave = async () => {
  if (!editPaymentClientId || !editPaymentId) {
    alert("Missing payment entry ID or client ID");
    return;
  }

  try {
    await axios.put(
      `${API_URI}/gymbill/payment/edit/${editPaymentClientId}/${editPaymentId}`,
      editPaymentData
    );

    alert("Payment entry updated successfully");
    setEditPaymentId(null);
    setEditPaymentData(null);
    fetchClients();
    if (selectedClient && (selectedClient._id === editPaymentClientId || (selectedClient as any).id === editPaymentClientId)) {
      refreshSelectedClient(editPaymentClientId);
    }
  } catch (err: any) {
    console.error("❌ Payment update failed:", err);
    alert("Payment update failed: " + (err.response?.data?.message || err.message));
  }
};

const handleDeletePayment = async (pId: string, clientId: string) => {
  if (!pId || !clientId) {
    alert("Missing payment entry ID or client ID");
    return;
  }

  if (!window.confirm("Are you sure you want to delete this payment entry?")) return;

  try {
    await axios.delete(
      `${API_URI}/gymbill/payment/delete/${clientId}/${pId}`
    );

    alert("Payment entry deleted");
    fetchClients();
    if (selectedClient && (selectedClient._id === clientId || (selectedClient as any).id === clientId)) {
      refreshSelectedClient(clientId);
    }
  } catch (err: any) {
    console.error("Payment delete failed:", err);
    alert("Failed to delete payment: " + (err.response?.data?.message || err.message));
  }
};


useEffect(() => {
  let filtered = [...clients];
  if (filters.search) {
    const term = filters.search.toLowerCase().trim();
    filtered = filtered.filter(
      (c) =>
        c.client?.toLowerCase().includes(term) ||
        c.contactNumber?.includes(term) ||
        c.alternateContact?.includes(term) ||
        c.memberId?.toString().toLowerCase().includes(term) ||
        c._id?.toLowerCase().includes(term)
    );
  }
  if (filters.package) filtered = filtered.filter((c) => c.package === filters.package);
  if (filters.status) filtered = filtered.filter((c) => (c.status || "").toLowerCase() === filters.status.toLowerCase());
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

  // ── Sort: Latest paid/renewed clients first (by joiningDate desc) ──────────
  filtered.sort((a, b) => {
    const aDate = a.joiningDate ? new Date(a.joiningDate).getTime() : 0;
    const bDate = b.joiningDate ? new Date(b.joiningDate).getTime() : 0;
    return bDate - aDate; // newest joining date first
  });

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


  const [packages, setPackages] = useState<
    { id: string; name: string; durationDays: number; price: number }[]
  >([]);

  const fetchPackages = async () => {
    try {
      const res = await axios.get(`${API_URI}/packages`);
      setPackages(res.data);
    } catch (err) {
      console.error("❌ Error fetching packages:", err);
    }
  };

  const calculateEndDate = (joiningDate: string, days: number) => {
    if (!joiningDate || !days) return "";
    const start = new Date(joiningDate);
    start.setDate(start.getDate() + days);
    return start.toISOString().split("T")[0];
  };

  const [renewData, setRenewData] = useState({
    joiningDate: "",
    endDate: "",
    package: "",
    days: "",
    price: "",
    discount: "",
    discountAmount: "",
    amountPaid: "",
    balance: "",
    remarks: "",
    admissionCharges: "",
    trainer: "",
    paymentMethod: "",
    ptAmount: "",
    ptTrainer: "",
  });

  const [showRenewForm, setShowRenewForm] = useState<string | null>(
    initialTarget?.openRenewModal && initialTarget?.clientId
      ? initialTarget.clientId
      : null
  );

  const openRenewModal = (client: GymBill) => {
    let defaultJoin = new Date().toISOString().split("T")[0];
    if (client.endDate && client.endDate.trim()) {
      defaultJoin = client.endDate.trim();
    }
    const matchedPkg = packages.find((p) => p.name === client.package);
    const pkgDays = matchedPkg ? matchedPkg.durationDays : 0;
    const pkgPrice = matchedPkg ? matchedPkg.price : (Number(client.price) || 0);
    const newEnd = pkgDays > 0 ? calculateEndDate(defaultJoin, pkgDays) : "";

    setRenewData({
      joiningDate: defaultJoin,
      endDate: newEnd,
      package: client.package || "",
      days: pkgDays > 0 ? pkgDays.toString() : "",
      price: pkgPrice > 0 ? pkgPrice.toString() : "",
      discount: "",
      discountAmount: "0",
      amountPaid: pkgPrice > 0 ? pkgPrice.toString() : "",
      balance: "0",
      remarks: "",
      admissionCharges: "0",
      trainer: client.appointTrainer || "",
      paymentMethod: client.initialPaymentMode || "Cash",
      ptAmount: String(client.ptAmount || 0),
      ptTrainer: client.ptTrainer || "",
    });
    setShowRenewForm(client._id);
  };

  useEffect(() => {
    if (initialTarget) {
      if (initialTarget.search !== undefined) {
        setFilters((prev) => ({ ...prev, search: initialTarget.search || "" }));
      }
      if (initialTarget.openRenewModal && initialTarget.clientId) {
        const targetClient = clients.find((c) => c._id === initialTarget.clientId);
        if (targetClient) {
          openRenewModal(targetClient);
        } else {
          setShowRenewForm(initialTarget.clientId);
        }
      }
    }
  }, [initialTarget, clients]);

  // ✏️ Edit Package Option (allows editing client's package after renewal or at any time)
  const [editPackageClient, setEditPackageClient] = useState<GymBill | null>(null);
  const [editPackageData, setEditPackageData] = useState({
    package: "",
    days: "",
    joiningDate: "",
    endDate: "",
    price: "",
    discountAmount: "",
    amountPaid: "",
    balance: "",
    paymentMethod: "",
    appointTrainer: "",
    ptAmount: "",
    ptTrainer: "",
    remarks: "",
  });

  const openEditPackageModal = (client: GymBill) => {
    const matchedPkg = packages.find((p) => p.name === client.package);
    const pkgDays = client.days || (matchedPkg ? matchedPkg.durationDays.toString() : "");

    setEditPackageClient(client);
    setEditPackageData({
      package: client.package || "",
      days: pkgDays,
      joiningDate: client.joiningDate || "",
      endDate: client.endDate || "",
      price: client.price !== undefined ? String(client.price) : "",
      discountAmount: client.discountAmount !== undefined ? String(client.discountAmount) : "0",
      amountPaid: client.amountPaid !== undefined ? String(client.amountPaid) : "0",
      balance: client.balance !== undefined ? String(client.balance) : "0",
      paymentMethod: client.initialPaymentMode || client.paymentMethodDetail || "Cash",
      appointTrainer: client.appointTrainer || "",
      ptAmount: client.ptAmount !== undefined ? String(client.ptAmount) : "0",
      ptTrainer: client.ptTrainer || "",
      remarks: client.remarks || "",
    });
  };

  const handleSaveEditPackage = async () => {
    if (!editPackageClient?._id) {
      alert("Missing client ID");
      return;
    }

    try {
      const priceNum = Number(editPackageData.price) || 0;
      const discNum = Number(editPackageData.discountAmount) || 0;
      const paidNum = Number(editPackageData.amountPaid) || 0;
      const calculatedBalance = priceNum - discNum - paidNum;

      const payload = {
        package: editPackageData.package,
        days: editPackageData.days,
        joiningDate: editPackageData.joiningDate,
        endDate: editPackageData.endDate,
        price: priceNum,
        discountAmount: discNum,
        amountPayable: priceNum - discNum,
        amountPaid: paidNum,
        balance: calculatedBalance,
        initialPaymentMode: editPackageData.paymentMethod,
        appointTrainer: editPackageData.appointTrainer,
        ptAmount: Number(editPackageData.ptAmount) || 0,
        ptTrainer: editPackageData.ptTrainer || null,
        remarks: editPackageData.remarks,
      };

      await axios.put(`${API_URI}/gymbill/${editPackageClient._id}`, payload);
      alert("Package updated successfully!");

      const cId = editPackageClient._id;
      setEditPackageClient(null);

      // Refresh list and any active view modal
      fetchClients();
      if (selectedClient && (selectedClient._id === cId || (selectedClient as any).id === cId)) {
        refreshSelectedClient(cId);
      }
    } catch (err: any) {
      console.error("❌ Failed to update package:", err);
      alert("Failed to update package: " + (err.response?.data?.message || err.message));
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
  

  const [renewalSuccess, setRenewalSuccess] = useState<{
    client: GymBill;
    phone: string;
    pdfFile: File;
    message: string;
    waLink: string;
  } | null>(null);

  const isPTPackage = (packageName: string) =>
    /pt|personal.?training/i.test(packageName);

  const handleRenew = async (id: string, clientObj?: GymBill) => {
    try {
      const res = await axios.put(`${API_URI}/gymbill/renew/${id}`, renewData);
      const updatedClientData = res.data?.data;

      // 1️⃣ Prepare client with updated renewal info for invoice generation
      const baseClient = clientObj || clients.find((c) => c._id === id);
      const updatedClient: GymBill = {
        ...(baseClient || {}),
        ...(updatedClientData || {}),
        package: renewData.package || baseClient?.package,
        joiningDate: renewData.joiningDate || baseClient?.joiningDate,
        endDate: renewData.endDate || baseClient?.endDate,
        price: Number(renewData.price) || baseClient?.price || 0,
        discountAmount: Number(renewData.discountAmount) || 0,
        amountPaid: Number(renewData.amountPaid) || 0,
        balance: Number(renewData.balance) || 0,
        initialPaymentMode: renewData.paymentMethod || baseClient?.initialPaymentMode || "Cash",
      } as GymBill;

      // 2️⃣ Generate the Invoice PDF as an actual File object & download to disk
      let pdfFile: File | null = null;
      try {
        pdfFile = await getInvoicePDFFile(updatedClient);
        await generateCurrentPackageBill(updatedClient);
      } catch (pdfErr) {
        console.error("❌ PDF generation error:", pdfErr);
      }

      // 3️⃣ Open WhatsApp directly with the renewal success message & attached format
      const formattedPhone = formatWhatsAppPhone(updatedClient.contactNumber);
      const balanceText = Number(updatedClient.balance) > 0 ? `\n💳 *Pending Balance:* ₹${updatedClient.balance}` : "";
      const ptText = isPTPackage(renewData.package) && Number(renewData.ptAmount) > 0
        ? `\n🏋️ *Personal Training Amount:* ₹${renewData.ptAmount}`
        : "";

      const message = `✅ *Membership Renewal Successful!* 🎉\n\n` +
        `Hi *${updatedClient.client}* (Member ID: *${updatedClient.memberId || "N/A"}*),\n\n` +
        `Your gym membership has been renewed successfully at *Elite Fitness*! 💪🏋️‍♂️\n\n` +
        `📦 *Package:* ${updatedClient.package || "Membership Package"}\n` +
        `📅 *Valid From:* ${updatedClient.joiningDate}\n` +
        `📅 *Valid Till:* ${updatedClient.endDate}\n` +
        `💰 *Amount Paid:* ₹${updatedClient.amountPaid}${ptText}${balanceText}\n\n` +
        `📎 Please find your invoice attached to this message.\n\n` +
        `Thank you for renewing your journey with *Elite Fitness*! Stay fit & strong! 💪🏋️‍♂️\n` +
        `— *Elite Fitness*`;

      const waLink = getDirectWhatsAppUrl(updatedClient.contactNumber, message);

      // 4️⃣ Try Web Share API with attached PDF file directly
      let sharedNatively = false;
      if (pdfFile && navigator.canShare && navigator.canShare({ files: [pdfFile] })) {
        try {
          await navigator.share({
            files: [pdfFile],
            title: `Invoice - ${updatedClient.client}`,
            text: message,
          });
          sharedNatively = true;
        } catch (shareErr) {
          console.log("Native share dismissed");
        }
      }

      // 5️⃣ If not shared via native share dialog, open WhatsApp Web chat directly
      if (!sharedNatively && waLink) {
        window.open(waLink, "_blank");
      }

      if (pdfFile && formattedPhone) {
        setRenewalSuccess({
          client: updatedClient,
          phone: formattedPhone,
          pdfFile,
          message,
          waLink,
        });
      }

      // 6️⃣ Auto-create PT session record if PT package selected
      if (isPTPackage(renewData.package) && Number(renewData.ptAmount) > 0) {
        try {
          await axios.post(`${API_URI}/pts`, {
            clientName: updatedClient.client || clientObj?.client || "",
            trainerId: renewData.ptTrainer || undefined,
            sessions: 1,
            price: Number(renewData.ptAmount),
          });
        } catch (ptErr) {
          console.warn("⚠️ PT session record creation failed:", ptErr);
        }
      }

      setShowRenewForm(null);
      if (onClearTarget) onClearTarget();
      fetchClients();
    } catch (err) {
      console.error("❌ Renewal failed:", err);
      alert("Renewal failed.");
    }
  };

  const getProfileImage = (client: GymBill) => {
    if (client.profilePicture) {
      // profilePicture is stored as a base64 data URL
      return client.profilePicture;
    }
    return null; // will render initials avatar instead
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


const sendWhatsAppReminder = async (client: GymBill) => {
  try {
    const message = `🔔 *Subscription Expiry Reminder*\n\nHi *${client.client}* (Member ID: *${client.memberId || "N/A"}*),\n\nYour gym membership (${client.package || "Package"}) at *Elite Fitness* is expiring / has expired on *${client.endDate}*.\n\nPlease renew your membership to continue your fitness journey without interruption. 💪🏋️‍♂️\n\nThank you!\nElite Fitness`;

    // Directly redirect into client's WhatsApp chat without manual searching
    openDirectWhatsApp(client.contactNumber, message);

    // Also call backend to log / send via API if configured
    if (client._id) {
      await axios.post(`${API_URI}/gymbill/send-expiry-reminder/${client._id}`).catch(() => {});
    }
  } catch (err) {
    console.error("❌ Failed to send WhatsApp reminder:", err);
    alert("Failed to send WhatsApp reminder.");
  }
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
      placeholder="Search by name, ID, or mobile"
      value={filters.search}
      onChange={(e) => setFilters({ ...filters, search: e.target.value })}
      className="border px-3 py-2 rounded-md w-64"
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
      <option value="Inactive">InActive</option>
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
    <th className="py-1.5 px-2 text-left text-xs">ID</th>
    <th className="py-1.5 px-2 text-left text-xs">Client Name</th>
    <th className="py-1.5 px-2 text-left text-xs">Contact</th>
    <th className="py-1.5 px-2 text-left text-xs">Package</th>
    <th className="py-1.5 px-2 text-left text-xs">Join Date</th>
    <th className="py-1.5 px-2 text-left text-xs">End Date</th>
    <th className="py-1.5 px-2 text-left text-xs">Status</th>
    <th className="py-1.5 px-2 text-center text-xs">Actions</th>

  </tr>
</thead>

         <tbody>
  {filteredClients.length > 0 ? (
  filteredClients.map((client) => {

      let effectiveEndDate = client.endDate?.trim();
      if (!effectiveEndDate && Array.isArray(client.renewalHistory) && client.renewalHistory.length > 0) {
        const latest = [...client.renewalHistory].reverse().find((r) => r.endDate?.trim());
        if (latest) effectiveEndDate = latest.endDate.trim();
      }

      let statusText = "Inactive";
      let statusColor = "text-red-600 font-semibold";

      if (effectiveEndDate) {
        const end = new Date(effectiveEndDate);
        if (!isNaN(end.getTime())) {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          end.setHours(0, 0, 0, 0);
          const diffDays = Math.ceil(
            (end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
          );

          if (diffDays < 0) {
            statusText = "Expired";
            statusColor = "text-red-600 font-semibold";
          } else if (diffDays <= 3) {
            statusText = "Need to Renew";
            statusColor = "text-yellow-600 font-semibold";
          } else {
            statusText = "Active";
            statusColor = "text-green-600 font-semibold";
          }
        }
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

            <td className="py-1 px-2 text-xs">{client.memberId}</td>
            <td className="py-1 px-2 text-xs font-medium">{client.client}</td>
            <td className="py-1 px-2 text-xs">{client.contactNumber}</td>
            <td className="py-1 px-2 text-xs">{client.package}</td>
            <td className="py-1 px-2 text-xs">{client.joiningDate ? client.joiningDate.split('T')[0] : '-'}</td>
            <td className="py-1 px-2 text-xs">{client.endDate ? client.endDate.split('T')[0] : '-'}</td>
            <td className={`py-1 px-2 text-xs ${statusColor}`}>{statusText}</td>

            <td className="py-1 px-2">
              <div className="flex flex-col gap-1">
                {/* Row 1: primary actions */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setSelectedClient(client)}
                    title="View client details"
                    className="flex items-center gap-0.5 bg-yellow-500 hover:bg-yellow-600 text-white text-[11px] font-semibold px-2 py-0.5 rounded cursor-pointer transition leading-tight"
                  >
                    👁 View
                  </button>
                  <button
                    onClick={() =>
                      showRenewForm === client._id
                        ? setShowRenewForm(null)
                        : openRenewModal(client)
                    }
                    title="Renew membership"
                    className="flex items-center gap-0.5 bg-green-500 hover:bg-green-600 text-white text-[11px] font-semibold px-2 py-0.5 rounded cursor-pointer transition leading-tight"
                  >
                    🔁 Renew
                  </button>
                  <button
                    onClick={() => openEditPackageModal(client)}
                    title="Edit Package & Membership"
                    className="flex items-center gap-0.5 bg-purple-600 hover:bg-purple-700 text-white text-[11px] font-semibold px-2 py-0.5 rounded cursor-pointer transition leading-tight"
                  >
                    ✏️ Pkg
                  </button>
                </div>
                {/* Row 2: secondary actions */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => generateCurrentPackageBill(client)}
                    title="Download Bill PDF"
                    className="flex items-center gap-0.5 bg-blue-500 hover:bg-blue-600 text-white text-[11px] font-semibold px-2 py-0.5 rounded cursor-pointer transition leading-tight"
                  >
                    📄 Bill
                  </button>
                  <button
                    onClick={() => sendWhatsAppReminder(client)}
                    title="Send WhatsApp Expiry Reminder"
                    className="flex items-center gap-0.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-semibold px-2 py-0.5 rounded cursor-pointer transition leading-tight"
                  >
                    📱 Remind
                  </button>
                </div>
              </div>
            </td>
          </tr>


          {/* 🔁 Renewal Modal */}
        {showRenewForm === client._id && (
  <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
    <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl p-4 relative">
      <button
        onClick={() => {
          setShowRenewForm(null);
          if (onClearTarget) onClearTarget();
        }}
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
                (p) => p.name === e.target.value
              );
              const newDays = selected ? selected.durationDays : 0;
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
            <option value="Personal Training">🏋️ Personal Training</option>
            {packages.map((p) => (
              <option key={p.id} value={p.name}>
                {p.name}
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

        {/* ⭐ PAYMENT METHOD */}
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
            <option value="GPay">GPay</option>
            <option value="Paytm">Paytm</option>
          </select>
        </div>

        {/* 🏋️ PT Fields — shown only when package includes PT */}
        {isPTPackage(renewData.package) && (
          <>
            <div>
              <label className="text-xs text-gray-600 font-semibold text-yellow-700">PT Amount (₹)</label>
              <input
                type="number"
                placeholder="Enter PT amount"
                value={renewData.ptAmount}
                onChange={(e) =>
                  setRenewData({ ...renewData, ptAmount: e.target.value })
                }
                className="w-full border p-2 rounded border-yellow-400 focus:ring-yellow-400"
              />
            </div>
            <div>
              <label className="text-xs text-gray-600 font-semibold text-yellow-700">PT Trainer</label>
              <select
                className="w-full border p-2 rounded border-yellow-400"
                value={renewData.ptTrainer}
                onChange={(e) =>
                  setRenewData({ ...renewData, ptTrainer: e.target.value })
                }
              >
                <option value="">Select PT Trainer</option>
                {_trainers.map((t) => (
                  <option key={t.id || t._id} value={t.id || t._id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
          </>
        )}

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
          onClick={() => {
            setShowRenewForm(null);
            if (onClearTarget) onClearTarget();
          }}
          className="bg-gray-300 px-3 py-1.5 rounded-md"
        >
          Cancel
        </button>
        <button
          onClick={() => handleRenew(client._id, client)}
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


      {/* ✏️ Edit Package / Membership Modal (Accessible anytime & after renewal) */}
      {editPackageClient && editPackageData && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[9999] p-4">
          <div className="bg-white w-full max-w-xl p-6 rounded-2xl shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4 border-b pb-3">
              <div>
                <h3 className="text-xl font-bold text-yellow-700">
                  Edit Package & Membership
                </h3>
                <p className="text-xs text-gray-500">
                  {editPackageClient.client} · Member ID: {editPackageClient.memberId || "N/A"}
                </p>
              </div>
              <button
                onClick={() => setEditPackageClient(null)}
                className="text-gray-400 hover:text-red-600 font-bold text-2xl cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              {/* Package Selection */}
              <div className="col-span-2">
                <label className="text-xs font-semibold text-gray-700 block mb-1">
                  Package <span className="text-red-500">*</span>
                </label>
                <select
                  className="w-full border p-2.5 rounded-lg text-sm bg-white border-yellow-300 focus:ring-2 focus:ring-yellow-400 focus:outline-none"
                  value={editPackageData.package}
                  onChange={(e) => {
                    const selectedPkgName = e.target.value;
                    const selectedPkg = packages.find((p) => p.name === selectedPkgName);
                    const newDays = selectedPkg ? selectedPkg.durationDays : 0;
                    const newPrice = selectedPkg ? selectedPkg.price : (Number(editPackageData.price) || 0);
                    const newEndDate = (editPackageData.joiningDate && newDays > 0)
                      ? calculateEndDate(editPackageData.joiningDate, newDays)
                      : editPackageData.endDate;
                    const disc = Number(editPackageData.discountAmount) || 0;
                    const paid = Number(editPackageData.amountPaid) || 0;
                    const newBalance = newPrice - disc - paid;

                    setEditPackageData({
                      ...editPackageData,
                      package: selectedPkgName,
                      days: newDays > 0 ? newDays.toString() : editPackageData.days,
                      price: newPrice.toString(),
                      endDate: newEndDate,
                      balance: newBalance.toFixed(2),
                    });
                  }}
                >
                  <option value="">Select Package</option>
                  <option value="Personal Training">🏋️ Personal Training</option>
                  {packages.map((p) => (
                    <option key={p.id} value={p.name}>
                      {p.name} (₹{p.price} · {p.durationDays} days)
                    </option>
                  ))}
                  {editPackageData.package &&
                    !packages.some((p) => p.name === editPackageData.package) &&
                    editPackageData.package !== "Personal Training" && (
                      <option value={editPackageData.package}>{editPackageData.package}</option>
                  )}
                </select>
              </div>

              {/* Joining Date */}
              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">Joining Date</label>
                <input
                  type="date"
                  className="w-full border p-2 rounded-lg text-sm"
                  value={editPackageData.joiningDate}
                  onChange={(e) => {
                    const newJoin = e.target.value;
                    const daysNum = Number(editPackageData.days) || 0;
                    const newEnd = daysNum > 0 ? calculateEndDate(newJoin, daysNum) : editPackageData.endDate;
                    setEditPackageData({
                      ...editPackageData,
                      joiningDate: newJoin,
                      endDate: newEnd,
                    });
                  }}
                />
              </div>

              {/* End Date */}
              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">End Date</label>
                <input
                  type="date"
                  className="w-full border p-2 rounded-lg text-sm bg-gray-50"
                  value={editPackageData.endDate}
                  onChange={(e) =>
                    setEditPackageData({ ...editPackageData, endDate: e.target.value })
                  }
                />
              </div>

              {/* Duration Days */}
              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">Duration (Days)</label>
                <input
                  type="number"
                  className="w-full border p-2 rounded-lg text-sm"
                  value={editPackageData.days}
                  onChange={(e) => {
                    const days = e.target.value;
                    const daysNum = Number(days) || 0;
                    const newEnd = (editPackageData.joiningDate && daysNum > 0)
                      ? calculateEndDate(editPackageData.joiningDate, daysNum)
                      : editPackageData.endDate;
                    setEditPackageData({
                      ...editPackageData,
                      days,
                      endDate: newEnd,
                    });
                  }}
                />
              </div>

              {/* Price */}
              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">Price (₹)</label>
                <input
                  type="number"
                  className="w-full border p-2 rounded-lg text-sm"
                  value={editPackageData.price}
                  onChange={(e) => {
                    const price = Number(e.target.value) || 0;
                    const disc = Number(editPackageData.discountAmount) || 0;
                    const paid = Number(editPackageData.amountPaid) || 0;
                    setEditPackageData({
                      ...editPackageData,
                      price: e.target.value,
                      balance: (price - disc - paid).toFixed(2),
                    });
                  }}
                />
              </div>

              {/* Discount Amount */}
              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">Discount Amount (₹)</label>
                <input
                  type="number"
                  className="w-full border p-2 rounded-lg text-sm"
                  value={editPackageData.discountAmount}
                  onChange={(e) => {
                    const disc = Number(e.target.value) || 0;
                    const price = Number(editPackageData.price) || 0;
                    const paid = Number(editPackageData.amountPaid) || 0;
                    setEditPackageData({
                      ...editPackageData,
                      discountAmount: e.target.value,
                      balance: (price - disc - paid).toFixed(2),
                    });
                  }}
                />
              </div>

              {/* Amount Paid */}
              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">Amount Paid (₹)</label>
                <input
                  type="number"
                  className="w-full border p-2 rounded-lg text-sm"
                  value={editPackageData.amountPaid}
                  onChange={(e) => {
                    const paid = Number(e.target.value) || 0;
                    const price = Number(editPackageData.price) || 0;
                    const disc = Number(editPackageData.discountAmount) || 0;
                    setEditPackageData({
                      ...editPackageData,
                      amountPaid: e.target.value,
                      balance: (price - disc - paid).toFixed(2),
                    });
                  }}
                />
              </div>

              {/* Balance */}
              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">Balance (₹)</label>
                <input
                  type="number"
                  readOnly
                  className="w-full border p-2 rounded-lg text-sm bg-gray-100 font-semibold text-gray-800"
                  value={editPackageData.balance}
                />
              </div>

              {/* Payment Method */}
              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">Payment Method</label>
                <select
                  className="w-full border p-2 rounded-lg text-sm bg-white"
                  value={editPackageData.paymentMethod}
                  onChange={(e) =>
                    setEditPackageData({ ...editPackageData, paymentMethod: e.target.value })
                  }
                >
                  <option value="Cash">Cash</option>
                  <option value="Card">Card</option>
                  <option value="UPI">UPI</option>
                  <option value="GPay">GPay</option>
                  <option value="Paytm">Paytm</option>
                </select>
              </div>

              {/* Appointed Trainer */}
              <div className="col-span-2">
                <label className="text-xs font-semibold text-gray-700 block mb-1">Appointed Trainer</label>
                <select
                  className="w-full border p-2 rounded-lg text-sm bg-white"
                  value={editPackageData.appointTrainer}
                  onChange={(e) =>
                    setEditPackageData({ ...editPackageData, appointTrainer: e.target.value })
                  }
                >
                  <option value="">Select Trainer</option>
                  {_trainers.map((t) => (
                    <option key={t.id || t._id} value={t.name}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* PT Fields */}
              {isPTPackage(editPackageData.package) && (
                <>
                  <div>
                    <label className="text-xs font-semibold text-yellow-700 block mb-1">PT Amount (₹)</label>
                    <input
                      type="number"
                      className="w-full border p-2 rounded-lg text-sm border-yellow-300"
                      value={editPackageData.ptAmount}
                      onChange={(e) =>
                        setEditPackageData({ ...editPackageData, ptAmount: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-yellow-700 block mb-1">PT Trainer</label>
                    <select
                      className="w-full border p-2 rounded-lg text-sm border-yellow-300 bg-white"
                      value={editPackageData.ptTrainer}
                      onChange={(e) =>
                        setEditPackageData({ ...editPackageData, ptTrainer: e.target.value })
                      }
                    >
                      <option value="">Select PT Trainer</option>
                      {_trainers.map((t) => (
                        <option key={t.id || t._id} value={t.id || t._id}>
                          {t.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              )}

              {/* Remarks */}
              <div className="col-span-2">
                <label className="text-xs font-semibold text-gray-700 block mb-1">Remarks</label>
                <textarea
                  className="w-full border p-2 rounded-lg text-sm"
                  rows={2}
                  value={editPackageData.remarks}
                  onChange={(e) =>
                    setEditPackageData({ ...editPackageData, remarks: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6 border-t pt-4">
              <button
                type="button"
                onClick={() => setEditPackageClient(null)}
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-lg font-medium cursor-pointer transition text-sm"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveEditPackage}
                className="bg-yellow-500 hover:bg-yellow-600 text-white px-5 py-2 rounded-lg font-semibold cursor-pointer transition shadow-md text-sm"
              >
                Save Package Changes
              </button>
            </div>
          </div>
        </div>
      )}


      {editRenewId && editRenewData && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[9999] p-4">
          <div className="bg-white w-full max-w-lg p-5 rounded-xl shadow-2xl">
            <div className="flex justify-between items-center mb-4 border-b pb-2">
              <h3 className="text-lg font-bold text-yellow-700">Edit Renewal Entry</h3>
              <button
                onClick={() => {
                  setEditRenewId(null);
                  setEditRenewData(null);
                }}
                className="text-gray-400 hover:text-gray-600 font-bold text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="text-xs font-semibold text-gray-700 block mb-1">Package</label>
                <select
                  className="w-full border p-2 rounded text-sm bg-white"
                  value={editRenewData.package || ""}
                  onChange={(e) => {
                    const selectedPkgName = e.target.value;
                    const selectedPkg = packages.find((p) => p.name === selectedPkgName);
                    const newPrice = selectedPkg ? selectedPkg.price : (Number(editRenewData.price) || 0);
                    const newDays = selectedPkg ? selectedPkg.durationDays : 0;
                    const newEndDate = (editRenewData.joiningDate && newDays > 0)
                      ? calculateEndDate(editRenewData.joiningDate, newDays)
                      : editRenewData.endDate;
                    const disc = Number(editRenewData.discountAmount) || 0;
                    const paid = Number(editRenewData.amountPaid) || 0;
                    const adm = Number(editRenewData.admissionCharges) || 0;
                    const newBalance = newPrice + adm - disc - paid;

                    setEditRenewData({
                      ...editRenewData,
                      package: selectedPkgName,
                      price: newPrice,
                      endDate: newEndDate,
                      balance: newBalance,
                    });
                  }}
                >
                  <option value="">Select Package</option>
                  <option value="Personal Training">🏋️ Personal Training</option>
                  {packages.map((p) => (
                    <option key={p.id} value={p.name}>
                      {p.name} (₹{p.price} · {p.durationDays} days)
                    </option>
                  ))}
                  {editRenewData.package &&
                    !packages.some((p) => p.name === editRenewData.package) &&
                    editRenewData.package !== "Personal Training" && (
                      <option value={editRenewData.package}>{editRenewData.package}</option>
                  )}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">Joining Date</label>
                <input 
                  type="date"
                  className="w-full border p-2 rounded text-sm"
                  value={editRenewData.joiningDate || ""}
                  onChange={(e) =>
                    setEditRenewData({ ...editRenewData, joiningDate: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">End Date</label>
                <input 
                  type="date"
                  className="w-full border p-2 rounded text-sm"
                  value={editRenewData.endDate || ""}
                  onChange={(e) =>
                    setEditRenewData({ ...editRenewData, endDate: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">Price</label>
                <input
                  type="number"
                  value={editRenewData.price ?? ""}
                  className="w-full border p-2 rounded text-sm"
                  onChange={(e) => {
                    const price = Number(e.target.value) || 0;
                    const disc = Number(editRenewData.discountAmount) || 0;
                    const paid = Number(editRenewData.amountPaid) || 0;
                    const adm = Number(editRenewData.admissionCharges) || 0;
                    setEditRenewData({
                      ...editRenewData,
                      price: e.target.value,
                      balance: Math.max(0, price + adm - disc - paid),
                    });
                  }}
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">Discount Amount</label>
                <input
                  type="number"
                  value={editRenewData.discountAmount ?? ""}
                  className="w-full border p-2 rounded text-sm"
                  onChange={(e) => {
                    const disc = Number(e.target.value) || 0;
                    const price = Number(editRenewData.price) || 0;
                    const paid = Number(editRenewData.amountPaid) || 0;
                    const adm = Number(editRenewData.admissionCharges) || 0;
                    setEditRenewData({
                      ...editRenewData,
                      discountAmount: e.target.value,
                      balance: Math.max(0, price + adm - disc - paid),
                    });
                  }}
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">Amount Paid</label>
                <input
                  type="number"
                  value={editRenewData.amountPaid ?? ""}
                  className="w-full border p-2 rounded text-sm"
                  onChange={(e) => {
                    const paid = Number(e.target.value) || 0;
                    const price = Number(editRenewData.price) || 0;
                    const disc = Number(editRenewData.discountAmount) || 0;
                    const adm = Number(editRenewData.admissionCharges) || 0;
                    setEditRenewData({
                      ...editRenewData,
                      amountPaid: e.target.value,
                      balance: Math.max(0, price + adm - disc - paid),
                    });
                  }}
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">Balance</label>
                <input
                  type="number"
                  value={editRenewData.balance ?? ""}
                  className="w-full border p-2 rounded text-sm"
                  onChange={(e) =>
                    setEditRenewData({
                      ...editRenewData,
                      balance: e.target.value,
                    })
                  }
                />
              </div>

              <div className="col-span-2">
                <label className="text-xs font-semibold text-gray-700 block mb-1">Remarks</label>
                <textarea
                  className="w-full border p-2 rounded text-sm"
                  rows={2}
                  value={editRenewData.remarks || ""}
                  onChange={(e) =>
                    setEditRenewData({
                      ...editRenewData,
                      remarks: e.target.value,
                    })
                  }
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-5 border-t pt-3">
              <button
                onClick={() => {
                  setEditRenewId(null);
                  setEditRenewData(null);
                }}
                className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-md text-sm font-medium transition cursor-pointer"
              >
                Cancel
              </button>

              <button
                onClick={handleEditRenewSave}
                className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-md text-sm font-semibold transition cursor-pointer"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 💳 Edit Payment Entry Modal */}
      {editPaymentId && editPaymentData && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[9999] p-4">
          <div className="bg-white w-full max-w-md p-5 rounded-xl shadow-2xl">
            <div className="flex justify-between items-center mb-4 border-b pb-2">
              <h3 className="text-lg font-bold text-yellow-700">Edit Payment Entry</h3>
              <button
                onClick={() => {
                  setEditPaymentId(null);
                  setEditPaymentData(null);
                }}
                className="text-gray-400 hover:text-gray-600 font-bold text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">Date</label>
                <input
                  type="date"
                  className="w-full border p-2 rounded text-sm"
                  value={editPaymentData.date || ""}
                  onChange={(e) =>
                    setEditPaymentData({ ...editPaymentData, date: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">Amount (₹)</label>
                <input
                  type="number"
                  className="w-full border p-2 rounded text-sm"
                  value={editPaymentData.amount ?? ""}
                  onChange={(e) =>
                    setEditPaymentData({ ...editPaymentData, amount: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">Payment Mode</label>
                <select
                  className="w-full border p-2 rounded text-sm"
                  value={editPaymentData.mode || "Cash"}
                  onChange={(e) =>
                    setEditPaymentData({ ...editPaymentData, mode: e.target.value })
                  }
                >
                  <option value="Cash">Cash</option>
                  <option value="UPI">UPI</option>
                  <option value="GPay">GPay</option>
                  <option value="PhonePe">PhonePe</option>
                  <option value="Card">Card</option>
                  <option value="Net Banking">Net Banking</option>
                  <option value="Cheque">Cheque</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">Note</label>
                <input
                  type="text"
                  className="w-full border p-2 rounded text-sm"
                  value={editPaymentData.note || ""}
                  onChange={(e) =>
                    setEditPaymentData({ ...editPaymentData, note: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-5 border-t pt-3">
              <button
                onClick={() => {
                  setEditPaymentId(null);
                  setEditPaymentData(null);
                }}
                className="px-4 py-1.5 text-sm bg-gray-200 hover:bg-gray-300 rounded font-medium cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleEditPaymentSave}
                className="px-4 py-1.5 text-sm bg-yellow-600 hover:bg-yellow-700 text-white rounded font-medium cursor-pointer"
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
        {getProfileImage(selectedClient) ? (
          <img
            src={getProfileImage(selectedClient)!}
            alt="Profile"
            className="w-28 h-28 rounded-full border-4 border-yellow-400 object-cover"
          />
        ) : (
          <div className="w-28 h-28 rounded-full border-4 border-yellow-400 bg-yellow-100 flex items-center justify-center text-4xl font-bold text-yellow-600">
            {selectedClient.client?.charAt(0)?.toUpperCase() || "?"}
          </div>
        )}
        <div>
          <h3 className="text-2xl font-bold text-gray-800">
            {selectedClient.client}
          </h3>
          <p className="text-sm text-gray-500">
            Member ID: {selectedClient.memberId}
          </p>
          {(() => {
            let effectiveEndDate = selectedClient.endDate?.trim();
            if (!effectiveEndDate && Array.isArray(selectedClient.renewalHistory) && selectedClient.renewalHistory.length > 0) {
              const latest = [...selectedClient.renewalHistory].reverse().find((r) => r.endDate?.trim());
              if (latest) effectiveEndDate = latest.endDate.trim();
            }
            let isAct = selectedClient.status === "Active";
            let displayStatus = selectedClient.status || "Inactive";
            if (effectiveEndDate) {
              const end = new Date(effectiveEndDate);
              if (!isNaN(end.getTime())) {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                end.setHours(0, 0, 0, 0);
                isAct = end.getTime() >= today.getTime();
                displayStatus = isAct ? "Active" : "Inactive";
              }
            }
            return (
              <span className={`text-sm font-semibold ${
                isAct ? "text-green-600" : "text-red-600"
              }`}>
                {displayStatus}
              </span>
            );
          })()}
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
          <p className="bg-yellow-50 border border-yellow-200 rounded px-2 py-1 mt-1">
            <strong>📅 Joining Date:</strong>{" "}
            <span className="text-yellow-800 font-semibold">
              {selectedClient.originalJoiningDate || selectedClient.joiningDate || "-"}
            </span>
          </p>
        </div>

        {/* 📦 Package Details */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-yellow-700">Package Details</h4>
            <button
              onClick={() => openEditPackageModal(selectedClient)}
              className="text-xs bg-purple-600 hover:bg-purple-700 text-white font-medium px-2.5 py-1 rounded shadow-sm transition cursor-pointer flex items-center gap-1"
              title="Edit current package & membership details"
            >
              ✏️ Edit Package
            </button>
          </div>
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
                  <th className="p-2 border">Discount</th>
                  <th className="p-2 border">Action</th>
                </tr>
              </thead>
              <tbody>
                {[...selectedClient.renewalHistory].reverse().map((r, index) => {
                  const rId = r._id || r.id || `${selectedClient._id || (selectedClient as any).id}-renew-${index}`;
                  const cId = selectedClient._id || (selectedClient as any).id;
                  return (
                    <tr key={rId}>
                      <td className="p-2 border">{r.date?.split("T")[0] || "-"}</td>
                      <td className="p-2 border">{r.joiningDate ? r.joiningDate.split("T")[0] : "-"}</td>
                      <td className="p-2 border">{r.endDate ? r.endDate.split("T")[0] : "-"}</td>
                      <td className="p-2 border">{r.package || "-"}</td>
                      <td className="p-2 border">₹{r.price ?? 0}</td>
                      <td className="p-2 border">₹{r.amountPaid ?? 0}</td>
                      <td className="p-2 border">₹{r.discountAmount ?? r.discount ?? 0}</td>
                      <td className="p-2 border text-center space-x-1">
                        <button
                          onClick={() => openRenewalEditModal(r, cId)}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-2.5 py-1 rounded text-xs transition cursor-pointer font-medium"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteRenew(rId, cId)}
                          className="bg-red-600 hover:bg-red-700 text-white px-2.5 py-1 rounded text-xs transition cursor-pointer font-medium"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })}
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
                  <th className="p-2 border">Action</th>
                </tr>
              </thead>
              <tbody>
                {selectedClient.paymentHistory.map((p, i) => {
                  const pId = p._id || p.id || `${selectedClient._id || (selectedClient as any).id}-pay-${i}`;
                  const cId = selectedClient._id || (selectedClient as any).id;
                  return (
                    <tr key={pId}>
                      <td className="p-2 border">{p.date?.split("T")[0] || "-"}</td>
                      <td className="p-2 border">₹{p.amount ?? 0}</td>
                      <td className="p-2 border">{p.mode || "-"}</td>
                      <td className="p-2 border">{p.note || "-"}</td>
                      <td className="p-2 border text-center space-x-1">
                        <button
                          onClick={() => openPaymentEditModal(p, pId, cId)}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-2.5 py-1 rounded text-xs transition cursor-pointer font-medium"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeletePayment(pId, cId)}
                          className="bg-red-600 hover:bg-red-700 text-white px-2.5 py-1 rounded text-xs transition cursor-pointer font-medium"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })}
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

      {/* 📄 WhatsApp Attachment Dialog */}
      {renewalSuccess && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white max-w-md w-full rounded-2xl shadow-2xl overflow-hidden border border-yellow-200">
            <div className="bg-gradient-to-r from-yellow-500 to-amber-500 p-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-base">
                <span>✅</span>
                <span>Renewal Success & Invoice Ready</span>
              </div>
              <button
                onClick={() => setRenewalSuccess(null)}
                className="text-white hover:text-red-200 text-xl font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4 text-sm">
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 text-yellow-900 flex justify-between items-center gap-3">
                <div>
                  <div className="font-bold text-base mb-0.5">
                    {renewalSuccess.client.client} (ID: {renewalSuccess.client.memberId})
                  </div>
                  <div className="text-xs text-yellow-800">
                    Renewed for <b>{renewalSuccess.client.package}</b> · Amount Paid: <b>₹{renewalSuccess.client.amountPaid}</b>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    openEditPackageModal(renewalSuccess.client);
                  }}
                  className="bg-yellow-600 hover:bg-yellow-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg shadow-sm transition whitespace-nowrap cursor-pointer flex items-center gap-1"
                  title="Edit Package & Membership"
                >
                  ✏️ Edit Package
                </button>
              </div>

              <div className="space-y-2 bg-gray-50 border border-gray-100 rounded-xl p-3 text-xs text-gray-700">
                <div className="font-semibold text-gray-900 flex items-center gap-1.5">
                  <span>📎</span>
                  <span>Invoice PDF: <b>{renewalSuccess.pdfFile.name}</b></span>
                </div>
                <p className="text-gray-500">
                  The invoice PDF has been downloaded to your downloads folder. In WhatsApp, click <b>📎 (Attach Document)</b> or drag & drop the downloaded PDF to send it as an attached document.
                </p>
              </div>

              <div className="space-y-2 pt-2">
                {navigator.canShare && (
                  <button
                    type="button"
                    onClick={async () => {
                      if (navigator.canShare && navigator.canShare({ files: [renewalSuccess.pdfFile] })) {
                        try {
                          await navigator.share({
                            files: [renewalSuccess.pdfFile],
                            title: `Invoice - ${renewalSuccess.client.client}`,
                            text: renewalSuccess.message,
                          });
                        } catch (e) {}
                      }
                    }}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 transition shadow-sm cursor-pointer"
                  >
                    <span>📤 Share PDF File Directly to WhatsApp</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    window.open(renewalSuccess.waLink, "_blank");
                  }}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 transition shadow-sm cursor-pointer"
                >
                  <span>💬 Open Client Chat Directly in WhatsApp Web</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const appUrl = getWhatsAppDesktopAppUrl(renewalSuccess.phone, renewalSuccess.message);
                    window.location.href = appUrl;
                  }}
                  className="w-full bg-green-700 hover:bg-green-800 text-white font-semibold py-2 px-4 rounded-xl flex items-center justify-center gap-2 transition shadow-sm cursor-pointer text-xs"
                >
                  <span>💻 Open in WhatsApp Desktop App</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    generateCurrentPackageBill(renewalSuccess.client);
                  }}
                  className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2 px-4 rounded-xl flex items-center justify-center gap-1.5 transition text-xs cursor-pointer"
                >
                  <span>📥 Re-download Invoice PDF</span>
                </button>
              </div>
            </div>

            <div className="bg-gray-50 px-5 py-3 flex justify-end border-t border-gray-100">
              <button
                type="button"
                onClick={() => setRenewalSuccess(null)}
                className="text-xs font-semibold text-gray-600 hover:text-gray-900 px-3 py-1.5 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Clients;
