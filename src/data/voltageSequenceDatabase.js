export const VOLTAGE_SEQUENCE_DATABASE = [
  {
    id: 1,
    model_name: "iPhone 11/12",
    soc_type: "A13/A14",
    generation_code: "GEN_1_5",
    board_id: "D52/G9",
    voltage_profile: {
      rails: [
        {
          name: "PP_VDD_MAIN",
          voltage: "3.80V",
          nominal: 3.8,
          min: 3.61,
          max: 3.99,
          tolerance: 0.19,
          ic: "Tigris",
          stage: 1,
          diagnostic_note: "Main system power; if 0V, check for shorted caps."
        },
        {
          name: "PP1V8_IO",
          voltage: "1.80V",
          nominal: 1.8,
          min: 1.71,
          max: 1.89,
          tolerance: 0.09,
          ic: "CPU/NAND IO",
          stage: 2,
          diagnostic_note: "Required for CPU/NAND communication."
        },
        {
          name: "PP_VDD_CPU",
          voltage: "1.05V",
          nominal: 1.05,
          min: 0.99,
          max: 1.11,
          tolerance: 0.06,
          ic: "Application Processor",
          stage: 3,
          diagnostic_note: "Core CPU power; varies slightly under load."
        }
      ],
      boot_timing: {
        stage_1_ms: 0.5,
        stage_2_ms: 1.3,
        stage_3_ms: 2.1,
        stage_4_ms: 2.9,
        stage_5_ms: 3.7
      },
      signatures: {
        normal_boot: [0.5, 1.3, 2.1, 2.9, 3.7],
        recovery_mode: [0.5, 1.3, 2.1, 8.0],
        dfu_mode: [0.5, 1.3, 10.0]
      }
    },
    boot_sequence: {
      sequence: [
        { step: 1, rail: "VSYS → PP_VDD_MAIN", delay_ms: 0.5, max_delay_ms: 1.2, current_ma: 15 },
        { step: 2, rail: "PP_VDD_MAIN → PP1V8_IO", delay_ms: 1.3, max_delay_ms: 2.5, current_ma: 25 },
        { step: 3, rail: "PP1V8_IO → PP_VDD_CPU", delay_ms: 2.1, max_delay_ms: 4.0, current_ma: 80 }
      ]
    },
    critical_rails: ["PP_VDD_MAIN", "PP1V8_IO", "PP_VDD_CPU"]
  },
  {
    id: 2,
    model_name: "iPhone 13/14",
    soc_type: "A15/A16",
    generation_code: "GEN_2",
    board_id: "D63/D73",
    voltage_profile: {
      rails: [
        {
          name: "PP_VDD_MAIN",
          voltage: "3.80V",
          nominal: 3.8,
          min: 3.61,
          max: 3.99,
          tolerance: 0.19,
          ic: "Tigris",
          stage: 1,
          diagnostic_note: "Primary boot rail."
        },
        {
          name: "PP1V8_S2",
          voltage: "1.80V",
          nominal: 1.8,
          min: 1.71,
          max: 1.89,
          tolerance: 0.09,
          ic: "PMU / RAM",
          stage: 2,
          critical: true,
          panic_if_missing: true,
          diagnostic_note: "RAM power; failures here cause no image."
        },
        {
          name: "PP_VDD_CPU",
          voltage: "1.05V",
          nominal: 1.05,
          min: 0.99,
          max: 1.11,
          tolerance: 0.06,
          ic: "CPU Core",
          stage: 3,
          diagnostic_note: "Core CPU power; varies slightly under load."
        },
        {
          name: "VDD_GPU",
          voltage: "0.90V",
          nominal: 0.9,
          min: 0.86,
          max: 0.95,
          tolerance: 0.045,
          ic: "GPU",
          stage: 4,
          diagnostic_note: "Graphics rail used during display bring-up."
        }
      ],
      boot_timing: {
        stage_1_ms: 0.5,
        stage_2_ms: 1.3,
        stage_3_ms: 2.1,
        stage_4_ms: 2.9,
        stage_5_ms: 3.7
      },
      signatures: {
        normal_boot: [0.5, 1.3, 2.1, 2.9, 3.7],
        recovery_mode: [0.5, 1.3, 2.1, 6.5],
        dfu_mode: [0.5, 1.3, 9.5]
      }
    },
    boot_sequence: {
      sequence: [
        { step: 1, rail: "VSYS → PP_VDD_MAIN", delay_ms: 0.5, max_delay_ms: 1.2, current_ma: 15 },
        { step: 2, rail: "PP_VDD_MAIN → PP1V8_S2", delay_ms: 1.3, max_delay_ms: 2.5, current_ma: 25 },
        { step: 3, rail: "PP1V8_S2 → PP_VDD_CPU", delay_ms: 2.1, max_delay_ms: 4.0, current_ma: 80 },
        { step: 4, rail: "PP_VDD_CPU → VDD_GPU", delay_ms: 2.9, max_delay_ms: 5.5, current_ma: 105 }
      ]
    },
    critical_rails: ["PP_VDD_MAIN", "PP1V8_S2", "PP_VDD_CPU"]
  },
  {
    id: 3,
    model_name: "iPhone 14/15",
    soc_type: "A16/A17",
    generation_code: "GEN_2_5",
    board_id: "D73/D83",
    voltage_profile: {
      rails: [
        {
          name: "PP_VDD_MAIN",
          voltage: "3.80V",
          nominal: 3.8,
          min: 3.61,
          max: 3.99,
          tolerance: 0.19,
          ic: "Main PMIC",
          stage: 1,
          diagnostic_note: "System main rail."
        },
        {
          name: "PP1V8_S2",
          voltage: "1.80V",
          nominal: 1.8,
          min: 1.71,
          max: 1.89,
          tolerance: 0.09,
          ic: "PMU / RAM",
          stage: 2,
          critical: true,
          diagnostic_note: "Handshake rail between RAM and CPU."
        },
        {
          name: "PP_VDD_CPU",
          voltage: "1.05V",
          nominal: 1.05,
          min: 0.99,
          max: 1.11,
          tolerance: 0.06,
          ic: "CPU Core",
          stage: 3,
          diagnostic_note: "Core CPU power."
        },
        {
          name: "PP0V85_S4",
          voltage: "0.85V",
          nominal: 0.85,
          min: 0.81,
          max: 0.89,
          tolerance: 0.04,
          ic: "Sleep Controller",
          stage: 4,
          diagnostic_note: "Low-power sleep state rail; check if phone won't wake."
        }
      ],
      boot_timing: {
        stage_1_ms: 0.5,
        stage_2_ms: 1.3,
        stage_3_ms: 2.1,
        stage_4_ms: 2.9,
        stage_5_ms: 3.7
      },
      signatures: {
        normal_boot: [0.5, 1.3, 2.1, 2.9, 3.7],
        recovery_mode: [0.5, 1.3, 2.1, 7.1],
        dfu_mode: [0.5, 1.3, 8.8]
      }
    },
    boot_sequence: {
      sequence: [
        { step: 1, rail: "VSYS → PP_VDD_MAIN", delay_ms: 0.5, max_delay_ms: 1.2, current_ma: 15 },
        { step: 2, rail: "PP_VDD_MAIN → PP1V8_S2", delay_ms: 1.3, max_delay_ms: 2.5, current_ma: 25 },
        { step: 3, rail: "PP1V8_S2 → PP_VDD_CPU", delay_ms: 2.1, max_delay_ms: 4.0, current_ma: 80 },
        { step: 4, rail: "PP_VDD_CPU → PP0V85_S4", delay_ms: 2.9, max_delay_ms: 5.5, current_ma: 100 }
      ]
    },
    critical_rails: ["PP_VDD_MAIN", "PP1V8_S2", "PP0V85_S4"]
  },
  {
    id: 4,
    model_name: "iPhone 15 Pro",
    soc_type: "A17 Pro",
    generation_code: "GEN_3",
    board_id: "D84",
    voltage_profile: {
      rails: [
        {
          name: "PP_VDD_MAIN",
          voltage: "3.80V",
          nominal: 3.8,
          min: 3.61,
          max: 3.99,
          tolerance: 0.19,
          ic: "Main PMIC",
          stage: 1,
          diagnostic_note: "Primary system power."
        },
        {
          name: "PP_VDD_CPU",
          voltage: "1.05V",
          nominal: 1.05,
          min: 0.99,
          max: 1.11,
          tolerance: 0.06,
          ic: "A17 CPU Core",
          stage: 3,
          diagnostic_note: "CPU core voltage under boot load."
        },
        {
          name: "PP1V8_S2",
          voltage: "1.80V",
          nominal: 1.8,
          min: 1.71,
          max: 1.89,
          tolerance: 0.09,
          ic: "RAM Interface",
          stage: 2,
          critical: true,
          diagnostic_note: "Handshake rail. If missing, RAM is not talking to CPU."
        },
        {
          name: "PP_VAR_SOC",
          voltage: "0.75V-1.20V",
          nominal: 0.95,
          min: 0.75,
          max: 1.2,
          dynamic: true,
          ic: "A17 SoC",
          stage: 4,
          diagnostic_note: "Variable rail for A17 chip; must fluctuate during boot."
        },
        {
          name: "PP2V6_NAND",
          voltage: "2.60V",
          nominal: 2.6,
          min: 2.47,
          max: 2.73,
          tolerance: 0.13,
          ic: "3nm NAND Controller",
          stage: 5,
          diagnostic_note: "High voltage for the 3nm NAND controller."
        }
      ],
      boot_timing: {
        stage_1_ms: 0.5,
        stage_2_ms: 1.3,
        stage_3_ms: 2.1,
        stage_4_ms: 2.9,
        stage_5_ms: 3.7
      },
      signatures: {
        normal_boot: [0.5, 1.3, 2.1, 2.9, 3.7],
        recovery_mode: [0.5, 1.3, 2.1, 6.8],
        dfu_mode: [0.5, 1.3, 8.5]
      }
    },
    boot_sequence: {
      sequence: [
        { step: 1, rail: "VSYS → PP_VDD_MAIN", delay_ms: 0.5, max_delay_ms: 1.2, current_ma: 15 },
        { step: 2, rail: "PP_VDD_MAIN → PP1V8_ALWAYS", delay_ms: 1.3, max_delay_ms: 2.5, current_ma: 25 },
        { step: 3, rail: "PP1V8 → VDD_CPU (Buck 1)", delay_ms: 2.1, max_delay_ms: 4.0, current_ma: 80 },
        { step: 4, rail: "VDD_CPU → VDD_GPU", delay_ms: 2.9, max_delay_ms: 5.5, current_ma: 110 },
        { step: 5, rail: "VDD_GPU → RF_VDD", delay_ms: 3.7, max_delay_ms: 7.0, current_ma: 140 }
      ]
    },
    critical_rails: ["PP_VDD_MAIN", "PP1V8_S2", "PP_VAR_SOC", "PP2V6_NAND"]
  }
];
