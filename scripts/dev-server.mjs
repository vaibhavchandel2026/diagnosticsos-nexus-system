import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const children = [];
const ROOT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const VITE_ENTRY = path.join(ROOT_DIR, "node_modules", "vite", "bin", "vite.js");

function startProcess(command, args, extra = {}) {
  const child = spawn(command, args, {
    stdio: "inherit",
    shell: false,
    windowsHide: false,
    cwd: ROOT_DIR,
    ...extra,
  });

  children.push(child);
  child.on("exit", code => {
    if (code && code !== 0) {
      process.exitCode = code;
    }
  });

  child.on("error", error => {
    console.error(error.message);
    process.exitCode = 1;
  });

  return child;
}

startProcess("node", ["backend/server.mjs"]);
startProcess("node", [VITE_ENTRY, "--host", "0.0.0.0"]);

function shutdown() {
  children.forEach(child => {
    if (!child.killed) {
      child.kill();
    }
  });
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
