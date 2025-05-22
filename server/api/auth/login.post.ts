import bcrypt from "bcrypt";
import jwt, { type Secret, type SignOptions } from "jsonwebtoken";
import {
  defineEventHandler,
  readBody,
  createError,
  getRequestHeaders,
} from "h3";
import type { LoginBody, AuthResponse, User } from "../../../types/models";
import { getDb } from "../../utils/db";
import { handleError } from "../../utils/errorHandler";

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event);
  const { username, password } = await readBody<LoginBody>(event);
  const headers = getRequestHeaders(event);
  const userAgent = headers["user-agent"] || "";

  if (!username || !password) {
    throw createError({
      statusCode: 400,
      message: "Username and password are required",
    });
  }

  try {
    const db = await getDb();
    const users = db.collection<User>("users");
    const activeTokens = db.collection("active_tokens");

    // Find user by username
    const user = await users.findOne({ username });

    if (!user) {
      throw createError({
        statusCode: 401,
        message: "Invalid credentials",
      });
    }

    // Check password
    const passwordValid = await bcrypt.compare(password, user.password);

    if (!passwordValid) {
      throw createError({
        statusCode: 401,
        message: "Invalid credentials",
      });
    }

    // Generate unique token ID
    const tokenId = crypto.randomUUID();

    // Generate access token
    const accessToken = jwt.sign(
      {
        sub: user._id.toString(),
        username: user.username,
        type: "access",
        jti: tokenId,
      },
      config.jwtSecret as Secret,
      { expiresIn: config.accessTokenLifetime } as SignOptions
    );

    // Generate refresh token
    const refreshToken = jwt.sign(
      {
        sub: user._id.toString(),
        username: user.username,
        type: "refresh",
        jti: tokenId,
        fingerprint: userAgent,
      },
      config.jwtSecret as Secret,
      { expiresIn: config.refreshTokenLifetime } as SignOptions
    );

    // Store the refresh token in active_tokens
    const decoded = jwt.decode(refreshToken) as { exp: number };
    await activeTokens.insertOne({
      token: refreshToken,
      userId: user._id.toString(),
      expiresAt: new Date(decoded.exp * 1000),
    });

    // Clean up any expired tokens
    await activeTokens.deleteMany({
      expiresAt: { $lt: new Date() },
    });

    const response = {
      accessToken,
      refreshToken,
      user: {
        _id: user._id.toString(),
        username: user.username,
        email: user.email,
        slug: user.slug,
      },
    } as AuthResponse;

    return response;
  } catch (error) {
    return handleError(error);
  }
});
