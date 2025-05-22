import bcrypt from "bcrypt";
import { defineEventHandler, readBody, createError } from "h3";
import type { RegisterBody, RegisterResponse } from "../../../types/models";
import { getDb } from "../../utils/db";
import { handleError } from "../../utils/errorHandler";

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  const { username, password } = await readBody<RegisterBody>(event);

  // Check if registration is disabled
  if (config.public.disableRegistration === "true") {
    throw createError({
      statusCode: 403,
      message: "Registration is currently disabled",
    });
  }

  if (!username || !password) {
    throw createError({
      statusCode: 400,
      message: "Username and password are required",
    });
  }

  try {
    const db = await getDb();
    const users = db.collection("users");

    const existingUser = await users.findOne({ username });
    if (existingUser) {
      throw createError({
        statusCode: 409,
        message: "Username already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await users.insertOne({
      username,
      password: hashedPassword,
      createdAt: new Date(),
    });

    const userId = result.insertedId.toString();

    await db.collection("groups").insertOne({
      name: "default",
      slug: "default",
      userId: userId,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return {
      id: userId,
      username,
      message: "User registered successfully",
    } as RegisterResponse;
  } catch (error) {
    return handleError(error);
  }
});
