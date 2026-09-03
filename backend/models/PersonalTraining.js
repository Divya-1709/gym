import mongoose from "mongoose";

const ptSchema = new mongoose.Schema({
  trainerName: String,
  clientName: String,
  sessionType: String,
  sessionsCount: Number,
  amount: Number,
});

export default mongoose.model("PersonalTraining", ptSchema);
