"use client";

import { useState, type FormEvent, type ChangeEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/browser";

export default function SignInClient() {
  const sp = useSearchParams();
  const next = sp?.get("next") || "/";
  const router = useRouter();

  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setMsg(null);
    const sb = supabaseBrowser();

    const { error } =
      mode === "signin"
        ? await sb.auth.signInWithPassword({ email, password })
        : await sb.auth.signUp({ email, password });

    setLoading(false);
    if (error) return setMsg(error.message);
    router.push(next);
  }

  async function resetPass() {
    const sb = supabaseBrowser();
    const { error } = await sb.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/update-password`,
    });
    setMsg(error ? error.message : "Revisa tu email para resetear la clave.");
  }

  return (
    <div className="container" style={{ maxInlineSize: 420, marginBlockStart: 64 }}>
      <div className="card" style={{ padding: 20 }}>
        <h2 style={{ marginBlockStart: 0 }}>{mode === "signin" ? "Inicia sesión" : "Crea tu cuenta"}</h2>

        <form onSubmit={onSubmit} className="grid" style={{ gap: 12 }}>
          <div>
            <label htmlFor="email">Email</label>
            <input
              id="email" type="email" required value={email}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setEmail(e.currentTarget.value)}
              placeholder="tucorreo@dominio.com" autoComplete="email" aria-invalid={false}
            />
          </div>

          <div>
            <label htmlFor="password">Clave</label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 8 }}>
              <input
                id="password" type={showPass ? "text" : "password"} required value={password}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setPassword(e.currentTarget.value)}
                placeholder="********"
                autoComplete={mode === "signin" ? "current-password" : "new-password"}
                aria-invalid={false}
              />
              <button type="button" className="btn-ghost" onClick={() => setShowPass(v => !v)}>
                {showPass ? "Ocultar" : "Ver"}
              </button>
            </div>
          </div>

        {msg && <div className="empty" style={{ textAlign: "start", color: "#fca5a5" }}>{msg}</div>}

          <div className="flex" style={{ justifyContent: "space-between" }}>
            <button disabled={loading}>{loading ? "Procesando..." : mode === "signin" ? "Entrar" : "Crear cuenta"}</button>
            <button type="button" className="btn-ghost" onClick={() => setMode(m => (m === "signin" ? "signup" : "signin"))}>
              {mode === "signin" ? "Crear cuenta" : "Ya tengo cuenta"}
            </button>
          </div>
        </form>

        <div className="flex" style={{ justifyContent: "space-between", marginBlockStart: 12 }}>
          <small>¿Olvidaste la clave?</small>
          <button type="button" className="btn-secondary" onClick={resetPass}>Resetear clave</button>
        </div>
      </div>
    </div>
  );
}
