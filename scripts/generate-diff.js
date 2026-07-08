#!/usr/bin/env node
/**
 * generate-diff.js
 * Generates diff-data.json with FULL file content for every changed file.
 * Every line of the file is included - context, added, and removed.
 *
 * Usage:
 *   node scripts/generate-diff.js <from>..<to>
 *   node scripts/generate-diff.js HEAD~3..HEAD
 *   node scripts/generate-diff.js main..feature-branch
 *
 * Output: public/diff-data.json
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const range = process.argv[2];
if (!range) {
  console.error('Usage: node scripts/generate-diff.js <from>..<to>');
  console.error('Example: node scripts/generate-diff.js HEAD~3..HEAD');
  process.exit(1);
}

const [from, to] = range.split('..');
if (!from || !to) {
  console.error('Invalid range format. Use: <from>..<to>');
  process.exit(1);
}

function git(cmd) {
  return execSync(`git ${cmd}`, { encoding: 'utf-8', cwd: path.resolve(__dirname, '..') }).trim();
}

function gitShow(ref, filePath) {
  try {
    return execSync(`git show "${ref}:${filePath}"`, { encoding: 'utf-8', cwd: path.resolve(__dirname, '..') });
  } catch (e) {
    return null;
  }
}

function classifyFile(filePath) {
  if (filePath.includes('.test.') || filePath.includes('.spec.') || filePath.includes('__tests__') || filePath.includes('e2e/')) {
    return 'Test';
  }
  if (filePath.endsWith('.json') || filePath.endsWith('.yml') || filePath.endsWith('.yaml') || filePath.endsWith('.config.') || filePath.includes('tsconfig')) {
    return 'Config';
  }
  return 'Logic';
}

function getLayer(filePath) {
  if (filePath.startsWith('proxy') || filePath.includes('middleware') || filePath.includes('tsconfig') || filePath.includes('.env')) return 1;
  if (filePath.includes('hooks/') || filePath.includes('lib/') || filePath.includes('utils/')) return 2;
  if (filePath.includes('components/') || filePath.includes('features/')) return 3;
  if (filePath.startsWith('app/') && !filePath.includes('test') && !filePath.includes('spec')) return 4;
  return 5;
}

// Get the list of changed files with status
const nameStatus = git(`diff ${from}..${to} --name-status`);

const fileStatuses = {};
for (const line of nameStatus.split('\n')) {
  if (!line.trim()) continue;
  const parts = line.split('\t');
  const status = parts[0].charAt(0);
  const filePath = parts[parts.length - 1];
  fileStatuses[filePath] = status;
}

/**
 * Diff two string arrays line-by-line and return structured diff lines.
 * Uses LCS (Longest Common Subsequence) for proper diffing.
 */
function diffLines(oldLines, newLines) {
  const m = oldLines.length;
  const n = newLines.length;

  // Build LCS table
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (oldLines[i - 1] === newLines[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  // Backtrack to build diff
  const result = [];
  let i = m, j = n;
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && oldLines[i - 1] === newLines[j - 1]) {
      result.unshift({
        type: 'context',
        lineNew: j,
        lineOld: i,
        text: oldLines[i - 1],
      });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      result.unshift({
        type: 'added',
        lineNew: j,
        lineOld: null,
        text: newLines[j - 1],
      });
      j--;
    } else {
      result.unshift({
        type: 'removed',
        lineNew: null,
        lineOld: i,
        text: oldLines[i - 1],
      });
      i--;
    }
  }

  return result;
}

// Process each changed file
const files = [];

for (const [filePath, status] of Object.entries(fileStatuses)) {
  const oldContent = gitShow(from, filePath);
  const newContent = gitShow(to, filePath);

  let diff;

  if (status === 'A' || oldContent === null) {
    // New file - all lines are additions
    const lines = (newContent || '').split('\n');
    diff = lines.map((text, idx) => ({
      type: 'added',
      lineNew: idx + 1,
      lineOld: null,
      text,
    }));
  } else if (status === 'D' || newContent === null) {
    // Deleted file - all lines are removals
    const lines = (oldContent || '').split('\n');
    diff = lines.map((text, idx) => ({
      type: 'removed',
      lineNew: null,
      lineOld: idx + 1,
      text,
    }));
  } else {
    // Modified file - full diff
    const oldLines = oldContent.split('\n');
    const newLines = newContent.split('\n');
    diff = diffLines(oldLines, newLines);
  }

  if (diff.length === 0) continue;

  files.push({
    path: filePath,
    layer: getLayer(filePath),
    tag: classifyFile(filePath),
    status,
    diff,
  });
}

// Sort by layer then by path
files.sort((a, b) => a.layer - b.layer || a.path.localeCompare(b.path));

// Generate summary stats
const totalAdded = files.reduce((sum, f) => sum + f.diff.filter(d => d.type === 'added').length, 0);
const totalRemoved = files.reduce((sum, f) => sum + f.diff.filter(d => d.type === 'removed').length, 0);
const totalContext = files.reduce((sum, f) => sum + f.diff.filter(d => d.type === 'context').length, 0);
const totalFiles = files.length;

// Get commit info
let commitMessage = '';
let commitHash = '';
try {
  commitHash = git(`rev-parse --short ${to}`);
  commitMessage = git(`log -1 --pretty=format:"%s" ${to}`);
} catch (e) {
  // ignore
}

const data = {
  meta: {
    from,
    to,
    commitHash,
    commitMessage,
    totalFiles,
    totalAdded,
    totalRemoved,
    totalContext,
    generatedAt: new Date().toISOString(),
  },
  files,
};

const outPath = path.resolve(__dirname, '..', 'public', 'diff-data.json');
fs.writeFileSync(outPath, JSON.stringify(data, null, 2), 'utf-8');
console.log(`Generated ${outPath}`);
console.log(`  Files: ${totalFiles} | Added: +${totalAdded} | Removed: -${totalRemoved} | Context: ${totalContext}`);
console.log(`  Commit: ${commitHash} - ${commitMessage}`);

// Show per-file breakdown
files.forEach(f => {
  const add = f.diff.filter(d => d.type === 'added').length;
  const rem = f.diff.filter(d => d.type === 'removed').length;
  const ctx = f.diff.filter(d => d.type === 'context').length;
  console.log(`  ${f.path.padEnd(55)} +${String(add).padStart(3)} -${String(rem).padStart(3)}  ctx:${String(ctx).padStart(4)}`);
});
