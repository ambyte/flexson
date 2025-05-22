import jwt from "jsonwebtoken";
import {
  defineEventHandler,
  createError,
  getRequestHeader,
  type H3Event,
} from "h3";

interface JwtPayload {
  sub: string;
  username: string;
  type: string;
  iat?: number;
  exp?: number;
}

declare module "h3" {
  interface H3EventContext {
    auth?: {
      userId: string;
      username: string;
    };
  }
}

export default defineEventHandler((event: H3Event) => {
  if (event.path.includes("/api/auth/")) {
    return;
  }

  if (event.path.includes("/api/data/")) {
    return;
  }

  if (
    event.path.startsWith("/api/json") ||
    event.path.startsWith("/api/groups") ||
    event.path.startsWith("/api/user")
  ) {
    const config = useRuntimeConfig(event);

    const authHeader = getRequestHeader(event, "Authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw createError({
        statusCode: 401,
        message: "Unauthorized",
      });
    }

    const token = authHeader.split(" ")[1];

    try {
      const decoded = jwt.verify(
        token,
        config.jwtSecret as string
      ) as JwtPayload;

      if (decoded.type !== "access") {
        throw createError({
          statusCode: 401,
          message: "Invalid token type",
        });
      }

      event.context.auth = {
        userId: decoded.sub,
        username: decoded.username,
      };
    } catch (error) {
      console.error("JWT verification error:", error);
      throw createError({
        statusCode: 401,
        message: "Invalid or expired token",
      });
    }
    return;
  }
});
