import * as vscode from 'vscode';
import { ContentIssue } from '../github/githubApi';

export interface ValidationRule {
    name: string;
    type: string;
    severity: 'critical' | 'high' | 'medium' | 'low';
    check: (text: string, context: ValidationContext) => ValidationResult[];
}

export interface ValidationContext {
    filename: string;
    lineNumber: number;
    fullContent: string;
}

export interface ValidationResult {
    message: string;
    suggestion?: string;
    line: number;
}

export class ContentValidator {
    private rules: ValidationRule[] = [];
    private customDictionary: Set<string> = new Set();

    constructor() {
        this.initializeRules();
        this.loadCustomDictionary();
    }

    /**
     * Initialize built-in validation rules
     */
    private initializeRules(): void {
        this.rules = [
            // Spelling errors
            {
                name: 'Spelling Check',
                type: 'spelling',
                severity: 'high',
                check: (text, ctx) => this.checkSpelling(text, ctx)
            },
            
            // Honorifics
            {
                name: 'Honorifics',
                type: 'honorifics',
                severity: 'critical',
                check: (text, ctx) => this.checkHonorifics(text, ctx)
            },

            // Lorem ipsum / placeholder text
            {
                name: 'Placeholder Text',
                type: 'placeholder',
                severity: 'high',
                check: (text, ctx) => this.checkPlaceholder(text, ctx)
            },

            // Long button/nav text
            {
                name: 'Long Button Text',
                type: 'long-text',
                severity: 'medium',
                check: (text, ctx) => this.checkLongButtonText(text, ctx)
            },

            // Plural inconsistencies
            {
                name: 'Plural Consistency',
                type: 'plural-consistency',
                severity: 'low',
                check: (text, ctx) => this.checkPluralConsistency(text, ctx)
            },

            // Capitalization
            {
                name: 'Capitalization',
                type: 'capitalization',
                severity: 'low',
                check: (text, ctx) => this.checkCapitalization(text, ctx)
            },

            // Grammar issues
            {
                name: 'Grammar Check',
                type: 'grammar',
                severity: 'medium',
                check: (text, ctx) => this.checkGrammar(text, ctx)
            },

            // Profanity/inappropriate content
            {
                name: 'Inappropriate Content',
                type: 'inappropriate',
                severity: 'critical',
                check: (text, ctx) => this.checkInappropriateContent(text, ctx)
            }
        ];
    }

    /**
     * Load custom dictionary from workspace configuration
     */
    private loadCustomDictionary(): void {
        const config = vscode.workspace.getConfiguration('contentChecker');
        const customWords = config.get<string[]>('customDictionary', []);
        this.customDictionary = new Set(customWords.map(w => w.toLowerCase()));
    }

    /**
     * Validate content and return issues
     */
    async validateContent(content: string, filename: string): Promise<ContentIssue[]> {
        const issues: ContentIssue[] = [];
        const lines = content.split('\n');

        // Get enabled rules from configuration
        const config = vscode.workspace.getConfiguration('contentChecker');
        const enabledRules = config.get<string[]>('enabledRules', ['spelling', 'honorifics', 'placeholder', 'grammar', 'capitalization']);

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const lineNumber = i + 1;

            for (const rule of this.rules) {
                // Skip disabled rules
                if (!enabledRules.includes(rule.type)) {
                    continue;
                }

                const context: ValidationContext = {
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

    /**
     * Check for spelling errors
     */
    private checkSpelling(text: string, ctx: ValidationContext): ValidationResult[] {
        const results: ValidationResult[] = [];
        
        // Common misspellings dictionary
        const commonMisspellings: Record<string, string> = {
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
            if (commonMisspellings[lower] && !this.customDictionary.has(lower)) {
                results.push({
                    message: `Possible spelling error: "${word}"`,
                    suggestion: `Did you mean "${commonMisspellings[lower]}"?`,
                    line: ctx.lineNumber
                });
            }
        }

        return results;
    }

    /**
     * Check for honorifics (Mr., Mrs., Dr., etc.)
     */
    private checkHonorifics(text: string, ctx: ValidationContext): ValidationResult[] {
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

    /**
     * Check for lorem ipsum and placeholder text
     */
    private checkPlaceholder(text: string, ctx: ValidationContext): ValidationResult[] {
        const results: ValidationResult[] = [];
        const placeholders = [
            /lorem ipsum/i,
            /dolor sit amet/i,
            /\bTODO\b/,
            /\bTBD\b/,
            /\bFIXME\b/,
            /placeholder/i,
            /\[.*?\]/,  // Bracketed placeholders like [Your Name]
            /{{.*?}}/,   // Template placeholders
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

    /**
     * Check for long button/navigation text
     */
    private checkLongButtonText(text: string, ctx: ValidationContext): ValidationResult[] {
        // Check if this looks like button or nav text
        const buttonPatterns = [
            /button/i,
            /btn/i,
            /click/i,
            /submit/i,
            /\<button/i,
            /aria-label/i
        ];

        const isButtonContext = buttonPatterns.some(p => ctx.fullContent.includes(text) && p.test(ctx.fullContent));
        
        if (isButtonContext) {
            const words = text.trim().split(/\s+/);
            if (words.length > 3) {
                return [{
                    message: `Button text is too long (${words.length} words). Keep to 3 words or less.`,
                    suggestion: 'Simplify button text for better UX',
                    line: ctx.lineNumber
                }];
            }
        }

        return [];
    }

    /**
     * Check for plural inconsistencies
     */
    private checkPluralConsistency(text: string, ctx: ValidationContext): ValidationResult[] {
        const results: ValidationResult[] = [];
        
        // Common singular/plural pairs to check for consistency
        const pairs = [
            ['app', 'apps'],
            ['task', 'tasks'],
            ['item', 'items'],
            ['user', 'users'],
            ['file', 'files'],
            ['folder', 'folders']
        ];

        for (const [singular, plural] of pairs) {
            const singularRegex = new RegExp(`\\b${singular}\\b`, 'gi');
            const pluralRegex = new RegExp(`\\b${plural}\\b`, 'gi');
            
            const singularMatches = ctx.fullContent.match(singularRegex);
            const pluralMatches = ctx.fullContent.match(pluralRegex);
            
            if (singularMatches && pluralMatches) {
                const singularCount = singularMatches.length;
                const pluralCount = pluralMatches.length;
                
                // Flag if there's a significant imbalance
                if (singularCount > 0 && pluralCount > 0 && Math.abs(singularCount - pluralCount) > 5) {
                    results.push({
                        message: `Inconsistent plural usage: "${singular}" (${singularCount}x) vs "${plural}" (${pluralCount}x)`,
                        suggestion: 'Ensure consistent singular/plural usage throughout',
                        line: ctx.lineNumber
                    });
                }
            }
        }

        return results;
    }

    /**
     * Check capitalization
     */
    private checkCapitalization(text: string, ctx: ValidationContext): ValidationResult[] {
        const results: ValidationResult[] = [];

        // Check for inconsistent sentence capitalization
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

    /**
     * Check for basic grammar issues
     */
    private checkGrammar(text: string, ctx: ValidationContext): ValidationResult[] {
        const results: ValidationResult[] = [];

        // Common grammar mistakes
        const grammarRules = [
            { pattern: /\byour\s+welcome\b/i, correct: "you're welcome", message: 'Should be "you\'re welcome" (you are)' },
            { pattern: /\bits\s+a\b/i, correct: "it's a", message: 'Should be "it\'s" (it is)' },
            { pattern: /\bcould\s+of\b/i, correct: 'could have', message: 'Should be "could have"' },
            { pattern: /\bshould\s+of\b/i, correct: 'should have', message: 'Should be "should have"' },
            { pattern: /\bwould\s+of\b/i, correct: 'would have', message: 'Should be "would have"' },
            { pattern: /\ba\s+lot\b/i, correct: 'a lot', message: 'Two words: "a lot"' },
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

    /**
     * Check for inappropriate content
     */
    private checkInappropriateContent(text: string, ctx: ValidationContext): ValidationResult[] {
        const results: ValidationResult[] = [];
        
        // Basic profanity filter (add more comprehensive list as needed)
        const inappropriateWords = ['damn', 'hell', 'crap', 'stupid', 'idiot', 'suck'];
        
        for (const word of inappropriateWords) {
            const regex = new RegExp(`\\b${word}\\b`, 'gi');
            if (regex.test(text)) {
                results.push({
                    message: `Potentially inappropriate content detected`,
                    suggestion: 'Use professional language',
                    line: ctx.lineNumber
                });
                break; // Only report once per line
            }
        }

        return results;
    }

    /**
     * Add custom rule
     */
    addRule(rule: ValidationRule): void {
        this.rules.push(rule);
    }

    /**
     * Remove rule by name
     */
    removeRule(name: string): void {
        this.rules = this.rules.filter(r => r.name !== name);
    }

    /**
     * Get all rules
     */
    getRules(): ValidationRule[] {
        return [...this.rules];
    }
}
