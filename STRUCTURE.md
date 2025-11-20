# Project Structure

This VS Code extension is designed for automated content validation in Pull Requests with auto-fix capabilities.

## Directory Organization

```
contentchecker/
├── .vscode/                      # VS Code workspace settings
│   ├── extensions.json          # Recommended extensions
│   ├── launch.json              # Debug configurations
│   ├── settings.json            # Workspace settings
│   └── tasks.json               # Build tasks
├── src/
│   ├── extension.ts             # Main extension entry point
│   │                            # - Registers all commands
│   │                            # - Handles extension activation
│   │                            # - Manages configuration
│   ├── github/
│   │   ├── githubApi.ts        # GitHub API client
│   │   │                        # - REST API wrapper
│   │   │                        # - Authentication handling
│   │   │                        # - PR file operations
│   │   │                        # - Comment/issue creation
│   │   └── prAnalyzer.ts       # PR analysis orchestrator
│   │                            # - Coordinates validation workflow
│   │                            # - Manages auto-fix application
│   │                            # - Generates reports
│   ├── validation/
│   │   └── contentValidator.ts  # Content validation engine
│   │                            # - Spelling check
│   │                            # - Grammar validation
│   │                            # - Pattern detection
│   │                            # - Rule management
│   ├── agents/
│   │   └── autoFixAgent.ts     # Auto-fix strategies
│   │                            # - Fix algorithms
│   │                            # - Interactive fixes
│   │                            # - Preview generation
│   └── test/
│       └── extension.test.ts    # Unit tests
├── dist/                        # Compiled output (generated)
├── out/                         # Test compilation output (generated)
├── node_modules/                # Dependencies (generated)
├── package.json                 # Extension manifest
├── tsconfig.json                # TypeScript configuration
├── eslint.config.mjs            # Linting rules
├── esbuild.js                   # Build configuration
├── .env.example                 # Environment template
├── .gitignore                   # Git ignore rules
├── CHANGELOG.md                 # Version history
└── README.md                    # Documentation
```

## Module Responsibilities

### extension.ts
Main extension file that:
- Registers VS Code commands
- Initializes the analyzer
- Handles user interactions
- Manages configuration settings

### github/githubApi.ts
Low-level GitHub API client:
- Authenticates requests
- Fetches PR data and files
- Creates comments and issues
- Updates file content

### github/prAnalyzer.ts
High-level PR analysis:
- Orchestrates the validation workflow
- Applies fixes to PR branches
- Generates summary reports
- Filters text files for analysis

### validation/contentValidator.ts
Content validation rules:
- Implements validation algorithms
- Manages rule lifecycle
- Configurable severity levels
- Custom dictionary support

### agents/autoFixAgent.ts
Automatic fix strategies:
- Pattern-based fixes
- Interactive fix workflow
- Preview capabilities
- Fix history tracking

## Data Flow

1. **User triggers command** → extension.ts
2. **Initialize analyzer** → prAnalyzer.ts
3. **Fetch PR data** → githubApi.ts
4. **Validate content** → contentValidator.ts
5. **Apply fixes** → autoFixAgent.ts
6. **Commit changes** → githubApi.ts
7. **Create comments** → githubApi.ts
8. **Display results** → extension.ts

## Extension Points

### Commands
- `content-checker.validatePR` - Validate PR content
- `content-checker.validateAndFixPR` - Validate and auto-fix
- `content-checker.validateFile` - Check current file
- `content-checker.previewFixes` - Preview auto-fixes
- `content-checker.configure` - Set up GitHub

### Configuration
- `contentChecker.githubToken` - API authentication
- `contentChecker.githubOwner` - Repository owner
- `contentChecker.githubRepo` - Repository name
- `contentChecker.customDictionary` - Custom words
- `contentChecker.autoFixOnSave` - Auto-fix on save
- `contentChecker.enabledRules` - Active validation rules

## Build Process

1. TypeScript compilation (`tsc`)
2. Type checking
3. ESLint validation
4. esbuild bundling
5. Output to `dist/extension.js`

## Testing

- Unit tests in `src/test/`
- Run with `npm test`
- Debug with F5 in Extension Development Host

## Adding New Features

### New Validation Rule
1. Add to `contentValidator.ts` in `initializeRules()`
2. Implement check function
3. Define severity level
4. Update documentation

### New Auto-fix Strategy
1. Add to `autoFixAgent.ts` in `initializeStrategies()`
2. Implement `canFix()` and `apply()`
3. Test with preview mode
4. Update documentation

### New Command
1. Register in `extension.ts` `activate()`
2. Add to `package.json` contributes.commands
3. Implement handler function
4. Update README

## Dependencies

### Runtime
- `vscode` - VS Code API

### Development
- `typescript` - Language support
- `esbuild` - Bundler
- `eslint` - Linter
- `@types/node` - Node.js types
- `@types/vscode` - VS Code types

## Security Considerations

- GitHub tokens stored in VS Code settings (encrypted)
- Never log or display tokens
- Use minimal required API scopes
- Validate all user inputs
- Sanitize file paths
