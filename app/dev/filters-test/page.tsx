"use client";

// TODO: Remove this dev test page after verification of GlitchTip error tracking and filter functionality in staging/production

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  captureError,
  captureResultError,
  setUserTracking,
  addBreadcrumb,
} from "@/lib/telemetry/errorTracking";
import { logger } from "@/lib/telemetry/logger";
import { Result } from "@/lib/utils/result";
import { toast } from "sonner";
import {
  ShieldAlert,
  UploadCloud,
  ShoppingCart,
  UserCheck,
  AlertTriangle,
  Flame,
  Bomb,
  Layers,
} from "lucide-react";

export default function FiltersTestPage() {
  const [shouldCrash, setShouldCrash] = useState(false);

  // 1. User Context & Role Tracking
  const handleSetSellerUser = () => {
    setUserTracking({
      id: "seller_901",
      username: "digi_seller_official",
      email: "seller@inshop.social",
      phone: "09120000001",
      role: "seller",
    });
    toast.success("هویت کاربر: فروشنده (seller_901 / seller) ثبت شد.");
  };

  const handleSetBuyerUser = () => {
    setUserTracking({
      id: "buyer_404",
      username: "ali_rezaei",
      email: "ali@inshop.social",
      phone: "09120000002",
      role: "buyer",
    });
    toast.success("هویت کاربر: خریدار (buyer_404 / buyer) ثبت شد.");
  };

  // 2. Domain Tests
  const handleTestAuth = () => {
    const authLogger = logger.forDomain("auth");
    authLogger.info("User requested OTP SMS", { phone: "09120000001" });
    authLogger.warn("OTP rate limit reaching threshold", { attempt: 3 });
    authLogger.error("کد تأیید پیامک‌شده منقضی شده است (OTP Expired)", {
      action: "verify_otp",
      code: "AUTH_EXPIRED_OTP",
      statusCode: 400,
    });
    toast.success("خطای [AUTH] ارسال شد. در GlitchTip جستجو کنید: (auth)");
  };

  const handleTestUpload = () => {
    const uploadLogger = logger.forDomain("upload");
    uploadLogger.info("Starting video chunk upload", { chunk: 1, totalChunks: 8 });
    uploadLogger.warn("Socket retry triggered", { chunk: 2, retryCount: 2 });
    uploadLogger.error(new Error("Connection reset by peer during chunk upload"), {
      action: "upload_chunk",
      code: "TUS_CHUNK_TIMEOUT",
      statusCode: 504,
      extra: { chunkIndex: 2, totalBytes: 25000000 },
    });
    toast.success("خطای [UPLOAD] ارسال شد. در GlitchTip جستجو کنید: (upload)");
  };

  const handleTestCheckout = () => {
    const failedResult = Result.err({
      code: "CHECKOUT_INVENTORY_EMPTY",
      message: "موجودی کالای انتخابی در انبار به اتمام رسیده است",
      productId: "prod_88219",
    });

    captureResultError(failedResult, {
      domain: "checkout",
      action: "reserve_inventory",
      code: "INVENTORY_DEPLETED",
      extra: { cartId: "cart_9901" },
    });
    toast.success("خطای [CHECKOUT] ارسال شد. در GlitchTip جستجو کنید: (checkout)");
  };

  const handleTestFeed = () => {
    const feedLogger = logger.forDomain("feed");
    feedLogger.info("Fetching personalized home feed", { page: 1, limit: 20 });
    feedLogger.error(new Error("Feed aggregation microservice timed out"), {
      action: "fetch_home_feed",
      code: "FEED_TIMEOUT",
      statusCode: 504,
    });
    toast.success("خطای [FEED] ارسال شد. در GlitchTip جستجو کنید: (feed)");
  };

  // 3. Severity Tests
  const handleTestCriticalFatal = () => {
    const sysLogger = logger.forDomain("system");
    sysLogger.info("Testing primary Postgres connection pool");
    sysLogger.fatal(new Error("Fatal Database Failure: Main database cluster unreachable - App is down"), {
      action: "database_cluster_connect",
      code: "DB_CLUSTER_UNREACHABLE",
      statusCode: 503,
      extra: { cluster: "primary-pg", failoverAvailable: false },
    });
    toast.error("🚨 خطای بحرانی CRITICAL ارسال شد! در GlitchTip جستجو کنید: CRITICAL");
  };

  // 4. React Render Crash
  const handleTriggerReactCrash = () => {
    addBreadcrumb({
      category: "ui",
      message: "User triggered React component render crash",
      level: "warning",
    });
    setShouldCrash(true);
  };

  if (shouldCrash) {
    throw new Error("💥 Crash Test: Uncaught React Component Crash for 500 boundary test");
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6 bg-background text-foreground select-none">
      <div className="w-full max-w-2xl space-y-6 rounded-3xl border border-outline bg-container-base p-8 shadow-xl">
        {/* Header */}
        <div className="space-y-2 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 text-white text-xs font-bold">
            <Layers className="size-3.5" />
            <span>GlitchTip Filter Testing Suite</span>
          </div>
          <h1 className="text-2xl font-black font-logo">آزمایش فیلترها و لاگ ساختاریافته</h1>
          <p className="text-xs text-muted-foreground max-w-md mx-auto">
            با زدن هر دکمه، رویدادی ساختاریافته با تگ‌ها، نام حوزه (Domain) و سطح اهمیت به GlitchTip ارسال می‌شود.
          </p>
        </div>

        {/* Section 1: User Context */}
        <div className="space-y-3 rounded-2xl border border-outline/50 bg-background/50 p-4">
          <h2 className="text-xs font-black uppercase text-muted-foreground flex items-center gap-1.5">
            <UserCheck className="size-3.5" />
            ۱. تنظیم هویت و نقش کاربر (User Context & Roles)
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              size="default"
              className="w-full justify-center text-xs"
              onClick={handleSetSellerUser}
            >
              نقش: فروشنده (Seller)
            </Button>
            <Button
              variant="outline"
              size="default"
              className="w-full justify-center text-xs"
              onClick={handleSetBuyerUser}
            >
              نقش: خریدار (Buyer)
            </Button>
          </div>
        </div>

        {/* Section 2: Domain Filtering */}
        <div className="space-y-3 rounded-2xl border border-outline/50 bg-background/50 p-4">
          <h2 className="text-xs font-black uppercase text-muted-foreground flex items-center gap-1.5">
            <ShieldAlert className="size-3.5" />
            ۲. تست فیلترهای حوزه‌ای (Domain Filters)
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="secondary"
              size="default"
              className="w-full justify-center gap-2 text-xs"
              onClick={handleTestAuth}
            >
              <ShieldAlert className="size-3.5" />
              حوزه احراز هویت (Auth)
            </Button>
            <Button
              variant="secondary"
              size="default"
              className="w-full justify-center gap-2 text-xs"
              onClick={handleTestUpload}
            >
              <UploadCloud className="size-3.5" />
              حوزه آپلود رسانه (Upload)
            </Button>
            <Button
              variant="secondary"
              size="default"
              className="w-full justify-center gap-2 text-xs"
              onClick={handleTestCheckout}
            >
              <ShoppingCart className="size-3.5" />
              حوزه سفارش و سبد (Checkout)
            </Button>
            <Button
              variant="secondary"
              size="default"
              className="w-full justify-center gap-2 text-xs"
              onClick={handleTestFeed}
            >
              <AlertTriangle className="size-3.5" />
              حوزه فید محتوا (Feed)
            </Button>
          </div>
        </div>

        {/* Section 3: Severity & Crashes */}
        <div className="space-y-3 rounded-2xl border border-outline/50 bg-background/50 p-4">
          <h2 className="text-xs font-black uppercase text-muted-foreground flex items-center gap-1.5">
            <Flame className="size-3.5 text-error" />
            ۳. تست خطاهای بحرانی و صفحه ۵۰۰ (Critical & Crash)
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="destructive"
              size="default"
              className="w-full justify-center gap-2 text-xs font-bold"
              onClick={handleTestCriticalFatal}
            >
              <Flame className="size-3.5" />
              خطای بحرانی فلج‌کننده (CRITICAL)
            </Button>
            <Button
              variant="destructive"
              size="default"
              className="w-full justify-center gap-2 text-xs font-bold"
              onClick={handleTriggerReactCrash}
            >
              <Bomb className="size-3.5" />
              تست کرش React (صفحه ۵۰۰)
            </Button>
          </div>
        </div>

        {/* Filter Cheat Sheet */}
        <div className="rounded-2xl bg-zinc-950 p-4 text-zinc-300 space-y-2 text-xs">
          <div className="font-bold text-white flex items-center justify-between">
            <span>راهنمای جستجو در GlitchTip:</span>
            <span className="text-[10px] text-zinc-400">https://errors.inshop.social</span>
          </div>
          <ul className="space-y-1 font-mono text-[11px] text-zinc-300">
            <li>• جستجوی خطاهای بحرانی: <span className="text-red-400 font-bold">CRITICAL</span> یا <span className="text-red-400">level:fatal</span></li>
            <li>• جستجوی خطاهای احراز هویت: <span className="text-yellow-400 font-bold">(auth)</span> یا <span className="text-yellow-400">auth</span></li>
            <li>• جستجوی خطاهای آپلود: <span className="text-blue-400 font-bold">(upload)</span> یا <span className="text-blue-400">upload</span></li>
            <li>• جستجوی خطاهای سبد خرید: <span className="text-green-400 font-bold">(checkout)</span></li>
            <li>• جستجوی بر اساس کد خطا: <span className="text-purple-400 font-bold">AUTH_EXPIRED_OTP</span></li>
          </ul>
        </div>
      </div>
    </div>
  );
}
