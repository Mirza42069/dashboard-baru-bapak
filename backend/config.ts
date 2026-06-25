// Backend config. App connects as app_rls (NOT the superuser) so RLS engages.
export const config = {
  DATABASE_URL: process.env.DATABASE_URL ?? 'postgresql://app_rls:app@localhost:5432/app',
  JWT_SECRET: process.env.JWT_SECRET ?? 'dev-insecure-secret-change-me',
  PORT: Number(process.env.PORT ?? 3001),
  COOKIE_SECURE: process.env.COOKIE_SECURE
    ? process.env.COOKIE_SECURE === 'true'
    : process.env.NODE_ENV === 'production',
  ACCESS_TTL_S: Number(process.env.ACCESS_TTL_S ?? 900),
  REFRESH_TTL_S: Number(process.env.REFRESH_TTL_S ?? 60 * 60 * 24 * 30),
}
