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
    const { keyId, name } = body;

    if (!keyId) {
      throw createError({
        statusCode: 400,
        message: "API key ID is required",
      });
    }

    if (!name || typeof name !== "string") {
      throw createError({
        statusCode: 400,
        message: "A valid API key name is required",
      });
    }

    // Connect to database
    const db = await getDb();
    const apiKeysCollection = db.collection("apikeys");

    // Update the API key name
    const result = await apiKeysCollection.updateOne(
      { _id: new ObjectId(String(keyId)), userId },
      { $set: { name, updatedAt: new Date() } }
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
