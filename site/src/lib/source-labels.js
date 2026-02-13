export function resolveSourceLabel(source) {
  const normalized = String(source || "").toLowerCase();
  if (normalized === "supabase") return "Supabase";
  if (normalized === "markdown") return "Markdown";
  if (normalized === "user") return "User";
  return source ? String(source) : "Markdown";
}
