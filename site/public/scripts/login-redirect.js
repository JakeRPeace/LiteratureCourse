import { getSession, onSessionChange } from "./session-store.js";

window.addEventListener("DOMContentLoaded", async () => {
  const session = await getSession();
  if (session) {
    window.location.href = "/";
    return;
  }

  onSessionChange((nextSession) => {
    if (nextSession) {
      window.location.href = "/";
    }
  });
});
