BEGIN;

-- This script targets the English schema (`room_tier`, `room`, `equipment`).
-- Run the rename migrations first if the database still uses Vietnamese names.
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_name = 'room_tier'
    ) THEN
        RAISE EXCEPTION 'room_tier table not found. Apply the English schema migrations first.';
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_name = 'room'
    ) THEN
        RAISE EXCEPTION 'room table not found. Apply the English schema migrations first.';
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_name = 'equipment'
    ) THEN
        RAISE EXCEPTION 'equipment table not found. Apply the English schema migrations first.';
    END IF;
END
$$;

-- Upsert room tiers.
WITH sample_room_tiers(name, hourly_rate, description) AS (
    VALUES
        ('Standard Practice', 120000.00::numeric, 'Compact rooms for individual or duo rehearsal sessions.'),
        ('Band Rehearsal', 320000.00::numeric, 'Full-band rehearsal rooms with drum kit, guitar and bass amplification.'),
        ('Recording & Mixing', 500000.00::numeric, 'Rooms optimized for vocal tracking, overdub, and mix review.'),
        ('Premium Studio', 720000.00::numeric, 'High-end rooms for showcase rehearsal, live session, and private production.')
)
UPDATE room_tier rt
SET hourly_rate = sample_room_tiers.hourly_rate,
    description = sample_room_tiers.description
FROM sample_room_tiers
WHERE rt.name = sample_room_tiers.name;

WITH sample_room_tiers(name, hourly_rate, description) AS (
    VALUES
        ('Standard Practice', 120000.00::numeric, 'Compact rooms for individual or duo rehearsal sessions.'),
        ('Band Rehearsal', 320000.00::numeric, 'Full-band rehearsal rooms with drum kit, guitar and bass amplification.'),
        ('Recording & Mixing', 500000.00::numeric, 'Rooms optimized for vocal tracking, overdub, and mix review.'),
        ('Premium Studio', 720000.00::numeric, 'High-end rooms for showcase rehearsal, live session, and private production.')
)
INSERT INTO room_tier (name, hourly_rate, description)
SELECT sample_room_tiers.name,
       sample_room_tiers.hourly_rate,
       sample_room_tiers.description
FROM sample_room_tiers
WHERE NOT EXISTS (
    SELECT 1
    FROM room_tier rt
    WHERE rt.name = sample_room_tiers.name
);

-- Upsert sample rooms.
WITH sample_rooms(name, tier_name, status) AS (
    VALUES
        ('Practice Pod A', 'Standard Practice', 'AVAILABLE'),
        ('Practice Pod B', 'Standard Practice', 'AVAILABLE'),
        ('Studio A - Phong Do', 'Band Rehearsal', 'AVAILABLE'),
        ('Studio B - Phong Xanh', 'Band Rehearsal', 'IN_USE'),
        ('The Vault - Thu am', 'Recording & Mixing', 'AVAILABLE'),
        ('Amber Live Room', 'Premium Studio', 'MAINTENANCE')
)
UPDATE room r
SET room_tier_id = rt.id,
    status = sample_rooms.status::room_status
FROM sample_rooms
JOIN room_tier rt ON rt.name = sample_rooms.tier_name
WHERE r.name = sample_rooms.name;

WITH sample_rooms(name, tier_name, status) AS (
    VALUES
        ('Practice Pod A', 'Standard Practice', 'AVAILABLE'),
        ('Practice Pod B', 'Standard Practice', 'AVAILABLE'),
        ('Studio A - Phong Do', 'Band Rehearsal', 'AVAILABLE'),
        ('Studio B - Phong Xanh', 'Band Rehearsal', 'IN_USE'),
        ('The Vault - Thu am', 'Recording & Mixing', 'AVAILABLE'),
        ('Amber Live Room', 'Premium Studio', 'MAINTENANCE')
)
INSERT INTO room (name, room_tier_id, status)
SELECT sample_rooms.name,
       rt.id,
       sample_rooms.status::room_status
FROM sample_rooms
JOIN room_tier rt ON rt.name = sample_rooms.tier_name
WHERE NOT EXISTS (
    SELECT 1
    FROM room r
    WHERE r.name = sample_rooms.name
);

-- Upsert sample equipment records.
WITH sample_equipment(room_name, type, name, status, notes) AS (
    VALUES
        ('Practice Pod A', 'DRUM', 'Roland TD-17KV2 Kit', 'GOOD', 'Compact electronic drum kit for individual warm-up sessions.'),
        ('Practice Pod A', 'AMP', 'Fender Champion 40', 'GOOD', 'Clean pedal-friendly amp for guitar practice.'),
        ('Practice Pod A', 'OTHER', 'Audio-Technica ATH-M40x Headphones', 'GOOD', 'Closed-back monitoring headphones for late sessions.'),

        ('Practice Pod B', 'DRUM', 'Yamaha Stage Custom Kit', 'GOOD', 'Acoustic drum kit for duo and small-group rehearsal.'),
        ('Practice Pod B', 'AMP', 'Vox AC15C1', 'GOOD', 'Combo amp with bright top-end for pop and indie rehearsal.'),
        ('Practice Pod B', 'MIXER', 'Yamaha MG10XU', 'GOOD', 'Small mixer for quick playback and vocal blend.'),

        ('Studio A - Phong Do', 'DRUM', 'Pearl Export Drum Kit', 'GOOD', 'Main rehearsal drum kit for full-band sessions.'),
        ('Studio A - Phong Do', 'AMP', 'Marshall MG30GFX', 'GOOD', 'Shared guitar combo for rehearsals and quick line checks.'),
        ('Studio A - Phong Do', 'MIC', 'Shure SM58 Vocal Mic', 'GOOD', 'Default vocal microphone for rehearsal room A.'),
        ('Studio A - Phong Do', 'MIXER', 'Behringer X32 Rack', 'GOOD', 'Digital mixer for room routing and monitor control.'),

        ('Studio B - Phong Xanh', 'DRUM', 'Tama Imperialstar Drum Kit', 'GOOD', 'Band rehearsal kit with balanced room response.'),
        ('Studio B - Phong Xanh', 'AMP', 'Orange Crush 35RT', 'GOOD', 'Rhythm guitar combo for rehearsal room B.'),
        ('Studio B - Phong Xanh', 'MIC', 'Sennheiser e835', 'GOOD', 'Secondary vocal mic for shared rehearsal use.'),
        ('Studio B - Phong Xanh', 'MIXER', 'Allen & Heath ZED-12FX', 'GOOD', 'Analog mixer for simple rehearsal mixes.'),

        ('The Vault - Thu am', 'KEYBOARD', 'Yamaha P-125 Digital Piano', 'GOOD', 'Weighted keyboard for arrangement and overdub sessions.'),
        ('The Vault - Thu am', 'MIC', 'Neumann TLM 102', 'GOOD', 'Primary condenser microphone for vocal tracking.'),
        ('The Vault - Thu am', 'OTHER', 'Focusrite Scarlett 18i20', 'GOOD', 'Audio interface for multi-channel recording workflows.'),
        ('The Vault - Thu am', 'OTHER', 'Genelec 8040B Monitor Pair', 'GOOD', 'Nearfield monitors for mix review and playback checks.'),

        ('Amber Live Room', 'DRUM', 'DW Collectors Series Kit', 'MAINTENANCE', 'Temporarily unavailable while replacing snare hardware.'),
        ('Amber Live Room', 'AMP', 'Mesa Boogie Dual Rectifier', 'GOOD', 'High-gain guitar head for showcase rehearsal.'),
        ('Amber Live Room', 'MIXER', 'Behringer X32 Compact', 'GOOD', 'Main mixer for live room playback and monitor sends.'),
        ('Amber Live Room', 'MIC', 'Shure Beta 58A', 'BROKEN', 'Marked broken pending capsule replacement.')
)
UPDATE equipment e
SET type = sample_equipment.type::equipment_type,
    status = sample_equipment.status::equipment_status,
    notes = sample_equipment.notes
FROM sample_equipment
JOIN room r ON r.name = sample_equipment.room_name
WHERE e.room_id = r.id
  AND e.name = sample_equipment.name;

WITH sample_equipment(room_name, type, name, status, notes) AS (
    VALUES
        ('Practice Pod A', 'DRUM', 'Roland TD-17KV2 Kit', 'GOOD', 'Compact electronic drum kit for individual warm-up sessions.'),
        ('Practice Pod A', 'AMP', 'Fender Champion 40', 'GOOD', 'Clean pedal-friendly amp for guitar practice.'),
        ('Practice Pod A', 'OTHER', 'Audio-Technica ATH-M40x Headphones', 'GOOD', 'Closed-back monitoring headphones for late sessions.'),

        ('Practice Pod B', 'DRUM', 'Yamaha Stage Custom Kit', 'GOOD', 'Acoustic drum kit for duo and small-group rehearsal.'),
        ('Practice Pod B', 'AMP', 'Vox AC15C1', 'GOOD', 'Combo amp with bright top-end for pop and indie rehearsal.'),
        ('Practice Pod B', 'MIXER', 'Yamaha MG10XU', 'GOOD', 'Small mixer for quick playback and vocal blend.'),

        ('Studio A - Phong Do', 'DRUM', 'Pearl Export Drum Kit', 'GOOD', 'Main rehearsal drum kit for full-band sessions.'),
        ('Studio A - Phong Do', 'AMP', 'Marshall MG30GFX', 'GOOD', 'Shared guitar combo for rehearsals and quick line checks.'),
        ('Studio A - Phong Do', 'MIC', 'Shure SM58 Vocal Mic', 'GOOD', 'Default vocal microphone for rehearsal room A.'),
        ('Studio A - Phong Do', 'MIXER', 'Behringer X32 Rack', 'GOOD', 'Digital mixer for room routing and monitor control.'),

        ('Studio B - Phong Xanh', 'DRUM', 'Tama Imperialstar Drum Kit', 'GOOD', 'Band rehearsal kit with balanced room response.'),
        ('Studio B - Phong Xanh', 'AMP', 'Orange Crush 35RT', 'GOOD', 'Rhythm guitar combo for rehearsal room B.'),
        ('Studio B - Phong Xanh', 'MIC', 'Sennheiser e835', 'GOOD', 'Secondary vocal mic for shared rehearsal use.'),
        ('Studio B - Phong Xanh', 'MIXER', 'Allen & Heath ZED-12FX', 'GOOD', 'Analog mixer for simple rehearsal mixes.'),

        ('The Vault - Thu am', 'KEYBOARD', 'Yamaha P-125 Digital Piano', 'GOOD', 'Weighted keyboard for arrangement and overdub sessions.'),
        ('The Vault - Thu am', 'MIC', 'Neumann TLM 102', 'GOOD', 'Primary condenser microphone for vocal tracking.'),
        ('The Vault - Thu am', 'OTHER', 'Focusrite Scarlett 18i20', 'GOOD', 'Audio interface for multi-channel recording workflows.'),
        ('The Vault - Thu am', 'OTHER', 'Genelec 8040B Monitor Pair', 'GOOD', 'Nearfield monitors for mix review and playback checks.'),

        ('Amber Live Room', 'DRUM', 'DW Collectors Series Kit', 'MAINTENANCE', 'Temporarily unavailable while replacing snare hardware.'),
        ('Amber Live Room', 'AMP', 'Mesa Boogie Dual Rectifier', 'GOOD', 'High-gain guitar head for showcase rehearsal.'),
        ('Amber Live Room', 'MIXER', 'Behringer X32 Compact', 'GOOD', 'Main mixer for live room playback and monitor sends.'),
        ('Amber Live Room', 'MIC', 'Shure Beta 58A', 'BROKEN', 'Marked broken pending capsule replacement.')
)
INSERT INTO equipment (room_id, type, name, status, notes)
SELECT r.id,
       sample_equipment.type::equipment_type,
       sample_equipment.name,
       sample_equipment.status::equipment_status,
       sample_equipment.notes
FROM sample_equipment
JOIN room r ON r.name = sample_equipment.room_name
WHERE NOT EXISTS (
    SELECT 1
    FROM equipment e
    WHERE e.room_id = r.id
      AND e.name = sample_equipment.name
);

COMMIT;
