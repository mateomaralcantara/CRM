// app/contacts/page.tsx
export const revalidate = 0;
export const dynamic = "force-dynamic";

import { supabase } from "@/lib/supabase";
import { revalidatePath } from "next/cache";

async function create(form: FormData) {
  "use server";
  const name = String(form.get("name") || "").trim();
  const company = String(form.get("company") || "").trim() || null;
  const email = String(form.get("email") || "").trim() || null;
  const phone = String(form.get("phone") || "").trim() || null;
  if (!name) return;

  const { error } = await supabase.from("contacts").insert({ name, company, email, phone });
  if (error) throw new Error("Supabase insert (contacts): " + error.message);

  revalidatePath("/contacts");
  revalidatePath("/");
}

export default async function ContactsPage() {
  const { data: contacts, error } = await supabase
    .from("contacts")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return <div className="card"><h2>Contactos / CRM</h2><p style={{color:"#fca5a5"}}>Error: {error.message}</p></div>;
  }

  return (
    <div className="card">
      <h2 style={{marginTop:0}}>Contactos / CRM</h2>
      <form action={create} style={{display:'grid', gap:12, gridTemplateColumns:'repeat(4, 1fr)'}}>
        <div><label>Nombre</label><input name="name" required /></div>
        <div><label>Empresa</label><input name="company" /></div>
        <div><label>Email</label><input name="email" type="email" /></div>
        <div><label>Teléfono</label><input name="phone" /></div>
        <div style={{gridColumn:'1/-1', justifySelf:'end'}}><button>Agregar</button></div>
      </form>

      <table style={{marginTop:16}}>
        <thead><tr><th>Nombre</th><th>Empresa</th><th>Email</th></tr></thead>
        <tbody>
          {(contacts??[]).map((c:any) => (
            <tr key={c.id}>
              <td>{c.name}</td>
              <td>{c.company ?? "-"}</td>
              <td>{c.email ?? "-"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
