import { getDb } from "../../utils/db";
import { defineEventHandler, createError, type H3Event } from "h3";
import type { Group } from "../../../types/models";
import { handleError } from "../../utils/errorHandler";

export default defineEventHandler(async (event: H3Event) => {
  try {
    if (!event.context.auth || !event.context.auth.userId) {
      throw createError({
        statusCode: 401,
        message: "Authentication required",
      });
    }

    const db = await getDb();
    const { userId } = event.context.auth;

    const collections = await db.listCollections().toArray();
    const groupsCollectionExists = collections.some(
      (col) => col.name === "groups"
    );

    if (!groupsCollectionExists) {
      return [];
    }

    const groups = await db
      .collection<Group>("groups")
      .find({ userId })
      .sort({ name: 1 })
      .toArray();

    return groups;
  } catch (error) {
    return handleError(error);
  }
});
