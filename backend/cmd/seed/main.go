// Package main seeds the database with demo data (idempotent).
// Usage: DB_DSN=<dsn> go run ./cmd/seed
package main

import (
	"log/slog"
	"os"
	"time"

	"golang.org/x/crypto/bcrypt"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

// ── GORM models (inline — seed has no business logic layer) ──────────────────

type userRow struct {
	ID           int64     `gorm:"primaryKey;autoIncrement"`
	Email        string    `gorm:"uniqueIndex;not null"`
	PasswordHash string    `gorm:"not null"`
	Name         string    `gorm:"not null"`
	CreatedAt    time.Time `gorm:"autoCreateTime"`
	UpdatedAt    time.Time `gorm:"autoUpdateTime"`
}

func (userRow) TableName() string { return "users" }

type applicationRow struct {
	ID          int64     `gorm:"primaryKey;autoIncrement"`
	UserID      int64     `gorm:"not null;index"`
	Company     string    `gorm:"not null;size:100"`
	Role        string    `gorm:"not null;size:200"`
	Status      string    `gorm:"not null;size:20"`
	DateApplied time.Time `gorm:"column:date_applied;not null"`
	Location    string    `gorm:"not null;default:''"`
	Source      string    `gorm:"not null;size:50"`
	Notes       string    `gorm:"not null;default:''"`
	CreatedAt   time.Time `gorm:"autoCreateTime"`
	UpdatedAt   time.Time `gorm:"autoUpdateTime"`
}

func (applicationRow) TableName() string { return "applications" }

type historyRow struct {
	ID            int64     `gorm:"primaryKey;autoIncrement"`
	ApplicationID int64     `gorm:"not null;index"`
	FromStatus    *string   `gorm:"column:from_status"`
	ToStatus      string    `gorm:"not null;size:20"`
	Note          string    `gorm:"not null;default:''"`
	ChangedAt     time.Time `gorm:"not null"`
}

func (historyRow) TableName() string { return "status_history" }

// ── seed data ─────────────────────────────────────────────────────────────────

const (
	demoEmail    = "demo@tracker.com"
	demoPassword = "demo123"
	demoName     = "Demo User"
)

func ptr(s string) *string { return &s }

type appSeed struct {
	company     string
	role        string
	location    string
	source      string
	notes       string
	dateApplied time.Time
	transitions []transition
}

type transition struct {
	from      *string
	to        string
	note      string
	changedAt time.Time
}

func main() {
	dsn := os.Getenv("DB_DSN")
	if dsn == "" {
		slog.Error("seed: DB_DSN environment variable is required")
		os.Exit(1)
	}

	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Silent),
	})
	if err != nil {
		slog.Error("seed: failed to connect to database", "error", err)
		os.Exit(1)
	}

	// Idempotency check — skip if demo user already exists.
	var existing userRow
	if err := db.Where("email = ?", demoEmail).First(&existing).Error; err == nil {
		slog.Info("seed: demo user already exists — skipping", "email", demoEmail)
		return
	}

	// Hash password.
	hash, err := bcrypt.GenerateFromPassword([]byte(demoPassword), 12)
	if err != nil {
		slog.Error("seed: failed to hash password", "error", err)
		os.Exit(1)
	}

	// Create demo user.
	user := userRow{
		Email:        demoEmail,
		PasswordHash: string(hash),
		Name:         demoName,
	}
	if err := db.Create(&user).Error; err != nil {
		slog.Error("seed: failed to create demo user", "error", err)
		os.Exit(1)
	}
	slog.Info("seed: created demo user", "email", demoEmail, "id", user.ID)

	// Reference dates (anchor around 2026-03-01 so analytics look populated).
	base := time.Date(2026, 3, 1, 10, 0, 0, 0, time.UTC)
	day := func(n int) time.Time { return base.AddDate(0, 0, n) }

	apps := []appSeed{
		{
			company:     "Google",
			role:        "Software Engineer",
			location:    "Mountain View, CA",
			source:      "LinkedIn",
			notes:       "Applied via LinkedIn Easy Apply. Strong match with JD requirements.",
			dateApplied: day(0),
			transitions: []transition{
				{from: nil, to: "Applied", note: "", changedAt: day(0)},
				{from: ptr("Applied"), to: "Interview", note: "Recruiter reached out for phone screen.", changedAt: day(5)},
			},
		},
		{
			company:     "Meta",
			role:        "Product Designer",
			location:    "Menlo Park, CA",
			source:      "Company Site",
			notes:       "Submitted through Meta Careers portal.",
			dateApplied: day(3),
			transitions: []transition{
				{from: nil, to: "Applied", note: "", changedAt: day(3)},
			},
		},
		{
			company:     "Apple",
			role:        "iOS Developer",
			location:    "Cupertino, CA",
			source:      "Referral",
			notes:       "Referred by a friend on the iPhone team.",
			dateApplied: day(6),
			transitions: []transition{
				{from: nil, to: "Applied", note: "", changedAt: day(6)},
				{from: ptr("Applied"), to: "Interview", note: "Technical screen scheduled.", changedAt: day(11)},
			},
		},
		{
			company:     "Amazon",
			role:        "SDE II",
			location:    "Seattle, WA",
			source:      "Indeed",
			notes:       "Applied to the Ads team position.",
			dateApplied: day(-10),
			transitions: []transition{
				{from: nil, to: "Applied", note: "", changedAt: day(-10)},
				{from: ptr("Applied"), to: "Rejected", note: "Not moving forward at this time.", changedAt: day(-2)},
			},
		},
		{
			company:     "Microsoft",
			role:        "Software Engineer",
			location:    "Redmond, WA",
			source:      "LinkedIn",
			notes:       "Applied to the Azure team opening.",
			dateApplied: day(9),
			transitions: []transition{
				{from: nil, to: "Applied", note: "", changedAt: day(9)},
			},
		},
		{
			company:     "Netflix",
			role:        "Senior Software Engineer",
			location:    "Los Gatos, CA",
			source:      "Glassdoor",
			notes:       "Found on Glassdoor. Great culture fit.",
			dateApplied: day(-14),
			transitions: []transition{
				{from: nil, to: "Applied", note: "", changedAt: day(-14)},
				{from: ptr("Applied"), to: "Interview", note: "Virtual interview round 1.", changedAt: day(-9)},
				{from: ptr("Interview"), to: "Offer", note: "Offer received! Reviewing details.", changedAt: day(1)},
			},
		},
		{
			company:     "Airbnb",
			role:        "Full Stack Developer",
			location:    "San Francisco, CA",
			source:      "Company Site",
			notes:       "",
			dateApplied: day(13),
			transitions: []transition{
				{from: nil, to: "Applied", note: "", changedAt: day(13)},
			},
		},
		{
			company:     "Spotify",
			role:        "Backend Developer",
			location:    "New York, NY",
			source:      "Referral",
			notes:       "Referred by a former colleague.",
			dateApplied: day(10),
			transitions: []transition{
				{from: nil, to: "Applied", note: "", changedAt: day(10)},
				{from: ptr("Applied"), to: "Interview", note: "Coding challenge passed.", changedAt: day(16)},
			},
		},
	}

	for _, a := range apps {
		// Determine final status from last transition.
		finalStatus := a.transitions[len(a.transitions)-1].to

		app := applicationRow{
			UserID:      user.ID,
			Company:     a.company,
			Role:        a.role,
			Status:      finalStatus,
			DateApplied: a.dateApplied,
			Location:    a.location,
			Source:      a.source,
			Notes:       a.notes,
		}
		if err := db.Create(&app).Error; err != nil {
			slog.Error("seed: failed to create application", "company", a.company, "error", err)
			os.Exit(1)
		}

		for _, t := range a.transitions {
			h := historyRow{
				ApplicationID: app.ID,
				FromStatus:    t.from,
				ToStatus:      t.to,
				Note:          t.note,
				ChangedAt:     t.changedAt,
			}
			if err := db.Create(&h).Error; err != nil {
				slog.Error("seed: failed to create status history", "company", a.company, "to", t.to, "error", err)
				os.Exit(1)
			}
		}

		slog.Info("seed: created application", "company", a.company, "status", finalStatus)
	}

	slog.Info("seed: done — 1 user + 8 applications created", "email", demoEmail, "password", demoPassword)
}
