// components/Nav.tsx
"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/browser";

type LinkItem = { href: string; label: string; exact?: boolean };

const BASE_LINKS: LinkItem[] = [
  { href: "/",           label: "Dashboard", exact: true },
  { href: "/tasks",      label: "Tareas" },
  { href: "/projects",   label: "Proyectos" },
  { href: "/objectives", label: "Metas" },
  { href: "/finance",    label: "Finanzas" },
  { href: "/agenda",     label: "Agenda" },
  { href: "/contacts",   label: "Contactos" },
  { href: "/poa",        label: "POA" },     // quítalo si no lo usas
  { href: "/admin",      label: "Admin" },
];

export default function Nav() {
  const pathname = usePathname() || "/";
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);

  const links = useMemo(() => BASE_LINKS, []);

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname === href || pathname.startsWith(href + "/");

  async function signOut() {
    if (signingOut) return;
    setSigningOut(true);
    try {
      await supabaseBrowser().auth.signOut();
    } finally {
      router.replace("/auth/sign-in?next=/");
    }
  }

  return (
    <nav
      aria-label="Principal"
      style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap", marginTop: 12 }}
    >
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", overflowX: "auto", paddingBlock: 2 }}>
        {links.map(({ href, label, exact }) => {
          const active = isActive(href, exact);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className="nav-link"
              data-active={active ? "true" : "false"}
            >
              {label}
            </Link>
          );
        })}
      </div>

      <div style={{ marginInlineStart: "auto" }}>
        <button className="btn-ghost" onClick={signOut} disabled={signingOut}>
          {signingOut ? "Saliendo…" : "Salir"}
        </button>
      </div>
    </nav>
  );
}
