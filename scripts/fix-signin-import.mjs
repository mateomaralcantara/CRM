#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

const ROOT = process.cwd();
const DIR = path.join(ROOT, "app", "auth", "sign-in");
const PAGE = path.join(DIR, "page.tsx");
const EXPECTED_BASENAME = "SignInClient";
const EXTS = [".tsx", ".ts", ".jsx", ".js"];
const EXPECTED_FILE = path.join(DIR, `${EXPECTED_BASENAME}.tsx`);

const DEFAULT_CLIENT_CODE = `"use client";
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
      redirectTo: \`\${window.location.origin}/auth/update-password\`,
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
`;

// ---------------- helpers ----------------
const log = (...a) => console.log(">>", ...a);
const exists = (p) => {
  try { fs.accessSync(p); return true; } catch { return false; }
};
const inGitRepo = () => {
  try { execSync("git rev-parse --is-inside-work-tree", { stdio: "ignore" }); return true; } catch { return false; }
};
const gitMv = (oldPath, newPath) => {
  try {
    execSync(`git mv -f "${oldPath.replace(/\\/g, "/")}" "${newPath.replace(/\\/g, "/")}"`, { stdio: "ignore" });
    return true;
  } catch { return false; }
};

// ---------------- checks ----------------
if (!exists(PAGE)) {
  console.error(`No existe ${PAGE}. Verifica la ruta del proyecto.`);
  process.exit(1);
}
if (!exists(DIR)) {
  console.error(`No existe el directorio ${DIR}.`);
  process.exit(1);
}

// 1) Detectar archivos candidatos de SignInClient (ignorando mayúsculas)
const files = fs.readdirSync(DIR);
const candidates = files
  .filter((f) => EXTS.includes(path.extname(f)))
  .filter((f) => path.parse(f).name.toLowerCase() === EXPECTED_BASENAME.toLowerCase());

// 2) Si no existe, crear el correcto
let actual = candidates[0] || null;
if (!actual) {
  fs.writeFileSync(EXPECTED_FILE, DEFAULT_CLIENT_CODE, "utf8");
  log(`Creado ${EXPECTED_FILE}`);
  actual = path.basename(EXPECTED_FILE);
}

// 3) Si existe con casing distinto, renombrar al exacto "SignInClient.ext"
const desired = EXPECTED_BASENAME + path.extname(actual);
if (actual !== desired) {
  const oldPath = path.join(DIR, actual);
  const newPath = path.join(DIR, desired);

  // usar git si está disponible (mejor para índices case-sensitive)
  if (inGitRepo() && gitMv(oldPath, newPath)) {
    log(`Renombrado (git): ${actual} -> ${desired}`);
  } else {
    // fallback FS (2 pasos para Windows)
    const tmp = path.join(DIR, `__tmp__${Date.now()}${path.extname(actual)}`);
    try {
      fs.renameSync(oldPath, tmp);
      fs.renameSync(tmp, newPath);
      log(`Renombrado (FS): ${actual} -> ${desired}`);
    } catch (e) {
      console.error("Error renombrando:", e.message);
      process.exit(1);
    }
  }

  // eliminar duplicados con otro casing si quedaron
  files
    .filter((f) => f !== desired)
    .filter((f) => EXTS.includes(path.extname(f)))
    .filter((f) => path.parse(f).name.toLowerCase() === EXPECTED_BASENAME.toLowerCase())
    .forEach((dup) => {
      const p = path.join(DIR, dup);
      try {
        if (inGitRepo()) {
          execSync(`git rm -f --cached "${p.replace(/\\/g, "/")}"`, { stdio: "ignore" });
        }
      } catch {}
      try { fs.unlinkSync(p); log(`Eliminado duplicado: ${dup}`); } catch {}
    });
}

// 4) Arreglar import en page.tsx → exactamente "./SignInClient"
let code = fs.readFileSync(PAGE, "utf8");
const importRe = /import\s+(.+?)\s+from\s+['"]\.\/([^'"]+)['"];?/gim;

let foundImport = false;
let changed = false;

code = code.replace(importRe, (match, what, rel) => {
  if (rel.toLowerCase() === EXPECTED_BASENAME.toLowerCase()) {
    foundImport = true;
    if (rel !== EXPECTED_BASENAME) {
      changed = true;
      return `import ${what} from "./${EXPECTED_BASENAME}";`;
    }
  }
  return match;
});

// Si no está el import correcto, insertarlo tras el último import
if (!foundImport) {
  const lines = code.split("\n");
  let lastImport = -1;
  for (let i = 0; i < lines.length; i++) {
    if (/^\s*import\b/.test(lines[i])) lastImport = i;
  }
  const importLine = `import SignInClient from "./${EXPECTED_BASENAME}";`;
  if (lastImport >= 0) {
    lines.splice(lastImport + 1, 0, importLine);
  } else {
    lines.unshift(importLine);
  }
  code = lines.join("\n");
  changed = true;
}

if (changed) {
  fs.writeFileSync(PAGE, code, "utf8");
  log(`Actualizado import en ${PAGE}`);
} else {
  log("Import de ./SignInClient ya correcto.");
}

log("✅ Listo. Si usas git: `git add -A && git commit -m \"fix: SignInClient import/casing\"`");
