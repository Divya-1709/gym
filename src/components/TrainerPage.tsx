import { useState, useEffect, ChangeEvent, FormEvent } from "react";
import axios from "axios";
import { API_URI } from "../api/api";

interface Trainer {
  _id?: string;
  name: string;
  contactNumber: string;
  email: string;
  specialization?: string;
  experience: number;
}

export default function TrainerPage() {
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [formData, setFormData] = useState<Trainer>({
    name: "",
    contactNumber: "",
    email: "",
    specialization: "",
    experience: 0,
  });
  const [message, setMessage] = useState("");
  const [editTrainer, setEditTrainer] = useState<Trainer | null>(null); // For modal

  const fetchTrainers = async () => {
    try {
      const res = await axios.get<Trainer[]>(`${API_URI}/trainers`);
      setTrainers(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error(err);
      setTrainers([]);
    }
  };

  useEffect(() => {
    fetchTrainers();
  }, []);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: name === "experience" ? Number(value) : value });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      if (editTrainer) {
        await axios.put(`${API_URI}/trainers/${editTrainer._id}`, formData);
        setMessage("Trainer updated successfully!");
        setEditTrainer(null);
      } else {
        await axios.post(`${API_URI}/trainers`, formData);
        setMessage("Trainer added successfully!");
      }
      setFormData({ name: "", contactNumber: "", email: "", specialization: "", experience: 0 });
      fetchTrainers();
    } catch (err) {
      console.error(err);
      setMessage(editTrainer ? "Failed to update trainer." : "Failed to add trainer.");
    }
  };

  const handleDelete = async (id: string | undefined) => {
    if (!id) return;
    try {
      await axios.delete(`${API_URI}/trainers/${id}`);
      setMessage("Trainer deleted successfully!");
      fetchTrainers();
    } catch (err) {
      console.error(err);
      setMessage("Failed to delete trainer.");
    }
  };

  const handleEdit = (trainer: Trainer) => {
    setEditTrainer(trainer);
    setFormData({
      name: trainer.name,
      contactNumber: trainer.contactNumber,
      email: trainer.email,
      specialization: trainer.specialization || "",
      experience: trainer.experience,
    });
    setMessage("");
  };

  const closeModal = () => {
    setEditTrainer(null);
    setFormData({ name: "", contactNumber: "", email: "", specialization: "", experience: 0 });
  };

 return (
  <div className="p-4 md:p-6 w-full text-sm">

    <h2 className="text-xl md:text-2xl font-semibold mb-4 text-yellow-600">
      Trainer Details
    </h2>

    {message && <p className="mb-4 text-green-600">{message}</p>}

    {/* ✅ Add Trainer Form */}
    <form className="bg-white p-4 md:p-6 rounded-2xl mb-6 shadow-md border border-yellow-300">
      <h3 className="text-lg md:text-xl font-bold mb-4 text-yellow-600">
        Add Trainer
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <input className="p-2 border rounded w-full" placeholder="Name" />
        <input className="p-2 border rounded w-full" placeholder="Contact Number" />
        <input className="p-2 border rounded w-full" placeholder="Email" />
        <input className="p-2 border rounded w-full" placeholder="Specialization" />
        <input className="p-2 border rounded w-full" placeholder="Experience" />
      </div>

      <button className="mt-4 w-full md:w-auto bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600 transition">
        Add Trainer
      </button>
    </form>

    {/* ✅ Table Wrapper (IMPORTANT FIX) */}
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
            <tr key={t._id} className="text-center hover:bg-yellow-50">
              <td className="p-2 border">{t.name}</td>
              <td className="p-2 border">{t.contactNumber}</td>
              <td className="p-2 border">{t.email}</td>
              <td className="p-2 border">{t.specialization}</td>
              <td className="p-2 border">{t.experience}</td>
              
              <td className="p-2 border">
                <div className="flex flex-col md:flex-row gap-2 justify-center">
                  <button className="bg-yellow-400 text-white px-3 py-1 rounded w-full md:w-auto">
                    Edit
                  </button>
                  <button className="bg-red-500 text-white px-3 py-1 rounded w-full md:w-auto">
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>

      </table>
    </div>

    {/* ✅ Edit Modal */}
    {editTrainer && (
      <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
        <div className="bg-white p-4 md:p-6 rounded-2xl w-full max-w-md shadow-lg border-2 border-yellow-400">

          <h3 className="text-lg md:text-xl font-bold mb-4 text-yellow-600">
            Edit Trainer
          </h3>

          <div className="grid gap-4">
            <input className="p-2 border rounded w-full" placeholder="Name" />
            <input className="p-2 border rounded w-full" placeholder="Contact" />
            <input className="p-2 border rounded w-full" placeholder="Email" />
            <input className="p-2 border rounded w-full" placeholder="Specialization" />
            <input className="p-2 border rounded w-full" placeholder="Experience" />
          </div>

          <div className="flex flex-col md:flex-row justify-end gap-2 mt-4">
            <button className="w-full md:w-auto bg-gray-300 px-4 py-2 rounded">
              Cancel
            </button>
            <button className="w-full md:w-auto bg-yellow-500 text-white px-4 py-2 rounded">
              Save
            </button>
          </div>

        </div>
      </div>
    )}
  </div>
);
}
