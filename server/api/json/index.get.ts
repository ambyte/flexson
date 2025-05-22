import { getDb } from "../../utils/db";
import { defineEventHandler, getQuery, type H3Event } from "h3";
import type { JsonFile } from "../../../types/models";
import { handleError } from "../../utils/errorHandler";
export default defineEventHandler(async (event: H3Event) => {
  const db = await getDb();
  const { userId } = event.context.auth || {};
  const query = getQuery(event);

  const filter: Record<string, unknown> = {
    ...(userId && { userId }),
    ...(query.userId && { userId: query.userId }),
    ...(query.groupId && { groupId: query.groupId }),
  };

  try {
    const jsonFiles = await db
      .collection<JsonFile>("files")
      .find(filter)
      .project({
        _id: 1,
        name: 1,
        description: 1,
        groupId: 1,
        slug: 1,
        createdAt: 1,
        updatedAt: 1,
        userId: 1,
      })
      .sort({ updatedAt: -1 })
      .toArray();
    return jsonFiles.map((file) => ({
      ...file,
      _id: file._id.toString(),
    })) as JsonFile[];
  } catch (error) {
    return handleError(error);
  }
});
