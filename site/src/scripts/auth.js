import { supabase } from "../lib/supabaseClient.js";

window.addEventListener("DOMContentLoaded", () => {
  const root = document.querySelector("[data-auth]");
  if (!root) return;
  const signedOut = root.querySelector('[data-auth-state="signed-out"]');
  const signedIn = root.querySelector('[data-auth-state="signed-in"]');
  const emailInput = root.querySelector('input[name="email"]');
  const passwordInput = root.querySelector('input[name="password"]');
  const errorBox = root.querySelector("[data-auth-error]");
  const userBox = root.querySelector("[data-auth-user]");

  const setError = (message) => {
    errorBox.textContent = message || "";
  };

  const setState = (session) => {
    if (session?.user) {
      signedOut.hidden = true;
      signedIn.hidden = false;
      userBox.textContent = session.user.email || session.user.id;
    } else {
      signedOut.hidden = false;
      signedIn.hidden = true;
      userBox.textContent = "";
    }
  };

  const refreshSession = async () => {
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      setError(error.message);
      return;
    }
    setState(data.session);
  };

  if (!supabase) {
    setError("Supabase client not initialized.");
  }

  root.addEventListener("click", async (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    const action = target.dataset.authAction;
    if (!action) return;

    event.preventDefault();
    setError("");

    if (action === "signin") {
      const { error } = await supabase.auth.signInWithPassword({
        email: emailInput.value,
        password: passwordInput.value
      });
      if (error) setError(error.message);
      return;
    }

    if (action === "signup") {
      const { error } = await supabase.auth.signUp({
        email: emailInput.value,
        password: passwordInput.value
      });
      if (error) setError(error.message);
      return;
    }

    if (action === "signout") {
      const { error } = await supabase.auth.signOut();
      if (error) setError(error.message);
    }
  });

  supabase.auth.onAuthStateChange(() => {
    refreshSession();
  });

  refreshSession();
});
