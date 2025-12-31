export function astroResolve(modulePath) {
  if (typeof Astro !== "undefined" && typeof Astro.resolve === "function") {
    return Astro.resolve(modulePath);
  }
  return modulePath;
}
