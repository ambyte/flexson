import {
  defineEventHandler,
  createError,
  getRequestHeaders,
  type H3Event,
} from "h3";
import { getDb } from "../../../../utils/db";
import type { JsonFile, Group, User } from "../../../../../types/models";
import { handleError } from "../../../../utils/errorHandler";
import { validateApiKey } from "../../../../utils/apiKeyValidator";
import { ObjectId } from "mongodb";

export default defineEventHandler(async (event: H3Event) => {
  try {
    const userSlug = event.context.params?.userslug as string;
    const fileSlug = event.context.params?.fileslug as string;

    if (!userSlug || !fileSlug) {
      throw createError({
        statusCode: 400,
        message: "User slug and file slug are required",
      });
    }

    const db = await getDb();

    const user = (await db.collection("users").findOne({
      slug: userSlug,
    })) as User | null;

    if (!user) {
      throw createError({
        statusCode: 404,
        message: "User not found",
      });
    }

    const jsonFile = (await db.collection("files").findOne({
      userId: user._id.toString(),
      slug: fileSlug,
    })) as JsonFile | null;

    if (!jsonFile) {
      throw createError({
        statusCode: 404,
        message: "JSON file not found",
      });
    }

    const group = (await db.collection("groups").findOne({
      _id: new ObjectId(jsonFile.groupId),
      userId: user._id.toString(),
    })) as Group | null;

    if (!group) {
      throw createError({
        statusCode: 404,
        message: "Group not found",
      });
    }

    if (group.protected) {
      const headers = getRequestHeaders(event);
      if (!headers["x-api-key"]) {
        throw createError({
          statusCode: 401,
          message: "API key is required",
        });
      }
      const apiKey = headers["x-api-key"] as string;
      if (!apiKey) {
        throw createError({
          statusCode: 401,
          message: "API key is required",
        });
      }

      await validateApiKey(user._id.toString(), apiKey);
    }

    event.node.res.setHeader("Content-Type", "application/json");

    return JSON.stringify(jsonFile.content);
  } catch (error) {
    return handleError(error);
  }
});
