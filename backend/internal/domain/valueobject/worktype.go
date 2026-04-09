package valueobject

// WorkType represents the work arrangement for a job application.
type WorkType string

const (
	WorkTypeRemote  WorkType = "Remote"
	WorkTypeHybrid  WorkType = "Hybrid"
	WorkTypeOnsite  WorkType = "Onsite"
	WorkTypeUnknown WorkType = ""
)

// IsValid reports whether the WorkType is one of the known non-empty values.
func (w WorkType) IsValid() bool {
	switch w {
	case WorkTypeRemote, WorkTypeHybrid, WorkTypeOnsite:
		return true
	case WorkTypeUnknown:
		return false
	}
	return false
}

// String returns the string representation.
func (w WorkType) String() string { return string(w) }
