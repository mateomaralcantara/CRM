// app/projects/page.tsx
export const revalidate = 0;
export const dynamic = "force-dynamic";

import { supabase } from "@/lib/supabase";
import { revalidatePath } from "next/cache";

async function create(form: FormData) {
  "use server";
  const name = String(form.get("name") || "").trim();
  if (!name) return;

  const { error } = await supabase.from("projects").insert({ name });
  if (error) throw new Error("Supabase insert (projects): " + error.message);

  revalidatePath("/projects");
  revalidatePath("/");
}

export default async function ProjectsPage() {
  const { data: projects, error } = await supabase
    .from("projects")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return <div className="card"><h2>Proyectos</h2><p style={{color:"#fca5a5"}}>Error: {error.message}</p></div>;
  }

  return (
    <div className="card">
      <h2 style={{marginTop:0}}>Proyectos</h2>
      <form action={create} className="flex" style={{gap:12}}>
        <div style={{flex:1}}>
          <label>Nombre</label>
          <input name="name" required />
        </div>
        <div><button>Crear</button></div>
      </form>

      <table style={{marginTop:16}}>
        <thead><tr><th>Nombre</th><th>Estado</th><th>Creado</th></tr></thead>
        <tbody>
          {(projects??[]).map((p:any) => (
            <tr key={p.id}>
              <td>{p.name}</td>
              <td>{p.status}</td>
              <td>{new Date(p.created_at).toLocaleString('es-DO')}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
