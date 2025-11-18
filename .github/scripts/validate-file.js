#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

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
            'begining': 'beginning',
            'fring': 'firing',
            'ahd': 'and'
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
    const file = process.argv[2];
    
    if (!file) {
        console.error('Usage: validate-file.js <filename>');
        process.exit(1);
    }

    if (!fs.existsSync(file)) {
        console.error(`File not found: ${file}`);
        process.exit(1);
    }

    const content = fs.readFileSync(file, 'utf8');
    const validator = new ContentValidator();
    const issues = await validator.validateContent(content, file);

    if (issues.length === 0) {
        console.log(`✅ ${file} - No issues found`);
        return;
    }

    console.log(`\n❌ ${file} - Found ${issues.length} issue(s):\n`);
    
    issues.forEach(issue => {
        const emoji = { critical: '🔴', high: '🟡', medium: '🔵', low: '🟠' }[issue.severity];
        console.log(`${emoji} Line ${issue.line}: ${issue.message}`);
        if (issue.suggestion) {
            console.log(`   💡 ${issue.suggestion}`);
        }
    });

    process.exit(1);
}

main().catch(error => {
    console.error('Validation failed:', error);
    process.exit(1);
});
