# Content Checker

Automated content validation for GitHub Pull Requests via GitHub Actions. Detects spelling errors, grammar issues, honorifics, and placeholder text in your documentation and content files.

## Features

- ✅ **Spell checking** - 120+ common misspellings (teh→the, recieve→receive, wierd→weird, etc.)
- ✅ **Spacing errors** - Catches "e mail"→email, "web site"→website, "data base"→database
- ✅ **Grammar validation** - "should of" → "should have", "could of" → "could have"
- ✅ **Honorific detection** - Flags Mr., Mrs., Ms., Dr., Prof., Sr., Jr. for inclusive content
- ✅ **Placeholder detection** - Finds TODO, FIXME, TBD, lorem ipsum, [brackets], {{mustache}}
- ✅ **Capitalization check** - Ensures sentences start with capital letters
- ✅ **Automatic PR validation** - Runs on every pull request
- ✅ **Issue creation** - Groups problems by file
- ✅ **PR blocking** - Prevents merge until validation passes
- ✅ **Security** - Command injection and path traversal protection

## Setup

### Quick Start

1. Copy `.github/workflows/content-validation.yml` to your repository
2. Copy `.github/scripts/` directory to your repository
3. Create pull requests - validation runs automatically!

### What Happens

1. **PR Created** → Workflow runs automatically
2. **Validation Scans** → Checks all changed `.md`, `.txt`, `.html` files
3. **Issues Created** → One issue per file with problems (grouped)
4. **PR Blocked** → Cannot merge until validation passes
5. **Fix & Push** → Update files, validation runs again
6. **Merge** → Once clean, PR can be merged

See [GITHUB_SETUP.md](GITHUB_SETUP.md) for detailed configuration.

## How It Works

The validation workflow runs automatically on pull requests:

**`.github/workflows/content-validation.yml`**
- Triggers on: `pull_request` events (opened, synchronize, reopened)
- Scans: Changed `.md`, `.txt`, `.html` files
- Validates: Spelling, grammar, honorifics, placeholders
- Creates: GitHub issues with detailed error reports
- Posts: Comment on PR with summary and links to issues

**Validation Rules:**
- **Spelling**: 120+ common misspellings including:
  - Common typos: teh → the, taht → that, thier → their
  - ie/ei confusion: wierd → weird, peice → piece, recieve → receive
  - Double letters: occassion → occasion, embarass → embarrass
  - -ance/-ence: independance → independence, appearence → appearance
  - Compound words: alot → a lot, everytime → every time
- **Spacing errors**:
  - e mail → email
  - web site → website
  - data base → database
  - on line → online
  - And more...
- **Grammar**: 
  - "should of" → "should have"
  - "could of" → "could have"
  - "would of" → "would have"
  - "your welcome" → "you're welcome"
- **Honorifics**: Mr., Mrs., Ms., Dr., Prof., Sr., Jr. (flagged for inclusive content)
- **Placeholders**: 
  - TODO, FIXME, TBD
  - lorem ipsum, dolor sit amet
  - [brackets], {{mustache templates}}
  - placeholder text
  - xxx markers
- **Capitalization**: Sentences must start with capital letters

**Code-Aware:**
- Skips code blocks (```, ~~~)
- Ignores camelCase and kebab-case
- Skips JSON-like structures
- Smart enough to avoid false positives in technical content

## Customization

Edit `.github/scripts/validate-file.js` to customize:

- **Add words to dictionary**: Update `commonMisspellings` object
- **Adjust grammar rules**: Modify `grammarIssues` array  
- **Change honorifics**: Edit `honorifics` array
- **File extensions**: Update workflow `files` filter

## Example Output

When validation finds issues, it creates GitHub issues like:

**Issue Title:** `Validation errors in docs/api.md`

**Issue Body:**
```
Found 15 validation issues:

### Spelling Errors (8)
- Line 12: Possible spelling error: "recieve" - Did you mean "receive"?
- Line 45: Possible spelling error: "teh" - Did you mean "the"?
- Line 67: Possible spelling error: "seperate" - Did you mean "separate"?
- Line 89: Possible spelling error: "definately" - Did you mean "definitely"?
...

### Grammar Issues (3)  
- Line 23: Grammar issue: Should be "should have"
- Line 89: Grammar issue: Should be "could have"
- Line 102: Grammar issue: Should be "you're welcome" (you are)

### Honorifics (2)
- Line 34: Honorific detected: Mr. - Remove for inclusivity
- Line 56: Honorific detected: Dr. - Use first name or full name without honorific

### Placeholders (2)
- Line 78: Placeholder text detected: TODO - Replace with actual content
- Line 91: Placeholder text detected: FIXME - Replace with actual content
```

**PR Comment:**
The workflow also posts a summary comment on your PR with links to all created issues and the validation status.

## Future Ideas

See [BACKLOG.md](BACKLOG.md) for planned features and ideas, including:
- Auto-fix workflow with approval gates
- AI agent integration for sophisticated corrections
- Additional validation rules

## Project Structure

```
.github/
├── workflows/
│   └── content-validation.yml    # Main validation workflow
└── scripts/
    ├── validate-pr.js            # PR validation orchestrator
    ├── validate-file.js          # File validation logic
    └── validate-agent-tool.js    # Tool for AI agents
```

## Security

- ✅ Command injection prevention via filename validation
- ✅ Path traversal protection
- ✅ Authorization checks (OWNER/MEMBER/COLLABORATOR only)
- ✅ No tokens required (uses `GITHUB_TOKEN` automatically)

## Use Cases

- **Documentation teams** - Ensure consistent, error-free docs
- **Content writers** - Catch typos before publication  
- **Open source projects** - Maintain quality across contributors
- **Technical writers** - Validate grammar and style
- **Localization prep** - Clean source content for translation



## License

MIT

---

**Enjoy better content quality!**
