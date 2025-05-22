import { defineNitroPlugin } from "nitropack/runtime/plugin";
import { closeDbConnection } from "../utils/db";

export default defineNitroPlugin((nitroApp) => {
  // Register a cleanup function for when the application is shutting down
  nitroApp.hooks.hook("close", async () => {
    console.log("Application shutting down, closing database connection...");
    await closeDbConnection();
    console.log("Database connection closed successfully.");
  });
});
