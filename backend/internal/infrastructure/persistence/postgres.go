package persistence

import (
	"log/slog"
	"time"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

// NewPostgres creates a GORM PostgreSQL connection with a tuned connection pool.
// Panics if the connection cannot be established.
func NewPostgres(dsn string) *gorm.DB {
	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Silent),
	})
	if err != nil {
		panic("persistence: failed to connect to PostgreSQL: " + err.Error())
	}

	sqlDB, err := db.DB()
	if err != nil {
		panic("persistence: failed to get underlying sql.DB: " + err.Error())
	}

	sqlDB.SetMaxOpenConns(25)
	sqlDB.SetMaxIdleConns(10)
	sqlDB.SetConnMaxLifetime(5 * time.Minute)

	slog.Info("persistence: connected to PostgreSQL")

	return db
}
