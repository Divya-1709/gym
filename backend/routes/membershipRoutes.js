import express from "express";
import Membership from "../models/Membership.js";

const router = express.Router();

// Create single membership
router.post("/", async (req, res) => {
  try {
    const membership = new Membership(req.body);
    await membership.save();
    res.status(201).json(membership);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Bulk create memberships (pass memberships: [ .. ] + clientId)
router.post("/bulk", async (req, res) => {
  try {
    const { clientId, memberships } = req.body;
    if (!clientId || !Array.isArray(memberships)) {
      return res.status(400).json({ message: "clientId and memberships[] required" });
    }
    const docs = memberships.map(m => ({ ...m, clientId }));
    const created = await Membership.insertMany(docs);
    res.status(201).json(created);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Get all memberships (optionally filter by clientId)
router.get("/", async (req, res) => {
  try {
    const filter = {};
    if (req.query.clientId) filter.clientId = req.query.clientId;
    const memberships = await Membership.find(filter).populate("clientId", "name contactNumber").sort({ createdAt: -1 });
    res.json(memberships);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get("/client/:clientId", async (req, res) => {
  try {
    const memberships = await Membership.find({ clientId: req.params.clientId });
    res.json(memberships);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update membership details
router.put("/:id", async (req, res) => {
  try {
    const updated = await Membership.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
