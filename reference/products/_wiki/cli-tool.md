# CLI Tool — Reference Wiki

**Reference product**: [gh-cli](../gh-cli/) (GitHub's official command-line interface)

---

## Common Features

### Core Commands (36 top-level command groups)
- **repo**: create, clone, fork, view, archive, rename, delete, sync, set-default
- **issue**: create, list, view, close, reopen, edit, comment, delete, pin, transfer, develop
- **pr**: create, list, view, checkout, merge, close, reopen, edit, comment, diff, checks, ready, review
- **release**: create, list, view, edit, delete, upload, download
- **actions/run/workflow**: list, view, watch, rerun, cancel, download artifacts
- **codespace**: create, list, ssh, code, ports, stop, delete, logs, cp, rebuild, view
- **project**: create, list, view, edit, close, delete, field-list, item-list, mark-template
- **gist**: create, list, view, edit, delete, clone, rename
- **search**: repos, issues, prs, commits, code
- **api**: raw REST/GraphQL API access with `--jq` and `--template` output processing

### Authentication & Configuration
- **auth**: login, logout, status, token, switch, setup-git (multi-account support)
- **config**: get, set, list, clear-cache (per-host configuration)
- **ssh-key / gpg-key**: list, add, delete
- **attestation**: verify binary provenance (Sigstore)

### Extensibility
- **extension**: install, list, create, remove, upgrade, exec, browse (community extensions)
- **alias**: set, list, delete, import (custom command shortcuts)
- **copilot**: GitHub Copilot CLI integration
- **agent-task**: AI agent task management

### Output Modes
- **Table output**: human-readable terminal tables with TTY detection
- **JSON output**: `--json` flag with `--jq` filtering and `--template` Go templates
- **Markdown rendering**: glamour-powered rich markdown in terminal
- **Pager support**: automatic piping to configured pager for long output

---

## Tech Stack Patterns

### Language & Build
| Layer | Technology |
|-------|-----------|
| Language | Go 1.26 |
| Build | `make` (Unix) / `go run script/build.go` (Windows) |
| Release | GoReleaser (`.goreleaser.yml`) |
| Linting | golangci-lint |

### Core Libraries
| Library | Purpose |
|---------|---------|
| `spf13/cobra` | Command framework (flags, subcommands, help text) |
| `spf13/pflag` | POSIX-compliant flag parsing |
| `AlecAivazis/survey` | Interactive prompts (legacy) |
| `charm.land/huh` | Modern form-based prompts (Charm ecosystem) |
| `charm.land/bubbletea` | TUI framework for interactive views |
| `charm.land/lipgloss` | Terminal styling and layout |
| `charmbracelet/glamour` | Markdown rendering in terminal |
| `shurcooL/githubv4` | GitHub GraphQL v4 API client |
| `google/go-containerregistry` | Container/OCI operations |
| `gorilla/websocket` | WebSocket connections (codespaces) |
| `stretchr/testify` | Test assertions |
| `gopkg.in/h2non/gock` | HTTP mocking |

### API Layer
| Pattern | Implementation |
|---------|---------------|
| REST client | `api/` package with `client.REST()` |
| GraphQL client | `api/` package with `client.GraphQL()` |
| HTTP mocking | `pkg/httpmock/` with registry-based stub matching |
| Host resolution | `cfg.Authentication().DefaultHost()` (supports GHES) |
| Feature detection | `internal/featuredetection/` for GitHub.com vs GHES capabilities |

### Auth & Security
- **OAuth device flow**: browser-based auth via `cli/oauth`
- **Token storage**: OS keyring via `zalando/go-keyring` (macOS Keychain, Windows Credential Manager, Linux Secret Service)
- **Multi-account**: per-host token storage with account switching
- **Binary attestation**: Sigstore-based provenance verification

---

## File Structure Conventions

```
gh-cli/
├── cmd/
│   └── gh/
│       └── main.go             # Entry point → internal/ghcmd.Main()
├── pkg/
│   ├── cmd/                    # Command implementations (36 groups)
│   │   ├── root/               # Root command wiring (NewCmdRoot)
│   │   ├── factory/            # Factory pattern (default.go)
│   │   ├── issue/
│   │   │   ├── list/
│   │   │   │   ├── list.go     # Command definition + Options struct
│   │   │   │   ├── list_test.go
│   │   │   │   ├── http.go     # API calls
│   │   │   │   └── http_test.go
│   │   │   ├── create/
│   │   │   └── view/
│   │   ├── pr/
│   │   ├── repo/
│   │   └── ...                 # 36 command groups total
│   ├── cmdutil/                # Factory, error types, flag helpers
│   ├── iostreams/              # I/O abstraction (TTY, color, pager)
│   ├── httpmock/               # HTTP mock registry for tests
│   ├── markdown/               # Markdown rendering utilities
│   ├── search/                 # Search query builder
│   └── ssh/                    # SSH key operations
├── api/                        # GitHub API client (REST + GraphQL)
├── internal/
│   ├── ghcmd/                  # Main command orchestration
│   ├── config/                 # Config file management + migrations
│   ├── authflow/               # OAuth device flow
│   ├── browser/                # OS browser launch
│   ├── featuredetection/       # GHES capability detection
│   ├── tableprinter/           # Table output formatting
│   ├── prompter/               # Interactive prompt abstractions
│   ├── agents/                 # AI agent detection
│   ├── codespaces/             # Codespace management
│   └── text/                   # Text formatting utilities
├── acceptance/                 # Acceptance/integration tests
│   ├── acceptance_test.go
│   └── testdata/
├── test/                       # Test helpers and shared fixtures
├── docs/                       # Documentation and install guides
├── build/                      # Build scripts and metadata
├── script/                     # Development scripts
├── go.mod                      # Go module definition
├── go.sum                      # Dependency checksums
└── Makefile                    # Build, test, lint targets
```

### The Options + Factory Pattern (Core Convention)

Every command follows this exact structure:

```go
// 1. Options struct — all inputs and dependencies
type ListOptions struct {
    IO         *iostreams.IOStreams
    HttpClient func() (*http.Client, error)
    BaseRepo   func() (ghrepo.Interface, error)
    // flags
    State  string
    Labels []string
}

// 2. Constructor — cobra command with Factory injection
func NewCmdList(f *cmdutil.Factory, runF func(*ListOptions) error) *cobra.Command {
    opts := &ListOptions{}
    cmd := &cobra.Command{
        RunE: func(cmd *cobra.Command, args []string) error {
            // Lazy-init BaseRepo here, not in constructor
            opts.BaseRepo = f.BaseRepo
            if runF != nil {
                return runF(opts)  // Test injection point
            }
            return listRun(opts)
        },
    }
    return cmd
}

// 3. Run function — business logic
func listRun(opts *ListOptions) error { ... }
```

### Naming Conventions
- **Command files**: `{verb}.go` (e.g., `list.go`, `create.go`, `view.go`)
- **HTTP files**: `http.go` alongside command files for API calls
- **Test files**: `{source}_test.go` (Go convention, colocated)
- **Mock files**: `{interface}_mock.go` (generated by `moq`)
- **Directories**: lowercase, match command names exactly

---

## Testing Patterns

### Test Framework
| Type | Framework | Count |
|------|-----------|-------|
| Unit | Go testing + testify | ~319 test files |
| Acceptance | Go testing (build tag: `acceptance`) | 1 suite with testdata |
| HTTP mocking | `pkg/httpmock` (custom registry) | Built-in |
| Mock generation | `moq` (interface mocks) | `//go:generate moq` directives |

### Test Commands
```bash
go test ./...                                    # All unit tests
go test ./pkg/cmd/issue/list/... -run TestName   # Single test
go test -tags acceptance ./acceptance            # Acceptance tests
make lint                                        # golangci-lint
```

### Testing Conventions

**Table-driven tests** — the primary pattern for commands with multiple scenarios:
```go
tests := []struct {
    name       string
    opts       *ListOptions
    httpStubs  func(*httpmock.Registry)
    wantOut    string
    wantErrMsg string
}{
    {name: "with labels filter", ...},
    {name: "no results", ...},
}
for _, tt := range tests {
    t.Run(tt.name, func(t *testing.T) { ... })
}
```

**HTTP mocking with verification** — every stub must be consumed:
```go
reg := &httpmock.Registry{}
defer reg.Verify(t)  // Fails if any registered stub wasn't called

reg.Register(
    httpmock.REST("GET", "repos/OWNER/REPO/issues"),
    httpmock.JSONResponse(issueListPayload),
)
reg.Register(
    httpmock.GraphQL(`query IssueList\b`),
    httpmock.FileResponse("./fixtures/issueList.json"),
)
```

**IOStreams test isolation** — simulated terminal for output testing:
```go
ios, stdin, stdout, stderr := iostreams.Test()
ios.SetStdoutTTY(true)   // Simulate interactive terminal
ios.SetStdinTTY(true)
// After command runs:
assert.Equal(t, expectedOutput, stdout.String())
```

**Factory injection for testability** — commands accept `runF` parameter:
```go
// In test: inject run function to capture options
var gotOpts *ListOptions
cmd := NewCmdList(factory, func(opts *ListOptions) error {
    gotOpts = opts
    return nil
})
```

### Testing Anti-Patterns
- Don't use `assert` for error checks — use `require` to halt immediately on failure
- Don't forget `defer reg.Verify(t)` — unverified stubs hide API call bugs
- Don't test TTY and non-TTY output in the same test case — split them
- Don't reach for acceptance tests when unit tests suffice — acceptance tests are slow and require a real `gh` binary

### Key Differences from Web App Testing
- **No browser**: all testing is stdout/stderr assertion-based
- **Colocated tests**: `_test.go` files sit next to source, not in separate dirs
- **Build tags**: acceptance tests use `-tags acceptance` to avoid running in `go test ./...`
- **No mocking framework**: custom `httpmock` package instead of generic mock libraries
- **Fixtures as JSON files**: `./fixtures/*.json` for complex API responses
