// app/page.tsx
export const revalidate = 0;
export const dynamic = "force-dynamic";

import { supabase } from "@/lib/supabase";

// Tipos locales (solo para ayuda en el render)
type Objective = {
  id: string;
  area: string;
  title: string;
  start_date: string;
  end_date: string;
  progress: number | null;
  status: string;
};
type Tx = { kind: "Ingreso" | "Egreso" | "Transferencia"; amount: number | string; date: string };
type Contact = { id: string; name: string; email?: string | null };
type EventRow = { id: string; title: string; start: string; end: string };

function isoDayRange(d = new Date()) {
  const start = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
  const end = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
  return { start: start.toISOString(), end: end.toISOString() };
}
function isoMonthRange(d = new Date()) {
  const start = new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0);
  const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
  return {
    start: start.toISOString(),
    end: end.toISOString(),
    startDate: start.toISOString().slice(0, 10),
    endDate: end.toISOString().slice(0, 10),
  };
}

export default async function Home() {
  const now = new Date();
  const { start, end, startDate, endDate } = isoMonthRange(now);
  const today = isoDayRange(now);

  // Haz todo en paralelo
  const [tasksRes, objectivesRes, txsRes, contactsRes, eventsRes] = await Promise.all([
    supabase
      .from("tasks")
      .select("*", { count: "exact", head: true })
      .gte("created_at", today.start)
      .lte("created_at", today.end),
    supabase
      .from("objectives")
      .select("*")
      .lte("start_date", endDate)
      .gte("end_date", startDate)
      .order("end_date", { ascending: true }),
    supabase
      .from("transactions")
      .select("kind,amount,date")
      .gte("date", start)
      .lte("date", end),
    supabase
      .from("contacts")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("events")
      .select("*")
      .gte("start", new Date().toISOString())
      .lte("start", new Date(Date.now() + 7 * 86400000).toISOString())
      .order("start", { ascending: true })
      .limit(5),
  ]);

  const tasksToday = tasksRes.count ?? 0;

  const objectives = (objectivesRes.data ?? []) as Objective[];
  if (objectivesRes.error) console.warn("Objectives error:", objectivesRes.error.message);
  const avgProgress =
    objectives.length > 0
      ? Math.round(objectives.reduce((s, o) => s + Number(o.progress ?? 0), 0) / objectives.length)
      : 0;

  const txs = (txsRes.data ?? []) as Tx[];
  if (txsRes.error) console.warn("Transactions error:", txsRes.error.message);
  const totals = txs.reduce(
    (acc, t) => {
      const amt = Number(t.amount || 0);
      if (t.kind === "Ingreso") acc.ingresos += amt;
      else if (t.kind === "Egreso") acc.egresos += amt;
      return acc;
    },
    { ingresos: 0, egresos: 0 }
  );
  const neto = totals.ingresos - totals.egresos;

  const contacts = (contactsRes.data ?? []) as Contact[];
  if (contactsRes.error) console.warn("Contacts error:", contactsRes.error.message);

  const events = (eventsRes.data ?? []) as EventRow[];
  if (eventsRes.error) console.warn("Events error:", eventsRes.error.message);

  return (
    <div className="grid" style={{ display: "grid", gap: 16 }}>
      <div className="card">
        <h2 style={{ marginBlockStart: 0 }}>Hoy</h2>
        <p>
          <b>Tareas creadas hoy:</b> {tasksToday}
        </p>
      </div>

      <div className="card">
        <h2 style={{ marginBlockStart: 0 }}>Metas del mes</h2>
        <p>
          <b>Metas activas:</b> {objectives.length}
        </p>
        <div
          style={{
            background: "#1f2937",
            borderRadius: 8,
            blockSize: 10,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              inlineSize: `${avgProgress}%`,
              blockSize: "100%",
              background: "#22c55e",
              transition: "inline-size .3s ease",
            }}
          />
        </div>
        <small>Progreso promedio: {avgProgress}%</small>
      </div>

      <div className="card">
        <h2 style={{ marginBlockStart: 0 }}>Finanzas (mes)</h2>
        <p>
          Ingresos: <b>RD$ {totals.ingresos.toFixed(2)}</b>
        </p>
        <p>
          Egresos: <b>RD$ {totals.egresos.toFixed(2)}</b>
        </p>
        <p>
          Neto: <b>RD$ {neto.toFixed(2)}</b>
        </p>
      </div>

      <div className="card">
        <h2 style={{ marginBlockStart: 0 }}>Contactos recientes</h2>
        <ul>
          {contacts.map((c) => (
            <li key={c.id}>
              {c.name} {c.email ? `— ${c.email}` : ""}
            </li>
          ))}
          {contacts.length === 0 && <li>Sin contactos aún</li>}
        </ul>
      </div>

      <div className="card">
        <h2 style={{ marginBlockStart: 0 }}>Próximos 7 días</h2>
        <ul>
          {events.map((e) => (
            <li key={e.id}>
              {e.title} — {new Date(e.start).toLocaleString("es-DO")}
            </li>
          ))}
          {events.length === 0 && <li>Sin eventos próximos</li>}
        </ul>
      </div>
    </div>
  );
}
