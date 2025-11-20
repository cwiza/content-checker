# Quick GitHub Setup

## Create GitHub Repository

1. Go to https://github.com/new
2. Repository name: `contentchecker` (or whatever you prefer)
3. Keep it Public or Private (your choice)
4. **DON'T** initialize with README (we already have one)
5. Click "Create repository"

## Connect Your Local Repo

Copy these commands from GitHub's instructions, or use these:

```bash
# Add the remote (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/contentchecker.git

# Push to GitHub
git branch -M main
git push -u origin main
```

## Test It!

Once pushed, create a test PR:

```bash
# Create test branch
git checkout -b test-validation

# Create a file with errors
echo "Mr. Smith said he would recieve the package. TODO: finish this" > test.md

# Commit and push
git add test.md
git commit -m "Test content validation"
git push -u origin test-validation
```

Then go to GitHub and create a Pull Request. You'll see the Content Validation check run automatically!

## What You'll See:

1. **PR Checks tab** - "Content Validation" will appear
2. **PR Comment** - Bot will post all issues found
3. **Issues tab** - New issues created for critical problems
4. **Check fails** - PR blocked from merging (if critical issues)

🎉 Your automated content checker is now live!
