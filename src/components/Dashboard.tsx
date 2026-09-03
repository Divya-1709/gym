import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  UserPlus,
  HelpCircle,
  Users,
  UserX,
  UserCheck,
  LucideIcon,
} from "lucide-react";
import { API_URI } from "../api/api";

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

interface GymBill {
  _id: string;
  status?: string;
  createdAt?: string;
  amountPaid?: number;
  balance?: number;
  totalPaidIncludingRenewals?: number;
}

interface Inquiry {
  _id: string;
  createdAt?: string;
}

interface Followup {
  _id: string;
  status?: string;
  scheduleDate?: string;
  followupDate?: string;
}

interface Stat {
  label: string;
  value: number;
  icon: LucideIcon;
}

const Dashboard: React.FC = () => {
  
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [birthdays, setBirthdays] = useState<any[]>([]);

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
  const message = `🎉 Happy Birthday ${name}! Stay strong and keep crushing your fitness goals 💪🔥`;

  // Remove spaces, +, special chars
  let formattedPhone = phone.replace(/\D/g, "");

  // Remove leading 0
  if (formattedPhone.startsWith("0")) {
    formattedPhone = formattedPhone.substring(1);
  }

  // Add India country code if missing
  if (!formattedPhone.startsWith("91")) {
    formattedPhone = "91" + formattedPhone;
  }

  const url = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`;

  window.open(url, "_blank");
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

  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const [monthlyGraph, setMonthlyGraph] = useState<any[]>([]);

  const fetchStats = async () => {
    try {
      setLoading(true);

      const from = fromDate ? new Date(fromDate) : new Date("1970-01-01");
      const to = toDate ? new Date(toDate) : new Date();
      to.setHours(23, 59, 59, 999);

      const gymbillRes = await axios.get<GymBill[]>(`${API_URI}/gymbill`)


      const gymbills: GymBill[] = Array.isArray(gymbillRes.data)
        ? gymbillRes.data
        : [];

      // TOTALS
      const totalPaid = gymbills.reduce(
  (sum, b) => sum + (b.totalPaidIncludingRenewals || 0),
  0
);

      const totalBal = gymbills.reduce((sum, b) => sum + (b.balance || 0), 0);
      
      setTotalAmountPaid(totalPaid);
      setTotalPendingBalance(totalBal);

      // MONTHLY GRAPH
      const yearlyData = Array.from({ length: 12 }, (_, m) => {
        const rows = gymbills.filter((b) => {
          if (!b.createdAt) return false;
          const d = new Date(b.createdAt);
          return d.getFullYear() === selectedYear && d.getMonth() === m;
        });

        return {
          month:
            [
              "Jan",
              "Feb",
              "Mar",
              "Apr",
              "May",
              "Jun",
              "Jul",
              "Aug",
              "Sep",
              "Oct",
              "Nov",
              "Dec",
            ][m],
          revenue: rows.reduce(
  (sum, b) => sum + (b.totalPaidIncludingRenewals || b.amountPaid || 0),
  0
),

        };
      });

      setMonthlyGraph(yearlyData);

      // STATS
      setActiveCount(gymbills.filter((g) => g.status === "Active").length);
      setInactiveCount(gymbills.filter((g) => g.status === "Inactive").length);
      setTotalClients(gymbills.length);

      const now = new Date();
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(now.getDate() - 30);

      setNewClients(
        gymbills.filter((g) => {
          const created = g.createdAt ? new Date(g.createdAt) : null;
          return created && created >= thirtyDaysAgo && created <= now;
        }).length
      );

      // Inquiries
      const inquiriesRes = await axios.get<Inquiry[]>(`${API_URI}/inquiries`)


      const inquiriesArray = Array.isArray(inquiriesRes.data)
        ? inquiriesRes.data
        : [];

      setInquiryCount(
        inquiriesArray.filter((i) => {
          const created = i.createdAt ? new Date(i.createdAt) : null;
          return created && created >= from && created <= to;
        }).length
      );

      // Followups
      const followupsRes = await axios.get<Followup[]>(`${API_URI}/followups`)


      const followupArray = Array.isArray(followupsRes.data)
        ? followupsRes.data
        : [];

      setFollowupCount(followupArray.filter((f) => f.status === "Pending").length);
    } catch (err) {
      console.error(err);
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

  const stats: Stat[] = [
    { label: "Total Revenue Collected", value: totalAmountPaid, icon: UserCheck },
    { label: "Total Pending Balance", value: totalPendingBalance, icon: UserX },

    { label: "Total Clients", value: totalClients, icon: Users },
    { label: "New Clients (Last 30 Days)", value: newClients, icon: UserPlus },
    { label: "Active Clients", value: activeCount, icon: Users },
    { label: "Inactive Clients", value: inactiveCount, icon: UserX },
    { label: "Pending Enquiries", value: inquiryCount, icon: HelpCircle },
    { label: "Follow-ups", value: followupCount, icon: UserCheck },
  ];

 return (
  <div className="flex-1 bg-white min-h-screen text-sm px-4 sm:px-6 md:px-8 pb-10">
    <h1 className="text-2xl sm:text-3xl font-bold text-yellow-700 mt-6 mb-6">
      Dashboard
    </h1>

    {/* Summary Filters */}
    <div className="bg-yellow-50 rounded-lg shadow-md border p-4 sm:p-6 mb-6">
      <div className="flex flex-wrap items-end gap-4 mb-4">
        <div>
          <label className="text-sm font-medium text-yellow-700 mb-1 block">
            From
          </label>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="px-3 py-2 border rounded-lg"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-yellow-700 mb-1 block">
            To
          </label>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="px-3 py-2 border rounded-lg"
          />
        </div>

        <button
          onClick={fetchStats}
          className="px-4 py-2 bg-yellow-500 text-white rounded-lg"
        >
          Refresh
        </button>
      </div>
    </div>

    {/* Summary Statistics */}
    <h2 className="text-lg font-semibold text-yellow-800 mb-4">
      Summary Statistics
    </h2>

    {loading ? (
      <div className="text-center text-yellow-600 py-10 font-semibold">
        Loading data...
      </div>
    ) : (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="bg-white border rounded-lg p-4 shadow-sm hover:shadow-md"
            >
              <div className="flex justify-between items-center gap-3">
                <div>
                  <p className="text-sm text-yellow-700">{stat.label}</p>
                  <p className="text-3xl font-bold text-yellow-800">
                    {stat.value}
                  </p>
                </div>
                <Icon size={36} className="text-yellow-600" />
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
        <Tooltip />
        <Legend />
        <Bar dataKey="revenue" fill="#facc15" name="Revenue (₹)" />
      </BarChart>
    </ResponsiveContainer>
  </div>

</div>
  </div>
);

};

export default Dashboard;
