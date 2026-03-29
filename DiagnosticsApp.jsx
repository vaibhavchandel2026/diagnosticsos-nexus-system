
import { useEffect, useMemo, useState } from "react";
import RightPanel from "./src/components/layout/RightPanel";
import Titlebar from "./src/components/layout/Titlebar";
import Sidebar from "./src/components/layout/Sidebar";
import Waveform from "./src/components/common/Waveform";
import "./src/styles/theme.css";
import { PANIC_DB } from "./src/data/mockData";
import { PANIC_RULES } from "./src/data/panicRules";
import { REPAIR_KNOWLEDGE_RECORDS } from "./src/data/repairKnowledgeData";
import { VOLTAGE_SEQUENCE_DATABASE } from "./src/data/voltageSequenceDatabase";
import { CURRENT_CONSUMPTION_DATABASE, CURRENT_CONSUMPTION_PRESETS } from "./src/data/currentConsumptionDatabase";
import { DEVICE_MODEL_RAIL_DATABASE, FAMILY_RAIL_PACKS } from "./src/data/deviceModelRailDatabase";

const TICKETS = [
  { id: "TKT-001", device: "iPhone 14 Pro", issue: "No charge / 0.00A", status: "IN_PROGRESS", severity: "HIGH" },
  { id: "TKT-002", device: "iPhone 13", issue: "Boot loop / S2 handshake", status: "OPEN", severity: "CRITICAL" },
  { id: "TKT-003", device: "iPhone 15 Pro", issue: "No image / display path", status: "WAITING", severity: "HIGH" },
];

function toneFromSeverity(severity) {
  if (severity === "critical") return "critical";
  if (severity === "high" || severity === "warning") return "high";
  return "normal";
}

function difficultyTone(level) {
  if (level === "EXPERT") return "critical";
  if (level === "POPULAR") return "high";
  return "normal";
}

function randomInRange(min, max, jitter = 0) {
  const base = min + ((max - min) / 2);
  return Math.max(0, base + ((Math.random() - 0.5) * jitter));
}

function parseVoltageValue(text) {
  const match = String(text || "").match(/\d+(?:\.\d+)?/);
  return match ? Number(match[0]) : 0;
}

function SimpleModule({ title, text }) {
  return (
    <div>
      <div className="section-heading">{title}</div>
      <div className="card">
        <div className="card-body" style={{ color: "var(--text-secondary)", lineHeight: 1.7 }}>{text}</div>
      </div>
    </div>
  );
}

const MAX_LOG_LINES = 48;
const AGENT_URL_STORAGE_KEY = "diagnostics-agent-base-url";
const DIRECTORY_URL_STORAGE_KEY = "diagnostics-directory-base-url";

function normalizeAgentBaseUrl(value) {
  const input = String(value || "").trim();
  if (!input) {
    if (typeof window !== "undefined") return window.location.origin;
    return "";
  }
  const withProtocol = /^https?:\/\//i.test(input) ? input : `http://${input}`;
  return withProtocol.replace(/\/+$/, "");
}

async function requestJson(baseUrl, url, options = {}) {
  const target = `${normalizeAgentBaseUrl(baseUrl)}${url}`;
  const response = await fetch(target, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  const raw = await response.text();
  const payload = raw ? JSON.parse(raw) : {};
  if (!response.ok) {
    throw new Error(payload?.error || `Request failed (${response.status})`);
  }
  return payload;
}

export default function DiagnosticsApp() {
  const [activeModule, setActiveModule] = useState("dashboard");
  const [connectedDevices, setConnectedDevices] = useState([]);
  const [termLog, setTermLog] = useState([
    { type: "info", ts: new Date().toLocaleTimeString(), msg: "DiagnosticsOS initialized" },
    { type: "info", ts: new Date().toLocaleTimeString(), msg: "Repair, voltage, and current databases loaded" },
  ]);
  const [panicSearch, setPanicSearch] = useState("");
  const [panicFilter, setPanicFilter] = useState("ALL");
  const [selectedPanicId, setSelectedPanicId] = useState(PANIC_DB[0]?.id || "");
  const [selectedRepairId, setSelectedRepairId] = useState(REPAIR_KNOWLEDGE_RECORDS[0]?.fault_code || "");
  const [selectedVoltageModel, setSelectedVoltageModel] = useState("iPhone 14 Pro");
  const [currentDCProfile, setCurrentDCProfile] = useState("CS-023");
  const [selectedDeviceId, setSelectedDeviceId] = useState("");
  const [scanBusy, setScanBusy] = useState(false);
  const [scanError, setScanError] = useState("");
  const [availableTools, setAvailableTools] = useState({});
  const [actionBusy, setActionBusy] = useState("");
  const [latestPanicPull, setLatestPanicPull] = useState(null);
  const [aiBusy, setAiBusy] = useState(false);
  const [aiError, setAiError] = useState("");
  const [aiResult, setAiResult] = useState(null);
  const [backendHealth, setBackendHealth] = useState({ status: "checking", message: "Checking backend..." });
  const [lastActionMessage, setLastActionMessage] = useState("");
  const [agentBaseUrl, setAgentBaseUrl] = useState(() => {
    if (typeof window === "undefined") return "";
    return normalizeAgentBaseUrl(window.localStorage.getItem(AGENT_URL_STORAGE_KEY) || window.location.origin);
  });
  const [agentInput, setAgentInput] = useState(() => {
    if (typeof window === "undefined") return "";
    return normalizeAgentBaseUrl(window.localStorage.getItem(AGENT_URL_STORAGE_KEY) || window.location.origin);
  });
  const [directoryBaseUrl, setDirectoryBaseUrl] = useState(() => {
    if (typeof window === "undefined") return "";
    return normalizeAgentBaseUrl(window.localStorage.getItem(DIRECTORY_URL_STORAGE_KEY) || window.location.origin);
  });
  const [directoryInput, setDirectoryInput] = useState(() => {
    if (typeof window === "undefined") return "";
    return normalizeAgentBaseUrl(window.localStorage.getItem(DIRECTORY_URL_STORAGE_KEY) || window.location.origin);
  });
  const [registeredAgents, setRegisteredAgents] = useState([]);
  const [directoryBusy, setDirectoryBusy] = useState(false);
  const [directoryError, setDirectoryError] = useState("");

  const selectedRepair = REPAIR_KNOWLEDGE_RECORDS.find((record) => record.fault_code === selectedRepairId) || REPAIR_KNOWLEDGE_RECORDS[0];
  const repairBrandCount = new Set(REPAIR_KNOWLEDGE_RECORDS.map((record) => String(record.device).split("|")[0].trim())).size;
  const repairComponentCount = new Set(REPAIR_KNOWLEDGE_RECORDS.map((record) => record.component)).size;

  const filteredPanics = useMemo(() => {
    const q = panicSearch.trim().toLowerCase();
    return PANIC_DB.filter((record) => {
      const matchesSearch = !q || [record.code, record.brand, record.model, record.component, record.description].some((value) => String(value).toLowerCase().includes(q));
      const matchesFilter = panicFilter === "ALL" || record.severity === panicFilter || record.brand === panicFilter;
      return matchesSearch && matchesFilter;
    }).slice(0, 100);
  }, [panicSearch, panicFilter]);

  const selectedPanic = filteredPanics.find((record) => record.id === selectedPanicId) || PANIC_DB[0];
  const panicAnalysis = useMemo(() => {
    const text = `${selectedPanic?.description || ""} ${selectedPanic?.solution || ""}`;
    return PANIC_RULES.find((item) => item.patterns.some((pattern) => pattern.test(text))) || {
      subsystem: selectedPanic?.component || "General Logic",
      confidence: "Medium",
      summary: "General panic pattern loaded from the panic database.",
      checks: "1. Confirm current draw pattern. 2. Inspect related rails. 3. Compare with known-good board measurements.",
    };
  }, [selectedPanic]);

  const activeDeviceModel = DEVICE_MODEL_RAIL_DATABASE.find((entry) => entry.model_name === selectedVoltageModel) || DEVICE_MODEL_RAIL_DATABASE[0];
  const activeFamilyPack = FAMILY_RAIL_PACKS[activeDeviceModel?.family_group] || FAMILY_RAIL_PACKS.A16;
  const activeVoltageGeneration = VOLTAGE_SEQUENCE_DATABASE.find((entry) => {
    if (activeDeviceModel?.family_group === "A13" || activeDeviceModel?.family_group === "A14") return entry.generation_code === "GEN_1_5";
    if (activeDeviceModel?.family_group === "A15") return entry.generation_code === "GEN_2";
    if (activeDeviceModel?.family_group === "A16") return entry.generation_code === "GEN_2_5";
    if (activeDeviceModel?.family_group === "A17") return entry.generation_code === "GEN_3";
    return false;
  }) || VOLTAGE_SEQUENCE_DATABASE[0];
  const activeVoltageRails = activeFamilyPack?.rails || [];
  const activeBootSequence = activeFamilyPack?.sequence || activeVoltageGeneration?.boot_sequence?.sequence || [];
  const voltageSummary = activeVoltageRails.map((rail) => {
    const nominal = rail.nominal ?? parseVoltageValue(rail.voltage);
    const measured = rail.dynamic ? randomInRange(rail.min ?? nominal, rail.max ?? nominal, 0.03) : randomInRange(rail.min ?? nominal, rail.max ?? nominal, 0.02);
    const min = rail.min ?? nominal - (rail.tolerance || 0.05);
    const max = rail.max ?? nominal + (rail.tolerance || 0.05);
    const ok = measured >= min && measured <= max;
    const warn = !ok && measured >= min - 0.04 && measured <= max + 0.04;
    return { rail, measured, nominal, min, max, ok, warn };
  });
  const voltageReadings = Object.fromEntries(voltageSummary.slice(0, 4).map((item) => [item.rail.name, item.measured.toFixed(3)]));
  const handshakeStatus = (() => {
    const main = voltageSummary.find((item) => item.rail.name === "PP_VDD_MAIN");
    const cpu = voltageSummary.find((item) => item.rail.name === "PP_VDD_CPU");
    const s2 = voltageSummary.find((item) => item.rail.name === "PP1V8_S2");
    if (!s2) return { state: "N/A", note: "Selected generation does not use PP1V8_S2 handshake logic.", tone: "normal" };
    if (main?.ok && cpu?.ok && !s2.ok) return { state: "FAULT", note: "VCC_MAIN and VDD_CPU are present, but PP1V8_S2 is missing or weak. RAM-to-CPU handshake is failing.", tone: "critical" };
    if (main?.ok && cpu?.ok && s2.ok) return { state: "OK", note: "Main, CPU, and S2 rails are all within the expected range.", tone: "normal" };
    return { state: "CHECK", note: "Stabilize the earlier boot rails before trusting S2 handshake results.", tone: "high" };
  })();

  const dcProfile = CURRENT_CONSUMPTION_DATABASE.find((entry) => entry.code === currentDCProfile) || CURRENT_CONSUMPTION_DATABASE[22];
  const dcCurrent = randomInRange(dcProfile.min_current, dcProfile.max_current, 0.01);
  const dcSeverityTone = toneFromSeverity(dcProfile.severity);
  const dcWaveformStatus = dcSeverityTone === "high" ? "warning" : dcSeverityTone;
  const dcPresetEntries = CURRENT_CONSUMPTION_PRESETS.map((code) => CURRENT_CONSUMPTION_DATABASE.find((entry) => entry.code === code)).filter(Boolean);
  const dcShortAlert = dcProfile.category === "Full Short" || dcProfile.category === "Half Short";
  const selectedDevice = connectedDevices.find((device) => device.id === selectedDeviceId) || connectedDevices[0] || null;

  const appendLog = (type, msg) => {
    setTermLog((prev) => [
      ...prev.slice(-(MAX_LOG_LINES - 1)),
      { type, ts: new Date().toLocaleTimeString(), msg },
    ]);
  };

  const scanDevices = async () => {
    setScanBusy(true);
    setScanError("");
    try {
      const payload = await requestJson(agentBaseUrl, "/api/scan", {
        method: "POST",
        body: JSON.stringify({ source: "frontend" }),
      });
      setConnectedDevices(payload.devices || []);
      setAvailableTools(payload.tools || {});
      setLatestPanicPull(null);
      setBackendHealth({ status: "ok", message: "Backend reachable" });
      if (payload.error) {
        setScanError(payload.error);
        appendLog("err", `Scan warning: ${payload.error}`);
      } else {
        appendLog("info", `USB scan complete. ${payload.devices?.length || 0} device(s) detected.`);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Device scan failed";
      setScanError(message);
      setBackendHealth({ status: "error", message });
      appendLog("err", message);
    } finally {
      setScanBusy(false);
    }
  };

  const runBackendAction = async (action, extra = {}) => {
    setActionBusy(action);
    try {
      const payload = await requestJson(agentBaseUrl, "/api/command", {
        method: "POST",
        body: JSON.stringify({ action, ...extra }),
      });
      setAvailableTools(payload.tools || {});
      if (payload.panic) {
        setLatestPanicPull(payload.panic);
      }
      setLastActionMessage(payload.message || `${action} completed`);
      appendLog("info", payload.message || `${action} completed`);
      if (action === "restart-adb" || action === "pair-apple") {
        await scanDevices();
      }
    } catch (error) {
      appendLog("err", error instanceof Error ? error.message : `${action} failed`);
    } finally {
      setActionBusy("");
    }
  };

  const runAiAnalysis = async () => {
    setAiBusy(true);
    setAiError("");
    try {
      const payload = await requestJson(agentBaseUrl, "/api/ai-analysis", {
        method: "POST",
        body: JSON.stringify({
          fault: {
            code: selectedPanic?.code,
            brand: selectedPanic?.brand,
            model: selectedPanic?.model,
            component: selectedPanic?.component,
            severity: selectedPanic?.severity,
            description: selectedPanic?.description,
            solution: selectedPanic?.solution,
          },
        }),
      });
      setAiResult(payload);
      appendLog("info", `AI analysis ready via ${payload.source || "offline"} pipeline.`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "AI analysis failed";
      setAiError(message);
      appendLog("err", message);
    } finally {
      setAiBusy(false);
    }
  };

  const fetchRegisteredAgents = async (baseUrl = directoryBaseUrl) => {
    setDirectoryBusy(true);
    setDirectoryError("");
    try {
      const payload = await requestJson(baseUrl, "/api/agents");
      setRegisteredAgents(payload.agents || []);
      appendLog("info", `Directory sync complete. ${payload.agents?.length || 0} agent(s) listed.`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Directory fetch failed";
      setDirectoryError(message);
      appendLog("err", message);
    } finally {
      setDirectoryBusy(false);
    }
  };

  useEffect(() => {
    if (!connectedDevices.length) {
      setSelectedDeviceId("");
      return;
    }
    if (!connectedDevices.some((device) => device.id === selectedDeviceId)) {
      setSelectedDeviceId(connectedDevices[0].id);
    }
  }, [connectedDevices, selectedDeviceId]);

  useEffect(() => {
    let cancelled = false;
    const boot = async () => {
      try {
        const payload = await requestJson(agentBaseUrl, "/api/health");
        if (cancelled) return;
        setAvailableTools(payload.tools || {});
        setBackendHealth({ status: "ok", message: `Agent online at ${normalizeAgentBaseUrl(agentBaseUrl)}` });
        appendLog("info", "Backend health check passed.");
      } catch (error) {
        if (cancelled) return;
        setBackendHealth({ status: "error", message: error instanceof Error ? error.message : "Health check failed" });
        appendLog("err", error instanceof Error ? error.message : "Health check failed");
      }
      if (!cancelled) {
        scanDevices();
        fetchRegisteredAgents();
      }
    };
    boot();
    return () => {
      cancelled = true;
    };
  }, [agentBaseUrl]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(AGENT_URL_STORAGE_KEY, normalizeAgentBaseUrl(agentBaseUrl));
  }, [agentBaseUrl]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(DIRECTORY_URL_STORAGE_KEY, normalizeAgentBaseUrl(directoryBaseUrl));
  }, [directoryBaseUrl]);

  const applyAgentUrl = () => {
    const normalized = normalizeAgentBaseUrl(agentInput);
    setAgentInput(normalized);
    setAgentBaseUrl(normalized);
    setAiResult(null);
    setLastActionMessage("");
    appendLog("info", `Agent target changed to ${normalized}`);
  };

  const applyDirectoryUrl = () => {
    const normalized = normalizeAgentBaseUrl(directoryInput);
    setDirectoryInput(normalized);
    setDirectoryBaseUrl(normalized);
    fetchRegisteredAgents(normalized);
  };

  const connectRegisteredAgent = (agent) => {
    const normalized = normalizeAgentBaseUrl(agent?.url || "");
    if (!normalized) return;
    setAgentInput(normalized);
    setAgentBaseUrl(normalized);
    setLastActionMessage("");
    appendLog("info", `Connected to registered agent ${agent?.name || normalized}`);
  };

  const openTicketCount = TICKETS.filter((ticket) => ticket.status !== "RESOLVED").length;

  return (
    <div className="app-shell">
      <Titlebar />
      <Sidebar activeModule={activeModule} setActiveModule={setActiveModule} connectedDevicesCount={connectedDevices.length} openTicketsCount={openTicketCount} />
      <main className="main-content">
        <div className="content-area">
          {activeModule === "dashboard" && (
            <div>
              <div className="section-heading">System Dashboard</div>
              <div className="stat-grid">
                {[
                  { label: "USB Devices", value: connectedDevices.length, tone: "cyan" },
                  { label: "Repair Records", value: REPAIR_KNOWLEDGE_RECORDS.length, tone: "green" },
                  { label: "Panic Rules", value: PANIC_RULES.length, tone: "orange" },
                  { label: "Open Tickets", value: openTicketCount, tone: "red" },
                ].map((card) => (
                  <div key={card.label} className={`stat-card ${card.tone}`}>
                    <div className={`stat-val ${card.tone}`}>{card.value}</div>
                    <div className="stat-label">{card.label}</div>
                  </div>
                ))}
              </div>
              <div className="card" style={{ marginBottom: "16px" }}>
                <div className="card-header">
                  <span className="card-title">Live Backend Status</span>
                  <span className={`badge badge-${backendHealth.status === "ok" ? "normal" : backendHealth.status === "checking" ? "high" : "critical"}`}>
                    {backendHealth.status.toUpperCase()}
                  </span>
                </div>
                <div className="card-body" style={{ color: "var(--text-secondary)", lineHeight: 1.6 }}>
                  <div>{backendHealth.message}</div>
                  <div style={{ marginTop: "12px", display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
                    <input
                      className="repair-search"
                      style={{ minWidth: "280px", flex: "1 1 320px" }}
                      value={agentInput}
                      onChange={(event) => setAgentInput(event.target.value)}
                      placeholder="Agent URL, e.g. http://192.168.29.200:8787"
                    />
                    <button className="btn btn-primary" onClick={applyAgentUrl}>Connect Agent</button>
                    <button className="btn btn-ghost" onClick={() => { setAgentInput(window.location.origin); setAgentBaseUrl(window.location.origin); }}>
                      Use This Host
                    </button>
                  </div>
                  <div style={{ marginTop: "12px", display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
                    <input
                      className="repair-search"
                      style={{ minWidth: "280px", flex: "1 1 320px" }}
                      value={directoryInput}
                      onChange={(event) => setDirectoryInput(event.target.value)}
                      placeholder="Directory URL, usually this public app host"
                    />
                    <button className="btn btn-primary" onClick={applyDirectoryUrl}>
                      {directoryBusy ? "Refreshing..." : "Refresh Directory"}
                    </button>
                  </div>
                  <div style={{ marginTop: "8px", fontSize: "11px", color: "var(--text-muted)" }}>
                    Detected tools: {Object.entries(availableTools).filter(([, value]) => value).map(([key]) => key).join(", ") || "none"}
                  </div>
                  {lastActionMessage ? <div style={{ marginTop: "8px", color: "var(--accent-cyan)" }}>Last action: {lastActionMessage}</div> : null}
                  {directoryError ? <div style={{ marginTop: "8px", color: "var(--accent-red)" }}>Directory error: {directoryError}</div> : null}
                  {registeredAgents.length ? (
                    <div style={{ marginTop: "12px", border: "1px solid var(--border)", borderRadius: "8px", padding: "10px", background: "rgba(0,212,255,0.03)" }}>
                      <div style={{ color: "var(--text-muted)", fontSize: "11px", marginBottom: "8px" }}>REGISTERED AGENTS</div>
                      <div style={{ display: "grid", gap: "8px" }}>
                        {registeredAgents.slice(0, 6).map((agent) => (
                          <button
                            key={agent.id}
                            className={`repair-record-card ${normalizeAgentBaseUrl(agent.url) === normalizeAgentBaseUrl(agentBaseUrl) ? "active" : ""}`}
                            onClick={() => connectRegisteredAgent(agent)}
                            style={{ textAlign: "left" }}
                          >
                            <div className="repair-record-header">
                              <div>
                                <div className="repair-record-title">{agent.name}</div>
                                <div className="repair-record-subtitle">{agent.url}</div>
                              </div>
                              <span className="badge badge-normal">{agent.capabilities?.length || 0} caps</span>
                            </div>
                            <div className="repair-record-summary">
                              Last seen: {agent.lastSeenAt ? new Date(agent.lastSeenAt).toLocaleString() : "unknown"}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : null}
                  {!connectedDevices.length ? (
                    <div style={{ marginTop: "8px", color: "var(--text-muted)" }}>
                      No device is currently attached to this PC, so hardware actions can respond successfully but still return no devices.
                    </div>
                  ) : null}
                </div>
              </div>
              <div className="grid-2">
                <div>
                  <div className="card">
                    <div className="card-header">
                      <span className="card-title">DC Current Monitor</span>
                      <span className={`badge badge-${dcSeverityTone}`}>{dcProfile.severity.toUpperCase()}</span>
                    </div>
                    <div className="card-body" style={{ padding: "8px" }}>
                      <div className="oscilloscope"><Waveform current={dcCurrent} status={dcWaveformStatus} /></div>
                      <div style={{ display: "flex", gap: "8px", marginTop: "8px", flexWrap: "wrap", padding: "0 8px 8px" }}>
                        {dcPresetEntries.map((entry) => <button key={entry.code} className={`btn ${currentDCProfile === entry.code ? "btn-primary" : "btn-ghost"}`} style={{ padding: "3px 8px", fontSize: "10px" }} onClick={() => setCurrentDCProfile(entry.code)}>{entry.name}</button>)}
                      </div>
                    </div>
                  </div>
                  <div className="card">
                    <div className="card-header"><span className="card-title">Repair Highlight</span></div>
                    <div className="card-body">
                      <div className="repair-record-title">{selectedRepair.title}</div>
                      <div className="repair-record-subtitle">{selectedRepair.fault_code} | {selectedRepair.component} | Stage {selectedRepair.stage}</div>
                      <div className="repair-record-summary">{selectedRepair.symptoms?.[0]}</div>
                      <div className="repair-record-tags">
                        <span className={`badge badge-${difficultyTone(selectedRepair.difficulty)}`}>{selectedRepair.difficulty}</span>
                        <span className="badge badge-normal">{selectedRepair.success_rate} success</span>
                        <span className="badge badge-normal">{selectedRepair.bench_time}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div>
                  <div className="card">
                    <div className="card-header"><span className="card-title">Voltage Handshake</span></div>
                    <div className="card-body">
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: "12px", marginBottom: "14px" }}>
                        {voltageSummary.slice(0, 4).map(({ rail, measured, ok, warn }) => (
                          <div key={rail.name} className="device-card" style={{ padding: "12px" }}>
                            <div style={{ fontFamily: "var(--font-mono)", color: "var(--text-muted)", fontSize: "11px" }}>{rail.name}</div>
                            <div style={{ fontFamily: "var(--font-display)", fontSize: "28px", color: ok ? "var(--accent-green)" : warn ? "var(--accent-yellow)" : "var(--accent-red)" }}>{measured.toFixed(3)}V</div>
                            <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>Nominal {rail.voltage}</div>
                          </div>
                        ))}
                      </div>
                      <div style={{ padding: "12px", border: `1px solid ${handshakeStatus.tone === "critical" ? "rgba(255,59,127,0.45)" : handshakeStatus.tone === "high" ? "rgba(255,204,0,0.45)" : "rgba(0,255,136,0.3)"}`, borderRadius: "6px" }}>
                        <div style={{ marginBottom: "6px", color: handshakeStatus.tone === "critical" ? "var(--accent-red)" : handshakeStatus.tone === "high" ? "var(--accent-yellow)" : "var(--accent-green)", fontWeight: 700 }}>Handshake Status: {handshakeStatus.state}</div>
                        <div style={{ color: "var(--text-secondary)", lineHeight: 1.5 }}>{handshakeStatus.note}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeModule === "device" && (
            <div>
              <div className="section-heading">Device Detection</div>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "16px" }}>
                <button className="btn btn-primary" onClick={scanDevices} disabled={scanBusy}>
                  {scanBusy ? "Scanning..." : "Scan USB Devices"}
                </button>
                <button className="btn btn-ghost" onClick={() => runBackendAction("restart-adb")} disabled={actionBusy === "restart-adb"}>
                  {actionBusy === "restart-adb" ? "Restarting..." : "Restart ADB"}
                </button>
                <button className="btn btn-ghost" onClick={() => runBackendAction("pair-apple")} disabled={actionBusy === "pair-apple"}>
                  {actionBusy === "pair-apple" ? "Pairing..." : "Pair Apple"}
                </button>
                <button
                  className="btn btn-ghost"
                  onClick={() => runBackendAction("pull-latest-panic", { udid: selectedDevice?.udid || selectedDevice?.serial || "" })}
                  disabled={!selectedDevice || actionBusy === "pull-latest-panic"}
                >
                  {actionBusy === "pull-latest-panic" ? "Pulling..." : "Pull Latest Panic"}
                </button>
              </div>
              <div className="grid-2">
                <div className="card">
                  <div className="card-header"><span className="card-title">Connected Devices</span></div>
                  <div className="card-body">
                    {connectedDevices.length === 0 ? (
                      <div style={{ color: "var(--text-muted)" }}>No devices detected yet. Run a live scan from this browser session.</div>
                    ) : connectedDevices.map((device) => (
                      <button
                        key={device.id}
                        className={`repair-record-card ${selectedDevice?.id === device.id ? "active" : ""}`}
                        onClick={() => setSelectedDeviceId(device.id)}
                        style={{ width: "100%", textAlign: "left", marginBottom: "10px" }}
                      >
                        <div className="repair-record-header">
                          <div>
                            <div className="repair-record-title">{device.name}</div>
                            <div className="repair-record-subtitle">{device.brand} | {device.mode} | {device.ios}</div>
                          </div>
                          <span className="badge badge-normal">{device.source || "live"}</span>
                        </div>
                        <div className="repair-record-summary" style={{ fontFamily: "var(--font-mono)" }}>
                          {device.udid || device.serial || device.id}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="card">
                  <div className="card-header"><span className="card-title">Device Details</span></div>
                  <div className="card-body" style={{ color: "var(--text-secondary)", lineHeight: 1.6 }}>
                    {selectedDevice ? (
                      <>
                        <div className="repair-detail-stats" style={{ marginBottom: "14px" }}>
                          <div><div style={{ color: "var(--text-muted)", fontSize: "11px" }}>Brand</div><div>{selectedDevice.brand}</div></div>
                          <div><div style={{ color: "var(--text-muted)", fontSize: "11px" }}>Mode</div><div>{selectedDevice.mode}</div></div>
                          <div><div style={{ color: "var(--text-muted)", fontSize: "11px" }}>Version</div><div>{selectedDevice.ios || "Unknown"}</div></div>
                          <div><div style={{ color: "var(--text-muted)", fontSize: "11px" }}>Source</div><div>{selectedDevice.source || "live scan"}</div></div>
                        </div>
                        <div style={{ marginBottom: "12px", fontFamily: "var(--font-mono)", fontSize: "11px" }}>
                          {selectedDevice.udid || selectedDevice.serial || selectedDevice.id}
                        </div>
                        {selectedDevice.details ? (
                          <div style={{ maxHeight: "220px", overflow: "auto", border: "1px solid var(--border)", borderRadius: "8px", padding: "10px", background: "rgba(0, 212, 255, 0.03)" }}>
                            {Object.entries(selectedDevice.details).slice(0, 10).map(([key, value]) => (
                              <div key={key} style={{ display: "flex", justifyContent: "space-between", gap: "12px", padding: "4px 0", borderBottom: "1px solid rgba(30,40,64,0.35)", fontSize: "11px" }}>
                                <span style={{ color: "var(--text-muted)" }}>{key}</span>
                                <span style={{ textAlign: "right" }}>{String(value)}</span>
                              </div>
                            ))}
                          </div>
                        ) : null}
                      </>
                    ) : (
                      <div>Select a scanned device to inspect live metadata from the backend.</div>
                    )}
                    {latestPanicPull?.PanicLogSummary ? (
                      <div style={{ marginTop: "14px", padding: "10px", border: "1px solid var(--border)", borderRadius: "8px" }}>
                        <div style={{ color: "var(--accent-cyan)", marginBottom: "4px" }}>Latest Panic Pull</div>
                        <div>{latestPanicPull.PanicLogSummary}</div>
                        {latestPanicPull.panicCacheStatus ? <div style={{ color: "var(--text-muted)", fontSize: "11px", marginTop: "6px" }}>{latestPanicPull.panicCacheStatus}</div> : null}
                      </div>
                    ) : null}
                    {lastActionMessage ? (
                      <div style={{ marginTop: "14px", padding: "10px", border: "1px solid var(--border)", borderRadius: "8px", background: "rgba(0,255,136,0.04)" }}>
                        <div style={{ color: "var(--accent-green)", marginBottom: "4px" }}>Last Action Result</div>
                        <div>{lastActionMessage}</div>
                      </div>
                    ) : null}
                    {scanError ? <div style={{ marginTop: "14px", color: "var(--accent-red)" }}>Scan warning: {scanError}</div> : null}
                    <div style={{ marginTop: "14px", fontSize: "11px", color: "var(--text-muted)" }}>
                      Tools: {Object.entries(availableTools).filter(([, value]) => value).map(([key]) => key).join(", ") || "No tools reported"}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeModule === "panic" && (
            <div>
              <div className="section-heading">Panic Database</div>
              <div className="repair-toolbar" style={{ marginBottom: "16px" }}>
                <input className="repair-search" value={panicSearch} onChange={(event) => setPanicSearch(event.target.value)} placeholder="Search panic code, model, component" />
                <select className="repair-select" value={panicFilter} onChange={(event) => setPanicFilter(event.target.value)}>
                  <option value="ALL">All Severities</option><option value="LOW">LOW</option><option value="MEDIUM">MEDIUM</option><option value="HIGH">HIGH</option><option value="CRITICAL">CRITICAL</option>
                </select>
                <div /><div />
              </div>
              <div className="repair-knowledge-layout">
                <div className="card"><div className="card-body repair-record-list">{filteredPanics.map((record) => <button key={record.id} className={`repair-record-card ${selectedPanic?.id === record.id ? "active" : ""}`} onClick={() => setSelectedPanicId(record.id)}><div className="repair-record-header"><div><div className="repair-record-title">{record.code}</div><div className="repair-record-subtitle">{record.brand} | {record.model} | {record.component}</div></div><span className={`badge badge-${toneFromSeverity(record.severity.toLowerCase())}`}>{record.severity}</span></div><div className="repair-record-summary">{record.description}</div></button>)}</div></div>
                <div className="card"><div className="card-body"><div className="repair-record-title">{selectedPanic?.component}</div><div className="repair-record-subtitle">{selectedPanic?.brand} | {selectedPanic?.model}</div><div className="repair-detail-stats" style={{ marginTop: "14px" }}><div><div style={{ color: "var(--text-muted)", fontSize: "11px" }}>Panic Code</div><div style={{ fontFamily: "var(--font-mono)" }}>{selectedPanic?.code}</div></div><div><div style={{ color: "var(--text-muted)", fontSize: "11px" }}>Confidence</div><div>{selectedPanic?.confidence}%</div></div></div><div className="repair-section-card"><div className="repair-section-title">Description</div><div className="repair-section-list"><div>{selectedPanic?.description}</div></div></div><div className="repair-section-card"><div className="repair-section-title">Subsystem Inference</div><div className="repair-section-list"><div>{panicAnalysis.summary}</div><div>{panicAnalysis.checks}</div></div></div><div className="repair-procedure-card"><div className="repair-section-title">Recommended Repair</div><div className="repair-section-list"><div>{selectedPanic?.solution}</div></div></div></div></div>
              </div>
            </div>
          )}

          {activeModule === "voltage" && (
            <div>
              <div className="section-heading">Voltage Sequence Analyzer</div>
              <div className="card">
                <div className="card-header"><span className="card-title">Device Model & Family Rail Pack</span></div>
                <div className="card-body">
                  <div style={{ display: "grid", gridTemplateColumns: "1.8fr repeat(4, 1fr)", gap: "12px", marginBottom: "12px" }}>
                    <select className="repair-select" value={selectedVoltageModel} onChange={(event) => setSelectedVoltageModel(event.target.value)}>
                      {DEVICE_MODEL_RAIL_DATABASE.map((entry) => <option key={entry.model_name} value={entry.model_name}>{entry.model_name} | {entry.cpu_type} | {entry.family_group}</option>)}
                    </select>
                    <div className="repair-select" style={{ display: "flex", alignItems: "center" }}>{activeDeviceModel.family_group}</div>
                    <div className="repair-select" style={{ display: "flex", alignItems: "center" }}>{activeDeviceModel.cpu_type}</div>
                    <div className="repair-select" style={{ display: "flex", alignItems: "center" }}>Board {activeDeviceModel.board_code}</div>
                    <div className="repair-select" style={{ display: "flex", alignItems: "center" }}>{activeFamilyPack.pack_name}</div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "12px", marginBottom: "12px" }}>
                    <div style={{ padding: "12px", border: "1px solid var(--border)", borderRadius: "8px" }}>
                      <div style={{ color: "var(--text-muted)", fontSize: "11px", marginBottom: "4px" }}>Model Note</div>
                      <div style={{ color: "var(--text-secondary)", lineHeight: 1.5 }}>{activeDeviceModel.notes}</div>
                    </div>
                    <div style={{ padding: "12px", border: "1px solid var(--border)", borderRadius: "8px" }}>
                      <div style={{ color: "var(--text-muted)", fontSize: "11px", marginBottom: "4px" }}>Timing Overlay</div>
                      <div style={{ color: "var(--text-secondary)", lineHeight: 1.5 }}>
                        {activeVoltageGeneration.model_name} | {activeVoltageGeneration.generation_code} | {activeVoltageGeneration.soc_type}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                    {activeFamilyPack.critical_rails.map((rail) => <span key={rail} className="chip">{rail}</span>)}
                  </div>
                </div>
              </div>
              <div className="grid-2">{voltageSummary.map(({ rail, measured, nominal, min, max, ok, warn }) => <div key={rail.name} className="card"><div className="card-header"><span className="card-title">{rail.name}</span><span className={`badge badge-${ok ? "normal" : warn ? "high" : "critical"}`}>{ok ? "OK" : warn ? "WARN" : "FAULT"}</span></div><div className="card-body"><div style={{ fontFamily: "var(--font-display)", fontSize: "40px", color: ok ? "var(--accent-green)" : warn ? "var(--accent-yellow)" : "var(--accent-red)" }}>{measured.toFixed(3)}V</div><div style={{ color: "var(--text-muted)", fontSize: "11px" }}>Nominal: {nominal.toFixed(2)}V | Range: {min.toFixed(2)}V-{max.toFixed(2)}V</div><div style={{ color: "var(--text-secondary)", marginTop: "10px", fontSize: "12px" }}>{rail.diagnostic_note || rail.note}</div></div></div>)}</div>
              <div className="grid-2" style={{ marginTop: "16px" }}><div className="card"><div className="card-header"><span className="card-title">Power-On Sequence Timeline</span></div><div className="card-body">{activeBootSequence.map((stage) => <div key={stage.step} style={{ display: "grid", gridTemplateColumns: "30px 1fr auto auto auto", gap: "10px", alignItems: "center", marginBottom: "12px" }}><span className="timeline-number">{stage.step}</span><div style={{ height: "4px", background: "linear-gradient(90deg, var(--accent-cyan), rgba(0,212,255,0.1))", borderRadius: "999px" }} /><span style={{ fontFamily: "var(--font-mono)", fontSize: "11px" }}>{stage.rail}</span><span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--accent-green)" }}>{stage.delay_ms}ms</span><span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-muted)" }}>max {stage.max_delay_ms}ms</span></div>)}</div></div><div className="card"><div className="card-header"><span className="card-title">Handshake Status</span></div><div className="card-body"><div style={{ color: handshakeStatus.tone === "critical" ? "var(--accent-red)" : handshakeStatus.tone === "high" ? "var(--accent-yellow)" : "var(--accent-green)", fontWeight: 700, marginBottom: "8px" }}>{handshakeStatus.state}</div><div style={{ color: "var(--text-secondary)", lineHeight: 1.6 }}>{handshakeStatus.note}</div></div></div></div>
            </div>
          )}

          {activeModule === "dc" && (
            <div>
              <div className="section-heading">DC Current Consumption Analyzer</div>
              <div style={{ marginBottom: "12px", fontSize: "11px", color: "var(--text-muted)" }}>Reference-based intelligent diagnosis ranges, not absolute for all models.</div>
              <div style={{ display: "flex", gap: "8px", marginBottom: "16px", flexWrap: "wrap" }}>{dcPresetEntries.map((entry) => <button key={entry.code} className={`btn ${currentDCProfile === entry.code ? "btn-primary" : "btn-ghost"}`} onClick={() => setCurrentDCProfile(entry.code)}>{entry.name}</button>)}</div>
              <div className="card" style={{ marginBottom: "16px" }}><div className="card-header"><span className="card-title">Live Waveform - {dcProfile.name}</span><span className={`badge badge-${dcSeverityTone}`}>{dcProfile.severity.toUpperCase()}</span></div><div className="oscilloscope" style={{ padding: "8px" }}><Waveform current={dcCurrent} status={dcWaveformStatus} /></div></div>
              <div className="grid-2"><div className="card"><div className="card-header"><span className="card-title">Diagnosis Snapshot</span></div><div className="card-body"><div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: "12px" }}><div><div style={{ color: "var(--text-muted)", fontSize: "11px" }}>Code</div><div style={{ fontFamily: "var(--font-mono)", color: "var(--accent-cyan)" }}>{dcProfile.code}</div></div><div><div style={{ color: "var(--text-muted)", fontSize: "11px" }}>Probable Stage</div><div>{dcProfile.probable_stage}</div></div><div><div style={{ color: "var(--text-muted)", fontSize: "11px" }}>Pattern</div><div style={{ fontFamily: "var(--font-mono)" }}>{dcProfile.current_pattern}</div></div><div><div style={{ color: "var(--text-muted)", fontSize: "11px" }}>Confidence</div><div>{dcProfile.confidence.toUpperCase()}</div></div></div><div style={{ marginTop: "12px", color: "var(--text-secondary)", lineHeight: 1.5 }}>{dcProfile.meaning}</div><div style={{ marginTop: "12px", padding: "10px", border: "1px solid var(--border)", borderRadius: "8px", background: "rgba(0,212,255,0.04)" }}><div style={{ color: "var(--text-muted)", fontSize: "11px", marginBottom: "4px" }}>Symptom</div><div>{dcProfile.symptom}</div></div></div></div><div className="card"><div className="card-header"><span className="card-title">Current Decision</span></div><div className="card-body"><div style={{ textAlign: "center", padding: "12px 0 8px" }}><div style={{ fontSize: "42px", fontFamily: "var(--font-display)", fontWeight: "900", color: dcSeverityTone === "critical" ? "var(--accent-red)" : dcSeverityTone === "high" ? "var(--accent-yellow)" : "var(--accent-green)", textShadow: dcSeverityTone === "critical" ? "var(--glow-red)" : dcSeverityTone === "high" ? "var(--glow-yellow)" : "var(--glow-green)", marginBottom: "8px" }}>{dcCurrent.toFixed(3)}A</div><div style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--text-muted)" }}>LIVE CURRENT DRAW</div></div><div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginTop: "12px" }}><span className={`badge badge-${dcSeverityTone}`}>{dcProfile.category}</span><span className="badge badge-normal">{dcProfile.pattern_type.replace(/_/g, " ")}</span></div>{dcShortAlert && <div style={{ marginTop: "16px", background: "rgba(255,34,68,0.1)", border: "1px solid rgba(255,34,68,0.4)", borderRadius: "6px", padding: "12px" }}><div style={{ color: "var(--accent-red)", fontWeight: "700", marginBottom: "6px" }}>SHORT / OVERLOAD RESPONSE</div><div style={{ fontSize: "12px", color: "var(--text-secondary)" }}>{dcProfile.repair_action}</div></div>}</div></div></div>
              <div className="grid-2" style={{ marginTop: "16px" }}><div className="card"><div className="card-header"><span className="card-title">Likely Sections</span></div><div className="card-body" style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>{dcProfile.likely_sections.map((section) => <span key={section} className="chip">{section}</span>)}</div></div><div className="card"><div className="card-header"><span className="card-title">Thermal / Action</span></div><div className="card-body"><div style={{ marginBottom: "10px" }}><div style={{ color: "var(--text-muted)", fontSize: "11px", marginBottom: "4px" }}>Thermal Hint</div><div>{dcProfile.thermal_hint}</div></div><div><div style={{ color: "var(--text-muted)", fontSize: "11px", marginBottom: "4px" }}>Repair Action</div><div>{dcProfile.repair_action}</div></div></div></div></div>
              <div className="grid-2" style={{ marginTop: "16px" }}><div className="card"><div className="card-header"><span className="card-title">Verify Steps</span></div><div className="card-body">{dcProfile.verify_steps.map((step, index) => <div key={step} style={{ display: "flex", gap: "10px", marginBottom: "10px", alignItems: "flex-start" }}><span className="timeline-number" style={{ width: "24px", height: "24px", minWidth: "24px" }}>{index + 1}</span><span style={{ lineHeight: 1.5 }}>{step}</span></div>)}</div></div><div className="card"><div className="card-header"><span className="card-title">Master Reference</span></div><div className="card-body" style={{ maxHeight: "340px", overflow: "auto" }}><table className="data-table"><thead><tr><th>Code</th><th>Name</th><th>Pattern</th><th>Stage</th><th>Severity</th></tr></thead><tbody>{CURRENT_CONSUMPTION_DATABASE.map((entry) => <tr key={entry.code} style={currentDCProfile === entry.code ? { background: "rgba(0,212,255,0.05)" } : { cursor: "pointer" }} onClick={() => setCurrentDCProfile(entry.code)}><td style={{ fontFamily: "var(--font-mono)", color: currentDCProfile === entry.code ? "var(--accent-cyan)" : "var(--text-secondary)" }}>{entry.code}</td><td>{entry.name}</td><td style={{ fontFamily: "var(--font-mono)" }}>{entry.current_pattern}</td><td>{entry.probable_stage}</td><td><span className={`badge badge-${toneFromSeverity(entry.severity)}`}>{entry.severity}</span></td></tr>)}</tbody></table></div></div></div>
            </div>
          )}

          {activeModule === "ai" && (
            <div>
              <div className="section-heading">AI Diagnostics</div>
              <div className="grid-2">
                <div className="card">
                  <div className="card-header"><span className="card-title">Selected Panic Case</span></div>
                  <div className="card-body">
                    <div className="repair-record-title">{selectedPanic?.code || "No panic selected"}</div>
                    <div className="repair-record-subtitle">{selectedPanic?.brand} | {selectedPanic?.model} | {selectedPanic?.component}</div>
                    <div style={{ marginTop: "12px", color: "var(--text-secondary)", lineHeight: 1.6 }}>{selectedPanic?.description}</div>
                    <div style={{ marginTop: "12px", display: "flex", gap: "8px", flexWrap: "wrap" }}>
                      <span className={`badge badge-${toneFromSeverity(String(selectedPanic?.severity || "").toLowerCase())}`}>{selectedPanic?.severity || "INFO"}</span>
                      <span className="badge badge-normal">{panicAnalysis.subsystem}</span>
                    </div>
                    <div style={{ marginTop: "14px" }}>
                      <button className="btn btn-primary" onClick={runAiAnalysis} disabled={aiBusy}>
                        {aiBusy ? "Analyzing..." : "Analyze Selected Panic"}
                      </button>
                    </div>
                    {aiError ? <div style={{ marginTop: "12px", color: "var(--accent-red)" }}>{aiError}</div> : null}
                  </div>
                </div>
                <div className="card">
                  <div className="card-header"><span className="card-title">Live Result</span></div>
                  <div className="card-body" style={{ color: "var(--text-secondary)", lineHeight: 1.7 }}>
                    {aiResult ? (
                      <>
                        <div style={{ marginBottom: "10px", display: "flex", gap: "8px", flexWrap: "wrap" }}>
                          <span className="badge badge-normal">{aiResult.source || "unknown source"}</span>
                          {aiResult.model ? <span className="badge badge-normal">{aiResult.model}</span> : null}
                        </div>
                        <div style={{ whiteSpace: "pre-wrap" }}>{aiResult.analysis}</div>
                      </>
                    ) : (
                      <div>Run a live analysis to use the backend AI pipeline or its offline fallback guidance from this public app.</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeModule === "repair" && (
            <div>
              <div className="section-heading">Repair Knowledge</div>
              <div className="repair-knowledge-layout">
                <div className="card"><div className="card-body repair-record-list">{REPAIR_KNOWLEDGE_RECORDS.map((record) => <button key={record.fault_code} className={`repair-record-card ${selectedRepair?.fault_code === record.fault_code ? "active" : ""}`} onClick={() => setSelectedRepairId(record.fault_code)}><div className="repair-record-header"><div><div className="repair-record-title">{record.title}</div><div className="repair-record-subtitle">{record.fault_code} | {record.component} | Stage {record.stage}</div></div><span className={`badge badge-${difficultyTone(record.difficulty)}`}>{record.difficulty}</span></div><div className="repair-record-summary">{record.symptoms?.[0]}</div><div className="repair-record-tags"><span className="badge badge-normal">{record.success_rate} success</span><span className="badge badge-normal">{record.bench_time}</span></div></button>)}</div></div>
                <div className="card"><div className="card-body"><div className="repair-record-header"><div><div className="repair-record-title">{selectedRepair.title}</div><div className="repair-record-subtitle">{selectedRepair.fault_code} | {selectedRepair.device}</div></div><span className={`badge badge-${difficultyTone(selectedRepair.difficulty)}`}>{selectedRepair.difficulty}</span></div><div className="repair-detail-stats" style={{ marginTop: "14px" }}><div><div style={{ color: "var(--text-muted)", fontSize: "11px" }}>Rail</div><div>{selectedRepair.rail}</div></div><div><div style={{ color: "var(--text-muted)", fontSize: "11px" }}>Target Voltage</div><div>{selectedRepair.voltage}</div></div><div><div style={{ color: "var(--text-muted)", fontSize: "11px" }}>Diode Ref</div><div>{selectedRepair.diode_ref}</div></div><div><div style={{ color: "var(--text-muted)", fontSize: "11px" }}>Confidence</div><div>{selectedRepair.confidence}</div></div></div><div className="repair-section-grid" style={{ marginTop: "16px" }}><div className="repair-section-card"><div className="repair-section-title">Symptoms</div><div className="repair-section-list">{selectedRepair.symptoms.map((item) => <div key={item}>{item}</div>)}</div></div><div className="repair-section-card"><div className="repair-section-title">Likely Causes</div><div className="repair-section-list">{selectedRepair.likely_causes.map((item) => <div key={item}>{item}</div>)}</div></div><div className="repair-section-card"><div className="repair-section-title">Measurements</div><div className="repair-section-list">{selectedRepair.measurements.map((item) => <div key={item}>{item}</div>)}</div></div><div className="repair-section-card"><div className="repair-section-title">Required Tools</div><div className="repair-section-list">{selectedRepair.required_tools.map((item) => <div key={item}>{item}</div>)}</div></div></div><div className="repair-procedure-card"><div className="repair-section-title">AI Analysis</div><div className="repair-section-list"><div>{selectedRepair.ai_analysis}</div></div></div></div></div>
              </div>
            </div>
          )}

          {activeModule === "storage" && <SimpleModule title="Storage Health" text="Storage, UFS, and NAND checks can be staged here using the panic database and current analyzer together." />}
          {activeModule === "flash" && <SimpleModule title="Flash / FRP / Format" text="Use this module for restore flow notes, boot mode changes, and tool-specific flashing steps." />}
          {activeModule === "boardview" && <SimpleModule title="Board View" text="Board view and schematic shortcuts can be attached here for the selected rail or subsystem." />}
          {activeModule === "tickets" && <div><div className="section-heading">Repair Tickets</div><div className="card"><div className="card-body"><table className="data-table"><thead><tr><th>ID</th><th>Device</th><th>Issue</th><th>Status</th><th>Severity</th></tr></thead><tbody>{TICKETS.map((ticket) => <tr key={ticket.id}><td style={{ fontFamily: "var(--font-mono)" }}>{ticket.id}</td><td>{ticket.device}</td><td>{ticket.issue}</td><td>{ticket.status}</td><td><span className={`badge badge-${toneFromSeverity(ticket.severity.toLowerCase())}`}>{ticket.severity}</span></td></tr>)}</tbody></table></div></div></div>}
        </div>
      </main>
      <RightPanel connectedDevices={connectedDevices} voltageReadings={voltageReadings} termLog={termLog} repairRecordCount={REPAIR_KNOWLEDGE_RECORDS.length} repairBrandCount={repairBrandCount} repairComponentCount={repairComponentCount} />
    </div>
  );
}
