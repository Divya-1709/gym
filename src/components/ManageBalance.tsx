import React, { useEffect, useState } from "react";
import axios from "axios";
import { Search } from "lucide-react";
import { API_URI } from "../api/api";

interface PaymentEntry {
  amount: number;
  mode: string;
  note: string;
  date: string;
}

interface GymBill {
  _id: string;
  memberId: string;
  client: string;
  contactNumber: string;
  package: string;
  price: number;
  discountAmount: number;
  amountPayable: number;
  amountPaid: number;
  balance: number;

  // ⭐ ADD THIS TO SUPPORT PAYMENT HISTORY
  paymentHistory: PaymentEntry[];
}

const ManageBalance: React.FC = () => {
  const [clients, setClients] = useState<GymBill[]>([]);
  const [filteredClients, setFilteredClients] = useState<GymBill[]>([]);
  const [search, setSearch] = useState("");

  const [selectedClient, setSelectedClient] = useState<GymBill | null>(null);

  // ⭐ NEW: For viewing payment history
  const [historyClient, setHistoryClient] = useState<GymBill | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMode, setPaymentMode] = useState("");
  const [paymentNote, setPaymentNote] = useState("");
  const [followUpDate, setFollowUpDate] = useState("");

  const [loading, setLoading] = useState(false);

  const API_URL = `${API_URI}/gymbill`;

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
  try {
    const res = await axios.get(API_URL);

    // ✅ DO NOT FILTER BY BALANCE
    setClients(res.data);
    setFilteredClients(res.data);
  } catch (error) {
    console.error("❌ Error fetching clients:", error);
  }
};


  useEffect(() => {
    const lower = search.toLowerCase();
    const filtered = clients.filter(
      (c) =>
        c.client.toLowerCase().includes(lower) ||
        c.contactNumber.includes(search)
    );
    setFilteredClients(filtered);
  }, [search, clients]);

  // --------------------------------------------
  // 💰 Handle Payment Update
  // --------------------------------------------
  const handlePayment = async (id: string) => {
    if (!paymentAmount || isNaN(Number(paymentAmount))) {
      alert("⚠️ Enter valid amount");
      return;
    }
    if (!paymentMode) {
      alert("⚠️ Choose payment mode");
      return;
    }

    const payment = Number(paymentAmount);
    const client = clients.find((c) => c._id === id);
    if (!client) return;

    if (payment > client.balance) {
      alert("⚠️ Payment exceeds balance!");
      return;
    }

    const updatedPaid = client.amountPaid + payment;
    const updatedBalance = client.amountPayable - updatedPaid;

    try {
      setLoading(true);

      await axios.put(`${API_URL}/payment/${id}`, {
        amountPaid: updatedPaid,
        balance: updatedBalance,
        mode: paymentMode,
        note: paymentNote,
        followUpDate: followUpDate || null,
      });

      alert("✅ Payment updated!");

      setSelectedClient(null);
      setPaymentAmount("");
      setPaymentMode("");
      setPaymentNote("");
      setFollowUpDate("");

      fetchClients();
    } catch (err) {
      console.error(err);
      alert("Failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen text-sm">
      <h2 className="bg-yellow-400 text-white px-6 py-3 rounded-t-lg font-semibold text-lg">
        Manage Balance Payments
      </h2>

      {/* Search Bar */}
      <div className="bg-white p-4 shadow-md rounded-b-lg flex items-center gap-4">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3 top-3 text-gray-400" />
          <input
            type="text"
            placeholder="Search by client name or contact number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border pl-10 pr-4 py-2 rounded-md w-full"
          />
        </div>
      </div>

      {/* Client Table */}
      <div className="mt-6 bg-white shadow-md rounded-lg overflow-x-auto">
        <table className="min-w-full text-sm border-collapse">
          <thead>
            <tr className="bg-yellow-50 text-gray-700 font-semibold">
              <th className="p-3 border">Member ID</th>
              <th className="p-3 border">Client</th>
              <th className="p-3 border">Contact</th>
              <th className="p-3 border">Package</th>
              <th className="p-3 border text-right">Discount (₹)</th>
              <th className="p-3 border text-right">Payable (₹)</th>
              <th className="p-3 border text-right">Paid (₹)</th>
              <th className="p-3 border text-right">Balance (₹)</th>
              <th className="p-3 border text-center">Action</th>
            </tr>
          </thead>

          <tbody>
            {filteredClients.length > 0 ? (
              filteredClients.map((client) => (
                <tr key={client._id} className="hover:bg-yellow-50">
                  <td className="p-3 border">{client.memberId}</td>
                  <td className="p-3 border">{client.client}</td>
                  <td className="p-3 border">{client.contactNumber}</td>
                  <td className="p-3 border">{client.package}</td>
                  <td className="p-3 border text-right">
                    {client.discountAmount}
                  </td>
                  <td className="p-3 border text-right">
                    {client.amountPayable}
                  </td>
                  <td className="p-3 border text-right">
                    {client.amountPaid}
                  </td>
                  <td className="p-3 border text-right text-red-500 font-semibold">
                    {client.balance}
                  </td>

                  {/* ⭐ UPDATED ACTION BUTTONS */}
                  <td className="p-3 border text-center">
                    <div className="flex flex-col gap-2">

                      {/* Pay Button */}
                      <button
                        onClick={() =>
                          setSelectedClient(
                            selectedClient?._id === client._id ? null : client
                          )
                        }
                        className="bg-yellow-400 hover:bg-yellow-500 text-white px-4 py-1 rounded-md text-xs font-semibold"
                      >
                        {selectedClient?._id === client._id ? "Close" : "Pay"}
                      </button>

                      {/* ⭐ NEW: View History Button */}
                      <button
                        onClick={() => {
                          setHistoryClient(client);
                          setShowHistory(true);
                        }}
                        className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-1 rounded-md text-xs font-semibold"
                      >
                        View
                      </button>

                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={9}
                  className="text-center py-6 text-gray-500 italic"
                >
                  No clients with pending balance.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Payment Modal */}
      {selectedClient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl w-[400px] relative">
            <button
              onClick={() => setSelectedClient(null)}
              className="absolute top-2 right-3 text-gray-600 text-xl"
            >
              ×
            </button>

            <h3 className="text-lg font-semibold text-yellow-600 mb-4">
              Update Payment – {selectedClient.client}
            </h3>

            <p className="text-sm mb-2">
              <strong>Total Payable:</strong> ₹{selectedClient.amountPayable}
            </p>
            <p className="text-sm mb-2">
              <strong>Already Paid:</strong> ₹{selectedClient.amountPaid}
            </p>
            <p className="text-sm mb-4">
              <strong>Balance:</strong>{" "}
              <span className="text-red-500">
                ₹{selectedClient.balance}
              </span>
            </p>

            <input
              type="number"
              placeholder="Payment Amount"
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(e.target.value)}
              className="border p-2 w-full rounded mb-3"
            />

            <select
              value={paymentMode}
              onChange={(e) => setPaymentMode(e.target.value)}
              className="border p-2 w-full rounded mb-3"
            >
              <option value="">Select Payment Mode</option>
              <option value="Cash">Cash</option>
              <option value="UPI">UPI</option>
              <option value="Card">Card</option>
              <option value="Online">Online</option>
            </select>

            <input
              type="text"
              placeholder="Payment Note (optional)"
              value={paymentNote}
              onChange={(e) => setPaymentNote(e.target.value)}
              className="border p-2 w-full rounded mb-3"
            />

            <label className="text-sm mb-1">Next Follow-up Date</label>
            <input
              type="date"
              value={followUpDate}
              onChange={(e) => setFollowUpDate(e.target.value)}
              className="border p-2 w-full rounded mb-4"
            />

            <button
              onClick={() => handlePayment(selectedClient._id)}
              disabled={loading}
              className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-md w-full"
            >
              {loading ? "Updating..." : "Submit Payment"}
            </button>
          </div>
        </div>
      )}

      {/* ⭐ PAYMENT HISTORY MODAL */}
      {showHistory && historyClient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl w-[450px] max-h-[80vh] overflow-y-auto relative">
            <button
              onClick={() => setShowHistory(false)}
              className="absolute top-2 right-3 text-gray-600 text-xl"
            >
              ×
            </button>

            <h3 className="text-lg font-semibold text-blue-600 mb-4">
              Payment History – {historyClient.client}
            </h3>

            {historyClient.paymentHistory?.length > 0 ? (
              historyClient.paymentHistory.map((p, index) => (
                <div
                  key={index}
                  className="border p-3 rounded-md bg-gray-50 mb-3"
                >
                  <p><strong>Amount:</strong> ₹{p.amount}</p>
                  <p><strong>Mode:</strong> {p.mode}</p>
                  <p><strong>Note:</strong> {p.note || "—"}</p>
                  <p>
                    <strong>Date:</strong>{" "}
                    {new Date(p.date).toLocaleString()}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center">No payment history found.</p>
            )}
          </div>
        </div>
      )}

    </div>
  );
};

export default ManageBalance;
