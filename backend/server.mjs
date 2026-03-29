import http from "node:http";
import { spawn } from "node:child_process";
import { URL, fileURLToPath } from "node:url";
import path from "node:path";
import fs from "node:fs";

const PORT = Number(process.env.DEVICE_API_PORT || process.env.PORT || 8787);
const HOST = process.env.DEVICE_API_HOST || "127.0.0.1";
const ROOT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DATA_DIR = process.env.DIAGNOSTICS_DATA_DIR || path.join(ROOT_DIR, "artifacts");
const STATIC_DIST_DIR = process.env.FRONTEND_DIST_DIR || path.join(ROOT_DIR, "dist");
const LOCAL_PLATFORM_TOOLS = path.join(ROOT_DIR, "tools", "platform-tools");
const LOCAL_ANDROID_HOME = path.join(DATA_DIR, "android-home");
const LOCAL_ADB = path.join(LOCAL_PLATFORM_TOOLS, "adb.exe");
const LOCAL_FASTBOOT = path.join(LOCAL_PLATFORM_TOOLS, "fastboot.exe");
const LOCAL_PYMOBILEDEVICE3 = "C:\\Users\\virat\\AppData\\Roaming\\Python\\Python314\\Scripts\\pymobiledevice3.exe";
const LOCAL_APPLE_PANIC_READER = path.join(ROOT_DIR, "scripts", "apple_panic_reader.py");
const PANIC_REPORTS_DIR = path.join(DATA_DIR, "panic-reports");
const APPLE_PANIC_CACHE_FILE = path.join(DATA_DIR, "panic-cache.json");
const APPLE_ENRICH_CACHE_TTL_MS = 30000;
const appleEnrichmentCache = new Map();
const applePanicCache = new Map();
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY || "";
const ANTHROPIC_MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-20250514";
const ANTHROPIC_VERSION = process.env.ANTHROPIC_VERSION || "2023-06-01";
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-1.5-flash";
const DIRECTORY_URL = String(process.env.DEVICE_DIRECTORY_URL || "").trim().replace(/\/+$/, "");
const AGENT_ID = String(process.env.DEVICE_AGENT_ID || "").trim();
const AGENT_NAME = String(process.env.DEVICE_AGENT_NAME || "").trim();
const AGENT_PUBLIC_URL = String(process.env.DEVICE_AGENT_PUBLIC_URL || "").trim().replace(/\/+$/, "");
const AGENT_DIRECTORY_HEARTBEAT_MS = Number(process.env.DEVICE_DIRECTORY_HEARTBEAT_MS || 30000);
const AGENT_DIRECTORY_TTL_MS = Number(process.env.DEVICE_DIRECTORY_TTL_MS || 90000);
const agentDirectory = new Map();

function loadPersistentPanicCache() {
  try {
    if (!fs.existsSync(APPLE_PANIC_CACHE_FILE)) return;
    const parsed = JSON.parse(fs.readFileSync(APPLE_PANIC_CACHE_FILE, 'utf8'));
    for (const [key, value] of Object.entries(parsed || {})) {
      applePanicCache.set(key, value);
    }
  } catch {
  }
}

function savePersistentPanicCache() {
  try {
    const dir = path.dirname(APPLE_PANIC_CACHE_FILE);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(APPLE_PANIC_CACHE_FILE, JSON.stringify(Object.fromEntries(applePanicCache), null, 2));
  } catch {
  }
}

function setApplePanicCache(cacheKey, data) {
  applePanicCache.set(cacheKey, { timestamp: Date.now(), data });
  savePersistentPanicCache();
}

function getApplePanicCache(cacheKey) {
  return applePanicCache.get(cacheKey);
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function normalizeHttpUrl(value = "") {
  const input = String(value || "").trim();
  if (!input) return "";
  const withProtocol = /^https?:\/\//i.test(input) ? input : `http://${input}`;
  try {
    const parsed = new URL(withProtocol);
    return parsed.toString().replace(/\/+$/, "");
  } catch {
    return "";
  }
}

function cleanupAgentDirectory() {
  const cutoff = Date.now() - AGENT_DIRECTORY_TTL_MS;
  for (const [key, value] of agentDirectory.entries()) {
    if ((value.lastSeenTs || 0) < cutoff) {
      agentDirectory.delete(key);
    }
  }
}

function listRegisteredAgents() {
  cleanupAgentDirectory();
  return [...agentDirectory.values()]
    .sort((left, right) => (right.lastSeenTs || 0) - (left.lastSeenTs || 0))
    .map(({ lastSeenTs, ...agent }) => agent);
}

async function readJsonBody(request) {
  return new Promise((resolve, reject) => {
    let body = "";
    request.on("data", chunk => { body += chunk.toString(); });
    request.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (error) {
        reject(error);
      }
    });
    request.on("error", reject);
  });
}

async function registerCurrentAgentWithDirectory() {
  if (!DIRECTORY_URL || !AGENT_PUBLIC_URL) return;

  const tools = await getTools();
  const payload = {
    id: AGENT_ID || `${AGENT_NAME || HOST}-${PORT}`,
    name: AGENT_NAME || `Diagnostics Agent ${HOST}:${PORT}`,
    url: AGENT_PUBLIC_URL,
    host: HOST,
    port: PORT,
    tools,
    capabilities: ["scan", "ai-analysis", "command", "panic-file"],
  };

  try {
    await fetch(`${DIRECTORY_URL}/api/agents/register`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify(payload),
    });
  } catch (error) {
    console.error(`Agent directory heartbeat failed: ${error.message}`);
  }
}


loadPersistentPanicCache();

function buildOfflineAiAnalysis(fault = {}) {
  const heading = "AI service unavailable. Using offline knowledge base...";
  const fallbackSections = [];
  const solution = String(fault.solution || "").trim();
  const description = String(fault.description || "").trim();

  if (solution) fallbackSections.push(solution);
  if (!solution && description) fallbackSections.push(description);

  if (fault.component || fault.severity) {
    fallbackSections.push(`Repair context: ${[fault.component, fault.severity].filter(Boolean).join(" | ")}`);
  }

  return {
    ok: true,
    source: "offline",
    analysis: `${heading}\n\n${fallbackSections.filter(Boolean).join("\n\n")}`.trim(),
    reason: GEMINI_API_KEY || ANTHROPIC_API_KEY ? "provider-request-failed" : "missing-api-key",
  };
}

function buildAiPrompt(fault = {}) {
  return `You are an expert mobile motherboard repair engineer. Analyze this fault and provide concise repair guidance.

Fault Code: ${fault.code || "Unknown"}
Device: ${[fault.brand, fault.model].filter(Boolean).join(" ")}
Component: ${fault.component || "Unknown"}
Severity: ${fault.severity || "Unknown"}
Description: ${fault.description || "Unknown"}
Known Solution: ${fault.solution || "None"}

Provide:
1. Root cause analysis (2-3 sentences)
2. Step-by-step repair procedure (numbered)
3. Required tools list
4. Risk factors to watch for
5. Success verification method

Be technical, precise, and practical. Format clearly.`;
}

async function runGeminiAnalysis(prompt) {
  const upstream = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${encodeURIComponent(GEMINI_API_KEY)}`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({
      contents: [
        {
          role: "user",
          parts: [{ text: prompt }],
        },
      ],
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 1000,
      },
    }),
  });

  const payload = await upstream.json().catch(() => ({}));
  if (!upstream.ok) {
    throw new Error(payload?.error?.message || `Gemini request failed (${upstream.status})`);
  }

  const analysis = payload?.candidates?.[0]?.content?.parts?.map(part => part?.text || "").join("\n").trim() || "";
  if (!analysis) {
    throw new Error("Gemini returned no analysis");
  }

  return {
    ok: true,
    source: "gemini",
    analysis,
    model: GEMINI_MODEL,
  };
}

async function runAnthropicAnalysis(prompt) {
  const upstream = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": ANTHROPIC_API_KEY,
      "anthropic-version": ANTHROPIC_VERSION,
    },
    body: JSON.stringify({
      model: ANTHROPIC_MODEL,
      max_tokens: 1000,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  const payload = await upstream.json().catch(() => ({}));
  if (!upstream.ok) {
    throw new Error(payload?.error?.message || payload?.error || `Anthropic request failed (${upstream.status})`);
  }

  const analysis = Array.isArray(payload.content)
    ? payload.content.map(block => block?.text || "").join("\n").trim()
    : "";

  if (!analysis) {
    throw new Error("Anthropic returned no analysis");
  }

  return {
    ok: true,
    source: "anthropic",
    analysis,
    model: payload.model || ANTHROPIC_MODEL,
  };
}

async function runAiAnalysis(fault = {}) {
  const prompt = buildAiPrompt(fault);

  try {
    if (GEMINI_API_KEY) {
      return await runGeminiAnalysis(prompt);
    }

    if (ANTHROPIC_API_KEY) {
      return await runAnthropicAnalysis(prompt);
    }
  } catch {
    return buildOfflineAiAnalysis(fault);
  }

  return buildOfflineAiAnalysis(fault);
}
function resolveTool(preferredPath, fallbackName) {
  if (preferredPath && fs.existsSync(preferredPath)) return preferredPath;
  if (!fallbackName) return null;
  return fallbackName;
}

function androidEnv() {
  const root = path.parse(LOCAL_ANDROID_HOME).root;
  return {
    ...process.env,
    USERPROFILE: LOCAL_ANDROID_HOME,
    HOME: LOCAL_ANDROID_HOME,
    HOMEDRIVE: root.slice(0, 2),
    HOMEPATH: LOCAL_ANDROID_HOME.slice(2),
    ANDROID_USER_HOME: path.join(LOCAL_ANDROID_HOME, ".android"),
  };
}

function runProcess(file, args = [], options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(file, args, {
      shell: options.shell ?? false,
      windowsHide: true,
      env: options.env || process.env,
      cwd: options.cwd || ROOT_DIR,
    });

    let stdout = "";
    let stderr = "";
    const timeout = setTimeout(() => {
      child.kill();
      reject(new Error(`${file} timed out`));
    }, options.timeoutMs || 10000);

    child.stdout?.on("data", chunk => { stdout += chunk.toString(); });
    child.stderr?.on("data", chunk => { stderr += chunk.toString(); });
    child.on("error", error => {
      clearTimeout(timeout);
      reject(error);
    });
    child.on("close", code => {
      clearTimeout(timeout);
      if (code !== 0) {
        reject(new Error((stderr || stdout || `${file} failed`).trim()));
        return;
      }
      resolve({ stdout: stdout.trim(), stderr: stderr.trim() });
    });
  });
}

async function runPowerShell(script, options = {}) {
  return runProcess("powershell", ["-NoProfile", "-Command", script], { shell: false, ...options });
}


function stripAnsi(value = "") {
  return String(value).replace(/\x1B\[[0-9;]*[A-Za-z]/g, "");
}

function cleanCliOutput(value = "") {
  return stripAnsi(value)
    .split(/\r?\n/)
    .filter(line => !/RequestsDependencyWarning|DeprecationWarning/.test(line))
    .join("\n")
    .trim();
}

async function runPyMobileDevice3(args = [], options = {}) {
  if (!fs.existsSync(LOCAL_PYMOBILEDEVICE3)) {
    throw new Error("pymobiledevice3 is not available");
  }

  const result = await runProcess(LOCAL_PYMOBILEDEVICE3, ["--no-color", ...args], {
    shell: false,
    timeoutMs: options.timeoutMs || 20000,
  });

  return {
    stdout: cleanCliOutput(result.stdout),
    stderr: cleanCliOutput(result.stderr),
  };
}


async function runApplePanicReader(udid = "", outDir = "") {
  if (!fs.existsSync(LOCAL_APPLE_PANIC_READER)) {
    throw new Error("Apple panic reader is not available");
  }

  const result = await runProcess("python", [LOCAL_APPLE_PANIC_READER, udid, outDir].filter(Boolean), {
    shell: false,
    timeoutMs: 30000,
  });

  const stdout = cleanCliOutput(result.stdout);
  const lines = stdout.split(/\r?\n/).filter(Boolean);
  const jsonLine = [...lines].reverse().find(line => line.trim().startsWith("{"));
  if (!jsonLine) {
    throw new Error(stdout || "Apple panic reader returned no JSON");
  }
  return JSON.parse(jsonLine);
}

async function runAdb(args, options = {}) {
  return runPowerShell(`$env:USERPROFILE='${LOCAL_ANDROID_HOME}'; $env:HOME='${LOCAL_ANDROID_HOME}'; $env:HOMEDRIVE='D:'; $env:HOMEPATH='\\DiagnosticsOS Nexus system\\tools\\android-home'; $env:ANDROID_USER_HOME='${path.join(LOCAL_ANDROID_HOME, ".android")}'; if (-not (Test-Path $env:ANDROID_USER_HOME)) { New-Item -ItemType Directory -Force -Path $env:ANDROID_USER_HOME | Out-Null }; & '${LOCAL_ADB}' ${args.join(" ")}`, { timeoutMs: options.timeoutMs || 15000 });
}

function parseAdbDevices(output) {
  return output.split(/\r?\n/).slice(1).map(line => line.trim()).filter(Boolean).filter(line => !line.startsWith("*")).map(line => {
    const [serial, state, ...details] = line.split(/\s+/);
    const detailMap = Object.fromEntries(details.filter(part => part.includes(":")) .map(part => {
      const [key, ...rest] = part.split(":");
      return [key, rest.join(":")];
    }));
    return {
      id: serial,
      udid: serial,
      serial,
      name: detailMap.model || detailMap.device || serial,
      brand: detailMap.product ? detailMap.product.split("_")[0] : "Android",
      mode: state === "device" ? "Normal" : state,
      ios: "Android",
      connected: true,
      source: "adb",
    };
  });
}

function parseFastbootDevices(output) {
  return output.split(/\r?\n/).map(line => line.trim()).filter(Boolean).map(line => {
    const [serial, mode = "fastboot"] = line.split(/\s+/);
    return {
      id: serial,
      udid: serial,
      serial,
      name: serial,
      brand: "Android",
      mode: mode.toUpperCase(),
      ios: "Android / Fastboot",
      connected: true,
      source: "fastboot",
    };
  });
}

function normalizeAppleName(value = "") {
  return value
    .replace(/^Apple Mobile Device USB Driver$/i, "")
    .replace(/^Apple iPhone$/i, "")
    .replace(/\u2019/g, "'")
    .replace(/["']/g, "")
    .trim();
}

function isGenericAppleRecord(device) {
  const normalized = normalizeAppleName(device.name).toLowerCase();
  return !normalized || normalized === 'iphone' || normalized === 'apple iphone';
}

function scoreAppleDevice(device) {
  let score = 0;
  const normalized = normalizeAppleName(device.name);
  if (normalized) score += 4;
  if (!isGenericAppleRecord(device)) score += 6;
  if (device.ios && device.ios !== 'iOS') score += 3;
  if (device.udid) score += 2;
  if (device.serial) score += 1;
  if (device.source === 'pymobiledevice3') score += 2;
  return score;
}

function shouldMergeAppleDevices(left, right) {
  const leftName = normalizeAppleName(left.name).toLowerCase();
  const rightName = normalizeAppleName(right.name).toLowerCase();
  if (left.udid && right.udid && left.udid === right.udid) return true;
  if (left.serial && right.serial && left.serial === right.serial) return true;
  if (leftName && rightName && (leftName.includes(rightName) || rightName.includes(leftName))) return true;
  if (isGenericAppleRecord(left) || isGenericAppleRecord(right)) return true;
  return false;
}

function mergeApplePair(base, incoming) {
  const preferred = scoreAppleDevice(incoming) > scoreAppleDevice(base) ? incoming : base;
  const secondary = preferred === incoming ? base : incoming;
  return {
    ...secondary,
    ...preferred,
    name: normalizeAppleName(preferred.name) || normalizeAppleName(secondary.name) || preferred.name || secondary.name,
    ios: preferred.ios && preferred.ios !== 'iOS' ? preferred.ios : secondary.ios,
    mode: preferred.mode && preferred.mode !== 'Connected' ? preferred.mode : secondary.mode,
    udid: preferred.udid || secondary.udid,
    serial: preferred.serial || secondary.serial,
    id: preferred.id || secondary.id,
    source: preferred.source === secondary.source ? preferred.source : secondary.source + '+' + preferred.source,
    details: {
      ...(secondary.details || {}),
      ...(preferred.details || {}),
    },
  };
}

function mergeDevices(devices) {
  const merged = [];

  for (const device of devices) {
    if (device.brand !== 'Apple') {
      merged.push(device);
      continue;
    }

    const normalizedDevice = {
      ...device,
      name: normalizeAppleName(device.name) || device.name,
    };

    const existingIndex = merged.findIndex(item => item.brand === 'Apple' && shouldMergeAppleDevices(item, normalizedDevice));

    if (existingIndex === -1) {
      merged.push(normalizedDevice);
      continue;
    }

    merged[existingIndex] = mergeApplePair(merged[existingIndex], normalizedDevice);
  }

  return merged;
}


function parseLooseStructuredOutput(raw = "") {
  const text = cleanCliOutput(raw);
  if (!text) return {};

  try {
    return JSON.parse(text);
  } catch {
  }

  const result = {};
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("Usage:")) continue;
    const match = trimmed.match(/^([A-Za-z0-9 _./()-]+?)\s*[:=]\s*(.+)$/);
    if (match) {
      const [, key, value] = match;
      result[key.trim()] = value.trim().replace(/^["']|["']$/g, "");
    }
  }
  return result;
}

function parseCrashList(raw = "") {
  const text = cleanCliOutput(raw);
  const lines = text
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(Boolean)
    .filter(line => !line.startsWith("Usage:") && !line.startsWith("ERROR"));

  const panicLines = lines.filter(line => /panic|panic-full|panic-base/i.test(line));
  return {
    CrashLogCount: lines.length || 0,
    PanicLogCount: panicLines.length || 0,
    PanicLogSummary: panicLines.length
      ? `${panicLines.length} panic log(s)`
      : lines.length
        ? `${lines.length} crash log(s), no panic files matched`
        : "No crash logs",
  };
}

function normalizeCliErrorMessage(error) {
  return cleanCliOutput(error instanceof Error ? error.message : String(error));
}

async function getCrashSummary(cliArgs = []) {
  const requestedUdidIndex = cliArgs.indexOf("--udid");
  const requestedUdid = requestedUdidIndex >= 0 ? cliArgs[requestedUdidIndex + 1] : "";
  const cacheKey = requestedUdid || "default";

  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const pythonResult = await runApplePanicReader(requestedUdid, PANIC_REPORTS_DIR);
      if (pythonResult?.ok || pythonResult?.PanicLogSummary) {
        if (pythonResult?.ok) {
          setApplePanicCache(cacheKey, pythonResult);
        }
        return pythonResult;
      }
    } catch {
    }

    if (attempt < 2) {
      await sleep(400);
    }
  }

  const listVariants = [
    ["crash", "ls", ...cliArgs],
    ["crash", "ls"],
    ["crash", "ls", "--remote-file", "/var/mobile/Library/Logs/CrashReporter", ...cliArgs],
    ["crash", "ls", "--remote-file", "/var/mobile/Library/Logs/CrashReporter/DiagnosticLogs", ...cliArgs],
  ];

  try {
    await runPyMobileDevice3(["crash", "flush", ...cliArgs], { timeoutMs: 15000 });
  } catch {
  }

  for (const args of listVariants) {
    try {
      const result = await runPyMobileDevice3(args, { timeoutMs: 20000 });
      const parsed = parseCrashList(result.stdout);
      if ((parsed.PanicLogCount || 0) > 0 || parsed.PanicLogLatest || parsed.PanicLogPaths?.length) {
        setApplePanicCache(cacheKey, parsed);
      }
      return parsed;
    } catch (error) {
      const message = normalizeCliErrorMessage(error);
      if (/AfcFileNotFoundError|status:\s*8|No such file|READ_DIR failed/i.test(message)) {
        const cached = getApplePanicCache(cacheKey);
        if (cached?.data) {
          return {
            ...cached.data,
            PanicLogSummary: cached.data.PanicLogSummary || "Using cached panic data",
            panicCacheStatus: "using cached panic data after crash service failure",
            crashStatus: message,
          };
        }
        return {
          PanicLogSummary: "Crash service unavailable on this Windows path",
          crashStatus: message,
        };
      }
    }
  }

  const cached = getApplePanicCache(cacheKey);
  if (cached?.data) {
    return {
      ...cached.data,
      PanicLogSummary: cached.data.PanicLogSummary || "Using cached panic data",
      panicCacheStatus: "using cached panic data after retry failure",
    };
  }

  return {
    PanicLogSummary: "Unavailable",
  };
}

function pickFirst(...values) {
  return values.find(value => value !== undefined && value !== null && String(value).trim() !== "");
}

function normalizeDetailKeys(details = {}) {
  const normalized = { ...details };
  normalized.UDID = pickFirst(
    normalized.UDID,
    normalized.UniqueDeviceID,
    normalized.UniqueChipID,
    normalized.Identifier,
  );
  normalized.SerialNumber = pickFirst(
    normalized.SerialNumber,
    normalized.Serial,
    normalized.HardwareSerialNumber,
  );
  normalized.ProductVersion = pickFirst(normalized.ProductVersion, normalized.iOSVersion);
  normalized.DeviceName = pickFirst(normalized.DeviceName, normalized.Name);
  normalized.BatteryCycleCount = pickFirst(
    normalized.BatteryCycleCount,
    normalized.CycleCount,
    normalized.BatteryCycle,
  );
  normalized.BatteryHealth = pickFirst(
    normalized.BatteryHealth,
    normalized.MaximumCapacity ? `${normalized.MaximumCapacity}% max capacity` : "",
  );
  return normalized;
}

function buildAppleCacheKey(device) {
  return [
    device.udid,
    device.serial,
    device.id,
    device.details?.UniqueDeviceID,
    device.details?.SerialNumber,
  ].find(Boolean) || "apple-device";
}

function getAppleCliDeviceArgs(device) {
  const udid = pickFirst(
    device.details?.UniqueDeviceID,
    device.details?.SerialNumber,
    device.udid,
    device.serial,
  );
  return udid ? ["--udid", udid] : [];
}

async function enrichAppleDevice(device) {
  const cacheKey = buildAppleCacheKey(device);
  const cached = appleEnrichmentCache.get(cacheKey);
  if (cached && (Date.now() - cached.timestamp) < APPLE_ENRICH_CACHE_TTL_MS) {
    return {
      ...device,
      details: {
        ...(device.details || {}),
        ...cached.details,
      },
    };
  }

  const baseDetails = normalizeDetailKeys(device.details || {});
  const cliArgs = getAppleCliDeviceArgs(device);
  const extraDetails = {};

  const attempts = [
    {
      key: "lockdown",
      run: () => runPyMobileDevice3(["lockdown", "info", ...cliArgs], { timeoutMs: 20000 }),
      parse: ({ stdout }) => parseLooseStructuredOutput(stdout),
    },
    {
      key: "battery",
      run: () => runPyMobileDevice3(["diagnostics", "battery", "single", ...cliArgs], { timeoutMs: 15000 }),
      parse: ({ stdout }) => parseLooseStructuredOutput(stdout),
    },
    {
      key: "wifi",
      run: () => runPyMobileDevice3(["diagnostics", "battery", "wifi", ...cliArgs], { timeoutMs: 15000 }),
      parse: ({ stdout }) => {
        const parsed = parseLooseStructuredOutput(stdout);
        const mapped = {};
        if (parsed.MACAddress || parsed.WiFiAddress) mapped.WiFiAddress = pickFirst(parsed.WiFiAddress, parsed.MACAddress);
        if (parsed.BluetoothAddress) mapped.BluetoothAddress = parsed.BluetoothAddress;
        return { ...parsed, ...mapped };
      },
    },
    {
      key: "activation",
      run: () => runPyMobileDevice3(["activation", "state", ...cliArgs], { timeoutMs: 15000 }),
      parse: ({ stdout }) => {
        const parsed = parseLooseStructuredOutput(stdout);
        if (!Object.keys(parsed).length && stdout) {
          return { ActivationState: stdout.split(/\r?\n/).pop()?.trim() || stdout.trim() };
        }
        return parsed;
      },
    },
    {
      key: "mobilegestalt",
      run: () => runPyMobileDevice3([
        "diagnostics",
        "mg",
        "--keys",
        "BasebandVersion,RegionInfo,RegionCode,MarketingProductName,ModelNumber,WiFiAddress,BluetoothAddress,InternationalMobileEquipmentIdentity",
        ...cliArgs,
      ], { timeoutMs: 20000 }),
      parse: ({ stdout }) => parseLooseStructuredOutput(stdout),
    },
    {
      key: "crash",
      run: () => getCrashSummary(cliArgs),
      parse: payload => payload,
    },
  ];

  for (const attempt of attempts) {
    try {
      Object.assign(extraDetails, attempt.parse(await attempt.run()));
    } catch (error) {
      extraDetails[`${attempt.key}Status`] = error instanceof Error ? error.message : "Unavailable";
    }
  }

  const details = normalizeDetailKeys({
    ...baseDetails,
    ...extraDetails,
    IMEI: pickFirst(
      extraDetails.IMEI,
      extraDetails.InternationalMobileEquipmentIdentity,
      baseDetails.IMEI,
    ),
    Region: pickFirst(
      extraDetails.Region,
      extraDetails.RegionInfo,
      extraDetails.RegionCode,
      baseDetails.Region,
    ),
    Model: pickFirst(
      extraDetails.Model,
      extraDetails.MarketingProductName,
      extraDetails.ModelNumber,
      baseDetails.Model,
    ),
    BasebandVersion: pickFirst(extraDetails.BasebandVersion, baseDetails.BasebandVersion),
    WiFiAddress: pickFirst(extraDetails.WiFiAddress, extraDetails.MACAddress, baseDetails.WiFiAddress),
    BluetoothAddress: pickFirst(extraDetails.BluetoothAddress, baseDetails.BluetoothAddress),
    ActivationState: pickFirst(extraDetails.ActivationState, extraDetails.State, baseDetails.ActivationState),
  });

  appleEnrichmentCache.set(cacheKey, { timestamp: Date.now(), details });

  return {
    ...device,
    details,
    udid: pickFirst(device.udid, details.UniqueDeviceID, details.UDID) || "",
    serial: pickFirst(device.serial, details.SerialNumber, details.HardwareSerialNumber) || "",
    name: normalizeAppleName(pickFirst(details.DeviceName, device.name)) || device.name,
    ios: details.ProductVersion ? `iOS ${details.ProductVersion}` : device.ios,
  };
}


async function listAppleDevicesViaPyMobileDevice3() {
  if (!fs.existsSync(LOCAL_PYMOBILEDEVICE3)) return [];
  try {
    const result = await runProcess(LOCAL_PYMOBILEDEVICE3, ["usbmux", "list"], { shell: false, timeoutMs: 15000 });
    const lines = result.stdout.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
    const devices = [];
    let current = null;

    for (const line of lines) {
      if (line.startsWith('{')) {
        current = {};
        continue;
      }
      if (line.startsWith('}')) {
        if (current && Object.keys(current).length > 0) {
          devices.push({
            id: current.SerialNumber || current.UDID || current.DeviceID || `apple-cli-${devices.length}`,
            udid: current.SerialNumber || current.UDID || '',
            serial: current.SerialNumber || current.UDID || '',
            name: current.DeviceName || current.ProductType || 'Apple iPhone',
            brand: 'Apple',
            mode: 'Normal',
            ios: current.ProductVersion ? `iOS ${current.ProductVersion}` : 'iOS',
            connected: true,
            source: 'pymobiledevice3',
            details: { ...current },
          });
        }
        current = null;
        continue;
      }
      if (!current) {
        continue;
      }
      const match = line.match(/^"?([^":]+)"?\s*:\s*"?(.+?)"?,?$/);
      if (match) {
        const [, key, value] = match;
        current[key.trim()] = value.trim();
      }
    }

    return devices;
  } catch {
    return [];
  }
}

async function listAppleDevicesViaPnP() {
  const script = "$devices = Get-CimInstance Win32_PnPEntity | Where-Object { $_.Name -like '*iPhone*' -or $_.Name -like '*iPad*' -or $_.Name -like '*Apple Mobile Device USB Driver*' }; $devices | ForEach-Object { [PSCustomObject]@{ name = $_.Name; id = $_.PNPDeviceID; status = $_.Status } } | ConvertTo-Json -Compress";
  const result = await runPowerShell(script, { timeoutMs: 15000 });
  let parsed = [];
  try {
    parsed = JSON.parse(result.stdout || "[]");
  } catch {
    parsed = [];
  }
  if (!Array.isArray(parsed)) parsed = parsed ? [parsed] : [];
  return parsed.map((device, index) => ({
    id: device.id || `apple-pnp-${index}`,
    udid: device.id || "",
    serial: device.id || "",
    name: device.name || "Apple Device",
    brand: "Apple",
    mode: device.status || "Connected",
    ios: "iOS",
    connected: true,
    source: "windows-pnp",
    details: {
      FriendlyName: device.name || "",
      PNPDeviceID: device.id || "",
      Status: device.status || "",
    },
  }));
}

async function getTools() {
  return {
    adb: fs.existsSync(LOCAL_ADB) ? LOCAL_ADB : null,
    fastboot: fs.existsSync(LOCAL_FASTBOOT) ? LOCAL_FASTBOOT : null,
    pymobiledevice3: fs.existsSync(LOCAL_PYMOBILEDEVICE3) ? LOCAL_PYMOBILEDEVICE3 : null,
    apple_pnp: "powershell-cim",
  };
}

async function scanDevices() {
  const tools = await getTools();
  const devices = [];
  const errors = [];

  if (tools.adb) {
    try {
      const result = await runAdb(["devices", "-l"]);
      devices.push(...parseAdbDevices(result.stdout));
    } catch (error) {
      errors.push(`adb: ${error.message}`);
    }
  }

  if (tools.fastboot) {
    try {
      const result = await runPowerShell(`& '${LOCAL_FASTBOOT}' devices`, { timeoutMs: 10000 });
      for (const device of parseFastbootDevices(result.stdout)) {
        if (!devices.some(existing => existing.id === device.id)) devices.push(device);
      }
    } catch {
    }
  }

  try {
    const applePnP = await listAppleDevicesViaPnP();
    for (const device of applePnP) {
      if (!devices.some(existing => existing.id === device.id)) devices.push(device);
    }
  } catch (error) {
    errors.push(`apple-pnp: ${error.message}`);
  }

  try {
    const appleCli = await listAppleDevicesViaPyMobileDevice3();
    for (const device of appleCli) {
      if (!devices.some(existing => existing.id === device.id)) devices.push(device);
    }
  } catch (error) {
    errors.push(`apple-cli: ${error.message}`);
  }

  let mergedDevices = mergeDevices(devices);
  if (mergedDevices.some(device => device.brand === "Apple")) {
    mergedDevices = await Promise.all(
      mergedDevices.map(device => device.brand === "Apple" ? enrichAppleDevice(device) : device)
    );
  }
  const error = !mergedDevices.length && errors.length ? errors.join(" | ") : "";
  return { devices: mergedDevices, tools, error };
}

async function runAction(action, options = {}) {
  const tools = await getTools();
  if (action === "restart-adb") {
    if (!tools.adb) throw new Error("adb is not available");
    await runAdb(["kill-server"], { timeoutMs: 20000 });
    const adbServer = spawn(LOCAL_ADB, ["start-server"], {
      shell: false,
      detached: true,
      stdio: "ignore",
      windowsHide: true,
      env: androidEnv(),
      cwd: ROOT_DIR,
    });
    adbServer.unref();
    return { message: "ADB server restart requested", tools };
  }
  if (action === "pair-apple") {
    if (tools.pymobiledevice3) {
      await runProcess(tools.pymobiledevice3, ["lockdown", "pair"], { shell: false, timeoutMs: 20000 });
      return { message: "Apple pair command sent", tools };
    }
    return { message: "Apple device trust is managed by Windows/iTunes for this setup", tools };
  }
  if (action === "pull-latest-panic") {
    const requestedUdid = options.udid || "";
    const cacheKey = requestedUdid || "default";
    const panicResult = await runApplePanicReader(requestedUdid, PANIC_REPORTS_DIR);
    if (panicResult?.ok) {
      setApplePanicCache(cacheKey, panicResult);
    }
    const cached = getApplePanicCache(cacheKey);
    return {
      message: panicResult.ok ? "Latest panic pulled" : "Latest panic pull failed",
      tools,
      panic: panicResult.ok ? panicResult : (cached?.data || panicResult),
    };
  }
  if (action === "scan-fastboot") {
    if (!tools.fastboot) throw new Error("fastboot is not available");
    await runPowerShell(`& '${LOCAL_FASTBOOT}' devices`, { timeoutMs: 10000 });
    return { message: "Fastboot devices query sent", tools };
  }
  throw new Error(`Unsupported action: ${action}`);
}

function writeJson(response, statusCode, payload) {
  response.writeHead(statusCode, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  });
  response.end(JSON.stringify(payload));
}

function contentTypeFor(filePath = "") {
  const ext = path.extname(filePath).toLowerCase();
  return ({
    ".html": "text/html; charset=utf-8",
    ".js": "application/javascript; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".svg": "image/svg+xml",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".ico": "image/x-icon",
  })[ext] || "application/octet-stream";
}

function tryServeStatic(requestPath, response) {
  if (!STATIC_DIST_DIR || !fs.existsSync(STATIC_DIST_DIR)) return false;
  const normalizedPath = requestPath === "/" ? "/index.html" : requestPath;
  const relativePath = normalizedPath.replace(/^\/+/, "");
  const filePath = path.resolve(STATIC_DIST_DIR, relativePath);
  if (!filePath.startsWith(path.resolve(STATIC_DIST_DIR))) return false;

  const serveFile = targetPath => {
    if (!fs.existsSync(targetPath) || fs.statSync(targetPath).isDirectory()) return false;
    response.writeHead(200, { "Content-Type": contentTypeFor(targetPath) });
    response.end(fs.readFileSync(targetPath));
    return true;
  };

  if (serveFile(filePath)) return true;
  if (!path.extname(relativePath)) {
    return serveFile(path.join(STATIC_DIST_DIR, "index.html"));
  }
  return false;
}

function safePanicPath(filePath = "") {
  if (!filePath) return null;
  const resolved = path.resolve(filePath);
  const allowedRoot = path.resolve(PANIC_REPORTS_DIR);
  if (!resolved.startsWith(allowedRoot + path.sep) && resolved !== allowedRoot) {
    return null;
  }
  return resolved;
}

const server = http.createServer(async (request, response) => {
  if (!request.url) return writeJson(response, 400, { error: "Missing request URL" });
  if (request.method === "OPTIONS") return writeJson(response, 204, {});
  const url = new URL(request.url, `http://127.0.0.1:${PORT}`);

  try {
if (request.method === "GET" && url.pathname === "/api/health") return writeJson(response, 200, { ok: true, tools: await getTools(), host: HOST, port: PORT });
    if (request.method === "GET" && url.pathname === "/api/agents") {
      return writeJson(response, 200, {
        ok: true,
        agents: listRegisteredAgents(),
        directory: {
          host: HOST,
          port: PORT,
          heartbeatMs: AGENT_DIRECTORY_HEARTBEAT_MS,
          ttlMs: AGENT_DIRECTORY_TTL_MS,
        },
      });
    }
    if (request.method === "POST" && url.pathname === "/api/agents/register") {
      const payload = await readJsonBody(request);
      const agentUrl = normalizeHttpUrl(payload.url || payload.agentUrl || "");
      if (!agentUrl) return writeJson(response, 400, { error: "A valid agent URL is required" });
      const agentId = String(payload.id || payload.agentId || payload.name || agentUrl).trim();
      const entry = {
        id: agentId,
        name: String(payload.name || payload.agentName || agentId).trim(),
        url: agentUrl,
        host: String(payload.host || "").trim(),
        port: Number(payload.port || 0) || null,
        tools: payload.tools && typeof payload.tools === "object" ? payload.tools : {},
        capabilities: Array.isArray(payload.capabilities) ? payload.capabilities : [],
        sourceIp: request.socket?.remoteAddress || "",
        lastSeenAt: new Date().toISOString(),
        lastSeenTs: Date.now(),
      };
      agentDirectory.set(agentId, entry);
      return writeJson(response, 200, { ok: true, agent: { ...entry, lastSeenTs: undefined } });
    }
    if (request.method === "POST" && url.pathname === "/api/agents/unregister") {
      const payload = await readJsonBody(request);
      const agentId = String(payload.id || payload.agentId || "").trim();
      if (!agentId) return writeJson(response, 400, { error: "Agent id is required" });
      agentDirectory.delete(agentId);
      return writeJson(response, 200, { ok: true, removed: agentId });
    }
    if ((request.method === "GET" && url.pathname === "/api/devices") || (request.method === "POST" && url.pathname === "/api/scan")) return writeJson(response, 200, await scanDevices());
    if (request.method === "GET" && url.pathname === "/api/panic-file") {
      const filePath = url.searchParams.get("path") || "";
      const safePath = safePanicPath(filePath);
      if (!safePath) return writeJson(response, 400, { error: "Invalid panic file path" });
      if (!fs.existsSync(safePath)) return writeJson(response, 404, { error: "Panic file not found" });
      const content = fs.readFileSync(safePath, "utf8");
      return writeJson(response, 200, {
        ok: true,
        path: safePath,
        fileName: path.basename(safePath),
        content,
      });
    }
    if (request.method === "POST" && url.pathname === "/api/command") {
      let body = "";
      request.on("data", chunk => { body += chunk.toString(); });
      request.on("end", async () => {
        try {
          const payload = body ? JSON.parse(body) : {};
          writeJson(response, 200, await runAction(payload.action, payload));
        } catch (error) {
          writeJson(response, 400, { error: error instanceof Error ? error.message : "Command failed" });
        }
      });
      return;
    }
    if (request.method === "POST" && url.pathname === "/api/ai-analysis") {
      let body = "";
      request.on("data", chunk => { body += chunk.toString(); });
      request.on("end", async () => {
        try {
          const payload = body ? JSON.parse(body) : {};
          writeJson(response, 200, await runAiAnalysis(payload.fault || payload));
        } catch (error) {
          writeJson(response, 400, { error: error instanceof Error ? error.message : "AI analysis failed" });
        }
      });
      return;
    }

    if (request.method === "GET" && tryServeStatic(url.pathname, response)) return;
    writeJson(response, 404, { error: "Not found" });
  } catch (error) {
    writeJson(response, 500, { error: error instanceof Error ? error.message : "Internal server error" });
  }
});

server.listen(PORT, HOST, () => {
  console.log(`Device API listening on http://${HOST}:${PORT}`);
  if (DIRECTORY_URL && AGENT_PUBLIC_URL) {
    registerCurrentAgentWithDirectory();
    const heartbeat = setInterval(registerCurrentAgentWithDirectory, AGENT_DIRECTORY_HEARTBEAT_MS);
    heartbeat.unref?.();
  }
});










