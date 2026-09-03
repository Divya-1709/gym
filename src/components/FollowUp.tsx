import React, { useEffect, useState } from "react";
import axios from "axios";

const API_URL = "http://localhost:5000/api/followups"; // change if needed

interface Followup {
  _id: string;
  client: {
    client: string;
    contactNumber: string;
    memberId: string;
  };
  followupType: string;
  scheduleDate: string;
  scheduleTime: string;
  response: string;
  status?: string;
}

interface Client {
  _id: string;
  client: string;
  memberId: string;
  contactNumber: string;
}

const FollowUp: React.FC = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [followups, setFollowups] = useState<Followup[]>([]);
  const [formData, setFormData] = useState({
    clientId: "",
    followupType: "",
    scheduleDate: "",
    scheduleTime: "",
    response: "",
    createdBy: "",
  });


  const CLIENT_API = "http://localhost:5000/api/gymbill"; // change if needed

const fetchClients = async () => {
  try {
    const res = await axios.get(CLIENT_API);
    setClients(res.data);
  } catch (err) {
    console.error("Error fetching clients", err);
  }
};

useEffect(() => {
  fetchFollowups();
  fetchClients(); // ✅ ADD THIS
}, []);

  // ✅ Fetch followups
  const fetchFollowups = async () => {
    try {
      const res = await axios.get(API_URL);
      setFollowups(res.data);
    } catch (err) {
      console.error("Error fetching followups", err);
    }
  };

  useEffect(() => {
    fetchFollowups();
  }, []);

  // ✅ Handle input
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // ✅ Create followup
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post(API_URL, formData);
      setFormData({
        clientId: "",
        followupType: "",
        scheduleDate: "",
        scheduleTime: "",
        response: "",
        createdBy: "",
      });
      fetchFollowups();
    } catch (err) {
      console.error("Error creating followup", err);
    }
  };

  // ✅ Update status
  const updateStatus = async (id: string, status: string) => {
    try {
      await axios.put(`${API_URL}/${id}/status`, { status });
      fetchFollowups();
    } catch (err) {
      console.error("Error updating status", err);
    }
  };

  // ✅ Delete followup
  const deleteFollowup = async (id: string) => {
    try {
      await axios.delete(`${API_URL}/${id}`);
      fetchFollowups();
    } catch (err) {
      console.error("Error deleting followup", err);
    }
  };

return (
  <div className="p-6 bg-yellow-50 min-h-screen">
    
    {/* HEADER */}
    <h2 className="text-3xl font-bold mb-6 text-yellow-600 tracking-wide">
      🏋️ Gym Follow-Up Management
    </h2>

    {/* ✅ FORM CARD */}
    <div className="bg-white p-6 rounded-2xl shadow-md mb-6 border border-yellow-200">
      <h3 className="text-lg font-semibold mb-4 text-yellow-600">
        Add New Follow-Up
      </h3>

      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
      >
        {/* Client */}
        <div>
          <label className="text-sm text-gray-600">Member</label>
          <select
            name="clientId"
            value={formData.clientId}
            onChange={handleChange}
            className="w-full mt-1 p-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-yellow-400"
            required
          >
            <option value="">Select Member</option>
            {clients.map((c) => (
              <option key={c._id} value={c.memberId}>
                {c.client} ({c.memberId})
              </option>
            ))}
          </select>
        </div>

        {/* Type */}
       <div>
  <label className="text-sm text-gray-600">Follow-up Type</label>

  <select
    name="followupType"
    value={formData.followupType}
    onChange={handleChange}
    className="w-full mt-1 p-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-yellow-400 bg-white"
  >
    <option value="">Select Type</option>
    <option value="Call"> Call</option>
    <option value="Renewal"> Renewal</option>
    <option value="Visit">Visit</option>
    <option value="Trial"> Trial</option>
    <option value="Payment Reminder"> Payment Reminder</option>
    <option value="General">General</option>
  </select>
</div>

        {/* Date */}
        <div>
          <label className="text-sm text-gray-600">Date</label>
          <input
            type="date"
            name="scheduleDate"
            value={formData.scheduleDate}
            onChange={handleChange}
            className="w-full mt-1 p-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-yellow-400"
          />
        </div>

        {/* Time */}
        <div>
          <label className="text-sm text-gray-600">Time</label>
          <input
            type="time"
            name="scheduleTime"
            value={formData.scheduleTime}
            onChange={handleChange}
            className="w-full mt-1 p-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-yellow-400"
          />
        </div>

        {/* Response */}
        <div>
          <label className="text-sm text-gray-600">Response</label>
          <input
            type="text"
            name="response"
            placeholder="Client feedback..."
            value={formData.response}
            onChange={handleChange}
            className="w-full mt-1 p-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-yellow-400"
          />
        </div>

        {/* Created By */}
        <div>
          <label className="text-sm text-gray-600">Trainer / Staff</label>
          <input
            type="text"
            name="createdBy"
            placeholder="Trainer name"
            value={formData.createdBy}
            onChange={handleChange}
            className="w-full mt-1 p-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-yellow-400"
          />
        </div>

        {/* Button */}
        <button className="bg-yellow-400 hover:bg-yellow-500 text-black font-bold p-3 rounded-lg col-span-full transition shadow">
          ➕ Add Follow-Up
        </button>
      </form>
    </div>

    {/* ✅ TABLE */}
    <div className="bg-white p-6 rounded-2xl shadow-md border border-yellow-200">
      <h3 className="text-lg font-semibold mb-4 text-yellow-600">
        Member Follow-Ups
      </h3>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-yellow-100 text-gray-700">
              <th className="p-3 text-left">Member</th>
              <th className="p-3 text-left">Phone</th>
              <th className="p-3 text-left">Type</th>
              <th className="p-3 text-left">Date</th>
              <th className="p-3 text-left">Time</th>
              <th className="p-3 text-left">Response</th>
              <th className="p-3 text-left">Status</th>
              <th className="p-3 text-center">Actions</th>
            </tr>
          </thead>

          <tbody>
            {followups.map((f) => (
              <tr
                key={f._id}
                className="border-t hover:bg-yellow-50 transition"
              >
                <td className="p-3">{f.client?.client}</td>
                <td className="p-3">{f.client?.contactNumber}</td>
                <td className="p-3">{f.followupType}</td>
                <td className="p-3">
                  {f.scheduleDate?.slice(0, 10)}
                </td>
                <td className="p-3">{f.scheduleTime}</td>
                <td className="p-3">{f.response}</td>

                {/* Status */}
                <td className="p-3">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      f.status === "Done"
                        ? "bg-green-100 text-green-600"
                        : "bg-yellow-200 text-yellow-700"
                    }`}
                  >
                    {f.status || "Pending"}
                  </span>
                </td>

                {/* Actions */}
                <td className="p-3 text-center space-x-2">
                  <button
                    onClick={() => updateStatus(f._id, "Done")}
                    className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-xs font-semibold"
                  >
                    ✔ Done
                  </button>

                  <button
                    onClick={() => deleteFollowup(f._id)}
                    className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-xs font-semibold"
                  >
                    ✖ Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  </div>
);
};

export default FollowUp;