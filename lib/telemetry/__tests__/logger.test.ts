import { logger } from "../logger";
import { addBreadcrumb, captureError } from "../errorTracking";

jest.mock("../errorTracking", () => ({
  addBreadcrumb: jest.fn(),
  captureError: jest.fn(),
}));

describe("StructuredLogger", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("records breadcrumbs on info()", () => {
    const authLogger = logger.forDomain("auth");
    authLogger.info("OTP sent", { phone: "0912" });

    expect(addBreadcrumb).toHaveBeenCalledWith({
      category: "auth",
      message: "OTP sent",
      level: "info",
      data: { phone: "0912" },
    });
  });

  it("records breadcrumbs on warn()", () => {
    const uploadLogger = logger.forDomain("upload");
    uploadLogger.warn("Chunk retry triggered", { attempt: 2 });

    expect(addBreadcrumb).toHaveBeenCalledWith({
      category: "upload",
      message: "Chunk retry triggered",
      level: "warning",
      data: { attempt: 2 },
    });
  });

  it("dispatches structured error to GlitchTip on error()", () => {
    const feedLogger = logger.forDomain("feed");
    feedLogger.error(new Error("Failed to load feed items"), {
      action: "fetch_feed",
      code: "FEED_NETWORK_ERR",
    });

    expect(captureError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({
        domain: "feed",
        action: "fetch_feed",
        code: "FEED_NETWORK_ERR",
        level: "error",
      })
    );
  });

  it("dispatches critical/fatal errors with isCritical: true", () => {
    const sysLogger = logger.forDomain("system");
    sysLogger.fatal(new Error("Database offline"), {
      action: "db_connect",
      code: "DB_OFFLINE",
    });

    expect(captureError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({
        domain: "system",
        action: "db_connect",
        code: "DB_OFFLINE",
        isCritical: true,
        level: "fatal",
      })
    );
  });
});
