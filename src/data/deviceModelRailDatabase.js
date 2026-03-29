export const DEVICE_MODEL_RAIL_DATABASE = [
  { model_name: "iPhone 8", family_group: "A11", cpu_type: "A11 Bionic", board_code: "A11 Family", notes: "Starter device entry" },
  { model_name: "iPhone 8 Plus", family_group: "A11", cpu_type: "A11 Bionic", board_code: "A11 Family", notes: "Starter device entry" },
  { model_name: "iPhone X", family_group: "A11", cpu_type: "A11 Bionic", board_code: "D22", notes: "Starter device entry" },
  { model_name: "iPhone XS", family_group: "A12", cpu_type: "A12 Bionic", board_code: "A12 Family", notes: "Starter device entry" },
  { model_name: "iPhone XS Max", family_group: "A12", cpu_type: "A12 Bionic", board_code: "A12 Family", notes: "Starter device entry" },
  { model_name: "iPhone XR", family_group: "A12", cpu_type: "A12 Bionic", board_code: "A12 Family", notes: "Starter device entry" },
  { model_name: "iPhone 11", family_group: "A13", cpu_type: "A13 Bionic", board_code: "A13 Family", notes: "Starter device entry" },
  { model_name: "iPhone 11 Pro", family_group: "A13", cpu_type: "A13 Bionic", board_code: "A13 Family", notes: "Starter device entry" },
  { model_name: "iPhone 11 Pro Max", family_group: "A13", cpu_type: "A13 Bionic", board_code: "A13 Family", notes: "Starter device entry" },
  { model_name: "iPhone SE (2nd generation)", family_group: "A13", cpu_type: "A13 Bionic", board_code: "A13 Family", notes: "Starter device entry" },
  { model_name: "iPhone 12 mini", family_group: "A14", cpu_type: "A14 Bionic", board_code: "A14 Family", notes: "Starter device entry" },
  { model_name: "iPhone 12", family_group: "A14", cpu_type: "A14 Bionic", board_code: "A14 Family", notes: "Starter device entry" },
  { model_name: "iPhone 12 Pro", family_group: "A14", cpu_type: "A14 Bionic", board_code: "A14 Family", notes: "Starter device entry" },
  { model_name: "iPhone 12 Pro Max", family_group: "A14", cpu_type: "A14 Bionic", board_code: "A14 Family", notes: "Starter device entry" },
  { model_name: "iPhone 13 mini", family_group: "A15", cpu_type: "A15 Bionic", board_code: "A15 Family", notes: "Starter device entry" },
  { model_name: "iPhone 13", family_group: "A15", cpu_type: "A15 Bionic", board_code: "A15 Family", notes: "Starter device entry" },
  { model_name: "iPhone 13 Pro", family_group: "A15", cpu_type: "A15 Bionic", board_code: "A15 Family", notes: "Starter device entry" },
  { model_name: "iPhone 13 Pro Max", family_group: "A15", cpu_type: "A15 Bionic", board_code: "A15 Family", notes: "Starter device entry" },
  { model_name: "iPhone SE (3rd generation)", family_group: "A15", cpu_type: "A15 Bionic", board_code: "A15 Family", notes: "Starter device entry" },
  { model_name: "iPhone 14", family_group: "A15", cpu_type: "A15 Bionic", board_code: "A15 Family", notes: "Starter device entry" },
  { model_name: "iPhone 14 Plus", family_group: "A15", cpu_type: "A15 Bionic", board_code: "A15 Family", notes: "Starter device entry" },
  { model_name: "iPhone 14 Pro", family_group: "A16", cpu_type: "A16 Bionic", board_code: "D73", notes: "Starter device entry" },
  { model_name: "iPhone 14 Pro Max", family_group: "A16", cpu_type: "A16 Bionic", board_code: "D73", notes: "Starter device entry" },
  { model_name: "iPhone 15", family_group: "A16", cpu_type: "A16 Bionic", board_code: "A16 Family", notes: "Starter device entry" },
  { model_name: "iPhone 15 Plus", family_group: "A16", cpu_type: "A16 Bionic", board_code: "A16 Family", notes: "Starter device entry" },
  { model_name: "iPhone 15 Pro", family_group: "A17", cpu_type: "A17 Pro", board_code: "D84", notes: "Starter device entry" },
  { model_name: "iPhone 15 Pro Max", family_group: "A17", cpu_type: "A17 Pro", board_code: "D84", notes: "Starter device entry" },
  { model_name: "iPhone 16", family_group: "A18", cpu_type: "A18", board_code: "A18 Family", notes: "Starter device entry" },
  { model_name: "iPhone 16 Plus", family_group: "A18", cpu_type: "A18", board_code: "A18 Family", notes: "Starter device entry" },
  { model_name: "iPhone 16e", family_group: "A18", cpu_type: "A18", board_code: "A18 Family", notes: "Value member of iPhone 16 family" },
  { model_name: "iPhone 16 Pro", family_group: "A18_PRO", cpu_type: "A18 Pro", board_code: "A18 Pro Family", notes: "Starter device entry" },
  { model_name: "iPhone 16 Pro Max", family_group: "A18_PRO", cpu_type: "A18 Pro", board_code: "A18 Pro Family", notes: "Starter device entry" },
  { model_name: "iPhone 17", family_group: "IPHONE17", cpu_type: "Unknown", board_code: "iPhone 17 Family", notes: "Current Apple lineup entry" },
  { model_name: "iPhone 17 Pro", family_group: "IPHONE17", cpu_type: "Unknown", board_code: "iPhone 17 Family", notes: "Current Apple lineup entry" },
  { model_name: "iPhone 17 Pro Max", family_group: "IPHONE17", cpu_type: "Unknown", board_code: "iPhone 17 Family", notes: "Current Apple lineup entry" },
  { model_name: "iPhone Air", family_group: "IPHONE17", cpu_type: "Unknown", board_code: "iPhone 17 Family", notes: "Current Apple lineup entry" },
  { model_name: "iPhone 17e", family_group: "IPHONE17", cpu_type: "Unknown", board_code: "iPhone 17 Family", notes: "Affordable member of iPhone 17 family" },
];

const BASE_DELAYS = [0.5, 1.3, 2.1, 2.9, 3.7];
const BASE_MAX_DELAYS = [1.2, 2.5, 4.0, 5.5, 7.0];
const BASE_CURRENTS = [15, 25, 80, 105, 140];

function makeRail(name, nominal, min, max, stage, ic, diagnostic_note, options = {}) {
  return {
    name,
    voltage: options.voltage || `${nominal.toFixed(2)}V`,
    nominal,
    min,
    max,
    tolerance: options.tolerance ?? Number((max - nominal).toFixed(2)),
    stage,
    ic,
    diagnostic_note,
    ...options,
  };
}

function makeTimeline(lines) {
  return lines.map((line, index) => ({
    step: index + 1,
    rail: index === 0 ? `VSYS -> ${line}` : `${lines[index - 1]} -> ${line}`,
    delay_ms: BASE_DELAYS[index] ?? BASE_DELAYS[BASE_DELAYS.length - 1],
    max_delay_ms: BASE_MAX_DELAYS[index] ?? BASE_MAX_DELAYS[BASE_MAX_DELAYS.length - 1],
    current_ma: BASE_CURRENTS[index] ?? BASE_CURRENTS[BASE_CURRENTS.length - 1],
  }));
}

export const FAMILY_RAIL_PACKS = {
  A11: {
    pack_name: "A11 Boot Rail Pack",
    critical_rails: ["PP_VDD_MAIN", "PP1V8_ALWAYS", "PP_CPU", "PP1V8_NAND"],
    rails: [
      makeRail("PP_VDD_MAIN", 4.0, 3.7, 4.2, 1, "PMIC", "Main system rail for iPhone 8 / 8 Plus / X."),
      makeRail("PP1V8_ALWAYS", 1.8, 1.75, 1.85, 2, "PMIC", "Always-on 1.8V starter rail."),
      makeRail("PP3V0_ALWAYS", 3.0, 2.9, 3.1, 2, "PMIC", "Always-on 3.0V starter rail."),
      makeRail("PP_CPU", 0.95, 0.8, 1.15, 3, "CPU Core", "CPU core rail for A11 family."),
      makeRail("PP1V8_NAND", 1.8, 1.75, 1.85, 4, "NAND", "NAND IO rail."),
      makeRail("PP2V8_NAND", 2.8, 2.7, 2.9, 4, "NAND", "NAND power rail."),
    ],
    sequence: makeTimeline(["PP_VDD_MAIN", "PP1V8_ALWAYS", "PP_CPU", "PP1V8_NAND", "PP2V8_NAND"]),
  },
  A12: {
    pack_name: "A12 Boot Rail Pack",
    critical_rails: ["PP_VDD_MAIN", "PP1V8_ALWAYS", "PP1V1_CPU", "PP1V8_NAND"],
    rails: [
      makeRail("PP_VDD_MAIN", 4.0, 3.7, 4.2, 1, "PMIC", "Main system rail for iPhone XS / XS Max / XR."),
      makeRail("PP1V8_ALWAYS", 1.8, 1.75, 1.85, 2, "PMIC", "Always-on 1.8V rail."),
      makeRail("PP3V0_ALWAYS", 3.0, 2.9, 3.1, 2, "PMIC", "Always-on 3.0V rail."),
      makeRail("PP1V1_CPU", 1.1, 1.0, 1.15, 3, "CPU", "CPU rail for A12 family."),
      makeRail("PP1V8_NAND", 1.8, 1.75, 1.85, 4, "NAND", "NAND IO rail."),
      makeRail("PP2V8_NAND", 2.8, 2.7, 2.9, 4, "NAND", "NAND core supply."),
    ],
    sequence: makeTimeline(["PP_VDD_MAIN", "PP1V8_ALWAYS", "PP1V1_CPU", "PP1V8_NAND", "PP2V8_NAND"]),
  },
  A13: {
    pack_name: "A13 Boot Rail Pack",
    critical_rails: ["PP_VDD_MAIN", "PP1V8_ALWAYS", "PP1V1_CPU", "PP1V8_NAND"],
    rails: [
      makeRail("PP_VDD_MAIN", 3.8, 3.61, 3.99, 1, "Tigris", "Main system power; if 0V, check for shorted caps."),
      makeRail("PP1V8_IO", 1.8, 1.71, 1.89, 2, "CPU/NAND IO", "Required for CPU/NAND communication.", { voltage: "1.80V" }),
      makeRail("PP1V8_ALWAYS", 1.8, 1.75, 1.85, 2, "PMIC", "Always-on 1.8V rail."),
      makeRail("PP_VDD_CPU", 1.05, 0.99, 1.11, 3, "Application Processor", "Core CPU power; varies slightly under load.", { voltage: "1.05V" }),
      makeRail("PP1V8_NAND", 1.8, 1.75, 1.85, 4, "NAND", "NAND IO rail."),
      makeRail("PP2V8_NAND", 2.8, 2.7, 2.9, 4, "NAND", "NAND power rail."),
    ],
    sequence: makeTimeline(["PP_VDD_MAIN", "PP1V8_IO", "PP_VDD_CPU", "PP1V8_NAND", "PP2V8_NAND"]),
  },
  A14: {
    pack_name: "A14 Boot Rail Pack",
    critical_rails: ["PP_VDD_MAIN", "PP1V8_ALWAYS", "PP1V1_CPU", "PP1V8_NAND"],
    rails: [
      makeRail("PP_VDD_MAIN", 3.8, 3.61, 3.99, 1, "Tigris", "Main system rail for iPhone 12 series."),
      makeRail("PP1V8_ALWAYS", 1.8, 1.75, 1.85, 2, "PMIC", "Always-on 1.8V rail."),
      makeRail("PP3V0_ALWAYS", 3.0, 2.9, 3.1, 2, "PMIC", "Always-on 3.0V rail."),
      makeRail("PP1V1_CPU", 1.1, 1.0, 1.15, 3, "CPU", "CPU rail for A14 family."),
      makeRail("PP1V8_NAND", 1.8, 1.75, 1.85, 4, "NAND", "NAND IO rail."),
      makeRail("PP2V8_NAND", 2.8, 2.7, 2.9, 4, "NAND", "NAND power rail."),
    ],
    sequence: makeTimeline(["PP_VDD_MAIN", "PP1V8_ALWAYS", "PP1V1_CPU", "PP1V8_NAND", "PP2V8_NAND"]),
  },
  A15: {
    pack_name: "A15 Boot Rail Pack",
    critical_rails: ["PP_VDD_MAIN", "PP1V8_S2", "PP_VDD_CPU", "VDD_GPU"],
    rails: [
      makeRail("PP_VDD_MAIN", 3.8, 3.61, 3.99, 1, "Tigris", "Primary boot rail."),
      makeRail("PP1V8_S2", 1.8, 1.71, 1.89, 2, "PMU / RAM", "RAM power; failures here cause no image.", { critical: true, panic_if_missing: true }),
      makeRail("PP_VDD_CPU", 1.05, 0.99, 1.11, 3, "CPU Core", "Core CPU power; varies slightly under load."),
      makeRail("VDD_GPU", 0.9, 0.86, 0.95, 4, "GPU", "Graphics rail used during display bring-up."),
      makeRail("PP1V8_NAND", 1.8, 1.75, 1.85, 4, "NAND", "NAND IO rail."),
    ],
    sequence: makeTimeline(["PP_VDD_MAIN", "PP1V8_S2", "PP_VDD_CPU", "VDD_GPU", "PP1V8_NAND"]),
  },
  A16: {
    pack_name: "A16 Boot Rail Pack",
    critical_rails: ["PP_VDD_MAIN", "PP1V8_S2", "PP_VDD_CPU", "PP0V85_S4"],
    rails: [
      makeRail("PP_VDD_MAIN", 3.8, 3.61, 3.99, 1, "Main PMIC", "System main rail."),
      makeRail("PP1V8_S2", 1.8, 1.71, 1.89, 2, "PMU / RAM", "Handshake rail between RAM and CPU.", { critical: true }),
      makeRail("PP_VDD_CPU", 1.05, 0.99, 1.11, 3, "CPU Core", "Core CPU power."),
      makeRail("PP0V85_S4", 0.85, 0.81, 0.89, 4, "Sleep Controller", "Low-power sleep state rail; check if phone won't wake."),
      makeRail("PP1V8_NAND", 1.8, 1.75, 1.85, 5, "NAND", "NAND IO rail."),
    ],
    sequence: makeTimeline(["PP_VDD_MAIN", "PP1V8_S2", "PP_VDD_CPU", "PP0V85_S4", "PP1V8_NAND"]),
  },
  A17: {
    pack_name: "A17 Boot Rail Pack",
    critical_rails: ["PP_VDD_MAIN", "PP1V8_S2", "PP_VAR_SOC", "PP2V6_NAND"],
    rails: [
      makeRail("PP_VDD_MAIN", 3.8, 3.61, 3.99, 1, "Main PMIC", "Primary system power."),
      makeRail("PP1V8_S2", 1.8, 1.71, 1.89, 2, "RAM Interface", "Handshake rail. If missing, RAM is not talking to CPU.", { critical: true }),
      makeRail("PP_VDD_CPU", 1.05, 0.99, 1.11, 3, "A17 CPU Core", "CPU core voltage under boot load."),
      makeRail("PP_VAR_SOC", 0.95, 0.75, 1.2, 4, "A17 SoC", "Variable rail for A17 chip; must fluctuate during boot.", { dynamic: true, voltage: "0.75V-1.20V" }),
      makeRail("PP2V6_NAND", 2.6, 2.47, 2.73, 5, "3nm NAND Controller", "High voltage for the 3nm NAND controller."),
    ],
    sequence: makeTimeline(["PP_VDD_MAIN", "PP1V8_S2", "PP_VDD_CPU", "PP_VAR_SOC", "PP2V6_NAND"]),
  },
  A18: {
    pack_name: "A18 Boot Rail Pack",
    critical_rails: ["PP_VDD_MAIN", "PP1V8_S2", "PP_VDD_CPU", "PP0V85_S4"],
    rails: [
      makeRail("PP_VDD_MAIN", 3.8, 3.61, 3.99, 1, "Main PMIC", "Main rail for iPhone 16 / 16 Plus / 16e."),
      makeRail("PP1V8_S2", 1.8, 1.71, 1.89, 2, "PMU / RAM", "Critical S2 handshake rail.", { critical: true }),
      makeRail("PP_VDD_CPU", 1.05, 0.99, 1.11, 3, "A18 CPU", "Core CPU rail."),
      makeRail("PP0V85_S4", 0.85, 0.81, 0.89, 4, "Sleep Controller", "Sleep-state rail."),
      makeRail("PP2V6_NAND", 2.6, 2.47, 2.73, 5, "NAND Controller", "Modern NAND rail for A18 devices."),
    ],
    sequence: makeTimeline(["PP_VDD_MAIN", "PP1V8_S2", "PP_VDD_CPU", "PP0V85_S4", "PP2V6_NAND"]),
  },
  A18_PRO: {
    pack_name: "A18 Pro Boot Rail Pack",
    critical_rails: ["PP_VDD_MAIN", "PP1V8_S2", "PP_VDD_CPU", "PP2V6_NAND"],
    rails: [
      makeRail("PP_VDD_MAIN", 3.8, 3.61, 3.99, 1, "Main PMIC", "Main rail for iPhone 16 Pro / Pro Max."),
      makeRail("PP1V8_S2", 1.8, 1.71, 1.89, 2, "PMU / RAM", "Critical S2 handshake rail.", { critical: true }),
      makeRail("PP_VDD_CPU", 1.05, 0.99, 1.11, 3, "A18 Pro CPU", "Core CPU rail."),
      makeRail("PP_VAR_SOC", 1.0, 0.8, 1.2, 4, "A18 Pro SoC", "Variable SoC rail for pro family.", { dynamic: true, voltage: "0.80V-1.20V" }),
      makeRail("PP2V6_NAND", 2.6, 2.47, 2.73, 5, "NAND Controller", "High-voltage NAND rail."),
    ],
    sequence: makeTimeline(["PP_VDD_MAIN", "PP1V8_S2", "PP_VDD_CPU", "PP_VAR_SOC", "PP2V6_NAND"]),
  },
  IPHONE17: {
    pack_name: "iPhone 17 Family Boot Rail Pack",
    critical_rails: ["PP_VDD_MAIN", "PP1V8_ALWAYS", "PP1V1_CPU", "PP1V8_NAND"],
    rails: [
      makeRail("PP_VDD_MAIN", 3.8, 3.7, 4.2, 1, "Main PMIC", "Placeholder starter pack for iPhone 17 family."),
      makeRail("PP1V8_ALWAYS", 1.8, 1.75, 1.85, 2, "PMIC", "Always-on 1.8V starter rail."),
      makeRail("PP3V0_ALWAYS", 3.0, 2.9, 3.1, 2, "PMIC", "Always-on 3.0V starter rail."),
      makeRail("PP1V1_CPU", 1.1, 1.0, 1.15, 3, "CPU", "CPU starter rail."),
      makeRail("PP1V8_NAND", 1.8, 1.75, 1.85, 4, "NAND", "NAND IO starter rail."),
      makeRail("PP2V8_NAND", 2.8, 2.7, 2.9, 4, "NAND", "NAND power starter rail."),
    ],
    sequence: makeTimeline(["PP_VDD_MAIN", "PP1V8_ALWAYS", "PP1V1_CPU", "PP1V8_NAND", "PP2V8_NAND"]),
  },
};
