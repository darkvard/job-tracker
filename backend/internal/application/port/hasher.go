// Package port defines secondary port interfaces for the application layer.
package port

// PasswordHasher hashes and verifies plaintext passwords.
type PasswordHasher interface {
	// Hash returns a hashed representation of the plaintext password.
	Hash(plain string) (string, error)
	// Compare returns nil when plain matches the stored hash, error otherwise.
	Compare(hash, plain string) error
}
