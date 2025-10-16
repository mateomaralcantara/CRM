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
  category: string;
  amount: number | string;
  date: string;
  note?: string | null;
  accounts?: { name: string } | null;
};

function toNum(v: unknown, fallback = 0): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function monthRange(d = new Date()) {
  const start = new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0);
  const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
  return { start, end };
}

function isoDateOnly(d: Date) {
  return d.toISOString().slice(0, 10);
}

// ===== Server Actions =====
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
  };
}) {
  // Datos base
  const [{ data: accountsRaw }, { data: txsRaw }] = await Promise.all([
    supabase.from("accounts").select("*").order("created_at", { ascending: true }),
    supabase.from("transactions").select("*, accounts(name)").order("date", { ascending: false }),
  ]);

  const accounts: Account[] = (accountsRaw ?? []) as Account[];
  const txs: Tx[] = (txsRaw ?? []) as Tx[];

  // KPI del mes actual
  const { start, end } = monthRange(new Date());
  const monthTxs = txs.filter(
    (t) => new Date(t.date) >= start && new Date(t.date) <= end
  );
  const incomes = monthTxs
    .filter((t) => t.kind === "Ingreso")
    .reduce((acc, t) => acc + toNum(t.amount), 0);
  const expenses = monthTxs
    .filter((t) => t.kind !== "Ingreso")
    .reduce((acc, t) => acc + toNum(t.amount), 0);
  const net = incomes - expenses;

  const starting = accounts.reduce((acc, a) => acc + toNum(a.starting_bal), 0);
  const running = starting + txs.reduce((acc, t) => acc + (t.kind === "Ingreso" ? toNum(t.amount) : -toNum(t.amount)), 0);

  // ===== Calculadora de Meta Financiera (por rango y objetivo) =====
  const gFrom = searchParams?.goal_from ?? isoDateOnly(start);
  const gTo = searchParams?.goal_to ?? isoDateOnly(end);
  const gTarget = toNum(searchParams?.goal_target ?? 0, 0);

  const rangeStart = new Date(gFrom + "T00:00:00.000Z");
  const rangeEnd = new Date(gTo + "T23:59:59.999Z");

  const goalTxs = txs.filter(
    (t) => new Date(t.date) >= rangeStart && new Date(t.date) <= rangeEnd
  );

  const goalIncomes = goalTxs
    .filter((t) => t.kind === "Ingreso")
    .reduce((acc, t) => acc + toNum(t.amount), 0);

  const goalPct = gTarget > 0 ? Math.max(0, Math.min(100, (goalIncomes / gTarget) * 100)) : 0;

  // ===== Panel de gastos (presupuesto mensual simple) =====
  const monthlyBudget = toNum(searchParams?.budget ?? 0, 0);
  const usedPct =
    monthlyBudget > 0 ? Math.max(0, Math.min(100, (expenses / monthlyBudget) * 100)) : 0;
  const remaining = Math.max(0, monthlyBudget - expenses);

  return (
    <div className="grid" style={{ gridTemplateColumns: "1fr 1fr", gap: 16 }}>
      {/* Cuentas */}
      <section className="card">
        <h2 style={{ marginBlockStart: 0 }}>Cuentas</h2>
        <form action={createAccount} className="flex" style={{ alignItems: "end" }}>
          <div style={{ flex: 1 }}>
            <label>Nombre</label>
            <input name="name" placeholder="Cuenta Banco" required />
          </div>
          <div>
            <label>Tipo</label>
            <input name="type" defaultValue="Banco" />
          </div>
          <div>
            <label>Saldo inicial</label>
            <input name="starting_bal" type="number" step="0.01" defaultValue={0} />
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
                <td className="right">
                  {toNum(a.starting_bal).toLocaleString("es-DO", {
                    style: "currency",
                    currency: "DOP",
                  })}
                </td>
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
          style={{
            display: "grid",
            gap: 12,
            gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr",
          }}
        >
          <div>
            <label>Cuenta</label>
            <select name="account_id" required>
              <option value="">-- selecciona --</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label>Tipo</label>
            <select name="kind" defaultValue="Egreso">
              <option>Ingreso</option>
              <option>Egreso</option>
              <option>Transferencia</option>
            </select>
          </div>
          <div>
            <label>Categoría</label>
            <input name="category" defaultValue="Otro" />
          </div>
          <div>
            <label>Monto</label>
            <input name="amount" type="number" step="0.01" required />
          </div>
          <div>
            <label>Fecha</label>
            <input name="date" type="date" defaultValue={isoDateOnly(new Date())} />
          </div>
          <div style={{ gridColumn: "1 / -1", justifySelf: "end" }}>
            <button>Registrar</button>
          </div>
        </form>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3,1fr)",
            gap: 12,
            marginTop: 12,
          }}
        >
          <div className="kpi">
            <div>Ingresos (mes)</div>
            <div style={{ fontSize: 24, fontWeight: 800 }}>
              {incomes.toLocaleString("es-DO", { style: "currency", currency: "DOP" })}
            </div>
          </div>
          <div className="kpi">
            <div>Gastos (mes)</div>
            <div style={{ fontSize: 24, fontWeight: 800 }}>
              {expenses.toLocaleString("es-DO", { style: "currency", currency: "DOP" })}
            </div>
          </div>
          <div className="kpi">
            <div>Balance (mes)</div>
            <div style={{ fontSize: 24, fontWeight: 800 }}>
              {net.toLocaleString("es-DO", { style: "currency", currency: "DOP" })}
            </div>
          </div>
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
                <td
                  className="right"
                  style={{ color: t.kind === "Ingreso" ? "#86efac" : "#fca5a5" }}
                >
                  {toNum(t.amount).toLocaleString("es-DO", {
                    style: "currency",
                    currency: "DOP",
                  })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div style={{ marginTop: 12 }}>
          <small>
            Balance estimado total:{" "}
            <strong>
              {running.toLocaleString("es-DO", { style: "currency", currency: "DOP" })}
            </strong>
          </small>
        </div>
      </section>

      {/* Calculadora de meta financiera */}
      <section className="card" style={{ gridColumn: "1 / -1" }}>
        <h2 style={{ marginBlockStart: 0 }}>Meta financiera (rango & objetivo)</h2>
        <form
          method="get"
          className="grid"
          style={{
            gridTemplateColumns: "repeat(5, 1fr)",
            gap: 12,
            alignItems: "end",
          }}
        >
          <div>
            <label>Desde</label>
            <input type="date" name="goal_from" defaultValue={gFrom} />
          </div>
          <div>
            <label>Hasta</label>
            <input type="date" name="goal_to" defaultValue={gTo} />
          </div>
          <div>
            <label>Objetivo RD$</label>
            <input
              type="number"
              name="goal_target"
              step="0.01"
              min={0}
              defaultValue={gTarget}
            />
          </div>
          <div style={{ gridColumn: "1/-1", justifySelf: "end" }}>
            <button type="submit">Calcular progreso</button>
          </div>
        </form>

        <div style={{ marginTop: 12, display: "grid", gap: 8 }}>
          <div>
            Ingresos en rango:{" "}
            <strong>
              {goalIncomes.toLocaleString("es-DO", { style: "currency", currency: "DOP" })}
            </strong>
          </div>
          <div>
            Objetivo:{" "}
            <strong>
              {gTarget.toLocaleString("es-DO", { style: "currency", currency: "DOP" })}
            </strong>
          </div>
          <div className="progress" style={{ marginTop: 8 }}>
            <span style={{ inlineSize: `${goalPct}%` }} />
          </div>
          <small>Avance: {goalPct.toFixed(2)}%</small>
        </div>
      </section>

      {/* Panel de gastos (presupuesto mensual) */}
      <section className="card" style={{ gridColumn: "1 / -1" }}>
        <h2 style={{ marginBlockStart: 0 }}>Panel de gastos (presupuesto mensual)</h2>
        <form method="get" className="flex" style={{ alignItems: "end" }}>
          {/* preserva los parámetros de meta si existieran */}
          <input type="hidden" name="goal_from" value={gFrom} />
          <input type="hidden" name="goal_to" value={gTo} />
          <input type="hidden" name="goal_target" value={String(gTarget)} />
          <div style={{ maxInlineSize: 280 }}>
            <label>Presupuesto del mes (RD$)</label>
            <input type="number" name="budget" step="0.01" min={0} defaultValue={monthlyBudget} />
          </div>
          <div>
            <button type="submit">Aplicar</button>
          </div>
        </form>

        <div style={{ marginTop: 12, display: "grid", gap: 8 }}>
          <div>
            Gastado:{" "}
            <strong>
              {expenses.toLocaleString("es-DO", { style: "currency", currency: "DOP" })}
            </strong>
          </div>
          <div>
            Presupuesto:{" "}
            <strong>
              {monthlyBudget.toLocaleString("es-DO", { style: "currency", currency: "DOP" })}
            </strong>
          </div>
          <div>
            Restante:{" "}
            <strong>
              {remaining.toLocaleString("es-DO", { style: "currency", currency: "DOP" })}
            </strong>
          </div>
          <div className="progress" style={{ marginTop: 8 }}>
            <span style={{ inlineSize: `${usedPct}%` }} />
          </div>
          <small>Usado: {usedPct.toFixed(2)}%</small>
        </div>
      </section>
    </div>
  );
}
