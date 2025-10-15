// app/layout.tsx
import "./globals.css";
import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import Nav from "../components/Nav";

export const metadata: Metadata = {
  title: "Life OS — Supabase",
  description: "CRM personal con Supabase (sin Prisma)",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};
export const viewport: Viewport = { themeColor: "#0b1220" };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es">
      <body>
        <a href="#content" className="skip">Saltar al contenido</a>

        <div className="shell">
          <header>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div className="brand">⚡</div>
                <div>
                  <h1 style={{ marginBlockStart: 0, marginBlockEnd: 2 }}>Life OS — Supabase</h1>
                  <small style={{ color: "#9aa3b2" }}>Next.js + @supabase/supabase-js (sin Prisma)</small>
                </div>
              </div>
              {/* espacio para acciones futuras: perfil, tema, etc */}
            </div>
            <Nav />
          </header>
        </div>

        <main id="content">{children}</main>

        <footer>
          <small>Hecho con cariño. Datos en Supabase; UI en Next.js App Router.</small>
        </footer>
      </body>
    </html>
  );
}
