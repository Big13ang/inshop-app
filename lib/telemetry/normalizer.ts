import { NormalizedError } from "./types";

/**
 * Normalizes any error input (Error instances, strings, plain objects, Result.err payloads)
 * into a well-structured NormalizedError object with clean messages and extracted metadata.
 */
export function normalizeError(rawError: unknown): NormalizedError {
  if (rawError === null || rawError === undefined) {
    return {
      name: "UnknownError",
      message: "An undefined or null error was encountered",
    };
  }

  // Handle standard JavaScript Error objects
  if (rawError instanceof Error) {
    const customCode =
      (rawError as { code?: string | number }).code ||
      (rawError as { statusCode?: string | number }).statusCode;

    return {
      name: rawError.name || "Error",
      message: rawError.message || "An unexpected error occurred",
      code: customCode ? String(customCode) : undefined,
      stack: rawError.stack,
    };
  }

  // Handle plain string errors
  if (typeof rawError === "string") {
    return {
      name: "Error",
      message: rawError,
    };
  }

  // Handle plain object errors (e.g., Result.err({ code, message, ... }))
  if (typeof rawError === "object") {
    const record = rawError as Record<string, unknown>;

    const message =
      typeof record.message === "string"
        ? record.message
        : typeof record.error === "string"
        ? record.error
        : typeof record.description === "string"
        ? record.description
        : JSON.stringify(rawError);

    const code =
      typeof record.code === "string" || typeof record.code === "number"
        ? String(record.code)
        : typeof record.errorCode === "string" || typeof record.errorCode === "number"
        ? String(record.errorCode)
        : typeof record.status === "string" || typeof record.status === "number"
        ? String(record.status)
        : undefined;

    const statusCode =
      typeof record.statusCode === "number"
        ? record.statusCode
        : typeof record.status === "number"
        ? record.status
        : undefined;

    const name =
      typeof record.name === "string"
        ? record.name
        : code
        ? `Error[${code}]`
        : "StructuredError";

    return {
      name,
      message,
      code,
      statusCode,
      rawDetails: record,
    };
  }

  // Fallback for numbers, booleans, or other primitive types
  return {
    name: "PrimitiveError",
    message: String(rawError),
  };
}
