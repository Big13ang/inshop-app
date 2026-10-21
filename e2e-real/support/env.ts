/** Where the suite finds the stack. Defaults match e2e-real/stack/docker-compose.e2e.yml. */
export const E2E_ENV = {
  baseUrl: process.env.E2E_BASE_URL ?? 'http://localhost:4100',
  apiUrl: process.env.E2E_API_URL ?? 'http://localhost:8100',
  databaseUrl:
    process.env.E2E_DATABASE_URL ?? 'postgres://postgres:e2e-postgres-password@localhost:5435/inshop_e2e',
};
