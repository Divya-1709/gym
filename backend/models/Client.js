import mongoose from "mongoose";
import Counter from "./Counter.js";

const clientSchema = new mongoose.Schema(
  {
    clientId: { type: String, unique: true }, // H4001 format
    name: { type: String, required: true },
    gender: { type: String, required: true },
    dateOfBirth: { type: String },
    contactNumber: { type: String, required: true },
    email: { type: String, required: true },
    alternateContact: { type: String },
    address: { type: String },
    emergencyContact: { type: String },
    profession: { type: String },
    taxId: { type: String },
    workout: { type: String },
    trainer: { type: mongoose.Schema.Types.ObjectId, ref: "Trainer" },
    isActive: { type: Boolean, default: true }, // NEW
  },
  { timestamps: true }
);

// Auto-generate clientId
clientSchema.pre("save", async function (next) {
  if (this.isNew) {
    const counter = await Counter.findOneAndUpdate(
      { name: "clientId" },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );
    const baseNumber = 4000;
    this.clientId = `H${baseNumber + counter.seq}`;
  }
  next();
});

export default mongoose.model("Client", clientSchema);
