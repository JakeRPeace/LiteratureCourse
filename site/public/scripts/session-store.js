import { supabase } from "./supabase.js";

let cachedSession = null;
let initialized = false;
let initPromise = null;
const listeners = new Set();

function notify() {
  listeners.forEach((listener) => listener(cachedSession));
}

async function init() {
  if (initPromise) return initPromise;

  initPromise = (async () => {
    const { data } = await supabase.auth.getSession();
    cachedSession = data?.session || null;
    initialized = true;
    notify();

    supabase.auth.onAuthStateChange((_event, session) => {
      cachedSession = session || null;
      notify();
    });
  })();

  return initPromise;
}

export async function getSession() {
  await init();
  return cachedSession;
}

export function onSessionChange(listener) {
  listeners.add(listener);
  if (initialized) {
    listener(cachedSession);
  } else {
    void init();
  }
  return () => listeners.delete(listener);
}
