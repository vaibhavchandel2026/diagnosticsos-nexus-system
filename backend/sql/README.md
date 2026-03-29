SQL starter packs for the diagnostics database live here.

Suggested import order:
1. `device_models_iphone_8_to_17.sql`
2. `family_rail_packs_iphone_8_to_17.sql`
3. `voltage_line_copy_templates.sql`

Notes:
- `device_models_iphone_8_to_17.sql` assumes your `device_models` table already exists.
- The `ALTER TABLE ... ADD COLUMN family_group` statement should only be run once.
- `voltage_line_copy_templates.sql` assumes a `voltage_lines` table already exists with matching columns.
- The iPhone 17 family pack is a placeholder starter pack and should be refined with real board data later.
