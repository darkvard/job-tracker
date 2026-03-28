package port

// TokenService generates and validates JWT tokens.
type TokenService interface {
	// Generate produces a signed token for the given user.
	Generate(userID int64, email string) (string, error)
	// Validate parses and verifies a token, returning the embedded claims.
	Validate(token string) (userID int64, email string, err error)
}
