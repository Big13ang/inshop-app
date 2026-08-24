import * as Sentry from "@sentry/nextjs";
import "@/sentry.client.config";
import { type Result } from "@/lib/utils/result";
import { normalizeError } from "./normalizer";
import { ErrorTrackingUser, TelemetryContext } from "./types";

/**
 * Captures an error and sends a rich, structured event to GlitchTip / Sentry.
 * Automatically extracts codes, prevents `[object Object]` formatting,
 * and sets indexed filter tags.
 */
export function captureError(
  error: unknown,
  context?: TelemetryContext
): string | undefined {
  if (!error) return undefined;

  const normalized = normalizeError(error);

  const domain = context?.domain || "system";
  const action = context?.action;
  const errorCode = context?.code || normalized.code;
  const statusCode = context?.statusCode || normalized.statusCode;
  const isCritical = context?.isCritical || context?.level === "fatal";
  const level: Sentry.SeverityLevel = isCritical ? "fatal" : context?.level === "warn" ? "warning" : "error";

  const levelLabel = isCritical ? "CRITICAL" : context?.level === "warn" ? "WARN" : "ERROR";
  const scopePart = action ? ` {${action}}` : "";

  // Build data suffix with extracted codes/statuses
  const dataDetails: string[] = [];
  if (errorCode) dataDetails.push(`code: ${errorCode}`);
  if (statusCode) dataDetails.push(`status: ${statusCode}`);
  const dataSuffix = dataDetails.length > 0 ? ` [${dataDetails.join(", ")}]` : "";

  // Exact requested format: LEVEL (domain) {scope} : error message with data
  const structuredName = `${levelLabel} (${domain})${scopePart}`;
  const structuredMessage = `${normalized.message}${dataSuffix}`;
  const fullFormattedTitle = `${structuredName} : ${structuredMessage}`;

  if (process.env.NODE_ENV === "development") {
    if (isCritical) {
      console.error(`💥💥 CRITICAL FAILURE 💥💥 ${fullFormattedTitle}`, {
        normalized,
        context,
      });
    } else {
      console.error(`[GlitchTip] ${fullFormattedTitle}`, {
        normalized,
        context,
      });
    }
  }

  return Sentry.withScope((scope) => {
    // 1. Set Sentry & GlitchTip Severity Level
    scope.setLevel(level);

    // 2. Indexed Filter Tags in GlitchTip
    scope.setTag("domain", domain);
    scope.setTag("severity", isCritical ? "critical" : level);
    scope.setTag("is_critical", isCritical ? "true" : "false");
    if (action) scope.setTag("action", action);
    if (errorCode) scope.setTag("error_code", String(errorCode));
    if (statusCode) scope.setTag("status_code", String(statusCode));
    if (context?.traceId) scope.setTag("trace_id", context.traceId);

    if (context?.tags) {
      for (const [key, value] of Object.entries(context.tags)) {
        scope.setTag(key, String(value));
      }
    }

    // 3. Intelligent Issue Fingerprinting (Grouping in GlitchTip)
    if (context?.fingerprint) {
      scope.setFingerprint(context.fingerprint);
    } else if (action && errorCode) {
      scope.setFingerprint([domain, action, String(errorCode)]);
    } else if (action) {
      scope.setFingerprint([domain, action, normalized.name]);
    }

    // 4. Extra Context and Details
    scope.setExtra("error_details", {
      originalName: normalized.name,
      message: normalized.message,
      code: errorCode,
      statusCode: statusCode,
      rawDetails: normalized.rawDetails,
    });

    if (context?.extra) {
      scope.setExtras(context.extra);
    }

    // 5. Capture as Exception with formatted name
    const targetError =
      error instanceof Error
        ? error
        : new Error(structuredMessage);

    targetError.name = structuredName;
    if (dataSuffix && !targetError.message.includes(dataSuffix)) {
      targetError.message = `${targetError.message}${dataSuffix}`;
    }

    return Sentry.captureException(targetError);
  });
}

/**
 * Captures a Result.err failure if present, without throwing exceptions.
 */
export function captureResultError<T, E>(
  result: Result<T, E>,
  context?: TelemetryContext
): void {
  if (!result.ok) {
    captureError(result.error, context);
  }
}

/**
 * Record a breadcrumb in the active session for debugging reproduction steps.
 */
export function addBreadcrumb(breadcrumb: {
  category?: string;
  message: string;
  level?: Sentry.SeverityLevel;
  data?: Record<string, unknown>;
}): void {
  Sentry.addBreadcrumb({
    category: breadcrumb.category || "app",
    message: breadcrumb.message,
    level: breadcrumb.level || "info",
    data: breadcrumb.data,
    timestamp: Date.now() / 1000,
  });
}

/**
 * Attach the active user identity to all subsequent error reports.
 */
export function setUserTracking(user: ErrorTrackingUser | null): void {
  if (!user) {
    Sentry.setUser(null);
    return;
  }

  Sentry.setUser({
    id: user.id ? String(user.id) : undefined,
    username: user.username,
    email: user.email,
  });

  if (user.role) {
    Sentry.setTag("user_role", user.role);
  }
}

/**
 * Set a custom global tag for issue filtering in GlitchTip.
 */
export function setTrackingTag(key: string, value: string | number | boolean): void {
  Sentry.setTag(key, String(value));
}
