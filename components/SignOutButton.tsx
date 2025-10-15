"use client";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/browser";

export default function SignOutButton() {
  const router = useRouter();
  async function signOut() {
    const sb = supabaseBrowser();
    await sb.auth.signOut();
    router.push("/auth/sign-in");
  }
  return (
    <button className="btn-ghost" onClick={signOut} aria-label="Cerrar sesión">
      Salir
    </button>
  );
}
