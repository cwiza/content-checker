#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Import the validator (will need to be adapted for Node.js context)
// For now, we'll create a standalone version

class ContentValidator {
    constructor() {
        this.rules = this.initializeRules();
    }

    initializeRules() {
        return [
            {
                name: 'Spelling Check',
                type: 'spelling',
                severity: 'high',
                check: (text, ctx) => this.checkSpelling(text, ctx)
            },
            {
                name: 'Honorifics',
                type: 'honorifics',
                severity: 'critical',
                check: (text, ctx) => this.checkHonorifics(text, ctx)
            },
            {
                name: 'Placeholder Text',
                type: 'placeholder',
                severity: 'high',
                check: (text, ctx) => this.checkPlaceholder(text, ctx)
            },
            {
                name: 'Grammar Check',
                type: 'grammar',
                severity: 'medium',
                check: (text, ctx) => this.checkGrammar(text, ctx)
            },
            {
                name: 'Capitalization',
                type: 'capitalization',
                severity: 'low',
                check: (text, ctx) => this.checkCapitalization(text, ctx)
            }
        ];
    }

    async validateContent(content, filename) {
        const issues = [];
        const lines = content.split('\n');

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const lineNumber = i + 1;

            for (const rule of this.rules) {
                const context = {
                    filename,
                    lineNumber,
                    fullContent: content
                };

                const results = rule.check(line, context);
                for (const result of results) {
                    issues.push({
                        file: filename,
                        line: result.line,
                        message: result.message,
                        severity: rule.severity,
                        type: rule.type,
                        suggestion: result.suggestion
                    });
                }
            }
        }

        return issues;
    }

    checkSpelling(text, ctx) {
        const results = [];
        const commonMisspellings = {
            'teh': 'the',
            'recieve': 'receive',
            'occured': 'occurred',
            'seperate': 'separate',
            'definately': 'definitely',
            'accomodate': 'accommodate',
            'beleive': 'believe',
            'calender': 'calendar',
            'collegue': 'colleague',
            'goverment': 'government',
            'untill': 'until',
            'succesful': 'successful',
            'sucessful': 'successful',
            'begining': 'beginning'
        };

        const words = text.match(/\b[a-zA-Z]+\b/g) || [];
        
        for (const word of words) {
            const lower = word.toLowerCase();
            if (commonMisspellings[lower]) {
                results.push({
                    message: `Possible spelling error: "${word}"`,
                    suggestion: `Did you mean "${commonMisspellings[lower]}"?`,
                    line: ctx.lineNumber
                });
            }
        }

        return results;
    }

    checkHonorifics(text, ctx) {
        const honorifics = /\b(Mr\.|Mrs\.|Ms\.|Dr\.|Prof\.|Sr\.|Jr\.)/gi;
        const matches = text.match(honorifics);

        if (matches) {
            return [{
                message: `Honorific detected: ${matches.join(', ')}. Remove for inclusivity.`,
                suggestion: 'Use first name or full name without honorific',
                line: ctx.lineNumber
            }];
        }

        return [];
    }

    checkPlaceholder(text, ctx) {
        const results = [];
        const placeholders = [
            /lorem ipsum/i,
            /dolor sit amet/i,
            /\bTODO\b/,
            /\bTBD\b/,
            /\bFIXME\b/,
            /placeholder/i,
            /\[.*?\]/,
            /{{.*?}}/,
            /xxx+/i
        ];

        for (const pattern of placeholders) {
            if (pattern.test(text)) {
                results.push({
                    message: `Placeholder text detected: ${text.match(pattern)?.[0]}`,
                    suggestion: 'Replace with actual content',
                    line: ctx.lineNumber
                });
            }
        }

        return results;
    }

    checkGrammar(text, ctx) {
        const results = [];
        const grammarRules = [
            { pattern: /\byour\s+welcome\b/i, correct: "you're welcome", message: 'Should be "you\'re welcome" (you are)' },
            { pattern: /\bcould\s+of\b/i, correct: 'could have', message: 'Should be "could have"' },
            { pattern: /\bshould\s+of\b/i, correct: 'should have', message: 'Should be "should have"' },
            { pattern: /\bwould\s+of\b/i, correct: 'would have', message: 'Should be "would have"' }
        ];

        for (const rule of grammarRules) {
            if (rule.pattern.test(text)) {
                results.push({
                    message: `Grammar issue: ${rule.message}`,
                    suggestion: rule.correct,
                    line: ctx.lineNumber
                });
            }
        }

        return results;
    }

    checkCapitalization(text, ctx) {
        const results = [];
        const sentences = text.split(/[.!?]+\s+/);
        
        for (const sentence of sentences) {
            const trimmed = sentence.trim();
            if (trimmed.length > 0 && /^[a-z]/.test(trimmed)) {
                results.push({
                    message: `Sentence should start with capital letter: "${trimmed.substring(0, 30)}..."`,
                    suggestion: 'Capitalize first letter',
                    line: ctx.lineNumber
                });
            }
        }

        return results;
    }
}

async function main() {
    const prNumber = process.env.PR_NUMBER;
    
    // Get changed files - try different git commands based on context
    let changedFiles = [];
    
    try {
        // Try PR context first
        changedFiles = execSync('git diff --name-only origin/main...HEAD 2>/dev/null || git diff --name-only HEAD~1...HEAD 2>/dev/null || git ls-files "*.md" "*.txt" "*.json" "*.yml" "*.yaml"', { encoding: 'utf8' })
            .trim()
            .split('\n')
            .filter(file => file && file.length > 0);
    } catch (error) {
        // Fallback: validate all text files in repo
        console.log('Could not get changed files, validating all text files...');
        const findCmd = 'find . -type f \\( -name "*.md" -o -name "*.txt" -o -name "*.json" -o -name "*.yml" -o -name "*.yaml" \\) -not -path "*/node_modules/*" -not -path "*/.git/*" -not -path "*/dist/*"';
        changedFiles = execSync(findCmd, { encoding: 'utf8' })
            .trim()
            .split('\n')
            .map(f => f.replace('./', ''))
            .filter(file => file && file.length > 0);
    }
    
    // Filter for text files
    changedFiles = changedFiles.filter(file => {
        const textExtensions = ['.txt', '.md', '.markdown', '.json', '.yml', '.yaml'];
        return textExtensions.some(ext => file.toLowerCase().endsWith(ext));
    });

    console.log(`Validating ${changedFiles.length} changed files...`);

    const validator = new ContentValidator();
    const allIssues = [];

    for (const file of changedFiles) {
        if (!fs.existsSync(file)) {
            continue;
        }

        const content = fs.readFileSync(file, 'utf8');
        const issues = await validator.validateContent(content, file);
        allIssues.push(...issues);
    }

    console.log(`Found ${allIssues.length} total issues`);

    // Generate report
    const report = generateReport(allIssues, prNumber);
    fs.writeFileSync('validation-report.md', report);
    fs.writeFileSync('validation-issues.json', JSON.stringify(allIssues, null, 2));

    // Set outputs (new GitHub Actions syntax)
    const hasCritical = allIssues.some(i => i.severity === 'critical' || i.severity === 'high');
    const fs = require('fs');
    const outputFile = process.env.GITHUB_OUTPUT;
    if (outputFile) {
        fs.appendFileSync(outputFile, `has_issues=${allIssues.length > 0}\n`);
        fs.appendFileSync(outputFile, `has_critical=${hasCritical}\n`);
    }

    // Exit with error if critical issues found
    if (hasCritical) {
        console.error('Critical content issues found!');
        process.exit(1);
    }
}

function generateReport(issues, prNumber) {
    if (issues.length === 0) {
        return '## ✅ Content Validation Passed\n\nNo content issues found!';
    }

    const grouped = issues.reduce((acc, issue) => {
        if (!acc[issue.severity]) {
            acc[issue.severity] = [];
        }
        acc[issue.severity].push(issue);
        return acc;
    }, {});

    let report = `## 🔍 Content Validation Report\n\n`;
    report += `**Total Issues:** ${issues.length}\n\n`;

    const severityEmojis = {
        critical: '🔴',
        high: '🟡',
        medium: '🔵',
        low: '🟠'
    };

    for (const severity of ['critical', 'high', 'medium', 'low']) {
        if (grouped[severity]?.length > 0) {
            report += `### ${severityEmojis[severity]} ${severity.toUpperCase()} (${grouped[severity].length})\n\n`;
            grouped[severity].forEach(issue => {
                report += `- **${issue.file}:${issue.line}** - ${issue.message}\n`;
                if (issue.suggestion) {
                    report += `  - 💡 _Suggestion:_ ${issue.suggestion}\n`;
                }
            });
            report += '\n';
        }
    }

    return report;
}

main().catch(error => {
    console.error('Validation failed:', error);
    process.exit(1);
});
