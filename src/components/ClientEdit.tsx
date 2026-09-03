import React, { useEffect, useState } from "react";
import axios from "axios";
import { API_URI } from "../api/api";

interface Trainer {
  _id: string;
  name: string;
}
interface PackageData {
  _id: string;
  packageName: string;
  days: number;
  price: number;
}

interface GymBill {
  _id: string;
  invoiceId: string;
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
  sessions?: string;
  price?: string;
  days?: string;
  discount?: string;
  discountAmount?: string;
  admissionCharges?: string;
  tax?: string;
  amountPayable?: string;
  amountPaid?: string;
  balance?: string;
  amount?: string;
  followupDate?: string;
  status?: string;
  paymentMethodDetail?: string;
  appointTrainer?: string;
  clientRep?: string;
  profilePicture?: any;
}

const ClientEdit: React.FC = () => {
  const [clients, setClients] = useState<GymBill[]>([]);
  const [selectedClient, setSelectedClient] = useState<GymBill | null>(null);
  const [formData, setFormData] = useState<Partial<GymBill>>({});
  const [search, setSearch] = useState("");
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [packages, setPackages] = useState<PackageData[]>([]);

  // Fetch all required data
  useEffect(() => {
    fetchClients();
    fetchTrainers();
    fetchPackages();
  }, []);

  const fetchClients = async () => {
    try {
      const res = await axios.get(`${API_URI}/gymbill`)
      setClients(res.data);
    } catch (err) {
      console.error("Error fetching clients:", err);
    }
  };

  const fetchPackages = async () => {
    try {
      const res = await axios.get(`${API_URI}/packages`)

      setPackages(res.data);
    } catch (err) {
      console.error("Error fetching packages:", err);
    }
  };
  const handleDownload = (id: string) => {
  window.open(`${API_URI}/gymbill/invoice/pdf/${id}`, "_blank");
};


  const fetchTrainers = async () => {
    try {
      const res = await axios.get(`${API_URI}/trainers`)

      setTrainers(res.data);
    } catch (err) {
      console.error("Error fetching trainers:", err);
    }
  };

  const handleEditClick = (client: GymBill) => {
    setSelectedClient(client);
    setFormData({ ...client });
  };

 const handleChange = (
  e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
) => {
  const { name, value } = e.target;

  let updated: Partial<GymBill> = { ...formData, [name]: value };

  // -------------------------
  // AUTO CALCULATE END DATE
  // -------------------------
  if (name === "joiningDate" && formData.days) {
    updated.endDate = calculateEndDate(value, parseInt(formData.days));
  }

  // If package days updated separately
  if (name === "days" && formData.joiningDate) {
    updated.endDate = calculateEndDate(formData.joiningDate, parseInt(value));
  }

  // -------------------------
  // AUTO CALCULATE AMOUNT PAYABLE
  // -------------------------
  const price = parseFloat(updated.price || "0");
  const discount = parseFloat(updated.discountAmount || "0");

  updated.amountPayable = (price - discount).toString();

  // -------------------------
  // AUTO CALCULATE BALANCE
  // -------------------------
  const paid = parseFloat(updated.amountPaid || "0");
  const payable = parseFloat(updated.amountPayable || "0");

  updated.balance = (payable - paid).toString();

  setFormData(updated);
};

  const calculateEndDate = (joiningDate: string, days: number) => {
    if (!joiningDate || !days) return "";
    const start = new Date(joiningDate);
    start.setDate(start.getDate() + days);
    return start.toISOString().split("T")[0];
  };

  // -----------------------------
  //   UPDATE CLIENT DATA
  // -----------------------------
  const handleUpdate = async () => {
  if (!selectedClient?._id) return;

  try {
    const data = new FormData();

    const safeForm: any = { ...formData };

    // ❌ remove fields that break backend
    delete safeForm.paymentHistory;
    delete safeForm.renewalHistory;
    delete safeForm.totalPaidIncludingRenewals;
    delete safeForm.__v;

    // ✔ send only fields that were changed
    Object.entries(safeForm).forEach(([key, value]) => {
      if (value !== (selectedClient as any)[key]) {
        data.append(key, value as any);
      }
    });

    await axios.put(
      `${API_URI}/gymbill/${selectedClient._id}`,
      data,
      { headers: { "Content-Type": "multipart/form-data" } }
    );

    alert("Client updated successfully!");
    fetchClients();
    setSelectedClient(null);

  } catch (err: any) {
    console.error("Update failed:", err.response?.data || err);
    alert("Update failed: " + (err.response?.data?.message || err.message));
  }
};


  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this client?")) return;
    try {
      await axios.delete(`${API_URI}/gymbill/${id}`);
      alert("Client deleted successfully!");
      fetchClients();
    } catch (err) {
      alert("Delete failed.");
    }
  };

  const filteredClients = clients.filter((c) =>
    c.client.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-4 text-sm">
      <h2 className="text-xl font-bold text-yellow-700 mb-4">
        Clients Management
      </h2>

      {/* SEARCH */}
      <div className="flex mb-4">
        <input
          type="text"
          placeholder="Search client by name..."
          className="border px-3 py-2 rounded-md w-72"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* CLIENT TABLE */}
      <div className="overflow-x-auto shadow-lg rounded-lg">
        <table className="min-w-full bg-white border border-gray-200">
          <thead className="bg-yellow-400 text-white">
            <tr>
              <th className="py-2 px-3">Profile</th>
              <th className="py-2 px-3">Member ID</th>
              <th className="py-2 px-3">Client Name</th>
              <th className="py-2 px-3">Contact</th>
              <th className="py-2 px-3">Package</th>
              <th className="py-2 px-3">Status</th>
              <th className="py-2 px-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredClients.length > 0 ? (
              filteredClients.map((client) => (
                <tr
                  key={client._id}
                  className="border-b hover:bg-yellow-50 transition"
                >
                  <td className="py-2 px-3">
                    {client.profilePicture ? (
                      <img
                        src={`${API_URI}/gymbill/image/${client._id}`}
                        className="w-10 h-10 rounded-full object-cover border"
                      />
                    ) : (
                      <span className="text-gray-400 italic">No Image</span>
                    )}
                  </td>

                  <td className="py-2 px-3">{client.memberId}</td>
                  <td className="py-2 px-3">{client.client}</td>
                  <td className="py-2 px-3">{client.contactNumber}</td>
                  <td className="py-2 px-3">{client.package}</td>
                  <td className="py-2 px-3">{client.status}</td>

                  <td className="py-2 px-3 text-center space-x-2">
                    <button
                      onClick={() => handleEditClick(client)}
                      className="bg-blue-500 text-white px-3 py-1 rounded-md"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(client._id)}
                      className="bg-red-500 text-white px-3 py-1 rounded-md"
                    >
                      Delete
                    </button>

                    
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="text-center py-4 italic">
                  No clients found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* EDIT MODAL */}
         {selectedClient && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
          <div className="bg-white w-full max-w-5xl rounded-xl p-6 overflow-y-auto max-h-[90vh] relative">
            <button
              onClick={() => setSelectedClient(null)}
              className="absolute top-3 right-4 text-xl"
            >
              ×
            </button>

            <h3 className="text-xl font-bold text-yellow-700 mb-4">
              Edit Client – {selectedClient.client}
            </h3>

            {/* PROFILE */}
            <input
              type="file"
              accept="image/*"
              onChange={(e) =>
                setFormData({ ...formData, profilePicture: e.target.files?.[0] })
              }
              className="mb-4"
            />

            {/* FORM */}
            <div className="grid grid-cols-3 gap-4">

              {/* PERSONAL */}
              <h4 className="col-span-3 font-bold text-yellow-700">Personal Details</h4>

              {[
                ["memberId", "Member ID"],
                ["client", "Client Name"],
                ["contactNumber", "Contact"],
                ["alternateContact", "Alternate Contact"],
                ["email", "Email"],
                ["profession", "Profession"],
                ["taxId", "Tax ID"],
                ["clientRep", "Client Representative"],
              ].map(([name, label]) => (
                <div key={name}>
                  <label className="font-semibold">{label}</label>
                  <input
                    name={name}
                    value={(formData as any)[name] || ""}
                    onChange={handleChange}
                    className="border p-2 rounded w-full"
                  />
                </div>
              ))}

              <div>
                <label className="font-semibold">Gender</label>
                <select
                  name="gender"
                  value={formData.gender || ""}
                  onChange={handleChange}
                  className="border p-2 rounded w-full"
                >
                  <option value="">Select</option>
                  <option>Male</option>
                  <option>Female</option>
                  <option>Other</option>
                </select>
              </div>

              <div>
                <label className="font-semibold">Client Source</label>
                <select
                  name="clientSource"
                  value={formData.clientSource || ""}
                  onChange={handleChange}
                  className="border p-2 rounded w-full"
                >
                  <option value="">Select</option>
                  <option>Walk-in</option>
                  <option>Referral</option>
                  <option>Instagram</option>
                  <option>Website</option>
                </select>
              </div>

              <div>
                <label className="font-semibold">Follow-up Date</label>
                <input
                  type="date"
                  name="followupDate"
                  value={formData.followupDate || ""}
                  onChange={handleChange}
                  className="border p-2 rounded w-full"
                />
              </div>

              <div className="col-span-3">
                <label className="font-semibold">Address</label>
                <textarea
                  name="areaAddress"
                  value={formData.areaAddress || ""}
                  onChange={handleChange}
                  className="border p-2 rounded w-full"
                />
              </div>

              {/* MEMBERSHIP */}
              <h4 className="col-span-3 font-bold text-yellow-700 mt-4">
                Membership & Payment
              </h4>

              <div>
  <label className="font-semibold">Appointed Trainer</label>
  <select
    name="appointTrainer"
    value={formData.appointTrainer || ""}
    onChange={handleChange}
    className="border p-2 rounded w-full"
  >
    <option value="">Select Trainer</option>
    {trainers.map((trainer) => (
      <option key={trainer._id} value={trainer.name}>
        {trainer.name}
      </option>
    ))}
  </select>
</div>


              <div>
                <label className="font-semibold">Package</label>
                <select
                  value={formData.package || ""}
                  onChange={(e) => {
                    const pkg = packages.find(
                      (p) => p.packageName === e.target.value
                    );
                    const days = pkg?.days || 0;
                    const price = pkg?.price || 0;
                    setFormData({
                      ...formData,
                      package: e.target.value,
                      days: days.toString(),
                      price: price.toString(),
                      endDate: formData.joiningDate
                        ? calculateEndDate(formData.joiningDate, days)
                        : "",
                    });
                  }}
                  className="border p-2 rounded w-full"
                >
                  <option value="">Select</option>
                  {packages.map((p) => (
                    <option key={p._id}>{p.packageName}</option>
                  ))}
                </select>
              </div>

              {["price", "days", "amountPaid", "balance"].map((name) => (
                <div key={name}>
                  <label className="font-semibold">{name}</label>
                  <input
                    name={name}
                    value={(formData as any)[name] || ""}
                    onChange={handleChange}
                    className="border p-2 rounded w-full"
                  />
                </div>
              ))}

              <div className="col-span-3">
                <label className="font-semibold">Remarks</label>
                <textarea
                  name="remarks"
                  value={formData.remarks || ""}
                  onChange={handleChange}
                  className="border p-2 rounded w-full"
                />
              </div>
            </div>

            {/* ACTIONS */}
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setSelectedClient(null)}
                className="bg-gray-300 px-4 py-2 rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdate}
                className="bg-yellow-500 text-white px-4 py-2 rounded"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientEdit;
