# Setting Up PR Approval Requirements

## Option 1: Branch Protection (Recommended)

This forces **all** PRs (including agent PRs) to require your approval before merging.

### Steps:
1. Go to https://github.com/cwiza/content-checker/settings/branches
2. Click "Add branch protection rule"
3. Branch name pattern: `test-content-validation` (or `main` for production)
4. Enable:
   - ✅ Require a pull request before merging
   - ✅ Require approvals: 1
   - ✅ Require review from Code Owners (optional)
5. Click "Create"

**Result:** 
- Agent creates PR
- PR shows "1 approval required"
- You get notified
- PR cannot merge until you approve

## Option 2: CODEOWNERS File (Specific File Approval)

Require approval for specific files:

Create `.github/CODEOWNERS`:
```
# Require your approval for all markdown files
*.md @cwiza

# Require approval for all files
* @cwiza
```

## Option 3: Slack/Email Notifications

Get notified when PRs are created:

### GitHub Notifications:
1. Go to https://github.com/settings/notifications
2. Enable "Pull requests" notifications
3. Choose Email or Web

### Slack Integration:
1. Install GitHub app in Slack
2. `/github subscribe cwiza/content-checker reviews`
3. Get Slack notification: "PR #123 needs your review"

## Option 4: Require Specific Checks

Add to branch protection:
- ✅ Require status checks to pass
- Select: "content-validation"

This ensures validation passes before PR can be reviewed.

## Testing It

After setting up branch protection:

1. Comment on validation issue: `/fix-content page2test.md`
2. Agent creates PR
3. You see: "🔒 Review required - Changes requested cannot be merged until approved"
4. You click "Review changes" → "Approve"
5. Then click "Merge pull request"

## What You Have Now vs. What's Missing

**Current:**
- ✅ Agent creates PR with fixes
- ✅ You can review the PR
- ✅ You can merge the PR
- ❌ No **requirement** to approve (you could merge without reviewing)
- ❌ No automatic notification that review is needed

**With Branch Protection:**
- ✅ Agent creates PR with fixes
- ✅ **Cannot merge without approval**
- ✅ **Notification sent** to you
- ✅ Shows "Approval required" badge on PR
- ✅ Enforces review process

Want me to create the branch protection rule via API? Or you can do it manually in GitHub settings?
