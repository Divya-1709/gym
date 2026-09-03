import mongoose from "mongoose";

const followupSchema = new mongoose.Schema(
  {
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "GymBill", // ✅ changed from "Client" to "GymBill"
      required: true,
    },
   followupType: { type: String, required: true },

    scheduleDate: { type: Date, required: true },
    scheduleTime: { type: String },
    response: { type: String },
    createdBy: { type: String, default: "admin" },
    status: {
      type: String,
      enum: ["Pending", "Completed"],
      default: "Pending",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Followup", followupSchema);
