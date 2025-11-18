# Content Checker

Automated content validation for GitHub Pull Requests. Automatically detects spelling errors, grammar mistakes, honorifics, placeholder text, and other content issues - then creates GitHub issues so your team can fix them.

## 🎯 What It Does

Every time someone opens or updates a PR, Content Checker automatically:

1. ✅ **Validates all changed content files** (.md, .txt, .json, .yml)
2. ✅ **Posts a comment** on the PR with all issues found
3. ✅ **Creates GitHub issues** - one per file with problems (grouped by file)
4. ✅ **Blocks merging** if critical issues are found
5. ✅ **Saves time** - no manual content review needed

## 🔍 What It Detects

### Critical Issues 🔴
- **Honorifics** - Mr., Mrs., Dr., Prof. (for inclusive content)

### High Severity 🟡
- **Spelling errors** - receive, definitely, accommodate, government, etc.
- **Placeholder text** - TODO, FIXME, lorem ipsum, [brackets], {{templates}}

### Medium Severity 🔵
- **Grammar mistakes** - could of → could have, your/you're confusion

### Low Severity 🟠
- **Capitalization** - sentences starting with lowercase

## 🚀 Quick Start

### 1. Add to Your Repository

Copy the `.github/` folder to your repository:

```bash
git clone https://github.com/cwiza/content-checker.git
cp -r content-checker/.github your-repo/.github
cd your-repo
git add .github/
git commit -m "Add content validation"
git push
```

### 2. That's It!

The workflow is now active. Create a PR and watch it work automatically.

## 📊 Example Output

When you create a PR, you'll see:

### PR Comment
```markdown
🔍 Content Validation Report

Total Issues: 14

🔴 CRITICAL (3)
- test-content.md:3 - Honorific detected: Mr.
  💡 Use first name or full name without honorific

🟡 HIGH (11)
- test-content.md:3 - Possible spelling error: "recieve"
  💡 Did you mean "receive"?
- test-content.md:5 - Placeholder text detected: TODO
  💡 Replace with actual content
```

### GitHub Issue Created
**Title:** `[Content Validation] test-content.md`

**Body:** Lists all critical/high severity issues in that file with line numbers and suggestions

### CI Check Status
❌ **Content Validation** - Failed (blocks merging until issues are fixed)

## 🎛️ How It Works

### Automatic Validation
- Triggers on: `pull_request` (opened, synchronize, reopened)
- Validates: Files matching `**.md`, `**.txt`, `**.json`, `**.yml`, `**.yaml`
- Runtime: ~5-10 seconds

### Issue Creation
- Creates **one issue per file** with problems
- Groups all problems in that file together
- Labels: `content-validation`, `PR-{number}`
- Only creates issues for critical/high severity problems

### PR Blocking
- Critical issues = Check fails, PR blocked
- Fix issues → check passes → PR can merge

## ⚙️ Configuration

### Customize Rules

Edit `.github/scripts/validate-file.js` to:

**Add more spelling words:**
```javascript
const commonMisspellings = {
    'teh': 'the',
    'recieve': 'receive',
    'your-word': 'correction',  // Add here
    // ...
};
```

**Change severity levels:**
```javascript
{
    name: 'Spelling Check',
    type: 'spelling',
    severity: 'high',  // Change to: critical, high, medium, low
    check: (text, ctx) => this.checkSpelling(text, ctx)
}
```

**Add custom validation rules:**
```javascript
{
    name: 'My Custom Rule',
    type: 'custom',
    severity: 'medium',
    check: (text, ctx) => {
        const results = [];
        if (text.includes('forbidden-word')) {
            results.push({
                message: 'Found forbidden word',
                suggestion: 'Use alternative',
                line: ctx.lineNumber
            });
        }
        return results;
    }
}
```

### Change File Types

Edit `.github/workflows/content-validation.yml`:

```yaml
paths:
  - '**.md'
  - '**.txt'
  - '**.rst'   # Add more extensions
```

### Disable Issue Creation

Remove or comment out the "Create issues for errors" step in `.github/workflows/content-validation.yml`

## 📦 What's Included

```
.github/
├── workflows/
│   ├── content-validation.yml    # Main workflow
│   ├── content-audit.yml          # Weekly audit (optional)
│   └── auto-fix.yml               # Auto-fix trigger (optional)
└── scripts/
    ├── validate-pr.js             # PR validation orchestrator
    ├── validate-file.js           # Single file validator
    └── auto-fix.js                # Auto-fix script (optional)
```

## 🛠️ Optional Features

### Pre-commit Hook (Local Validation)

Add to `.git/hooks/pre-commit`:

```bash
#!/bin/sh
echo "Running content validation..."
node .github/scripts/validate-pr.js || exit 1
```

Make executable: `chmod +x .git/hooks/pre-commit`

### Auto-Fix Workflow

Comment `/fix-content` on any content validation issue to automatically apply spelling/grammar fixes.

Requires: `.github/workflows/auto-fix.yml` (included)

### VS Code Extension

For manual validation while editing:

1. Install from VSIX: `content-checker-0.0.1.vsix`
2. Run command: `Content Checker: Validate Current File`
3. View results in Output panel

### Weekly Content Audit

Automatically scans all content files weekly:

- Enabled by: `.github/workflows/content-audit.yml`
- Schedule: Every Monday at 9am UTC
- Creates summary issue with all problems

## 🎯 Use Cases

Perfect for:

- ✅ **Documentation teams** - Ensure quality across docs
- ✅ **Open source projects** - Maintain consistent content standards
- ✅ **UX writers** - Catch common writing mistakes
- ✅ **Marketing content** - Prevent embarrassing typos
- ✅ **Localization prep** - Clean content before translation
- ✅ **Accessibility** - Remove non-inclusive language

## 🔒 Security & Permissions

The workflow requires these permissions:
- `contents: read` - Read repository files
- `pull-requests: write` - Post comments on PRs
- `issues: write` - Create issues

Uses `GITHUB_TOKEN` automatically - no secrets needed!

## 📈 Branch Protection

Recommended: Require the "Content Validation" check to pass before merging

**Setup:**
1. Go to Settings → Branches
2. Add rule for `main` branch
3. Check "Require status checks to pass"
4. Select "Content Validation"

## 🤝 Contributing

Issues and PRs welcome! Common additions:

- More spelling words
- Additional validation rules
- Language-specific checks
- Integration with external APIs (Grammarly, LanguageTool)

## 📄 License

MIT

## 🙏 Credits

Inspired by [figma-content-scraper](https://github.com/cwiza/figma-content-scraper)

---

**Questions?** Open an issue at https://github.com/cwiza/content-checker/issues
