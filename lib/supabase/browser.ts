import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient<any> | null = null;

export function supabaseBrowser(): SupabaseClient<any> {
  if (!client) {
    client = createClient<any>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }
  return client!;
}
