import { defineEventHandler, readBody, createError } from "h3";
import { getDb } from "../../utils/db";
import { ObjectId } from "mongodb";
import { handleError } from "../../utils/errorHandler";

export default defineEventHandler(async (event) => {
  try {
    const { userId } = event.context.auth || {};

    if (!userId) {
      throw createError({
        statusCode: 401,
        message: "Authentication required",
      });
    }

    // Read request body
    const { username, email } = await readBody(event);

    // Validate username field is not empty
    if (!username || !username.trim()) {
      throw createError({
        statusCode: 400,
        message: "Login field is required",
      });
    }

    // Connect to database
    const db = await getDb();
    const users = db.collection("users");

    // Check if username is already taken by another user
    const existingUser = await users.findOne({
      username,
      _id: { $ne: new ObjectId(userId) },
    });

    if (existingUser) {
      throw createError({
        statusCode: 409,
        message: "Username already taken",
      });
    }

    // Update user profile
    const result = await users.updateOne(
      { _id: new ObjectId(userId) },
      {
        $set: {
          username,
          email,
          updatedAt: new Date(),
        },
      }
    );

    if (result.matchedCount === 0) {
      throw createError({
        statusCode: 404,
        message: "User not found",
      });
    }

    return {
      success: true,
      message: "Profile updated successfully",
    };
  } catch (error) {
    return handleError(error);
  }
});
