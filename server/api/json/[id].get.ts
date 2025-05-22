import { getDb } from "../../utils/db";
import { ObjectId } from "mongodb";
import { defineEventHandler, createError, type H3Event } from "h3";
import type { JsonFile } from "../../../types/models";
import { handleError } from "../../utils/errorHandler";

export default defineEventHandler(async (event: H3Event) => {
  const { userId } = event.context.auth || {};

  if (!userId) {
    throw createError({
      statusCode: 401,
      message: "Unauthorized",
    });
  }

  const id = event.context.params?.id;
  if (!id || !ObjectId.isValid(id)) {
    throw createError({
      statusCode: 400,
      message: "Invalid ID format",
    });
  }

  try {
    const db = await getDb();
    const jsonFile = await db.collection("files").findOne({
      _id: new ObjectId(id),
      userId,
    });

    if (!jsonFile) {
      throw createError({
        statusCode: 404,
        message: "File not found",
      });
    }

    return {
      ...jsonFile,
      _id: jsonFile._id.toString(),
    } as JsonFile;
  } catch (error) {
    return handleError(error);
  }
});
