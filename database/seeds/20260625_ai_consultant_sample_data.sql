-- =============================================================
-- AI consultant sample data
-- Database target: bandlabdb (PostgreSQL)
--
-- Use this seed to test /api/ai/chat with real DB data:
-- - room types with price + capacity
-- - many rooms with different capacity and statuses
-- - sample bookings that block some time ranges
--
-- Safe to run multiple times.
-- =============================================================

BEGIN;

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

-- 1) Room types: price and real capacity for AI filtering.
INSERT INTO hang_phong (ten_hang, gia_gio, suc_chua, mo_ta)
VALUES
  ('Phòng mini', 80000, 2, 'Phòng nhỏ, phù hợp luyện cá nhân hoặc 1-2 người.'),
  ('Phòng tiêu chuẩn', 120000, 4, 'Phòng cơ bản cho nhóm nhỏ, giá dễ tiếp cận.'),
  ('Phòng band', 200000, 8, 'Phòng dành cho ban nhạc vừa, có không gian thoải mái hơn.'),
  ('Phòng lớn', 300000, 12, 'Phòng rộng cho nhóm đông hoặc buổi tập cần nhiều nhạc cụ.'),
  ('Phòng premium', 500000, 20, 'Phòng cao cấp, phù hợp nhóm lớn hoặc buổi tập quan trọng.'),
  ('Phòng trống/drum', 220000, 5, 'Phòng tập trống, phù hợp drummer hoặc nhóm nhỏ cần bộ trống.')
ON CONFLICT (ten_hang) DO UPDATE
SET
  gia_gio = EXCLUDED.gia_gio,
  suc_chua = EXCLUDED.suc_chua,
  mo_ta = EXCLUDED.mo_ta;

-- 2) Rooms.
INSERT INTO phong (ten, hang_phong_id, trang_thai)
VALUES
  ('Mini Room 01', (SELECT id FROM hang_phong WHERE ten_hang = 'Phòng mini'), 'TRONG'),
  ('Mini Room 02', (SELECT id FROM hang_phong WHERE ten_hang = 'Phòng mini'), 'TRONG'),
  ('Studio Standard 01', (SELECT id FROM hang_phong WHERE ten_hang = 'Phòng tiêu chuẩn'), 'TRONG'),
  ('Studio Standard 02', (SELECT id FROM hang_phong WHERE ten_hang = 'Phòng tiêu chuẩn'), 'TRONG'),
  ('Band Room 01', (SELECT id FROM hang_phong WHERE ten_hang = 'Phòng band'), 'TRONG'),
  ('Band Room 02', (SELECT id FROM hang_phong WHERE ten_hang = 'Phòng band'), 'TRONG'),
  ('Large Room 01', (SELECT id FROM hang_phong WHERE ten_hang = 'Phòng lớn'), 'TRONG'),
  ('Large Room 02', (SELECT id FROM hang_phong WHERE ten_hang = 'Phòng lớn'), 'TRONG'),
  ('Premium Hall 01', (SELECT id FROM hang_phong WHERE ten_hang = 'Phòng premium'), 'TRONG'),
  ('Premium Hall 02', (SELECT id FROM hang_phong WHERE ten_hang = 'Phòng premium'), 'TRONG'),
  ('Drum Room 01', (SELECT id FROM hang_phong WHERE ten_hang = 'Phòng trống/drum'), 'TRONG'),
  ('Drum Room 02 - Maintenance', (SELECT id FROM hang_phong WHERE ten_hang = 'Phòng trống/drum'), 'BAO_TRI')
ON CONFLICT (ten) DO UPDATE
SET
  hang_phong_id = EXCLUDED.hang_phong_id,
  trang_thai = EXCLUDED.trang_thai;

-- 3) Equipment samples. Remove old AI seed equipment first to avoid duplicates.
DELETE FROM thiet_bi
WHERE ghi_chu = 'AI seed';

INSERT INTO thiet_bi (phong_id, loai, ten, trang_thai, ghi_chu)
VALUES
  ((SELECT id FROM phong WHERE ten = 'Mini Room 01'), 'MIC', 'Micro basic', 'TOT', 'AI seed'),
  ((SELECT id FROM phong WHERE ten = 'Mini Room 02'), 'GUITAR', 'Guitar practice amp', 'TOT', 'AI seed'),
  ((SELECT id FROM phong WHERE ten = 'Studio Standard 01'), 'AMP', 'Amp 50W', 'TOT', 'AI seed'),
  ((SELECT id FROM phong WHERE ten = 'Studio Standard 02'), 'MIC', '2 microphones', 'TOT', 'AI seed'),
  ((SELECT id FROM phong WHERE ten = 'Band Room 01'), 'MIXER', 'Mixer 8 channels', 'TOT', 'AI seed'),
  ((SELECT id FROM phong WHERE ten = 'Band Room 01'), 'TRONG', 'Drum kit standard', 'TOT', 'AI seed'),
  ((SELECT id FROM phong WHERE ten = 'Band Room 02'), 'KEYBOARD', 'Keyboard 61 keys', 'TOT', 'AI seed'),
  ((SELECT id FROM phong WHERE ten = 'Large Room 01'), 'MIXER', 'Mixer 12 channels', 'TOT', 'AI seed'),
  ((SELECT id FROM phong WHERE ten = 'Large Room 02'), 'AMP', '2 guitar amps', 'TOT', 'AI seed'),
  ((SELECT id FROM phong WHERE ten = 'Premium Hall 01'), 'MIXER', 'Premium mixer', 'TOT', 'AI seed'),
  ((SELECT id FROM phong WHERE ten = 'Premium Hall 02'), 'MIC', 'Wireless microphones', 'TOT', 'AI seed'),
  ((SELECT id FROM phong WHERE ten = 'Drum Room 01'), 'TRONG', 'Drum kit advanced', 'TOT', 'AI seed');

-- 4) A sample customer used only for sample bookings.
INSERT INTO tai_khoan (email, mat_khau_hash, vai_tro)
VALUES (
  'ai-seed-customer@bandroom.local',
  '$2a$10$aiSeedPasswordHashForLocalTestingOnly',
  'CUSTOMER'
)
ON CONFLICT (email) DO UPDATE
SET vai_tro = EXCLUDED.vai_tro;

INSERT INTO khach_hang (tai_khoan_id, ho_ten, so_dien_thoai, email, ngay_sinh)
VALUES (
  (SELECT id FROM tai_khoan WHERE email = 'ai-seed-customer@bandroom.local'),
  'Khách test AI',
  '0900000000',
  'ai-seed-customer@bandroom.local',
  '2000-01-01'
)
ON CONFLICT (tai_khoan_id) DO UPDATE
SET
  ho_ten = EXCLUDED.ho_ten,
  so_dien_thoai = EXCLUDED.so_dien_thoai,
  email = EXCLUDED.email,
  ngay_sinh = EXCLUDED.ngay_sinh;

-- 5) Sample bookings that block common testing time ranges.
-- Delete old AI seed bookings first so this file can be run again.
DELETE FROM dat_phong
WHERE ghi_chu LIKE 'AI_SEED:%';

INSERT INTO dat_phong (
  khach_hang_id,
  phong_id,
  gio_bat_dau,
  gio_ket_thuc,
  phuong_thuc,
  gia_gio_ap_dung,
  tong_tien,
  trang_thai,
  ghi_chu
)
VALUES
  (
    (SELECT id FROM khach_hang WHERE email = 'ai-seed-customer@bandroom.local'),
    (SELECT id FROM phong WHERE ten = 'Studio Standard 01'),
    CURRENT_DATE + TIME '18:00',
    CURRENT_DATE + TIME '20:00',
    'TIEN_MAT',
    120000,
    240000,
    'DA_THANH_TOAN',
    'AI_SEED: Studio Standard 01 busy today 18-20'
  ),
  (
    (SELECT id FROM khach_hang WHERE email = 'ai-seed-customer@bandroom.local'),
    (SELECT id FROM phong WHERE ten = 'Band Room 01'),
    CURRENT_DATE + TIME '19:00',
    CURRENT_DATE + TIME '21:00',
    'ONLINE',
    200000,
    400000,
    'DA_THANH_TOAN',
    'AI_SEED: Band Room 01 busy today 19-21'
  ),
  (
    (SELECT id FROM khach_hang WHERE email = 'ai-seed-customer@bandroom.local'),
    (SELECT id FROM phong WHERE ten = 'Large Room 01'),
    (CURRENT_DATE + 1) + TIME '18:00',
    (CURRENT_DATE + 1) + TIME '20:00',
    'ONLINE',
    300000,
    600000,
    'DA_THANH_TOAN',
    'AI_SEED: Large Room 01 busy tomorrow 18-20'
  ),
  (
    (SELECT id FROM khach_hang WHERE email = 'ai-seed-customer@bandroom.local'),
    (SELECT id FROM phong WHERE ten = 'Premium Hall 01'),
    CURRENT_DATE + TIME '20:00',
    CURRENT_DATE + TIME '22:00',
    'TIEN_MAT',
    500000,
    1000000,
    'CHO_THANH_TOAN',
    'AI_SEED: Premium Hall 01 pending today 20-22'
  );

COMMIT;

-- Quick checks:
-- SELECT p.ten, hp.ten_hang, hp.gia_gio, hp.suc_chua, p.trang_thai
-- FROM phong p
-- JOIN hang_phong hp ON hp.id = p.hang_phong_id
-- ORDER BY hp.gia_gio, p.ten;
--
-- SELECT p.ten, dp.gio_bat_dau, dp.gio_ket_thuc, dp.trang_thai, dp.ghi_chu
-- FROM dat_phong dp
-- JOIN phong p ON p.id = dp.phong_id
-- WHERE dp.ghi_chu LIKE 'AI_SEED:%'
-- ORDER BY dp.gio_bat_dau;
