import { addBreadcrumb, captureError } from "./errorTracking";
import { LogDomain, TelemetryContext } from "./types";

export interface LogEntryContext extends Omit<TelemetryContext, "domain"> {
  [key: string]: unknown;
}

class StructuredLogger {
  private defaultDomain: LogDomain;

  constructor(domain: LogDomain = "system") {
    this.defaultDomain = domain;
  }

  /**
   * Create a domain-scoped logger (e.g., const authLogger = logger.forDomain('auth'))
   */
  forDomain(domain: LogDomain): StructuredLogger {
    return new StructuredLogger(domain);
  }

  /**
   * Log fine-grained debug details (development only)
   */
  debug(message: string, context?: LogEntryContext): void {
    if (process.env.NODE_ENV === "development") {
      console.debug(`[DEBUG][${this.defaultDomain.toUpperCase()}] ${message}`, context);
    }
  }

  /**
   * Log operational milestones and key user events
   */
  info(message: string, context?: LogEntryContext): void {
    if (process.env.NODE_ENV === "development") {
      console.info(`[INFO][${this.defaultDomain.toUpperCase()}] ${message}`, context);
    }

    addBreadcrumb({
      category: this.defaultDomain,
      message,
      level: "info",
      data: context,
    });
  }

  /**
   * Log unexpected anomalies or non-critical degradations
   */
  warn(message: string, context?: LogEntryContext): void {
    console.warn(`[WARN][${this.defaultDomain.toUpperCase()}] ${message}`, context);

    addBreadcrumb({
      category: this.defaultDomain,
      message,
      level: "warning",
      data: context,
    });
  }

  /**
   * Log standard errors and automatically dispatch structured issues to GlitchTip
   */
  error(errorOrMessage: unknown, context?: LogEntryContext): void {
    captureError(errorOrMessage, {
      domain: this.defaultDomain,
      level: "error",
      ...context,
    });
  }

  /**
   * Log APP-BREAKING critical/fatal errors making features unusable for users
   * Dispatches highest priority alert to GlitchTip tagged with severity: critical and is_critical: true
   */
  fatal(errorOrMessage: unknown, context?: LogEntryContext): void {
    captureError(errorOrMessage, {
      domain: this.defaultDomain,
      isCritical: true,
      level: "fatal",
      ...context,
    });
  }

  /**
   * Alias for fatal()
   */
  critical(errorOrMessage: unknown, context?: LogEntryContext): void {
    this.fatal(errorOrMessage, context);
  }
}

export const logger = new StructuredLogger("system");
