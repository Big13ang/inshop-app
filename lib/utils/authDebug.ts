type AuthDebugScope = 'auth-client' | 'auth-flow' | 'http' | 'profile' | 'proxy' | 'user-context';

type DebugDetails = Record<string, unknown>;

const SENSITIVE_KEY_PATTERN = /cookie|token|authorization|password|otp|code|phone/i;

export function isAuthDebugEnabled() {
  return process.env.NEXT_PUBLIC_DEBUG_AUTH === 'true' || process.env.DEBUG_AUTH === 'true';
}

function maskString(value: string) {
  if (!value) return value;
  if (value.length <= 8) return '[masked]';
  return `${value.slice(0, 4)}...[masked:${value.length}]`;
}

function sanitizeValue(key: string, value: unknown): unknown {
  if (SENSITIVE_KEY_PATTERN.test(key)) {
    return typeof value === 'string' ? maskString(value) : '[masked]';
  }

  if (Array.isArray(value)) {
    return value.map((item) => sanitizeValue(key, item));
  }

  if (value && typeof value === 'object') {
    return sanitizeDetails(value as DebugDetails);
  }

  return value;
}

function sanitizeEntry(entry: [string, unknown]) {
  const [key, value] = entry;
  return [key, sanitizeValue(key, value)] as const;
}

function sanitizeDetails(details: DebugDetails) {
  return Object.fromEntries(Object.entries(details).map(sanitizeEntry));
}

export function debugAuth(scope: AuthDebugScope, event: string, details?: DebugDetails) {
  if (!isAuthDebugEnabled()) return;

  const timestamp = new Date().toISOString();
  const payload = details ? sanitizeDetails(details) : undefined;
  console.debug(`[auth-debug:${scope}] ${event}`, {
    timestamp,
    ...payload,
  });
}
