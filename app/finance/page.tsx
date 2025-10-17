// app/finance/page.tsx
export const revalidate = 0;
export const dynamic = "force-dynamic";

import { supabase } from "@/lib/supabase";
import { revalidatePath } from "next/cache";

// ===== Tipos mínimos y utilidades =====
type Account = {
  id: string;
  name: string;
  type: string;
  starting_bal: number | string;
  created_at: string;
};

type Tx = {
  id: string;
  account_id: string;
  kind: "Ingreso" | "Egreso" | "Transferencia";
  category: string; // lo usaremos como "concepto" en gasto diario
  amount: number | string;
  date: string;
  note?: string | null;
  accounts?: { name: string } | null;
};

type Receivable = {
  id: string;
  date: string;            // DATE
  client: string;
  concept: string;
  amount: number | string;
  status: "Pendiente" | "Cobrado" | "Anulado";
  paid_at?: string | null; // timestamptz
};

function toNum(v: unknown, fallback = 0): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

/** RD$ con coma de miles y punto decimal: RD$0.00 / 0,000,000.00 */
function formatDOP(value: number): string {
  const sign = value < 0 ? "-" : "";
  const abs = Math.abs(value);
  const s = abs.toFixed(2);
  const [intPart = "0", decPart = "00"] = s.split(".");
  const intFmt = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `${sign}RD$${intFmt}.${decPart}`;
}
function todayISO() {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

function monthRange(d = new Date()) {
  const start = new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0);
  const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
  return { start, end };
}

function isoDateOnly(d: Date) {
  return d.toISOString().slice(0, 10);
}

// ===== Server Actions (Cuentas / Transacciones) =====
async function createAccount(form: FormData) {
  "use server";
  const name = String(form.get("name") ?? "").trim();
  const type = String(form.get("type") ?? "Banco");
  const starting_bal = toNum(form.get("starting_bal") ?? 0, 0);
  if (!name) return;
  const { error } = await supabase.from("accounts").insert({ name, type, starting_bal });
  if (error) throw new Error("No se pudo crear la cuenta: " + error.message);
  revalidatePath("/finance");
}

async function createTx(form: FormData) {
  "use server";
  const account_id = String(form.get("account_id") ?? "");
  const kind = String(form.get("kind") ?? "Egreso") as Tx["kind"];
  const category = String(form.get("category") ?? "Otro");
  const amount = toNum(form.get("amount") ?? 0, 0);
  const dateStr = String(form.get("date") ?? "");
  const date = dateStr ? new Date(dateStr).toISOString() : new Date().toISOString();
  if (!account_id || !Number.isFinite(amount)) return;
  const { error } = await supabase
    .from("transactions")
    .insert({ account_id, kind, category, amount, date, tags: [] });
  if (error) throw new Error("No se pudo registrar la transacción: " + error.message);
  revalidatePath("/finance");
}

// ===== Server Actions (Cobros pendientes) =====
async function createReceivable(form: FormData) {
  "use server";
  const date = String(form.get("date") ?? todayISO());
  const client = String(form.get("client") ?? "").trim();
  const concept = String(form.get("concept") ?? "").trim();
  const amount = toNum(form.get("amount"), 0);
  if (!client || !concept || amount <= 0) return;

  const { error } = await supabase
    .from("receivables")
    .insert({ date, client, concept, amount, status: "Pendiente" });
  if (error) throw new Error("No se pudo crear el cobro: " + error.message);

  revalidatePath("/finance");
}

async function settleReceivable(form: FormData) {
  "use server";
  const id = String(form.get("id") ?? "");
  if (!id) return;

  const { error } = await supabase
    .from("receivables")
    .update({ status: "Cobrado", paid_at: new Date().toISOString() })
    .eq("id", id);

  if (error) throw new Error("No se pudo marcar como cobrado: " + error.message);

  revalidatePath("/finance");
}

async function deleteReceivable(form: FormData) {
  "use server";
  const id = String(form.get("id") ?? "");
  if (!id) return;
  const { error } = await supabase.from("receivables").delete().eq("id", id);
  if (error) throw new Error("No se pudo eliminar: " + error.message);
  revalidatePath("/finance");
}

// ===== Server Action (Gasto diario - crea hasta 2 transacciones) =====
async function createDailyEntry(form: FormData) {
  "use server";
  const account_id = String(form.get("d_account_id") ?? "");
  const dateStr = String(form.get("d_date") ?? todayISO());
  const concept = String(form.get("d_concept") ?? "").trim();
  const inc = toNum(form.get("d_income") ?? 0, 0);
  const exp = toNum(form.get("d_expense") ?? 0, 0);

  if (!account_id || !concept || (inc <= 0 && exp <= 0)) return;

  const date = new Date(`${dateStr}T12:00:00.000Z`).toISOString(); // evita desfases TZ
  const rows: Partial<Tx>[] = [];
  if (inc > 0) rows.push({ account_id, kind: "Ingreso", category: concept, amount: inc, date } as any);
  if (exp > 0) rows.push({ account_id, kind: "Egreso",  category: concept, amount: exp, date } as any);

  const { error } = await supabase.from("transactions").insert(rows as any[]);
  if (error) throw new Error("No se pudo registrar el gasto diario: " + error.message);

  revalidatePath("/finance");
}

// ===== Página =====
export default async function FinancePage({
  searchParams,
}: {
  searchParams?: {
    // Calculadora de meta financiera
    goal_from?: string;
    goal_to?: string;
    goal_target?: string;
    // Panel de gastos
    budget?: string;
    // Gasto diario
    daily_date?: string;
  };
}) {
  // Datos base
  const [{ data: accountsRaw }, { data: txsRaw }, { data: recRaw, error: recErr }] =
    await Promise.all([
      supabase.from("accounts").select("*").order("created_at", { ascending: true }),
      supabase.from("transactions").select("*, accounts(name)").order("date", { ascending: false }),
      supabase.from("receivables").select("*").order("date", { ascending: false }),
    ]);

  const accounts: Account[] = (accountsRaw ?? []) as Account[];
  const txs: Tx[] = (txsRaw ?? []) as Tx[];
  const receivables: Receivable[] = (recRaw ?? []) as Receivable[];

  // KPI del mes actual
  const { start, end } = monthRange(new Date());
  const monthTxs = txs.filter((t) => {
    const d = new Date(t.date);
    return d >= start && d <= end;
  });
  const incomes = monthTxs.filter(t => t.kind === "Ingreso").reduce((acc, t) => acc + toNum(t.amount), 0);
  const expenses = monthTxs.filter(t => t.kind !== "Ingreso").reduce((acc, t) => acc + toNum(t.amount), 0);
  const net = incomes - expenses;

  const starting = accounts.reduce((acc, a) => acc + toNum(a.starting_bal), 0);
  const running =
    starting +
    txs.reduce((acc, t) => acc + (t.kind === "Ingreso" ? toNum(t.amount) : -toNum(t.amount)), 0);

  // ===== Calculadora de Meta Financiera (por rango y objetivo) =====
  const gFrom = searchParams?.goal_from ?? isoDateOnly(start);
  const gTo = searchParams?.goal_to ?? isoDateOnly(end);
  const gTarget = toNum(searchParams?.goal_target ?? 0, 0);

  const rangeStart = new Date(gFrom + "T00:00:00.000Z");
  const rangeEnd = new Date(gTo + "T23:59:59.999Z");

  const goalTxs = txs.filter((t) => {
    const d = new Date(t.date);
    return d >= rangeStart && d <= rangeEnd;
  });
  const goalIncomes = goalTxs.filter(t => t.kind === "Ingreso").reduce((a, t) => a + toNum(t.amount), 0);
  const goalPct = gTarget > 0 ? Math.max(0, Math.min(100, (goalIncomes / gTarget) * 100)) : 0;

  // ===== Panel de gastos (presupuesto mensual simple) =====
  const monthlyBudget = toNum(searchParams?.budget ?? 0, 0);
  const usedPct = monthlyBudget > 0 ? Math.max(0, Math.min(100, (expenses / monthlyBudget) * 100)) : 0;
  const remaining = Math.max(0, monthlyBudget - expenses);

  // ===== Cobros pendientes =====
  const pending = receivables.filter((r) => r.status === "Pendiente");
  const totalPending = pending.reduce((a, r) => a + toNum(r.amount), 0);

  // ===== Gasto diario (por fecha seleccionada) =====
  const dailyDate = searchParams?.daily_date ?? todayISO();
  const dayStart = new Date(`${dailyDate}T00:00:00.000Z`);
  const dayEnd = new Date(`${dailyDate}T23:59:59.999Z`);
  const dayTxs = txs.filter((t) => {
    const d = new Date(t.date);
    return d >= dayStart && d <= dayEnd;
  });
  const dayInc = dayTxs.filter(t => t.kind === "Ingreso").reduce((a, t) => a + toNum(t.amount), 0);
  const dayExp = dayTxs.filter(t => t.kind !== "Ingreso").reduce((a, t) => a + toNum(t.amount), 0);
  const dayRest = dayInc - dayExp;

  return (
    <div className="grid" style={{ gridTemplateColumns: "1fr 1fr", gap: 16 }}>
      {/* Cuentas */}
      <section className="card">
        <h2 style={{ marginBlockStart: 0 }}>Cuentas</h2>
        <form action={createAccount} className="flex" style={{ alignItems: "end" }}>
          <div style={{ flex: 1 }}>
            <label htmlFor="acc-name">Nombre</label>
            <input id="acc-name" name="name" placeholder="Cuenta Banco" required />
          </div>
          <div>
            <label htmlFor="acc-type">Tipo</label>
            <input id="acc-type" name="type" defaultValue="Banco" />
          </div>
          <div>
            <label htmlFor="acc-sbal">Saldo inicial</label>
            <input id="acc-sbal" name="starting_bal" type="number" step="0.01" defaultValue={0} />
          </div>
          <div>
            <button>Agregar</button>
          </div>
        </form>

        <table style={{ marginTop: 16 }}>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Tipo</th>
              <th className="right">Saldo inicial</th>
            </tr>
          </thead>
          <tbody>
            {accounts.map((a) => (
              <tr key={a.id}>
                <td>{a.name}</td>
                <td>{a.type}</td>
                <td className="right">{formatDOP(toNum(a.starting_bal))}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* Transacciones */}
      <section className="card">
        <h2 style={{ marginBlockStart: 0 }}>Transacciones</h2>
        <form
          action={createTx}
          style={{ display: "grid", gap: 12, gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr" }}
        >
          <div>
            <label htmlFor="tx-acc">Cuenta</label>
            <select id="tx-acc" name="account_id" required>
              <option value="">-- selecciona --</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="tx-kind">Tipo</label>
            <select id="tx-kind" name="kind" defaultValue="Egreso">
              <option>Ingreso</option>
              <option>Egreso</option>
              <option>Transferencia</option>
            </select>
          </div>
          <div>
            <label htmlFor="tx-cat">Categoría</label>
            <input id="tx-cat" name="category" defaultValue="Otro" />
          </div>
          <div>
            <label htmlFor="tx-amount">Monto</label>
            <input id="tx-amount" name="amount" type="number" step="0.01" required />
          </div>
          <div>
            <label htmlFor="tx-date">Fecha</label>
            <input id="tx-date" name="date" type="date" defaultValue={isoDateOnly(new Date())} />
          </div>
          <div style={{ gridColumn: "1 / -1", justifySelf: "end" }}>
            <button>Registrar</button>
          </div>
        </form>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginTop: 12 }}>
          <div className="kpi"><div>Ingresos (mes)</div><div style={{ fontSize: 24, fontWeight: 800 }}>{formatDOP(incomes)}</div></div>
          <div className="kpi"><div>Gastos (mes)</div><div style={{ fontSize: 24, fontWeight: 800 }}>{formatDOP(expenses)}</div></div>
          <div className="kpi"><div>Balance (mes)</div><div style={{ fontSize: 24, fontWeight: 800 }}>{formatDOP(net)}</div></div>
        </div>

        <table style={{ marginTop: 16 }}>
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Cuenta</th>
              <th>Tipo</th>
              <th>Categoría</th>
              <th className="right">Monto</th>
            </tr>
          </thead>
          <tbody>
            {txs.map((t) => (
              <tr key={t.id}>
                <td>{new Date(t.date).toLocaleDateString("es-DO")}</td>
                <td>{t.accounts?.name ?? "-"}</td>
                <td>{t.kind}</td>
                <td>{t.category}</td>
                <td className="right" style={{ color: t.kind === "Ingreso" ? "#16a34a" : "#dc2626" }}>
                  {formatDOP(toNum(t.amount))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div style={{ marginTop: 12 }}>
          <small>Balance estimado total: <strong>{formatDOP(running)}</strong></small>
        </div>
      </section>

      {/* Calculadora de meta financiera */}
      <section className="card" style={{ gridColumn: "1 / -1" }}>
        <h2 style={{ marginBlockStart: 0 }}>Meta financiera (rango & objetivo)</h2>
        <form method="get" className="grid" style={{ gridTemplateColumns: "repeat(5, 1fr)", gap: 12, alignItems: "end" }}>
          <div>
            <label htmlFor="gf">Desde</label>
            <input id="gf" type="date" name="goal_from" defaultValue={gFrom} />
          </div>
          <div>
            <label htmlFor="gt">Hasta</label>
            <input id="gt" type="date" name="goal_to" defaultValue={gTo} />
          </div>
          <div>
            <label htmlFor="gtarget">Objetivo RD$</label>
            <input id="gtarget" type="number" name="goal_target" step="0.01" min={0} defaultValue={gTarget} />
          </div>
          <div style={{ gridColumn: "1/-1", justifySelf: "end" }}>
            <button type="submit">Calcular progreso</button>
          </div>
        </form>

        <div style={{ marginTop: 12, display: "grid", gap: 8 }}>
          <div>Ingresos en rango: <strong>{formatDOP(goalIncomes)}</strong></div>
          <div>Objetivo: <strong>{formatDOP(gTarget)}</strong></div>
          <div className="progress" style={{ marginTop: 8 }}><span style={{ width: `${goalPct}%` }} /></div>
          <small>Avance: {goalPct.toFixed(2)}%</small>
        </div>
      </section>

      {/* Panel de gastos (presupuesto mensual) */}
      <section className="card" style={{ gridColumn: "1 / -1" }}>
        <h2 style={{ marginBlockStart: 0 }}>Panel de gastos (presupuesto mensual)</h2>
        <form method="get" className="flex" style={{ alignItems: "end", gap: 12 }}>
          {/* preserva los parámetros de meta si existieran */}
          <input type="hidden" name="goal_from" value={gFrom} />
          <input type="hidden" name="goal_to" value={gTo} />
          <input type="hidden" name="goal_target" value={String(gTarget)} />
          <div style={{ maxWidth: 280 }}>
            <label htmlFor="mbudget">Presupuesto del mes (RD$)</label>
            <input id="mbudget" type="number" name="budget" step="0.01" min={0} defaultValue={monthlyBudget} />
          </div>
          <div><button type="submit">Aplicar</button></div>
        </form>

        <div style={{ marginTop: 12, display: "grid", gap: 8 }}>
          <div>Gastado: <strong>{formatDOP(expenses)}</strong></div>
          <div>Presupuesto: <strong>{formatDOP(monthlyBudget)}</strong></div>
          <div>Restante: <strong>{formatDOP(remaining)}</strong></div>
          <div className="progress" style={{ marginTop: 8 }}><span style={{ width: `${usedPct}%` }} /></div>
          <small>Usado: {usedPct.toFixed(2)}%</small>
        </div>
      </section>

      {/* =================== COBROS PENDIENTES =================== */}
      <section className="card" style={{ gridColumn: "1 / -1" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <h2 style={{ marginBlockStart: 0 }}>Cobros pendientes</h2>
          {recErr && <small style={{ color: "#fca5a5" }}>Error: {recErr.message}</small>}
        </div>

        {/* Crear nuevo cobro */}
        <form action={createReceivable} className="grid" style={{ gridTemplateColumns: "repeat(4,1fr)", gap: 12 }}>
          <div><label htmlFor="rc-date">Fecha</label><input id="rc-date" name="date" type="date" defaultValue={todayISO()} required /></div>
          <div><label htmlFor="rc-client">Cliente</label><input id="rc-client" name="client" placeholder="Nombre del cliente" required /></div>
          <div><label htmlFor="rc-concept">Concepto</label><input id="rc-concept" name="concept" placeholder="Descripción / concepto" required /></div>
          <div><label htmlFor="rc-amount">Monto</label><input id="rc-amount" name="amount" type="number" step="0.01" min={0} placeholder="0.00" required /></div>
          <div style={{ gridColumn: "1/-1", justifySelf: "end" }}><button>Agregar cobro</button></div>
        </form>

        {/* Tabla de pendientes */}
        <table style={{ marginBlockStart: 12 }}>
          <thead>
            <tr>
              <th>Fecha</th><th>Cliente</th><th>Concepto</th><th className="right">Monto</th><th className="right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {pending.map((r) => (
              <tr key={r.id}>
                <td>{new Date(r.date).toLocaleDateString("es-DO")}</td>
                <td>{r.client}</td>
                <td>{r.concept}</td>
                <td className="right">{formatDOP(toNum(r.amount))}</td>
                <td className="right">
                  <div className="flex" style={{ justifyContent: "end", gap: 8 }}>
                    <form action={settleReceivable}><input type="hidden" name="id" value={r.id} /><button className="btn-secondary">Cobrar</button></form>
                    <form action={deleteReceivable}><input type="hidden" name="id" value={r.id} /><button className="btn-danger">Eliminar</button></form>
                  </div>
                </td>
              </tr>
            ))}
            {pending.length === 0 && (<tr><td colSpan={5}><div className="empty">Sin cobros pendientes.</div></td></tr>)}
          </tbody>
          <tfoot>
            <tr><th colSpan={3} className="right">Total pendiente:</th><th className="right">{formatDOP(totalPending)}</th><th /></tr>
          </tfoot>
        </table>
      </section>

      {/* =================== GASTO DIARIO =================== */}
      <section className="card" style={{ gridColumn: "1 / -1" }}>
        <h2 style={{ marginBlockStart: 0 }}>Gasto diario</h2>

        {/* Filtro de fecha del diario */}
        <form method="get" className="flex" style={{ alignItems: "end", gap: 12 }}>
          {/* preserva otros parámetros */}
          <input type="hidden" name="goal_from" value={gFrom} />
          <input type="hidden" name="goal_to" value={gTo} />
          <input type="hidden" name="goal_target" value={String(gTarget)} />
          <input type="hidden" name="budget" value={String(monthlyBudget)} />
          <div>
            <label htmlFor="dsel-date">Fecha</label>
            <input id="dsel-date" type="date" name="daily_date" defaultValue={dailyDate} />
          </div>
          <div><button type="submit">Ver día</button></div>
        </form>

        {/* Alta rápida: crea ingreso y/o gasto para la fecha */}
        <form action={createDailyEntry} className="grid" style={{ marginTop: 12, gap: 12, gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr" }}>
          <input type="hidden" name="d_date" value={dailyDate} />
          <div>
            <label htmlFor="d-acc">Cuenta</label>
            <select id="d-acc" name="d_account_id" required>
              <option value="">-- selecciona --</option>
              {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="d-concept">Concepto</label>
            <input id="d-concept" name="d_concept" placeholder="Ej.: Almuerzo / Venta X" required />
          </div>
          <div>
            <label htmlFor="d-inc">Ingreso RD$</label>
            <input id="d-inc" name="d_income" type="number" step="0.01" min={0} placeholder="0.00" />
          </div>
          <div>
            <label htmlFor="d-exp">Gasto RD$</label>
            <input id="d-exp" name="d_expense" type="number" step="0.01" min={0} placeholder="0.00" />
          </div>
          <div style={{ alignSelf: "end", justifySelf: "end" }}>
            <button>Agregar al día</button>
          </div>
        </form>

        {/* Tabla del día */}
        <table style={{ marginTop: 12 }}>
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Concepto</th>
              <th className="right">Ingreso</th>
              <th className="right">Gasto</th>
            </tr>
          </thead>
          <tbody>
            {dayTxs.map((t) => (
              <tr key={t.id}>
                <td>{new Date(t.date).toLocaleTimeString("es-DO", { hour: "2-digit", minute: "2-digit" })}</td>
                <td>{t.category}</td>
                <td className="right">{t.kind === "Ingreso" ? formatDOP(toNum(t.amount)) : ""}</td>
                <td className="right">{t.kind !== "Ingreso" ? formatDOP(toNum(t.amount)) : ""}</td>
              </tr>
            ))}
            {dayTxs.length === 0 && (
              <tr><td colSpan={4}><div className="empty">Sin movimientos para {new Date(dailyDate).toLocaleDateString("es-DO")}.</div></td></tr>
            )}
          </tbody>
          <tfoot>
            <tr>
              <th colSpan={2} className="right">Totales del día:</th>
              <th className="right">{formatDOP(dayInc)}</th>
              <th className="right">{formatDOP(dayExp)}</th>
            </tr>
            <tr>
              <th colSpan={2} className="right">Restante (Ingresos − Gastos):</th>
              <th colSpan={2} className="right">{formatDOP(dayRest)}</th>
            </tr>
          </tfoot>
        </table>
      </section>
    </div>
  );
}
