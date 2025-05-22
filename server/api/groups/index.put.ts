import { getDb } from "../../utils/db";
import { defineEventHandler, createError, readBody, type H3Event } from "h3";
import type { Group, GroupResponse } from "../../../types/models";
import { ObjectId } from "mongodb";
import { generateSlug, slugify } from "../../utils/tools";
import { handleError } from "../../utils/errorHandler";
export default defineEventHandler(async (event: H3Event) => {
  try {
    const db = await getDb();
    const { userId } = event.context.auth || {};

    if (!userId) {
      throw createError({
        statusCode: 401,
        message: "Authentication required",
      });
    }

    const groupBody = await readBody<Group>(event);
    groupBody.slug = groupBody.slug || generateSlug();
    groupBody.slug = slugify(groupBody.slug);

    const existingGroup = await db.collection("groups").findOne({
      userId,
      _id: new ObjectId(groupBody._id),
    });

    if (!existingGroup) {
      throw createError({
        statusCode: 404,
        message: "Group not found",
      });
    }

    if (
      groupBody.name !== existingGroup.name ||
      groupBody.slug !== existingGroup.slug
    ) {
      const conflictingGroup = await db.collection("groups").findOne({
        userId,
        _id: { $ne: existingGroup._id },
        $or: [{ name: groupBody.name }, { slug: groupBody.slug }],
      });

      if (conflictingGroup) {
        throw createError({
          statusCode: 400,
          message: "Group with that name or slug already exists",
        });
      }
    }

    await Promise.all([
      db.collection("groups").updateOne(
        { userId, _id: existingGroup._id },
        {
          $set: {
            name: groupBody.name,
            slug: groupBody.slug,
            description: groupBody.description,
            allowPublicWrite: groupBody.allowPublicWrite,
            protected: groupBody.protected,
            updatedAt: new Date(),
          },
        }
      ),
      db.collection("files").updateMany(
        { userId, groupId: existingGroup._id },
        {
          $set: {
            groupSlug: groupBody.slug,
            updatedAt: new Date(),
          },
        }
      ),
    ]);

    const updatedGroup = await db.collection("groups").findOne({
      userId,
      _id: existingGroup._id,
    });

    if (!updatedGroup) {
      throw createError({
        statusCode: 404,
        message: "Updated group not found",
      });
    }

    return {
      success: true,
      group: {
        _id: updatedGroup._id.toString(),
        name: updatedGroup.name,
        slug: updatedGroup.slug,
        description: updatedGroup.description,
        createdAt: updatedGroup.createdAt,
        updatedAt: updatedGroup.updatedAt,
        userId: updatedGroup.userId,
        allowPublicWrite: updatedGroup.allowPublicWrite,
        protected: updatedGroup.protected,
      },
    } as GroupResponse;
  } catch (error) {
    return handleError(error);
  }
});
