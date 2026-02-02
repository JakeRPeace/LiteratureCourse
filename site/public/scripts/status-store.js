import { supabase } from "./supabase.js";
import { getSession, onSessionChange } from "./session-store.js";

const listeners = new Set();
let state = { status: "idle", data: null, error: null, userId: null };
let loadPromise = null;

function emit() {
  listeners.forEach((listener) => listener(state));
}

async function fetchStatuses() {
  const session = await getSession();
  if (!session) {
    state = { status: "signed_out", data: null, error: null, userId: null };
    emit();
    return state;
  }

  if (state.status === "ready" && state.userId === session.user.id) {
    return state;
  }

  if (loadPromise) return loadPromise;

  state = { ...state, status: "loading", error: null, userId: session.user.id };
  emit();

  loadPromise = (async () => {
    const { data, error } = await supabase
      .from("book_status")
      .select("book_id, status")
      .eq("user_id", session.user.id);

    if (error) {
      state = { status: "error", data: null, error, userId: session.user.id };
    } else {
      state = { status: "ready", data: data || [], error: null, userId: session.user.id };
    }

    loadPromise = null;
    emit();
    return state;
  })();

  return loadPromise;
}

export async function getBookStatusState({ force = false } = {}) {
  if (force) {
    state = { status: "idle", data: null, error: null, userId: null };
    loadPromise = null;
  }
  return fetchStatuses();
}

export function onBookStatusState(listener) {
  listeners.add(listener);
  if (state.status !== "idle") {
    listener(state);
  }
  return () => listeners.delete(listener);
}

onSessionChange(() => {
  state = { status: "idle", data: null, error: null, userId: null };
  loadPromise = null;
  void fetchStatuses();
});

window.addEventListener("book-status-refresh", () => {
  void getBookStatusState({ force: true });
});
