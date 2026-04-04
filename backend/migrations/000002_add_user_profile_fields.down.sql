ALTER TABLE users
    DROP COLUMN IF EXISTS current_location,
    DROP COLUMN IF EXISTS current_role,
    DROP COLUMN IF EXISTS current_company,
    DROP COLUMN IF EXISTS current_salary,
    DROP COLUMN IF EXISTS salary_currency;
