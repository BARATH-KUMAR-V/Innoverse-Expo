import { createClient } from "@supabase/supabase-js";
import { env } from "./env";

// Server-side client using the SERVICE ROLE key. This key bypasses Row Level
// Security and must NEVER be sent to the browser or committed to git - it
// only ever lives in this app's server-side environment variables (no
// NEXT_PUBLIC_ prefix keeps it out of the client bundle).
export const supabaseAdmin = createClient(env.supabaseUrl, env.supabaseServiceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});
