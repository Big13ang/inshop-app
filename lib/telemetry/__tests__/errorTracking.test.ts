import * as Sentry from "@sentry/nextjs";
import {
  captureError,
  captureResultError,
  setUserTracking,
  setTrackingTag,
  addBreadcrumb,
} from "../errorTracking";
import { Result } from "@/lib/utils/result";

const mockScope = {
  setLevel: jest.fn(),
  setTag: jest.fn(),
  setFingerprint: jest.fn(),
  setExtra: jest.fn(),
  setExtras: jest.fn(),
};

jest.mock("@sentry/nextjs", () => ({
  captureException: jest.fn(() => "mock-event-id-exception"),
  captureMessage: jest.fn(() => "mock-event-id-message"),
  setUser: jest.fn(),
  setTag: jest.fn(),
  addBreadcrumb: jest.fn(),
  withScope: jest.fn((callback) => callback(mockScope)),
}));

describe("errorTracking telemetry", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("captureError", () => {
    it("captures Error instances using Sentry.captureException with structured tags", () => {
      const err = new Error("Network timeout");
      const eventId = captureError(err, {
        domain: "upload",
        action: "chunk_upload",
        code: "TIMEOUT",
      });

      expect(mockScope.setTag).toHaveBeenCalledWith("domain", "upload");
      expect(mockScope.setTag).toHaveBeenCalledWith("action", "chunk_upload");
      expect(mockScope.setTag).toHaveBeenCalledWith("error_code", "TIMEOUT");
      expect(Sentry.captureException).toHaveBeenCalledWith(err);
      expect(eventId).toBe("mock-event-id-exception");
    });

    it("captures plain object errors without formatting as [object Object]", () => {
      const plainObjError = {
        code: "AUTH_EXPIRED_TOKEN",
        message: "Your session token has expired",
      };

      const eventId = captureError(plainObjError, {
        domain: "auth",
        action: "token_refresh",
      });

      expect(mockScope.setTag).toHaveBeenCalledWith("domain", "auth");
      expect(mockScope.setTag).toHaveBeenCalledWith("action", "token_refresh");
      expect(mockScope.setTag).toHaveBeenCalledWith("error_code", "AUTH_EXPIRED_TOKEN");
      expect(Sentry.captureException).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "ERROR (auth) {token_refresh}",
          message: "Your session token has expired [code: AUTH_EXPIRED_TOKEN]",
        })
      );
      expect(eventId).toBe("mock-event-id-exception");
    });

    it("returns undefined for null or undefined errors", () => {
      expect(captureError(null)).toBeUndefined();
      expect(captureError(undefined)).toBeUndefined();
      expect(Sentry.captureException).not.toHaveBeenCalled();
      expect(Sentry.captureMessage).not.toHaveBeenCalled();
    });
  });

  describe("captureResultError", () => {
    it("captures error when Result is an err", () => {
      const testError = new Error("Database disconnected");
      const errResult = Result.err(testError);
      captureResultError(errResult, { domain: "system", action: "db_query" });

      expect(mockScope.setTag).toHaveBeenCalledWith("domain", "system");
      expect(Sentry.captureException).toHaveBeenCalledWith(testError);
    });

    it("does not capture when Result is ok", () => {
      const okResult = Result.ok({ id: 123 });
      captureResultError(okResult);

      expect(Sentry.captureException).not.toHaveBeenCalled();
      expect(Sentry.captureMessage).not.toHaveBeenCalled();
    });
  });

  describe("setUserTracking", () => {
    it("sets user info and role tag in Sentry", () => {
      setUserTracking({
        id: 42,
        username: "johndoe",
        email: "john@example.com",
        role: "admin",
      });

      expect(Sentry.setUser).toHaveBeenCalledWith({
        id: "42",
        username: "johndoe",
        email: "john@example.com",
      });
      expect(Sentry.setTag).toHaveBeenCalledWith("user_role", "admin");
    });

    it("clears user info when passed null", () => {
      setUserTracking(null);
      expect(Sentry.setUser).toHaveBeenCalledWith(null);
    });
  });

  describe("addBreadcrumb", () => {
    it("records breadcrumb in Sentry", () => {
      addBreadcrumb({
        category: "checkout",
        message: "User initiated payment",
        level: "info",
      });

      expect(Sentry.addBreadcrumb).toHaveBeenCalledWith(
        expect.objectContaining({
          category: "checkout",
          message: "User initiated payment",
          level: "info",
        })
      );
    });
  });
});
