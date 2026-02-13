import { readFile, readdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const outputDir = fileURLToPath(new URL("../.vercel/output", import.meta.url));
const outputConfigPath = join(outputDir, "config.json");
const functionsDir = join(outputDir, "functions");

const envRuntime = process.env.VERCEL_FUNCTION_RUNTIME;
const targetMajor = Number.parseInt(process.versions.node.split(".")[0], 10);
const targetRuntime =
  envRuntime && typeof envRuntime === "string"
    ? envRuntime
    : Number.isFinite(targetMajor)
      ? `nodejs${targetMajor}.x`
      : null;

const applyRuntimeField = (node) => {
  if (!node || typeof node !== "object") return false;
  if (typeof node.runtime !== "string") return false;
  if (!node.runtime.startsWith("nodejs")) return false;
  if (node.runtime === targetRuntime) return false;
  node.runtime = targetRuntime;
  return true;
};

const updateJsonFile = async (path) => {
  const raw = await readFile(path, "utf8");
  const data = JSON.parse(raw);
  let updated = false;

  if (data && data.functions && typeof data.functions === "object") {
    for (const fn of Object.values(data.functions)) {
      if (applyRuntimeField(fn)) updated = true;
    }
  } else if (applyRuntimeField(data)) {
    updated = true;
  }

  if (!updated) return false;

  await writeFile(path, JSON.stringify(data, null, 2) + "\n", "utf8");
  return true;
};

try {
  if (!targetRuntime) {
    console.warn("[runtime] Unable to determine Node major version; skipping.");
    process.exit(0);
  }

  let updatedCount = 0;

  try {
    if (await updateJsonFile(outputConfigPath)) updatedCount += 1;
  } catch (error) {
    if (error && error.code !== "ENOENT") throw error;
  }

  try {
    const entries = await readdir(functionsDir, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      if (!entry.name.endsWith(".func")) continue;
      const fnDir = join(functionsDir, entry.name);
      const candidates = ["config.json", ".vc-config.json"];
      for (const candidate of candidates) {
        const fnConfigPath = join(fnDir, candidate);
        try {
          if (await updateJsonFile(fnConfigPath)) updatedCount += 1;
        } catch (error) {
          if (error && error.code !== "ENOENT") throw error;
        }
      }
    }
  } catch (error) {
    if (error && error.code !== "ENOENT") throw error;
  }

  if (!updatedCount) {
    console.log("[runtime] No changes needed.");
    process.exit(0);
  }

  console.log(
    `[runtime] Updated ${updatedCount} runtime file(s) to ${targetRuntime}.`
  );
} catch (error) {
  if (error && error.code === "ENOENT") {
    console.log("[runtime] No build output found; skipping.");
    process.exit(0);
  }
  console.warn("[runtime] Failed to update build output runtimes.");
  console.warn(error);
  process.exit(0);
}
