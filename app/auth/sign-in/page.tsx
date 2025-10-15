"use client";
import * as React from "react";
import { useMemo, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/browser";

export default function SignInPage() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const router = useRouter();
  const sp = useSearchParams();

  const next = useMemo(() => sp.get("next") ?? "/", [sp]);
  const isEmailValid = /\S+@\S+\.\S+/.test(email);
  const isPwdValid = password.length >= 6;
  const canSubmit = !loading && isEmailValid && isPwdValid;

  const onSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      if (!canSubmit) return;

      setLoading(true);
      setMsg(null);
      const sb = supabaseBrowser();

      let error: { message: string } | null = null;

      if (mode === "signin") {
        const { error: err } = await sb.auth.signInWithPassword({ email, password });
        error = err;
      } else {
        const { data, error: err } = await sb.auth.signUp({ email, password });
        error = err;
        if (!err && !data.session) {
          setLoading(false);
          setMsg("Te enviamos un email de verificación. Revisa tu bandeja 📬");
          return;
        }
      }

      setLoading(false);

      if (error) {
        setMsg(error.message);
        return;
      }
      router.push(next);
    },
    [canSubmit, email, password, mode, next, router]
  );

  const resetPass = useCallback(async () => {
    if (!isEmailValid) {
      setMsg("Pon un email válido para enviar el reset 🔐");
      return;
    }
    const sb = supabaseBrowser();
    const { error } = await sb.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + "/auth/update-password",
    });
    setMsg(error ? error.message : "Listo. Revisa tu email para resetear la clave.");
  }, [email, isEmailValid]);

  return (
    <div className="container" style={{ maxInlineSize: 420, marginBlockStart: 64 }}>
      <div className="card" style={{ padding: 20 }}>
        <h2 style={{ marginBlockStart: 0 }}>
          {mode === "signin" ? "Inicia sesión" : "Crea tu cuenta"}
        </h2>

        <form onSubmit={onSubmit} className="grid" style={{ gap: 12 }} noValidate>
          <div>
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.currentTarget.value)}
              placeholder="tucorreo@dominio.com"
              autoComplete="email"
              aria-invalid={email.length > 0 ? !isEmailValid : undefined}
            />
          </div>

          <div>
            <label htmlFor="password">Clave</label>
            <div className="flex" style={{ alignItems: "stretch" }}>
              <input
                id="password"
                type={showPass ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.currentTarget.value)}
                placeholder="********"
                autoComplete={mode === "signin" ? "current-password" : "new-password"}
                aria-invalid={password.length > 0 ? !isPwdValid : undefined}
              />
              <button
                type="button"
                className="btn-ghost"
                onClick={() => setShowPass((s) => !s)}
                aria-pressed={showPass}
                title={showPass ? "Ocultar clave" : "Mostrar clave"}
              >
                {showPass ? "Ocultar" : "Mostrar"}
              </button>
            </div>
            {!isPwdValid && password.length > 0 && (
              <small>La clave debe tener al menos 6 caracteres.</small>
            )}
          </div>

          {msg && (
            <div className="empty" style={{ textAlign: "start", color: "#fca5a5" }}>
              {msg}
            </div>
          )}

          <div className="flex" style={{ justifyContent: "space-between" }}>
            <button disabled={!canSubmit}>
              {loading ? "Procesando..." : mode === "signin" ? "Entrar" : "Crear cuenta"}
            </button>
            <button
              type="button"
              className="btn-ghost"
              onClick={() => {
                setMode((m) => (m === "signin" ? "signup" : "signin"));
                setMsg(null);
              }}
            >
              {mode === "signin" ? "Crear cuenta" : "Ya tengo cuenta"}
            </button>
          </div>
        </form>

        <div className="flex" style={{ justifyContent: "space-between", marginBlockStart: 12 }}>
          <small>¿Olvidaste la clave?</small>
          <button
            type="button"
            className="btn-secondary"
            onClick={resetPass}
            disabled={!isEmailValid || loading}
            title={!isEmailValid ? "Ingresa un email válido" : "Enviar reset"}
          >
            Resetear clave
          </button>
        </div>
      </div>
    </div>
  );
}
