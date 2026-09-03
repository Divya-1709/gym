import mongoose from "mongoose";

const groupClassSchema = new mongoose.Schema({
  className: String,
  trainerName: String,
  schedule: String,
  maxMembers: Number,
  fee: Number,
});

export default mongoose.model("GroupClass", groupClassSchema);
