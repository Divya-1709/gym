import React, { useState, useEffect, useRef, useMemo } from "react";
import axios from "axios";
import {
  UserPlus,
  HelpCircle,
  Users,
  UserX,
  UserCheck,
  IndianRupee,
  Dumbbell,
  LucideIcon,
  X,
  Search,
  Calendar,
  RefreshCw,
  Receipt,
} from "lucide-react";
import { API_URI } from "../api/api";
import { openDirectWhatsApp } from "../utils/whatsapp";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  Legend,
} from "recharts";

export interface GymBill {
  _id: string;
  memberId?: string;
  client?: string;
  contactNumber?: string;
  status?: string;
  createdAt?: string;
  amountPaid?: number;
  balance?: number;
  totalPaidIncludingRenewals?: number;
  dateOfBirth?: string;
  plan?: string;
  package?: string;
  joiningDate?: string;
  endDate?: string;
}

interface DashboardProps {
  onNavigateToRenewal?: (client: GymBill) => void;
}

interface PTSession {
  _id?: string;
  id: string;
  clientName?: string;
  price: number;
  createdAt?: string;
}

interface Inquiry {
  _id: string;
  name?: string;
  phone?: string;
  createdAt?: string;
  status?: string;
}

interface Followup {
  _id: string;
  clientName?: string;
  client?: string;
  status?: string;
  scheduleDate?: string;
  followupDate?: string;
}

interface Stat {
  label: string;
  value: number;
  icon: LucideIcon;
  isCurrency?: boolean;
  highlight?: boolean;
  key: string;
}

const Dashboard: React.FC<DashboardProps> = ({ onNavigateToRenewal }) => {
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [birthdays, setBirthdays] = useState<any[]>([]);

  // Raw data storage for modal drawer
  const [rawGymBills, setRawGymBills] = useState<GymBill[]>([]);
  const [rawPTSessions, setRawPTSessions] = useState<PTSession[]>([]);
  const [rawInquiries, setRawInquiries] = useState<Inquiry[]>([]);
  const [rawFollowups, setRawFollowups] = useState<Followup[]>([]);

  // Modal drawer states
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [modalItems, setModalItems] = useState<any[]>([]);
  const [modalSearch, setModalSearch] = useState("");
  const [activeStatKey, setActiveStatKey] = useState("");

  // 🔍 Global Common Client Search State
  const [clientSearchQuery, setClientSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const searchedClients = useMemo(() => {
    const query = clientSearchQuery.trim().toLowerCase();
    if (!query) return [];
    return rawGymBills.filter((c) => {
      const name = (c.client || "").toLowerCase();
      const phone = (c.contactNumber || "").toLowerCase();
      const memberId = (c.memberId || "").toLowerCase();
      const pkg = (c.package || c.plan || "").toLowerCase();
      return (
        name.includes(query) ||
        phone.includes(query) ||
        memberId.includes(query) ||
        pkg.includes(query)
      );
    });
  }, [clientSearchQuery, rawGymBills]);

  const handleSelectClientForRenewal = (client: GymBill) => {
    setIsSearchOpen(false);
    setClientSearchQuery("");
    if (onNavigateToRenewal) {
      onNavigateToRenewal(client);
    }
  };

  const fetchBirthdays = async () => {
    try {
      const res = await axios.get(`${API_URI}/gymbill`);
      const data = res.data;

      const today = new Date();
      const todayMonth = today.getMonth();
      const todayDate = today.getDate();

      const todayBirthdays = data.filter((user: any) => {
        if (!user.dateOfBirth) return false;

        const dob = new Date(user.dateOfBirth);

        return (
          dob.getMonth() === todayMonth &&
          dob.getDate() === todayDate
        );
      });

      setBirthdays(todayBirthdays);
    } catch (err) {
      console.error(err);
    }
  };

  const handleTriggerWishes = async () => {
    try {
      const res = await axios.post(`${API_URI}/gymbill/trigger-wishes`);
      alert(`🎯 Wishes Job Executed! Processed ${res.data.count || 0} wish(es).`);
    } catch (err: any) {
      console.error("Error triggering wishes:", err);
      alert("Failed to run wishes job.");
    }
  };

  const handleTriggerExpiryReminders = async () => {
    try {
      const res = await axios.post(`${API_URI}/gymbill/trigger-expiry-reminders`);
      alert(`🔔 Expiry Reminders Job Executed! Sent ${res.data.count || 0} reminder(s).`);
    } catch (err: any) {
      console.error("Error triggering expiry reminders:", err);
      alert("Failed to run expiry reminders job.");
    }
  };

  const sendWish = (name: string, phone: string) => {
    const message = `🎉 Happy Birthday ${name}! Stay strong and keep crushing your fitness goals 💪🔥\n\n— Elite Fitness`;
    openDirectWhatsApp(phone, message);
  };

  const [totalClients, setTotalClients] = useState(0);
  const [activeCount, setActiveCount] = useState(0);
  const [inactiveCount, setInactiveCount] = useState(0);
  const [newClients, setNewClients] = useState(0);
  const [inquiryCount, setInquiryCount] = useState(0);
  const [followupCount, setFollowupCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const [totalAmountPaid, setTotalAmountPaid] = useState(0);
  const [totalPendingBalance, setTotalPendingBalance] = useState(0);
  const [monthlyCollection, setMonthlyCollection] = useState(0);
  const [monthlyPTCollection, setMonthlyPTCollection] = useState(0);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [rawExpenses, setRawExpenses] = useState<any[]>([]);

  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const [monthlyGraph, setMonthlyGraph] = useState<any[]>([]);

  const fetchStats = async () => {
    try {
      setLoading(true);

      const from = fromDate ? new Date(fromDate) : new Date("1970-01-01");
      const to = toDate ? new Date(toDate) : new Date();
      to.setHours(23, 59, 59, 999);

      // 1. Fetch Gym Bills
      const gymbillRes = await axios.get<GymBill[]>(`${API_URI}/gymbill`);
      const gymbills: GymBill[] = Array.isArray(gymbillRes.data)
        ? gymbillRes.data
        : [];
      setRawGymBills(gymbills);

      // 2. Client Status & Totals (1072 total, 143 active, 929 inactive)
      const active = gymbills.filter((g) => (g.status || "").toLowerCase() === "active").length;
      const inactive = gymbills.filter((g) => (g.status || "").toLowerCase() === "inactive").length;
      setActiveCount(active);
      setInactiveCount(inactive);
      setTotalClients(gymbills.length);

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const newClientsCount = gymbills.filter((g) => {
        const dStr = g.joiningDate || g.createdAt;
        if (!dStr) return false;
        const d = new Date(dStr);
        return d >= thirtyDaysAgo;
      }).length;
      setNewClients(newClientsCount);

      // 3. Financial Totals (Paid & Balance)
      const getClientPaid = (b: GymBill) => {
        if (typeof b.totalPaidIncludingRenewals === "number" && b.totalPaidIncludingRenewals > 0) {
          return b.totalPaidIncludingRenewals;
        }
        if (typeof b.amountPaid === "number" && b.amountPaid > 0) {
          return b.amountPaid;
        }
        if (typeof b.price === "number" && b.price > 0) {
          const bal = typeof b.balance === "number" ? b.balance : 0;
          return Math.max(0, b.price - bal);
        }
        return 0;
      };

      const totalPaid = gymbills.reduce((sum, b) => sum + getClientPaid(b), 0);
      const totalBal = gymbills.reduce((sum, b) => sum + (b.balance || 0), 0);
      setTotalAmountPaid(totalPaid);
      setTotalPendingBalance(totalBal);

      // 4. Monthly Gym Collection (selected month/year)
      const monthlyGymBills = gymbills.filter((b) => {
        const dStr = b.joiningDate || b.createdAt;
        if (!dStr) return false;
        const d = new Date(dStr);
        return d.getFullYear() === selectedYear && d.getMonth() === selectedMonth;
      });
      const gymMonthTotal = monthlyGymBills.reduce(
        (sum, b) => sum + getClientPaid(b),
        0
      );
      setMonthlyCollection(gymMonthTotal);

      // 5. PT Sessions (with fallback endpoint and graceful error catch)
      let ptSessions: PTSession[] = [];
      try {
        const ptRes = await axios.get<PTSession[]>(`${API_URI}/pts`).catch(() =>
          axios.get<PTSession[]>(`${API_URI}/personaltrainings`).catch(() => ({ data: [] }))
        );
        ptSessions = Array.isArray(ptRes?.data) ? ptRes.data : [];
        setRawPTSessions(ptSessions);

        const monthlyPTBills = ptSessions.filter((p) => {
          if (!p.createdAt) return false;
          const d = new Date(p.createdAt);
          return d.getFullYear() === selectedYear && d.getMonth() === selectedMonth;
        });
        const ptMonthTotal = monthlyPTBills.reduce(
          (sum, p) => sum + (p.price || 0),
          0
        );
        setMonthlyPTCollection(ptMonthTotal);
      } catch (ptErr) {
        console.warn("PT sessions fetch issue:", ptErr);
      }

      // 6. Monthly Graph (gym + PT)
      const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
      const yearlyData = Array.from({ length: 12 }, (_, m) => {
        const gymRows = gymbills.filter((b) => {
          const dStr = b.joiningDate || b.createdAt;
          if (!dStr) return false;
          const d = new Date(dStr);
          return d.getFullYear() === selectedYear && d.getMonth() === m;
        });
        const ptRows = ptSessions.filter((p) => {
          if (!p.createdAt) return false;
          const d = new Date(p.createdAt);
          return d.getFullYear() === selectedYear && d.getMonth() === m;
        });
        return {
          month: MONTHS[m],
          revenue: gymRows.reduce((sum, b) => sum + getClientPaid(b), 0),
          ptRevenue: ptRows.reduce((sum, p) => sum + (p.price || 0), 0),
        };
      });
      setMonthlyGraph(yearlyData);

      // 7. Expenses
      try {
        const expensesRes = await axios.get<any[]>(`${API_URI}/expenses`).catch(() => ({ data: [] }));
        const expensesArray = Array.isArray(expensesRes?.data) ? expensesRes.data : [];
        setRawExpenses(expensesArray);
        const expTotal = expensesArray.reduce((sum: number, e: any) => sum + (parseFloat(e.amount) || 0), 0);
        setTotalExpenses(expTotal);
      } catch (expErr) {
        console.warn("Expenses fetch issue:", expErr);
      }

      // 8. Inquiries
      try {
        const inquiriesRes = await axios.get<Inquiry[]>(`${API_URI}/inquiries`).catch(() => ({ data: [] }));
        const inquiriesArray = Array.isArray(inquiriesRes?.data) ? inquiriesRes.data : [];
        setRawInquiries(inquiriesArray);

        setInquiryCount(
          inquiriesArray.filter((i) => {
            const created = i.createdAt ? new Date(i.createdAt) : null;
            return created && created >= from && created <= to;
          }).length
        );
      } catch (inqErr) {
        console.warn("Inquiries fetch issue:", inqErr);
      }

      // 8. Followups
      try {
        const followupsRes = await axios.get<Followup[]>(`${API_URI}/followups`).catch(() => ({ data: [] }));
        const followupArray = Array.isArray(followupsRes?.data) ? followupsRes.data : [];
        setRawFollowups(followupArray);

        setFollowupCount(followupArray.filter((f) => (f.status || "").toLowerCase() === "pending").length);
      } catch (folErr) {
        console.warn("Followups fetch issue:", folErr);
      }
    } catch (err) {
      console.error("Dashboard stats fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [fromDate, toDate, selectedMonth, selectedYear]);

  useEffect(() => {
    fetchBirthdays();
  }, []);

  const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];

  const stats: Stat[] = [
    { key: "monthly_gym", label: `Monthly Gym Collection (${MONTH_NAMES[selectedMonth]} ${selectedYear})`, value: monthlyCollection, icon: IndianRupee, isCurrency: true, highlight: true },
    { key: "monthly_pt", label: `Monthly PT Collection (${MONTH_NAMES[selectedMonth]} ${selectedYear})`, value: monthlyPTCollection, icon: Dumbbell, isCurrency: true, highlight: true },
    { key: "total_revenue", label: "Total Revenue Collected", value: totalAmountPaid, icon: UserCheck, isCurrency: true },
    { key: "total_pending", label: "Total Pending Balance", value: totalPendingBalance, icon: UserX, isCurrency: true },
    { key: "total_expenses", label: "Total Expenses", value: totalExpenses, icon: Receipt, isCurrency: true },
    { key: "total_clients", label: "Total Clients", value: totalClients, icon: Users },
    { key: "new_clients", label: "New Clients (Last 30 Days)", value: newClients, icon: UserPlus },
    { key: "active_clients", label: "Active Clients", value: activeCount, icon: Users },
    { key: "inactive_clients", label: "Inactive Clients", value: inactiveCount, icon: UserX },
    { key: "pending_enquiries", label: "Pending Enquiries", value: inquiryCount, icon: HelpCircle },
    { key: "follow_ups", label: "Follow-ups", value: followupCount, icon: UserCheck },
  ];

  const handleCardClick = (stat: Stat) => {
    setActiveStatKey(stat.key);
    setModalTitle(stat.label);
    setModalSearch("");

    let items: any[] = [];
    const from = fromDate ? new Date(fromDate) : new Date("1970-01-01");
    const to = toDate ? new Date(toDate) : new Date();
    to.setHours(23, 59, 59, 999);

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    switch (stat.key) {
      case "monthly_gym":
        items = rawGymBills.filter((b) => {
          const dStr = b.joiningDate || b.createdAt;
          if (!dStr) return false;
          const d = new Date(dStr);
          return d.getFullYear() === selectedYear && d.getMonth() === selectedMonth;
        });
        break;
      case "monthly_pt":
        items = rawPTSessions.filter((p) => {
          if (!p.createdAt) return false;
          const d = new Date(p.createdAt);
          return d.getFullYear() === selectedYear && d.getMonth() === selectedMonth;
        });
        break;
      case "total_revenue":
        items = rawGymBills.filter((b) => (b.totalPaidIncludingRenewals || b.amountPaid || 0) > 0);
        break;
      case "total_pending":
        items = rawGymBills.filter((b) => (b.balance || 0) > 0);
        break;
      case "total_clients":
        items = rawGymBills;
        break;
      case "new_clients":
        items = rawGymBills.filter((g) => {
          const dStr = g.joiningDate || g.createdAt;
          if (!dStr) return false;
          const d = new Date(dStr);
          return d >= thirtyDaysAgo;
        });
        break;
      case "active_clients":
        items = rawGymBills.filter((g) => (g.status || "").toLowerCase() === "active");
        break;
      case "inactive_clients":
        items = rawGymBills.filter((g) => (g.status || "").toLowerCase() === "inactive");
        break;
      case "pending_enquiries":
        items = rawInquiries.filter((i) => {
          const created = i.createdAt ? new Date(i.createdAt) : null;
          return created && created >= from && created <= to;
        });
        break;
      case "follow_ups":
        items = rawFollowups.filter((f) => (f.status || "").toLowerCase() === "pending");
        break;
      case "total_expenses":
        items = rawExpenses;
        break;
      default:
        items = [];
    }

    setModalItems(items);
    setModalOpen(true);
  };

  const filteredModalItems = modalItems.filter((item) => {
    if (!modalSearch) return true;
    const searchLower = modalSearch.toLowerCase();
    return Object.values(item).some((val) =>
      String(val ?? "").toLowerCase().includes(searchLower)
    );
  });

 return (
  <div className="flex-1 bg-white min-h-screen text-sm px-4 sm:px-6 md:px-8 pb-10">
    {/* Top Header with Title and Common Client Search */}
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mt-6 mb-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-yellow-700">
          Dashboard
        </h1>
        <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
          Overview & Direct Client Renewal Access
        </p>
      </div>

      {/* 🔍 Global Common Search Bar */}
      <div ref={searchRef} className="relative w-full md:w-96 lg:w-[450px]">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-yellow-600">
            <Search size={18} />
          </div>
          <input
            type="text"
            value={clientSearchQuery}
            onChange={(e) => {
              setClientSearchQuery(e.target.value);
              setIsSearchOpen(true);
            }}
            onFocus={() => setIsSearchOpen(true)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && searchedClients.length > 0) {
                handleSelectClientForRenewal(searchedClients[0]);
              } else if (e.key === "Escape") {
                setIsSearchOpen(false);
              }
            }}
            placeholder="Search client by name, mobile, or member ID..."
            className="w-full pl-10 pr-10 py-2.5 bg-yellow-50/70 hover:bg-yellow-50 focus:bg-white text-gray-800 placeholder-gray-400 border border-yellow-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 text-sm transition-all shadow-sm"
          />
          {clientSearchQuery && (
            <button
              onClick={() => {
                setClientSearchQuery("");
                setIsSearchOpen(false);
              }}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
              title="Clear search"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* 📋 Live Search Dropdown */}
        {isSearchOpen && clientSearchQuery.trim().length > 0 && (
          <div className="absolute left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl border border-yellow-200 z-50 max-h-96 overflow-y-auto overflow-x-hidden divide-y divide-gray-100">
            <div className="px-4 py-2 bg-yellow-50 flex items-center justify-between text-xs text-yellow-800 font-semibold sticky top-0 z-10 border-b border-yellow-100">
              <span>Matching Clients ({searchedClients.length})</span>
              <span className="text-[11px] text-yellow-600 font-normal">Click to Renew</span>
            </div>

            {searchedClients.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                <UserX size={28} className="mx-auto text-gray-400 mb-2" />
                <p className="font-medium text-gray-700 text-sm">No clients found</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  No matching client found for "{clientSearchQuery}"
                </p>
              </div>
            ) : (
              searchedClients.map((client) => (
                <div
                  key={client._id}
                  onClick={() => handleSelectClientForRenewal(client)}
                  className="px-4 py-3 hover:bg-yellow-50/80 cursor-pointer transition-colors flex items-center justify-between gap-3 group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-500 flex items-center justify-center text-white font-bold text-sm shadow-sm flex-shrink-0 group-hover:scale-105 transition-transform">
                      {client.client ? client.client.charAt(0).toUpperCase() : "C"}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-800 text-sm truncate group-hover:text-yellow-700 transition-colors">
                          {client.client || "Unnamed Client"}
                        </span>
                        {client.memberId && (
                          <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded font-mono">
                            #{client.memberId}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5 flex-wrap">
                        {client.contactNumber && (
                          <span className="flex items-center gap-1">
                            📱 {client.contactNumber}
                          </span>
                        )}
                        {(client.package || client.plan) && (
                          <span className="truncate max-w-[120px] text-gray-400">
                            • {client.package || client.plan}
                          </span>
                        )}
                        {client.endDate && (
                          <span className="text-gray-400">
                            • Exp: {new Date(client.endDate).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span
                      className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${
                        client.status === "Active"
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {client.status || "Unknown"}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectClientForRenewal(client);
                      }}
                      className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg bg-yellow-500 text-white group-hover:bg-yellow-600 shadow-sm transition"
                    >
                      Renew ➔
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>

    {/* 🗓️ Sleek Date Filter & Control Bar */}
    <div className="bg-gradient-to-r from-amber-50/90 via-yellow-50/50 to-white border border-yellow-200/90 rounded-2xl p-4 sm:p-5 mb-8 shadow-xs">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Left: Filter Title & Date Pickers */}
        <div className="flex flex-wrap items-center gap-3 sm:gap-4">
          <div className="flex items-center gap-2.5 text-yellow-900 font-semibold text-sm">
            <div className="w-8 h-8 rounded-xl bg-yellow-100/90 flex items-center justify-center text-yellow-700 shadow-2xs border border-yellow-200/60">
              <Calendar size={16} />
            </div>
            <span>Date Range:</span>
          </div>

          {/* From Date */}
          <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-yellow-200/90 shadow-2xs hover:border-yellow-400 focus-within:ring-2 focus-within:ring-yellow-400/40 focus-within:border-yellow-400 transition">
            <span className="text-xs font-semibold text-yellow-800">From</span>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="text-xs sm:text-sm text-gray-700 bg-transparent focus:outline-none cursor-pointer"
            />
          </div>

          {/* To Date */}
          <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-yellow-200/90 shadow-2xs hover:border-yellow-400 focus-within:ring-2 focus-within:ring-yellow-400/40 focus-within:border-yellow-400 transition">
            <span className="text-xs font-semibold text-yellow-800">To</span>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="text-xs sm:text-sm text-gray-700 bg-transparent focus:outline-none cursor-pointer"
            />
          </div>

          {/* Clear Dates */}
          {(fromDate || toDate) && (
            <button
              type="button"
              onClick={() => {
                setFromDate("");
                setToDate("");
              }}
              className="inline-flex items-center gap-1 text-xs text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100/80 px-2.5 py-1.5 rounded-lg border border-red-200 transition font-medium"
              title="Reset date filter"
            >
              <X size={13} />
              <span>Clear</span>
            </button>
          )}
        </div>

        {/* Right: Quick Presets & Refresh Action */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {/* Quick Preset Buttons */}
          <div className="inline-flex items-center rounded-xl bg-yellow-100/70 p-1 border border-yellow-200/70 text-xs">
            <button
              type="button"
              onClick={() => {
                const today = new Date().toISOString().split("T")[0];
                setFromDate(today);
                setToDate(today);
              }}
              className="px-2.5 py-1 rounded-lg font-medium text-yellow-800 hover:bg-white hover:shadow-2xs transition"
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => {
                const now = new Date();
                const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
                const today = now.toISOString().split("T")[0];
                setFromDate(firstDay);
                setToDate(today);
              }}
              className="px-2.5 py-1 rounded-lg font-medium text-yellow-800 hover:bg-white hover:shadow-2xs transition"
            >
              This Month
            </button>
            <button
              type="button"
              onClick={() => {
                const now = new Date();
                const thirtyDays = new Date();
                thirtyDays.setDate(now.getDate() - 30);
                setFromDate(thirtyDays.toISOString().split("T")[0]);
                setToDate(now.toISOString().split("T")[0]);
              }}
              className="px-2.5 py-1 rounded-lg font-medium text-yellow-800 hover:bg-white hover:shadow-2xs transition"
            >
              Last 30 Days
            </button>
            <button
              type="button"
              onClick={() => {
                setFromDate("");
                setToDate("");
              }}
              className={`px-2.5 py-1 rounded-lg font-medium transition ${
                !fromDate && !toDate
                  ? "bg-white text-yellow-900 shadow-2xs font-semibold"
                  : "text-yellow-700 hover:bg-white"
              }`}
            >
              All Time
            </button>
          </div>

          {/* Refresh Action */}
          <button
            onClick={fetchStats}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-600 hover:to-amber-600 active:scale-95 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-xs hover:shadow transition disabled:opacity-50"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            <span>{loading ? "Refreshing..." : "Refresh"}</span>
          </button>
        </div>
      </div>
    </div>

    {/* Summary Statistics */}
    <h2 className="text-lg font-bold text-yellow-800 mb-4 flex items-center gap-2">
      Summary Statistics
    </h2>

    {loading ? (
      <div className="text-center text-yellow-600 py-10 font-semibold">
        Loading data...
      </div>
    ) : (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 mb-10">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              onClick={() => handleCardClick(stat)}
              className={`cursor-pointer border rounded-2xl p-4 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition duration-200 ${
                stat.highlight
                  ? "bg-gradient-to-br from-yellow-400 to-yellow-500 border-yellow-400 shadow-yellow-100"
                  : "bg-white border-gray-100 hover:border-yellow-200"
              }`}
            >
              <div className="flex justify-between items-start gap-3">
                <div className="min-w-0 flex-1">
                  <p className={`text-xs font-medium mb-1.5 line-clamp-2 ${ stat.highlight ? "text-yellow-900" : "text-yellow-700" }`}>
                    {stat.label}
                  </p>
                  <p className={`text-2xl sm:text-3xl font-bold truncate ${ stat.highlight ? "text-white" : "text-gray-800" }`}>
                    {stat.isCurrency ? `₹${stat.value.toLocaleString("en-IN")}` : stat.value}
                  </p>
                </div>
                <div className={`p-2.5 rounded-xl flex-shrink-0 ${
                  stat.highlight ? "bg-white/20 text-white" : "bg-yellow-50 text-yellow-600"
                }`}>
                  <Icon size={24} />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    )}

<div className="bg-yellow-50 rounded-lg shadow-md border p-4 mb-10">
  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
    <h2 className="text-lg font-semibold text-yellow-700 flex items-center gap-2">
      🎂 Today's Birthdays
    </h2>
    <div className="flex flex-wrap gap-2">
      <button
        onClick={handleTriggerWishes}
        className="bg-yellow-600 hover:bg-yellow-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg shadow transition"
      >
        🚀 Run Birthday Wishes Now
      </button>
      <button
        onClick={handleTriggerExpiryReminders}
        className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg shadow transition flex items-center gap-1"
      >
        🔔 Run Subscription Expiry Reminders Now
      </button>
    </div>

  </div>

  {birthdays.length === 0 ? (
    <p className="text-gray-500">No birthdays today</p>
  ) : (
    <div className="space-y-3">
      {birthdays.map((b) => (
        <div
          key={b._id}
          className="flex justify-between items-center bg-white p-3 rounded-lg shadow hover:shadow-md transition"
        >
          {/* Client Info */}
          <div>
            <p className="font-semibold text-yellow-800">
              {b.client}
            </p>
            <p className="text-xs text-gray-500">
              {new Date(b.dateOfBirth).toLocaleDateString()}
            </p>
          </div>

          {/* Wish Button */}
          <button
            onClick={() => sendWish(b.client, b.contactNumber)}
            className="bg-yellow-500 text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-yellow-600 transition"
          >
            🎉 Wish
          </button>
        </div>
      ))}
    </div>
  )}
</div>

    {/* ----------------------------- */}
    {/* 📊 MONTHLY GRAPH SECTION      */}
    {/* ----------------------------- */}
   <div className="bg-white rounded-lg shadow-md border p-4 md:p-6 mb-10">

  <h2 className="text-base md:text-lg font-semibold text-yellow-800 mb-4">
    Monthly Revenue Overview
  </h2>

  {/* Filters */}
  <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-4">

    {/* Month */}
    <div className="w-full sm:w-auto">
      <label className="text-xs md:text-sm font-medium text-yellow-700 mb-1 block">
        Month
      </label>
      <select
        value={selectedMonth}
        onChange={(e) => setSelectedMonth(Number(e.target.value))}
        className="w-full sm:w-auto px-3 py-2 border rounded-lg"
      >
        {[
          "January","February","March","April","May","June",
          "July","August","September","October","November","December",
        ].map((m, i) => (
          <option key={i} value={i}>
            {m}
          </option>
        ))}
      </select>
    </div>

    {/* Year */}
    <div className="w-full sm:w-auto">
      <label className="text-xs md:text-sm font-medium text-yellow-700 mb-1 block">
        Year
      </label>
      <select
        value={selectedYear}
        onChange={(e) => setSelectedYear(Number(e.target.value))}
        className="w-full sm:w-auto px-3 py-2 border rounded-lg"
      >
        {Array.from({ length: 5 }, (_, i) => (
          <option key={i} value={2022 + i}>
            {2022 + i}
          </option>
        ))}
      </select>
    </div>

  </div>

  {/* Chart */}
  <div className="w-full h-[250px] sm:h-[300px] md:h-[350px]">
    <ResponsiveContainer width="100%" height={300} minWidth={100}>
      <BarChart data={monthlyGraph}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="month" tick={{ fontSize: 10 }} />
        <YAxis tick={{ fontSize: 10 }} />
        <Tooltip formatter={(value: number) => `₹${value.toLocaleString("en-IN")}`} />
        <Legend />
        <Bar dataKey="revenue" fill="#facc15" name="Gym Revenue (₹)" />
        <Bar dataKey="ptRevenue" fill="#f97316" name="PT Revenue (₹)" />
      </BarChart>
    </ResponsiveContainer>
  </div>

</div>

    {/* Modal Drawer for Stat Cards */}
    {modalOpen && (
      <div className="fixed inset-0 z-50 flex justify-end bg-black bg-opacity-50 transition-opacity">
        <div className="w-full max-w-4xl bg-white h-full shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out">
          {/* Modal Header */}
          <div className="px-6 py-4 border-b flex justify-between items-center bg-yellow-50">
            <div>
              <h2 className="text-xl font-bold text-yellow-800">{modalTitle}</h2>
              <p className="text-xs text-yellow-600">Total records: {modalItems.length}</p>
            </div>
            <button
              onClick={() => setModalOpen(false)}
              className="p-2 text-gray-500 hover:text-gray-700 rounded-full hover:bg-yellow-100 transition"
            >
              <X size={24} />
            </button>
          </div>

          {/* Modal Search Bar */}
          <div className="p-4 border-b bg-white flex items-center gap-2">
            <Search size={18} className="text-gray-400" />
            <input
              type="text"
              placeholder="Search records..."
              value={modalSearch}
              onChange={(e) => setModalSearch(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500"
            />
          </div>

          {/* Modal Table Content */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6">
            {filteredModalItems.length === 0 ? (
              <div className="text-center text-gray-500 py-12">No records found</div>
            ) : (
              <div className="overflow-x-auto border rounded-lg shadow-sm">
                <table className="min-w-full divide-y divide-gray-200 text-left text-sm">
                  <thead className="bg-yellow-50">
                    <tr>
                      <th className="px-4 py-3 font-semibold text-yellow-800">#</th>
                      {activeStatKey.includes("pt") ? (
                        <>
                          <th className="px-4 py-3 font-semibold text-yellow-800">Client / ID</th>
                          <th className="px-4 py-3 font-semibold text-yellow-800">Price (₹)</th>
                          <th className="px-4 py-3 font-semibold text-yellow-800">Date</th>
                        </>
                      ) : activeStatKey.includes("enquiries") ? (
                        <>
                          <th className="px-4 py-3 font-semibold text-yellow-800">Name</th>
                          <th className="px-4 py-3 font-semibold text-yellow-800">Phone</th>
                          <th className="px-4 py-3 font-semibold text-yellow-800">Date</th>
                        </>
                      ) : activeStatKey.includes("follow") ? (
                        <>
                          <th className="px-4 py-3 font-semibold text-yellow-800">Client</th>
                          <th className="px-4 py-3 font-semibold text-yellow-800">Status</th>
                          <th className="px-4 py-3 font-semibold text-yellow-800">Schedule Date</th>
                        </>
                      ) : (
                        <>
                          <th className="px-4 py-3 font-semibold text-yellow-800">Client</th>
                          <th className="px-4 py-3 font-semibold text-yellow-800">Contact</th>
                          <th className="px-4 py-3 font-semibold text-yellow-800">Status</th>
                          <th className="px-4 py-3 font-semibold text-yellow-800">Paid (₹)</th>
                          <th className="px-4 py-3 font-semibold text-yellow-800">Balance (₹)</th>
                          <th className="px-4 py-3 font-semibold text-yellow-800">Date</th>
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {filteredModalItems.map((item, index) => (
                      <tr key={item._id || item.id || index} className="hover:bg-yellow-50 transition">
                        <td className="px-4 py-3 text-gray-500">{index + 1}</td>
                        {activeStatKey.includes("pt") ? (
                          <>
                            <td className="px-4 py-3 font-medium text-gray-800">{item.clientName || item.id || "N/A"}</td>
                            <td className="px-4 py-3 font-semibold text-yellow-800">₹{(item.price || 0).toLocaleString("en-IN")}</td>
                            <td className="px-4 py-3 text-gray-600">{item.createdAt ? new Date(item.createdAt).toLocaleDateString() : "N/A"}</td>
                          </>
                        ) : activeStatKey.includes("enquiries") ? (
                          <>
                            <td className="px-4 py-3 font-medium text-gray-800">{item.name || "N/A"}</td>
                            <td className="px-4 py-3 text-gray-600">{item.phone || "N/A"}</td>
                            <td className="px-4 py-3 text-gray-600">{item.createdAt ? new Date(item.createdAt).toLocaleDateString() : "N/A"}</td>
                          </>
                        ) : activeStatKey.includes("follow") ? (
                          <>
                            <td className="px-4 py-3 font-medium text-gray-800">{item.clientName || item.client || "N/A"}</td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-1 rounded text-xs font-semibold ${item.status === "Pending" ? "bg-yellow-100 text-yellow-800" : "bg-green-100 text-green-800"}`}>
                                {item.status || "N/A"}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-gray-600">{item.scheduleDate || item.followupDate ? new Date(item.scheduleDate || item.followupDate).toLocaleDateString() : "N/A"}</td>
                          </>
                        ) : (
                          <>
                            <td className="px-4 py-3 font-medium text-gray-800">{item.client || "N/A"}</td>
                            <td className="px-4 py-3 text-gray-600">{item.contactNumber || "N/A"}</td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-1 rounded text-xs font-semibold ${item.status === "Active" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}>
                                {item.status || "N/A"}
                              </span>
                            </td>
                            <td className="px-4 py-3 font-semibold text-yellow-800">₹{(item.totalPaidIncludingRenewals || item.amountPaid || 0).toLocaleString("en-IN")}</td>
                            <td className="px-4 py-3 font-semibold text-red-600">₹{(item.balance || 0).toLocaleString("en-IN")}</td>
                            <td className="px-4 py-3 text-gray-600">{item.createdAt ? new Date(item.createdAt).toLocaleDateString() : "N/A"}</td>
                          </>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Modal Footer */}
          <div className="px-6 py-4 border-t bg-gray-50 flex justify-end">
            <button
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition text-sm font-medium"
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

export default Dashboard;
