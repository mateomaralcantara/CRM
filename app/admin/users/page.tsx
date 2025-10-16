import { supabase } from "@/lib/supabase";
import { revalidatePath } from "next/cache";

async function approveUser(formData: FormData) {
  "use server";
  const id = String(formData.get("id") || "");
  if (!id) return;
  const { error } = await supabase
    .from("profiles")
    .update({ approved: true })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/users");
}

async function makeAdmin(formData: FormData) {
  "use server";
  const id = String(formData.get("id") || "");
  if (!id) return;
  const { error } = await supabase
    .from("profiles")
    .update({ role: "admin", approved: true })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/users");
}

export default async function AdminUsersPage() {
  // Requiere que quien entra sea admin; si no, mostrar mensaje simple.
  const { data: me } = await supabase.auth.getUser();
  if (!me?.user) return <div className="card"><p>Sin sesión</p></div>;

  const { data: myProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", me.user.id)
    .single();

  if (myProfile?.role !== "admin") {
    return <div className="card"><p>Acceso solo para administradores.</p></div>;
  }

  const { data: pending } = await supabase
    .from("profiles")
    .select("id, full_name, email, created_at, approved, role")
    .order("created_at", { ascending: true });

  return (
    <div className="card">
      <h2 style={{marginBlockStart:0}}>Usuarios</h2>
      <table style={{marginTop:12}}>
        <thead>
          <tr><th>Nombre</th><th>Email</th><th>Rol</th><th>Estado</th><th>Acciones</th></tr>
        </thead>
        <tbody>
          {(pending ?? []).map((u: any) => (
            <tr key={u.id}>
              <td>{u.full_name}</td>
              <td>{u.email}</td>
              <td><span className="badge">{u.role}</span></td>
              <td>{u.approved ? "Aprobado" : "Pendiente"}</td>
              <td className="flex">
                {!u.approved && (
                  <form action={approveUser}>
                    <input type="hidden" name="id" value={u.id} />
                    <button>Aprobar</button>
                  </form>
                )}
                {u.role !== "admin" && (
                  <form action={makeAdmin}>
                    <input type="hidden" name="id" value={u.id} />
                    <button className="btn-secondary">Hacer admin</button>
                  </form>
                )}
              </td>
            </tr>
          ))}
          {(pending ?? []).length === 0 && (
            <tr><td colSpan={5}><div className="empty">No hay usuarios</div></td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
