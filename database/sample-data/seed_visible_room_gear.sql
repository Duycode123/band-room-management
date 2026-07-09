BEGIN;

-- Gear observed from the four room photos shared for local/demo data.
-- This script targets the English schema (`room`, `equipment`).
WITH visible_room_gear(room_name, type, name, status, notes) AS (
    VALUES
        ('The Beatles', 'DRUM', 'TAMA Acoustic Drum Kit', 'GOOD', 'Bộ trống acoustic TAMA màu đỏ, gồm cymbal và phần cứng đi kèm.'),
        ('The Beatles', 'KEYBOARD', 'KORG KRONOS Keyboard Workstation', 'GOOD', 'Đàn KORG KRONOS đặt trên chân đàn.'),
        ('The Beatles', 'GUITAR', 'Electric Guitar Set', 'GOOD', 'Nhiều guitar điện đặt trên giá trong phòng.'),
        ('The Beatles', 'GUITAR', 'Electric Bass Guitar', 'GOOD', 'Đàn bass điện đặt gần khu vực giá guitar.'),
        ('The Beatles', 'MIC', 'Vocal Microphone Set', 'GOOD', 'Bộ micro hát phục vụ luyện tập ban nhạc.'),
        ('The Beatles', 'OTHER', 'Microphone Stand Set', 'GOOD', 'Nhiều chân micro dạng boom trong phòng.'),
        ('The Beatles', 'OTHER', 'PA Speaker', 'GOOD', 'Loa PA chính đặt trên chân loa.'),
        ('The Beatles', 'AMP', 'Guitar/Bass Amplifier Stack', 'GOOD', 'Cụm ampli và thùng loa cho guitar hoặc bass.'),
        ('The Beatles', 'MIXER', 'Room Audio Mixer/Rack', 'GOOD', 'Khu vực mixer/rack âm thanh phục vụ điều phối tín hiệu trong phòng.'),

        ('Cold Play', 'DRUM', 'Premier Acoustic Drum Kit', 'GOOD', 'Bộ trống acoustic Premier kèm cymbal.'),
        ('Cold Play', 'KEYBOARD', 'CASIO Digital Keyboard', 'GOOD', 'Đàn phím CASIO đặt trên chân đàn.'),
        ('Cold Play', 'KEYBOARD', 'Yamaha Arranger Keyboard', 'GOOD', 'Đàn arranger Yamaha đặt ở khu vực phía trước phòng.'),
        ('Cold Play', 'AMP', 'Hartke Bass Amplifier', 'GOOD', 'Ampli Hartke đặt gần khu vực phía trước bên trái.'),
        ('Cold Play', 'MIC', 'Vocal Microphone', 'GOOD', 'Micro hát đặt ở vị trí trung tâm phòng.'),
        ('Cold Play', 'OTHER', 'Microphone Stand Set', 'GOOD', 'Các chân micro bố trí quanh phòng.'),
        ('Cold Play', 'OTHER', 'Music Stand', 'GOOD', 'Giá để bản nhạc đặt ở phía trước bên trái.'),
        ('Cold Play', 'OTHER', 'PA Speaker', 'GOOD', 'Loa PA đặt trên chân gần khu vực trống.'),

        ('Pink Floyd', 'DRUM', 'Premier Acoustic Drum Kit', 'GOOD', 'Bộ trống acoustic Premier kèm cymbal.'),
        ('Pink Floyd', 'AMP', 'Wharfedale Guitar/Bass Amplifier', 'GOOD', 'Ampli Wharfedale đặt gần bục trống.'),
        ('Pink Floyd', 'MIXER', 'Compact Analog Mixer', 'GOOD', 'Mixer analog nhỏ đặt trên tủ bên hông phòng.'),
        ('Pink Floyd', 'MIC', 'Vocal Microphone', 'GOOD', 'Micro cầm tay đặt gần khu vực mixer.'),
        ('Pink Floyd', 'OTHER', 'Microphone Stand', 'GOOD', 'Chân micro đặt gần khu vực mixer.'),
        ('Pink Floyd', 'OTHER', 'PA/Monitor Speaker', 'GOOD', 'Loa monitor nhỏ đặt gần bộ trống.'),
        ('Pink Floyd', 'OTHER', 'Instrument Stand', 'GOOD', 'Giá để nhạc cụ đặt dọc tường bên phải.'),

        ('Queen', 'DRUM', 'PDP Acoustic Drum Kit', 'GOOD', 'Bộ trống acoustic PDP màu xanh, gồm cymbal và phần cứng đi kèm.'),
        ('Queen', 'KEYBOARD', 'Yamaha PSR-SX600 Keyboard', 'GOOD', 'Đàn Yamaha PSR-SX600 đặt trên chân chữ X.'),
        ('Queen', 'AMP', 'Guitar/Bass Amplifier', 'GOOD', 'Ampli guitar hoặc bass đặt gần tường bên trái.'),
        ('Queen', 'OTHER', 'PA Speaker', 'GOOD', 'Loa PA đặt trên chân gần khu vực trống.'),
        ('Queen', 'OTHER', 'Instrument Stand Set', 'GOOD', 'Nhiều giá để nhạc cụ đặt gần tường bên trái.'),
        ('Queen', 'OTHER', 'Cable Set', 'GOOD', 'Bộ dây tín hiệu và dây nguồn phục vụ kết nối thiết bị.'),
        ('Queen', 'OTHER', 'Keyboard Stand', 'GOOD', 'Chân đàn keyboard dạng chữ X.')
)
UPDATE equipment e
SET type = visible_room_gear.type::equipment_type,
    status = visible_room_gear.status::equipment_status,
    notes = visible_room_gear.notes
FROM visible_room_gear
JOIN room r ON r.name = visible_room_gear.room_name
WHERE e.room_id = r.id
  AND e.name = visible_room_gear.name;

WITH visible_room_gear(room_name, type, name, status, notes) AS (
    VALUES
        ('The Beatles', 'DRUM', 'TAMA Acoustic Drum Kit', 'GOOD', 'Bộ trống acoustic TAMA màu đỏ, gồm cymbal và phần cứng đi kèm.'),
        ('The Beatles', 'KEYBOARD', 'KORG KRONOS Keyboard Workstation', 'GOOD', 'Đàn KORG KRONOS đặt trên chân đàn.'),
        ('The Beatles', 'GUITAR', 'Electric Guitar Set', 'GOOD', 'Nhiều guitar điện đặt trên giá trong phòng.'),
        ('The Beatles', 'GUITAR', 'Electric Bass Guitar', 'GOOD', 'Đàn bass điện đặt gần khu vực giá guitar.'),
        ('The Beatles', 'MIC', 'Vocal Microphone Set', 'GOOD', 'Bộ micro hát phục vụ luyện tập ban nhạc.'),
        ('The Beatles', 'OTHER', 'Microphone Stand Set', 'GOOD', 'Nhiều chân micro dạng boom trong phòng.'),
        ('The Beatles', 'OTHER', 'PA Speaker', 'GOOD', 'Loa PA chính đặt trên chân loa.'),
        ('The Beatles', 'AMP', 'Guitar/Bass Amplifier Stack', 'GOOD', 'Cụm ampli và thùng loa cho guitar hoặc bass.'),
        ('The Beatles', 'MIXER', 'Room Audio Mixer/Rack', 'GOOD', 'Khu vực mixer/rack âm thanh phục vụ điều phối tín hiệu trong phòng.'),

        ('Cold Play', 'DRUM', 'Premier Acoustic Drum Kit', 'GOOD', 'Bộ trống acoustic Premier kèm cymbal.'),
        ('Cold Play', 'KEYBOARD', 'CASIO Digital Keyboard', 'GOOD', 'Đàn phím CASIO đặt trên chân đàn.'),
        ('Cold Play', 'KEYBOARD', 'Yamaha Arranger Keyboard', 'GOOD', 'Đàn arranger Yamaha đặt ở khu vực phía trước phòng.'),
        ('Cold Play', 'AMP', 'Hartke Bass Amplifier', 'GOOD', 'Ampli Hartke đặt gần khu vực phía trước bên trái.'),
        ('Cold Play', 'MIC', 'Vocal Microphone', 'GOOD', 'Micro hát đặt ở vị trí trung tâm phòng.'),
        ('Cold Play', 'OTHER', 'Microphone Stand Set', 'GOOD', 'Các chân micro bố trí quanh phòng.'),
        ('Cold Play', 'OTHER', 'Music Stand', 'GOOD', 'Giá để bản nhạc đặt ở phía trước bên trái.'),
        ('Cold Play', 'OTHER', 'PA Speaker', 'GOOD', 'Loa PA đặt trên chân gần khu vực trống.'),

        ('Pink Floyd', 'DRUM', 'Premier Acoustic Drum Kit', 'GOOD', 'Bộ trống acoustic Premier kèm cymbal.'),
        ('Pink Floyd', 'AMP', 'Wharfedale Guitar/Bass Amplifier', 'GOOD', 'Ampli Wharfedale đặt gần bục trống.'),
        ('Pink Floyd', 'MIXER', 'Compact Analog Mixer', 'GOOD', 'Mixer analog nhỏ đặt trên tủ bên hông phòng.'),
        ('Pink Floyd', 'MIC', 'Vocal Microphone', 'GOOD', 'Micro cầm tay đặt gần khu vực mixer.'),
        ('Pink Floyd', 'OTHER', 'Microphone Stand', 'GOOD', 'Chân micro đặt gần khu vực mixer.'),
        ('Pink Floyd', 'OTHER', 'PA/Monitor Speaker', 'GOOD', 'Loa monitor nhỏ đặt gần bộ trống.'),
        ('Pink Floyd', 'OTHER', 'Instrument Stand', 'GOOD', 'Giá để nhạc cụ đặt dọc tường bên phải.'),

        ('Queen', 'DRUM', 'PDP Acoustic Drum Kit', 'GOOD', 'Bộ trống acoustic PDP màu xanh, gồm cymbal và phần cứng đi kèm.'),
        ('Queen', 'KEYBOARD', 'Yamaha PSR-SX600 Keyboard', 'GOOD', 'Đàn Yamaha PSR-SX600 đặt trên chân chữ X.'),
        ('Queen', 'AMP', 'Guitar/Bass Amplifier', 'GOOD', 'Ampli guitar hoặc bass đặt gần tường bên trái.'),
        ('Queen', 'OTHER', 'PA Speaker', 'GOOD', 'Loa PA đặt trên chân gần khu vực trống.'),
        ('Queen', 'OTHER', 'Instrument Stand Set', 'GOOD', 'Nhiều giá để nhạc cụ đặt gần tường bên trái.'),
        ('Queen', 'OTHER', 'Cable Set', 'GOOD', 'Bộ dây tín hiệu và dây nguồn phục vụ kết nối thiết bị.'),
        ('Queen', 'OTHER', 'Keyboard Stand', 'GOOD', 'Chân đàn keyboard dạng chữ X.')
)
INSERT INTO equipment (room_id, type, name, status, notes)
SELECT r.id,
       visible_room_gear.type::equipment_type,
       visible_room_gear.name,
       visible_room_gear.status::equipment_status,
       visible_room_gear.notes
FROM visible_room_gear
JOIN room r ON r.name = visible_room_gear.room_name
WHERE NOT EXISTS (
    SELECT 1
    FROM equipment e
    WHERE e.room_id = r.id
      AND e.name = visible_room_gear.name
);

COMMIT;
