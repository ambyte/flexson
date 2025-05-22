import { getDb } from "../../utils/db";
import { defineEventHandler, createError, type H3Event } from "h3";
import { ObjectId } from "mongodb";
import { handleError } from "../../utils/errorHandler";

export default defineEventHandler(async (event: H3Event) => {
  try {
    const db = await getDb();
    const { userId } = event.context.auth || {};
    const id = event.context.params?.id;

    // Validate input
    if (!id) {
      throw createError({
        statusCode: 400,
        message: "Group ID is required",
      });
    }

    // Check if userId exists
    if (!userId) {
      console.error("Missing userId in auth context");
      throw createError({
        statusCode: 401,
        message: "Authentication required",
      });
    }

    // Validate if id is a valid ObjectId
    if (!ObjectId.isValid(id)) {
      throw createError({
        statusCode: 400,
        message: "Invalid group ID format",
      });
    }

    // Check if the group exists in the groups collection
    const group = await db.collection("groups").findOne({
      userId,
      _id: new ObjectId(id),
    });

    // Delete the group from the groups collection
    if (group) {
      await db.collection("groups").deleteOne({
        userId,
        _id: new ObjectId(id),
      });
    }

    // Delete all files in the group
    await db.collection("files").deleteMany({ userId, groupId: id });

    return true;
  } catch (error) {
    return handleError(error);
  }
});
