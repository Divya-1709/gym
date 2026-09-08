import express from "express";
import prisma from "../utils/db.js";

const router = express.Router();

// CREATE subscription
router.post("/", async (req, res) => {
  try {
    const { trainerId, clientId, startDate, endDate, price, amountPaid, ...rest } = req.body;
    let trainerInfo = {};

    if (trainerId) {
      const trainer = await prisma.trainer.findUnique({ where: { id: trainerId } });
      if (trainer) {
        trainerInfo = {
          trainerId: trainer.id,
          trainerName: trainer.name,
          trainerSpecialization: trainer.specialization,
          trainerContact: trainer.contactNumber,
          trainerEmail: trainer.email,
        };
      }
    }

    const client = await prisma.client.findUnique({ where: { id: clientId } });
    if (!client) return res.status(404).json({ error: "Client not found" });

    const count = (await prisma.subscription.count({ where: { clientId } })) + 1;
    const subscriptionId = `INV-${client.clientId}-${String(count).padStart(2, "0")}`;

    const sub = await prisma.subscription.create({
      data: {
        ...rest,
        subscriptionId,
        clientId,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        price: parseFloat(price),
        amountPaid: parseFloat(amountPaid || 0),
        ...trainerInfo,
      },
      include: { client: true, trainer: true },
    });

    res.status(201).json(sub);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// GET all subscriptions
router.get("/", async (req, res) => {
  try {
    const subs = await prisma.subscription.findMany({
      include: { client: true, trainer: true },
      orderBy: { createdAt: "desc" },
    });
    res.json(subs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// UPDATE subscription
router.put("/:id", async (req, res) => {
  try {
    const { trainerId, startDate, endDate, price, amountPaid, ...rest } = req.body;
    let trainerInfo = {};

    if (trainerId) {
      const trainer = await prisma.trainer.findUnique({ where: { id: trainerId } });
      if (trainer) {
        trainerInfo = {
          trainerId: trainer.id,
          trainerName: trainer.name,
          trainerSpecialization: trainer.specialization,
          trainerContact: trainer.contactNumber,
          trainerEmail: trainer.email,
        };
      }
    }

    const updateData = {
      ...rest,
      ...(startDate && { startDate: new Date(startDate) }),
      ...(endDate && { endDate: new Date(endDate) }),
      ...(price !== undefined && { price: parseFloat(price) }),
      ...(amountPaid !== undefined && { amountPaid: parseFloat(amountPaid) }),
      ...trainerInfo,
    };

    const updated = await prisma.subscription.update({
      where: { id: req.params.id },
      data: updateData,
      include: { client: true, trainer: true },
    });

    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE subscription
router.delete("/:id", async (req, res) => {
  try {
    await prisma.subscription.delete({ where: { id: req.params.id } });
    res.json({ message: "Subscription deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET subscriptions by clientId
router.get("/client/:clientId", async (req, res) => {
  try {
    const subs = await prisma.subscription.findMany({
      where: { clientId: req.params.clientId },
      include: { client: true, trainer: true },
      orderBy: { createdAt: "desc" },
    });
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

    const subs = await prisma.subscription.findMany({
      where: {
        startDate: { lte: toDate },
        endDate: { gte: fromDate },
      },
      include: { client: true },
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

// GET monthly payments for a year
router.get("/payments/monthly", async (req, res) => {
  try {
    const year = parseInt(req.query.year) || new Date().getFullYear();
    const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    const monthlyData = months.map(m => ({ month: m, totalPaid: 0, totalPending: 0 }));

    const subs = await prisma.subscription.findMany({
      where: {
        startDate: {
          gte: new Date(`${year}-01-01T00:00:00.000Z`),
          lte: new Date(`${year}-12-31T23:59:59.999Z`),
        },
      },
    });

    subs.forEach(sub => {
      const start = new Date(sub.startDate);
      const month = start.getMonth();
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

