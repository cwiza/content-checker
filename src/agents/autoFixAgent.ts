import * as vscode from 'vscode';
import { ContentIssue } from '../github/githubApi';

export interface FixStrategy {
    type: string;
    canFix: (issue: ContentIssue) => boolean;
    apply: (content: string, issue: ContentIssue) => string;
}

export class AutoFixAgent {
    private strategies: FixStrategy[] = [];

    constructor() {
        this.initializeStrategies();
    }

    /**
     * Initialize fix strategies
     */
    private initializeStrategies(): void {
        this.strategies = [
            // Spelling fixes
            {
                type: 'spelling',
                canFix: (issue) => issue.type === 'spelling' && !!issue.suggestion,
                apply: (content, issue) => this.fixSpelling(content, issue)
            },

            // Honorifics removal
            {
                type: 'honorifics',
                canFix: (issue) => issue.type === 'honorifics',
                apply: (content, issue) => this.removeHonorifics(content, issue)
            },

            // Capitalization fixes
            {
                type: 'capitalization',
                canFix: (issue) => issue.type === 'capitalization',
                apply: (content, issue) => this.fixCapitalization(content, issue)
            },

            // Grammar fixes
            {
                type: 'grammar',
                canFix: (issue) => issue.type === 'grammar' && !!issue.suggestion,
                apply: (content, issue) => this.fixGrammar(content, issue)
            },

            // Placeholder removal (with user confirmation)
            {
                type: 'placeholder',
                canFix: (issue) => false, // Require manual intervention
                apply: (content, issue) => content
            }
        ];
    }

    /**
     * Check if an issue can be auto-fixed
     */
    canAutoFix(issue: ContentIssue): boolean {
        return this.strategies.some(strategy => strategy.canFix(issue));
    }

    /**
     * Apply fixes to content
     */
    async applyFixes(content: string, issues: ContentIssue[]): Promise<string> {
        let fixedContent = content;
        const lines = content.split('\n');

        // Sort issues by line number (descending) to avoid line number shifts
        const sortedIssues = [...issues].sort((a, b) => b.line - a.line);

        for (const issue of sortedIssues) {
            const strategy = this.strategies.find(s => s.canFix(issue));
            if (strategy) {
                try {
                    fixedContent = strategy.apply(fixedContent, issue);
                    console.log(`Applied fix for ${issue.type} at line ${issue.line}`);
                } catch (error) {
                    console.error(`Failed to apply fix for ${issue.type} at line ${issue.line}:`, error);
                }
            }
        }

        return fixedContent;
    }

    /**
     * Fix spelling errors
     */
    private fixSpelling(content: string, issue: ContentIssue): string {
        if (!issue.suggestion) {
            return content;
        }

        const lines = content.split('\n');
        const lineIndex = issue.line - 1;
        
        if (lineIndex >= 0 && lineIndex < lines.length) {
            const line = lines[lineIndex];
            
            // Extract the misspelled word from the message
            const match = issue.message.match(/"(.+?)"/);
            if (match) {
                const misspelled = match[1];
                const correction = issue.suggestion.match(/"(.+?)"/)?.[1];
                
                if (correction) {
                    // Case-sensitive replacement
                    lines[lineIndex] = line.replace(new RegExp(`\\b${misspelled}\\b`, 'g'), correction);
                }
            }
        }

        return lines.join('\n');
    }

    /**
     * Remove honorifics
     */
    private removeHonorifics(content: string, issue: ContentIssue): string {
        const lines = content.split('\n');
        const lineIndex = issue.line - 1;

        if (lineIndex >= 0 && lineIndex < lines.length) {
            const line = lines[lineIndex];
            
            // Remove common honorifics
            lines[lineIndex] = line.replace(/\b(Mr\.|Mrs\.|Ms\.|Dr\.|Prof\.|Sr\.|Jr\.)\s*/gi, '');
        }

        return lines.join('\n');
    }

    /**
     * Fix capitalization
     */
    private fixCapitalization(content: string, issue: ContentIssue): string {
        const lines = content.split('\n');
        const lineIndex = issue.line - 1;

        if (lineIndex >= 0 && lineIndex < lines.length) {
            const line = lines[lineIndex];
            
            // Capitalize first letter of sentences
            lines[lineIndex] = line.replace(/([.!?]\s+)([a-z])/g, (match, separator, letter) => {
                return separator + letter.toUpperCase();
            });

            // Capitalize first letter of the line if it's a sentence
            if (/^[a-z]/.test(lines[lineIndex])) {
                lines[lineIndex] = lines[lineIndex].charAt(0).toUpperCase() + lines[lineIndex].slice(1);
            }
        }

        return lines.join('\n');
    }

    /**
     * Fix grammar issues
     */
    private fixGrammar(content: string, issue: ContentIssue): string {
        if (!issue.suggestion) {
            return content;
        }

        const lines = content.split('\n');
        const lineIndex = issue.line - 1;

        if (lineIndex >= 0 && lineIndex < lines.length) {
            const line = lines[lineIndex];
            
            // Common grammar fixes
            const grammarFixes: Record<string, string> = {
                'your welcome': "you're welcome",
                'its a': "it's a",
                'could of': 'could have',
                'should of': 'should have',
                'would of': 'would have',
                'alot': 'a lot'
            };

            let fixedLine = line;
            for (const [wrong, correct] of Object.entries(grammarFixes)) {
                fixedLine = fixedLine.replace(new RegExp(wrong, 'gi'), correct);
            }

            lines[lineIndex] = fixedLine;
        }

        return lines.join('\n');
    }

    /**
     * Generate a fix commit message
     */
    generateCommitMessage(issues: ContentIssue[]): string {
        const fixedByType = issues.reduce((acc, issue) => {
            acc[issue.type] = (acc[issue.type] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        const summary = Object.entries(fixedByType)
            .map(([type, count]) => `${count} ${type}`)
            .join(', ');

        return `fix: Auto-fix content issues\n\nFixed ${issues.length} issue(s): ${summary}`;
    }

    /**
     * Add custom fix strategy
     */
    addStrategy(strategy: FixStrategy): void {
        this.strategies.push(strategy);
    }

    /**
     * Get all strategies
     */
    getStrategies(): FixStrategy[] {
        return [...this.strategies];
    }

    /**
     * Interactive fix with user confirmation
     */
    async interactiveFix(content: string, issues: ContentIssue[]): Promise<string> {
        let fixedContent = content;

        for (const issue of issues) {
            if (!this.canAutoFix(issue)) {
                continue;
            }

            const action = await vscode.window.showInformationMessage(
                `Fix ${issue.type} at line ${issue.line}?\n${issue.message}`,
                'Fix', 'Skip', 'Fix All Remaining'
            );

            if (action === 'Fix') {
                const strategy = this.strategies.find(s => s.canFix(issue));
                if (strategy) {
                    fixedContent = strategy.apply(fixedContent, issue);
                }
            } else if (action === 'Fix All Remaining') {
                // Apply all remaining fixes automatically
                const remainingIssues = issues.slice(issues.indexOf(issue));
                fixedContent = await this.applyFixes(fixedContent, remainingIssues);
                break;
            }
        }

        return fixedContent;
    }

    /**
     * Preview fixes without applying them
     */
    previewFixes(content: string, issues: ContentIssue[]): Array<{ original: string; fixed: string; issue: ContentIssue }> {
        const previews: Array<{ original: string; fixed: string; issue: ContentIssue }> = [];
        const lines = content.split('\n');

        for (const issue of issues) {
            if (!this.canAutoFix(issue)) {
                continue;
            }

            const strategy = this.strategies.find(s => s.canFix(issue));
            if (strategy) {
                const lineIndex = issue.line - 1;
                if (lineIndex >= 0 && lineIndex < lines.length) {
                    const original = lines[lineIndex];
                    const fixed = strategy.apply(content, issue).split('\n')[lineIndex];
                    
                    previews.push({
                        original,
                        fixed,
                        issue
                    });
                }
            }
        }

        return previews;
    }
}
