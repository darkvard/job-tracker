package auth

import (
	"golang.org/x/crypto/bcrypt"
)

// BcryptHasher implements port.PasswordHasher using bcrypt with cost 12.
type BcryptHasher struct{}

// NewBcryptHasher returns a BcryptHasher.
func NewBcryptHasher() *BcryptHasher { return &BcryptHasher{} }

// Hash returns a bcrypt hash of the plaintext password.
func (h *BcryptHasher) Hash(plain string) (string, error) {
	b, err := bcrypt.GenerateFromPassword([]byte(plain), 12)
	if err != nil {
		return "", err
	}
	return string(b), nil
}

// Compare returns nil when plain matches the stored hash.
func (h *BcryptHasher) Compare(hash, plain string) error {
	return bcrypt.CompareHashAndPassword([]byte(hash), []byte(plain))
}
