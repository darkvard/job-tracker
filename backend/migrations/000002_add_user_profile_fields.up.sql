ALTER TABLE users
    ADD COLUMN current_location TEXT,
    ADD COLUMN "current_role"   TEXT,
    ADD COLUMN current_company  TEXT,
    ADD COLUMN current_salary   BIGINT,
    ADD COLUMN salary_currency  TEXT NOT NULL DEFAULT 'VND';
