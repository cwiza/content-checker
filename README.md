# Content Checker - VS Code Extension

A powerful VS Code extension for automated content validation in Pull Requests. It detects spelling errors, grammar issues, inappropriate content, and can automatically fix many common problems.

## Features

### 🔍 Comprehensive Content Validation
- **Spelling Check** - Detects common misspellings with suggestions
- **Grammar Check** - Identifies grammar mistakes (your/you're, could of/could have, etc.)
- **Honorifics Detection** - Flags titles like Mr., Mrs., Dr. for inclusive content
- **Placeholder Detection** - Finds lorem ipsum, TODO, TBD, and other placeholder text
- **Long Button Text** - Ensures UI button text stays concise (≤3 words)
- **Plural Consistency** - Detects inconsistent singular/plural usage
- **Capitalization** - Checks proper sentence capitalization
- **Inappropriate Content** - Filters unprofessional language

### 🤖 Automatic Fixes
- Auto-correct spelling errors
- Fix grammar mistakes
- Remove honorifics
- Capitalize sentences properly
- Interactive fix mode with preview

### 📝 GitHub Integration
- Validate entire Pull Requests
- Create inline PR review comments
- Generate GitHub issues for critical problems
- Apply fixes directly to PR branches
- Batch processing of changed files

## Installation

1. Clone this repository
2. Run `npm install`
3. Press `F5` to launch the extension in debug mode
4. Configure GitHub settings

## Setup

### GitHub Personal Access Token

1. Go to GitHub Settings → Developer settings → Personal access tokens
2. Generate a new token with these scopes:
   - `repo` (full control)
   - `read:org` (optional, for organization repos)
3. Copy the token (starts with `ghp_`)

### Configure Extension

1. Open Command Palette (`Cmd+Shift+P` on macOS, `Ctrl+Shift+P` on Windows/Linux)
2. Run: `Content Checker: Configure GitHub Settings`
3. Enter:
   - GitHub Personal Access Token
   - Repository Owner (e.g., `microsoft`)
   - Repository Name (e.g., `vscode`)

Settings are saved to your workspace configuration.

## Usage

### Validate a Pull Request

1. Open Command Palette
2. Run: `Content Checker: Validate Pull Request`
3. Enter PR number (e.g., `123`)
4. Choose options:
   - Create PR comments? (Yes/No)
   - Create GitHub issues? (Yes/No)

### Validate and Auto-fix a PR

1. Open Command Palette
2. Run: `Content Checker: Validate and Auto-fix Pull Request`
3. Enter PR number
4. Extension will automatically:
   - Detect all issues
   - Apply fixes for auto-fixable issues
   - Commit changes to the PR branch
   - Create comments for remaining issues

### Validate Current File

1. Open any text file in VS Code
2. Open Command Palette
3. Run: `Content Checker: Validate Current File`
4. View results in the Output panel

### Preview Auto-fixes

1. Open a file with content issues
2. Run: `Content Checker: Preview Auto-fixes`
3. See original vs. fixed text in the Output panel

## Extension Settings

This extension contributes the following settings:

* `contentChecker.githubToken`: GitHub Personal Access Token for API access
* `contentChecker.githubOwner`: GitHub repository owner/organization
* `contentChecker.githubRepo`: GitHub repository name
* `contentChecker.customDictionary`: Custom words to ignore in spell checking
* `contentChecker.autoFixOnSave`: Automatically fix content issues on save
* `contentChecker.enabledRules`: List of enabled validation rules

### Example Configuration

```json
{
  "contentChecker.githubToken": "ghp_your_token_here",
  "contentChecker.githubOwner": "your-org",
  "contentChecker.githubRepo": "your-repo",
  "contentChecker.customDictionary": ["API", "GitHub", "TypeScript"],
  "contentChecker.autoFixOnSave": false,
  "contentChecker.enabledRules": [
    "spelling",
    "honorifics",
    "placeholder",
    "grammar",
    "capitalization"
  ]
}
```

## Validation Rules

### Severity Levels

- 🔴 **Critical** - Must be fixed (honorifics, inappropriate content)
- 🟡 **High** - Should be fixed (spelling, placeholder text)
- 🔵 **Medium** - Consider fixing (long button text, grammar)
- 🟠 **Low** - Nice to fix (capitalization, plural consistency)

### Rule Types

| Rule | Auto-fixable | Description |
|------|-------------|-------------|
| Spelling | ✅ Yes | Common misspellings |
| Honorifics | ✅ Yes | Mr., Mrs., Dr., etc. |
| Placeholder | ❌ No | Lorem ipsum, TODO, TBD |
| Long Text | ❌ No | Button text > 3 words |
| Plural Consistency | ❌ No | Inconsistent singular/plural |
| Capitalization | ✅ Yes | Sentence capitalization |
| Grammar | ✅ Yes | Common grammar mistakes |
| Inappropriate | ❌ No | Unprofessional language |

## Commands

| Command | Description |
|---------|-------------|
| `Content Checker: Validate Pull Request` | Analyze PR content and create comments |
| `Content Checker: Validate and Auto-fix Pull Request` | Analyze and auto-fix PR content |
| `Content Checker: Validate Current File` | Check active file for issues |
| `Content Checker: Preview Auto-fixes` | Preview fixes without applying |
| `Content Checker: Configure GitHub Settings` | Set up GitHub credentials |

## Architecture

```
content-checker/
├── src/
│   ├── extension.ts              # Main extension entry point
│   ├── github/
│   │   ├── githubApi.ts         # GitHub API client
│   │   └── prAnalyzer.ts        # PR analysis orchestrator
│   ├── validation/
│   │   └── contentValidator.ts  # Content validation rules
│   └── agents/
│       └── autoFixAgent.ts      # Auto-fix strategies
├── package.json                  # Extension manifest
└── README.md                     # This file
```

## Inspired By

This extension was inspired by [figma-content-scraper](https://github.com/cwiza/figma-content-scraper) and follows similar patterns for content analysis and validation.

## Security

- Never commit `.env` files or tokens
- Store GitHub token in VS Code settings (encrypted)
- Use fine-grained personal access tokens with minimal scopes
- Rotate tokens regularly

## Release Notes

### 0.0.1

Initial release with:
- Content validation for PRs
- Auto-fix capabilities
- GitHub integration
- Multiple validation rules

## Contributing

Issues and pull requests welcome! This tool is useful for:
- Content writers and editors
- UX writers auditing consistency
- Development teams ensuring quality
- Accessibility teams checking clarity
- Localization teams preparing translations

## Roadmap

- [ ] Azure OpenAI integration for advanced content analysis
- [ ] Custom rule creation UI
- [ ] Bulk PR validation
- [ ] Integration with CI/CD pipelines
- [ ] Support for more file types
- [ ] Advanced grammar checking with LLMs
- [ ] Content style guide enforcement
- [ ] Terminology consistency checking

## License

MIT

---

**Enjoy better content quality!**
