import mongoose from "mongoose";
import Client from "./Client.js";
import Trainer from "./Trainer.js";

const subscriptionSchema = new mongoose.Schema(
  {
    subscriptionId: { type: String, unique: true },
    clientId: { type: mongoose.Schema.Types.ObjectId, ref: "Client", required: true },

    // Embed trainer info directly
    trainer: {
      _id: { type: mongoose.Schema.Types.ObjectId, ref: "Trainer" },
      name: String,
      specialization: String,
      contactNumber: String,
      email: String,
    },

    packageType: { type: String, required: true },
    packageName: { type: String, required: true },
    startDate: { type: Date, required: true }, // <-- Date type
    endDate: { type: Date, required: true },   // <-- Date type
    price: { type: Number, required: true },
    amountPaid: { type: Number, default: 0 },
    paymentMode: { type: String, required: true },
  },
  { timestamps: true }
);

// Auto-generate subscriptionId
subscriptionSchema.pre("save", async function (next) {
  if (this.isNew) {
    const client = await Client.findById(this.clientId);
    if (!client) return next(new Error("Client not found"));
    const count =
      (await mongoose.model("Subscription").countDocuments({ clientId: this.clientId })) + 1;
    this.subscriptionId = `INV-${client.clientId}-${String(count).padStart(2, "0")}`;
  }
  next();
});

export default mongoose.model("Subscription", subscriptionSchema);
