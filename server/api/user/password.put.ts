import { defineEventHandler, readBody, createError } from "h3";
import { getDb } from "../../utils/db";
import { ObjectId } from "mongodb";
import bcrypt from "bcrypt";
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
    const { currentPassword, newPassword } = await readBody(event);

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Validate username field is not empty
    if (!newPassword || !newPassword.trim()) {
      throw createError({
        statusCode: 400,
        message: "Password field is required",
      });
    }

    // Connect to database
    const db = await getDb();
    const users = db.collection("users");

    const user = await users.findOne({ _id: new ObjectId(userId) });

    if (!user) {
      throw createError({
        statusCode: 404,
        message: "User not found",
      });
    }

    const isPasswordCorrect = await bcrypt.compare(
      currentPassword,
      user.password
    );

    if (!isPasswordCorrect) {
      throw createError({
        statusCode: 401,
        message: "Invalid current password",
      });
    }

    // Update user profile
    const result = await users.updateOne(
      { _id: new ObjectId(userId) },
      {
        $set: {
          password: hashedPassword,
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
      message: "Password updated successfully",
    };
  } catch (error) {
    return handleError(error);
  }
});
