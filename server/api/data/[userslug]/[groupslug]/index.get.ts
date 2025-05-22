import {
  defineEventHandler,
  createError,
  getRequestHeaders,
  type H3Event,
} from "h3";
import { getDb } from "../../../../utils/db";
import type { Group, User } from "../../../../../types/models";
import { handleError } from "../../../../utils/errorHandler";
import { validateApiKey } from "../../../../utils/apiKeyValidator";

// Helper function to combine multiple JSON objects
function combineJsons<T>(...args: (T | T[])[]): T[] {
  if (Array.isArray(args[0])) {
    return [...args[0]];
  }
  return args as T[];
}

export default defineEventHandler(async (event: H3Event) => {
  try {
    const userSlug = event.context.params?.userslug as string;
    const groupSlug = event.context.params?.groupslug as string;

    if (!userSlug || !groupSlug) {
      throw createError({
        statusCode: 400,
        message: "User ID and group slug are required",
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

    const group = (await db.collection("groups").findOne({
      userId: user._id.toString(),
      slug: groupSlug,
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

    const rawFiles = await db
      .collection("files")
      .find({ userId: user._id.toString(), groupId: group._id.toString() })
      .toArray();

    const jsonFiles = rawFiles.map((doc) => doc.content);
    const combinedJson = combineJsons(...jsonFiles);

    event.node.res.setHeader("Content-Type", "application/json");

    return JSON.stringify(combinedJson);
  } catch (error) {
    return handleError(error);
  }
});
