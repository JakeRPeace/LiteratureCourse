import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.46.1/+esm";

const config = window.__SUPABASE__ || {};
const supabaseUrl = config.url;
const supabaseKey = config.key;

if (!supabaseUrl || !supabaseKey) {
  console.warn("Supabase config missing.");
}

export const supabase = createClient(supabaseUrl || "", supabaseKey || "");
