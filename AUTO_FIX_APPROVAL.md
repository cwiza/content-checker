# Auto-fix Content Issues with Approval Flow

This workflow automatically assigns content validation issues to a GitHub Copilot coding agent, creates fixes, and requests your approval.

## How It Works

### 1. Issue Created
When content validation finds issues, a GitHub issue is created with the `content-validation` label.

### 2. Auto-Assignment
The `agent-auto-fix.yml` workflow triggers and:
- Parses the issue to extract filename and error count
- If ≤10 critical+high issues → Assigns to coding agent
- If >10 issues → Labels as `needs-manual-review`

### 3. Agent Creates Fix
The coding agent (triggered by `/fix-content` command):
- Reads the validation issues
- Applies fixes to the file
- Creates a new branch: `auto-fix/{filename}`
- Opens a PR with the fixes

### 4. You Review & Approve
You receive a PR notification:
- Review the changes
- ✅ Approve & merge if good
- ❌ Request changes or close if not

## Usage

### Automatic (Default)
Just push code with errors → Issues created → Agent auto-fixes → You review PR

### Manual Trigger
Comment on any validation issue:
```
/fix-content page2test.md
```

The agent will create fixes and open a PR.

### Approval Options

**Option 1: Approve in PR**
- Go to the auto-fix PR
- Click "Approve" 
- Click "Merge"

**Option 2: Auto-merge with approval**
Add to the auto-fix PR settings:
- Enable "Auto-merge"
- Require 1 approval
- Agent creates PR → You approve → Auto-merges

**Option 3: Require specific reviewers**
In `.github/CODEOWNERS`:
```
*.md @your-username
```

All markdown PRs will require your approval.

## Configuration

### Change auto-fix threshold
Edit `.github/workflows/agent-auto-fix.yml`:
```yaml
core.setOutput('auto_fixable', criticalCount + highCount <= 10);  # Change 10 to your limit
```

### Disable auto-assignment
Remove the `content-validation` label trigger or delete `agent-auto-fix.yml`

### Always require approval
The agent always creates a PR (never pushes directly), so you always review before merging.

## Examples

### Scenario 1: Small file with 3 errors
1. ✅ Push triggers validation
2. ✅ Issue #123 created
3. ✅ Agent auto-assigned
4. ✅ PR #456 created with fixes
5. 🔔 You review PR #456
6. ✅ You approve & merge

### Scenario 2: Large file with 50 errors
1. ✅ Push triggers validation
2. ✅ Issue #124 created
3. ⚠️ Labeled `needs-manual-review`
4. 🔔 You comment `/fix-content` or fix manually
5. If you triggered agent → PR created → Review & approve

## Security

- Agent cannot merge without approval
- All fixes go through PR review
- You control what gets merged
- Agent uses existing `auto-fix.yml` workflow (already security-reviewed)
