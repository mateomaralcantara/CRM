export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default function PendingPage() {
  return (
    <div className="container" style={{ maxInlineSize: 560, marginBlockStart: 64 }}>
      <div className="card" style={{ padding: 20 }}>
        <h2 style={{ marginBlockStart: 0 }}>Tu cuenta está pendiente de aprobación</h2>
        <p>Un administrador revisará tu solicitud. Te avisaremos cuando te aprueben.</p>
      </div>
    </div>
  );
}
