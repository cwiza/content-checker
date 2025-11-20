#!/usr/bin/env node

/**
 * Agent-friendly validation tool
 * Returns structured JSON for easy parsing by AI agents
 */

const fs = require('fs');
const path = require('path');
const { ContentValidator } = require('./validate-file.js');

async function validateForAgent(input) {
    const validator = new ContentValidator();
    
    // Support both file path or raw content
    let content, filename;
    if (fs.existsSync(input)) {
        content = fs.readFileSync(input, 'utf8');
        filename = input;
    } else {
        content = input;
        filename = 'inline-content';
    }

    const issues = await validator.validateContent(content, filename);

    return {
        status: issues.length === 0 ? 'valid' : 'invalid',
        issueCount: issues.length,
        criticalCount: issues.filter(i => i.severity === 'critical').length,
        highCount: issues.filter(i => i.severity === 'high').length,
        issues: issues.map(issue => ({
            line: issue.line,
            severity: issue.severity,
            type: issue.type,
            message: issue.message,
            suggestion: issue.suggestion,
            // Add fix hint for agents
            autoFixable: ['spelling', 'grammar'].includes(issue.type)
        })),
        // Provide actionable summary for agents
        summary: generateAgentSummary(issues)
    };
}

function generateAgentSummary(issues) {
    if (issues.length === 0) {
        return "Content is valid. No issues found.";
    }

    const byType = {};
    issues.forEach(issue => {
        byType[issue.type] = (byType[issue.type] || 0) + 1;
    });

    const parts = [];
    if (byType.spelling) parts.push(`${byType.spelling} spelling error(s)`);
    if (byType.honorifics) parts.push(`${byType.honorifics} honorific(s) to remove`);
    if (byType.placeholder) parts.push(`${byType.placeholder} placeholder(s) to replace`);
    if (byType.grammar) parts.push(`${byType.grammar} grammar issue(s)`);
    if (byType.capitalization) parts.push(`${byType.capitalization} capitalization issue(s)`);

    return `Found ${issues.length} issue(s): ${parts.join(', ')}. Review issues array for line-by-line fixes.`;
}

// CLI usage
if (require.main === module) {
    const input = process.argv[2] || process.stdin.fd;
    
    if (!input) {
        console.error('Usage: validate-agent-tool.js <file-or-content>');
        process.exit(1);
    }

    validateForAgent(input).then(result => {
        console.log(JSON.stringify(result, null, 2));
        process.exit(result.status === 'valid' ? 0 : 1);
    });
}

module.exports = { validateForAgent };
