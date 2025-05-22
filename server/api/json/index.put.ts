import { getDb } from "../../utils/db";
import { ObjectId } from "mongodb";
import { defineEventHandler, createError, readBody, type H3Event } from "h3";
import type { JsonFile } from "../../../types/models";
import { handleError } from "../../utils/errorHandler";
import { slugify, generateSlug } from "../../utils/tools";

export default defineEventHandler(async (event: H3Event) => {
  try {
    const { userId } = event.context.auth || {};
    if (!userId) {
      throw createError({ statusCode: 401, message: "Unauthorized" });
    }

    const jsonFile = await readBody<JsonFile>(event);
    if (!jsonFile.name || !jsonFile._id) {
      throw createError({
        statusCode: 400,
        message: "Name and ID are required",
      });
    }

    let slug = jsonFile.slug || generateSlug();
    slug = slugify(slug);

    const db = await getDb();
    const existingFile = await db.collection("files").findOne({
      _id: new ObjectId(jsonFile._id),
    });

    if (!existingFile) {
      throw createError({ statusCode: 404, message: "File not found" });
    }

    const updateData: Partial<JsonFile> = {
      name: jsonFile.name,
      description: jsonFile.description ?? existingFile.description,
      groupId: jsonFile.groupId ?? existingFile.groupId,
      slug: slug,
      updatedAt: new Date(),
      createdAt: existingFile.createdAt,
      userId: existingFile.userId,
    };

    if (jsonFile.content) {
      try {
        updateData.content =
          typeof jsonFile.content === "string"
            ? JSON.parse(jsonFile.content)
            : jsonFile.content;
      } catch {
        throw createError({ statusCode: 400, message: "Invalid JSON content" });
      }
    }

    await db
      .collection("files")
      .updateOne(
        { _id: new ObjectId(jsonFile._id), userId },
        { $set: updateData }
      );

    return {
      ...updateData,
      _id: jsonFile._id.toString(),
    } as JsonFile;
  } catch (error) {
    return handleError(error);
  }
});
