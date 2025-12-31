import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.46.1/+esm";

const config = window.__SUPABASE__ || {};
const supabaseUrl = config.url;
const supabaseKey = config.key;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Supabase config missing. Check PUBLIC_SUPABASE_URL and PUBLIC_SUPABASE_ANON_KEY.");
}

export const supabase = createClient(supabaseUrl || "", supabaseKey || "");

async function assertConnection() {
  const { error } = await supabase.from("book_status").select("id").limit(1);
  if (error) {
    throw new Error(`Supabase connection failed: ${error.message}`);
  }
}

assertConnection();
