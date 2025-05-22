import { getDb } from "../../utils/db";
import { defineEventHandler, createError, readBody, type H3Event } from "h3";
import type { JsonFile } from "../../../types/models";
import { generateSlug, slugify } from "../../utils/tools";
import { handleError } from "../../utils/errorHandler";

export default defineEventHandler(async (event: H3Event) => {
  try {
    const db = await getDb();
    const { userId, username } = event.context.auth || {};

    if (!userId || !username) {
      throw createError({ statusCode: 401, message: "Unauthorized" });
    }

    const { name, description, content, groupId, slug } =
      await readBody<JsonFile>(event);

    if (!name || !content) {
      throw createError({
        statusCode: 400,
        message: "Name and content are required",
      });
    }

    const parsedContent =
      typeof content === "string" ? JSON.parse(content) : content;

    let fileSlug = slug || generateSlug();
    fileSlug = slugify(fileSlug);

    const existingFile = await db
      .collection("files")
      .findOne({ userId, slug: fileSlug });

    if (existingFile) {
      throw createError({
        statusCode: 400,
        message: "File already exists in this group",
      });
    }

    const newJsonFile = {
      name,
      description: description || "",
      content: parsedContent,
      groupId,
      slug: fileSlug,
      userId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.collection("files").insertOne(newJsonFile);
    return {
      ...newJsonFile,
      _id: result.insertedId.toString(),
    } as JsonFile;
  } catch (error) {
    return handleError(error);
  }
});
