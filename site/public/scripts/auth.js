import { supabase } from "./supabase.js";

window.addEventListener("DOMContentLoaded", () => {
  const root = document.querySelector("[data-auth]");
  if (!root) return;
  const signedOut = root.querySelector('[data-auth-state="signed-out"]');
  const signedIn = root.querySelector('[data-auth-state="signed-in"]');
  const emailInput = root.querySelector('input[name="email"]');
  const passwordInput = root.querySelector('input[name="password"]');
  const errorBox = root.querySelector("[data-auth-error]");
  const userBox = root.querySelector("[data-auth-user]");

  const GUEST_EMAIL = "guest@literaturecourse.com";
  const GUEST_PASS = "LiteratureGuest2024!";

  const setError = (message) => {
    errorBox.textContent = message || "";
  };

  const wipeGuestData = async (user) => {
    if (user?.email === GUEST_EMAIL) {
      console.log("Wiping guest data...");
      const { error } = await supabase
        .from("book_status")
        .delete()
        .eq("user_id", user.id);
      if (error) console.error("Failed to wipe guest data:", error);
    }
  };

  const setState = (session) => {
    if (session?.user) {
      signedOut.hidden = true;
      signedIn.hidden = false;
      const isGuest = session.user.email === GUEST_EMAIL;
      userBox.textContent = isGuest ? "Guest Mode" : (session.user.email || session.user.id);
      if (isGuest) userBox.classList.add("guest-indicator");
    } else {
      signedOut.hidden = false;
      signedIn.hidden = true;
      userBox.textContent = "";
      userBox.classList.remove("guest-indicator");
    }
  };

  const refreshSession = async () => {
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      setError(error.message);
      return;
    }
    setState(data.session);

    // Auto-wipe guest data on a fresh session start to simulate 24h reset
    if (data.session?.user?.email === GUEST_EMAIL) {
      const lastWipe = localStorage.getItem("last_guest_wipe");
      const now = Date.now();
      if (!lastWipe || (now - parseInt(lastWipe)) > 1000 * 60 * 60) { // Wipe if > 1 hour since last local record of wipe
        await wipeGuestData(data.session.user);
        localStorage.setItem("last_guest_wipe", now.toString());
      }
    }
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

    if (action === "guest") {
      const { error } = await supabase.auth.signInWithPassword({
        email: GUEST_EMAIL,
        password: GUEST_PASS
      });
      if (error) {
        // Fallback: try signup if signin fails (account might not exist yet)
        const { error: signUpError } = await supabase.auth.signUp({
          email: GUEST_EMAIL,
          password: GUEST_PASS
        });
        if (signUpError) setError("Guest mode unavailable. Please try again later.");
      }
      return;
    }

    if (action === "signout") {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) await wipeGuestData(user);
      const { error } = await supabase.auth.signOut();
      if (error) setError(error.message);
      return;
    }

    if (!emailInput.value || !passwordInput.value) {
      setError("Email and password are required.");
      return;
    }

    if (action === "signin") {
      const { error } = await supabase.auth.signInWithPassword({
        email: emailInput.value,
        password: passwordInput.value
      });
      if (error) setError(error.message || "Sign in failed.");
      return;
    }

    if (action === "signup") {
      const { error } = await supabase.auth.signUp({
        email: emailInput.value,
        password: passwordInput.value
      });
      if (error) setError(error.message || "Sign up failed.");
      return;
    }
  });

  supabase.auth.onAuthStateChange(() => {
    refreshSession();
  });

  refreshSession();
});
