# Feature Backlog

Ideas and features for future development.

## Auto-Fix Workflow

**Concept:** Automatically apply fixes to validation errors via GitHub Actions workflow.

**How it would work:**
1. User comments `/fix-content filename.md` on a PR
2. Workflow runs auto-fix script to correct common spelling/grammar errors
3. Creates a new commit with fixes
4. User reviews and approves the automated changes

**Challenges to solve:**
- GitHub Actions event context complexity (issue_comment vs PR events)
- File path resolution across different PR branches
- Ensuring auto-fixes don't break code or intentional formatting
- Approval/review process for automated changes

**Why it's valuable:**
- Reduces manual work fixing common typos
- Speeds up PR review cycles
- Could integrate with AI agents for more sophisticated fixes

**Related:**
- Could extend to integrate with Azure AI Foundry agents
- Could add approval gates requiring human review before merge
- See `foundry-agent-tool.py` and `content-validator.js` for AI integration groundwork

---

## Other Ideas

Add future feature ideas here as they come up.
