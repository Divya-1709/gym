import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Calendar,
  Phone,
  Search,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { API_URI } from "../api/api";

interface Client {
  _id: string;
  memberId: string;
  client: string;
  anniversary?: string;
  gender?: string;
  contactNumber?: string;
}

const ClientAnniversaries: React.FC = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [filtered, setFiltered] = useState<Client[]>([]);
  const [gender, setGender] = useState("");
  const [search, setSearch] = useState("");
  const [entries, setEntries] = useState(10);
  const [page, setPage] = useState(1);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const API_URL = `${API_URI}/gymbill`;

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      const { data } = await axios.get(API_URL);
      const anniversaryClients = data.filter(
        (c: Client) => c.anniversary && c.anniversary.trim() !== ""
      );
      setClients(anniversaryClients);
      setFiltered(anniversaryClients);
    } catch (error) {
      console.error("Error fetching clients:", error);
    }
  };

  // ✅ Handle filtering by gender, search, and anniversary date range
  const handleFilter = () => {
    let filteredList = [...clients];

    // 🔍 Search
    if (search) {
      const s = search.toLowerCase();
      filteredList = filteredList.filter(
        (c) =>
          c.client?.toLowerCase().includes(s) ||
          c.contactNumber?.toLowerCase().includes(s)
      );
    }

    // 🚻 Gender
    if (gender) {
      filteredList = filteredList.filter(
        (c) => c.gender?.toLowerCase() === gender.toLowerCase()
      );
    }

    // 📅 From–To date filter (ignore year)
    if (fromDate || toDate) {
      filteredList = filteredList.filter((c) => {
        if (!c.anniversary) return false;
        const annivDate = new Date(c.anniversary);
        if (isNaN(annivDate.getTime())) return false;

        const annivKey = (annivDate.getMonth() + 1) * 100 + annivDate.getDate();

        const fromKey =
          fromDate !== ""
            ? (new Date(fromDate).getMonth() + 1) * 100 +
              new Date(fromDate).getDate()
            : null;

        const toKey =
          toDate !== ""
            ? (new Date(toDate).getMonth() + 1) * 100 +
              new Date(toDate).getDate()
            : null;

        if (fromKey !== null && toKey !== null) {
          if (fromKey <= toKey) {
            return annivKey >= fromKey && annivKey <= toKey;
          } else {
            // Handles wrap-around range (e.g., Dec → Jan)
            return annivKey >= fromKey || annivKey <= toKey;
          }
        } else if (fromKey !== null) {
          return annivKey >= fromKey;
        } else if (toKey !== null) {
          return annivKey <= toKey;
        }
        return true;
      });
    }

    setFiltered(filteredList);
    setPage(1);
  };

  useEffect(() => {
    handleFilter();
  }, [gender, search, fromDate, toDate]);

  // Pagination logic
  const startIndex = (page - 1) * entries;
  const endIndex = startIndex + entries;
  const paginated = filtered.slice(startIndex, endIndex);

  const totalPages = Math.ceil(filtered.length / entries);

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "-";
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const resetFilters = () => {
    setGender("");
    setSearch("");
    setFromDate("");
    setToDate("");
  };

  return (
  <div className="p-4 md:p-6 bg-gray-100 min-h-screen text-sm">

    {/* Header */}
    <div className="bg-yellow-400 text-white px-4 md:px-6 py-3 md:py-4 rounded-t-xl shadow-md flex items-center gap-2 md:gap-3">
      <Calendar size={18} className="text-black" />
      <h1 className="text-base md:text-xl font-semibold">
        Client Anniversaries
      </h1>
    </div>

    {/* Main */}
    <div className="bg-white p-4 md:p-6 rounded-b-xl shadow-lg">

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-3 md:gap-4 mb-6">

        <div className="w-full md:w-auto">
          <label className="text-xs text-gray-600">From</label>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="border rounded-md px-3 py-2 w-full"
          />
        </div>

        <div className="w-full md:w-auto">
          <label className="text-xs text-gray-600">To</label>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="border rounded-md px-3 py-2 w-full"
          />
        </div>

        <div className="relative w-full">
          <Search size={16} className="absolute left-3 top-3 text-gray-400" />
          <input
            type="text"
            placeholder="Search name or contact..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border rounded-md pl-8 pr-3 py-2 w-full"
          />
        </div>

        <button
          onClick={resetFilters}
          className="w-full md:w-auto bg-gray-300 hover:bg-gray-400 px-3 py-2 rounded-md"
        >
          Reset
        </button>
      </div>

      {/* ================= DESKTOP TABLE ================= */}
      <div className="hidden md:block overflow-x-auto border rounded-md">
        <table className="min-w-[700px] w-full text-sm">

          <thead>
            <tr className="bg-yellow-50 text-gray-700">
              <th className="p-3 border">ID</th>
              <th className="p-3 border">Name</th>
              <th className="p-3 border">Date</th>
              <th className="p-3 border">Gender</th>
              <th className="p-3 border">Contact</th>
            </tr>
          </thead>

          <tbody>
            {paginated.length > 0 ? (
              paginated.map((c) => (
                <tr key={c._id} className="hover:bg-yellow-50 text-center">

                  <td className="p-3 border">{c.memberId}</td>
                  <td className="p-3 border capitalize">{c.client}</td>
                  <td className="p-3 border">{formatDate(c.anniversary)}</td>
                  <td className="p-3 border">{c.gender || "-"}</td>

                  <td className="p-3 border">
                    <div className="flex items-center justify-center gap-1">
                      <Phone size={14} />
                      {c.contactNumber}
                    </div>
                  </td>

                 
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="py-6 text-center text-gray-500">
                  No data found
                </td>
              </tr>
            )}
          </tbody>

        </table>
      </div>

      {/* ================= MOBILE CARDS ================= */}
      <div className="md:hidden space-y-4 mt-4">

        {paginated.length > 0 ? (
          paginated.map((c) => (
            <div
              key={c._id}
              className="bg-white border rounded-lg p-4 shadow-sm"
            >

              <div className="flex justify-between items-center mb-2">
                <h3 className="font-semibold text-gray-800 capitalize">
                  {c.client}
                </h3>
                <span className="text-xs text-gray-500">
                  {c.memberId}
                </span>
              </div>

              <p className="text-xs text-gray-600">
                🎂 {formatDate(c.anniversary)}
              </p>

              <p className="text-xs text-gray-600">
                📞 {c.contactNumber}
              </p>

              <p className="text-xs text-gray-600 capitalize">
                {c.gender || "-"}
              </p>

             

            </div>
          ))
        ) : (
          <p className="text-center text-gray-500">No data found</p>
        )}

      </div>

      {/* Pagination */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-3 mt-6 text-xs md:text-sm">

        <p className="text-gray-600 text-center md:text-left">
          Showing {startIndex + 1} to{" "}
          {Math.min(endIndex, filtered.length)} of {filtered.length}
        </p>

        <div className="flex gap-2 w-full md:w-auto">
          <button
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
            className="w-full md:w-auto px-3 py-1 border rounded-md"
          >
            Prev
          </button>

          <button
            disabled={page === totalPages || totalPages === 0}
            onClick={() => setPage(page + 1)}
            className="w-full md:w-auto px-3 py-1 border rounded-md"
          >
            Next
          </button>
        </div>

      </div>

    </div>
  </div>
);
};

export default ClientAnniversaries;
