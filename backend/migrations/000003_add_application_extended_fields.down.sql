DROP INDEX IF EXISTS idx_applications_status_updated;
DROP INDEX IF EXISTS idx_applications_interview_date;

ALTER TABLE applications
    DROP COLUMN IF EXISTS interview_date,
    DROP COLUMN IF EXISTS work_type,
    DROP COLUMN IF EXISTS commute_address,
    DROP COLUMN IF EXISTS no_forced_ot,
    DROP COLUMN IF EXISTS no_saturday,
    DROP COLUMN IF EXISTS bonus_annual,
    DROP COLUMN IF EXISTS lunch_allowance,
    DROP COLUMN IF EXISTS bhyt_pct,
    DROP COLUMN IF EXISTS bhxh_pct,
    DROP COLUMN IF EXISTS salary;
