import { createError } from "h3";
import { getDb } from "./db";

export async function validateApiKey(userId: string, apiKey: string) {
  const db = await getDb();

  if (!apiKey) {
    throw createError({
      statusCode: 401,
      message: "API key is required",
    });
  }

  const apiKeyDoc = await db.collection("apikeys").findOne({
    apiKey: apiKey,
    userId: userId,
  });

  if (!apiKeyDoc) {
    throw createError({
      statusCode: 401,
      message: "Invalid API key",
    });
  }

  if (!apiKeyDoc.isActive) {
    throw createError({
      statusCode: 401,
      message: "API key is not active",
    });
  }

  if (apiKeyDoc.expiresAt && apiKeyDoc.expiresAt < new Date()) {
    throw createError({
      statusCode: 401,
      message: "API key has expired",
    });
  }

  await db
    .collection("apikeys")
    .updateOne({ _id: apiKeyDoc._id }, { $set: { lastUsed: new Date() } });

  return apiKeyDoc;
}
