-- 000001_init.up.sql
-- Creates the initial schema: users, applications, and status_history.

CREATE TABLE users (
    id            BIGSERIAL   PRIMARY KEY,
    email         TEXT        NOT NULL UNIQUE,
    password_hash TEXT        NOT NULL,
    name          TEXT        NOT NULL,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE applications (
    id           BIGSERIAL   PRIMARY KEY,
    user_id      BIGINT      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    company      TEXT        NOT NULL CHECK (length(company) <= 100),
    role         TEXT        NOT NULL CHECK (length(role) <= 200),
    status       TEXT        NOT NULL CHECK (status IN ('Applied','Interview','Offer','Rejected')),
    date_applied DATE        NOT NULL,
    location     TEXT        NOT NULL DEFAULT '',
    source       TEXT        NOT NULL CHECK (source IN ('LinkedIn','Company Site','Referral','Indeed','Glassdoor','Other')),
    notes        TEXT        NOT NULL DEFAULT '',
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE status_history (
    id             BIGSERIAL   PRIMARY KEY,
    application_id BIGINT      NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    from_status    TEXT,
    to_status      TEXT        NOT NULL,
    note           TEXT        NOT NULL DEFAULT '',
    changed_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_applications_user_status ON applications(user_id, status);
CREATE INDEX idx_applications_user_date   ON applications(user_id, date_applied DESC);
CREATE INDEX idx_status_history_app       ON status_history(application_id, changed_at DESC);
