import { useEffect, useState } from "react";
import axios from "axios";
import { Search, Cake } from "lucide-react";
import { API_URI } from "../api/api";

interface GymBill {
  _id: string;
  memberId: string;
  client: string;
  gender?: string;
  contactNumber: string;
  dateOfBirth?: string;
}

export default function Birthday() {
  const [clients, setClients] = useState<GymBill[]>([]);
  const [search, setSearch] = useState("");
  const [genderFilter, setGenderFilter] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      const res = await axios.get(`${API_URI}/gymbill`);
      setClients(res.data);
    } catch (err) {
      console.error("Error fetching clients:", err);
    }
  };

  // ✅ Filtering (month & day only, ignoring year)
  const filteredClients = clients.filter((client) => {
    const matchesSearch =
      client.client.toLowerCase().includes(search.toLowerCase()) ||
      client.contactNumber.includes(search);
    const matchesGender = genderFilter ? client.gender === genderFilter : true;

    let matchesDate = true;

    if ((fromDate || toDate) && client.dateOfBirth) {
      const dob = new Date(client.dateOfBirth);
      const dobMonthDay = (dob.getMonth() + 1) * 100 + dob.getDate(); // e.g. Mar 5 → 305

      const from =
        fromDate !== ""
          ? (new Date(fromDate).getMonth() + 1) * 100 +
            new Date(fromDate).getDate()
          : null;
      const to =
        toDate !== ""
          ? (new Date(toDate).getMonth() + 1) * 100 +
            new Date(toDate).getDate()
          : null;

      if (from !== null && to !== null) {
        // ✅ Handles both normal and wrap-around cases
        if (from <= to) {
          matchesDate = dobMonthDay >= from && dobMonthDay <= to;
        } else {
          // e.g., Dec 15 → Jan 10
          matchesDate = dobMonthDay >= from || dobMonthDay <= to;
        }
      } else if (from !== null) {
        matchesDate = dobMonthDay >= from;
      } else if (to !== null) {
        matchesDate = dobMonthDay <= to;
      }
    }

    return matchesSearch && matchesGender && matchesDate;
  });

  // ✅ Pagination
  const indexOfLast = currentPage * entriesPerPage;
  const indexOfFirst = indexOfLast - entriesPerPage;
  const currentClients = filteredClients.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(filteredClients.length / entriesPerPage);

  const handleEntriesChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setEntriesPerPage(parseInt(e.target.value));
    setCurrentPage(1);
  };

  const resetFilters = () => {
    setSearch("");
    setGenderFilter("");
    setFromDate("");
    setToDate("");
  };

 return (
  <div className="p-4 md:p-6 bg-white rounded-xl shadow-md text-sm">

    {/* Header */}
    <div className="bg-yellow-400 text-white text-base md:text-lg font-semibold px-4 py-3 rounded-t-lg flex items-center gap-2">
      <Cake className="text-black" size={20} />
      Client Birthdays
    </div>

    {/* Filters */}
    <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-4 mt-6">

      {/* From Date */}
      <div className="w-full md:w-auto">
        <label className="text-xs text-gray-600">From</label>
        <input
          type="date"
          value={fromDate}
          onChange={(e) => setFromDate(e.target.value)}
          className="border rounded-md px-3 py-2 w-full text-sm"
        />
      </div>

      {/* To Date */}
      <div className="w-full md:w-auto">
        <label className="text-xs text-gray-600">To</label>
        <input
          type="date"
          value={toDate}
          onChange={(e) => setToDate(e.target.value)}
          className="border rounded-md px-3 py-2 w-full text-sm"
        />
      </div>

      {/* Search */}
      <div className="relative w-full">
        <Search size={18} className="absolute left-3 top-3 text-gray-400" />
        <input
          type="text"
          placeholder="Search name or contact"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border rounded-md pl-10 pr-4 py-2 w-full text-sm"
        />
      </div>

      {/* Reset */}
      <button
        onClick={resetFilters}
        className="w-full md:w-auto bg-gray-300 hover:bg-gray-400 px-3 py-2 rounded-md text-sm"
      >
        Reset
      </button>
    </div>

    {/* Table */}
    <div className="overflow-x-auto mt-6">
      <table className="min-w-[700px] w-full border-collapse text-xs md:text-sm">

        <thead>
          <tr className="bg-gray-100 text-gray-700">
            <th className="py-2 md:py-3 px-2 md:px-4 border">Member ID</th>
            <th className="py-2 md:py-3 px-2 md:px-4 border">Name</th>
            <th className="py-2 md:py-3 px-2 md:px-4 border">DOB</th>
            <th className="py-2 md:py-3 px-2 md:px-4 border">Gender</th>
            <th className="py-2 md:py-3 px-2 md:px-4 border">Contact</th>
           
          </tr>
        </thead>

        <tbody>
          {currentClients.length > 0 ? (
            currentClients.map((client) => (
              <tr key={client._id} className="hover:bg-yellow-50 text-center">

                <td className="py-2 px-2 md:px-4 border">{client.memberId}</td>
                <td className="py-2 px-2 md:px-4 border capitalize">{client.client}</td>

                <td className="py-2 px-2 md:px-4 border">
                  {client.dateOfBirth
                    ? new Date(client.dateOfBirth).toLocaleDateString()
                    : "-"}
                </td>

                <td className="py-2 px-2 md:px-4 border">{client.gender || "-"}</td>
                <td className="py-2 px-2 md:px-4 border">{client.contactNumber}</td>

               

              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={6} className="py-4 text-center text-gray-500">
                No matching records
              </td>
            </tr>
          )}
        </tbody>

      </table>
    </div>

    {/* Pagination */}
    <div className="flex flex-col md:flex-row justify-between items-center gap-3 mt-4 text-xs md:text-sm text-gray-600">

      <p className="text-center md:text-left">
        Showing {indexOfFirst + 1} to{" "}
        {Math.min(indexOfLast, filteredClients.length)} of{" "}
        {filteredClients.length}
      </p>

      <div className="flex gap-2 w-full md:w-auto">
        <button
          disabled={currentPage === 1}
          onClick={() => setCurrentPage(currentPage - 1)}
          className="w-full md:w-auto px-3 py-1 border rounded-md"
        >
          Previous
        </button>

        <button
          disabled={currentPage === totalPages || totalPages === 0}
          onClick={() => setCurrentPage(currentPage + 1)}
          className="w-full md:w-auto px-3 py-1 border rounded-md"
        >
          Next
        </button>
      </div>

    </div>
  </div>
);
}
