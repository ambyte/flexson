import { getDb } from "../../utils/db";
import { defineEventHandler, createError, readBody, type H3Event } from "h3";
import type { Group, GroupResponse } from "../../../types/models";
import { generateSlug, slugify } from "../../utils/tools";
import { handleError } from "../../utils/errorHandler";

export default defineEventHandler(async (event: H3Event) => {
  try {
    const db = await getDb();

    if (!event.context.auth?.userId) {
      throw createError({
        statusCode: 401,
        message: "Authentication required",
      });
    }

    const userId = event.context.auth.userId;

    const body = await readBody<Partial<Group>>(event);

    if (typeof body !== "object" || body === null) {
      throw createError({
        statusCode: 400,
        message: "Request Group must be an object",
      });
    }

    if (!body.name) {
      throw createError({
        statusCode: 400,
        message: "Group name is required",
      });
    }

    let slug = body.slug || generateSlug();
    slug = slugify(slug);

    const existingGroup = await db.collection("groups").findOne({
      userId,
      $or: [{ name: body.name }, { slug }],
    });

    if (existingGroup) {
      return {
        success: false,
        message: "Group name or slug already exists",
      } as GroupResponse;
    }

    const groupData = {
      name: String(body.name),
      slug,
      userId: String(userId),
      description: body.description ? String(body.description) : "",
      allowPublicWrite: body.allowPublicWrite || false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const insertResult = await db.collection("groups").insertOne(groupData);

    if (!insertResult.acknowledged) {
      throw new Error("MongoDB insertion was not acknowledged");
    }

    const createdGroup = await db
      .collection("groups")
      .findOne({ _id: insertResult.insertedId });

    if (!createdGroup) {
      throw new Error("Failed to fetch created group");
    }

    const group: Group = {
      _id: createdGroup._id.toString(),
      name: createdGroup.name,
      slug: createdGroup.slug,
      description: createdGroup.description,
      createdAt: createdGroup.createdAt,
      updatedAt: createdGroup.updatedAt,
      userId: createdGroup.userId,
      allowPublicWrite: createdGroup.allowPublicWrite || false,
      protected: createdGroup.protected || false,
    };

    return {
      success: true,
      group,
    } as GroupResponse;
  } catch (error) {
    return handleError(error);
  }
});
