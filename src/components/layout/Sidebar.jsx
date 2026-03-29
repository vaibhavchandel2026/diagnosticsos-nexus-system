export default function Sidebar({ activeModule, setActiveModule, connectedDevicesCount, openTicketsCount }) {
  const NAV = [
    { id: "dashboard", icon: "⬡", label: "Dashboard" },
    { id: "device", icon: "📡", label: "Device Detection", badge: connectedDevicesCount > 0 ? connectedDevicesCount : null },
    { id: "panic", icon: "🧬", label: "Panic Database" },
    { id: "voltage", icon: "⚡", label: "Voltage Analyzer" },
    { id: "dc", icon: "〜", label: "DC Current Meter" },
    { id: "ai", icon: "🤖", label: "AI Diagnostics" },
    { id: "repair", icon: "🔧", label: "Repair Knowledge" },
    { id: "storage", icon: "💾", label: "Storage Health" },
    { id: "flash", icon: "⬇", label: "Flash / FRP / Format" },
    { id: "boardview", icon: "⊞", label: "Board View" },
    { id: "tickets", icon: "🎫", label: "Repair Tickets", badge: openTicketsCount > 0 ? openTicketsCount : null },
  ];

  return (
    <div className="sidebar">
      <div className="nav-section">
        <div className="nav-label">System</div>
        {NAV.slice(0, 2).map(n => (
          <div key={n.id} className={`nav-item ${activeModule === n.id ? "active" : ""}`} onClick={() => setActiveModule(n.id)}>
            <span className="nav-icon">{n.icon}</span>
            <span>{n.label}</span>
            {n.badge ? <span className="nav-badge">{n.badge}</span> : null}
          </div>
        ))}
      </div>
      <div className="nav-section">
        <div className="nav-label">Diagnostics</div>
        {NAV.slice(2, 7).map(n => (
          <div key={n.id} className={`nav-item ${activeModule === n.id ? "active" : ""}`} onClick={() => setActiveModule(n.id)}>
            <span className="nav-icon">{n.icon}</span>
            <span>{n.label}</span>
            {n.badge ? <span className="nav-badge">{n.badge}</span> : null}
          </div>
        ))}
      </div>
      <div className="nav-section">
        <div className="nav-label">Tools</div>
        {NAV.slice(7, 11).map(n => (
          <div key={n.id} className={`nav-item ${activeModule === n.id ? "active" : ""}`} onClick={() => setActiveModule(n.id)}>
            <span className="nav-icon">{n.icon}</span>
            <span>{n.label}</span>
            {n.badge ? <span className="nav-badge">{n.badge}</span> : null}
          </div>
        ))}
      </div>
      <div style={{ padding: "16px 12px", marginTop: "auto" }}>
        <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "6px", padding: "12px", fontSize: "11px", fontFamily: "var(--font-mono)" }}>
          <div style={{ color: "var(--accent-green)", marginBottom: "4px" }}>● SYSTEM OK</div>
          <div style={{ color: "var(--text-muted)" }}>DB: LOADED</div>
          <div style={{ color: "var(--text-muted)" }}>AI: READY</div>
          <div style={{ color: "var(--text-muted)" }}>USB: POLLING</div>
        </div>
      </div>
    </div>
  );
}