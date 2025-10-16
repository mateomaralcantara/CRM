// app/admin/page.tsx
export const revalidate = 0;
export const dynamic = "force-dynamic";

import { supabase } from "@/lib/supabase";
import { revalidatePath } from "next/cache";

// ---------- Tipos ----------
type Field =
  | { name: string; label: string; kind: "text" | "number" | "date" | "datetime" }
  | { name: string; label: string; kind: "select"; options: string[] }
  | { name: string; label: string; kind: "uuid" }
  | { name: string; label: string; kind: "array:text" }
  | { name: string; label: string; kind: "array:number" };

type TableCfg = {
  name: string;
  label: string;
  pk?: string;
  orderBy?: string;
  fields: Field[];
};

// ---------- Menú ----------
const TABLE_KEYS = [
  "projects",
  "objectives",
  "tasks",
  "contacts",
  "opportunities",
  "accounts",
  "transactions",
  "events",
  "debts",
  "debt_payments",
  "poa", // 👈 un solo POA
] as const;
type TableKey = typeof TABLE_KEYS[number];

// ---------- Config por tabla ----------
const TABLES: Record<TableKey, TableCfg> = {
  projects: {
    name: "projects",
    label: "Proyectos",
    fields: [
      { name: "name", label: "Nombre", kind: "text" },
      { name: "status", label: "Estado", kind: "select", options: ["Plan","En curso","Pausado","Hecho"] },
      { name: "start_date", label: "Inicio", kind: "date" },
      { name: "end_date", label: "Fin", kind: "date" },
    ],
  },
  objectives: {
    name: "objectives",
    label: "Metas",
    fields: [
      { name: "area", label: "Área", kind: "text" },
      { name: "title", label: "Título", kind: "text" },
      { name: "start_date", label: "Inicio", kind: "date" },
      { name: "end_date", label: "Fin", kind: "date" },
      { name: "progress", label: "Progreso (0-100)", kind: "number" },
      { name: "status", label: "Estado", kind: "select", options: ["Plan","En curso","Pausado","Hecho"] },
    ],
  },
  tasks: {
    name: "tasks",
    label: "Tareas",
    fields: [
      { name: "title", label: "Título", kind: "text" },
      { name: "description", label: "Descripción", kind: "text" },
      { name: "priority", label: "Prioridad (1-5)", kind: "number" },
      { name: "due", label: "Vence", kind: "date" },
      { name: "status", label: "Estado", kind: "select", options: ["Pendiente","Hoy","En curso","Bloqueada","Hecha"] },
      { name: "project_id", label: "Project ID (uuid)", kind: "uuid" },
      { name: "objective_id", label: "Objective ID (uuid)", kind: "uuid" },
    ],
  },
  contacts: {
    name: "contacts",
    label: "Contactos",
    fields: [
      { name: "name", label: "Nombre", kind: "text" },
      { name: "company", label: "Empresa", kind: "text" },
      { name: "email", label: "Email", kind: "text" },
      { name: "phone", label: "Teléfono", kind: "text" },
      { name: "last_touch", label: "Último contacto", kind: "datetime" },
      { name: "next_action", label: "Próxima acción", kind: "text" },
    ],
  },
  opportunities: {
    name: "opportunities",
    label: "Oportunidades",
    fields: [
      { name: "contact_id", label: "Contact ID (uuid)", kind: "uuid" },
      { name: "stage", label: "Etapa", kind: "text" },
      { name: "est_value", label: "Valor estimado", kind: "number" },
      { name: "est_close_date", label: "Cierre estimado", kind: "date" },
      { name: "probability", label: "Probabilidad (0-100)", kind: "number" },
    ],
  },
  accounts: {
    name: "accounts",
    label: "Cuentas",
    fields: [
      { name: "name", label: "Nombre", kind: "text" },
      { name: "type", label: "Tipo", kind: "text" },
      { name: "starting_bal", label: "Saldo inicial", kind: "number" },
    ],
  },
  transactions: {
    name: "transactions",
    label: "Transacciones",
    fields: [
      { name: "date", label: "Fecha/Hora", kind: "datetime" },
      { name: "kind", label: "Tipo", kind: "select", options: ["Ingreso","Egreso","Transferencia"] },
      { name: "account_id", label: "Account ID (uuid)", kind: "uuid" },
      { name: "category", label: "Categoría", kind: "text" },
      { name: "amount", label: "Monto", kind: "number" },
      { name: "note", label: "Nota", kind: "text" },
      { name: "tags", label: "Tags (coma)", kind: "array:text" },
    ],
  },
  events: {
    name: "events",
    label: "Agenda",
    fields: [
      { name: "title", label: "Título", kind: "text" },
      { name: "start", label: "Inicio", kind: "datetime" },
      { name: "end", label: "Fin", kind: "datetime" },
      { name: "location", label: "Ubicación", kind: "text" },
      { name: "note", label: "Nota", kind: "text" },
    ],
  },
  debts: {
    name: "debts",
    label: "Deudas",
    fields: [
      { name: "concept", label: "Concepto", kind: "text" },
      { name: "creditor", label: "Acreedor", kind: "text" },
      { name: "amount", label: "Monto", kind: "number" },
      { name: "status", label: "Estado", kind: "select", options: ["Abierta","Cerrada"] },
      { name: "due_date", label: "Vence", kind: "date" },
    ],
  },
  debt_payments: {
    name: "debt_payments",
    label: "Pagos de Deuda",
    fields: [
      { name: "debt_id", label: "Debt ID (uuid)", kind: "uuid" },
      { name: "amount", label: "Monto", kind: "number" },
      { name: "paid_at", label: "Pagado en", kind: "datetime" },
      { name: "note", label: "Nota", kind: "text" },
    ],
  },

  // --------- POA único (tabla poa_items) ----------
  poa: {
    name: "poa_items",
    label: "POA",
    fields: [
      { name: "year", label: "Año", kind: "number" },
      { name: "area", label: "Área", kind: "text" },
      { name: "objective", label: "Objetivo", kind: "text" },
      { name: "activity", label: "Actividad", kind: "text" },
      { name: "indicator", label: "Indicador", kind: "text" },
      { name: "unit", label: "Unidad", kind: "text" },
      { name: "baseline", label: "Línea base", kind: "number" },
      { name: "target", label: "Meta anual", kind: "number" },
      { name: "responsible", label: "Responsable", kind: "text" },
      { name: "budget", label: "Presupuesto", kind: "number" },
      { name: "planned_months", label: "Meses plan (1-12, coma)", kind: "array:number" },
      { name: "progress", label: "Avance %", kind: "number" },
      { name: "spent", label: "Gastado", kind: "number" },
      { name: "status", label: "Estado", kind: "select", options: ["Plan","En curso","Riesgo","Hecho"] },
    ],
  },
};

// ---------- Helpers ----------
function toIsoMaybe(v: string | null | undefined) {
  if (!v) return null;
  const d = new Date(v);
  return isNaN(d.getTime()) ? null : d.toISOString();
}
function parseField(field: Field, raw: FormDataEntryValue | null): any {
  const s = (raw ?? "").toString().trim();
  if (s === "") return null;
  switch (field.kind) {
    case "number": return Number(s);
    case "date": return s;
    case "datetime": return toIsoMaybe(s);
    case "array:text": return s.split(",").map(t => t.trim()).filter(Boolean);
    case "array:number":
      return s.split(",").map(t => Number(t.trim())).filter(n => Number.isFinite(n));
    default: return s;
  }
}
function isTableKey(x: unknown): x is TableKey {
  return typeof x === "string" && (TABLE_KEYS as readonly string[]).includes(x);
}
function pathFor(tableKey: TableKey) {
  return `/admin?t=${encodeURIComponent(tableKey)}`;
}

// ---------- Server Actions genéricas ----------
async function createRow(form: FormData) {
  "use server";
  const raw = (form.get("tableKey") || "tasks").toString();
  const key: TableKey = isTableKey(raw) ? raw : "tasks";
  const cfg = TABLES[key];

  const payload: Record<string, any> = {};
  for (const f of cfg.fields) payload[f.name] = parseField(f, form.get(f.name));

  const { error } = await supabase.from(cfg.name).insert(payload);
  if (error) throw new Error(`Insert ${cfg.name}: ` + error.message);
  revalidatePath(pathFor(key));
}

async function updateRow(form: FormData) {
  "use server";
  const raw = (form.get("tableKey") || "tasks").toString();
  const id = (form.get("id") || "").toString();
  const key: TableKey = isTableKey(raw) ? raw : "tasks";
  const cfg = TABLES[key];
  if (!id) return;

  const payload: Record<string, any> = {};
  for (const f of cfg.fields) payload[f.name] = parseField(f, form.get(f.name));

  const { error } = await supabase.from(cfg.name).update(payload).eq(cfg.pk ?? "id", id);
  if (error) throw new Error(`Update ${cfg.name}: ` + error.message);
  revalidatePath(pathFor(key));
}

async function deleteRow(form: FormData) {
  "use server";
  const raw = (form.get("tableKey") || "tasks").toString();
  const id = (form.get("id") || "").toString();
  const key: TableKey = isTableKey(raw) ? raw : "tasks";
  const cfg = TABLES[key];
  if (!id) return;

  const { error } = await supabase.from(cfg.name).delete().eq(cfg.pk ?? "id", id);
  if (error) throw new Error(`Delete ${cfg.name}: ` + error.message);
  revalidatePath(pathFor(key));
}

// ---------- Server Action específica POA: “Actualizado rápido” ----------
async function poaQuickUpdate(form: FormData) {
  "use server";
  const id = (form.get("id") || "").toString();
  const progress = (form.get("progress") || "").toString();
  const spentDelta = (form.get("spent_delta") || "").toString();
  const status = (form.get("status") || "").toString();
  const note = (form.get("note") || "").toString();

  if (!id) return;

  // Leer spent actual
  const { data: cur, error: rErr } = await supabase
    .from("poa_items")
    .select("spent")
    .eq("id", id)
    .single();
  if (rErr) throw new Error("POA read: " + rErr.message);

  const patch: Record<string, any> = {};
  if (progress !== "") patch.progress = Math.max(0, Math.min(100, Number(progress)));
  if (status) patch.status = status;
  const delta = spentDelta !== "" ? Math.max(0, Number(spentDelta)) : 0;
  if (delta > 0) patch.spent = Number(cur?.spent || 0) + delta;

  if (Object.keys(patch).length) {
    const { error: uErr } = await supabase.from("poa_items").update(patch).eq("id", id);
    if (uErr) throw new Error("POA update: " + uErr.message);
  }

  // Bitácora opcional
  if (note || delta > 0 || progress !== "") {
    await supabase.from("poa_updates").insert({
      item_id: id,
      progress: progress !== "" ? Number(progress) : undefined,
      spent_delta: delta > 0 ? delta : undefined,
      note: note || null,
    });
  }

  revalidatePath(pathFor("poa"));
}

// ---------- UI ----------
export default async function AdminPage({ searchParams }: { searchParams?: { t?: string } }) {
  const rawKey = searchParams?.t ?? "tasks";
  const tableKey: TableKey = isTableKey(rawKey) ? rawKey : "tasks";
  const cfg = TABLES[tableKey];

  const orderBy = cfg.orderBy ?? "created_at";
  const { data: rowsRaw, error } = await supabase
    .from(cfg.name)
    .select("*")
    .order(orderBy, { ascending: false })
    .limit(50);

  const rows = rowsRaw ?? [];

  return (
    <div className="grid" style={{ gridTemplateColumns: "260px 1fr", gap: 16 }}>
      {/* Sidebar */}
      <aside className="card" style={{ padding: 12 }}>
        <h3 style={{ marginBlockStart: 0 }}>Admin</h3>
        <nav style={{ display: "grid", gap: 8 }}>
          {TABLE_KEYS.map((key) => (
            <a
              key={key}
              href={pathFor(key)}
              aria-current={key === tableKey ? "page" : undefined}
              className="btn btn-ghost"
              style={{ justifyContent: "start" }}
            >
              {TABLES[key].label}
            </a>
          ))}
        </nav>
        <div style={{ marginBlockStart: 12 }}>
          <small>Mostrando 50 más recientes.</small>
        </div>
      </aside>

      {/* Panel principal */}
      <section className="card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <h2 style={{ marginBlockStart: 0 }}>{cfg.label}</h2>
          {error && <small style={{ color: "#fca5a5" }}>Error: {error.message}</small>}
        </div>

        {/* Crear */}
        <form action={createRow} className="grid" style={{ gridTemplateColumns: "repeat(4,1fr)", gap: 12 }}>
          <input type="hidden" name="tableKey" value={tableKey} />
          {cfg.fields.map((f) => (
            <div key={`create-${f.name}`}>
              <label>{f.label}</label>
              {f.kind === "select" ? (
                <select name={f.name}>
                  <option value=""></option>
                  {f.options.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              ) : f.kind === "datetime" ? (
                <input name={f.name} type="datetime-local" />
              ) : f.kind === "date" ? (
                <input name={f.name} type="date" />
              ) : f.kind === "number" ? (
                <input name={f.name} type="number" step="0.01" />
              ) : f.kind === "array:text" || f.kind === "array:number" ? (
                <input name={f.name} placeholder={f.kind === "array:number" ? "1,2,3,..." : "tag1, tag2"} />
              ) : (
                <input name={f.name} placeholder={f.kind === "uuid" ? "uuid" : ""} />
              )}
            </div>
          ))}
          <div style={{ gridColumn: "1/-1", justifySelf: "end" }}>
            <button>Crear</button>
          </div>
        </form>

        {/* Tabla + editar/borrar */}
        <table style={{ marginBlockStart: 16 }}>
          <thead>
            <tr>
              <th>ID</th>
              {cfg.fields.map((f) => <th key={`head-${f.name}`}>{f.label}</th>)}
              <th className="right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r: any) => (
              <tr key={r[cfg.pk ?? "id"]}>
                <td style={{ maxInlineSize: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {r[cfg.pk ?? "id"]}
                </td>
                {cfg.fields.map((f) => {
                  const v = r[f.name];
                  if (f.kind === "array:text" || f.kind === "array:number") {
                    return <td key={`cell-${r.id}-${f.name}`}>{Array.isArray(v) ? v.join(", ") : ""}</td>;
                  }
                  if (f.kind === "datetime" && v) {
                    return <td key={`cell-${r.id}-${f.name}`}>{new Date(v).toLocaleString("es-DO")}</td>;
                  }
                  if (f.kind === "date" && v) {
                    return <td key={`cell-${r.id}-${f.name}`}>{new Date(v).toLocaleDateString("es-DO")}</td>;
                  }
                  if (typeof v === "number") {
                    return <td key={`cell-${r.id}-${f.name}`}>{v}</td>;
                  }
                  return <td key={`cell-${r.id}-${f.name}`}>{v ?? "-"}</td>;
                })}
                <td className="right">
                  <details>
                    <summary className="btn btn-ghost">Editar / Borrar</summary>
                    <div style={{ marginBlockStart: 8 }}>
                      {/* Editar genérico */}
                      <form
                        action={updateRow}
                        className="grid"
                        style={{ gridTemplateColumns: "repeat(3,1fr)", gap: 8, alignItems: "end" }}
                      >
                        <input type="hidden" name="tableKey" value={tableKey} />
                        <input type="hidden" name="id" value={r[cfg.pk ?? "id"]} />
                        {cfg.fields.map((f) => {
                          const val = r[f.name] ?? "";
                          const inputName = f.name;
                          return (
                            <div key={`edit-${r.id}-${f.name}`}>
                              <label>{f.label}</label>
                              {f.kind === "select" ? (
                                <select name={inputName} defaultValue={String(val || "")}>
                                  <option value=""></option>
                                  {f.options.map((opt) => (
                                    <option key={opt} value={opt}>{opt}</option>
                                  ))}
                                </select>
                              ) : f.kind === "datetime" ? (
                                <input
                                  name={inputName}
                                  type="datetime-local"
                                  defaultValue={val ? new Date(val).toISOString().slice(0, 16) : ""}
                                />
                              ) : f.kind === "date" ? (
                                <input
                                  name={inputName}
                                  type="date"
                                  defaultValue={val ? new Date(val).toISOString().slice(0, 10) : ""}
                                />
                              ) : f.kind === "number" ? (
                                <input name={inputName} type="number" step="0.01" defaultValue={val !== null ? String(val) : ""} />
                              ) : f.kind === "array:text" ? (
                                <input name={inputName} defaultValue={Array.isArray(val) ? val.join(", ") : ""} />
                              ) : f.kind === "array:number" ? (
                                <input name={inputName} defaultValue={Array.isArray(val) ? val.join(",") : ""} placeholder="1,2,3,..." />
                              ) : (
                                <input name={inputName} defaultValue={String(val || "")} />
                              )}
                            </div>
                          );
                        })}
                        <div style={{ gridColumn: "1/-1", justifySelf: "end", display: "flex", gap: 8 }}>
                          <button className="btn-secondary">Guardar cambios</button>
                        </div>
                      </form>

                      {/* POA: Actualizado rápido (solo cuando tableKey === 'poa') */}
                      {tableKey === "poa" && (
                        <form
                          action={poaQuickUpdate}
                          className="grid"
                          style={{ gridTemplateColumns: "repeat(5,1fr)", gap: 8, alignItems: "end", marginBlockStart: 12 }}
                        >
                          <input type="hidden" name="id" value={r[cfg.pk ?? "id"]} />
                          <div>
                            <label>Avance %</label>
                            <input name="progress" type="number" min={0} max={100} step="0.1" defaultValue={r.progress ?? ""} />
                          </div>
                          <div>
                            <label>+ Gasto</label>
                            <input name="spent_delta" type="number" min={0} step="0.01" />
                          </div>
                          <div>
                            <label>Estado</label>
                            <select name="status" defaultValue={r.status ?? ""}>
                              <option value="">(igual)</option>
                              <option>Plan</option>
                              <option>En curso</option>
                              <option>Riesgo</option>
                              <option>Hecho</option>
                            </select>
                          </div>
                          <div style={{ gridColumn: "span 2" }}>
                            <label>Nota (bitácora)</label>
                            <input name="note" placeholder="Opcional..." />
                          </div>
                          <div style={{ gridColumn: "1/-1", justifySelf: "end" }}>
                            <button>Actualizar</button>
                          </div>
                        </form>
                      )}

                      {/* Borrar (sin onSubmit cliente) */}
                      <form
                        action={deleteRow}
                        style={{ marginBlockStart: 8, display: "flex", gap: 8, justifyContent: "end" }}
                      >
                        <input type="hidden" name="tableKey" value={tableKey} />
                        <input type="hidden" name="id" value={r[cfg.pk ?? "id"]} />
                        <button className="btn-danger" title="Elimina el registro de forma inmediata">Eliminar</button>
                      </form>
                    </div>
                  </details>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={1 + cfg.fields.length + 1}>
                  <div className="empty">No hay registros.</div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}
