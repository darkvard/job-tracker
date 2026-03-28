# Skill: Testing Strategy

## Layer rules
| Layer | Type | DB | Notes |
|-------|------|----|-------|
| `domain/` | Unit | None | stdlib only, zero external imports |
| `application/` | Unit | mockery mocks | `go generate ./...` regenerates |
| `infrastructure/persistence/` | Integration | testcontainers (real PG) | shared container per suite |
| `infrastructure/http/` | Integration | httptest | full stack |
| E2E | Smoke | live server | `tests/e2e/` |

## Shared testcontainer (1 per suite — NOT 1 per test)
```go
// tests/integration/main_test.go
var testDB *gorm.DB

func TestMain(m *testing.M) {
    ctx := context.Background()
    pgC, err := postgres.Run(ctx, "postgres:15",
        postgres.WithDatabase("testdb"), postgres.WithUsername("postgres"), postgres.WithPassword("postgres"),
        testcontainers.WithWaitStrategy(wait.ForListeningPort("5432/tcp")),
    )
    if err != nil { log.Fatal(err) }
    defer pgC.Terminate(ctx)
    dsn, _ := pgC.ConnectionString(ctx, "sslmode=disable")
    testDB, _ = gorm.Open(gormpg.Open(dsn))
    testDB.AutoMigrate(&models.ApplicationModel{}, &models.StatusHistoryModel{}, &models.UserModel{})
    os.Exit(m.Run())
}
```

## mockery unit test pattern
```go
func TestCreateUseCase_Execute(t *testing.T) {
    repo := mocks.NewApplicationRepository(t)
    repo.On("Create", mock.Anything, mock.AnythingOfType("*entity.Application")).Return(nil)
    uc := job.NewCreate(repo)
    resp, err := uc.Execute(context.Background(), job.CreateRequest{
        UserID: 1, Company: "Google", Role: "SDE", Status: "Applied", Source: "LinkedIn",
    })
    require.NoError(t, err)
    assert.Equal(t, "Google", resp.Company)
    repo.AssertExpectations(t)
}
```

## Run commands
```bash
make test              # all (unit + integration via testcontainers)
make test-integration  # integration only
make test-e2e          # E2E (live server required)
make test-ui           # health check + frontend build
```
