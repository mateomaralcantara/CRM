import { createClient } from "@supabase/supabase-js";
import 'dotenv/config'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(url, anon);

const { data, error } = await supabase
  .from("tasks")
  .insert({ title: "Ping desde script", priority: 3, status: "Pendiente" })
  .select();

console.log({ data, error });
