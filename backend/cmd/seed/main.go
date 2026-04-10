// Package main seeds the database with demo data.
// Idempotent: skips if demo user already has ≥ 20 applications.
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
	minApps      = 20 // skip seeding apps if user already has this many
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

	// Get or create demo user.
	var user userRow
	if err := db.Where("email = ?", demoEmail).First(&user).Error; err != nil {
		hash, err := bcrypt.GenerateFromPassword([]byte(demoPassword), 12)
		if err != nil {
			slog.Error("seed: failed to hash password", "error", err)
			os.Exit(1)
		}
		user = userRow{Email: demoEmail, PasswordHash: string(hash), Name: demoName}
		if err := db.Create(&user).Error; err != nil {
			slog.Error("seed: failed to create demo user", "error", err)
			os.Exit(1)
		}
		slog.Info("seed: created demo user", "email", demoEmail, "id", user.ID)
	} else {
		slog.Info("seed: demo user exists", "email", demoEmail, "id", user.ID)
	}

	// Check current app count — skip if already well-seeded.
	var count int64
	db.Model(&applicationRow{}).Where("user_id = ?", user.ID).Count(&count)
	if count >= minApps {
		slog.Info("seed: already has enough applications — skipping", "count", count)
		return
	}

	// Reference dates (anchor around 2026-03-01 so analytics look populated).
	base := time.Date(2026, 3, 1, 10, 0, 0, 0, time.UTC)
	day := func(n int) time.Time { return base.AddDate(0, 0, n) }

	apps := []appSeed{
		// ── Wave 1: originals ──────────────────────────────────────────────────
		{
			company: "Google", role: "Software Engineer",
			location: "Mountain View, CA", source: "LinkedIn",
			notes:       "Applied via LinkedIn Easy Apply. Strong match with JD requirements.",
			dateApplied: day(0),
			transitions: []transition{
				{from: nil, to: "Applied", changedAt: day(0)},
				{from: ptr("Applied"), to: "Interview", note: "Recruiter reached out for phone screen.", changedAt: day(5)},
			},
		},
		{
			company: "Meta", role: "Product Designer",
			location: "Menlo Park, CA", source: "Company Site",
			notes:       "Submitted through Meta Careers portal.",
			dateApplied: day(3),
			transitions: []transition{
				{from: nil, to: "Applied", changedAt: day(3)},
			},
		},
		{
			company: "Apple", role: "iOS Developer",
			location: "Cupertino, CA", source: "Referral",
			notes:       "Referred by a friend on the iPhone team.",
			dateApplied: day(6),
			transitions: []transition{
				{from: nil, to: "Applied", changedAt: day(6)},
				{from: ptr("Applied"), to: "Interview", note: "Technical screen scheduled.", changedAt: day(11)},
			},
		},
		{
			company: "Amazon", role: "SDE II",
			location: "Seattle, WA", source: "Indeed",
			notes:       "Applied to the Ads team position.",
			dateApplied: day(-10),
			transitions: []transition{
				{from: nil, to: "Applied", changedAt: day(-10)},
				{from: ptr("Applied"), to: "Rejected", note: "Not moving forward at this time.", changedAt: day(-2)},
			},
		},
		{
			company: "Microsoft", role: "Software Engineer",
			location: "Redmond, WA", source: "LinkedIn",
			notes:       "Applied to the Azure team opening.",
			dateApplied: day(9),
			transitions: []transition{
				{from: nil, to: "Applied", changedAt: day(9)},
			},
		},
		{
			company: "Netflix", role: "Senior Software Engineer",
			location: "Los Gatos, CA", source: "Glassdoor",
			notes:       "Found on Glassdoor. Great culture fit.",
			dateApplied: day(-14),
			transitions: []transition{
				{from: nil, to: "Applied", changedAt: day(-14)},
				{from: ptr("Applied"), to: "Interview", note: "Virtual interview round 1.", changedAt: day(-9)},
				{from: ptr("Interview"), to: "Offer", note: "Offer received! Reviewing details.", changedAt: day(1)},
			},
		},
		{
			company: "Airbnb", role: "Full Stack Developer",
			location: "San Francisco, CA", source: "Company Site",
			dateApplied: day(13),
			transitions: []transition{
				{from: nil, to: "Applied", changedAt: day(13)},
			},
		},
		{
			company: "Spotify", role: "Backend Developer",
			location: "New York, NY", source: "Referral",
			notes:       "Referred by a former colleague.",
			dateApplied: day(10),
			transitions: []transition{
				{from: nil, to: "Applied", changedAt: day(10)},
				{from: ptr("Applied"), to: "Interview", note: "Coding challenge passed.", changedAt: day(16)},
			},
		},
		// ── Wave 2: extra for pagination testing (need >12 total) ─────────────
		{
			company: "Stripe", role: "Backend Engineer",
			location: "San Francisco, CA", source: "LinkedIn",
			notes:       "Applied to payments infrastructure team.",
			dateApplied: day(15),
			transitions: []transition{
				{from: nil, to: "Applied", changedAt: day(15)},
			},
		},
		{
			company: "Shopify", role: "Rails Developer",
			location: "Ottawa, Canada", source: "Company Site",
			dateApplied: day(17),
			transitions: []transition{
				{from: nil, to: "Applied", changedAt: day(17)},
				{from: ptr("Applied"), to: "Rejected", note: "Position filled internally.", changedAt: day(22)},
			},
		},
		{
			company: "Figma", role: "Frontend Engineer",
			location: "San Francisco, CA", source: "Glassdoor",
			notes:       "Strong design background — good fit.",
			dateApplied: day(19),
			transitions: []transition{
				{from: nil, to: "Applied", changedAt: day(19)},
				{from: ptr("Applied"), to: "Interview", note: "Design system discussion.", changedAt: day(24)},
				{from: ptr("Interview"), to: "Offer", note: "Competitive offer received.", changedAt: day(30)},
			},
		},
		{
			company: "Notion", role: "Product Engineer",
			location: "San Francisco, CA", source: "LinkedIn",
			dateApplied: day(20),
			transitions: []transition{
				{from: nil, to: "Applied", changedAt: day(20)},
			},
		},
		{
			company: "Vercel", role: "DevRel Engineer",
			location: "Remote", source: "Twitter/X",
			notes:       "Found via @vercel tweet about openings.",
			dateApplied: day(21),
			transitions: []transition{
				{from: nil, to: "Applied", changedAt: day(21)},
			},
		},
		{
			company: "Linear", role: "Software Engineer",
			location: "Remote", source: "Company Site",
			dateApplied: day(22),
			transitions: []transition{
				{from: nil, to: "Applied", changedAt: day(22)},
				{from: ptr("Applied"), to: "Interview", note: "Culture fit call.", changedAt: day(26)},
			},
		},
		{
			company: "Canva", role: "Senior Frontend Engineer",
			location: "Sydney, Australia", source: "Indeed",
			dateApplied: day(23),
			transitions: []transition{
				{from: nil, to: "Applied", changedAt: day(23)},
			},
		},
		{
			company: "Datadog", role: "Backend Engineer",
			location: "New York, NY", source: "Referral",
			notes:       "Referred by a college friend working there.",
			dateApplied: day(25),
			transitions: []transition{
				{from: nil, to: "Applied", changedAt: day(25)},
				{from: ptr("Applied"), to: "Rejected", note: "Went with internal candidate.", changedAt: day(30)},
			},
		},
		{
			company: "Anthropic", role: "Software Engineer",
			location: "San Francisco, CA", source: "Company Site",
			notes:       "Dream job application.",
			dateApplied: day(26),
			transitions: []transition{
				{from: nil, to: "Applied", changedAt: day(26)},
			},
		},
		{
			company: "OpenAI", role: "Research Engineer",
			location: "San Francisco, CA", source: "LinkedIn",
			dateApplied: day(27),
			transitions: []transition{
				{from: nil, to: "Applied", changedAt: day(27)},
				{from: ptr("Applied"), to: "Interview", note: "Technical assessment scheduled.", changedAt: day(32)},
			},
		},
		{
			company: "Cloudflare", role: "Network Engineer",
			location: "Austin, TX", source: "Glassdoor",
			dateApplied: day(28),
			transitions: []transition{
				{from: nil, to: "Applied", changedAt: day(28)},
			},
		},
		{
			company: "HashiCorp", role: "Go Engineer",
			location: "Remote", source: "LinkedIn",
			notes:       "Infrastructure tooling role — strong match.",
			dateApplied: day(29),
			transitions: []transition{
				{from: nil, to: "Applied", changedAt: day(29)},
			},
		},
		{
			company: "PlanetScale", role: "Database Engineer",
			location: "Remote", source: "Company Site",
			dateApplied: day(30),
			transitions: []transition{
				{from: nil, to: "Applied", changedAt: day(30)},
				{from: ptr("Applied"), to: "Interview", note: "System design round.", changedAt: day(35)},
				{from: ptr("Interview"), to: "Offer", note: "Great offer with equity.", changedAt: day(40)},
			},
		},
		{
			company: "Supabase", role: "Fullstack Engineer",
			location: "Remote", source: "Twitter/X",
			notes:       "Open source first culture.",
			dateApplied: day(31),
			transitions: []transition{
				{from: nil, to: "Applied", changedAt: day(31)},
			},
		},
		{
			company: "Railway", role: "Infrastructure Engineer",
			location: "Remote", source: "Company Site",
			dateApplied: day(32),
			transitions: []transition{
				{from: nil, to: "Applied", changedAt: day(32)},
				{from: ptr("Applied"), to: "Rejected", note: "Role cancelled.", changedAt: day(36)},
			},
		},
		{
			company: "Resend", role: "Developer Advocate",
			location: "Remote", source: "LinkedIn",
			dateApplied: day(33),
			transitions: []transition{
				{from: nil, to: "Applied", changedAt: day(33)},
			},
		},
	}

	inserted := 0
	for _, a := range apps {
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
				slog.Error("seed: failed to create history", "company", a.company, "error", err)
				os.Exit(1)
			}
		}
		slog.Info("seed: created application", "company", a.company, "status", finalStatus)
		inserted++
	}

	slog.Info("seed: done", "email", demoEmail, "password", demoPassword, "inserted", inserted)
}
