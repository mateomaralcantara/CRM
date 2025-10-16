export const dynamic = "force-dynamic";
export const revalidate = 0;

import { supabase } from "@/lib/supabase";
import Editor from "./rte"; // ← import estable vía barrel

export default async function ProjectPage({ params }: { params: { id: string } }) {
  const id = params.id;

  const { data: proj, error } = await supabase
    .from("projects")
    .select("id,name,status,content,created_at,updated_at")
    .eq("id", id)
    .single();

  if (error || !proj) {
    return (
      <div className="card">
        <h2 style={{ marginBlockStart: 0 }}>Proyecto</h2>
        <p style={{ color: "#fca5a5" }}>No se encontró el proyecto.</p>
      </div>
    );
  }

  return (
    <div className="grid" style={{ gap: 16 }}>
      <div className="card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
          <div>
            <h2 style={{ marginBlockStart: 0 }}>{proj.name}</h2>
            <small style={{ color: "#9aa3b2" }}>
              Estado: <b>{proj.status}</b> · Actualizado: {new Date(proj.updated_at).toLocaleString("es-DO")}
            </small>
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: 0 }}>
        <Editor projectId={proj.id} initialHTML={proj.content ?? ""} />
      </div>
    </div>
  );
}
