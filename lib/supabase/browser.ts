// usa cookies compatibles con el middleware
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

let client: ReturnType<typeof createClientComponentClient> | null = null;

export function supabaseBrowser() {
  if (!client) client = createClientComponentClient();
  return client;
}
