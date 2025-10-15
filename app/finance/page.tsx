// app/finance/page.tsx
import { supabase } from "@/lib/supabase";
import { revalidatePath } from "next/cache";

function monthRange(date = new Date()) {
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 1);
  return { start, end };
}

/* ---------- ACCOUNTS ---------- */
async function createAccount(form: FormData) {
  "use server";
  const name = String(form.get("name") || "").trim();
  const type = String(form.get("type") || "Banco");
  const starting_bal = Number(form.get("starting_bal") || 0);
  if (!name) return;
  const { error } = await supabase.from("accounts").insert({ name, type, starting_bal });
  if (error) throw new Error("Supabase insert (accounts): " + error.message);
  revalidatePath("/finance");
}

/* ---------- TRANSACTIONS ---------- */
async function createTx(form: FormData) {
  "use server";
  const account_id = String(form.get("account_id") || "");
  const kind = String(form.get("kind") || "Egreso");
  const category = String(form.get("category") || "Otro");
  const amount = Number(form.get("amount") || 0);
  const date = String(form.get("date") || "") || new Date().toISOString();
  if (!account_id || !amount) return;
  const { error } = await supabase
    .from("transactions")
    .insert({ account_id, kind, category, amount, date, tags: [] });
  if (error) throw new Error("Supabase insert (transactions): " + error.message);
  revalidatePath("/finance");
}

/* ---------- DEBTS ---------- */
async function createDebt(form: FormData) {
  "use server";
  const concept = String(form.get("concept") || "").trim();
  const creditor = String(form.get("creditor") || "").trim() || null;
  const amount = Number(form.get("amount") || 0);
  const due_date = String(form.get("due_date") || "") || null; // YYYY-MM-DD
  if (!concept || !amount) return;
  const { error } = await supabase
    .from("debts")
    .insert({ concept, creditor, amount, due_date });
  if (error) throw new Error("Supabase insert (debts): " + error.message);
  revalidatePath("/finance");
}

async function payDebt(form: FormData) {
  "use server";
  const debt_id = String(form.get("debt_id") || "");
  const pay_amount = Number(form.get("pay_amount") || 0);
  const paid_at = String(form.get("paid_at") || "") || null; // YYYY-MM-DD
  const note = String(form.get("note") || "").trim() || null;

  if (!debt_id || !pay_amount) return;

  // 1) Registrar pago
  const { error } = await supabase
    .from("debt_payments")
    .insert({ debt_id, amount: pay_amount, note, paid_at: paid_at ? new Date(paid_at).toISOString() : new Date().toISOString() });
  if (error) throw new Error("Supabase insert (debt_payments): " + error.message);

  // 2) Cerrar automáticamente si queda en 0 o menos
  const [{ data: debt, error: e1 }, { data: pays, error: e2 }] = await Promise.all([
    supabase.from("debts").select("amount").eq("id", debt_id).single(),
    supabase.from("debt_payments").select("amount").eq("debt_id", debt_id)
  ]);
  if (e1 || e2) { /* ignore */ } else {
    const paid = (pays ?? []).reduce((acc: number, r: any) => acc + Number(r.amount), 0);
    const remaining = Number(debt?.amount ?? 0) - paid;
    if (remaining <= 0) {
      await supabase.from("debts").update({ status: "Cerrada" }).eq("id", debt_id);
    }
  }

  revalidatePath("/finance");
}

export default async function FinancePage() {
  const now = new Date();
  const { start, end } = monthRange(now);

  const [accRes, txRes, debtRes, payRes] = await Promise.all([
    supabase.from("accounts").select("*").order("created_at", { ascending: true }),
    supabase.from("transactions").select("*, accounts(name)").order("date", { ascending: false }),
    supabase.from("debts").select("*").order("created_at", { ascending: false }),
    supabase.from("debt_payments").select("debt_id, amount")
  ]);

  const accounts = accRes.data ?? [];
  const txs = txRes.data ?? [];
  const debts = debtRes.data ?? [];
  const payments = payRes.data ?? [];

  // KPIs finanzas
  const monthTxs = txs.filter((t: any) => new Date(t.date) >= start && new Date(t.date) < end);
  const incomes = monthTxs.filter((t: any) => t.kind === "Ingreso").reduce((acc: number, t: any) => acc + Number(t.amount), 0);
  const expenses = monthTxs.filter((t: any) => t.kind !== "Ingreso").reduce((acc: number, t: any) => acc + Number(t.amount), 0);
  const net = incomes - expenses;
  const starting = accounts.reduce((acc: number, a: any) => acc + Number(a.starting_bal), 0);
  const running = starting + txs.reduce((acc: number, t: any) => acc + (t.kind === "Ingreso" ? Number(t.amount) : -Number(t.amount)), 0);

  // Saldos deudas
  const paidByDebt = new Map<string, number>();
  (payments as any[]).forEach((p) => paidByDebt.set(p.debt_id, (paidByDebt.get(p.debt_id) || 0) + Number(p.amount)));
  const debtsWithRemaining = (debts as any[]).map((d) => {
    const paid = paidByDebt.get(d.id) || 0;
    return { ...d, paid, remaining: Number(d.amount) - paid };
  });

  return (
    <div className="grid" style={{ gridTemplateColumns: "1fr 1fr" }}>
      {/* === CUENTAS === */}
      <section className="card">
        <h2 style={{ marginTop: 0 }}>Cuentas</h2>
        <form action={createAccount} className="flex" style={{ alignItems: "end" }}>
          <div style={{ flex: 1 }}><label>Nombre</label><input name="name" placeholder="Cuenta Banco" required /></div>
          <div><label>Tipo</label><input name="type" defaultValue="Banco" /></div>
          <div><label>Saldo inicial</label><input name="starting_bal" type="number" step="0.01" defaultValue={0} /></div>
          <div><button>Agregar</button></div>
        </form>
        <table style={{ marginTop: 16 }}>
          <thead><tr><th>Nombre</th><th>Tipo</th><th className="right">Saldo inicial</th></tr></thead>
          <tbody>
            {accounts.map((a: any) => (
              <tr key={a.id}>
                <td>{a.name}</td>
                <td>{a.type}</td>
                <td className="right">{Number(a.starting_bal).toLocaleString('es-DO', { style: 'currency', currency: 'DOP' })}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* === TRANSACCIONES === */}
      <section className="card">
        <h2 style={{ marginTop: 0 }}>Transacciones</h2>
        <form action={createTx} style={{ display: 'grid', gap: 12, gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr' }}>
          <div>
            <label>Cuenta</label>
            <select name="account_id" required>
              <option value="">-- selecciona --</option>
              {accounts.map((a: any) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </div>
          <div><label>Tipo</label><select name="kind"><option>Ingreso</option><option>Egreso</option><option>Transferencia</option></select></div>
          <div><label>Categoría</label><input name="category" defaultValue="Otro" /></div>
          <div><label>Monto</label><input name="amount" type="number" step="0.01" required /></div>
          <div><label>Fecha</label><input name="date" type="date" /></div>
          <div style={{ gridColumn: '1/-1', justifySelf: 'end' }}><button>Registrar</button></div>
        </form>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginTop: 12 }}>
          <div className="kpi"><div>Ingresos (mes)</div><div style={{ fontSize: 24, fontWeight: 800 }}>{incomes.toLocaleString('es-DO', { style: 'currency', currency: 'DOP' })}</div></div>
          <div className="kpi"><div>Gastos (mes)</div><div style={{ fontSize: 24, fontWeight: 800 }}>{expenses.toLocaleString('es-DO', { style: 'currency', currency: 'DOP' })}</div></div>
          <div className="kpi"><div>Balance (mes)</div><div style={{ fontSize: 24, fontWeight: 800 }}>{net.toLocaleString('es-DO', { style: 'currency', currency: 'DOP' })}</div></div>
        </div>

        <table style={{ marginTop: 16 }}>
          <thead><tr><th>Fecha</th><th>Cuenta</th><th>Tipo</th><th>Categoría</th><th className="right">Monto</th></tr></thead>
          <tbody>
            {txs.map((t: any) => (
              <tr key={t.id}>
                <td>{new Date(t.date).toLocaleDateString('es-DO')}</td>
                <td>{t.accounts?.name ?? '-'}</td>
                <td>{t.kind}</td>
                <td>{t.category}</td>
                <td className="right" style={{ color: t.kind === "Ingreso" ? "#86efac" : "#fca5a5" }}>
                  {Number(t.amount).toLocaleString('es-DO', { style: 'currency', currency: 'DOP' })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div style={{ marginTop: 12 }}>
          <small>Balance estimado total: <strong>{running.toLocaleString('es-DO', { style: 'currency', currency: 'DOP' })}</strong></small>
        </div>
      </section>

      {/* === DEUDA === */}
      <section className="card" style={{ gridColumn: "1 / -1" }}>
        <h2 style={{ marginTop: 0 }}>Deuda</h2>

        {/* Alta de deuda */}
        <form action={createDebt} style={{ display: 'grid', gap: 12, gridTemplateColumns: '2fr 1fr 1fr 1fr' }}>
          <div><label>Concepto</label><input name="concept" placeholder="Ej: Préstamo laptop" required /></div>
          <div><label>Acreedor</label><input name="creditor" placeholder="Banco X / Persona" /></div>
          <div><label>Monto</label><input name="amount" type="number" step="0.01" required /></div>
          <div><label>Vence</label><input name="due_date" type="date" /></div>
          <div style={{ gridColumn: '1/-1', justifySelf: 'end' }}><button>Agregar deuda</button></div>
        </form>

        {/* Tabla de deudas + pago inline */}
        <table style={{ marginTop: 16 }}>
          <thead>
            <tr>
              <th>Concepto</th>
              <th>Acreedor</th>
              <th className="right">Monto inicial</th>
              <th className="right">Pagado</th>
              <th className="right">Pendiente</th>
              <th>Vence</th>
              <th>Estado</th>
              <th className="right">Pagar</th>
            </tr>
          </thead>
          <tbody>
            {debtsWithRemaining.map((d: any) => (
              <tr key={d.id}>
                <td>{d.concept}</td>
                <td>{d.creditor ?? "-"}</td>
                <td className="right">{Number(d.amount).toLocaleString('es-DO', { style: 'currency', currency: 'DOP' })}</td>
                <td className="right">{Number(d.paid).toLocaleString('es-DO', { style: 'currency', currency: 'DOP' })}</td>
                <td className="right" style={{ color: d.remaining > 0 ? "#fca5a5" : "#86efac", fontWeight: 700 }}>
                  {Number(d.remaining).toLocaleString('es-DO', { style: 'currency', currency: 'DOP' })}
                </td>
                <td>{d.due_date ? new Date(d.due_date).toLocaleDateString('es-DO') : "-"}</td>
                <td><span className="badge">{d.status}</span></td>
                <td>
                  <form action={payDebt} className="flex" style={{ justifyContent: "end" }}>
                    <input type="hidden" name="debt_id" value={d.id} />
                    <input name="pay_amount" type="number" step="0.01" placeholder="Monto" required style={{ width: 120 }} />
                    <input name="paid_at" type="date" />
                    <input name="note" placeholder="Nota (opcional)" style={{ width: 160 }} />
                    <button>Registrar pago</button>
                  </form>
                </td>
              </tr>
            ))}
            {debtsWithRemaining.length === 0 && (
              <tr><td colSpan={8}><div className="empty">Sin deudas registradas.</div></td></tr>
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}
