import { defineEventHandler, getRouterParam } from "h3";
import { ObjectId } from "mongodb";
import { getDb } from "../../../utils/db";
import { handleError } from "../../../utils/errorHandler";

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, "id");

  if (!id) {
    return {
      success: false,
      message: "API key ID is required",
    };
  }

  try {
    const db = await getDb();
    const apiKeys = db.collection("apikeys");

    const result = await apiKeys.deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return {
        success: false,
        message: "API key not found",
      };
    }

    return {
      success: true,
    };
  } catch (error) {
    return handleError(error);
  }
});
