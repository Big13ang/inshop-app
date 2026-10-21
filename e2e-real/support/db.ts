import { Client } from 'pg';
import { E2E_ENV } from './env';

/** OTP flows as named by the backend's otp-policy.store.ts */
export type OtpFlow = 'sign-up' | 'password-reset' | 'legacy-sign-in' | 'phone-change';

const OTP_WAIT_MS = 10_000;
// Background jobs retry with backoff, so give them longer than an OTP
const QUEUE_WAIT_MS = 20_000;

async function query<Row>(sql: string, params: unknown[]): Promise<Row[]> {
  const client = new Client({ connectionString: E2E_ENV.databaseUrl });
  await client.connect();
  const result = await client.query(sql, params).finally(() => client.end());
  return result.rows as Row[];
}

/** Calls `read` until it returns a value, or throws `timeoutMessage` after `waitMs` */
async function pollUntil<T>(read: () => Promise<T | null>, waitMs: number, timeoutMessage: string): Promise<T> {
  const deadline = Date.now() + waitMs;
  while (Date.now() < deadline) {
    const value = await read();
    if (value !== null) return value;
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(timeoutMessage);
}

// The backend stores "code:attempts", or "verified:lease:code:attempts" once used
function parseOtpCode(value: string): string | null {
  const [first, , code] = value.split(':');
  if (/^\d+$/.test(first)) return first;
  return first === 'verified' && code ? code : null;
}

/**
 * Reads the latest OTP the backend issued for this phone. With
 * SMS_TRANSPORT=capture nothing is texted; the verification table is the only copy.
 */
export async function readOtp(flow: OtpFlow, phoneNumber: string): Promise<string> {
  const identifier = `inshop:otp:${flow}:${phoneNumber}`;
  const readCode = async () => {
    const rows = await query<{ value: string }>(
      'SELECT "value" FROM "verification" WHERE "identifier" = $1 ORDER BY "createdAt" DESC LIMIT 1',
      [identifier]
    );
    return rows[0] ? parseOtpCode(rows[0].value) : null;
  };
  return pollUntil(readCode, OTP_WAIT_MS, `No ${flow} OTP issued for ${phoneNumber} within ${OTP_WAIT_MS / 1000}s`);
}

/**
 * Waits until the backend's queue has stored the seller application for this
 * phone. Until then the backend neither rejects a second application nor
 * makes a new account with this phone a seller.
 */
export async function waitForSellerApplication(phoneNumber: string): Promise<void> {
  const readApplication = async () => {
    const rows = await query<{ id: number }>('SELECT "id" FROM "pre_registrations" WHERE "phone_number" = $1', [
      phoneNumber,
    ]);
    return rows[0] ?? null;
  };
  await pollUntil(
    readApplication,
    QUEUE_WAIT_MS,
    `No seller application stored for ${phoneNumber} within ${QUEUE_WAIT_MS / 1000}s`
  );
}
