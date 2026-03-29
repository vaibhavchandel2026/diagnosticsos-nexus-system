BEGIN TRANSACTION;

-- Copy the appropriate family rail pack into voltage_lines for one selected device.
INSERT INTO voltage_lines (
    device_id, line_name, alias_name, line_type, power_domain, boot_phase,
    source_component, test_point, expected_voltage_min, expected_voltage_typ,
    expected_voltage_max, expected_frequency, measurement_mode, is_critical,
    priority_order, description
)
SELECT
    dm.id,
    fi.line_name,
    fi.alias_name,
    fi.line_type,
    fi.power_domain,
    fi.boot_phase,
    fi.source_component,
    fi.test_point,
    fi.expected_voltage_min,
    fi.expected_voltage_typ,
    fi.expected_voltage_max,
    fi.expected_frequency,
    fi.measurement_mode,
    fi.is_critical,
    fi.priority_order,
    fi.description
FROM device_models dm
JOIN family_rail_packs fp ON fp.family_group = dm.family_group
JOIN family_rail_pack_items fi ON fi.pack_id = fp.id
WHERE dm.model_name = 'iPhone 11';

-- Copy family rails for every device currently in device_models.
INSERT INTO voltage_lines (
    device_id, line_name, alias_name, line_type, power_domain, boot_phase,
    source_component, test_point, expected_voltage_min, expected_voltage_typ,
    expected_voltage_max, expected_frequency, measurement_mode, is_critical,
    priority_order, description
)
SELECT
    dm.id,
    fi.line_name,
    fi.alias_name,
    fi.line_type,
    fi.power_domain,
    fi.boot_phase,
    fi.source_component,
    fi.test_point,
    fi.expected_voltage_min,
    fi.expected_voltage_typ,
    fi.expected_voltage_max,
    fi.expected_frequency,
    fi.measurement_mode,
    fi.is_critical,
    fi.priority_order,
    fi.description
FROM device_models dm
JOIN family_rail_packs fp ON fp.family_group = dm.family_group
JOIN family_rail_pack_items fi ON fi.pack_id = fp.id;

COMMIT;
