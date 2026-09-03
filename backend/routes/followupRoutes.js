import express from "express";
import mongoose from "mongoose"; // ✅ FIX ADDED
import Followup from "../models/Followup.js";
import GymBill from "../models/GymBill.js";

const router = express.Router();

// ✅ CREATE follow-up
router.post("/", async (req, res) => {
  try {
    const {
      clientId,
      followupType,
      scheduleDate,
      scheduleTime,
      response,
      createdBy,
    } = req.body;

    let client = null;

    // ✅ Check if it's a valid ObjectId
    if (mongoose.Types.ObjectId.isValid(clientId)) {
      client = await GymBill.findById(clientId);
    }

    // ✅ If not found, try memberId
    if (!client) {
      client = await GymBill.findOne({ memberId: clientId });
    }

    if (!client) {
      return res.status(404).json({ message: "Client not found" });
    }

    const followup = new Followup({
      client: client._id,
      followupType,
      scheduleDate,
      scheduleTime,
      response,
      createdBy,
    });

    await followup.save();

    res.status(201).json(followup);
  } catch (err) {
    console.error("❌ Error:", err.message);
    res.status(500).json({ message: err.message });
  }
});

// ✅ GET all follow-ups
router.get("/", async (req, res) => {
  try {
    const followups = await Followup.find()
      .populate("client", "client contactNumber memberId")
      .sort({ createdAt: -1 });

    res.status(200).json(followups);
  } catch (err) {
    console.error("❌ Error fetching follow-ups:", err.message);
    res.status(500).json({ message: "Error fetching follow-ups" });
  }
});

// ✅ UPDATE status
router.put("/:id/status", async (req, res) => {
  try {
    const { status } = req.body;

    const updated = await Followup.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ message: "Follow-up not found" });
    }

    res.status(200).json(updated);
  } catch (err) {
    console.error("❌ Error updating status:", err.message);
    res.status(500).json({ message: "Error updating status" });
  }
});

// ✅ DELETE
router.delete("/:id", async (req, res) => {
  try {
    const deleted = await Followup.findByIdAndDelete(req.params.id);

    if (!deleted) {
      return res.status(404).json({ message: "Follow-up not found" });
    }

    res.status(200).json({ message: "Follow-up deleted successfully" });
  } catch (err) {
    console.error("❌ Error deleting:", err.message);
    res.status(500).json({ message: "Error deleting follow-up" });
  }
});

export default router;