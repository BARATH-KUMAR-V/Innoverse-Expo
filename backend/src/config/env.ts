import "dotenv/config";

function required(name: string): string {
  const value = process.env[name];
  if (!value || value.trim() === "") {
    // Fail fast and loud at boot rather than deep inside a request handler.
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function optional(name: string, fallback = ""): string {
  const value = process.env[name];
  return value === undefined || value === "" ? fallback : value;
}

export const env = {
  nodeEnv: optional("NODE_ENV", "development"),
  isProduction: optional("NODE_ENV", "development") === "production",
  port: parseInt(optional("PORT", "4000"), 10),

  frontendUrl: required("FRONTEND_URL").replace(/\/$/, ""),

  databaseUrl: required("DATABASE_URL"),

  sessionSecret: required("SESSION_SECRET"),

  googleClientId: required("GOOGLE_CLIENT_ID"),
  googleClientSecret: required("GOOGLE_CLIENT_SECRET"),
  googleCallbackUrl: required("GOOGLE_CALLBACK_URL"),

  allowedEmailDomain: optional("ALLOWED_EMAIL_DOMAIN", "nec.edu.in").toLowerCase(),
  adminEmails: optional("ADMIN_EMAILS")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean),

  supabaseUrl: required("SUPABASE_URL"),
  supabaseServiceRoleKey: required("SUPABASE_SERVICE_ROLE_KEY"),
  supabaseImageBucket: optional("SUPABASE_IMAGE_BUCKET", "product-images"),
  supabaseVideoBucket: optional("SUPABASE_VIDEO_BUCKET", "product-videos"),

  votingAutoCloseAt: optional("VOTING_AUTO_CLOSE_AT"),
};

export function isAdminEmail(email: string | undefined | null): boolean {
  if (!email) return false;
  return env.adminEmails.includes(email.toLowerCase());
}
