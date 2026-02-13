import { getSession } from "./session-store.js";

window.addEventListener("DOMContentLoaded", async () => {
  const session = await getSession();
  if (!session) {
    window.location.href = "/login";
  }
});
