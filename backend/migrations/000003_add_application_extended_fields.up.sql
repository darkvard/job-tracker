ALTER TABLE applications
    ADD COLUMN salary            BIGINT,
    ADD COLUMN bhxh_pct          NUMERIC(5,2),
    ADD COLUMN bhyt_pct          NUMERIC(5,2),
    ADD COLUMN lunch_allowance   BIGINT,
    ADD COLUMN bonus_annual      BIGINT,
    ADD COLUMN no_saturday       BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN no_forced_ot      BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN commute_address   TEXT NOT NULL DEFAULT '',
    ADD COLUMN work_type         TEXT NOT NULL DEFAULT 'Onsite'
                                 CHECK (work_type IN ('Remote','Hybrid','Onsite')),
    ADD COLUMN interview_date    DATE;

CREATE INDEX idx_applications_interview_date
    ON applications(user_id, interview_date)
    WHERE interview_date IS NOT NULL;

CREATE INDEX idx_applications_status_updated
    ON applications(user_id, status, updated_at)
    WHERE status IN ('Applied','Interview');
