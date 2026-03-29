package auth

import (
	"fmt"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

// JWTService implements port.TokenService using HS256.
type JWTService struct {
	secret []byte
	expiry time.Duration
}

// NewJWTService returns a JWTService.
func NewJWTService(secret string, expiry time.Duration) *JWTService {
	return &JWTService{secret: []byte(secret), expiry: expiry}
}

type claims struct {
	Email string `json:"email"`
	jwt.RegisteredClaims
}

// Generate creates a signed HS256 JWT for the given user.
func (s *JWTService) Generate(userID int64, email string) (string, error) {
	now := time.Now()
	c := claims{
		Email: email,
		RegisteredClaims: jwt.RegisteredClaims{
			Subject:   fmt.Sprintf("%d", userID),
			IssuedAt:  jwt.NewNumericDate(now),
			ExpiresAt: jwt.NewNumericDate(now.Add(s.expiry)),
		},
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, c)
	return token.SignedString(s.secret)
}

// Validate parses and verifies a token, returning the embedded claims.
func (s *JWTService) Validate(tokenStr string) (int64, string, error) {
	token, err := jwt.ParseWithClaims(tokenStr, &claims{}, func(t *jwt.Token) (any, error) {
		if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", t.Header["alg"])
		}
		return s.secret, nil
	})
	if err != nil {
		return 0, "", err
	}

	c, ok := token.Claims.(*claims)
	if !ok || !token.Valid {
		return 0, "", fmt.Errorf("invalid token claims")
	}

	var userID int64
	if _, err := fmt.Sscanf(c.Subject, "%d", &userID); err != nil {
		return 0, "", fmt.Errorf("invalid subject: %w", err)
	}

	return userID, c.Email, nil
}
