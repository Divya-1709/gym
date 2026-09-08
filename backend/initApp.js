import dotenv from "dotenv";
dotenv.config();
import bcrypt from "bcryptjs";
import prisma from "./utils/db.js";

/* ======================
   CONFIG
====================== */

const APP_CONFIG = {
  ADMIN: {
    username: "admin",
    password: "one2life3421",
  },
};

/* ======================
   RUN SCRIPT
====================== */

const run = async () => {
  try {
    // 🔗 Connect DB
    await prisma.$connect();
    console.log("✅ PostgreSQL Connected via Prisma");

    // 👤 Create admin if not exists
    const adminExists = await prisma.user.findUnique({
      where: { username: APP_CONFIG.ADMIN.username },
    });

    if (!adminExists) {
      const hashedPassword = await bcrypt.hash(
        APP_CONFIG.ADMIN.password,
        10
      );

      await prisma.user.create({
        data: {
          username: APP_CONFIG.ADMIN.username,
          password: hashedPassword,
        },
      });

      console.log("✅ Admin user created");
    } else {
      console.log("ℹ️ Admin user already exists");
    }

    // ✅ Disconnect & exit
    await prisma.$disconnect();
    console.log("🚪 DB connection closed");
    process.exit(0);
  } catch (error) {
    console.error("❌ Script failed:", error.message);
    process.exit(1);
  }
};

// ▶️ RUN DIRECTLY
run();

