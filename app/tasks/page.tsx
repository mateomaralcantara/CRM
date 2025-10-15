// app/tasks/page.tsx
export const revalidate = 0;
export const dynamic = "force-dynamic";

import { supabase } from "@/lib/supabase";
import { revalidatePath } from "next/cache";

async function create(form: FormData) {
  "use server";
  const title = String(form.get("title") || "").trim();
  const priority = Number(form.get("priority") || 3);
  const due = String(form.get("due") || "") || null; // YYYY-MM-DD para columna date
  const status = String(form.get("status") || "Pendiente");
  if (!title) return;

  const { error } = await supabase.from("tasks").insert({ title, priority, status, due });
  if (error) throw new Error("Supabase insert (tasks): " + error.message);

  revalidatePath("/tasks");
  revalidatePath("/");
}

export default async function TasksPage() {
  const { data: tasks, error } = await supabase
    .from("tasks")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <div className="card">
        <h2 style={{marginTop:0}}>Tareas</h2>
        <p style={{color:"#fca5a5"}}>Error cargando tareas: {error.message}</p>
      </div>
    );
  }
  return (
    <div className="card">
      <h2 style={{marginTop:0}}>Tareas</h2>
      <form action={create} style={{display:'grid', gap:12, gridTemplateColumns:'1fr 120px 160px 160px'}}>
        <div>
          <label>Título</label>
          <input name="title" placeholder="Ej: Llamar a un cliente" required />
        </div>
        <div>
          <label>Prioridad (1-5)</label>
          <select name="priority" defaultValue="3"><option>1</option><option>2</option><option>3</option><option>4</option><option>5</option></select>
        </div>
        <div>
          <label>Vence</label>
          <input name="due" type="date" />
        </div>
        <div>
          <label>Estado</label>
          <select name="status" defaultValue="Pendiente">
            <option>Pendiente</option><option>Hoy</option><option>En curso</option><option>Bloqueada</option><option>Hecha</option>
          </select>
        </div>
        <div style={{gridColumn:'1 / -1', justifySelf:'end'}}><button>Crear</button></div>
      </form>

      <table style={{marginTop:16}}>
        <thead><tr><th>Título</th><th>Prioridad</th><th>Estado</th><th>Vence</th><th>Creada</th></tr></thead>
        <tbody>
          {(tasks??[]).map((t:any) => (
            <tr key={t.id}>
              <td>{t.title}</td>
              <td>{t.priority}</td>
              <td>{t.status}</td>
              <td>{t.due ? new Date(t.due).toLocaleDateString('es-DO') : '-'}</td>
              <td>{new Date(t.created_at).toLocaleString('es-DO')}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
