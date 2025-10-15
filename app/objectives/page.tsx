// app/objectives/page.tsx
export const revalidate = 0;
export const dynamic = "force-dynamic";

import { supabase } from "@/lib/supabase";
import { revalidatePath } from "next/cache";

async function create(form: FormData) {
  "use server";
  const area  = String(form.get("area") || "").trim();
  const title = String(form.get("title") || "").trim();
  const start = String(form.get("start") || ""); // YYYY-MM-DD
  const end   = String(form.get("end") || "");   // YYYY-MM-DD
  if (!area || !title || !start || !end) return;

  const { error } = await supabase.from("objectives").insert({
    area, title, start_date: start, end_date: end
  });
  if (error) throw new Error("Supabase insert (objectives): " + error.message);

  revalidatePath("/objectives");
  revalidatePath("/");
}

async function updateProgress(form: FormData) {
  "use server";
  const id       = String(form.get("id") || "");
  const progress = Number(form.get("progress") || 0);
  const status   = String(form.get("status") || "En curso");
  if (!id) return;

  const { error } = await supabase.from("objectives").update({ progress, status }).eq("id", id);
  if (error) throw new Error("Supabase update (objectives): " + error.message);

  revalidatePath("/objectives");
  revalidatePath("/");
}

export default async function ObjectivesPage() {
  const { data: list, error } = await supabase
    .from("objectives")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return <div className="card"><h2>Metas (OKRs)</h2><p style={{color:"#fca5a5"}}>Error: {error.message}</p></div>;
  }

  return (
    <div className="card">
      <h2 style={{marginTop:0}}>Metas (OKRs)</h2>
      <form action={create} style={{display:'grid', gap:12, gridTemplateColumns:'1fr 1fr 1fr 1fr'}}>
        <div><label>Área</label><input name="area" placeholder="Salud / Finanzas / Carrera..." required /></div>
        <div><label>Título</label><input name="title" required /></div>
        <div><label>Inicio</label><input type="date" name="start" required /></div>
        <div><label>Fin</label><input type="date" name="end" required /></div>
        <div style={{gridColumn:'1/-1', justifySelf:'end'}}><button>Crear</button></div>
      </form>

      <table style={{marginTop:16}}>
        <thead><tr><th>Área</th><th>Título</th><th>Rango</th><th>Progreso</th><th>Estado</th></tr></thead>
        <tbody>
          {(list??[]).map((o:any) => (
            <tr key={o.id}>
              <td>{o.area}</td>
              <td>{o.title}</td>
              <td>{new Date(o.start_date).toLocaleDateString('es-DO')} → {new Date(o.end_date).toLocaleDateString('es-DO')}</td>
              <td style={{minWidth:180}}>
                <div className="progress"><span style={{width: Math.min(100, Math.max(0, o.progress)) + '%'}}></span></div>
                <small>{o.progress}%</small>
              </td>
              <td>
                <form action={updateProgress} className="flex" style={{gap:8}}>
                  <input type="hidden" name="id" value={o.id} />
                  <select name="status" defaultValue={o.status}>
                    <option>Plan</option>
                    <option>En curso</option>
                    <option>Pausado</option>
                    <option>Hecho</option>
                  </select>
                  <input type="number" name="progress" min="0" max="100" defaultValue={o.progress} style={{width:90}} />
                  <button>Guardar</button>
                </form>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
