"use client";
import { useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/browser";

export default function SignInClient() {
  const router = useRouter();
  const sp = useSearchParams();
  const next = sp?.get("next") || "/";

  const [email, setEmail] = useState("istemsd@gmail.com");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true); setMsg(null);
    const sb = supabaseBrowser();
    const { error } = await sb.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) return setMsg(error.message);
    router.replace(next);
    router.refresh();
  }

  return (
    <div className="container" style={{ maxInlineSize: 420, marginBlockStart: 64 }}>
      <div className="card" style={{ padding: 20 }}>
        <h2 style={{ marginBlockStart: 0 }}>Inicia sesión</h2>
        <form onSubmit={onSubmit} className="grid" style={{ gap: 12 }}>
          <div>
            <label>Correo</label>
            <input type="email" required value={email} onChange={e=>setEmail(e.currentTarget.value)} />
          </div>
          <div>
            <label>Clave</label>
            <input type="password" required value={password} onChange={e=>setPassword(e.currentTarget.value)} />
          </div>
          {msg && <div className="empty" style={{ textAlign:"start", color:"#fca5a5" }}>{msg}</div>}
          <div style={{ display:"flex", justifyContent:"space-between", gap:12 }}>
            <button disabled={loading}>{loading ? "Entrando…" : "Entrar"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
