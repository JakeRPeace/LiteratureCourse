import { getSession, onSessionChange } from "./session-store.js";

function setupLazyLoader(panel) {
  const openButton = panel.querySelector("[data-course-chat-open]");
  if (!openButton) return;

  let loaded = false;
  const loadChat = async () => {
    if (loaded) return;
    loaded = true;
    await import("/scripts/course-chat.js");
  };

  const eagerEvents = ["pointerenter", "focus", "touchstart"];
  eagerEvents.forEach((eventName) => {
    openButton.addEventListener(eventName, loadChat, { once: true });
  });

  openButton.addEventListener("click", async (event) => {
    if (loaded) return;
    event.preventDefault();
    await loadChat();
    openButton.click();
  });
}

window.addEventListener("DOMContentLoaded", async () => {
  const panel = document.querySelector("[data-course-chat-panel]");
  if (!panel) return;

  setupLazyLoader(panel);

  const updateVisibility = (session) => {
    panel.hidden = !session;
  };

  updateVisibility(await getSession());
  onSessionChange((session) => {
    updateVisibility(session);
  });
});
