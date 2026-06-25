-- Run this once against an existing bandlabdb database.
-- This lets the AI consultant use real room capacity data instead of guessing.

ALTER TABLE hang_phong
ADD COLUMN IF NOT EXISTS suc_chua int;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'chk_hang_phong_suc_chua_duong'
  ) THEN
    ALTER TABLE hang_phong
    ADD CONSTRAINT chk_hang_phong_suc_chua_duong
    CHECK (suc_chua IS NULL OR suc_chua > 0);
  END IF;
END $$;

-- After running the migration, update real capacity values for your room types.
-- Example:
-- UPDATE hang_phong SET suc_chua = 5 WHERE ten_hang = 'Phòng tiêu chuẩn';
-- UPDATE hang_phong SET suc_chua = 10 WHERE ten_hang = 'Phòng lớn';
