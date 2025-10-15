// components/Nav.tsx
import Link from "next/link";
import SignOutButton from "./SignOutButton";

export default function Nav() {
  return (
    <>
      <nav style={{ display: "flex", gap: 12, alignItems: "center", marginBlockStart: 12 }}>
        <Link href="/">Dashboard</Link>
        <Link href="/tasks">Tareas</Link>
        <Link href="/projects">Proyectos</Link>
        <Link href="/objectives">Metas</Link>
        <Link href="/finance">Finanzas</Link>
        <Link href="/agenda">Agenda</Link>
        <Link href="/contacts">Contactos</Link>
        <div style={{ marginInlineStart: "auto" }}>
          <SignOutButton />
        </div>
      </nav>
    </>
  );
}
