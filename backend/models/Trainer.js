import mongoose from "mongoose";

const trainerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  contactNumber: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  specialization: { type: String },
  experience: { type: Number, default: 0 },
}, { timestamps: true });

export default mongoose.model("Trainer", trainerSchema);
