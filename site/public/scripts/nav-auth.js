import { supabase } from "./supabase.js";
import { getSession, onSessionChange } from "./session-store.js";

window.addEventListener("DOMContentLoaded", async () => {
  const loginLink = document.querySelector("[data-auth-login]");
  const logoutLink = document.querySelector("[data-auth-logout]");
  if (!loginLink && !logoutLink) return;

  const setState = (session) => {
    if (session) {
      if (loginLink) loginLink.hidden = true;
      if (logoutLink) logoutLink.hidden = false;
    } else {
      if (loginLink) loginLink.hidden = false;
      if (logoutLink) logoutLink.hidden = true;
    }
  };

  const session = await getSession();
  setState(session);

  onSessionChange((nextSession) => {
    setState(nextSession);
  });

  if (logoutLink) {
    logoutLink.addEventListener("click", async (event) => {
      event.preventDefault();
      const { error } = await supabase.auth.signOut();
      if (!error) {
        window.location.href = "/login";
      }
    });
  }
});
