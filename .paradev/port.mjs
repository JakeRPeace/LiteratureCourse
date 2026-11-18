#!/usr/bin/env node
// Reserve one Astro dev-server port per workspace in ~/.paradev/port-allocations.json.
// Paradev does not assign ports. Parallel workspaces would otherwise all bind 4321.

import { createServer } from "node:net";
import { statSync } from "node:fs";
import { open, unlink, mkdir, readFile, writeFile, rename, stat } from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { fileURLToPath } from "node:url";

const BASE_PORT = 4321;
const PORT_SPAN = 100;
const LABEL = "Astro Dev Server";

const configDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(configDir, "..");
const portFile = path.join(configDir, ".dev-port");
const portsJson = path.join(configDir, "ports.json");

const allocDir = path.join(os.homedir(), ".paradev");
const allocFile = path.join(allocDir, "port-allocations.json");
const lockFile = path.join(allocDir, "port-allocations.lock");

function workspacePath() {
  const fromEnv = process.env.SUPERSET_WORKSPACE_PATH;
  if (fromEnv && fromEnv.trim()) return path.resolve(fromEnv);
  return repoRoot;
}

function log(message) {
  process.stderr.write(`${message}\n`);
}

function canBind(port, host) {
  return new Promise((resolve) => {
    const server = createServer();
    server.once("error", (err) => {
      if (err.code === "EAFNOSUPPORT" || err.code === "EADDRNOTAVAIL") resolve(true);
      else resolve(false);
    });
    server.listen({ port, host, exclusive: true }, () => {
      server.close(() => resolve(true));
    });
  });
}

async function portIsFree(port) {
  if (!(await canBind(port, "127.0.0.1"))) return false;
  return canBind(port, "::");
}

function workspaceExists(dir) {
  try {
    statSync(dir);
    return true;
  } catch (err) {
    if (err.code === "ENOENT") return false;
    throw err;
  }
}

async function withLock(fn) {
  await mkdir(allocDir, { recursive: true });
  const started = Date.now();
  for (;;) {
    let handle;
    try {
      handle = await open(lockFile, "wx");
    } catch (err) {
      if (err.code !== "EEXIST") throw err;
      try {
        const info = await stat(lockFile);
        if (Date.now() - info.mtimeMs > 15000) await unlink(lockFile);
      } catch {
        // The lock disappeared between checks. Retry.
      }
      if (Date.now() - started > 10000) {
        throw new Error("Timed out waiting for the Paradev port allocation lock");
      }
      await new Promise((resolve) => setTimeout(resolve, 40));
      continue;
    }
    try {
      await handle.writeFile(String(process.pid));
      return await fn();
    } finally {
      await handle.close();
      await unlink(lockFile).catch(() => {});
    }
  }
}

async function readAllocations() {
  try {
    const parsed = JSON.parse(await readFile(allocFile, "utf8"));
    if (!parsed || typeof parsed !== "object" || !parsed.allocations || typeof parsed.allocations !== "object") {
      return { version: 1, allocations: {} };
    }
    return { version: 1, allocations: parsed.allocations };
  } catch (err) {
    if (err.code === "ENOENT") return { version: 1, allocations: {} };
    throw err;
  }
}

async function writeAllocations(data) {
  const tmp = `${allocFile}.${process.pid}.tmp`;
  await writeFile(tmp, `${JSON.stringify(data, null, 2)}\n`);
  await rename(tmp, allocFile);
}

function dropMissingWorkspaces(allocations) {
  for (const [key, value] of Object.entries(allocations)) {
    if (!value || typeof value.port !== "number" || !workspaceExists(key)) {
      delete allocations[key];
    }
  }
}

async function writeWorkspacePort(port) {
  await writeFile(portFile, `${port}\n`);
  const body = { ports: [{ port, label: LABEL }] };
  await writeFile(portsJson, `${JSON.stringify(body, null, 2)}\n`);
}

async function reserve() {
  const key = workspacePath();
  const port = await withLock(async () => {
    const data = await readAllocations();
    dropMissingWorkspaces(data.allocations);

    const taken = new Set();
    for (const [owner, entry] of Object.entries(data.allocations)) {
      if (owner !== key) taken.add(entry.port);
    }

    const existing = data.allocations[key]?.port;
    let chosen = null;
    if (
      typeof existing === "number" &&
      existing >= BASE_PORT &&
      existing < BASE_PORT + PORT_SPAN &&
      !taken.has(existing)
    ) {
      chosen = existing;
    } else {
      for (let candidate = BASE_PORT; candidate < BASE_PORT + PORT_SPAN; candidate += 1) {
        if (taken.has(candidate)) continue;
        if (!(await portIsFree(candidate))) continue;
        chosen = candidate;
        break;
      }
    }
    if (chosen == null) {
      throw new Error(`No free port in ${BASE_PORT}-${BASE_PORT + PORT_SPAN - 1}`);
    }

    data.allocations[key] = { port: chosen, label: LABEL };
    await writeAllocations(data);
    return chosen;
  });

  await writeWorkspacePort(port);
  log(`Reserved ${LABEL} on port ${port}`);
  process.stdout.write(`${port}\n`);
}

async function release() {
  const key = workspacePath();
  await withLock(async () => {
    const data = await readAllocations();
    if (data.allocations[key]) {
      log(`Released port ${data.allocations[key].port}`);
      delete data.allocations[key];
      await writeAllocations(data);
    } else {
      log("No port reservation to release");
    }
  });
  await unlink(portFile).catch((err) => {
    if (err.code !== "ENOENT") throw err;
  });
  await unlink(portsJson).catch((err) => {
    if (err.code !== "ENOENT") throw err;
  });
}

const command = process.argv[2] || "reserve";
if (command === "reserve") {
  await reserve();
} else if (command === "release") {
  await release();
} else {
  log("Usage: port.mjs reserve|release");
  process.exit(1);
}
