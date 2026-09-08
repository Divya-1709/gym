import express from "express";
import prisma from "../utils/db.js";

const router = express.Router();

// CREATE client
router.post("/", async (req, res) => {
  try {
    const counter = await prisma.counter.upsert({
      where: { name: "clientId" },
      update: { seq: { increment: 1 } },
      create: { name: "clientId", seq: 1 },
    });
    const baseNumber = 4000;
    const clientId = `H${baseNumber + counter.seq}`;

    const clientData = {
      ...req.body,
      clientId,
    };

    const client = await prisma.client.create({
      data: clientData,
      include: { trainer: true },
    });

    res.status(201).json(client);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// GET all clients
router.get("/", async (req, res) => {
  try {
    const clients = await prisma.client.findMany({
      include: { trainer: true },
      orderBy: { createdAt: "desc" },
    });
    res.json(clients);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET single client + subscriptions
router.get("/:id", async (req, res) => {
  try {
    const client = await prisma.client.findUnique({
      where: { id: req.params.id },
      include: { trainer: true },
    });
    if (!client) return res.status(404).json({ message: "Client not found" });

    const subscriptions = await prisma.subscription.findMany({
      where: { clientId: client.id },
      include: { trainer: true },
      orderBy: { createdAt: "desc" },
    });

    res.json({ client, subscriptions });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// UPDATE client (including isActive toggle)
router.put("/:id", async (req, res) => {
  try {
    const updatedClient = await prisma.client.update({
      where: { id: req.params.id },
      data: req.body,
      include: { trainer: true },
    });
    res.json(updatedClient);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE client
router.delete("/:id", async (req, res) => {
  try {
    await prisma.subscription.deleteMany({ where: { clientId: req.params.id } });
    await prisma.client.delete({ where: { id: req.params.id } });
    res.json({ message: "Client and subscriptions deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;

