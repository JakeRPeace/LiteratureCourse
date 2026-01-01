import { supabase } from "./supabase.js";

window.addEventListener("DOMContentLoaded", async () => {
  const { data } = await supabase.auth.getSession();
  if (data.session) {
    window.location.href = "/";
    return;
  }

  supabase.auth.onAuthStateChange((_event, session) => {
    if (session) {
      window.location.href = "/";
    }
  });
});
