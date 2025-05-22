import {
  defineEventHandler,
  createError,
  getRequestHeaders,
  type H3Event,
} from "h3";
import { getDb } from "../../../../utils/db";
import type { JsonFile, Group, User } from "../../../../../types/models";
import { generateSlug, slugify } from "../../../../utils/tools";
import { handleError } from "../../../../utils/errorHandler";
import { validateApiKey } from "../../../../utils/apiKeyValidator";
import { ObjectId } from "mongodb";

export default defineEventHandler(async (event: H3Event) => {
  try {
    const userSlug = event.context.params?.userslug as string;
    const groupSlug = event.context.params?.groupslug as string;
    const config = useRuntimeConfig();

    if (!userSlug || !groupSlug) {
      throw createError({
        statusCode: 400,
        message: "User ID and group slug are required",
      });
    }

    const body = await readBody(event);

    if (!body || !body.name || !body.content) {
      throw createError({
        statusCode: 400,
        message: "Request body must include 'name' and 'content' fields",
      });
    }

    try {
      JSON.parse(JSON.stringify(body.content));
    } catch {
      throw createError({
        statusCode: 400,
        message: "Content must be valid JSON",
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

    if (!group.allowPublicWrite) {
      throw createError({
        statusCode: 403,
        message: "This group does not allow public writes",
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

    let fileSlug = body.slug || generateSlug();
    fileSlug = slugify(fileSlug);

    const existingFile = (await db.collection("files").findOne({
      name: body.name,
      groupId: group._id.toString(),
    })) as JsonFile | null;

    if (existingFile) {
      existingFile.content = body.content;
      existingFile.updatedAt = new Date();
      existingFile.description = body.description || "";

      await db
        .collection("files")
        .updateOne(
          { _id: new ObjectId(existingFile._id) },
          { $set: existingFile }
        );
    } else {
      const existingFileBySlug = await db.collection("files").findOne({
        slug: fileSlug,
      });

      if (existingFileBySlug) {
        fileSlug = generateSlug();
      }

      const newJsonFile: Omit<JsonFile, "_id"> = {
        name: body.name,
        content: body.content,
        description: body.description || "",
        groupId: group._id.toString(),
        slug: fileSlug,
        createdAt: new Date(),
        updatedAt: new Date(),
        userId: user._id.toString(),
      };

      await db.collection("files").insertOne(newJsonFile);
    }

    return {
      success: true,
      message: "Data saved successfully",
      fileUrl: `${config.public.baseURL}/api/data/${userSlug}/${groupSlug}/${fileSlug}`,
    };
  } catch (error) {
    return handleError(error);
  }
});
