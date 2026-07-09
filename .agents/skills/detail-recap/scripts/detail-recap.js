#!/usr/bin/env node

const childProcess = require("child_process");
const fs = require("fs");
const http = require("http");
const os = require("os");
const path = require("path");
const readline = require("readline");

const args = process.argv.slice(2);

function parseArgs(rawArgs) {
  const options = {
    range: null,
    noOpen: false,
    keep: false,
    dryRun: false,
    port: 0,
  };

  for (let index = 0; index < rawArgs.length; index += 1) {
    const arg = rawArgs[index];
    if (arg === "--no-open") {
      options.noOpen = true;
    } else if (arg === "--keep") {
      options.keep = true;
    } else if (arg === "--dry-run") {
      options.dryRun = true;
      options.noOpen = true;
    } else if (arg === "--port") {
      const next = rawArgs[index + 1];
      if (!next || Number.isNaN(Number(next))) {
        throw new Error("--port requires a numeric value");
      }
      options.port = Number(next);
      index += 1;
    } else if (!options.range) {
      options.range = arg;
    } else {
      throw new Error(`Unexpected argument: ${arg}`);
    }
  }

  if (!options.range) {
    options.range = "HEAD";
  }

  return options;
}

function usage() {
  return [
    "Usage:",
    "  node .agents/skills/detail-recap/scripts/detail-recap.js [range] [--no-open] [--keep] [--dry-run] [--port 0]",
    "",
    "Ranges:",
    "  HEAD              Compare HEAD against the working tree",
    "  main..HEAD        Compare two refs",
    "  main...HEAD       Compare merge-base(main, HEAD) against HEAD",
    "  HEAD~3..HEAD      Compare a commit range",
    "",
    "The generated viewer and diff-data.json are written to an OS temp directory.",
  ].join("\n");
}

function run(command, commandArgs, options = {}) {
  const result = childProcess.spawnSync(command, commandArgs, {
    cwd: options.cwd,
    encoding: "utf8",
    maxBuffer: options.maxBuffer || 1024 * 1024 * 200,
    stdio: options.stdio || ["ignore", "pipe", "pipe"],
  });

  if (result.status !== 0) {
    const detail = (result.stderr || result.stdout || "").trim();
    throw new Error(`${command} ${commandArgs.join(" ")} failed${detail ? `:\n${detail}` : ""}`);
  }

  return (result.stdout || "").trim();
}

function tryRun(command, commandArgs, options = {}) {
  const result = childProcess.spawnSync(command, commandArgs, {
    cwd: options.cwd,
    encoding: "utf8",
    maxBuffer: options.maxBuffer || 1024 * 1024 * 200,
    stdio: ["ignore", "pipe", "pipe"],
  });

  if (result.status !== 0) {
    return null;
  }

  return result.stdout || "";
}

function getRepoRoot() {
  return run("git", ["rev-parse", "--show-toplevel"], { cwd: process.cwd() });
}

function parseRange(range, repoRoot) {
  if (range.includes("...")) {
    const [left, right] = range.split("...");
    const target = right || "HEAD";
    const base = run("git", ["merge-base", left, target], { cwd: repoRoot });
    return {
      displayRange: `${left}...${target}`,
      from: base,
      to: target,
      mode: "merge-base",
      diffArgs: [base, target],
    };
  }

  if (range.includes("..")) {
    const [from, to] = range.split("..");
    return {
      displayRange: `${from}..${to}`,
      from,
      to,
      mode: "range",
      diffArgs: [from, to],
    };
  }

  return {
    displayRange: `${range}..working-tree`,
    from: range,
    to: "Working Tree",
    mode: "working-tree",
    diffArgs: [range],
  };
}

function gitShow(repoRoot, ref, filePath) {
  const output = tryRun("git", ["show", `${ref}:${filePath}`], {
    cwd: repoRoot,
    maxBuffer: 1024 * 1024 * 200,
  });
  return output === null ? null : output;
}

function readWorkingFile(repoRoot, filePath) {
  try {
    return fs.readFileSync(path.join(repoRoot, filePath), "utf8");
  } catch (_error) {
    return null;
  }
}

function splitLines(content) {
  if (content === null || content === undefined) return [];
  return String(content).replace(/\r/g, "").split("\n");
}

function diffLines(oldLines, newLines) {
  const rows = oldLines.length + 1;
  const columns = newLines.length + 1;
  const dp = Array.from({ length: rows }, () => new Array(columns).fill(0));

  for (let row = 1; row < rows; row += 1) {
    for (let column = 1; column < columns; column += 1) {
      if (oldLines[row - 1] === newLines[column - 1]) {
        dp[row][column] = dp[row - 1][column - 1] + 1;
      } else {
        dp[row][column] = Math.max(dp[row - 1][column], dp[row][column - 1]);
      }
    }
  }

  const result = [];
  let row = oldLines.length;
  let column = newLines.length;

  while (row > 0 || column > 0) {
    if (row > 0 && column > 0 && oldLines[row - 1] === newLines[column - 1]) {
      result.unshift({
        type: "context",
        lineOld: row,
        lineNew: column,
        text: oldLines[row - 1],
      });
      row -= 1;
      column -= 1;
    } else if (column > 0 && (row === 0 || dp[row][column - 1] >= dp[row - 1][column])) {
      result.unshift({
        type: "added",
        lineOld: null,
        lineNew: column,
        text: newLines[column - 1],
      });
      column -= 1;
    } else {
      result.unshift({
        type: "removed",
        lineOld: row,
        lineNew: null,
        text: oldLines[row - 1],
      });
      row -= 1;
    }
  }

  return result;
}

function classifyFile(filePath) {
  const normalized = filePath.replace(/\\/g, "/");
  const lower = normalized.toLowerCase();

  if (lower.includes("__tests__") || lower.endsWith(".test.ts") || lower.endsWith(".test.tsx") || lower.endsWith(".spec.ts") || lower.endsWith(".spec.tsx") || lower.startsWith("e2e/")) {
    return "Tests";
  }
  if (lower.includes(".agents/skills/")) {
    return "Skills";
  }
  if (lower.startsWith("app/")) {
    return "Routes";
  }
  if (lower.startsWith("features/")) {
    return "Features";
  }
  if (lower.startsWith("components/")) {
    return "UI";
  }
  if (lower.includes("auth")) {
    return "Auth";
  }
  if (lower.endsWith(".json") || lower.endsWith(".yml") || lower.endsWith(".yaml") || lower.includes("config") || lower.includes("tsconfig")) {
    return "Config";
  }
  if (lower.startsWith("scripts/")) {
    return "Tooling";
  }
  return "Logic";
}

const REVIEW_LAYERS = [
  {
    name: "Workflow",
    title: "Agent workflow",
    intent: "Review how this project asks agents or local tools to behave.",
    why: "Skill, script, or workflow changes usually exist to make future work repeatable.",
    focus: "Check that the workflow is scoped, temporary data stays temporary, and commands are easy to run.",
  },
  {
    name: "Boundary",
    title: "Boundary and config",
    intent: "Review request, build, routing, and configuration edges before inner logic.",
    why: "Boundary files can change behavior across the whole app even when the diff is small.",
    focus: "Check runtime/build impact, route matching, package scripts, and config compatibility.",
  },
  {
    name: "Domain",
    title: "Domain behavior",
    intent: "Review the product behavior and state transitions that carry the change.",
    why: "Domain and feature files explain the main reason the PR exists.",
    focus: "Check invariants, auth/session assumptions, data flow, and error states.",
  },
  {
    name: "Application",
    title: "Application routes",
    intent: "Review how changed behavior is exposed through pages, layouts, and app routes.",
    why: "Route changes connect domain work to user-visible entry points.",
    focus: "Check loading, empty, not-found, navigation, and server/client boundaries.",
  },
  {
    name: "Interface",
    title: "Interface surface",
    intent: "Review components and visual behavior after the underlying flow is clear.",
    why: "UI changes are easier to judge once the review knows which behavior they serve.",
    focus: "Check accessibility, responsive layout, interaction states, and project UI components.",
  },
  {
    name: "Verification",
    title: "Verification",
    intent: "Review tests and e2e coverage against the behavior layers above.",
    why: "Tests show which contract the author intended to protect.",
    focus: "Check that tests match the new behavior and cover the risky layers.",
  },
  {
    name: "Support",
    title: "Support files",
    intent: "Review supporting files, generated remnants, and miscellaneous changes last.",
    why: "Support files often explain maintenance work or cleanup around the main change.",
    focus: "Check generated artifacts, docs, fixtures, and files that should not live in source.",
  },
];

function layerRank(name) {
  const index = REVIEW_LAYERS.findIndex((layer) => layer.name === name);
  return index === -1 ? REVIEW_LAYERS.length : index;
}

function getLayer(filePath) {
  const normalized = filePath.replace(/\\/g, "/");
  const lower = normalized.toLowerCase();

  if (lower.startsWith(".agents/skills/")) return "Workflow";
  if (lower.startsWith("proxy") || lower.includes("middleware") || lower.includes("route.ts") || lower.includes("config") || lower.includes("tsconfig")) return "Boundary";
  if (lower.startsWith("features/") || lower.includes("/hooks/") || lower.startsWith("lib/") || lower.startsWith("utils/")) return "Domain";
  if (lower.startsWith("components/")) return "Interface";
  if (lower.startsWith("app/")) return "Application";
  if (lower.startsWith("e2e/") || lower.includes("__tests__") || lower.includes(".test.") || lower.includes(".spec.")) return "Verification";
  return "Support";
}

function statusLabel(status) {
  if (status === "A") return "Added";
  if (status === "D") return "Deleted";
  if (status === "R") return "Renamed";
  if (status === "C") return "Copied";
  if (status === "M") return "Modified";
  return status || "Changed";
}

function countTypes(diff) {
  return diff.reduce(
    (acc, line) => {
      if (line.type === "added") acc.added += 1;
      if (line.type === "removed") acc.removed += 1;
      if (line.type === "context") acc.context += 1;
      return acc;
    },
    { added: 0, removed: 0, context: 0 },
  );
}

function parseNameStatus(output) {
  const rows = [];
  for (const line of output.split("\n")) {
    if (!line.trim()) continue;
    const parts = line.split("\t");
    const rawStatus = parts[0] || "M";
    const status = rawStatus.charAt(0);
    const filePath = parts[parts.length - 1];
    const previousPath = status === "R" || status === "C" ? parts[1] : null;
    rows.push({ status, filePath, previousPath });
  }
  return rows;
}

function getChangedRows(repoRoot, rangeInfo) {
  if (rangeInfo.mode === "working-tree") {
    const output = run("git", ["diff", "--name-status", rangeInfo.from], { cwd: repoRoot });
    return parseNameStatus(output);
  }

  const output = run("git", ["diff", "--name-status", ...rangeInfo.diffArgs], { cwd: repoRoot });
  return parseNameStatus(output);
}

function getNewContent(repoRoot, rangeInfo, filePath) {
  if (rangeInfo.mode === "working-tree") {
    return readWorkingFile(repoRoot, filePath);
  }
  return gitShow(repoRoot, rangeInfo.to, filePath);
}

function buildFiles(repoRoot, rangeInfo) {
  const rows = getChangedRows(repoRoot, rangeInfo);
  const files = [];

  for (const row of rows) {
    const oldPath = row.previousPath || row.filePath;
    const oldContent = gitShow(repoRoot, rangeInfo.from, oldPath);
    const newContent = getNewContent(repoRoot, rangeInfo, row.filePath);
    let diff;

    if (row.status === "A" || oldContent === null) {
      diff = splitLines(newContent).map((text, index) => ({
        type: "added",
        lineOld: null,
        lineNew: index + 1,
        text,
      }));
    } else if (row.status === "D" || newContent === null) {
      diff = splitLines(oldContent).map((text, index) => ({
        type: "removed",
        lineOld: index + 1,
        lineNew: null,
        text,
      }));
    } else {
      diff = diffLines(splitLines(oldContent), splitLines(newContent));
    }

    const counts = countTypes(diff);
    const layer = getLayer(row.filePath);
    files.push({
      path: row.filePath,
      previousPath: row.previousPath,
      status: row.status,
      statusLabel: statusLabel(row.status),
      tag: classifyFile(row.filePath),
      layer,
      layerIndex: layerRank(layer) + 1,
      added: counts.added,
      removed: counts.removed,
      context: counts.context,
      churn: counts.added + counts.removed,
      diff,
    });
  }

  files.sort((left, right) => {
    if (left.layer !== right.layer) return layerRank(left.layer) - layerRank(right.layer);
    if (right.churn !== left.churn) return right.churn - left.churn;
    return left.path.localeCompare(right.path);
  });

  return files;
}

function groupBy(files, key) {
  const groups = new Map();
  for (const file of files) {
    const name = file[key] || "Other";
    if (!groups.has(name)) {
      groups.set(name, { name, files: [], added: 0, removed: 0, churn: 0 });
    }
    const group = groups.get(name);
    group.files.push(file.path);
    group.added += file.added;
    group.removed += file.removed;
    group.churn += file.churn;
  }
  return Array.from(groups.values()).sort((left, right) => right.churn - left.churn || left.name.localeCompare(right.name));
}

function buildReviewLayers(files) {
  return REVIEW_LAYERS.map((definition, index) => {
    const layerFiles = files.filter((file) => file.layer === definition.name);
    if (layerFiles.length === 0) return null;

    const totals = layerFiles.reduce(
      (acc, file) => {
        acc.added += file.added;
        acc.removed += file.removed;
        acc.churn += file.churn;
        return acc;
      },
      { added: 0, removed: 0, churn: 0 },
    );

    const riskCounts = layerFiles.reduce(
      (acc, file) => {
        acc[riskLevel(file)] += 1;
        return acc;
      },
      { High: 0, Medium: 0, Low: 0 },
    );

    const risk = riskCounts.High > 0 ? "High" : riskCounts.Medium > 0 ? "Medium" : "Low";

    return {
      index: index + 1,
      name: definition.name,
      title: definition.title,
      intent: definition.intent,
      why: definition.why,
      focus: definition.focus,
      files: layerFiles.map((file) => file.path),
      fileCount: layerFiles.length,
      added: totals.added,
      removed: totals.removed,
      churn: totals.churn,
      risk,
      riskCounts,
    };
  }).filter(Boolean);
}

function inferDrivers(files) {
  const drivers = [];
  const tags = new Set(files.map((file) => file.tag));
  const paths = files.map((file) => file.path.toLowerCase());
  const changedSkill = paths.some((filePath) => filePath.includes(".agents/skills/"));
  const changedAuth = paths.some((filePath) => filePath.includes("auth"));
  const changedBoundary = paths.some((filePath) => filePath.startsWith("proxy") || filePath.includes("middleware") || filePath.includes("tsconfig") || filePath.includes("config"));
  const changedUi = tags.has("UI") || tags.has("Routes") || tags.has("Features");
  const changedTests = tags.has("Tests");
  const generated = paths.some((filePath) => filePath.includes("diff-data") || filePath.includes("diff-viewer") || filePath.includes("generate-diff"));

  if (changedSkill) {
    drivers.push({
      label: "Agent workflow was changed",
      why: "Skill files changed, so the project is likely capturing a repeatable agent workflow rather than only product behavior.",
    });
  }
  if (changedAuth) {
    drivers.push({
      label: "Authentication behavior is involved",
      why: "Auth paths changed, so the change likely affects login, sessions, protected navigation, or auth-related tests.",
    });
  }
  if (changedBoundary) {
    drivers.push({
      label: "Boundary behavior moved",
      why: "Proxy, middleware, TypeScript, or config files changed, which usually means the request/build boundary needed adjustment.",
    });
  }
  if (changedUi) {
    drivers.push({
      label: "User-facing flow changed",
      why: "Routes, features, or UI components changed, so the diff likely changes what users see or how they move through the app.",
    });
  }
  if (changedTests) {
    drivers.push({
      label: "Verification was updated",
      why: "Test files changed, which usually means the behavior contract was clarified, protected, or repaired after implementation.",
    });
  }
  if (generated) {
    drivers.push({
      label: "Generated review artifacts appeared",
      why: "Diff viewer or diff data files changed. These are review outputs, so they should live in temp storage rather than project source.",
    });
  }

  if (drivers.length === 0) {
    drivers.push({
      label: "Local logic changed",
      why: "The changed paths do not match a specialized driver, so review the largest churn files to infer the feature or fix intent.",
    });
  }

  return drivers;
}

function riskLevel(file) {
  let score = 0;
  const lower = file.path.toLowerCase();

  if (file.churn > 300) score += 3;
  else if (file.churn > 120) score += 2;
  else if (file.churn > 40) score += 1;

  if (lower.includes("auth") || lower.startsWith("proxy") || lower.includes("middleware") || lower.includes("tsconfig") || lower.includes("package.json")) score += 2;
  if (lower.includes("diff-data") || lower.includes("public/")) score += 1;
  if (file.status === "D") score += 1;

  if (score >= 4) return "High";
  if (score >= 2) return "Medium";
  return "Low";
}

function buildRisks(files) {
  return files
    .map((file) => ({
      path: file.path,
      level: riskLevel(file),
      churn: file.churn,
      reason: riskReason(file),
    }))
    .filter((risk) => risk.level !== "Low")
    .sort((left, right) => {
      const rank = { High: 2, Medium: 1, Low: 0 };
      return rank[right.level] - rank[left.level] || right.churn - left.churn;
    })
    .slice(0, 12);
}

function plural(count, singular, pluralWord = `${singular}s`) {
  return `${count} ${count === 1 ? singular : pluralWord}`;
}

function buildNarrative(files, reviewLayers, drivers, risks) {
  if (files.length === 0) {
    return {
      headline: "No changed files detected",
      changeStory: "The selected range did not produce a file diff.",
      primaryDriver: "There is no diff evidence to infer a driver.",
      riskPosture: "No elevated review risks were detected.",
      reviewPath: "Choose another range or compare HEAD against the working tree.",
      verification: "Run the generator again with the intended branch, commit range, or HEAD.",
    };
  }

  const primaryLayer = [...reviewLayers].sort((left, right) => right.churn - left.churn)[0];
  const firstDriver = drivers[0];
  const highRisks = risks.filter((risk) => risk.level === "High");
  const mediumRisks = risks.filter((risk) => risk.level === "Medium");
  const verificationLayer = reviewLayers.find((layer) => layer.name === "Verification");
  const orderedLayers = reviewLayers.map((layer) => `L${layer.index} ${layer.name}`).join(" -> ");

  return {
    headline: `${plural(files.length, "file")} changed across ${plural(reviewLayers.length, "review layer")}`,
    changeStory: `The center of gravity is ${primaryLayer.title}: ${plural(primaryLayer.fileCount, "file")} and ${primaryLayer.churn} lines of churn.`,
    primaryDriver: firstDriver ? `${firstDriver.label}: ${firstDriver.why}` : "The paths do not point to a single obvious driver.",
    riskPosture: highRisks.length > 0
      ? `${plural(highRisks.length, "high-risk file")} should be reviewed first.`
      : mediumRisks.length > 0
        ? `${plural(mediumRisks.length, "medium-risk file")} ${mediumRisks.length === 1 ? "deserves" : "deserve"} a closer read.`
        : "No elevated review risks were detected from path and churn heuristics.",
    reviewPath: `Suggested pass: ${orderedLayers}.`,
    verification: verificationLayer
      ? `Verification changed in ${plural(verificationLayer.fileCount, "file")}; compare those tests with the behavior layers above.`
      : "No verification layer was detected; consider the smallest test or manual check that proves the changed behavior.",
  };
}

function riskReason(file) {
  const lower = file.path.toLowerCase();
  if (file.churn > 300) return "Large churn deserves close review.";
  if (lower.includes("auth")) return "Auth changes can affect access and session behavior.";
  if (lower.startsWith("proxy") || lower.includes("middleware")) return "Boundary changes can affect every request.";
  if (lower.includes("tsconfig") || lower.includes("package.json")) return "Config changes can affect build, tests, or runtime.";
  if (lower.includes("diff-data") || lower.includes("public/")) return "Review artifacts should stay out of source.";
  if (file.status === "D") return "Deleted files can remove behavior or coverage.";
  return "Moderate churn.";
}

function getCommitMeta(repoRoot, rangeInfo) {
  try {
    if (rangeInfo.mode === "working-tree") {
      return {
        hash: "Working Tree",
        subject: `Uncommitted changes since ${rangeInfo.from}`,
      };
    }

    return {
      hash: run("git", ["rev-parse", "--short", rangeInfo.to], { cwd: repoRoot }),
      subject: run("git", ["log", "-1", "--pretty=format:%s", rangeInfo.to], { cwd: repoRoot }),
    };
  } catch (_error) {
    return { hash: "", subject: "" };
  }
}

function buildData(repoRoot, rangeInfo) {
  const files = buildFiles(repoRoot, rangeInfo);
  const reviewLayers = buildReviewLayers(files);
  const drivers = inferDrivers(files);
  const risks = buildRisks(files);
  const totals = files.reduce(
    (acc, file) => {
      acc.added += file.added;
      acc.removed += file.removed;
      acc.context += file.context;
      acc.churn += file.churn;
      return acc;
    },
    { added: 0, removed: 0, context: 0, churn: 0 },
  );

  return {
    meta: {
      repoRoot,
      range: rangeInfo.displayRange,
      from: rangeInfo.from,
      to: rangeInfo.to,
      mode: rangeInfo.mode,
      generatedAt: new Date().toISOString(),
      ...getCommitMeta(repoRoot, rangeInfo),
    },
    summary: {
      totalFiles: files.length,
      ...totals,
      byTag: groupBy(files, "tag"),
      byLayer: groupBy(files, "layer"),
      reviewLayers,
      drivers,
      risks,
      narrative: buildNarrative(files, reviewLayers, drivers, risks),
    },
    files,
  };
}

function openBrowser(url) {
  const platform = process.platform;
  if (platform === "win32") {
    childProcess.spawn("cmd", ["/c", "start", "", url], { detached: true, stdio: "ignore" }).unref();
  } else if (platform === "darwin") {
    childProcess.spawn("open", [url], { detached: true, stdio: "ignore" }).unref();
  } else {
    childProcess.spawn("xdg-open", [url], { detached: true, stdio: "ignore" }).unref();
  }
}

function writeArtifacts(tempDir, data) {
  fs.writeFileSync(path.join(tempDir, "diff-data.json"), JSON.stringify(data, null, 2), "utf8");
  fs.writeFileSync(path.join(tempDir, "detail-recap.html"), viewerHtml(), "utf8");
}

function createServer(tempDir) {
  return http.createServer((request, response) => {
    const requestUrl = new URL(request.url, "http://localhost");
    const fileName = requestUrl.pathname === "/" ? "detail-recap.html" : requestUrl.pathname.slice(1);
    const safeName = path.basename(fileName);
    const filePath = path.join(tempDir, safeName);

    if (!filePath.startsWith(tempDir) || !fs.existsSync(filePath)) {
      response.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
      response.end("Not found");
      return;
    }

    const ext = path.extname(filePath);
    const contentType = ext === ".json" ? "application/json; charset=utf-8" : "text/html; charset=utf-8";
    response.writeHead(200, {
      "content-type": contentType,
      "cache-control": "no-store",
    });
    fs.createReadStream(filePath).pipe(response);
  });
}

function cleanup(tempDir, keep) {
  if (keep) return;
  try {
    fs.rmSync(tempDir, { recursive: true, force: true });
  } catch (_error) {
    // Best effort cleanup.
  }
}

function viewerHtml() {
  return String.raw`<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>inShop - Detail Recap</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Vazirmatn:wght@300;400;500;600;700;800;900&family=Fira+Code:wght@400;500;600&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/themes/prism-tomorrow.min.css">
  <script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-core.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-clike.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-markup.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-javascript.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-typescript.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-jsx.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-tsx.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-css.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-json.min.js"></script>
  <style>
    :root {
      color-scheme: dark;
      --bg: #171a21;
      --panel: #1e2028;
      --panel-2: #262830;
      --code-bg: #13161c;
      --line: rgba(255, 255, 255, 0.06);
      --text: #e8e6e3;
      --muted: #7a7d85;
      --soft: #94a3b8;
      --gold: #d4a053;
      --gold-soft: rgba(212, 160, 83, 0.08);
      --gold-line: rgba(212, 160, 83, 0.3);
      --blue: #60a5fa;
      --green: #5eeaa0;
      --green-bg: rgba(80, 220, 140, 0.12);
      --green-line: rgba(80, 220, 140, 0.3);
      --red: #f08080;
      --red-bg: rgba(240, 80, 80, 0.12);
      --red-line: rgba(240, 80, 80, 0.3);
      --radius-lg: 12px;
      --radius: 8px;
      --radius-sm: 4px;
      --font-sans: "Inter", "Vazirmatn", ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      --font-mono: "Fira Code", "Vazirmatn", Consolas, monospace;
      font-family: var(--font-sans);
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    ::-webkit-scrollbar {
      width: 5px;
      height: 5px;
    }

    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb {
      background: rgba(255, 255, 255, 0.08);
      border-radius: 99px;
    }
    ::-webkit-scrollbar-thumb:hover { background: var(--gold); }

    body {
      height: 100vh;
      background: var(--bg);
      color: var(--text);
      display: flex;
      flex-direction: column;
      overflow: hidden;
      letter-spacing: 0;
    }

    header {
      z-index: 5;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      padding: 18px 24px;
      background: var(--bg);
      border-bottom: 1px solid var(--line);
    }

    .header-title-group {
      display: flex;
      align-items: center;
      gap: 16px;
      min-width: 0;
    }

    .logo {
      font-weight: 800;
      font-size: 20px;
      background: linear-gradient(135deg, #e8c87a, var(--gold));
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .header-divider {
      color: var(--line);
      font-size: 14px;
    }

    .header-subtitle {
      font-size: 14px;
      font-weight: 600;
      color: var(--text);
      white-space: nowrap;
    }

    .badge {
      background: var(--gold-soft);
      color: var(--gold);
      border: 1px solid rgba(212, 160, 83, 0.15);
      padding: 3px 12px;
      border-radius: 6px;
      font-size: 11px;
      font-weight: 600;
    }

    h1 {
      font-size: 20px;
      font-weight: 800;
      background: linear-gradient(135deg, #e8c87a, var(--gold));
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    h2 { font-size: 16px; font-weight: 750; }
    h3 { font-size: 13px; font-weight: 700; color: var(--muted); text-transform: uppercase; }
    button, select, input {
      font: inherit;
      color: inherit;
    }

    .range { color: var(--muted); font-size: 13px; margin-top: 4px; }
    .shell {
      display: grid;
      grid-template-columns: 300px minmax(0, 1fr);
      flex: 1;
      min-height: 0;
      overflow: hidden;
    }

    aside {
      border-right: 1px solid var(--line);
      background: var(--bg);
      overflow: auto;
      min-height: 0;
    }

    .sidebar-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px 24px;
      border-bottom: 1px solid var(--line);
      color: var(--muted);
      font-size: 12px;
      font-weight: 700;
      text-transform: uppercase;
    }

    .sidebar-count {
      background: var(--panel-2);
      border-radius: 4px;
      color: var(--text);
      font-size: 10px;
      padding: 2px 6px;
    }

    main {
      overflow: auto;
      min-height: 0;
      background: var(--bg);
      scroll-padding-top: 112px;
      scroll-behavior: smooth;
    }

    .section {
      padding: 32px;
      border-bottom: 1px solid var(--line);
    }
    .compact { padding: 20px 12px; }
    .grid {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 20px;
    }

    .story-grid {
      display: grid;
      grid-template-columns: minmax(0, 1.1fr) minmax(0, 0.9fr);
      gap: 20px;
      margin-top: 16px;
    }

    .story-card {
      display: grid;
      gap: 10px;
      background: var(--panel);
      border: 1px solid var(--line);
      border-radius: var(--radius-lg);
      padding: 24px;
    }

    .story-card.primary {
      background: var(--panel);
      border-color: var(--gold-line);
      box-shadow: 0 8px 30px rgba(0, 0, 0, 0.24);
    }

    .story-label {
      color: var(--muted);
      font-size: 11px;
      font-weight: 800;
      text-transform: uppercase;
    }

    .story-headline {
      font-size: 18px;
      font-weight: 820;
      line-height: 1.45;
    }

    .story-copy {
      color: var(--soft);
      font-size: 13.5px;
      line-height: 1.65;
    }

    .metric, .panel {
      background: var(--panel);
      border: 1px solid var(--line);
      border-radius: var(--radius-lg);
    }

    .metric {
      padding: 24px;
      transition: border-color 0.2s ease, box-shadow 0.2s ease;
    }
    .metric:hover {
      border-color: rgba(212, 160, 83, 0.15);
      box-shadow: 0 8px 30px rgba(0, 0, 0, 0.3);
    }
    .metric .value { margin-top: 10px; font-size: 26px; font-weight: 820; }
    .metric .label {
      color: var(--muted);
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0;
      text-transform: uppercase;
    }

    .tabs {
      display: flex;
      gap: 0;
      padding: 0 24px;
      border-bottom: 1px solid var(--line);
      background: var(--bg);
      position: sticky;
      top: 0;
      z-index: 4;
    }

    .tab {
      position: relative;
      border: 0;
      background: transparent;
      padding: 18px 16px;
      cursor: pointer;
      color: var(--muted);
      font-size: 13px;
      font-weight: 600;
      transition: color 0.15s ease;
    }

    .tab:hover {
      color: var(--text);
    }

    .tab.active {
      color: var(--gold);
    }

    .tab.active::after {
      content: "";
      position: absolute;
      left: 16px;
      right: 16px;
      bottom: -1px;
      height: 2px;
      background: var(--gold);
      box-shadow: 0 0 10px var(--gold);
      border-radius: 2px;
    }

    .tab-panel { display: none; }
    .tab-panel.active {
      display: block;
      animation: fadeIn 0.25s ease-out;
    }

    @keyframes fadeIn {
      from {
        opacity: 0;
        transform: translateY(4px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .chart-wrap {
      display: grid;
      grid-template-columns: minmax(0, 1.3fr) minmax(260px, 0.7fr);
      gap: 20px;
      align-items: stretch;
    }

    .chart {
      display: flex;
      align-items: end;
      gap: 10px;
      min-height: 260px;
      padding: 24px;
      background: var(--panel);
      border: 1px solid var(--line);
      border-radius: var(--radius-lg);
      overflow-x: auto;
    }

    .bar-group {
      min-width: 72px;
      display: grid;
      grid-template-rows: 1fr auto;
      gap: 10px;
      height: 220px;
    }

    .bar-stack {
      align-self: end;
      display: flex;
      flex-direction: column-reverse;
      height: var(--bar-height);
      min-height: 2px;
      border-radius: 6px 6px 0 0;
      overflow: hidden;
      background: var(--panel-2);
    }

    .bar-add { background: var(--green); }
    .bar-remove { background: var(--red); }
    .bar-label {
      color: var(--muted);
      font-size: 11px;
      line-height: 1.25;
      overflow-wrap: anywhere;
      text-align: center;
    }

    .legend {
      display: flex;
      gap: 12px;
      color: var(--muted);
      font-size: 12px;
      margin-top: 0;
    }

    .dot {
      display: inline-block;
      width: 8px;
      height: 8px;
      border-radius: 99px;
      margin-right: 6px;
    }

    .drivers {
      display: grid;
      gap: 10px;
    }

    .stack {
      display: grid;
      gap: 12px;
      margin-top: 16px;
    }

    .layer-card {
      display: grid;
      grid-template-columns: 44px minmax(0, 1fr) auto;
      gap: 14px;
      align-items: start;
      border: 1px solid var(--line);
      background: var(--panel);
      border-radius: var(--radius-lg);
      padding: 18px;
      transition: border-color 0.2s ease, box-shadow 0.2s ease;
    }

    .layer-card:hover {
      border-color: rgba(212, 160, 83, 0.15);
      box-shadow: 0 8px 30px rgba(0, 0, 0, 0.22);
    }

    .layer-index {
      display: grid;
      place-items: center;
      width: 34px;
      height: 34px;
      border-radius: 6px;
      background: var(--gold-soft);
      color: var(--gold);
      border: 1px solid rgba(212, 160, 83, 0.15);
      font-weight: 800;
      font-size: 13px;
    }

    .layer-title {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
      align-items: center;
      margin-bottom: 6px;
    }

    .layer-title strong { font-size: 14px; }
    .layer-copy { color: var(--soft); font-size: 13px; line-height: 1.55; }

    .layer-stats {
      display: flex;
      gap: 6px;
      flex-wrap: wrap;
      justify-content: flex-end;
      min-width: 180px;
    }

    .layer-meter {
      height: 6px;
      margin-top: 10px;
      border-radius: 99px;
      overflow: hidden;
      background: var(--code-bg);
      border: 1px solid var(--line);
    }

    .layer-meter-fill {
      height: 100%;
      width: var(--meter-width);
      background: linear-gradient(90deg, #e8c87a, var(--gold));
    }

    .driver, .risk, .file-row {
      border: 1px solid var(--line);
      background: var(--panel);
      border-radius: var(--radius-lg);
      padding: 12px;
    }

    .driver strong, .risk strong { display: block; margin-bottom: 5px; }
    .driver p, .risk p { color: var(--soft); font-size: 13px; line-height: 1.55; }

    .search {
      width: 100%;
      background: var(--panel);
      border: 1px solid var(--line);
      border-radius: var(--radius);
      padding: 10px 12px;
      margin: 0 12px 12px;
      width: calc(100% - 24px);
      font-size: 12px;
      outline: none;
    }

    .search:focus {
      border-color: var(--gold-line);
      box-shadow: 0 0 0 3px var(--gold-soft);
    }

    .file-list {
      display: grid;
      gap: 1px;
      padding: 4px 12px 20px;
    }

    .file-group-title {
      display: flex;
      justify-content: space-between;
      gap: 10px;
      color: var(--muted);
      font-size: 9px;
      font-weight: 800;
      text-transform: uppercase;
      margin: 16px 8px 6px;
      opacity: 0.72;
    }

    .file-row {
      width: 100%;
      text-align: left;
      cursor: pointer;
      color: var(--text);
      display: block;
      padding: 8px 10px;
      margin-bottom: 1px;
      border-radius: var(--radius);
      background: transparent;
      border-color: transparent;
      transition: background-color 0.15s ease, border-color 0.15s ease, color 0.15s ease;
    }

    .file-row:hover {
      background: rgba(255, 255, 255, 0.02);
    }

    .file-row.active {
      border-color: rgba(212, 160, 83, 0.2);
      background: var(--gold-soft);
      color: var(--gold);
    }

    .file-path {
      display: block;
      font-family: var(--font-mono);
      font-size: 11px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .file-meta {
      display: flex;
      gap: 6px;
      flex-wrap: wrap;
      margin-top: 6px;
      color: var(--muted);
      font-size: 10px;
    }

    .pill {
      border: 1px solid var(--line);
      border-radius: 4px;
      padding: 2px 6px;
      background: var(--panel-2);
      font-size: 10px;
      font-weight: 700;
    }

    .add { color: var(--green); }
    .remove { color: var(--red); }
    .risk-high { color: var(--red); }
    .risk-medium { color: var(--gold); }

    .diff-head {
      position: sticky;
      top: 52px;
      z-index: 3;
      display: flex;
      justify-content: space-between;
      gap: 16px;
      align-items: start;
      height: 52px;
      padding: 14px 20px;
      border-bottom: 1px solid var(--line);
      background: #1a1d23;
    }

    .change-jumps {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      margin-left: 6px;
    }

    .change-jump {
      color: var(--gold);
      text-decoration: none;
      border: 1px solid rgba(212, 160, 83, 0.15);
      background: var(--gold-soft);
      border-radius: 4px;
      padding: 3px 7px;
      font-size: 10px;
      font-weight: 700;
    }

    .change-prev,
    .change-next {
      color: var(--gold);
      border: 1px solid rgba(212, 160, 83, 0.15);
      background: var(--gold-soft);
      border-radius: 4px;
      padding: 3px 7px;
      font-size: 10px;
      font-weight: 800;
      cursor: pointer;
    }

    .change-prev:disabled,
    .change-next:disabled {
      cursor: default;
      opacity: 0.45;
    }

    .diff-title-row {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 6px;
    }

    .diff-title-row h2 {
      font-family: var(--font-mono);
      font-size: 12.5px;
    }

    .diff-meta-inline {
      color: var(--muted);
      font-size: 12.5px;
    }

    tr.focused-change .line-code {
      box-shadow: inset 4px 0 0 var(--gold);
    }

    tr.focused-change-start .line-code {
      border-top: 1px solid var(--gold);
    }

    tr.focused-change-end .line-code {
      border-bottom: 1px solid var(--gold);
    }

    tr[id] {
      scroll-margin-top: 112px;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      font-family: var(--font-mono);
      font-size: 12px;
      line-height: 1.4;
      background: var(--code-bg);
    }

    td {
      border-bottom: 0;
      vertical-align: top;
    }

    .line-number {
      width: 44px;
      min-width: 44px;
      max-width: 44px;
      color: #6e7179;
      text-align: right;
      user-select: none;
      padding: 1px 5px;
      background: var(--code-bg);
      border-right: 1px solid var(--line);
      font-size: 10.5px;
    }

    .line-number + .line-number {
      color: #555860;
    }

    .line-code {
      white-space: pre;
      overflow-wrap: normal;
      padding: 1px 16px;
      color: var(--text);
      font-family: var(--font-mono);
      font-size: 12px;
    }

    tr.added { background: var(--green-bg); }
    tr.removed { background: var(--red-bg); }
    tr.added .line-code { border-left: 3px solid #50e8a0; }
    tr.removed .line-code { border-left: 3px solid #f07070; }
    tr.added .prefix { color: var(--green); }
    tr.removed .prefix { color: var(--red); }
    tr.context .line-code { color: #c8c6c3; }
    .prefix {
      display: inline-block;
      width: 16px;
      color: #747b87;
      font-weight: 700;
      user-select: none;
    }

    .token.comment,
    .token.prolog,
    .token.doctype,
    .token.cdata { color: #6e7179; }
    .token.punctuation { color: #c8c6c3; }
    .token.property,
    .token.tag,
    .token.boolean,
    .token.number,
    .token.constant,
    .token.symbol { color: #f08080; }
    .token.selector,
    .token.attr-name,
    .token.string,
    .token.char,
    .token.builtin { color: #5eeaa0; }
    .token.operator,
    .token.entity,
    .token.url,
    .language-css .token.string { color: #e8c87a; }
    .token.atrule,
    .token.attr-value,
    .token.keyword { color: #d4a053; }
    .token.function,
    .token.class-name { color: #60a5fa; }

    .empty {
      color: var(--muted);
      padding: 24px;
    }

    @media (max-width: 960px) {
      .shell { grid-template-columns: 1fr; }
      aside { max-height: none; border-right: 0; border-bottom: 1px solid var(--line); }
      main { max-height: none; }
      .grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      .story-grid { grid-template-columns: 1fr; }
      .chart-wrap { grid-template-columns: 1fr; }
    }

    @media (max-width: 560px) {
      header { align-items: flex-start; flex-direction: column; }
      .grid { grid-template-columns: 1fr; }
      .tabs { overflow-x: auto; }
      .layer-card { grid-template-columns: 1fr; }
      .layer-stats { justify-content: flex-start; }
    }
  </style>
</head>
<body>
  <header>
    <div class="header-title-group">
      <span class="logo">inShop</span>
      <span class="header-divider">|</span>
      <span class="header-subtitle">Local Stack Review</span>
      <span class="badge">Ready for Review</span>
    </div>
    <div>
      <p class="range" id="rangeLabel">Loading diff...</p>
    </div>
    <div class="legend" aria-label="Diff legend">
      <span><span class="dot" style="background: var(--green)"></span>Added</span>
      <span><span class="dot" style="background: var(--red)"></span>Removed</span>
      <span><span class="dot" style="background: var(--gold)"></span>Review risk</span>
    </div>
  </header>

  <div class="shell">
    <aside>
      <div class="sidebar-header">
        <span>Stacked Workflow</span>
        <span class="sidebar-count" id="fileCountBadge">0</span>
      </div>
      <input class="search" id="fileSearch" placeholder="Filter files" aria-label="Filter files">
      <div class="file-list" id="fileList"></div>
    </aside>

    <main>
      <div class="tabs">
        <button class="tab active" data-tab="summary">Summary</button>
        <button class="tab" data-tab="layers">Layers</button>
        <button class="tab" data-tab="why">Why</button>
        <button class="tab" data-tab="risks">Risks</button>
        <button class="tab" data-tab="diff">Diff</button>
      </div>

      <section class="tab-panel active" id="summary">
        <div class="section">
          <div class="grid" id="metrics"></div>
        </div>
        <div class="section">
          <h2>PR Check</h2>
          <p class="range">A fast read of what happened, why it likely happened, and where to review first.</p>
          <div class="story-grid" id="narrative"></div>
        </div>
        <div class="section">
          <h2>Review Stack</h2>
          <p class="range">Read the change by layer first, then open exact file diffs.</p>
          <div class="stack" id="reviewStack"></div>
        </div>
        <div class="section chart-wrap">
          <div>
            <h2>Layer Churn</h2>
            <p class="range">Churn by review layer, stacked by additions and removals.</p>
            <div class="chart" id="chart"></div>
          </div>
          <div class="panel compact">
            <h2>Layer Reach</h2>
            <div class="drivers" id="layerReach"></div>
          </div>
        </div>
      </section>

      <section class="tab-panel" id="layers">
        <div class="section">
          <h2>Layered Review Order</h2>
          <p class="range">This follows a stacked-review rhythm: boundary first, behavior next, UI after intent is clear, tests last as proof.</p>
          <div class="stack" id="layerStack"></div>
        </div>
      </section>

      <section class="tab-panel" id="why">
        <div class="section">
          <h2>Why This Happened</h2>
          <p class="range">This is inferred from paths, file categories, churn, and commit metadata.</p>
          <div class="drivers" id="drivers" style="margin-top: 16px"></div>
        </div>
      </section>

      <section class="tab-panel" id="risks">
        <div class="section">
          <h2>Review Risks</h2>
          <p class="range">Start close reading here, then move to matching tests and exact diff lines.</p>
          <div class="drivers" id="risksList" style="margin-top: 16px"></div>
        </div>
      </section>

      <section class="tab-panel" id="diff">
        <div class="diff-head">
          <div class="diff-title-row">
            <h2 id="diffTitle">Select a file</h2>
            <span class="diff-meta-inline" id="diffMeta"></span>
            <span class="change-jumps" id="changeJumps"></span>
          </div>
        </div>
        <table>
          <tbody id="diffBody"></tbody>
        </table>
      </section>
    </main>
  </div>

  <script>
    let recap = null;
    let selectedPath = null;
    let activeChangeAnchors = [];
    let activeChangeIndex = 0;

    const formatNumber = new Intl.NumberFormat();

    function escapeHtml(value) {
      return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
    }

    function languageForFile(filePath) {
      const ext = String(filePath || "").split(".").pop().toLowerCase();
      if (ext === "tsx") return "tsx";
      if (ext === "jsx") return "jsx";
      if (ext === "ts") return "typescript";
      if (ext === "js" || ext === "mjs" || ext === "cjs") return "javascript";
      if (ext === "json") return "json";
      if (ext === "css") return "css";
      if (ext === "html" || ext === "htm") return "markup";
      return "tsx";
    }

    function highlightLine(text, filePath) {
      const language = languageForFile(filePath);
      if (window.Prism && Prism.languages && Prism.languages[language]) {
        return Prism.highlight(String(text), Prism.languages[language], language);
      }
      return escapeHtml(text);
    }

    function metric(label, value, cls) {
      return '<div class="metric"><div class="label">' + label + '</div><div class="value ' + (cls || "") + '">' + formatNumber.format(value) + '</div></div>';
    }

    function storyCard(label, body, primary) {
      return '<div class="story-card' + (primary ? " primary" : "") + '">' +
        '<div class="story-label">' + escapeHtml(label) + '</div>' +
        (primary ? '<div class="story-headline">' + escapeHtml(body) + '</div>' : '<p class="story-copy">' + escapeHtml(body) + '</p>') +
      '</div>';
    }

    function renderNarrative() {
      const narrative = recap.summary.narrative;
      document.getElementById("narrative").innerHTML = [
        storyCard("Change story", narrative.headline + ". " + narrative.changeStory, true),
        storyCard("Likely driver", narrative.primaryDriver, false),
        storyCard("Risk posture", narrative.riskPosture, false),
        storyCard("Review path", narrative.reviewPath, false),
        storyCard("Verification", narrative.verification, false),
      ].join("");
    }

    function renderMetrics() {
      const summary = recap.summary;
      document.getElementById("metrics").innerHTML = [
        metric("Total Files Changed", summary.totalFiles),
        metric("Insertions", summary.added, "add"),
        metric("Deletions", summary.removed, "remove"),
        metric("Churn", summary.churn),
      ].join("");
    }

    function renderChart() {
      const groups = recap.summary.reviewLayers;
      const max = Math.max(1, ...groups.map((group) => group.churn));
      document.getElementById("chart").innerHTML = groups.map((group) => {
        const height = Math.max(4, Math.round((group.churn / max) * 200));
        const addHeight = group.churn ? Math.max(1, Math.round((group.added / group.churn) * height)) : 0;
        const removeHeight = Math.max(0, height - addHeight);
        return '<div class="bar-group" title="Layer ' + group.index + ': ' + escapeHtml(group.title) + ' +' + group.added + ' -' + group.removed + '">' +
          '<div class="bar-stack" style="--bar-height: ' + height + 'px">' +
            '<div class="bar-add" style="height: ' + addHeight + 'px"></div>' +
            '<div class="bar-remove" style="height: ' + removeHeight + 'px"></div>' +
          '</div>' +
          '<div class="bar-label">L' + group.index + '<br>' + escapeHtml(group.name) + '</div>' +
        '</div>';
      }).join("");
    }

    function layerCard(layer, maxChurn) {
      const riskClass = layer.risk === "High" ? "risk-high" : layer.risk === "Medium" ? "risk-medium" : "";
      const meterWidth = Math.max(4, Math.round((layer.churn / Math.max(1, maxChurn)) * 100));
      return '<div class="layer-card">' +
        '<div class="layer-index">' + layer.index + '</div>' +
        '<div>' +
          '<div class="layer-title"><strong>' + escapeHtml(layer.title) + '</strong><span class="pill ' + riskClass + '">' + layer.risk + ' risk</span></div>' +
          '<p class="layer-copy">' + escapeHtml(layer.intent) + '</p>' +
          '<p class="layer-copy" style="margin-top: 6px">' + escapeHtml(layer.why) + '</p>' +
          '<p class="layer-copy" style="margin-top: 6px"><strong>Review focus:</strong> ' + escapeHtml(layer.focus) + '</p>' +
          '<div class="layer-meter"><div class="layer-meter-fill" style="--meter-width: ' + meterWidth + '%"></div></div>' +
        '</div>' +
        '<div class="layer-stats">' +
          '<span class="pill">' + layer.fileCount + ' file(s)</span>' +
          '<span class="pill add">+' + layer.added + '</span>' +
          '<span class="pill remove">-' + layer.removed + '</span>' +
          '<span class="pill">' + layer.churn + ' churn</span>' +
        '</div>' +
      '</div>';
    }

    function renderReviewStack() {
      const layers = recap.summary.reviewLayers;
      const maxChurn = Math.max(1, ...layers.map((layer) => layer.churn));
      const html = layers.map((layer) => layerCard(layer, maxChurn)).join("");
      document.getElementById("reviewStack").innerHTML = html;
      document.getElementById("layerStack").innerHTML = html;
    }

    function renderLayers() {
      const layers = recap.summary.reviewLayers;
      document.getElementById("layerReach").innerHTML = layers.map((layer) => {
        return '<div class="driver"><strong>Layer ' + layer.index + ': ' + escapeHtml(layer.name) + '</strong><p>' +
          layer.fileCount + ' file(s), +' + layer.added + ' -' + layer.removed + '. ' + escapeHtml(layer.focus) +
          '</p></div>';
      }).join("");
    }

    function renderDrivers() {
      document.getElementById("drivers").innerHTML = recap.summary.drivers.map((driver) => {
        return '<div class="driver"><strong>' + escapeHtml(driver.label) + '</strong><p>' + escapeHtml(driver.why) + '</p></div>';
      }).join("");
    }

    function renderRisks() {
      const risks = recap.summary.risks;
      document.getElementById("risksList").innerHTML = risks.length
        ? risks.map((risk) => {
          const cls = risk.level === "High" ? "risk-high" : "risk-medium";
          return '<div class="risk"><strong class="' + cls + '">' + risk.level + ': ' + escapeHtml(risk.path) + '</strong><p>' + escapeHtml(risk.reason) + ' Churn: ' + risk.churn + '.</p></div>';
        }).join("")
        : '<div class="empty">No elevated review risks detected from path and churn heuristics.</div>';
    }

    function renderFileList() {
      const query = document.getElementById("fileSearch").value.toLowerCase();
      const files = recap.files.filter((file) => file.path.toLowerCase().includes(query));
      document.getElementById("fileList").innerHTML = recap.summary.reviewLayers.map((layer) => {
        const layerFiles = files.filter((file) => file.layer === layer.name);
        if (layerFiles.length === 0) return "";
        return '<div class="file-group-title"><span>Layer ' + layer.index + ': ' + escapeHtml(layer.name) + '</span><span>' + layerFiles.length + '</span></div>' +
          layerFiles.map((file) => {
            const active = file.path === selectedPath ? " active" : "";
            return '<button class="file-row' + active + '" data-path="' + escapeHtml(file.path) + '">' +
              '<span class="file-path">' + escapeHtml(file.path) + '</span>' +
              '<span class="file-meta">' +
                '<span class="pill">' + escapeHtml(file.statusLabel) + '</span>' +
                '<span class="pill">' + escapeHtml(file.tag) + '</span>' +
                '<span class="pill add">+' + file.added + '</span>' +
                '<span class="pill remove">-' + file.removed + '</span>' +
              '</span>' +
            '</button>';
          }).join("");
      }).join("");
    }

    function getChangeAnchors(file, fileIndex) {
      const anchors = [];
      let inChange = false;
      file.diff.forEach((line, index) => {
        const changed = line.type === "added" || line.type === "removed";
        if (changed && !inChange) {
          const lineNumber = line.lineNew || line.lineOld || index + 1;
          anchors.push({ id: "change-" + fileIndex + "-" + index, index, number: anchors.length + 1, lineNumber });
        }
        inChange = changed;
      });
      return anchors;
    }

    function renderChangeJumps() {
      const anchor = activeChangeAnchors[activeChangeIndex];
      const label = anchor ? "Change " + anchor.number + "/" + activeChangeAnchors.length + " L" + anchor.lineNumber : "";
      document.getElementById("changeJumps").innerHTML = anchor
        ? '<a class="change-jump" href="#' + anchor.id + '" data-target="' + anchor.id + '">(' + escapeHtml(label) + ')</a>' +
          '<button class="change-prev" type="button" data-prev-change="true"' + (activeChangeAnchors.length < 2 ? " disabled" : "") + '>&#8593;</button>' +
          '<button class="change-next" type="button" data-next-change="true"' + (activeChangeAnchors.length < 2 ? " disabled" : "") + '>&#8595;</button>'
        : '<span class="range">No changed hunks</span>';
    }

    function scrollToChange(id) {
      const target = document.getElementById(id);
      if (!target) return;
      const index = activeChangeAnchors.findIndex((anchor) => anchor.id === id);
      if (index !== -1) {
        activeChangeIndex = index;
        renderChangeJumps();
      }
      document.querySelectorAll(".focused-change, .focused-change-start, .focused-change-end").forEach((row) => {
        row.classList.remove("focused-change", "focused-change-start", "focused-change-end");
      });
      let row = target;
      let first = true;
      while (row && (row.classList.contains("added") || row.classList.contains("removed"))) {
        row.classList.add("focused-change");
        if (first) {
          row.classList.add("focused-change-start");
          first = false;
        }
        const next = row.nextElementSibling;
        if (!next || (!next.classList.contains("added") && !next.classList.contains("removed"))) {
          row.classList.add("focused-change-end");
          break;
        }
        row = next;
      }
      target.scrollIntoView({ block: "start", behavior: "smooth" });
    }

    function jumpToNextChange() {
      if (activeChangeAnchors.length === 0) return;
      activeChangeIndex = (activeChangeIndex + 1) % activeChangeAnchors.length;
      const anchor = activeChangeAnchors[activeChangeIndex];
      window.history.pushState(null, "", "#" + anchor.id);
      scrollToChange(anchor.id);
    }

    function jumpToPreviousChange() {
      if (activeChangeAnchors.length === 0) return;
      activeChangeIndex = (activeChangeIndex - 1 + activeChangeAnchors.length) % activeChangeAnchors.length;
      const anchor = activeChangeAnchors[activeChangeIndex];
      window.history.pushState(null, "", "#" + anchor.id);
      scrollToChange(anchor.id);
    }

    function selectFile(path, options = {}) {
      const previousPath = selectedPath;
      selectedPath = path;
      const file = recap.files.find((item) => item.path === path);
      if (!file) return;
      const fileIndex = recap.files.findIndex((item) => item.path === path);
      document.getElementById("diffTitle").textContent = file.path;
      document.getElementById("diffMeta").textContent = file.statusLabel + " | " + file.layer + " | " + file.tag + " | +" + file.added + " -" + file.removed;
      const anchors = getChangeAnchors(file, fileIndex);
      activeChangeAnchors = anchors;
      activeChangeIndex = Math.max(0, anchors.findIndex((anchor) => anchor.id === options.targetId));
      const anchorByIndex = new Map(anchors.map((anchor) => [anchor.index, anchor.id]));
      renderChangeJumps();
      document.getElementById("diffBody").innerHTML = file.diff.map((line, index) => {
        const cls = line.type === "added" ? "added" : line.type === "removed" ? "removed" : "context";
        const prefix = line.type === "added" ? "+" : line.type === "removed" ? "-" : " ";
        const highlighted = highlightLine(line.text, file.path);
        const anchorId = anchorByIndex.get(index);
        return '<tr class="' + cls + '"' + (anchorId ? ' id="' + anchorId + '"' : "") + '>' +
          '<td class="line-number">' + (line.lineOld || "") + '</td>' +
          '<td class="line-number">' + (line.lineNew || "") + '</td>' +
          '<td class="line-code"><span class="prefix">' + prefix + '</span>' + highlighted + '</td>' +
        '</tr>';
      }).join("");
      renderFileList();
      showTab("diff");
      if (options.resetScroll !== false && previousPath && previousPath !== path) {
        document.querySelector("main").scrollTo({ top: 0, behavior: "smooth" });
      }
      if (options.targetId) {
        scrollToChange(options.targetId);
      }
    }

    function showTab(name) {
      document.querySelectorAll(".tab").forEach((button) => button.classList.toggle("active", button.dataset.tab === name));
      document.querySelectorAll(".tab-panel").forEach((panel) => panel.classList.toggle("active", panel.id === name));
    }

    function openHashTarget() {
      const match = window.location.hash.match(/^#change-(\d+)-(\d+)$/);
      if (!match || !recap) return false;
      const file = recap.files[Number(match[1])];
      if (!file) return false;
      selectFile(file.path, { resetScroll: false, targetId: window.location.hash.slice(1) });
      return true;
    }

    async function boot() {
      const response = await fetch("diff-data.json", { cache: "no-store" });
      recap = await response.json();
      document.getElementById("rangeLabel").textContent = recap.meta.range + " | " + recap.meta.subject + " | " + new Date(recap.meta.generatedAt).toLocaleString();
      document.getElementById("fileCountBadge").textContent = recap.summary.totalFiles;
      renderNarrative();
      renderMetrics();
      renderChart();
      renderReviewStack();
      renderLayers();
      renderDrivers();
      renderRisks();
      renderFileList();
      if (!openHashTarget()) {
        if (recap.files[0]) selectFile(recap.files[0].path);
        showTab("summary");
      }
    }

    document.addEventListener("click", (event) => {
      const prevChange = event.target.closest(".change-prev");
      if (prevChange) {
        event.preventDefault();
        jumpToPreviousChange();
        return;
      }
      const nextChange = event.target.closest(".change-next");
      if (nextChange) {
        event.preventDefault();
        jumpToNextChange();
        return;
      }
      const changeJump = event.target.closest(".change-jump");
      if (changeJump) {
        event.preventDefault();
        const targetId = changeJump.dataset.target;
        window.history.pushState(null, "", "#" + targetId);
        scrollToChange(targetId);
        return;
      }
      const tab = event.target.closest(".tab");
      if (tab) showTab(tab.dataset.tab);
      const fileButton = event.target.closest(".file-row");
      if (fileButton) selectFile(fileButton.dataset.path);
    });

    window.addEventListener("hashchange", openHashTarget);

    document.getElementById("fileSearch").addEventListener("input", renderFileList);

    boot().catch((error) => {
      document.body.innerHTML = '<div class="empty">Failed to load detail recap: ' + escapeHtml(error.message) + '</div>';
    });
  </script>
</body>
</html>`;
}

async function main() {
  let options;
  try {
    options = parseArgs(args);
  } catch (error) {
    console.error(error.message);
    console.error(usage());
    process.exit(1);
  }

  if (options.range === "--help" || options.range === "-h") {
    console.log(usage());
    return;
  }

  const repoRoot = getRepoRoot();
  const rangeInfo = parseRange(options.range, repoRoot);
  const data = buildData(repoRoot, rangeInfo);
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "detail-recap-"));
  writeArtifacts(tempDir, data);

  console.log(`Detail recap generated for ${data.meta.range}`);
  console.log(`Files: ${data.summary.totalFiles} | Added: +${data.summary.added} | Removed: -${data.summary.removed} | Churn: ${data.summary.churn}`);
  console.log(`Temp directory: ${tempDir}`);

  if (options.dryRun) {
    cleanup(tempDir, options.keep);
    return;
  }

  const server = createServer(tempDir);

  const stop = () => {
    server.close(() => {
      cleanup(tempDir, options.keep);
      console.log(options.keep ? `Kept temp directory: ${tempDir}` : "Temp files removed.");
      process.exit(0);
    });
  };

  process.on("SIGINT", stop);
  process.on("SIGTERM", stop);
  process.on("uncaughtException", (error) => {
    console.error(error);
    cleanup(tempDir, options.keep);
    process.exit(1);
  });

  server.listen(options.port, "127.0.0.1", () => {
    const address = server.address();
    const url = `http://127.0.0.1:${address.port}/detail-recap.html`;
    console.log(`Review URL: ${url}`);
    console.log("Press Enter to stop the server and delete temp files.");
    if (!options.noOpen) {
      openBrowser(url);
    }

    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.on("line", stop);
  });
}

main().catch((error) => {
  console.error(error.message);
  console.error(usage());
  process.exit(1);
});
