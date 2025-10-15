// lib/supabase/browser.ts
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

// Deja que TS infiera el tipo exacto del client (evita choques de genéricos)
let client: ReturnType<typeof createClient<Database>> | null = null;

export function supabaseBrowser() {
  if (!client) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    if (!url || !key) {
      if (process.env.NODE_ENV !== "production") {
        throw new Error("Faltan NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_ANON_KEY");
      }
    }
    client = createClient<Database>(url, key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
  }
  return client;
}
