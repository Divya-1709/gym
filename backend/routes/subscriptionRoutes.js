import express from "express";
import Subscription from "../models/Subscription.js";
import Trainer from "../models/Trainer.js";

const router = express.Router();

// CREATE subscription
router.post("/", async (req, res) => {
  try {
    const { trainerId, ...rest } = req.body;
    let trainerData = null;

    if (trainerId) {
      const trainer = await Trainer.findById(trainerId);
      if (trainer) {
        trainerData = {
          _id: trainer._id,
          name: trainer.name,
          specialization: trainer.specialization,
          contactNumber: trainer.contactNumber,
          email: trainer.email,
        };
      }
    }

    const sub = new Subscription({ ...rest, trainer: trainerData });
    await sub.save();
    res.status(201).json(sub);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// GET all subscriptions
router.get("/", async (req, res) => {
  try {
    const subs = await Subscription.find().populate("clientId", "name clientId");
    res.json(subs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// UPDATE subscription
router.put("/:id", async (req, res) => {
  try {
    const { trainerId, ...rest } = req.body;
    let trainerData = null;

    if (trainerId) {
      const trainer = await Trainer.findById(trainerId);
      if (trainer) {
        trainerData = {
          _id: trainer._id,
          name: trainer.name,
          specialization: trainer.specialization,
          contactNumber: trainer.contactNumber,
          email: trainer.email,
        };
      }
    }

    const updated = await Subscription.findByIdAndUpdate(
      req.params.id,
      { ...rest, trainer: trainerData },
      { new: true }
    ).populate("clientId", "name clientId");

    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE subscription
router.delete("/:id", async (req, res) => {
  try {
    await Subscription.findByIdAndDelete(req.params.id);
    res.json({ message: "Subscription deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET subscriptions by clientId
router.get("/client/:clientId", async (req, res) => {
  try {
    const subs = await Subscription.find({ clientId: req.params.clientId }).populate(
      "clientId",
      "name clientId"
    );
    res.json(subs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET subscriptions and payments between dates
router.get("/payments", async (req, res) => {
  try {
    const { from, to } = req.query;
    const fromDate = from ? new Date(from) : new Date("1970-01-01");
    const toDate = to ? new Date(to) : new Date();

    const subs = await Subscription.find({
      $or: [
        { startDate: { $lte: toDate }, endDate: { $gte: fromDate } },
      ],
    });

    const totalPaid = subs.reduce((sum, sub) => sum + (sub.amountPaid || 0), 0);
    const totalPending = subs.reduce(
      (sum, sub) => sum + ((sub.price || 0) - (sub.amountPaid || 0)),
      0
    );

    res.json({ subscriptions: subs, totalPaid, totalPending });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// GET monthly payments for a year (proportional distribution)
// GET payments aggregated month-wise based on startDate only
router.get("/payments/monthly", async (req, res) => {
  try {
    const year = parseInt(req.query.year) || new Date().getFullYear();

    // Initialize months
    const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    const monthlyData = months.map(m => ({ month: m, totalPaid: 0, totalPending: 0 }));

    // Fetch subscriptions that start in the year
    const subs = await Subscription.find({
      startDate: { 
        $gte: new Date(`${year}-01-01T00:00:00.000Z`),
        $lte: new Date(`${year}-12-31T23:59:59.999Z`)
      }
    });

    // Aggregate by month of startDate
    subs.forEach(sub => {
      const start = new Date(sub.startDate);
      const month = start.getMonth(); // 0 = Jan, 11 = Dec
      const paid = sub.amountPaid || 0;
      const pending = (sub.price || 0) - paid;

      monthlyData[month].totalPaid += paid;
      monthlyData[month].totalPending += pending;
    });

    res.json(monthlyData);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});


export default router;
