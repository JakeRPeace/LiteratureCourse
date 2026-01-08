import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const outputConfigUrl = new URL("../.vercel/output/config.json", import.meta.url);
const outputConfigPath = fileURLToPath(outputConfigUrl);

const targetMajor = Number.parseInt(process.versions.node.split(".")[0], 10);
const targetRuntime = Number.isFinite(targetMajor)
  ? `nodejs${targetMajor}.x`
  : null;

const applyRuntime = (config) => {
  if (!config || !config.functions || typeof config.functions !== "object") {
    return false;
  }

  let updated = false;
  for (const fn of Object.values(config.functions)) {
    if (!fn || typeof fn !== "object") continue;
    if (typeof fn.runtime !== "string") continue;
    if (!fn.runtime.startsWith("nodejs")) continue;
    if (fn.runtime === targetRuntime) continue;
    fn.runtime = targetRuntime;
    updated = true;
  }

  return updated;
};

try {
  if (!targetRuntime) {
    console.warn("[runtime] Unable to determine Node major version; skipping.");
    process.exit(0);
  }

  const raw = await readFile(outputConfigPath, "utf8");
  const config = JSON.parse(raw);
  const updated = applyRuntime(config);

  if (!updated) {
    console.log("[runtime] No changes needed.");
    process.exit(0);
  }

  await writeFile(outputConfigPath, JSON.stringify(config, null, 2) + "\n", "utf8");
  console.log(`[runtime] Updated function runtimes to ${targetRuntime}.`);
} catch (error) {
  if (error && error.code === "ENOENT") {
    console.log("[runtime] No build output found; skipping.");
    process.exit(0);
  }
  console.warn("[runtime] Failed to update build output runtimes.");
  console.warn(error);
  process.exit(0);
}
