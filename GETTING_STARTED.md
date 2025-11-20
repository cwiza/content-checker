# Getting Started with Content Checker Extension

This guide will help you get started with developing and using the Content Checker VS Code extension.

## Quick Start

### 1. Install Dependencies
```bash
cd /Volumes/Blaine/contentchecker
npm install
```

### 2. Build the Extension
```bash
npm run compile
```

### 3. Launch Extension Development Host
Press `F5` in VS Code to open a new window with the extension loaded.

### 4. Configure GitHub Settings
In the Extension Development Host:
1. Press `Cmd+Shift+P` (macOS) or `Ctrl+Shift+P` (Windows/Linux)
2. Run: `Content Checker: Configure GitHub Settings`
3. Enter your GitHub token, owner, and repo name

### 5. Test the Extension
Try validating a file:
1. Open any text file
2. Run: `Content Checker: Validate Current File`
3. View results in the Output panel

## Development Workflow

### File Structure Overview
```
src/
├── extension.ts              ← Start here - main entry point
├── github/
│   ├── githubApi.ts         ← GitHub API wrapper
│   └── prAnalyzer.ts        ← PR analysis logic
├── validation/
│   └── contentValidator.ts  ← Validation rules
└── agents/
    └── autoFixAgent.ts      ← Auto-fix strategies
```

### Making Changes

1. **Edit the code** in the `src/` directory
2. **Recompile** with `npm run compile`
3. **Reload** the Extension Development Host:
   - Press `Cmd+R` (macOS) or `Ctrl+R` (Windows/Linux) in the Extension Development Host window
4. **Test** your changes

### Adding a New Validation Rule

1. Open `src/validation/contentValidator.ts`
2. Add your rule in the `initializeRules()` method:

```typescript
{
    name: 'My Custom Rule',
    type: 'my-rule',
    severity: 'medium',
    check: (text, ctx) => this.checkMyRule(text, ctx)
}
```

3. Implement the check method:

```typescript
private checkMyRule(text: string, ctx: ValidationContext): ValidationResult[] {
    const results: ValidationResult[] = [];
    
    // Your validation logic here
    if (/* condition */) {
        results.push({
            message: 'Issue description',
            suggestion: 'How to fix it',
            line: ctx.lineNumber
        });
    }
    
    return results;
}
```

4. Update `package.json` to include the new rule in `enabledRules` enum

### Adding a New Auto-fix Strategy

1. Open `src/agents/autoFixAgent.ts`
2. Add your strategy in `initializeStrategies()`:

```typescript
{
    type: 'my-rule',
    canFix: (issue) => issue.type === 'my-rule',
    apply: (content, issue) => this.fixMyRule(content, issue)
}
```

3. Implement the fix method:

```typescript
private fixMyRule(content: string, issue: ContentIssue): string {
    const lines = content.split('\n');
    const lineIndex = issue.line - 1;
    
    if (lineIndex >= 0 && lineIndex < lines.length) {
        // Apply your fix
        lines[lineIndex] = /* fixed content */;
    }
    
    return lines.join('\n');
}
```

## Testing

### Manual Testing
1. Press `F5` to launch Extension Development Host
2. Test commands via Command Palette
3. Check Output panel for logs

### Automated Testing
```bash
npm test
```

### Test a PR Validation
1. Configure GitHub settings
2. Run: `Content Checker: Validate Pull Request`
3. Enter a PR number from your repository
4. Review the output

## Debugging

### Enable Debug Logging
Add console.log statements in your code:
```typescript
console.log('PR Number:', prNumber);
console.log('Issues found:', issues.length);
```

View logs in:
- **Debug Console** in VS Code
- **Developer Tools**: Help → Toggle Developer Tools

### Common Issues

**Issue**: Extension not activating
- **Fix**: Check that commands are registered in `package.json`

**Issue**: GitHub API errors
- **Fix**: Verify token has correct permissions (`repo` scope)

**Issue**: TypeScript errors
- **Fix**: Run `npm run check-types` to see all type errors

**Issue**: Can't see changes
- **Fix**: Reload Extension Development Host with `Cmd+R`/`Ctrl+R`

## Building for Production

### Create VSIX Package
```bash
npm install -g @vscode/vsce
vsce package
```

This creates `content-checker-0.0.1.vsix` that can be installed in VS Code.

### Install Locally
```bash
code --install-extension content-checker-0.0.1.vsix
```

## Configuration Examples

### For a Specific Repository
```json
{
  "contentChecker.githubOwner": "microsoft",
  "contentChecker.githubRepo": "vscode",
  "contentChecker.customDictionary": ["TypeScript", "ESLint", "webpack"],
  "contentChecker.enabledRules": [
    "spelling",
    "grammar",
    "capitalization"
  ]
}
```

### For Technical Documentation
```json
{
  "contentChecker.customDictionary": [
    "API",
    "CLI",
    "JSON",
    "YAML",
    "Kubernetes",
    "Docker",
    "microservices"
  ],
  "contentChecker.enabledRules": [
    "spelling",
    "placeholder",
    "capitalization"
  ]
}
```

### For UX Writing
```json
{
  "contentChecker.enabledRules": [
    "honorifics",
    "long-text",
    "grammar",
    "inappropriate"
  ],
  "contentChecker.autoFixOnSave": true
}
```

## Next Steps

1. **Read the full README.md** for detailed usage instructions
2. **Review STRUCTURE.md** to understand the architecture
3. **Check out the Figma content scraper** inspiration: https://github.com/cwiza/figma-content-scraper
4. **Add your custom validation rules** based on your needs
5. **Integrate with CI/CD** for automated PR checks

## Getting Help

- Check the **Output panel** for error messages
- Review **STRUCTURE.md** for architecture details
- Look at **src/extension.ts** for command implementations
- Examine **test files** for usage examples

## Contributing

When ready to add features:
1. Create a new branch
2. Implement your changes
3. Add tests
4. Update documentation
5. Submit a pull request

---

Happy coding! 🚀
