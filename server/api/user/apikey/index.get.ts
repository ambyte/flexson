import { defineEventHandler, createError } from "h3";
import { getDb } from "../../../utils/db";
import type { ApiKey } from "../../../../types/models";
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

    // Connect to database
    const db = await getDb();
    const apiKeysCollection = db.collection<ApiKey>("apikeys");

    // Fetch API keys for the user
    const apiKeys = await apiKeysCollection
      .find({ userId, isActive: true })
      .sort({ createdAt: -1 })
      .toArray();

    // Map the ObjectId to string
    const formattedApiKeys = apiKeys.map((key) => ({
      ...key,
      _id: key._id.toString(),
    }));

    return {
      success: true,
      data: formattedApiKeys,
    };
  } catch (error) {
    return handleError(error);
  }
});
