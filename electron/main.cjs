const { app, BrowserWindow, dialog, shell } = require("electron");
const { spawn } = require("node:child_process");
const path = require("node:path");
const http = require("node:http");
const fs = require("node:fs");

const isDev = !app.isPackaged;
const APP_PORT = Number(process.env.DEVICE_API_PORT || (isDev ? 8787 : 38787));
const EULA_VERSION = "1.0.0";
let backendProcess = null;

function resolveResourcePath(...parts) {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, ...parts);
  }
  return path.join(app.getAppPath(), ...parts);
}

function getBackendEntry() {
  return resolveResourcePath("backend", "server.mjs");
}

function getFrontendDistDir() {
  return resolveResourcePath("dist");
}

function getEulaPath() {
  return resolveResourcePath("build", "eula.txt");
}

function getAppIconPath() {
  return resolveResourcePath("build", "icon.ico");
}

function getEulaAcceptanceFile() {
  return path.join(app.getPath("userData"), "eula-accepted.json");
}

function hasAcceptedEula() {
  try {
    const accepted = JSON.parse(fs.readFileSync(getEulaAcceptanceFile(), "utf8"));
    return accepted?.version === EULA_VERSION;
  } catch {
    return false;
  }
}

function persistEulaAcceptance() {
  fs.mkdirSync(path.dirname(getEulaAcceptanceFile()), { recursive: true });
  fs.writeFileSync(getEulaAcceptanceFile(), JSON.stringify({ version: EULA_VERSION, acceptedAt: new Date().toISOString() }, null, 2));
}

function escapeHtml(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function buildEulaHtml(eulaText) {
  const escapedText = escapeHtml(eulaText);
  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>EULA</title>
  <style>
    :root {
      --bg-void: #050609;
      --bg-panel: #0c1220;
      --bg-card: #121a2a;
      --border: #22314d;
      --accent-cyan: #00d4ff;
      --accent-green: #00ff88;
      --text-primary: #eef6ff;
      --text-secondary: #97abc9;
      --text-muted: #7f96b9;
    }
    body { margin: 0; background: var(--bg-void); color: var(--text-primary); font-family: Arial, sans-serif; }
    .shell { display: flex; flex-direction: column; height: 100vh; }
    .header { padding: 18px 22px; border-bottom: 1px solid var(--border); background: var(--bg-panel); box-shadow: inset 0 -1px 0 rgba(0,212,255,0.18); }
    .brand { color: var(--accent-cyan); font-size: 24px; font-weight: 800; letter-spacing: 1px; margin-bottom: 4px; }
    .tagline { color: #eaf4ff; font-size: 11px; letter-spacing: 1.2px; text-transform: uppercase; margin-bottom: 10px; }
    .title { color: var(--accent-cyan); font-size: 18px; font-weight: 700; margin-bottom: 6px; }
    .subtitle { color: var(--text-secondary); font-size: 12px; }
    .support { margin-top: 10px; color: var(--text-muted); font-size: 11px; display: flex; gap: 18px; flex-wrap: wrap; }
    .body { flex: 1; padding: 16px 20px; overflow: auto; background: linear-gradient(180deg, rgba(18,26,42,0.88), rgba(12,18,32,0.96)); }
    .doc { border: 1px solid var(--border); background: var(--bg-card); border-radius: 6px; padding: 14px; }
    pre { margin: 0; white-space: pre-wrap; word-break: break-word; font-family: Consolas, monospace; font-size: 12px; line-height: 1.55; }
    .footer { display: flex; justify-content: space-between; gap: 10px; padding: 16px 20px; border-top: 1px solid var(--border); background: var(--bg-panel); }
    .btns { display: flex; gap: 10px; }
    a { text-decoration: none; }
    .btn { display: inline-flex; align-items: center; justify-content: center; padding: 10px 16px; border: 1px solid var(--border); color: var(--text-primary); background: var(--bg-card); font-size: 12px; font-weight: 700; border-radius: 4px; }
    .btn.primary { border-color: var(--accent-cyan); color: var(--accent-cyan); }
    .btn.accept { border-color: var(--accent-green); color: var(--accent-green); }
    .note { color: var(--text-secondary); font-size: 11px; max-width: 460px; line-height: 1.4; }
  </style>
</head>
<body>
  <div class="shell">
    <div class="header">
      <div class="brand">iPhone Diagnostic Suite</div>
      <div class="tagline">Professional Repair Intelligence</div>
      <div class="title">End User License Agreement</div>
      <div class="subtitle">You must accept this agreement before using iPhone Diagnostic Suite.</div>
      <div class="support">
        <span>Developer: Vidarbha Phonefix</span>
        <span>Support No.: 9145259145</span>
      </div>
    </div>
    <div class="body"><div class="doc"><pre>${escapedText}</pre></div></div>
    <div class="footer">
      <div class="note">Accept to continue, decline to exit, or open the text file in your default editor.</div>
      <div class="btns">
        <a class="btn" href="eula://open">Open File</a>
        <a class="btn primary" href="eula://decline">Decline</a>
        <a class="btn accept" href="eula://accept">Accept</a>
      </div>
    </div>
  </div>
</body>
</html>`;
}

function showEulaWindow(eulaText, eulaPath) {
  return new Promise(resolve => {
    const eulaWindow = new BrowserWindow({
      width: 840,
      height: 720,
      minWidth: 720,
      minHeight: 560,
      resizable: true,
      maximizable: false,
      minimizable: false,
      fullscreenable: false,
      autoHideMenuBar: true,
      title: "End User License Agreement",
      backgroundColor: "#090b10",
      webPreferences: {
        contextIsolation: true,
        sandbox: true,
      },
    });

    let resolved = false;
    const finish = value => {
      if (resolved) return;
      resolved = true;
      if (!eulaWindow.isDestroyed()) {
        eulaWindow.close();
      }
      resolve(value);
    };

    eulaWindow.webContents.on("will-navigate", async (event, url) => {
      if (!url.startsWith("eula://")) return;
      event.preventDefault();
      if (url === "eula://accept") {
        persistEulaAcceptance();
        finish(true);
        return;
      }
      if (url === "eula://decline") {
        finish(false);
        return;
      }
      if (url === "eula://open") {
        await shell.openPath(eulaPath);
      }
    });

    eulaWindow.on("closed", () => {
      if (!resolved) {
        resolved = true;
        resolve(false);
      }
    });

    const html = buildEulaHtml(eulaText);
    eulaWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`);
  });
}

async function ensureEulaAccepted() {
  if (hasAcceptedEula()) return true;
  const eulaPath = getEulaPath();
  let eulaText = "EULA file not found.";
  try {
    eulaText = fs.readFileSync(eulaPath, "utf8");
  } catch {
  }
  return showEulaWindow(eulaText, eulaPath);
}

function startBackend() {
  if (backendProcess) return;
  const backendEntry = getBackendEntry();
  const env = {
    ...process.env,
    DEVICE_API_PORT: String(APP_PORT),
    DIAGNOSTICS_DATA_DIR: path.join(app.getPath("userData"), "runtime-data"),
    FRONTEND_DIST_DIR: isDev ? "" : getFrontendDistDir(),
    ELECTRON_RUN_AS_NODE: "1",
  };

  backendProcess = spawn(process.execPath, [backendEntry], {
    cwd: path.dirname(backendEntry),
    env,
    stdio: "ignore",
    windowsHide: true,
  });

  backendProcess.on("exit", () => {
    backendProcess = null;
  });
}

function waitForServer(url, timeoutMs = 30000) {
  const started = Date.now();
  return new Promise((resolve, reject) => {
    const attempt = () => {
      const req = http.get(url, res => {
        res.resume();
        resolve();
      });
      req.on("error", () => {
        if (Date.now() - started > timeoutMs) {
          reject(new Error(`Timed out waiting for ${url}`));
          return;
        }
        setTimeout(attempt, 500);
      });
    };
    attempt();
  });
}

async function createWindow() {
  const accepted = await ensureEulaAccepted();
  if (!accepted) {
    app.quit();
    return;
  }

  startBackend();
  const win = new BrowserWindow({
    width: 1440,
    height: 960,
    minWidth: 1200,
    minHeight: 760,
    backgroundColor: "#090b10",
    autoHideMenuBar: true,
    icon: getAppIconPath(),
    webPreferences: {
      contextIsolation: true,
      sandbox: true,
    },
  });

  const targetUrl = isDev ? "http://127.0.0.1:5173" : `http://127.0.0.1:${APP_PORT}`;

  try {
    await waitForServer(`http://127.0.0.1:${APP_PORT}/api/health`);
    if (isDev) {
      await waitForServer(targetUrl);
    }
    await win.loadURL(targetUrl);
  } catch (error) {
    await dialog.showMessageBox({
      type: "error",
      title: "Startup Failed",
      message: "Unable to start iPhone Diagnostic Suite.",
      detail: error.message,
    });
  }

  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });
}

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("before-quit", () => {
  if (backendProcess && !backendProcess.killed) {
    backendProcess.kill();
  }
});
