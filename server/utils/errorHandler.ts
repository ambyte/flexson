import { createError } from "h3";

export class AppError extends Error {
  statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
    this.name = "AppError";
  }
}

export const handleError = (error: unknown) => {
  console.error("Error:", error);

  const isProd = process.env.NODE_ENV === "production";

  const errorObj = error as Error & { statusCode?: number };

  if (errorObj.statusCode) {
    return createError({
      statusCode: errorObj.statusCode,
      message: errorObj.message,
      stack: !isProd ? errorObj.stack : undefined,
    });
  }

  if (errorObj.name === "MongoError" || errorObj.name === "MongoServerError") {
    return createError({
      statusCode: 500,
      message: "Database error occurred",
      stack: !isProd ? errorObj.stack : undefined,
    });
  }

  if (errorObj.name === "MongoNetworkError") {
    return createError({
      statusCode: 503,
      message: "Database connection error",
      stack: !isProd ? errorObj.stack : undefined,
    });
  }

  return createError({
    statusCode: 500,
    message: "Internal server error",
    stack: !isProd ? errorObj.stack : undefined,
  });
};
