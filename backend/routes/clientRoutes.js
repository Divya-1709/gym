import express from "express";
import Client from "../models/Client.js";
import Subscription from "../models/Subscription.js";

const router = express.Router();

// CREATE client
router.post("/", async (req, res) => {
  try {
    const client = new Client(req.body);
    await client.save();
    const populatedClient = await Client.findById(client._id).populate("trainer");
    res.status(201).json(populatedClient);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// GET all clients
router.get("/", async (req, res) => {
  try {
    const clients = await Client.find().populate("trainer").sort({ createdAt: -1 });
    res.json(clients);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET single client + subscriptions
router.get("/:id", async (req, res) => {
  try {
    const client = await Client.findById(req.params.id).populate("trainer");
    if (!client) return res.status(404).json({ message: "Client not found" });

    const subscriptions = await Subscription.find({ clientId: client._id })
      .populate("trainerId", "name specialization")
      .sort({ createdAt: -1 });

    res.json({ client, subscriptions });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// UPDATE client (including isActive toggle)
router.put("/:id", async (req, res) => {
  try {
    const updatedClient = await Client.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    }).populate("trainer");
    if (!updatedClient) return res.status(404).json({ message: "Client not found" });
    res.json(updatedClient);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE client
router.delete("/:id", async (req, res) => {
  try {
    const client = await Client.findByIdAndDelete(req.params.id);
    if (!client) return res.status(404).json({ message: "Client not found" });
    await Subscription.deleteMany({ clientId: client._id });
    res.json({ message: "Client and subscriptions deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
