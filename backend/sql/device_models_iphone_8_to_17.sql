BEGIN TRANSACTION;

-- Add once if your existing device_models table does not already have this column.
ALTER TABLE device_models ADD COLUMN family_group TEXT;

INSERT INTO device_models (
    brand, series, model_name, model_code, board_code, cpu_type, pmic_type, charging_ic, baseband_type, storage_type, notes
) VALUES
('Apple', 'iPhone', 'iPhone 8', NULL, NULL, 'A11 Bionic', NULL, NULL, NULL, 'NAND', 'Starter device entry'),
('Apple', 'iPhone', 'iPhone 8 Plus', NULL, NULL, 'A11 Bionic', NULL, NULL, NULL, 'NAND', 'Starter device entry'),
('Apple', 'iPhone', 'iPhone X', NULL, NULL, 'A11 Bionic', NULL, NULL, NULL, 'NAND', 'Starter device entry'),
('Apple', 'iPhone', 'iPhone XS', NULL, NULL, 'A12 Bionic', NULL, NULL, NULL, 'NAND', 'Starter device entry'),
('Apple', 'iPhone', 'iPhone XS Max', NULL, NULL, 'A12 Bionic', NULL, NULL, NULL, 'NAND', 'Starter device entry'),
('Apple', 'iPhone', 'iPhone XR', NULL, NULL, 'A12 Bionic', NULL, NULL, NULL, 'NAND', 'Starter device entry'),
('Apple', 'iPhone', 'iPhone 11', NULL, NULL, 'A13 Bionic', NULL, NULL, NULL, 'NAND', 'Starter device entry'),
('Apple', 'iPhone', 'iPhone 11 Pro', NULL, NULL, 'A13 Bionic', NULL, NULL, NULL, 'NAND', 'Starter device entry'),
('Apple', 'iPhone', 'iPhone 11 Pro Max', NULL, NULL, 'A13 Bionic', NULL, NULL, NULL, 'NAND', 'Starter device entry'),
('Apple', 'iPhone', 'iPhone SE (2nd generation)', NULL, NULL, 'A13 Bionic', NULL, NULL, NULL, 'NAND', 'Starter device entry'),
('Apple', 'iPhone', 'iPhone SE (3rd generation)', NULL, NULL, 'A15 Bionic', NULL, NULL, NULL, 'NAND', 'Starter device entry'),
('Apple', 'iPhone', 'iPhone 12 mini', NULL, NULL, 'A14 Bionic', NULL, NULL, NULL, 'NAND', 'Starter device entry'),
('Apple', 'iPhone', 'iPhone 12', NULL, NULL, 'A14 Bionic', NULL, NULL, NULL, 'NAND', 'Starter device entry'),
('Apple', 'iPhone', 'iPhone 12 Pro', NULL, NULL, 'A14 Bionic', NULL, NULL, NULL, 'NAND', 'Starter device entry'),
('Apple', 'iPhone', 'iPhone 12 Pro Max', NULL, NULL, 'A14 Bionic', NULL, NULL, NULL, 'NAND', 'Starter device entry'),
('Apple', 'iPhone', 'iPhone 13 mini', NULL, NULL, 'A15 Bionic', NULL, NULL, NULL, 'NAND', 'Starter device entry'),
('Apple', 'iPhone', 'iPhone 13', NULL, NULL, 'A15 Bionic', NULL, NULL, NULL, 'NAND', 'Starter device entry'),
('Apple', 'iPhone', 'iPhone 13 Pro', NULL, NULL, 'A15 Bionic', NULL, NULL, NULL, 'NAND', 'Starter device entry'),
('Apple', 'iPhone', 'iPhone 13 Pro Max', NULL, NULL, 'A15 Bionic', NULL, NULL, NULL, 'NAND', 'Starter device entry'),
('Apple', 'iPhone', 'iPhone 14', NULL, NULL, 'A15 Bionic', NULL, NULL, NULL, 'NAND', 'Starter device entry'),
('Apple', 'iPhone', 'iPhone 14 Plus', NULL, NULL, 'A15 Bionic', NULL, NULL, NULL, 'NAND', 'Starter device entry'),
('Apple', 'iPhone', 'iPhone 14 Pro', NULL, NULL, 'A16 Bionic', NULL, NULL, NULL, 'NAND', 'Starter device entry'),
('Apple', 'iPhone', 'iPhone 14 Pro Max', NULL, NULL, 'A16 Bionic', NULL, NULL, NULL, 'NAND', 'Starter device entry'),
('Apple', 'iPhone', 'iPhone 15', NULL, NULL, 'A16 Bionic', NULL, NULL, NULL, 'NAND', 'Starter device entry'),
('Apple', 'iPhone', 'iPhone 15 Plus', NULL, NULL, 'A16 Bionic', NULL, NULL, NULL, 'NAND', 'Starter device entry'),
('Apple', 'iPhone', 'iPhone 15 Pro', NULL, NULL, 'A17 Pro', NULL, NULL, NULL, 'NAND', 'Starter device entry'),
('Apple', 'iPhone', 'iPhone 15 Pro Max', NULL, NULL, 'A17 Pro', NULL, NULL, NULL, 'NAND', 'Starter device entry'),
('Apple', 'iPhone', 'iPhone 16', NULL, NULL, 'A18', NULL, NULL, NULL, 'NAND', 'Starter device entry'),
('Apple', 'iPhone', 'iPhone 16 Plus', NULL, NULL, 'A18', NULL, NULL, NULL, 'NAND', 'Starter device entry'),
('Apple', 'iPhone', 'iPhone 16 Pro', NULL, NULL, 'A18 Pro', NULL, NULL, NULL, 'NAND', 'Starter device entry'),
('Apple', 'iPhone', 'iPhone 16 Pro Max', NULL, NULL, 'A18 Pro', NULL, NULL, NULL, 'NAND', 'Starter device entry'),
('Apple', 'iPhone', 'iPhone 16e', NULL, NULL, 'A18', NULL, NULL, NULL, 'NAND', 'Value member of iPhone 16 family'),
('Apple', 'iPhone', 'iPhone 17', NULL, NULL, NULL, NULL, NULL, NULL, 'NAND', 'Current Apple lineup entry'),
('Apple', 'iPhone', 'iPhone 17 Pro', NULL, NULL, NULL, NULL, NULL, NULL, 'NAND', 'Current Apple lineup entry'),
('Apple', 'iPhone', 'iPhone 17 Pro Max', NULL, NULL, NULL, NULL, NULL, NULL, 'NAND', 'Current Apple lineup entry'),
('Apple', 'iPhone', 'iPhone Air', NULL, NULL, NULL, NULL, NULL, NULL, 'NAND', 'Current Apple lineup entry'),
('Apple', 'iPhone', 'iPhone 17e', NULL, NULL, NULL, NULL, NULL, NULL, 'NAND', 'Affordable member of iPhone 17 family');

UPDATE device_models SET family_group = 'A11' WHERE model_name IN ('iPhone 8', 'iPhone 8 Plus', 'iPhone X');
UPDATE device_models SET family_group = 'A12' WHERE model_name IN ('iPhone XS', 'iPhone XS Max', 'iPhone XR');
UPDATE device_models SET family_group = 'A13' WHERE model_name IN ('iPhone 11', 'iPhone 11 Pro', 'iPhone 11 Pro Max', 'iPhone SE (2nd generation)');
UPDATE device_models SET family_group = 'A14' WHERE model_name IN ('iPhone 12 mini', 'iPhone 12', 'iPhone 12 Pro', 'iPhone 12 Pro Max');
UPDATE device_models SET family_group = 'A15' WHERE model_name IN ('iPhone 13 mini', 'iPhone 13', 'iPhone 13 Pro', 'iPhone 13 Pro Max', 'iPhone SE (3rd generation)', 'iPhone 14', 'iPhone 14 Plus');
UPDATE device_models SET family_group = 'A16' WHERE model_name IN ('iPhone 14 Pro', 'iPhone 14 Pro Max', 'iPhone 15', 'iPhone 15 Plus');
UPDATE device_models SET family_group = 'A17' WHERE model_name IN ('iPhone 15 Pro', 'iPhone 15 Pro Max');
UPDATE device_models SET family_group = 'A18' WHERE model_name IN ('iPhone 16', 'iPhone 16 Plus', 'iPhone 16e');
UPDATE device_models SET family_group = 'A18_PRO' WHERE model_name IN ('iPhone 16 Pro', 'iPhone 16 Pro Max');
UPDATE device_models SET family_group = 'IPHONE17' WHERE model_name IN ('iPhone 17', 'iPhone 17 Pro', 'iPhone 17 Pro Max', 'iPhone Air', 'iPhone 17e');

COMMIT;
