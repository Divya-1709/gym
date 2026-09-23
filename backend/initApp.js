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
    password: "admin123",
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

    const hashedPassword = await bcrypt.hash(
      APP_CONFIG.ADMIN.password,
      10
    );

    // 👤 Create or update admin user
    const adminExists = await prisma.user.findUnique({
      where: { username: APP_CONFIG.ADMIN.username },
    });

    if (!adminExists) {
      await prisma.user.create({
        data: {
          username: APP_CONFIG.ADMIN.username,
          password: hashedPassword,
        },
      });
      console.log("✅ Admin user created with new password");
    } else {
      await prisma.user.update({
        where: { username: APP_CONFIG.ADMIN.username },
        data: { password: hashedPassword },
      });
      console.log("✅ Admin user password updated to admin123");
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

