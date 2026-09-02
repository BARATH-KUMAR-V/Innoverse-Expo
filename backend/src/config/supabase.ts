import { createClient } from "@supabase/supabase-js";
import { env } from "./env";

// Server-side client using the SERVICE ROLE key. This key bypasses Row Level
// Security and must NEVER be sent to the browser or committed to git - it
// only ever lives in this backend's environment variables.
export const supabaseAdmin = createClient(env.supabaseUrl, env.supabaseServiceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});
