// app/projects/page.tsx
export const revalidate = 0;
export const dynamic = "force-dynamic";

import Link from "next/link";
import { supabase } from "@/lib/supabase";

async function create(form: FormData) {
  "use server";
  const name = String(form.get("name") || "").trim();
  if (!name) return;
  await supabase.from("projects").insert({ name, content: "" });
}

export default async function ProjectsPage() {
  const { data: projects } = await supabase
    .from("projects")
    .select("id,name,status,created_at")
    .order("created_at", { ascending: false });

  return (
    <div className="card">
      <h2 style={{ marginBlockStart: 0 }}>Proyectos</h2>
      <form action={create} className="flex" style={{ marginBlockEnd: 12 }}>
        <div style={{ flex: 1 }}>
          <label>Título del proyecto</label>
          <input name="name" placeholder="Ej: Rediseño web" required />
        </div>
        <div><button>Crear</button></div>
      </form>

      <table>
        <thead>
          <tr><th>Nombre</th><th>Estado</th><th>Creado</th><th></th></tr>
        </thead>
        <tbody>
          {(projects ?? []).map((p: any) => (
            <tr key={p.id}>
              <td>{p.name}</td>
              <td><span className="badge">{p.status}</span></td>
              <td>{new Date(p.created_at).toLocaleString("es-DO")}</td>
              <td className="right">
                <Link className="btn-ghost" href={`/projects/${p.id}`}>Abrir</Link>
              </td>
            </tr>
          ))}
          {(!projects || projects.length === 0) && (
            <tr><td colSpan={4}><div className="empty">Crea tu primer proyecto para empezar.</div></td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
