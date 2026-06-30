CREATE TABLE IF NOT EXISTS danh_gia (
    id SERIAL PRIMARY KEY,
    dat_phong_id INTEGER NOT NULL UNIQUE REFERENCES dat_phong(id) ON DELETE CASCADE,
    diem INTEGER NOT NULL CHECK (diem BETWEEN 1 AND 5),
    noi_dung TEXT,
    da_duyet BOOLEAN NOT NULL DEFAULT FALSE,
    ngay_tao TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_danh_gia_dat_phong_id ON danh_gia(dat_phong_id);
CREATE INDEX IF NOT EXISTS idx_danh_gia_da_duyet ON danh_gia(da_duyet);
