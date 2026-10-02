import React, { useEffect, useState } from "react";
import axios from "axios";
import { API_URI } from "../api/api";
import {
  formatWhatsAppPhone,
  getDirectWhatsAppUrl,
  getWhatsAppDesktopAppUrl,
  getWhatsAppApiUrl,
} from "../utils/whatsapp";

interface Trainer {
  id?: string;
  _id?: string;
  name: string;
}

interface Package {
  id: string;
  name: string;
  durationDays: number;
  price: number;
}



const GymBillForm: React.FC = () => {
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [packages, setPackages] = useState<Package[]>([]);
  const [error, setError] = useState<string>("");
  const [ptAmount, setPtAmount] = useState("");
  const [ptTrainer, setPtTrainer] = useState("");
  const [greetingModal, setGreetingModal] = useState<{
    client: string;
    phone: string;
    memberId: string;
    waWebLink: string;
    waApiLink: string;
    desktopAppLink: string;
    message: string;
    ptText?: string;
  } | null>(null);

  const isPTPackage = (pkg: string) => /pt|personal.?training/i.test(pkg);

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

  // Fetch next member ID from backend counter
  const fetchNextMemberId = () => {
    axios
      .get(`${API_URI}/gymbill/next-member-id`)
      .then((res) => {
        if (res.data?.nextMemberId) {
          setFormData((prev) => ({ ...prev, memberId: res.data.nextMemberId }));
        }
      })
      .catch((err) => console.error("Error fetching next member id:", err));
  };

  useEffect(() => {
    fetchNextMemberId();
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

    // Open a blank window synchronously on user click to bypass browser popup blockers
    let waTab: Window | null = null;
    try {
      waTab = window.open("about:blank", "_blank");
    } catch (e) {
      console.log("Upfront window open restricted");
    }

    try {
      const isPT = isPTPackage(formData.package);
      const effectivePtAmount = Number(ptAmount) > 0
        ? Number(ptAmount)
        : (/^(personal\s*training|pt)$/i.test(formData.package.trim())
            ? Number(formData.amountPaid || formData.price || 0)
            : 0);

      const res = await axios.post(
        `${API_URI}/gymbill`,
        {
          ...formData,
          ptAmount: effectivePtAmount,
          ptTrainer: ptTrainer || null,
        },
        { headers: { "Content-Type": "application/json" } }
      );

      // Auto-create PT session record if PT package selected
      if (isPT && effectivePtAmount > 0) {
        try {
          await axios.post(`${API_URI}/pts`, {
            clientName: formData.client,
            trainerId: ptTrainer || undefined,
            sessions: Number(formData.sessions) || 1,
            price: effectivePtAmount,
          });
        } catch (ptErr) {
          console.warn("⚠️ PT session record creation failed:", ptErr);
        }
      }

      // Format WhatsApp greeting message mentioning PT and payment details
      const phone = formatWhatsAppPhone(formData.contactNumber);
      const memberId = res.data?.memberId || "";
      const ptText = effectivePtAmount > 0
        ? `\n🏋️ *Personal Training Amount:* ₹${effectivePtAmount.toLocaleString("en-IN")}`
        : "";
      const balanceText = Number(formData.balance) > 0
        ? `\n💳 *Pending Balance:* ₹${Number(formData.balance).toLocaleString("en-IN")}`
        : "";

      const greetingMsg =
        `✅ *Welcome to Elite Fitness!* 💪🏋️‍♂️\n\n` +
        `Hi *${formData.client}* (Member ID: *${memberId || "N/A"}*),\n\n` +
        `Your membership has been created successfully!\n\n` +
        `📦 *Package:* ${formData.package || "Membership"}\n` +
        `📅 *Valid From:* ${formData.joiningDate}\n` +
        `📅 *Valid Till:* ${formData.endDate}\n` +
        `💰 *Amount Paid:* ₹${Number(formData.amountPaid || 0).toLocaleString("en-IN")}${ptText}${balanceText}\n\n` +
        `We're excited to have you on board. Stay fit & crush your goals! 🔥\n` +
        `— *Elite Fitness*`;

      const waWebLink = getDirectWhatsAppUrl(formData.contactNumber, greetingMsg);
      const waApiLink = getWhatsAppApiUrl(formData.contactNumber, greetingMsg);
      const desktopAppLink = getWhatsAppDesktopAppUrl(formData.contactNumber, greetingMsg);

      // Redirect the upfront window if available
      if (waTab && !waTab.closed) {
        try {
          waTab.location.href = waWebLink;
        } catch (navErr) {
          console.log("Could not update location on upfront window:", navErr);
        }
      } else {
        // Fallback: try anchor click or direct window.open
        try {
          const a = document.createElement("a");
          a.href = waWebLink;
          a.target = "_blank";
          a.rel = "noopener noreferrer";
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
        } catch (err) {
          window.open(waWebLink, "_blank");
        }
      }

      // Open Success & WhatsApp Greeting Modal
      setGreetingModal({
        client: formData.client,
        phone,
        memberId,
        waWebLink,
        waApiLink,
        desktopAppLink,
        message: greetingMsg,
        ptText: effectivePtAmount > 0 ? `PT Share: ₹${effectivePtAmount}` : undefined,
      });

      setPtAmount("");
      setPtTrainer("");

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
      setPtAmount("");
      setPtTrainer("");
      fetchNextMemberId();
    } catch (err: any) {
      if (waTab && !waTab.closed) {
        waTab.close();
      }
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

      {/* 🎉 WhatsApp Greeting Overlay Modal */}
      {greetingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-yellow-200 overflow-hidden transform transition-all">
            <div className="bg-gradient-to-r from-yellow-400 to-amber-500 p-4 text-white">
              <h3 className="font-bold text-lg flex items-center gap-2">
                🎉 Client Saved Successfully!
              </h3>
              <p className="text-xs text-yellow-100 mt-0.5">
                Member ID: #{greetingModal.memberId} • {greetingModal.client} {greetingModal.ptText ? `(${greetingModal.ptText})` : ""}
              </p>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                  Greeting Message Preview:
                </p>
                <div className="bg-yellow-50/70 p-3 rounded-xl border border-yellow-200 text-xs text-gray-700 whitespace-pre-wrap max-h-40 overflow-y-auto">
                  {greetingModal.message}
                </div>
              </div>

              <div className="space-y-2.5 pt-2">
                <a
                  href={greetingModal.waWebLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-semibold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition shadow-md text-sm cursor-pointer"
                >
                  <span>💬 Open WhatsApp Web Chat</span>
                </a>

                <a
                  href={greetingModal.waApiLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full bg-teal-600 hover:bg-teal-700 active:scale-98 text-white font-medium py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 transition text-xs cursor-pointer"
                >
                  <span>📱 Open Direct WhatsApp (wa.me / Web / Mobile)</span>
                </a>

                <a
                  href={greetingModal.desktopAppLink}
                  className="w-full bg-green-700 hover:bg-green-800 active:scale-98 text-white font-medium py-2 px-4 rounded-xl flex items-center justify-center gap-2 transition text-xs cursor-pointer"
                >
                  <span>💻 Open in WhatsApp Desktop App</span>
                </a>
              </div>
            </div>

            <div className="bg-gray-50 px-5 py-3 flex justify-end border-t border-gray-100">
              <button
                type="button"
                onClick={() => setGreetingModal(null)}
                className="text-xs font-semibold text-gray-500 hover:text-gray-800 px-4 py-2 rounded-lg cursor-pointer"
              >
                Done / Close
              </button>
            </div>
          </div>
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="bg-white mt-4 p-4 sm:p-6 rounded-lg shadow-md text-xs sm:text-sm space-y-6"
      >
        {/* Row 1: Member ID & Invoice Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 bg-yellow-50/50 p-3.5 rounded-xl border border-yellow-200">
          <div>
            <label className="block text-xs font-semibold text-yellow-800 mb-1">
              🆔 Member ID (Auto-assigned)
            </label>
            <input
              name="memberId"
              value={formData.memberId}
              onChange={handleChange}
              className="border p-2 w-full rounded bg-white font-mono font-bold text-yellow-900 border-yellow-300"
              placeholder="e.g. 1093"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-yellow-800 mb-1">
              📅 Invoice Date
            </label>
            <input
              type="date"
              name="invoiceDate"
              value={formData.invoiceDate}
              onChange={handleChange}
              className="border p-2 w-full rounded bg-white border-yellow-200"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-yellow-800 mb-1">
              📄 Invoice ID (Optional)
            </label>
            <input
              name="invoiceId"
              value={formData.invoiceId}
              onChange={handleChange}
              className="border p-2 w-full rounded bg-white border-yellow-200"
              placeholder="Enter Invoice ID"
            />
          </div>
        </div>

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
            const selected = packages.find((p) => p.name === e.target.value);
            const days = selected ? selected.durationDays : 0;
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
            <option value="Personal Training">🏋️ Personal Training</option>
          {packages.map((pkg) => (
            <option key={pkg.id} value={pkg.name}>
              {pkg.name}
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
            <option key={t.id || t._id} value={t.name}>{t.name}</option>
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

      {/* 🏋️ PT Fields — shown only when PT package selected */}
      {isPTPackage(formData.package) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border border-yellow-300 bg-yellow-50 p-3 rounded-lg">
          <div>
            <label className="block text-xs font-semibold text-yellow-700 mb-1">🏋️ PT Amount (₹)</label>
            <input
              type="number"
              placeholder="Enter PT amount"
              value={ptAmount}
              onChange={(e) => setPtAmount(e.target.value)}
              className="border p-2 w-full rounded border-yellow-400"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-yellow-700 mb-1">PT Trainer</label>
            <select
              value={ptTrainer}
              onChange={(e) => setPtTrainer(e.target.value)}
              className="border p-2 w-full rounded border-yellow-400"
            >
              <option value="">Select PT Trainer</option>
              {trainers.map((t) => (
                <option key={t.id || t._id} value={t.id || t._id}>{t.name}</option>
              ))}
            </select>
          </div>
        </div>
      )}

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
