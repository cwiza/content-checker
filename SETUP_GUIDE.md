# Content Checker Setup Guide

## ✅ Setup Complete!

You now have automated content validation ready to use. Here's what to do next:

## Step 1: Commit the GitHub Actions Files

```bash
git add .github/
git commit -m "Add automated content validation"
git push
```

## Step 2: Test Locally

Validate a single file:
```bash
node .github/scripts/validate-file.js testcontent
```

## Step 3: Create a Test PR

1. Create a new branch:
   ```bash
   git checkout -b test-content-validation
   ```

2. Make a change to a markdown/text file (introduce an error):
   ```bash
   echo "Mr. Jones said he would recieve the package. TODO: fix this" > test-content.md
   git add test-content.md
   git commit -m "Test content validation"
   git push -u origin test-content-validation
   ```

3. Go to GitHub and create a PR from this branch

4. Watch the "Content Validation" check run automatically!

## Step 4: Configure Branch Protection (Optional)

1. Go to your repo on GitHub
2. Settings → Branches → Add rule
3. Branch name pattern: `main`
4. Check: "Require status checks to pass before merging"
5. Search for and select: "validate-content"
6. Save

Now PRs with content errors can't be merged!

## What Happens on Each PR:

✅ **Automatically runs** when PR is opened/updated  
✅ **Validates** all changed .md, .txt, .json, .yml files  
✅ **Posts comment** on PR with all issues found  
✅ **Creates GitHub issues** for critical/high severity problems  
✅ **Fails CI check** if critical issues exist (blocks merge)  

## Example PR Comment You'll See:

```markdown
## 🔍 Content Validation Report

**Total Issues:** 5

### 🔴 CRITICAL (1)
- **testcontent:1** - Honorific detected: Mr.. Remove for inclusivity.
  - 💡 Suggestion: Use first name or full name without honorific

### 🟡 HIGH (4)
- **testcontent:1** - Possible spelling error: "recieve"
  - 💡 Suggestion: Did you mean "receive"?
- **testcontent:2** - Placeholder text detected: TODO
  - 💡 Suggestion: Replace with actual content
```

## Customizing Rules

Edit `.github/scripts/validate-file.js` to:
- Add more spelling words
- Add custom validation rules
- Change severity levels
- Adjust which file types to validate

## Pre-commit Hook (Optional)

The pre-commit hook is already installed! It will run validation before each commit.

To bypass it (not recommended):
```bash
git commit --no-verify
```

## Troubleshooting

**GitHub Action not running?**
- Make sure workflow file is in `.github/workflows/`
- Check the Actions tab in your GitHub repo

**Want to test the workflow locally?**
```bash
# Simulate what GitHub Actions will do
PR_NUMBER=123 node .github/scripts/validate-pr.js
```

## Next Steps

1. ✅ Commit and push the `.github/` folder
2. ✅ Create a test PR to see it in action
3. ✅ Configure branch protection rules
4. ✅ Customize validation rules for your needs

Happy validating! 🎉
