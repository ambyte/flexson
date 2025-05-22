import { defineEventHandler, createError, readBody } from "h3";
import { getDb } from "../../../utils/db";
import type { ApiKey } from "../../../../types/models";
import { handleError } from "../../../utils/errorHandler";

export default defineEventHandler(async (event) => {
  try {
    const { userId } = event.context.auth || {};

    if (!userId) {
      throw createError({
        statusCode: 401,
        message: "Authentication required",
      });
    }

    const body = await readBody(event);
    const { name, expiry } = body.apiKey;

    if (!name) {
      throw createError({
        statusCode: 400,
        message: "API key name is required",
      });
    }

    const db = await getDb();
    const apiKeysCollection = db.collection("apikeys");

    const keyValue = `sk_${crypto.randomUUID().replace(/-/g, "")}`;

    let expiresAt: Date | undefined = new Date();
    if (expiry && parseInt(expiry) > 0) {
      expiresAt.setDate(expiresAt.getDate() + parseInt(expiry));
    } else {
      expiresAt = undefined;
    }

    const newApiKey: Omit<ApiKey, "_id"> = {
      apiKey: keyValue,
      name,
      userId,
      createdAt: new Date(),
      lastUsed: undefined,
      expiresAt,
      isActive: true,
    };

    const result = await apiKeysCollection.insertOne(newApiKey);

    return {
      success: true,
      data: {
        ...newApiKey,
        _id: result.insertedId.toString(),
      },
    };
  } catch (error) {
    return handleError(error);
  }
});
