export type LogLevel = "debug" | "info" | "warn" | "error" | "fatal";

export type LogDomain =
  | "auth"
  | "feed"
  | "posts"
  | "upload"
  | "profile"
  | "cart"
  | "checkout"
  | "http"
  | "ui"
  | "system";

export interface ErrorTrackingUser {
  id?: string | number;
  username?: string;
  email?: string;
  phone?: string;
  role?: string;
}

export interface TelemetryContext {
  /**
   * Functional domain or feature area (e.g. 'auth', 'upload', 'feed')
   */
  domain?: LogDomain;
  /**
   * Specific action or operation (e.g. 'submit_login_otp', 'chunk_upload')
   */
  action?: string;
  /**
   * Machine-readable error code or status identifier
   */
  code?: string | number;
  /**
   * HTTP status code if related to an API request
   */
  statusCode?: number;
  /**
   * Correlation or trace ID linking logs across client and server
   */
  traceId?: string;
  /**
   * Custom searchable filter tags in GlitchTip
   */
  tags?: Record<string, string | number | boolean>;
  /**
   * Extra arbitrary payload metadata attached to the issue
   */
  extra?: Record<string, unknown>;
  /**
   * Mark as an app-breaking critical error making the app unusable for users
   */
  isCritical?: boolean;
  /**
   * Explicit severity level (fatal, error, warn, info)
   */
  level?: LogLevel;
  /**
   * Custom fingerprint array for intelligent issue grouping in GlitchTip
   */
  fingerprint?: string[];
}

export interface NormalizedError {
  name: string;
  message: string;
  code?: string;
  stack?: string;
  statusCode?: number;
  rawDetails?: Record<string, unknown>;
}
