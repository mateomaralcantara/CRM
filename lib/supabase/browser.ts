"use client";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

export function supabaseBrowser() {
  // Tipado se infiere correctamente desde el helper
  return createClientComponentClient();
}
