process.env.TURBOPACK = "1";
import { spawnSync } from "node:child_process";
import crypto from "node:crypto";
const { serwist } = await import("@serwist/next/config");

const getGitRevision = () => {
  const result = spawnSync("git", ["rev-parse", "HEAD"], { encoding: "utf-8" });
  if (result.stdout?.trim()) {
    return result.stdout.trim();
  }
  return crypto.randomUUID();
};

const revision = getGitRevision();

export default serwist({
  swSrc: "app/sw.ts",
  swDest: "public/sw.js",
  globDirectory: ".next",
  additionalPrecacheEntries: [{ url: "/offline", revision }],
});
