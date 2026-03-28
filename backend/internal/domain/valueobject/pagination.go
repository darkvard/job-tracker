package valueobject

// PageRequest holds pagination and sorting parameters from the caller.
type PageRequest struct {
	Page   int    // 1-based
	Size   int    // items per page
	SortBy string // column name
	Order  string // "asc" or "desc"
}

// PageResponse is a generic paginated result.
type PageResponse[T any] struct {
	Items      []T
	Total      int64
	Page       int
	Size       int
	TotalPages int
}

// NewPageResponse builds a PageResponse from a slice of items and total count.
func NewPageResponse[T any](items []T, total int64, page, size int) PageResponse[T] {
	totalPages := 0
	if size > 0 {
		totalPages = int((total + int64(size) - 1) / int64(size))
	}
	return PageResponse[T]{
		Items:      items,
		Total:      total,
		Page:       page,
		Size:       size,
		TotalPages: totalPages,
	}
}
