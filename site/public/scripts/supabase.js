import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.46.1/+esm";

const config = window.__SUPABASE__ || {};
const supabaseUrl = config.url;
const supabaseKey = config.key;

function showBanner(message) {
  const banner = document.createElement("div");
  banner.textContent = message;
  banner.style.position = "fixed";
  banner.style.top = "16px";
  banner.style.left = "50%";
  banner.style.transform = "translateX(-50%)";
  banner.style.background = "rgba(15, 15, 15, 0.95)";
  banner.style.color = "#ffffff";
  banner.style.border = "1px solid rgba(255, 255, 255, 0.2)";
  banner.style.padding = "10px 16px";
  banner.style.borderRadius = "999px";
  banner.style.fontSize = "12px";
  banner.style.zIndex = "9999";
  banner.style.boxShadow = "0 16px 32px rgba(0, 0, 0, 0.45)";
  document.body.appendChild(banner);
}

if (!supabaseUrl || !supabaseKey) {
  showBanner("Supabase config missing. Check PUBLIC_SUPABASE_URL and PUBLIC_SUPABASE_ANON_KEY.");
}

export const supabase = createClient(supabaseUrl || "", supabaseKey || "");

async function assertConnection() {
  const { error } = await supabase.from("book_status").select("id").limit(1);
  if (error) {
    showBanner(`Supabase connection failed: ${error.message}`);
  }
}

assertConnection();
