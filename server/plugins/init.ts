import { defineNitroPlugin } from "nitropack/runtime/plugin";
import { useRuntimeConfig } from "nitropack/runtime";
import { getDb } from "../utils/db";
import bcrypt from "bcrypt";
import { generateSlug } from "../utils/tools";

export default defineNitroPlugin(async () => {
  const config = useRuntimeConfig();
  const adminUsername = config.adminUsername as string;
  let adminPassword = config.adminPassword as string;

  if (!adminUsername) {
    console.warn(
      "Admin credentials not found in environment variables. Skipping admin user creation."
    );
    return;
  }

  if (!adminPassword) {
    adminPassword = Math.random().toString(36).slice(-8);
  }

  try {
    const db = await getDb();
    const users = db.collection("users");

    const existingUser = await users.findOne({});

    if (!existingUser) {
      const hashedPassword = await bcrypt.hash(adminPassword, 10);

      const user = await users.insertOne({
        username: adminUsername,
        password: hashedPassword,
        slug: generateSlug(),
        email: "",
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const groups = db.collection("groups");
      await groups.insertOne({
        name: "default",
        slug: "default",
        description: "Default group",
        userId: user.insertedId.toString(),
        allowPublicWrite: false,
        protected: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      console.log("Initial admin user created successfully");
      console.log(`Admin username: ${adminUsername}`);
      console.log(`Admin password: ${adminPassword}`);
    }
  } catch (error) {
    console.error("Error during initialization:", error);
  }
});
