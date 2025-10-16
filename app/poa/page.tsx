// app/poa/page.tsx
export const revalidate = 0;
export const dynamic = "force-dynamic";

import { supabase } from "@/lib/supabase";
import { revalidatePath } from "next/cache";

// ───────────────────────────────────────────────────────────────────────────────
// Tipos
// ───────────────────────────────────────────────────────────────────────────────
type Status = "Plan" | "En curso" | "Riesgo" | "Hecho";

type POAItem = {
  id: string;
  year: number;
  area: string;
  objective: string;
  activity: string;
  indicator: string;
  unit: string | null;
  baseline: number | null;
  target: number;
  responsible: string | null;
  budget: number | null;
  planned_months: number[] | null;
  progress: number | null;
  spent: number | null;
  status: Status;
  created_at: string;
};

type PageProps = {
  searchParams?: Record<string, string | string[] | undefined>;
};

// ───────────────────────────────────────────────────────────────────────────────
// Utils
// ───────────────────────────────────────────────────────────────────────────────
function toNum(v: unknown, fallback = 0): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}
function thisYear() {
  return new Date().getFullYear();
}
function monthIndex(d = new Date()) {
  return d.getMonth() + 1; // 1..12
}
function asString(sp: PageProps["searchParams"], key: string) {
  const val = sp?.[key];
  return Array.isArray(val) ? val[0] ?? "" : val ?? "";
}

// ───────────────────────────────────────────────────────────────────────────────
// Server Actions
// ───────────────────────────────────────────────────────────────────────────────
async function createItem(form: FormData) {
  "use server";

  const year = toNum(form.get("year"), thisYear());
  const area = String(form.get("area") ?? "").trim();
  const objective = String(form.get("objective") ?? "").trim();
  const activity = String(form.get("activity") ?? "").trim();
  const indicator = String(form.get("indicator") ?? "").trim();
  const unit = String(form.get("unit") ?? "unidades").trim();
  const baseline = toNum(form.get("baseline"), 0);
  const target = toNum(form.get("target"), 0);
  const responsible = (String(form.get("responsible") ?? "").trim() || null) as string | null;
  const budget = toNum(form.get("budget"), 0);

  // meses planificados (1..12)
  const monthsRaw = form.getAll("months"); // FormDataEntryValue[]
  const planned_months = monthsRaw
    .map((m) => toNum(typeof m === "string" ? m : 0, 0))
    .filter((m) => m >= 1 && m <= 12);

  if (!area || !objective || !activity || !indicator || target <= 0) return;

  const { error } = await supabase.from("poa_items").insert({
    year,
    area,
    objective,
    activity,
    indicator,
    unit,
    baseline,
    target,
    responsible,
    budget,
    planned_months,
    progress: 0,
    spent: 0,
    status: "Plan",
  });

  if (error) throw new Error("No se pudo crear el ítem POA: " + error.message);
  revalidatePath("/poa");
}

async function updateItem(form: FormData) {
  "use server";
  const id = String(form.get("id") ?? "");
  if (!id) return;

  const progress = form.has("progress")
    ? Math.max(0, Math.min(100, toNum(form.get("progress"), 0)))
    : null;

  const deltaSpent = form.has("spent_delta")
    ? Math.max(0, toNum(form.get("spent_delta"), 0))
    : 0;

  const status = (form.has("status") ? String(form.get("status")) : null) as Status | null;

  // 1) Traer el gasto actual
  const { data: row, error: rErr } = await supabase
    .from("poa_items")
    .select("spent")
    .eq("id", id)
    .single();

  if (rErr || !row) {
    throw new Error("No se pudo leer el ítem: " + (rErr?.message ?? "sin datos"));
  }

  const patch: Partial<POAItem> = {};
  if (progress !== null) patch.progress = progress;
  if (status !== null) patch.status = status;
  if (deltaSpent > 0) patch.spent = toNum(row.spent, 0) + deltaSpent;

  if (Object.keys(patch).length === 0) return;

  const { error } = await supabase.from("poa_items").update(patch).eq("id", id);
  if (error) throw new Error("No se pudo actualizar el ítem: " + error.message);

  // Bitácora opcional (si falla, ignoramos)
  const ins = await supabase.from("poa_updates").insert({
    item_id: id,
    progress: progress ?? undefined,
    spent_delta: deltaSpent > 0 ? deltaSpent : undefined,
    note: null,
  });
  void ins; // evitar warning por no usar

  revalidatePath("/poa");
}

// ───────────────────────────────────────────────────────────────────────────────
// Página
// ───────────────────────────────────────────────────────────────────────────────
export default async function POAPage({ searchParams }: PageProps) {
  const year = toNum(asString(searchParams, "year") || thisYear(), thisYear());
  const areaFilter = asString(searchParams, "area").trim();
  const statusFilter = asString(searchParams, "status").trim() as Status | "";

  // Traer ítems del año
  const { data: raw, error } = await supabase
    .from("poa_items")
    .select("*")
    .eq("year", year)
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <div className="card">
        <h2 style={{ marginBlockStart: 0 }}>POA</h2>
        <p style={{ color: "#fca5a5" }}>Error: {error.message}</p>
      </div>
    );
  }

  const all: POAItem[] = (raw ?? []) as unknown as POAItem[];

  // Filtros
  const items = all.filter((it) => {
    if (areaFilter && it.area !== areaFilter) return false;
    if (statusFilter && it.status !== statusFilter) return false;
    return true;
  });

  // KPIs
  const totalBudget = items.reduce((a, it) => a + toNum(it.budget), 0);
  const totalSpent = items.reduce((a, it) => a + toNum(it.spent), 0);
  const execPct = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

  const avgProgress =
    items.length > 0
      ? items.reduce((a, it) => a + toNum(it.progress), 0) / items.length
      : 0;

  // Riesgo simple vs. expectativa lineal anual
  const m = monthIndex();
  const expProgress = (m / 12) * 100; // expectativa lineal
  const risky = items.filter((it) => toNum(it.progress) + 15 < expProgress).length;
  void risky; // (si luego lo muestras, quita esta línea)

  // Selects
  const areas = Array.from(new Set(all.map((i) => i.area))).sort();
  const statuses: Status[] = ["Plan", "En curso", "Riesgo", "Hecho"];

  return (
    <div className="grid" style={{ gridTemplateColumns: "1fr", gap: 16 }}>
      <div className="kpis" style={{ gridTemplateColumns: "repeat(4, minmax(0,1fr))" }}>
        <div className="kpi">
          <div>Presupuesto total ({year})</div>
          <div style={{ fontSize: 24, fontWeight: 800 }}>
            {totalBudget.toLocaleString("es-DO", { style: "currency", currency: "DOP" })}
          </div>
        </div>
        <div className="kpi">
          <div>Gastado</div>
          <div style={{ fontSize: 24, fontWeight: 800 }}>
            {totalSpent.toLocaleString("es-DO", { style: "currency", currency: "DOP" })}
          </div>
        </div>
        <div className="kpi">
          <div>% Ejecución</div>
          <div style={{ fontSize: 24, fontWeight: 800 }}>{execPct.toFixed(1)}%</div>
        </div>
        <div className="kpi">
          <div>Avance promedio</div>
          <div style={{ fontSize: 24, fontWeight: 800 }}>{avgProgress.toFixed(1)}%</div>
        </div>
      </div>

      {/* Filtros */}
      <section className="card">
        <h2 style={{ marginBlockStart: 0 }}>Filtros</h2>
        <form method="get" className="grid" style={{ gridTemplateColumns: "repeat(5,1fr)", gap: 12 }}>
          <div>
            <label>Año</label>
            <input type="number" name="year" defaultValue={year} min={2000} max={9999} />
          </div>
          <div>
            <label>Área</label>
            <select name="area" defaultValue={areaFilter}>
              <option value="">(todas)</option>
              {areas.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label>Estado</label>
            <select name="status" defaultValue={statusFilter}>
              <option value="">(todos)</option>
              {statuses.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div style={{ gridColumn: "1/-1", justifySelf: "end" }}>
            <button type="submit">Aplicar</button>
          </div>
        </form>
      </section>

      {/* Crear ítem */}
      <section className="card">
        <h2 style={{ marginBlockStart: 0 }}>Nuevo ítem POA</h2>
        <form action={createItem} className="grid" style={{ gap: 12, gridTemplateColumns: "repeat(4,1fr)" }}>
          <div>
            <label>Año</label>
            <input name="year" type="number" defaultValue={year} required />
          </div>
          <div>
            <label>Área</label>
            <input name="area" placeholder="Finanzas / Comercial / TI" required />
          </div>
          <div style={{ gridColumn: "1/-1" }}>
            <label>Objetivo estratégico</label>
            <input name="objective" placeholder="Ej: Incrementar participación de mercado" required />
          </div>
          <div style={{ gridColumn: "1/-1" }}>
            <label>Actividad</label>
            <input name="activity" placeholder="Ej: Lanzar campaña trimestral" required />
          </div>
          <div>
            <label>Indicador</label>
            <input name="indicator" placeholder="Ej: % ventas vs año anterior" required />
          </div>
          <div>
            <label>Unidad</label>
            <input name="unit" defaultValue="unidades" />
          </div>
          <div>
            <label>Línea base</label>
            <input name="baseline" type="number" step="0.01" defaultValue={0} />
          </div>
          <div>
            <label>Meta anual</label>
            <input name="target" type="number" step="0.01" required />
          </div>
          <div>
            <label>Responsable</label>
            <input name="responsible" placeholder="Nombre del responsable" />
          </div>
          <div>
            <label>Presupuesto (RD$)</label>
            <input name="budget" type="number" step="0.01" defaultValue={0} />
          </div>

          <div style={{ gridColumn: "1/-1" }}>
            <label>Meses planificados</label>
            <div className="flex" style={{ flexWrap: "wrap", gap: 8 }}>
              {["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"].map((m, i) => (
                <label key={m} className="badge" style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                  <input type="checkbox" name="months" value={i + 1} /> {m}
                </label>
              ))}
            </div>
          </div>

          <div style={{ gridColumn: "1/-1", justifySelf: "end" }}>
            <button>Crear ítem</button>
          </div>
        </form>
      </section>

      {/* Tabla */}
      <section className="card">
        <h2 style={{ marginBlockStart: 0 }}>Ejecución del POA ({items.length} ítems)</h2>

        <table style={{ marginBlockStart: 8 }}>
          <thead>
            <tr>
              <th>Área</th>
              <th>Objetivo / Actividad</th>
              <th>Indicador</th>
              <th>Meta</th>
              <th>Avance</th>
              <th>Presupuesto</th>
              <th>Gastado</th>
              <th>Estado</th>
              <th>Actualizar</th>
            </tr>
          </thead>
          <tbody>
            {items.map((it) => {
              const target = toNum(it.target);
              const progress = toNum(it.progress);
              const budget = toNum(it.budget);
              const spent = toNum(it.spent);
              const exec = budget > 0 ? (spent / budget) * 100 : 0;

              const color =
                progress + 15 < expProgress
                  ? "#fca5a5"
                  : progress >= 100
                  ? "#86efac"
                  : "#93c5fd";

              return (
                <tr key={it.id}>
                  <td>{it.area}</td>
                  <td>
                    <div style={{ fontWeight: 700 }}>{it.objective}</div>
                    <div style={{ color: "#9aa3b2" }}>{it.activity}</div>
                  </td>
                  <td>
                    <div>{it.indicator}</div>
                    <small style={{ color: "#9aa3b2" }}>Unidad: {it.unit ?? "-"}</small>
                  </td>
                  <td className="right">{target.toLocaleString("es-DO")}</td>
                  <td style={{ minInlineSize: 200 }}>
                    <div className="progress">
                      <span
                        style={{
                          inlineSize: `${Math.max(0, Math.min(100, progress))}%`,
                          background: color,
                        }}
                      />
                    </div>
                    <small>{progress.toFixed(1)}%</small>
                  </td>
                  <td className="right">
                    {budget.toLocaleString("es-DO", { style: "currency", currency: "DOP" })}
                  </td>
                  <td className="right" style={{ color: exec > 100 ? "#fca5a5" : undefined }}>
                    {spent.toLocaleString("es-DO", { style: "currency", currency: "DOP" })}{" "}
                    <small>({exec.toFixed(1)}%)</small>
                  </td>
                  <td>
                    <span className="badge">{it.status}</span>
                  </td>
                  <td>
                    <form
                      action={updateItem}
                      className="grid"
                      style={{
                        gridTemplateColumns: "90px 120px 140px 100px",
                        gap: 8,
                        alignItems: "center",
                      }}
                    >
                      <input type="hidden" name="id" value={it.id} />
                      <div>
                        <label>%</label>
                        <input
                          name="progress"
                          type="number"
                          min={0}
                          max={100}
                          step="0.1"
                          defaultValue={progress}
                        />
                      </div>
                      <div>
                        <label>+ Gasto</label>
                        <input name="spent_delta" type="number" min={0} step="0.01" defaultValue={0} />
                      </div>
                      <div>
                        <label>Estado</label>
                        <select name="status" defaultValue={it.status}>
                          <option>Plan</option>
                          <option>En curso</option>
                          <option>Riesgo</option>
                          <option>Hecho</option>
                        </select>
                      </div>
                      <div style={{ alignSelf: "end" }}>
                        <button>Guardar</button>
                      </div>
                    </form>
                  </td>
                </tr>
              );
            })}
            {items.length === 0 && (
              <tr>
                <td colSpan={9}>
                  <div className="empty">Sin ítems para {year}. Crea el primero arriba.</div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}
