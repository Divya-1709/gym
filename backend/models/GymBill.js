import mongoose from "mongoose";

const gymBillSchema = new mongoose.Schema(
  {
    memberId: String,
    client: String,
    contactNumber: String,
    alternateContact: String,
    email: String,
    clientSource: String,
    gender: String,
    dateOfBirth: String,
    anniversary: String,
    profession: String,
    taxId: String,
    workoutHours: String,
    areaAddress: String,
    remarks: String,

    profilePicture: {
      data: Buffer,
      contentType: String,
    },

    // ⭐ Initial Bill Details
    package: String,
    joiningDate: String,
    endDate: String,
    sessions: Number,
    price: Number,

    discountAmount: {
      type: Number,
      default: 0,
    },

    admissionCharges: Number,
    tax: Number,
    amountPayable: Number,
    amountPaid: Number,
    balance: Number,
    amount: Number,

    // ⭐ SAVE mode of payment for NEW CLIENT
    initialPaymentMode: String,

    followupDate: String,

    status: {
      type: String,
      enum: ["Active", "Inactive"],
      default: "Active",
    },

    paymentMethodDetail: String,
    appointTrainer: String,
    clientRep: String,

    // 💰 PAYMENT HISTORY (Correct)
    paymentHistory: [
      {
        amount: Number,
        mode: String,
        note: String,
        date: { type: Date, default: Date.now },
      },
    ],

    // 🔁 RENEWAL HISTORY (modeOfPayment included)
    renewalHistory: [
      {
        joiningDate: String,
        endDate: String,
        package: String,
        price: Number,
        admissionCharges: Number,   // ⭐ Added (missing earlier)
        discountAmount: Number,
        amountPaid: Number,
        balance: Number,
        remarks: String,
        trainer: String,
        modeOfPayment: String, // ⭐ Mode of payment for renewal
        date: { type: Date, default: Date.now },
      },
    ],

    // 📊 BALANCE HISTORY
    balanceHistory: [
      {
        previousBalance: Number,
        newBalance: Number,
        change: Number,
        reason: String,
        date: { type: Date, default: Date.now },
      },
    ],
  },

  { timestamps: true }
);

export default mongoose.model("GymBill", gymBillSchema);
