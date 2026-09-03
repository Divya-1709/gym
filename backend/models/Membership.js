import mongoose from "mongoose";

const membershipSchema = new mongoose.Schema({
  clientId: { type: mongoose.Schema.Types.ObjectId, ref: "Client", required: true },
  membershipType: { type: String, enum: ["Membership", "Personal Training", "Group Class"], required: true },
  packageName: String,
  joiningDate: String,
  endDate: String,
  sessions: Number,
  price: Number,
  discountPercent: Number,
  discountAmount: Number,
  admissionCharges: Number,
  tax: Number,
  amountPayable: Number,
  amountPaid: Number,
  paymentMode: String,
  balance: Number,
  followupDate: String,
  status: String,
  paymentDetails: String,
  appointTrainer: String
}, { timestamps: true });

export default mongoose.model("Membership", membershipSchema);
