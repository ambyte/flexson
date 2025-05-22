import { getDb } from "../../utils/db";
import { ObjectId } from "mongodb";
import { defineEventHandler, type H3Event } from "h3";
import { handleError, AppError } from "../../utils/errorHandler";

export default defineEventHandler(async (event: H3Event) => {
  try {
    const { userId } = event.context.auth || {};
    if (!userId) {
      throw new AppError(401, "Unauthorized");
    }

    const id = event.context.params?.id;
    if (!id || !ObjectId.isValid(id)) {
      throw new AppError(400, "Invalid ID format");
    }

    const db = await getDb();
    const result = await db.collection("files").deleteOne({
      _id: new ObjectId(id),
      userId,
    });

    if (result.deletedCount === 0) {
      throw new AppError(
        404,
        "JSON file not found or you do not have permission to delete it"
      );
    }

    return true;
  } catch (error) {
    return handleError(error);
  }
});
