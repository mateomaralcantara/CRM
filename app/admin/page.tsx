// app/admin/page.tsx
import { supabase } from "@/lib/supabase";
import { revalidatePath } from "next/cache";

// ---------- Config del CRUD (una sola vez aquí) ----------
type Field =
  | { name: string; label: string; kind: "text" | "number" | "date" | "datetime" }
  | { name: string; label: string; kind: "select"; options: string[] }
  | { name: string; label: string; kind: "uuid" }
  | { name: string; label: string; kind: "array:text" };

type TableCfg = {
  name: string;        // nombre exacto de la tabla en Supabase
  label: string;       // etiqueta en UI
  pk?: string;         // primary key (default: "id")
  orderBy?: string;    // para ordenar (default: created_at desc)
  fields: Field[];     // columnas editables/creables
};

// Lista canónica de tablas (para narrow estricto)
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
] as const;
type TableKey = typeof TABLE_KEYS[number];

// Config por tabla (tipado contra TableKey)
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
      { name: "end", label: "Fin", kind: "datetime" }, // columna "end" existe en tu esquema
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
};

// Helpers
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
    case "date": return s; // YYYY-MM-DD ok para DATE
    case "datetime": return toIsoMaybe(s);
    case "array:text": return s.split(",").map(t => t.trim()).filter(Boolean);
    default: return s; // text, select, uuid
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

// ---------- UI ----------
export default async function AdminPage({ searchParams }: { searchParams?: { t?: string } }) {
  const rawKey = searchParams?.t ?? "tasks";
  const tableKey: TableKey = isTableKey(rawKey) ? rawKey : "tasks";
  const cfg = TABLES[tableKey];

  const orderBy = cfg.orderBy ?? "created_at";
  const { data: rowsRaw, error } =
    await supabase.from(cfg.name).select("*").order(orderBy, { ascending: false }).limit(50);

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
                  {f.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              ) : f.kind === "datetime" ? (
                <input name={f.name} type="datetime-local" />
              ) : f.kind === "date" ? (
                <input name={f.name} type="date" />
              ) : f.kind === "number" ? (
                <input name={f.name} type="number" step="0.01" />
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
              {cfg.fields.map(f => <th key={`head-${f.name}`}>{f.label}</th>)}
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
                  if (f.kind === "array:text") {
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
                      {/* Editar */}
                      <form action={updateRow} className="grid" style={{ gridTemplateColumns: "repeat(3,1fr)", gap: 8, alignItems: "end" }}>
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
                                  {f.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                </select>
                              ) : f.kind === "datetime" ? (
                                <input
                                  name={inputName}
                                  type="datetime-local"
                                  defaultValue={val ? new Date(val).toISOString().slice(0,16) : ""}
                                />
                              ) : f.kind === "date" ? (
                                <input
                                  name={inputName}
                                  type="date"
                                  defaultValue={val ? new Date(val).toISOString().slice(0,10) : ""}
                                />
                              ) : f.kind === "number" ? (
                                <input name={inputName} type="number" step="0.01" defaultValue={val !== null ? String(val) : ""} />
                              ) : f.kind === "array:text" ? (
                                <input name={inputName} defaultValue={Array.isArray(val) ? val.join(", ") : ""} />
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

                      {/* Borrar */}
                      <form action={deleteRow} style={{ marginBlockStart: 8, display: "flex", gap: 8, justifyContent: "end" }}>
                        <input type="hidden" name="tableKey" value={tableKey} />
                        <input type="hidden" name="id" value={r[cfg.pk ?? "id"]} />
                        <button className="btn-danger">Eliminar</button>
                      </form>
                    </div>
                  </details>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><td colSpan={1 + cfg.fields.length + 1}><div className="empty">No hay registros.</div></td></tr>
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}
