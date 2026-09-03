import { createClient } from "@supabase/supabase-js";

// The anon public key is safe to expose in the browser by design - it can
// only do what Storage's access rules and a specific signed-upload token
// allow. It's used purely to call `uploadToSignedUrl`, the SDK method for
// consuming a signed upload URL issued server-side by
// /api/admin/uploads/sign (which uses the secret service-role key).
export const supabaseBrowser = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
);
