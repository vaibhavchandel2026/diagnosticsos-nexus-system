export default function RightPanel({
  connectedDevices,
  voltageReadings,
  termLog,
  repairRecordCount = 0,
  repairBrandCount = 0,
  repairComponentCount = 0,
}) {
  return (
    <div className="right-panel">
      <div style={{ fontFamily: "var(--font-display)", fontSize: "11px", letterSpacing: "2px", color: "var(--text-muted)", marginBottom: "16px", textTransform: "uppercase" }}>Live Intelligence</div>

      {/* Connected Devices */}
      <div style={{ marginBottom: "16px" }}>
        <div style={{ fontSize: "10px", letterSpacing: "1.5px", color: "var(--text-muted)", fontFamily: "var(--font-mono)", marginBottom: "8px", textTransform: "uppercase" }}>USB DEVICES</div>
        {connectedDevices.length === 0 ? (
          <div style={{ fontSize: "11px", fontFamily: "var(--font-mono)", color: "var(--text-muted)", padding: "10px", background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "4px" }}>
            <span style={{ marginRight: "6px" }}>○</span> No devices
          </div>
        ) : connectedDevices.map(dev => (
          <div key={dev.id} className="device-card connected" style={{ padding: "10px", marginBottom: "8px" }}>
            <div style={{ fontSize: "12px", fontWeight: "600", color: "var(--text-primary)" }}>{dev.name}</div>
            <div style={{ fontSize: "10px", fontFamily: "var(--font-mono)", color: "var(--text-muted)" }}>{dev.mode}</div>
          </div>
        ))}
      </div>

      <div className="divider" />

      {/* Quick Stats */}
      <div style={{ marginBottom: "16px" }}>
        <div style={{ fontSize: "10px", letterSpacing: "1.5px", color: "var(--text-muted)", fontFamily: "var(--font-mono)", marginBottom: "8px", textTransform: "uppercase" }}>QUICK STATS</div>
        {[
          { label: "Panic DB", val: "10,000", color: "var(--accent-cyan)" },
          { label: "Repair Records", val: String(repairRecordCount), color: "var(--accent-green)" },
          { label: "Brands", val: String(repairBrandCount), color: "var(--text-secondary)" },
          { label: "Components", val: String(repairComponentCount), color: "var(--text-secondary)" },
        ].map(s => (
          <div key={s.label} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid rgba(30,40,64,0.5)", fontSize: "12px", fontFamily: "var(--font-mono)" }}>
            <span style={{ color: "var(--text-muted)" }}>{s.label}</span>
            <span style={{ color: s.color, fontWeight: "700" }}>{s.val}</span>
          </div>
        ))}
      </div>

      <div className="divider" />

      {/* Voltage Summary */}
      <div style={{ marginBottom: "16px" }}>
        <div style={{ fontSize: "10px", letterSpacing: "1.5px", color: "var(--text-muted)", fontFamily: "var(--font-mono)", marginBottom: "8px", textTransform: "uppercase" }}>RAIL MONITOR</div>
        {Object.entries(voltageReadings).slice(0, 4).map(([rail, val]) => (
          <div key={rail} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", fontSize: "11px", fontFamily: "var(--font-mono)" }}>
            <span style={{ color: "var(--text-muted)" }}>{rail}</span>
            <span style={{ color: "var(--accent-green)" }}>{val}V</span>
          </div>
        ))}
      </div>

      <div className="divider" />

      {/* Recent Activity */}
      <div>
        <div style={{ fontSize: "10px", letterSpacing: "1.5px", color: "var(--text-muted)", fontFamily: "var(--font-mono)", marginBottom: "8px", textTransform: "uppercase" }}>ACTIVITY LOG</div>
        <div style={{ fontSize: "11px", fontFamily: "var(--font-mono)" }}>
          {termLog.slice(-8).reverse().map((line, i) => (
            <div key={i} style={{ padding: "3px 0", borderBottom: "1px solid rgba(30,40,64,0.4)", color: line.type === "err" ? "var(--accent-red)" : line.type === "info" ? "var(--accent-cyan)" : "var(--text-muted)" }}>
              <div style={{ fontSize: "9px", color: "var(--text-muted)", marginBottom: "1px" }}>{line.ts}</div>
              <div style={{ lineHeight: "1.3" }}>{line.msg.slice(0, 42)}{line.msg.length > 42 ? "..." : ""}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
