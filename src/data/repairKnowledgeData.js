import rawRepairRecords from "../../repair-records.json";

function inferDifficulty(stage) {
  if (stage >= 1 && stage <= 5) return "BASIC";
  if (stage >= 6 && stage <= 10) return "POPULAR";
  return "EXPERT";
}

function inferSuccessRate(stage) {
  if (stage >= 1 && stage <= 4) return "92%";
  if (stage >= 5 && stage <= 10) return "84%";
  return "76%";
}

function inferBenchTime(stage) {
  if (stage >= 1 && stage <= 4) return "20-45 min";
  if (stage >= 5 && stage <= 10) return "45-90 min";
  return "90-150 min";
}

function inferDevice(record) {
  const text = [record.title, record.target_ic, record.symptoms].filter(Boolean).join(" ").toLowerCase();
  if (text.includes("iphone 17")) return "Apple | iPhone 17 Series";
  if (text.includes("iphone 16")) return "Apple | iPhone 16 Series";
  if (text.includes("iphone 15")) return "Apple | iPhone 15 Series";
  if (text.includes("15/16/17") || text.includes("15, 16, and 17")) return "Apple | iPhone 15/16/17 Series";
  if (text.includes("pro models")) return "Apple | iPhone Pro Series";
  return "Apple | iPhone Logic Board";
}

function buildLikelyCauses(record) {
  return [
    `${record.rail} fault affecting ${record.target_ic}`,
    `Abnormal diode mode reference around ${record.rail}`,
    `Stage ${record.stage} boot failure causing ${record.symptoms}`,
  ];
}

function buildMeasurements(record) {
  return [
    `Measure ${record.rail} in diode mode and compare with known-good board`,
    `Confirm ${record.voltage} behavior during stage ${record.stage} boot`,
    `Inspect ${record.target_ic} and nearby passives for short, open, or leakage`,
  ];
}

function buildRequiredTools(record) {
  const tools = ["Multimeter", "DC Power Supply", "Microscope"];
  const repairText = Array.isArray(record.repair_steps) ? record.repair_steps.join(" ").toLowerCase() : "";
  if (repairText.includes("thermal")) tools.push("Thermal Camera");
  if (repairText.includes("reball")) tools.push("BGA Rework Setup");
  if (repairText.includes("pd analyzer") || String(record.title).toLowerCase().includes("pd 3.1")) tools.push("USB-C PD Analyzer");
  return tools;
}

export const REPAIR_KNOWLEDGE_RECORDS = rawRepairRecords.map((record) => ({
  fault_code: record.id,
  title: record.title,
  device: inferDevice(record),
  component: record.target_ic,
  difficulty: inferDifficulty(record.stage),
  success_rate: inferSuccessRate(record.stage),
  bench_time: inferBenchTime(record.stage),
  symptoms: [record.symptoms],
  likely_causes: buildLikelyCauses(record),
  measurements: buildMeasurements(record),
  required_tools: buildRequiredTools(record),
  ai_analysis: Array.isArray(record.repair_steps) ? record.repair_steps.join(". ") : "",
  confidence: `${Math.max(72, Math.min(96, Math.round((record.diode_ref || 0.5) * 100 + 30)))}%`,
  stage: record.stage,
  rail: record.rail,
  voltage: record.voltage,
  diode_ref: record.diode_ref,
  target_ic: record.target_ic,
  repair_steps: record.repair_steps,
}));
