import { defineEventHandler, createError, readBody } from "h3";
import { getDb } from "../../../utils/db";
import { ObjectId } from "mongodb";
import { handleError } from "../../../utils/errorHandler";

export default defineEventHandler(async (event) => {
  try {
    // Get user ID from auth middleware context
    const { userId } = event.context.auth || {};

    if (!userId) {
      throw createError({
        statusCode: 401,
        message: "Authentication required",
      });
    }

    // Read request body
    const body = await readBody(event);
    const { keyId, isActive } = body;

    if (!keyId) {
      throw createError({
        statusCode: 400,
        message: "API key ID is required",
      });
    }

    if (typeof isActive !== "boolean") {
      throw createError({
        statusCode: 400,
        message: "isActive must be a boolean value",
      });
    }

    // Connect to database
    const db = await getDb();
    const apiKeysCollection = db.collection("apikeys");

    // Update the API key status
    const result = await apiKeysCollection.updateOne(
      { _id: new ObjectId(String(keyId)), userId },
      { $set: { isActive, updatedAt: new Date() } }
    );

    if (result.matchedCount === 0) {
      throw createError({
        statusCode: 404,
        message: "API key not found",
      });
    }

    return {
      success: true,
    };
  } catch (error) {
    return handleError(error);
  }
});
