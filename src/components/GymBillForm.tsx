import React, { useEffect, useState } from "react";
import axios from "axios";
import { API_URI } from "../api/api";

interface Trainer {
  _id: string;
  name: string;
}

interface Package {
  _id: string;
  packageName: string;
  days: number;
  price: number;
}



const GymBillForm: React.FC = () => {
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [packages, setPackages] = useState<Package[]>([]);
  const [error, setError] = useState<string>("");

  const [formData, setFormData] = useState({
    invoiceId: "",
    memberId: "",
    invoiceDate: new Date().toISOString().split("T")[0],
    client: "",
    contactNumber: "",
    alternateContact: "",
    email: "",
    clientSource: "",
    gender: "",
    dateOfBirth: "",
    anniversary: "",
    profession: "",
    taxId: "",
    workoutHours: "",
    areaAddress: "",
    remarks: "",
    profilePicture: null as string | null, // base64
    package: "",
    days: "", // store package days as string
    joiningDate: new Date().toISOString().split("T")[0],
    endDate: new Date().toISOString().split("T")[0],
    sessions: "",
    price: "",
    discount: "",
    discountAmount: "",
    admissionCharges: "",
    tax: "",
    amountPayable: "",
    amountPaid: "",
    balance: "",
    amount: "",
    followupDate: "",
    status: "",
    paymentMethodDetail: "",
    appointTrainer: "",
    clientRep: "",
    initialPaymentMode: "",
  });

  // Calculate end date by adding days to joiningDate
  const calculateEndDate = (joiningDate: string, days: number) => {
    if (!joiningDate || !days) return "";
    const start = new Date(joiningDate);
    start.setDate(start.getDate() + days);
    return start.toISOString().split("T")[0];
  };
  const upiOptions = ["UPI", "Cash", "Card", "Bank", "Others"];


  // Fetch trainers
  useEffect(() => {
    axios
      .get(`${API_URI}/trainers`)
      .then((res) => {
        const data = res.data;
        if (Array.isArray(data)) setTrainers(data);
        else if (Array.isArray(data.trainers)) setTrainers(data.trainers);
        else setTrainers([]);
      })
      .catch((err) => console.error("Error fetching trainers:", err));
  }, []);

  // Fetch packages
  useEffect(() => {
    axios
      .get(`${API_URI}/packages`)
      .then((res) => {
        if (Array.isArray(res.data)) setPackages(res.data);
      })
      .catch((err) => console.error("Error fetching packages:", err));
  }, []);

  // Auto calculation for amounts and balance
 useEffect(() => {
  const price = Number(formData.price) || 0;
  const discountAmount = Number(formData.discountAmount) || 0;
  const admissionCharges = Number(formData.admissionCharges) || 0;
  const taxPercent = Number(formData.tax) || 0;
  const amountPaid = Number(formData.amountPaid) || 0;

  const taxableAmount = price - discountAmount + admissionCharges;
  const taxAmount = taxableAmount * (taxPercent / 100);
  const amountPayable = taxableAmount + taxAmount;
  const balance = amountPayable - amountPaid;

  setFormData(prev => ({
    ...prev,
    amountPayable: amountPayable.toFixed(2),
    balance: balance.toFixed(2)
  }));
}, [
  formData.price,
  formData.discountAmount,
  formData.admissionCharges,
  formData.tax,
  formData.amountPaid
]);

  // Generic input handler
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setError("");
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // File input (convert to base64 string)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({ ...prev, profilePicture: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Submit handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validate required fields (memberId, client, contactNumber as example)
   
    if (!formData.client.trim()) {
      setError("Please enter Client name.");
      return;
    }
    if (!formData.contactNumber.trim()) {
      setError("Please enter Contact Number.");
      return;
    }

    try {
      const res = await axios.post(
        `${API_URI}/gymbill`,
        formData,
        { headers: { "Content-Type": "application/json" } }
      );

      alert("Gym Bill saved successfully!");

      if (res.data?.whatsappLink && !res.data?.whatsappApiSent) {
        const confirmSend = window.confirm("Do you want to send the Welcome Greeting on WhatsApp now?");
        if (confirmSend) {
          window.open(res.data.whatsappLink, "_blank");
        }
      }

      // Reset form (keep invoiceDate and joiningDate to today)
      setFormData({
        invoiceId: "",
        memberId: "",
        invoiceDate: new Date().toISOString().split("T")[0],
        client: "",
        contactNumber: "",
        alternateContact: "",
        email: "",
        clientSource: "",
        gender: "",
        dateOfBirth: "",
        anniversary: "",
        profession: "",
        taxId: "",
        workoutHours: "",
        areaAddress: "",
        remarks: "",
        profilePicture: null,
        package: "",
        days: "",
        joiningDate: new Date().toISOString().split("T")[0],
        endDate: new Date().toISOString().split("T")[0],
        sessions: "",
        price: "",
        discount: "",
        discountAmount: "",
        admissionCharges: "",
        tax: "",
        amountPayable: "",
        amountPaid: "",
        balance: "",
        amount: "",
        followupDate: "",
        status: "",
        paymentMethodDetail: "",
        appointTrainer: "",
        clientRep: "",
        initialPaymentMode: "",
      });
    } catch (err: any) {
      console.error("Error submitting form:", err);
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError("Error submitting form. Please try again.");
      }
    }
  };

 return (
  <div className="p-3 sm:p-4 md:p-6 bg-[#f4f7fb] min-h-screen">
    
    <h2 className="bg-yellow-300 text-white text-xs sm:text-sm font-semibold p-2 rounded">
      Create New Bill for Gym Membership
    </h2>

    <form
      onSubmit={handleSubmit}
      className="bg-white mt-4 p-4 sm:p-6 rounded-lg shadow-md text-xs sm:text-sm space-y-6"
    >

      

      {/* Row 2 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <input name="client" value={formData.client} onChange={handleChange} className="border p-2 w-full rounded" placeholder="Client*" />
        <input name="contactNumber" value={formData.contactNumber} onChange={handleChange} className="border p-2 w-full rounded" placeholder="Contact Number*" />
        <input name="alternateContact" value={formData.alternateContact} onChange={handleChange} className="border p-2 w-full rounded" placeholder="Alternate Contact" />
      </div>

      {/* Row 3 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <input name="email" value={formData.email} onChange={handleChange} className="border p-2 w-full rounded" placeholder="Email" />
        <input name="clientSource" value={formData.clientSource} onChange={handleChange} className="border p-2 w-full rounded" placeholder="Client Source" />
        <select name="gender" value={formData.gender} onChange={handleChange} className="border p-2 w-full rounded">
          <option value="">Select Gender</option>
          <option>Male</option>
          <option>Female</option>
          <option>Other</option>
        </select>
      </div>

      {/* Row 4 */}
     <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

  <div className="flex flex-col">
    <label className="mb-1 text-sm font-medium">Date of Birth</label>
    <input
      type="date"
      name="dateOfBirth"
      value={formData.dateOfBirth}
      onChange={handleChange}
      className="border p-2 w-full rounded"
    />
  </div>

  <div className="flex flex-col">
    <label className="mb-1 text-sm font-medium">Anniversary</label>
    <input
      type="date"
      name="anniversary"
      value={formData.anniversary}
      onChange={handleChange}
      className="border p-2 w-full rounded"
    />
  </div>

  <div className="flex flex-col">
    <input
      name="profession"
      value={formData.profession}
      onChange={handleChange}
      className="border p-2 w-full rounded"
      placeholder="Enter profession"
    />
  </div>

</div>

      {/* Row 5 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <input name="taxId" value={formData.taxId} onChange={handleChange} className="border p-2 w-full rounded" placeholder="Tax ID" />
        <input name="workoutHours" value={formData.workoutHours} onChange={handleChange} className="border p-2 w-full rounded" placeholder="Workout Hours" />
        <textarea name="areaAddress" value={formData.areaAddress} onChange={handleChange} className="border p-2 w-full rounded" placeholder="Address"></textarea>
      </div>

      {/* Row 6 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <textarea name="remarks" value={formData.remarks} onChange={handleChange} className="border p-2 w-full h-16 sm:h-20 rounded" placeholder="Remarks"></textarea>

        <div className="sm:col-span-2">
          <label>Profile Picture</label>
          <div className="border border-dashed p-4 text-center rounded-lg">
            <input type="file" accept="image/*" onChange={handleFileChange} />
          </div>
        </div>
      </div>

      {/* Package */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <select
          name="package"
          value={formData.package}
          onChange={(e) => {
            const selected = packages.find((p) => p.packageName === e.target.value);
            const days = selected ? selected.days : 0;
            const price = selected ? selected.price : 0;
            const newEnd = calculateEndDate(formData.joiningDate, days);

            setFormData((prev) => ({
              ...prev,
              package: e.target.value,
              days: days.toString(),
              price: price.toString(),
              endDate: newEnd,
            }));
          }}
          className="border p-2 w-full rounded"
        >
          <option value="">Select Package</option>
          {packages.map((pkg) => (
            <option key={pkg._id} value={pkg.packageName}>
              {pkg.packageName}
            </option>
          ))}
        </select>

        <input
          type="date"
          name="joiningDate"
          value={formData.joiningDate}
          onChange={(e) => {
            const newJoin = e.target.value;
            const newEnd = calculateEndDate(newJoin, parseInt(formData.days) || 0);
            setFormData((prev) => ({ ...prev, joiningDate: newJoin, endDate: newEnd }));
          }}
          className="border p-2 w-full rounded"
        />

        <input type="date" name="endDate" value={formData.endDate} readOnly className="border p-2 w-full bg-gray-50 rounded" />
      </div>

      {/* Charges */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <input name="sessions" value={formData.sessions} onChange={handleChange} className="border p-2 w-full rounded" placeholder="Sessions" />
        <input name="admissionCharges" value={formData.admissionCharges} onChange={handleChange} className="border p-2 w-full rounded" placeholder="Admission Charges" />
        <input name="discountAmount" value={formData.discountAmount} onChange={handleChange} className="border p-2 w-full rounded" placeholder="Discount Amount" />
      </div>

      {/* Price */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <input name="price" value={formData.price} onChange={handleChange} className="border p-2 w-full rounded" placeholder="Price" />
        <input name="tax" value={formData.tax} onChange={handleChange} className="border p-2 w-full rounded" placeholder="Tax %" />
      </div>

      {/* Amounts */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <input name="amountPayable" value={formData.amountPayable} readOnly className="border p-2 w-full bg-gray-50 rounded" />
        <input name="amountPaid" value={formData.amountPaid} onChange={handleChange} className="border p-2 w-full rounded" placeholder="Amount paid" />
        <input name="balance" value={formData.balance} readOnly className="border p-2 w-full bg-gray-50 rounded" />
      </div>

      {/* Other */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <input name="amount" value={formData.amount} onChange={handleChange} className="border p-2 w-full rounded" placeholder="Amount" />
        <input type="date" name="followupDate" value={formData.followupDate} onChange={handleChange} className="border p-2 w-full rounded" />

        <select name="status" value={formData.status} onChange={handleChange} className="border p-2 w-full rounded">
          <option value="">Status</option>
          <option>Active</option>
          <option>Inactive</option>
          <option>Pending</option>
          <option>Completed</option>
          <option>Cancelled</option>
        </select>
      </div>

      {/* Trainer */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <select name="appointTrainer" value={formData.appointTrainer} onChange={handleChange} className="border p-2 w-full rounded">
          <option value="">Trainer</option>
          {trainers.map((t) => (
            <option key={t._id} value={t.name}>{t.name}</option>
          ))}
        </select>

        <select name="paymentMethodDetail" value={formData.paymentMethodDetail} onChange={handleChange} className="border p-2 w-full rounded">
          <option value="">Payment Mode</option>
          {upiOptions.map((upi) => (
            <option key={upi} value={upi}>{upi}</option>
          ))}
        </select>

        <input name="clientRep" value={formData.clientRep} onChange={handleChange} className="border p-2 w-full rounded" placeholder="Client Rep" />
      </div>

      {error && <p className="text-red-600 text-sm">{error}</p>}

      {/* Button */}
      <div className="flex justify-end">
        <button className="w-full sm:w-auto bg-yellow-300 text-white px-6 py-2 rounded hover:bg-[#2c2c60]">
          Save
        </button>
      </div>
    </form>
  </div>
);
};

export default GymBillForm;
