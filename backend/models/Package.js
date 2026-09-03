import mongoose from "mongoose";

const packageSchema = new mongoose.Schema(
  {
    packageName: { type: String, required: true, trim: true },
    days: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true, min: 0 },
  },
  { timestamps: true }
);

export default mongoose.model("Package", packageSchema);
