// app/debts/page.tsx
export const revalidate = 0;
export const dynamic = "force-dynamic";

import { supabase } from "@/lib/supabase";
import { revalidatePath } from "next/cache";

/* ===================== utils ===================== */
function toNum(v: unknown, f = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : f;
}
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

/* ===================== types ===================== */
type Debt = {
  id: string;
  concept: string;
  creditor: string;
  amount: number;
  status: "Abierta" | "Cerrada";
  due_date: string | null; // YYYY-MM-DD
  created_at: string;
};
type DebtPayment = {
  id: string;
  debt_id: string;
  amount: number;
  paid_at: string; // timestamptz
  note: string | null;
};

/* =========== helpers server (estado) =========== */
async function recomputeStatusForDebt(debt_id: string) {
  // Lee monto de la deuda
  const { data: d, error: dErr } = await supabase
    .from("debts")
    .select("amount,status")
    .eq("id", debt_id)
    .single();
  if (dErr || !d) return;
  // Suma pagos
  const { data: ps } = await supabase
    .from("debt_payments")
    .select("amount")
    .eq("debt_id", debt_id);
  const paid = (ps ?? []).reduce((a, r: any) => a + toNum(r.amount), 0);
  const should = paid >= toNum(d.amount) ? "Cerrada" : "Abierta";
  if (should !== d.status) {
    await supabase.from("debts").update({ status: should }).eq("id", debt_id);
  }
}

/* ================= server actions ================= */
async function createDebt(form: FormData) {
  "use server";
  const concept = String(form.get("concept") ?? "").trim();
  const creditor = String(form.get("creditor") ?? "").trim();
  const amount = toNum(form.get("amount"), 0);
  const due_date = (form.get("due_date") as string) || null;
  if (!concept || !creditor || amount <= 0) return;
  const { error } = await supabase.from("debts").insert({
    concept, creditor, amount, status: "Abierta", due_date,
  });
  if (error) throw new Error("No se pudo crear la deuda: " + error.message);
  revalidatePath("/debts");
}

async function addPayment(form: FormData) {
  "use server";
  const debt_id = String(form.get("debt_id") ?? "");
  const amount = toNum(form.get("amount"), 0);
  const paid_at = String(form.get("paid_at") ?? todayISO());
  const note = String(form.get("note") ?? "").trim() || null;
  if (!debt_id || amount <= 0) return;

  const { error } = await supabase.from("debt_payments").insert({
    debt_id, amount, paid_at: new Date(paid_at + "T12:00:00Z").toISOString(), note,
  });
  if (error) throw new Error("No se pudo registrar el pago: " + error.message);

  await recomputeStatusForDebt(debt_id);
  revalidatePath("/debts");
}

async function deletePayment(form: FormData) {
  "use server";
  const id = String(form.get("id") ?? "");
  const debt_id = String(form.get("debt_id") ?? "");
  if (!id) return;
  const { error } = await supabase.from("debt_payments").delete().eq("id", id);
  if (error) throw new Error("No se pudo eliminar el pago: " + error.message);

  if (debt_id) await recomputeStatusForDebt(debt_id);
  revalidatePath("/debts");
}

async function adjustDebtAmount(form: FormData) {
  "use server";
  const id = String(form.get("id") ?? "");
  const amount = toNum(form.get("amount"), NaN);
  if (!id || !Number.isFinite(amount) || amount < 0) return;

  const { error } = await supabase.from("debts").update({ amount }).eq("id", id);
  if (error) throw new Error("No se pudo ajustar el monto: " + error.message);

  await recomputeStatusForDebt(id);
  revalidatePath("/debts");
}

async function toggleDebt(form: FormData) {
  "use server";
  const id = String(form.get("id") ?? "");
  const to = String(form.get("to") ?? "Abierta") as Debt["status"];
  if (!id) return;
  const { error } = await supabase.from("debts").update({ status: to }).eq("id", id);
  if (error) throw new Error("No se pudo cambiar estado: " + error.message);
  revalidatePath("/debts");
}

async function deleteDebt(form: FormData) {
  "use server";
  const id = String(form.get("id") ?? "");
  if (!id) return;
  await supabase.from("debt_payments").delete().eq("debt_id", id);
  const { error } = await supabase.from("debts").delete().eq("id", id);
  if (error) throw new Error("No se pudo eliminar la deuda: " + error.message);
  revalidatePath("/debts");
}

/* ===================== page ===================== */
export default async function DebtsPage() {
  // Cargar deudas + pagos
  const [{ data: debtsRaw }, { data: paymentsRaw }] = await Promise.all([
    supabase.from("debts").select("*").order("created_at", { ascending: false }),
    supabase.from("debt_payments").select("*").order("paid_at", { ascending: false }),
  ]);

  const debts: Debt[] = (debtsRaw ?? []) as any;
  const payments: DebtPayment[] = (paymentsRaw ?? []) as any;

  // Índice pagos por deuda
  const byDebt = new Map<string, DebtPayment[]>();
  for (const p of payments) {
    const arr = byDebt.get(p.debt_id) ?? [];
    arr.push(p);
    byDebt.set(p.debt_id, arr);
  }

  // Totales
  const rows = debts.map((d) => {
    const ps = byDebt.get(d.id) ?? [];
    const paid = ps.reduce((a, p) => a + toNum(p.amount), 0);
    const remaining = Math.max(0, toNum(d.amount) - paid);
    const pct = toNum(d.amount) > 0 ? Math.min(100, (paid / toNum(d.amount)) * 100) : 0;
    return { d, ps, paid, remaining, pct };
  });

  const totalDebt = rows.reduce((a, r) => a + toNum(r.d.amount), 0);
  const totalPaid = rows.reduce((a, r) => a + r.paid, 0);
  const totalRemain = rows.reduce((a, r) => a + r.remaining, 0);
  const totalPct = totalDebt > 0 ? (totalPaid / totalDebt) * 100 : 0;

  return (
    <div className="grid" style={{ gridTemplateColumns: "1fr", gap: 16 }}>
      {/* KPIs */}
      <div className="kpis" style={{ gridTemplateColumns: "repeat(4, minmax(0,1fr))" }}>
        <div className="kpi">
          <div>Total Deudas</div>
          <div style={{ fontSize: 24, fontWeight: 800 }}>{formatDOP(totalDebt)}</div>
        </div>
        <div className="kpi">
          <div>Total Pagado</div>
          <div style={{ fontSize: 24, fontWeight: 800 }}>{formatDOP(totalPaid)}</div>
        </div>
        <div className="kpi">
          <div>Restante</div>
          <div style={{ fontSize: 24, fontWeight: 800 }}>{formatDOP(totalRemain)}</div>
        </div>
        <div className="kpi">
          <div>% Global</div>
          <div style={{ fontSize: 24, fontWeight: 800 }}>{totalPct.toFixed(1)}%</div>
        </div>
      </div>

      {/* Nueva deuda */}
      <section className="card">
        <h2 style={{ marginBlockStart: 0 }}>Nueva deuda</h2>
        <form action={createDebt} className="grid" style={{ gridTemplateColumns: "repeat(4,1fr)", gap: 12 }}>
          <div><label>Concepto</label><input name="concept" placeholder="Ej.: Préstamo equipo" required /></div>
          <div><label>Acreedor</label><input name="creditor" placeholder="Ej.: Banco X" required /></div>
          <div><label>Monto</label><input name="amount" type="number" step="0.01" min={0} required /></div>
          <div><label>Vence</label><input name="due_date" type="date" defaultValue="" /></div>
          <div style={{ gridColumn: "1/-1", justifySelf: "end" }}><button>Crear</button></div>
        </form>
      </section>

      {/* Dashboard Deudas + Pagos */}
      <section className="card">
        <h2 style={{ marginBlockStart: 0 }}>Deudas ({rows.length})</h2>

        {/* Progreso global visual */}
        <div className="progress" style={{ marginBlockStart: 8 }}>
          <span style={{ inlineSize: `${Math.max(0, Math.min(100, totalPct))}%` }} />
        </div>

        <table style={{ marginTop: 12 }}>
          <thead>
            <tr>
              <th>Concepto</th>
              <th>Acreedor</th>
              <th className="right">Monto</th>
              <th className="right">Pagado</th>
              <th className="right">Restante</th>
              <th>Vence</th>
              <th>Estado</th>
              <th>Progreso</th>
              <th className="right">Gestión</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ d, ps, paid, remaining, pct }) => (
              <tr key={d.id}>
                <td>{d.concept}</td>
                <td>{d.creditor}</td>
                <td className="right">{formatDOP(toNum(d.amount))}</td>
                <td className="right">{formatDOP(paid)}</td>
                <td className="right" style={{ color: remaining > 0 ? undefined : "#16a34a" }}>
                  {formatDOP(remaining)}
                </td>
                <td>{d.due_date ? new Date(d.due_date + "T00:00:00").toLocaleDateString("es-DO") : "-"}</td>
                <td><span className="badge">{d.status}</span></td>
                <td style={{ minWidth: 160 }}>
                  <div className="progress">
                    <span style={{ inlineSize: `${Math.max(0, Math.min(100, pct))}%` }} />
                  </div>
                  <small>{pct.toFixed(1)}%</small>
                </td>
                <td className="right">
                  <details>
                    <summary className="btn btn-ghost">Pagos / Editar</summary>
                    <div style={{ marginTop: 8, display: "grid", gap: 8 }}>
                      {/* Lista pagos */}
                      <table>
                        <thead>
                          <tr>
                            <th>Fecha</th>
                            <th className="right">Monto</th>
                            <th>Nota</th>
                            <th className="right">Acciones</th>
                          </tr>
                        </thead>
                        <tbody>
                          {ps.map(p => (
                            <tr key={p.id}>
                              <td>{new Date(p.paid_at).toLocaleString("es-DO")}</td>
                              <td className="right">{formatDOP(toNum(p.amount))}</td>
                              <td>{p.note ?? "-"}</td>
                              <td className="right">
                                <form action={deletePayment} style={{ display: "inline-flex", gap: 8 }}>
                                  <input type="hidden" name="id" value={p.id} />
                                  <input type="hidden" name="debt_id" value={d.id} />
                                  <button className="btn-danger">Eliminar</button>
                                </form>
                              </td>
                            </tr>
                          ))}
                          {ps.length === 0 && (
                            <tr><td colSpan={4}><div className="empty">Sin pagos.</div></td></tr>
                          )}
                        </tbody>
                      </table>

                      {/* Agregar pago */}
                      <form action={addPayment} className="grid" style={{ gridTemplateColumns: "repeat(4,1fr)", gap: 8, alignItems: "end" }}>
                        <input type="hidden" name="debt_id" value={d.id} />
                        <div><label>Monto</label><input name="amount" type="number" step="0.01" min={0} required /></div>
                        <div><label>Fecha</label><input name="paid_at" type="date" defaultValue={todayISO()} /></div>
                        <div><label>Nota</label><input name="note" placeholder="opcional" /></div>
                        <div style={{ justifySelf: "end" }}><button className="btn-secondary">Agregar pago</button></div>
                      </form>

                      {/* Ajustar monto deuda */}
                      <form action={adjustDebtAmount} className="grid" style={{ gridTemplateColumns: "repeat(3,1fr)", gap: 8, alignItems: "end" }}>
                        <input type="hidden" name="id" value={d.id} />
                        <div><label>Nuevo monto</label><input name="amount" type="number" step="0.01" min={0} defaultValue={d.amount} /></div>
                        <div />
                        <div style={{ justifySelf: "end" }}><button>Actualizar monto</button></div>
                      </form>

                      {/* Acciones deuda */}
                      <div style={{ display: "flex", gap: 8, justifyContent: "end" }}>
                        {d.status === "Abierta" ? (
                          <form action={toggleDebt}>
                            <input type="hidden" name="id" value={d.id} />
                            <input type="hidden" name="to" value="Cerrada" />
                            <button className="btn-secondary">Marcar cerrada</button>
                          </form>
                        ) : (
                          <form action={toggleDebt}>
                            <input type="hidden" name="id" value={d.id} />
                            <input type="hidden" name="to" value="Abierta" />
                            <button className="btn-secondary">Reabrir</button>
                          </form>
                        )}
                        <form action={deleteDebt}>
                          <input type="hidden" name="id" value={d.id} />
                          <button className="btn-danger">Eliminar deuda</button>
                        </form>
                      </div>
                    </div>
                  </details>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><td colSpan={9}><div className="empty">No hay deudas registradas.</div></td></tr>
            )}
          </tbody>
          <tfoot>
            <tr>
              <th colSpan={2} className="right">Totales:</th>
              <th className="right">{formatDOP(totalDebt)}</th>
              <th className="right">{formatDOP(totalPaid)}</th>
              <th className="right">{formatDOP(totalRemain)}</th>
              <th colSpan={4}></th>
            </tr>
          </tfoot>
        </table>
      </section>
    </div>
  );
}
