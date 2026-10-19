import { Client } from 'pg';
import { E2E_ENV } from './env';

/** OTP flows as named by the backend's otp-policy.store.ts */
export type OtpFlow = 'sign-up' | 'password-reset' | 'legacy-sign-in' | 'phone-change';

const OTP_WAIT_MS = 10_000;

async function query<Row>(sql: string, params: unknown[]): Promise<Row[]> {
  const client = new Client({ connectionString: E2E_ENV.databaseUrl });
  await client.connect();
  const result = await client.query(sql, params).finally(() => client.end());
  return result.rows as Row[];
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
  const deadline = Date.now() + OTP_WAIT_MS;
  while (Date.now() < deadline) {
    const rows = await query<{ value: string }>(
      'SELECT "value" FROM "verification" WHERE "identifier" = $1 ORDER BY "createdAt" DESC LIMIT 1',
      [identifier]
    );
    const code = rows[0] ? parseOtpCode(rows[0].value) : null;
    if (code) return code;
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(`No ${flow} OTP issued for ${phoneNumber} within ${OTP_WAIT_MS / 1000}s`);
}
