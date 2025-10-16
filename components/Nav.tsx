"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/browser";

const LINKS = [
  { href: "/",           label: "Dashboard" },
  { href: "/tasks",      label: "Tareas" },
  { href: "/projects",   label: "Proyectos" },
  { href: "/objectives", label: "Metas" },
  { href: "/finance",    label: "Finanzas" },
  { href: "/agenda",     label: "Agenda" },
  { href: "/contacts",   label: "Contactos" },
  { href: "/admin",      label: "Admin" },      // 👈 aquí
];

export default function Nav() {
  const pathname = usePathname();
  const isActive = (href: string) =>
    pathname === href || (href !== "/" && pathname.startsWith(href));

  async function signOut() {
    const sb = supabaseBrowser();
    await sb.auth.signOut();
    window.location.href = "/auth/sign-in?next=/";
  }

  return (
    <nav style={{display:"flex", gap:12, alignItems:"center", flexWrap:"wrap", marginTop:12}}>
      <div style={{display:"flex", gap:12, flexWrap:"wrap"}}>
        {LINKS.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            aria-current={isActive(l.href) ? "page" : undefined}
          >
            {l.label}
          </Link>
        ))}
      </div>
      <div style={{marginInlineStart:"auto"}}>
        <button className="btn-ghost" onClick={signOut}>Salir</button>
      </div>
    </nav>
  );
}
