// app/agenda/page.tsx
export const revalidate = 0;
export const dynamic = "force-dynamic";

import { supabase } from "@/lib/supabase";
import { revalidatePath } from "next/cache";

function toIsoLocal(s: string) {
  // datetime-local → Date → ISO (UTC)
  if (!s) return null;
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

async function create(form: FormData) {
  "use server";
  const title = String(form.get("title") || "").trim();
  const start = toIsoLocal(String(form.get("start") || ""));
  const end   = toIsoLocal(String(form.get("end") || ""));
  const location = String(form.get("location") || "").trim() || null;
  const note     = String(form.get("note") || "").trim() || null;
  if (!title || !start || !end) return;

  const { error } = await supabase
    .from("events")
    .insert({ title, start, end, location, note });

  if (error) throw new Error("Supabase insert (events): " + error.message);

  revalidatePath("/agenda");
  revalidatePath("/");
}

export default async function AgendaPage() {
  const { data: events, error } = await supabase
    .from("events")
    .select("*")
    .order("start", { ascending: true });

  if (error) {
    return <div className="card"><h2>Agenda</h2><p style={{color:"#fca5a5"}}>Error: {error.message}</p></div>;
  }

  return (
    <div className="card">
      <h2 style={{marginTop:0}}>Agenda</h2>
      <form action={create} style={{display:'grid', gap:12, gridTemplateColumns:'1fr 1fr 1fr 1fr'}}>
        <div><label>Título</label><input name="title" required /></div>
        <div><label>Inicio</label><input name="start" type="datetime-local" required /></div>
        <div><label>Fin</label><input name="end" type="datetime-local" required /></div>
        <div><label>Ubicación</label><input name="location" placeholder="Meet / Oficina" /></div>
        <div style={{gridColumn:'1/-1'}}><label>Nota</label><textarea name="note" rows={2}></textarea></div>
        <div style={{gridColumn:'1/-1', justifySelf:'end'}}><button>Crear evento</button></div>
      </form>

      <table style={{marginTop:16}}>
        <thead><tr><th>Título</th><th>Inicio</th><th>Fin</th><th>Ubicación</th></tr></thead>
        <tbody>
          {(events??[]).map((e:any) => (
            <tr key={e.id}>
              <td>{e.title}</td>
              <td>{new Date(e.start).toLocaleString('es-DO')}</td>
              <td>{new Date(e.end).toLocaleString('es-DO')}</td>
              <td>{e.location ?? "-"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
