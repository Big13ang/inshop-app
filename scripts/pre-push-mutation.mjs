import { execSync } from 'node:child_process';

/**
 * Runs Stryker mutation testing ONLY on component/feature files modified in this push.
 */
function getChangedFiles() {
  try {
    // 1. Try to find files changed against upstream tracking branch
    const upstreamDiff = execSync('git diff --name-only @{u}..HEAD 2>/dev/null', {
      encoding: 'utf-8',
    }).trim();
    if (upstreamDiff) {
      return upstreamDiff.split('\n');
    }
  } catch {
    // Fallback if no upstream branch is configured
  }

  try {
    // 2. Try against origin/master or master
    const masterDiff = execSync('git diff --name-only master..HEAD 2>/dev/null', {
      encoding: 'utf-8',
    }).trim();
    if (masterDiff) {
      return masterDiff.split('\n');
    }
  } catch {
    // Fallback
  }

  try {
    // 3. Fallback to staged/committed in HEAD
    const headDiff = execSync('git diff --name-only HEAD~1..HEAD 2>/dev/null', {
      encoding: 'utf-8',
    }).trim();
    if (headDiff) {
      return headDiff.split('\n');
    }
  } catch {
    return [];
  }

  return [];
}

const changed = getChangedFiles();

// Filter for target feature/component source files (excluding tests, drivers, fixtures, configs, types)
const filesToMutate = changed.filter((file) => {
  return (
    (file.startsWith('features/') || file.startsWith('components/') || file.startsWith('lib/')) &&
    (file.endsWith('.ts') || file.endsWith('.tsx')) &&
    !file.includes('__tests__') &&
    !file.includes('testing/') &&
    !file.includes('fixtures/') &&
    !file.includes('__mocks__') &&
    !file.includes('.test.') &&
    !file.includes('.spec.') &&
    !file.endsWith('.d.ts')
  );
});

if (filesToMutate.length === 0) {
  console.log('ℹ️  No changed source component files requiring mutation testing. Skipping.');
  process.exit(0);
}

const mutatePattern = filesToMutate.join(',');
console.log(`🔍 Running scoped mutation test on ${filesToMutate.length} changed file(s):\n${filesToMutate.map(f => `  - ${f}`).join('\n')}\n`);

try {
  execSync(`npx stryker run --mutate "${mutatePattern}"`, {
    stdio: 'inherit',
  });
} catch {
  console.error('❌ Mutation testing failed. Some mutants survived.');
  process.exit(1);
}
