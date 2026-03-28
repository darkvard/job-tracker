package valueobject

// Source represents where the job listing was found.
type Source string

const (
	SourceLinkedIn    Source = "LinkedIn"
	SourceCompanySite Source = "Company Site"
	SourceReferral    Source = "Referral"
	SourceIndeed      Source = "Indeed"
	SourceGlassdoor   Source = "Glassdoor"
	SourceOther       Source = "Other"
)

// IsValid reports whether s is a recognised Source value.
func (s Source) IsValid() bool {
	switch s {
	case SourceLinkedIn, SourceCompanySite, SourceReferral,
		SourceIndeed, SourceGlassdoor, SourceOther:
		return true
	}
	return false
}

func (s Source) String() string { return string(s) }
