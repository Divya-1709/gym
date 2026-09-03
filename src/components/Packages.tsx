import React, { useEffect, useState } from "react";
import axios from "axios";
import { Trash2, PackagePlus, Pencil } from "lucide-react";
import { API_URI } from "../api/api";

interface PackageData {
  _id?: string;
  packageName: string;
  days: number;
  price: number;
}

const API_URL = `${API_URI}/packages`; // ✅ Replace with your backend URL

const Packages: React.FC = () => {
  const [packages, setPackages] = useState<PackageData[]>([]);
  const [formData, setFormData] = useState<PackageData>({
    packageName: "",
    days: 0,
    price: 0,
  });

  // Popup edit state
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editData, setEditData] = useState<PackageData>({
    _id: "",
    packageName: "",
    days: 0,
    price: 0,
  });

  const fetchPackages = async () => {
    const res = await axios.get(API_URL);
    setPackages(res.data);
  };

  useEffect(() => {
    fetchPackages();
  }, []);

 const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const { name, value } = e.target;

  setFormData({
    ...formData,
    [name]: name === "days" || name === "price" ? Number(value) : value,
  });
};

  const handleAddPackage = async () => {
    if (!formData.packageName || formData.days <= 0 || formData.price <= 0) return;
    await axios.post(API_URL, formData);
    setFormData({ packageName: "", days: 0, price: 0 });
    fetchPackages();
  };

  const handleDelete = async (id?: string) => {
    if (!id) return;
    await axios.delete(`${API_URL}/${id}`);
    fetchPackages();
  };

  // ====== Edit Popup Handlers ======
  const openEditPopup = (pkg: PackageData) => {
    setEditData(pkg);
    setIsEditOpen(true);
  };

  const closeEditPopup = () => {
    setIsEditOpen(false);
  };

 const handleEditChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const { name, value } = e.target;

  setEditData({
    ...editData,
    [name]: name === "days" || name === "price" ? Number(value) : value,
  });
};

  const handleUpdate = async () => {
    if (!editData._id) return;
    await axios.put(`${API_URL}/${editData._id}`, editData);
    setIsEditOpen(false);
    fetchPackages();
  };

  return (
  <div className="min-h-screen bg-white p-4 md:p-8 text-gray-800">

    {/* Header */}
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-6">
      <h2 className="text-xl md:text-2xl font-bold tracking-wide">
        🏋️‍♀️ Manage Gym Packages
      </h2>
      <div className="h-1 w-24 md:w-32 bg-yellow-400 rounded-full"></div>
    </div>

    {/* Form */}
    <div className="bg-yellow-50 p-4 md:p-6 rounded-2xl shadow-md border border-yellow-200 mb-8">
      <h3 className="text-base md:text-lg font-semibold mb-4 text-yellow-800 flex items-center gap-2">
        <PackagePlus size={18} /> Add New Package
      </h3>

    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-4">
  
  <div className="flex flex-col">
    <label className="mb-1 text-sm font-medium">Package Name</label>
    <input
      type="text"
      name="packageName"
      placeholder="Enter package name"
      value={formData.packageName}
      onChange={handleChange}
      className="border p-2 rounded-md w-full"
    />
  </div>

  <div className="flex flex-col">
    <label className="mb-1 text-sm font-medium">Days</label>
    <input
      type="number"
      name="days"
      placeholder="Enter number of days"
      value={formData.days}
      onChange={handleChange}
      className="border p-2 rounded-md w-full"
    />
  </div>

  <div className="flex flex-col">
    <label className="mb-1 text-sm font-medium">Price (₹)</label>
    <input
      type="number"
      name="price"
      placeholder="Enter price"
      value={formData.price}
      onChange={handleChange}
      className="border p-2 rounded-md w-full"
    />
  </div>

</div>

      <button
  onClick={handleAddPackage}
  className="w-full md:w-auto bg-yellow-500 text-white px-6 py-2 rounded-md"
>
  Add Package
</button>
    </div>

    {/* ================= DESKTOP TABLE ================= */}
    <div className="hidden md:block bg-white rounded-2xl shadow-md border overflow-hidden">
      <h3 className="bg-yellow-100 px-6 py-3 font-semibold">
        📦 Package List
      </h3>

      <table className="w-full text-sm">
        <thead className="bg-gray-50 text-xs">
          <tr>
            <th className="px-6 py-3 text-left">Name</th>
            <th className="px-6 py-3 text-left">Days</th>
            <th className="px-6 py-3 text-left">Price</th>
            <th className="px-6 py-3 text-center">Actions</th>
          </tr>
        </thead>

        <tbody>
          {packages.map((pkg) => (
            <tr key={pkg._id} className="hover:bg-yellow-50 border-b">

              <td className="px-6 py-3">{pkg.packageName}</td>
              <td className="px-6 py-3">{pkg.days} days</td>
              <td className="px-6 py-3 text-yellow-700">₹{pkg.price}</td>

              <td className="px-6 py-3 flex justify-center gap-4">
                <button onClick={() => openEditPopup(pkg)}>
                  <Pencil size={18} />
                </button>
                <button onClick={() => handleDelete(pkg._id)}>
                  <Trash2 size={18} />
                </button>
              </td>

            </tr>
          ))}
        </tbody>
      </table>
    </div>

    {/* ================= MOBILE CARDS ================= */}
    <div className="md:hidden space-y-4">

      {packages.length === 0 ? (
        <p className="text-center text-gray-400">
          No packages found
        </p>
      ) : (
        packages.map((pkg) => (
          <div
            key={pkg._id}
            className="border rounded-lg p-4 shadow-sm"
          >

            <h3 className="font-semibold text-gray-800">
              {pkg.packageName}
            </h3>

            <p className="text-sm text-gray-600">
              ⏱ {pkg.days} days
            </p>

            <p className="text-sm text-yellow-600 font-medium">
              ₹{pkg.price}
            </p>

            <div className="flex gap-2 mt-3">
              <button
                onClick={() => openEditPopup(pkg)}
                className="w-full bg-blue-500 text-white py-1 rounded"
              >
                Edit
              </button>

              <button
                onClick={() => handleDelete(pkg._id)}
                className="w-full bg-red-500 text-white py-1 rounded"
              >
                Delete
              </button>
            </div>

          </div>
        ))
      )}

    </div>

    {/* Modal */}
    {isEditOpen && (
      <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
        <div className="bg-white p-4 md:p-6 rounded-xl w-full max-w-md">
   <label className="mb-1 text-sm font-medium">Package</label>
         <input
  type="text"
  name="packageName"
  value={editData.packageName}
  onChange={handleEditChange}
  className="border p-2 w-full mb-3"
/>
   <label className="mb-1 text-sm font-medium">Days</label>
<input
  type="number"
  name="days"
  value={editData.days}
  onChange={handleEditChange}
  className="border p-2 w-full mb-3"
/>
   <label className="mb-1 text-sm font-medium">Price</label>
<input
  type="number"
  name="price"
  value={editData.price}
  onChange={handleEditChange}
  className="border p-2 w-full mb-3"
/>
          <div className="flex flex-col md:flex-row gap-2 justify-end">
           <button
  onClick={closeEditPopup}
  className="w-full md:w-auto border px-4 py-2"
>
  Cancel
</button>

<button
  onClick={handleUpdate}
  className="w-full md:w-auto bg-yellow-500 text-white px-4 py-2"
>
  Update
</button>
          </div>

        </div>
      </div>
    )}

  </div>
);
};

export default Packages;
