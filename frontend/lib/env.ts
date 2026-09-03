function required(name: string): string {
  const value = process.env[name];
  if (!value || value.trim() === "") {
    // Fail fast and loud the first time a route handler touches this,
    // rather than deep inside a query with a confusing downstream error.
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function optional(name: string, fallback = ""): string {
  const value = process.env[name];
  return value === undefined || value === "" ? fallback : value;
}

export const env = {
  isProduction: process.env.NODE_ENV === "production",

  databaseUrl: required("DATABASE_URL"),

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
};

export function isAdminEmail(email: string | undefined | null): boolean {
  if (!email) return false;
  return env.adminEmails.includes(email.toLowerCase());
}
