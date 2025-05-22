import jwt, { type Secret, type SignOptions } from "jsonwebtoken";
import {
  defineEventHandler,
  readBody,
  createError,
  getRequestHeaders,
} from "h3";
import { getDb } from "../../utils/db";
import type {
  AuthResponse,
  RefreshTokenBody,
  User,
} from "../../../types/models";
import { ObjectId } from "mongodb";
import { handleError } from "../../utils/errorHandler";

interface TokenPayload {
  sub: string;
  username: string;
  type: string;
  fingerprint?: string;
  jti?: string;
  exp?: number;
  iat?: number;
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event);
  const { refreshToken } = await readBody<RefreshTokenBody>(event);
  const headers = getRequestHeaders(event);
  const userAgent = headers["user-agent"] || "";

  if (!refreshToken) {
    throw createError({
      statusCode: 400,
      message: "Refresh token is required",
    });
  }

  // Connect to MongoDB to check active tokens
  try {
    const db = await getDb();
    const activeTokens = db.collection("active_tokens");

    // Verify the refresh token
    const decoded = jwt.verify(
      refreshToken,
      config.jwtSecret as string
    ) as TokenPayload;

    // Check if it's actually a refresh token
    if (decoded.type !== "refresh") {
      throw createError({
        statusCode: 401,
        message: "Invalid token type",
      });
    }

    // Check if token exists in active tokens
    const existingToken = await activeTokens.findOne({ token: refreshToken });
    if (!existingToken) {
      throw createError({
        statusCode: 401,
        message: "Token has been revoked",
      });
    }

    // Generate unique token ID
    const tokenId = crypto.randomUUID();

    // Generate new access token
    const newAccessToken = jwt.sign(
      {
        sub: decoded.sub,
        username: decoded.username,
        type: "access",
        jti: tokenId,
      },
      config.jwtSecret as Secret,
      { expiresIn: config.accessTokenLifetime } as SignOptions
    );

    const users = db.collection<User>("users");
    const user = await users.findOne({ _id: new ObjectId(decoded.sub) });

    // Generate new refresh token with fingerprint
    const newRefreshToken = jwt.sign(
      {
        sub: user?._id.toString(),
        username: user?.username,
        type: "refresh",
        jti: tokenId,
        fingerprint: userAgent,
      },
      config.jwtSecret as Secret,
      { expiresIn: config.refreshTokenLifetime } as SignOptions
    );

    // Remove the old refresh token from active tokens
    await activeTokens.deleteOne({ token: refreshToken });

    // Store the new refresh token
    await activeTokens.insertOne({
      token: newRefreshToken,
      userId: user?._id.toString(),
      expiresAt: new Date(decoded.exp! * 1000),
    });

    // Clean up expired tokens
    await activeTokens.deleteMany({
      expiresAt: { $lt: new Date() },
    });

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      user: {
        _id: user?._id.toString(),
        username: user?.username,
        email: user?.email,
        slug: user?.slug,
      },
    } as AuthResponse;
  } catch (error) {
    return handleError(error);
  }
});
