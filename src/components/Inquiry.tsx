import { useEffect, useState, ChangeEvent, FormEvent, ReactNode } from "react";
import axios from "axios";
import { API_URI } from "../api/api";

/* -------------------------------------------------------------------------- */
/*                               TYPE DEFINITIONS                             */
/* -------------------------------------------------------------------------- */

/** Inquiry document stored in the backend */
interface InquiryData {
  _id?: string;
  firstName: string;
  lastName: string;
  contactNumber: string;
  alternateContact: string;
  email: string;
  gender: string;
  areaAddress: string;
  scheduleFollowUp: string;
  dateOfBirth: string;
  status: string;
  attendedBy: string;
  convertibility: string;
  source: string;
  inquiryFor: string;
  feedback: { message: string; date: string }[];
  createdAt?: string;
  updatedAt?: string;
  __v?: number;
}

/** Filter section values */
interface Filters {
  search: string;
  status: string;
  convertibility: string;
  fromDate: string;
  toDate: string;
}

/** Generic modal props */
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
}

/* -------------------------------------------------------------------------- */
/*                               MODAL COMPONENT                              */
/* -------------------------------------------------------------------------- */

function Modal({ isOpen, onClose, children }: ModalProps) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-xl w-11/12 md:w-3/4 max-h-[90vh] overflow-y-auto shadow-xl relative">
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-900 font-bold"
        >
          ✖
        </button>
        {children}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                               INQUIRY MODULE                               */
/* -------------------------------------------------------------------------- */

export default function Inquiry() {
  /* ------------------------------- STATE SETUP ------------------------------ */
  const [formData, setFormData] = useState<InquiryData>({
    firstName: "",
    lastName: "",
    contactNumber: "",
    alternateContact: "",
    email: "",
    gender: "",
    areaAddress: "",
    scheduleFollowUp: "",
    dateOfBirth: "",
    status: "Pending",
    attendedBy: "",
    convertibility: "Warm",
    source: "",
    inquiryFor: "",
    feedback: [],
  });
  const [newFeedback, setNewFeedback] = useState("");
  const [inquiries, setInquiries] = useState<InquiryData[]>([]);
  const [filteredInquiries, setFilteredInquiries] = useState<InquiryData[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewData, setViewData] = useState<InquiryData | null>(null);
const [isViewModalOpen, setIsViewModalOpen] = useState(false);
const [editForm, setEditForm] = useState<InquiryData | null>(null);
const [trainers, setTrainers] = useState<string[]>([]);
const attendedByOptions = [...trainers, "Admin", "Others"];
const [packages, setPackages] = useState<string[]>([]);



  const [filters, setFilters] = useState<Filters>({
    search: "",
    status: "",
    convertibility: "",
    fromDate: "",
    toDate: "",
  });

  const API_URL = `${API_URI}/inquiries`;
  /* ------------------------------- FETCH DATA ------------------------------- */
  useEffect(() => {
    fetchInquiries();
    fetchTrainers(); 
    fetchPackages();
  }, []);
  const fetchTrainers = async () => {
  try {
    const res = await axios.get(`${API_URI}/trainers`);

    // Convert trainer objects → only trainer names
    const trainerNames = res.data.map((t: any) => t.name);

    setTrainers(trainerNames);
  } catch (err) {
    console.error("Failed to load trainers", err);
  }
};
const fetchPackages = async () => {
  try {
    const res = await axios.get(`${API_URI}/packages`);
    console.log("PACKAGES RESPONSE:", res.data);  // 👈 CHECK THIS
    const packageNames = res.data.map((p: any) => p.packageName);

    setPackages(packageNames);
  } catch (err) {
    console.error("Failed to load packages", err);
  }
};



  const fetchInquiries = async () => {
    try {
      const res = await axios.get<InquiryData[]>(API_URL);
      setInquiries(res.data);
      setFilteredInquiries(res.data);
    } catch (error) {
      console.error("❌ Failed to fetch inquiries:", error);
    }
  };

  /* ------------------------------- FILTER LOGIC ----------------------------- */
  useEffect(() => {
    let data = [...inquiries];

    if (filters.search) {
      const term = filters.search.toLowerCase();
      data = data.filter(
        (i) =>
          (i.firstName && i.firstName.toLowerCase().includes(term)) ||
          (i.lastName && i.lastName.toLowerCase().includes(term)) ||
          (i.contactNumber && i.contactNumber.includes(term))
      );
    }

    if (filters.status) data = data.filter((i) => i.status === filters.status);
    if (filters.convertibility)
      data = data.filter((i) => i.convertibility === filters.convertibility);

    if (filters.fromDate || filters.toDate) {
      data = data.filter((i) => {
        const date = new Date(i.scheduleFollowUp);
        const from = filters.fromDate ? new Date(filters.fromDate) : null;
        const to = filters.toDate ? new Date(filters.toDate) : null;
        return (!from || date >= from) && (!to || date <= to);
      });
    }

    setFilteredInquiries(data);
  }, [filters, inquiries]);

  /* --------------------------- INPUT HANDLERS ------------------------------- */
 const handleChange = (
  e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
) => {
  const { name, value } = e.target;

  // Protect feedback array from being overwritten
  if (name === "feedback") return;

  setFormData((prev) => ({
    ...prev,
    [name]: value,
  }));
};


  const handleFilterChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => setFilters({ ...filters, [e.target.name]: e.target.value });

  const resetForm = () =>
    setFormData({
      firstName: "",
      lastName: "",
      contactNumber: "",
      alternateContact: "",
      email: "",
      gender: "",
      areaAddress: "",
      scheduleFollowUp: "",
      dateOfBirth: "",
      status: "Pending",
      attendedBy: "",
      convertibility: "Warm",
      source: "",
      inquiryFor: "",
      feedback: [],
    });

  /* ----------------------------- FORM SUBMIT ------------------------------- */
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await axios.put(`${API_URL}/${editingId}`, formData);
        alert("✅ Enquiry Updated Successfully");
        setIsModalOpen(false);
      } else {
        await axios.post(API_URL, formData);
        alert("✅ Enquiry Created Successfully");
      }
      resetForm();
      setEditingId(null);
      fetchInquiries();
    } catch (error) {
      alert("❌ Failed to save enquiry");
      console.error(error);
    }
  };

  /* ----------------------------- EDIT & DELETE ----------------------------- */
  const handleEdit = (inq: InquiryData) => {
  setFormData({
    ...inq,
    feedback: Array.isArray(inq.feedback) ? inq.feedback : [], // fix backend old data
  });
  
  setNewFeedback(""); // reset feedback box
  setEditingId(inq._id || null);
  setIsModalOpen(true);
};


  const handleDelete = async (id?: string) => {
    if (!id) return;
    if (window.confirm("Are you sure you want to delete this enquiry?")) {
      try {
        await axios.delete(`${API_URL}/${id}`);
        fetchInquiries();
        alert("🗑️ Enquiry Deleted");
      } catch (error) {
        console.error("❌ Failed to delete:", error);
      }
    }
  };

  /* -------------------------------------------------------------------------- */
  /*                                RENDER OUTPUT                               */
  /* -------------------------------------------------------------------------- */
  return (
    <div className="w-full p-6 overflow-y-auto bg-white text-gray-800 text-sm">
      {/* ----------------------------- CREATE FORM ----------------------------- */}
      <div className="bg-white border border-yellow-200 rounded-xl shadow-sm p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4 border-b border-yellow-300 pb-2 text-yellow-700">
          Create New Enquiry
        </h2>

        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 md:grid-cols-3 gap-4 text-gray-700"
        >
          {/* Basic Fields */}
          {[
            { label: "First Name", name: "firstName", required: true },
            { label: "Last Name", name: "lastName" },
            { label: "Contact Number", name: "contactNumber", required: true },
            { label: "Alternate Contact", name: "alternateContact" },
            { label: "Email", name: "email", type: "email" },
          ].map((f) => (
            <div key={f.name} className="flex flex-col">
              <label className="mb-1 font-semibold">{f.label}</label>
              <input
                name={f.name}
                type={f.type || "text"}
                value={(formData as any)[f.name]}
                required={f.required || false}
                onChange={handleChange}
                className="p-2 border border-gray-300 rounded-md"
              />
            </div>
          ))}

          {/* Gender */}
          <div className="flex flex-col">
            <label className="mb-1 font-semibold">Gender</label>
            <select
              name="gender"
              value={formData.gender}
              onChange={handleChange}
              className="p-2 border border-gray-300 rounded-md"
            >
              <option value="">Select Gender</option>
              <option>Male</option>
              <option>Female</option>
            </select>
          </div>

          {/* Address */}
          <div className="md:col-span-2 flex flex-col">
            <label className="mb-1 font-semibold">Area Address</label>
            <input
              name="areaAddress"
              value={formData.areaAddress}
              onChange={handleChange}
              className="p-2 border border-gray-300 rounded-md"
            />
          </div>

          {/* Schedule Follow Up */}
          <div className="flex flex-col">
            <label className="mb-1 font-semibold">Schedule Follow-up</label>
            <input
              name="scheduleFollowUp"
              type="date"
              value={formData.scheduleFollowUp}
              onChange={handleChange}
              className="p-2 border border-gray-300 rounded-md"
            />
          </div>

          {/* DOB */}
          <div className="flex flex-col">
            <label className="mb-1 font-semibold">Date of Birth</label>
            <input
              name="dateOfBirth"
              type="date"
              value={formData.dateOfBirth}
              onChange={handleChange}
              className="p-2 border border-gray-300 rounded-md"
            />
          </div>

          {/* Status */}
          <div className="flex flex-col">
            <label className="mb-1 font-semibold">Status</label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="p-2 border border-gray-300 rounded-md"
            >
              <option value="Pending">Pending</option>
              <option value="Converted">Converted</option>
              <option value="Closed">Closed</option>
            </select>
          </div>

          {/* Attended By */}
          <div className="flex flex-col">
             <label className="mb-1 font-semibold">Attended By</label>
            <select
  name="attendedBy"
  value={formData.attendedBy}
  onChange={handleChange}
  className="p-2 border border-gray-300 rounded-md"
>
  <option value="">Select Staff</option>

  {attendedByOptions.map((name) => (
    <option key={name} value={name}>{name}</option>
  ))}
</select>

          </div>

          {/* Convertibility */}
          <div className="flex flex-col">
            <label className="mb-1 font-semibold">Convertibility</label>
            <select
              name="convertibility"
              value={formData.convertibility}
              onChange={handleChange}
              className="p-2 border border-gray-300 rounded-md"
            >
              <option value="Hot">Hot</option>
              <option value="Warm">Warm</option>
              <option value="Cold">Cold</option>
            </select>
          </div>

          {/* Source */}
          <div className="flex flex-col">
            <label className="mb-1 font-semibold">Source</label>
           <select
    name="source"
    value={formData.source}
    onChange={handleChange}
    className="p-2 border border-gray-300 rounded-md"
  >
    <option value="">Select Source</option>
    <option value="Walk-in">Walk-in</option>
    <option value="Online">Online</option>
    <option value="Referral">Referral</option>
    <option value="Instagram">Instagram</option>
    <option value="Facebook">Facebook</option>
    <option value="Google Ads">Google Ads</option>
    <option value="WhatsApp">WhatsApp</option>
    <option value="Others">Others</option>
  </select>
          </div>

          {/* Inquiry For */}
          <div className="flex flex-col">
            <label className="mb-1 font-semibold">Inquiry For</label>
              <select
    name="inquiryFor"
    value={formData.inquiryFor}
    onChange={handleChange}
    className="p-2 border border-gray-300 rounded-md"
  >
    <option value="">Select Package</option>

    {packages.map((pkg, idx) => (
      <option key={idx} value={pkg}>{pkg}</option>
    ))}
  </select>
          </div>

          {/* Add Feedback */}
<div className="md:col-span-3 flex flex-col">
  <label className="mb-1 font-semibold">Add Feedback</label>
  <textarea
    value={newFeedback}
    onChange={(e) => setNewFeedback(e.target.value)}
    placeholder="Enter feedback"
    className="p-2 border border-gray-300 rounded-md"
  />

  <button
    type="button"
    onClick={() => {
      if (!newFeedback.trim()) return;
      const entry = {
        message: newFeedback,
        date: new Date().toISOString().split("T")[0]
      };
      setFormData(prev => ({
  ...prev,
  feedback: [...prev.feedback, entry]
}));

      setNewFeedback("");
    }}
    className="mt-2 bg-blue-500 text-white px-4 py-1 rounded-md"
  >
    ➕ Add Feedback
  </button>
</div>


          {/* Submit */}
          <button
            type="submit"
            className="md:col-span-3 bg-yellow-400 text-gray-800 font-semibold py-2 rounded-md hover:bg-yellow-300 transition"
          >
            {editingId ? "Update Enquiry" : "Create Enquiry"}
          </button>
        </form>
      </div>

      {/* ------------------------------ FILTER AREA ---------------------------- */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-xl shadow-sm p-4 mb-6">
        <h2 className="text-lg font-semibold mb-3 text-yellow-700 border-b border-yellow-300 pb-2">
          Filter Enquiries
        </h2>

        <div className="space-y-4">
  <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
    {/* Search */}
    <div className="flex flex-col">
      <label className="mb-1 font-semibold text-gray-700">Search</label>
      <input
        name="search"
        value={filters.search}
        onChange={handleFilterChange}
        placeholder="Search by name or number"
        className="p-2 border border-gray-300 rounded-md"
      />
    </div>

    {/* Status */}
    <div className="flex flex-col">
      <label className="mb-1 font-semibold text-gray-700">Status</label>
      <select
        name="status"
        value={filters.status}
        onChange={handleFilterChange}
        className="p-2 border border-gray-300 rounded-md"
      >
        <option value="">All Status</option>
        <option value="Pending">Pending</option>
        <option value="Converted">Converted</option>
        <option value="Closed">Closed</option>
      </select>
    </div>

    {/* Convertibility */}
    <div className="flex flex-col">
      <label className="mb-1 font-semibold text-gray-700">Convertibility</label>
      <select
        name="convertibility"
        value={filters.convertibility}
        onChange={handleFilterChange}
        className="p-2 border border-gray-300 rounded-md"
      >
        <option value="">All Convertibility</option>
        <option value="Hot">Hot</option>
        <option value="Warm">Warm</option>
        <option value="Cold">Cold</option>
      </select>
    </div>

    {/* From Date */}
    <div className="flex flex-col">
      <label className="mb-1 font-semibold text-gray-700">From Date</label>
      <input
        name="fromDate"
        type="date"
        value={filters.fromDate}
        onChange={handleFilterChange}
        className="p-2 border border-gray-300 rounded-md"
      />
    </div>

    {/* To Date */}
    <div className="flex flex-col">
      <label className="mb-1 font-semibold text-gray-700">To Date</label>
      <input
        name="toDate"
        type="date"
        value={filters.toDate}
        onChange={handleFilterChange}
        className="p-2 border border-gray-300 rounded-md"
      />
    </div>
  </div>

  {/* Reset Button */}
  <div className="flex justify-end">
    <button
      type="button"
      onClick={() =>
        setFilters({
          search: "",
          status: "",
          convertibility: "",
          fromDate: "",
          toDate: "",
        })
      }
      className="bg-yellow-400 text-gray-800 font-semibold py-2 px-4 rounded-md hover:bg-yellow-300 transition"
    >
      Reset Filters
    </button>
  </div>
</div>



      </div>

      {/* ------------------------------ TABLE AREA ----------------------------- */}
      <div className="bg-white border border-yellow-200 rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-semibold mb-4 border-b border-yellow-300 pb-2 text-yellow-700">
          Enquiry Records
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left border border-yellow-300 text-gray-700 border-collapse">
            <thead className="bg-yellow-100 text-yellow-800 font-semibold">
              <tr>
                <th className="p-2 border-b border-yellow-300">S.No</th>
                <th className="p-2 border-b border-yellow-300">Name</th>
                <th className="p-2 border-b border-yellow-300">Number</th>
                <th className="p-2 border-b border-yellow-300">For</th>
                <th className="p-2 border-b border-yellow-300">Next Follow-up</th>
                <th className="p-2 border-b border-yellow-300">Status</th>
                <th className="p-2 border-b border-yellow-300">Convertibility</th>
                <th className="p-2 border-b border-yellow-300 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredInquiries.length > 0 ? (
                filteredInquiries.map((inq, index) => (
                  <tr
                    key={inq._id}
                    className="border-t border-yellow-200 hover:bg-yellow-50"
                  >
                    <td className="p-2">{index + 1}</td>
                    <td className="p-2">
                      {inq.firstName} {inq.lastName}
                    </td>
                    <td className="p-2">{inq.contactNumber}</td>
                    <td className="p-2">{inq.inquiryFor}</td>
                    <td className="p-2">{inq.scheduleFollowUp}</td>
                    <td className="p-2">{inq.status}</td>
                    <td className="p-2">{inq.convertibility}</td>
                    <td className="p-2 text-center">
                      <div className="flex justify-center gap-2">
                        <button
  onClick={async () => {
    const res = await axios.get(`${API_URL}/${inq._id}`);

    // Always treat API response as the inquiry object
    const data = res.data;

    setViewData({
      ...data,
      feedback: Array.isArray(data.feedback) ? data.feedback : [],
    });

    setIsViewModalOpen(true);
  }}
  className="bg-green-100 text-green-700 px-3 py-1 rounded-md font-semibold hover:bg-green-200"
>
  View
</button>

                        <button
                          onClick={() => handleEdit(inq)}
                          className="bg-blue-100 text-blue-700 px-3 py-1 rounded-md font-semibold hover:bg-blue-200"
                        >
                          Update
                        </button>
                        <button
                          onClick={() => handleDelete(inq._id)}
                          className="bg-red-100 text-red-700 px-3 py-1 rounded-md font-semibold hover:bg-red-200"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={8}
                    className="text-center py-4 text-gray-500"
                  >
                    No enquiries found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      {/* VIEW MODAL */}
<Modal isOpen={isViewModalOpen} onClose={() => setIsViewModalOpen(false)}>
  <h2 className="text-lg font-semibold mb-4 text-yellow-700 border-b pb-2">
    Enquiry Details
  </h2>

 {viewData && (
  <div className="text-gray-700">

    {/* 2 COLUMN GRID */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

      {/* LEFT COLUMN */}
      <div className="space-y-4">

        <h3 className="font-bold text-md border-b pb-1">Personal Details</h3>
        <p><strong>Name:</strong> {viewData.firstName} {viewData.lastName}</p>
        <p><strong>Gender:</strong> {viewData.gender}</p>
        <p><strong>Date of Birth:</strong> {viewData.dateOfBirth}</p>

        <h3 className="font-bold text-md border-b pb-1">Contact Details</h3>
        <p><strong>Contact:</strong> {viewData.contactNumber}</p>
        <p><strong>Alternate Contact:</strong> {viewData.alternateContact}</p>
        <p><strong>Email:</strong> {viewData.email}</p>

        <h3 className="font-bold text-md border-b pb-1">Address</h3>
        <p><strong>Area Address:</strong> {viewData.areaAddress}</p>

      </div>

      {/* RIGHT COLUMN */}
      <div className="space-y-4">

        <h3 className="font-bold text-md border-b pb-1">Enquiry Info</h3>
        <p><strong>Inquiry For:</strong> {viewData.inquiryFor}</p>
        <p><strong>Source:</strong> {viewData.source}</p>
        <p><strong>Status:</strong> {viewData.status}</p>
        <p><strong>Convertibility:</strong> {viewData.convertibility}</p>
        <p><strong>Attended By:</strong> {viewData.attendedBy}</p>
        <p><strong>Next Follow-up:</strong> {viewData.scheduleFollowUp}</p>

        <h3 className="font-bold text-md border-b pb-1">Meta Info</h3>
        <p><strong>Created At:</strong> {new Date(viewData.createdAt!).toLocaleString()}</p>
        <p><strong>Updated At:</strong> {new Date(viewData.updatedAt!).toLocaleString()}</p>

      </div>
    </div>

    {/* FULL WIDTH FEEDBACK HISTORY */}
    <div className="mt-6">
      <h3 className="font-semibold text-md border-b pb-1">Feedback History</h3>

      {(viewData.feedback?.length === 0) && (
        <p className="text-gray-500 text-sm mt-2">No feedback added</p>
      )}

      {viewData.feedback?.map((fb, i) => (
        <div
          key={i}
          className="border p-3 rounded bg-gray-100 mt-2"
        >
          <p className="font-medium">{fb.date}</p>
          <p>{fb.message}</p>
        </div>
      ))}
    </div>

  </div>
)}


</Modal>

{/* ------------------------------ EDIT MODAL ----------------------------- */}
<Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
  <h2 className="text-lg font-semibold mb-4 border-b border-yellow-300 pb-2 text-yellow-700">
    Update Enquiry
  </h2>

  <form
    onSubmit={handleSubmit}
    className="grid grid-cols-1 md:grid-cols-3 gap-4 text-gray-700"
  >
    {/* Text Inputs */}
    <div className="flex flex-col">
      <label className="mb-1 font-semibold">First Name</label>
      <input
        name="firstName"
        value={formData.firstName}
        onChange={handleChange}
        className="p-2 border border-gray-300 rounded-md"
        required
      />
    </div>

    <div className="flex flex-col">
      <label className="mb-1 font-semibold">Last Name</label>
      <input
        name="lastName"
        value={formData.lastName}
        onChange={handleChange}
        className="p-2 border border-gray-300 rounded-md"
      />
    </div>

    <div className="flex flex-col">
      <label className="mb-1 font-semibold">Contact Number</label>
      <input
        name="contactNumber"
        value={formData.contactNumber}
        onChange={handleChange}
        className="p-2 border border-gray-300 rounded-md"
        required
      />
    </div>

    <div className="flex flex-col">
      <label className="mb-1 font-semibold">Alternate Contact</label>
      <input
        name="alternateContact"
        value={formData.alternateContact}
        onChange={handleChange}
        className="p-2 border border-gray-300 rounded-md"
      />
    </div>

    <div className="flex flex-col">
      <label className="mb-1 font-semibold">Email</label>
      <input
        type="email"
        name="email"
        value={formData.email}
        onChange={handleChange}
        className="p-2 border border-gray-300 rounded-md"
      />
    </div>

    {/* Gender */}
    <div className="flex flex-col">
      <label className="mb-1 font-semibold">Gender</label>
      <select
        name="gender"
        value={formData.gender}
        onChange={handleChange}
        className="p-2 border border-gray-300 rounded-md"
      >
        <option value="">Select Gender</option>
        <option value="Male">Male</option>
        <option value="Female">Female</option>
      </select>
    </div>

    {/* Address */}
    <div className="md:col-span-2 flex flex-col">
      <label className="mb-1 font-semibold">Area Address</label>
      <input
        name="areaAddress"
        value={formData.areaAddress}
        onChange={handleChange}
        className="p-2 border border-gray-300 rounded-md"
      />
    </div>

    {/* Schedule Follow-up */}
    <div className="flex flex-col">
      <label className="mb-1 font-semibold">Schedule Follow-up</label>
      <input
        name="scheduleFollowUp"
        type="date"
        value={formData.scheduleFollowUp}
        onChange={handleChange}
        className="p-2 border border-gray-300 rounded-md"
      />
    </div>

    {/* DOB */}
    <div className="flex flex-col">
      <label className="mb-1 font-semibold">Date of Birth</label>
      <input
        name="dateOfBirth"
        type="date"
        value={formData.dateOfBirth}
        onChange={handleChange}
        className="p-2 border border-gray-300 rounded-md"
      />
    </div>

    {/* Status */}
    <div className="flex flex-col">
      <label className="mb-1 font-semibold">Status</label>
      <select
        name="status"
        value={formData.status}
        onChange={handleChange}
        className="p-2 border border-gray-300 rounded-md"
      >
        <option value="Pending">Pending</option>
        <option value="Converted">Converted</option>
        <option value="Closed">Closed</option>
      </select>
    </div>

    {/* Attended By */}
    <div className="flex flex-col">
       <label className="mb-1 font-semibold">Attended By</label>
      <select
  name="attendedBy"
  value={formData.attendedBy}
  onChange={handleChange}
  className="p-2 border border-gray-300 rounded-md"
>
  <option value="">Select Staff</option>

  {attendedByOptions.map((name) => (
    <option key={name} value={name}>{name}</option>
  ))}
</select>

    </div>

    {/* Convertibility */}
    <div className="flex flex-col">
      <label className="mb-1 font-semibold">Convertibility</label>
      <select
        name="convertibility"
        value={formData.convertibility}
        onChange={handleChange}
        className="p-2 border border-gray-300 rounded-md"
      >
        <option value="Hot">Hot</option>
        <option value="Warm">Warm</option>
        <option value="Cold">Cold</option>
      </select>
    </div>

    {/* Source */}
    <div className="flex flex-col">
      <label className="mb-1 font-semibold">Source</label>
      <input
        name="source"
        value={formData.source}
        onChange={handleChange}
        className="p-2 border border-gray-300 rounded-md"
      />
    </div>

    {/* Inquiry For */}
    <div className="flex flex-col">
      <label className="mb-1 font-semibold">Inquiry For</label>
        <select
    name="inquiryFor"
    value={formData.inquiryFor}
    onChange={handleChange}
    className="p-2 border border-gray-300 rounded-md"
  >
    <option value="">Select Package</option>

    {packages.map((pkg, idx) => (
      <option key={idx} value={pkg}>{pkg}</option>
    ))}
  </select>
    </div>

  {/* Add Feedback in Edit Modal */}
<div className="md:col-span-3 flex flex-col">
  <label className="mb-1 font-semibold">Add Feedback</label>
  <textarea
    value={newFeedback}
    onChange={(e) => setNewFeedback(e.target.value)}
    placeholder="Enter new feedback"
    className="p-2 border border-gray-300 rounded-md"
  />

  <button
    type="button"
    onClick={() => {
      if (!newFeedback.trim()) return;

      const entry = {
        message: newFeedback,
        date: new Date().toISOString().split("T")[0],
      };

      setFormData(prev => ({
  ...prev,
  feedback: [...prev.feedback, entry]
}));

      setNewFeedback("");
    }}
    className="mt-2 bg-blue-500 text-white px-4 py-1 rounded-md"
  >
    ➕ Add Feedback
  </button>
</div>

{/* Feedback History */}
<div className="md:col-span-3">
  <label className="font-semibold mb-2 block">Feedback History:</label>

  {formData.feedback?.length === 0 && (
    <p className="text-gray-500 text-sm">No feedback added</p>
  )}

  {formData.feedback?.map((fb, index) => (
    <div
      key={index}
      className="bg-gray-100 border border-gray-300 rounded-md p-2 mb-2"
    >
      <p className="font-medium">{fb.date}</p>
      <p>{fb.message}</p>
    </div>
  ))}
</div>


    <button
      type="submit"
      className="md:col-span-3 bg-yellow-400 text-gray-800 font-semibold py-2 rounded-md hover:bg-yellow-300 transition"
    >
      Save Changes
    </button>
  </form>
</Modal>

    </div>
  );
}
