package config

import (
	"log"
	"time"

	"github.com/kelseyhightower/envconfig"
)

// Config holds all application configuration. All required fields panic on startup if missing.
type Config struct {
	Port      string        `envconfig:"PORT" required:"true"`
	DBDSN     string        `envconfig:"DB_DSN" required:"true"`
	RedisAddr string        `envconfig:"REDIS_ADDR" required:"true"`
	JWTSecret string        `envconfig:"JWT_SECRET" required:"true"`
	JWTExpiry time.Duration `envconfig:"JWT_EXPIRY" default:"24h"`
}

// Load reads environment variables and panics if any required field is missing.
func Load() *Config {
	var cfg Config
	if err := envconfig.Process("", &cfg); err != nil {
		log.Fatalf("config: missing required env vars: %v", err)
	}
	if len(cfg.JWTSecret) < 32 {
		log.Fatal("config: JWT_SECRET must be at least 32 characters")
	}
	return &cfg
}
