import * as vscode from 'vscode';
import { GitHubApiClient, PullRequest, PullRequestFile, ContentIssue } from './githubApi';
import { ContentValidator } from '../validation/contentValidator';
import { AutoFixAgent } from '../agents/autoFixAgent';

export interface AnalysisResult {
    issues: ContentIssue[];
    autoFixable: ContentIssue[];
    summary: {
        total: number;
        bySeverity: Record<string, number>;
        byType: Record<string, number>;
    };
}

export class PRAnalyzer {
    constructor(
        private github: GitHubApiClient,
        private validator: ContentValidator,
        private autoFix: AutoFixAgent
    ) {}

    /**
     * Analyze all content in a pull request
     */
    async analyzePR(prNumber: number, options: {
        autoFix?: boolean;
        createComments?: boolean;
        createIssues?: boolean;
    } = {}): Promise<AnalysisResult> {
        const pr = await this.github.getPullRequest(prNumber);
        const files = await this.github.getPullRequestFiles(prNumber);

        vscode.window.showInformationMessage(`Analyzing PR #${prNumber}: ${pr.title}`);

        // Filter for text-based files
        const textFiles = files.filter(file => this.isTextFile(file.filename));
        
        const allIssues: ContentIssue[] = [];
        let processedFiles = 0;

        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: `Content Validation`,
            cancellable: false
        }, async (progress) => {
            for (const file of textFiles) {
                progress.report({
                    message: `Analyzing ${file.filename} (${++processedFiles}/${textFiles.length})`,
                    increment: (1 / textFiles.length) * 100
                });

                const content = await this.github.getFileContent(file.filename, pr.head.sha);
                const issues = await this.validator.validateContent(content, file.filename);
                allIssues.push(...issues);
            }
        });

        // Separate auto-fixable issues
        const autoFixable = allIssues.filter(issue => this.autoFix.canAutoFix(issue));

        // Apply auto-fixes if requested
        if (options.autoFix && autoFixable.length > 0) {
            await this.applyAutoFixes(pr, autoFixable);
        }

        // Create PR comments if requested
        if (options.createComments && allIssues.length > 0) {
            await this.createComments(pr, allIssues);
        }

        // Create issues if requested
        if (options.createIssues && allIssues.length > 0) {
            await this.createIssuesForProblems(pr, allIssues);
        }

        // Generate summary
        const summary = this.generateSummary(allIssues);

        return {
            issues: allIssues,
            autoFixable,
            summary
        };
    }

    /**
     * Apply automatic fixes to detected issues
     */
    private async applyAutoFixes(pr: PullRequest, issues: ContentIssue[]): Promise<void> {
        const fixesByFile = issues.reduce((acc, issue) => {
            if (!acc[issue.file]) {
                acc[issue.file] = [];
            }
            acc[issue.file].push(issue);
            return acc;
        }, {} as Record<string, ContentIssue[]>);

        for (const [file, fileIssues] of Object.entries(fixesByFile)) {
            try {
                const content = await this.github.getFileContent(file, pr.head.ref);
                const fixedContent = await this.autoFix.applyFixes(content, fileIssues);

                await this.github.updateFile(
                    file,
                    fixedContent,
                    pr.head.ref,
                    `Auto-fix content issues in ${file}\n\nFixed ${fileIssues.length} issue(s):\n${fileIssues.map(i => `- ${i.message}`).join('\n')}`
                );

                vscode.window.showInformationMessage(`✅ Auto-fixed ${fileIssues.length} issue(s) in ${file}`);
            } catch (error) {
                vscode.window.showErrorMessage(`Failed to auto-fix ${file}: ${error}`);
            }
        }
    }

    /**
     * Create review comments for all issues
     */
    private async createComments(pr: PullRequest, issues: ContentIssue[]): Promise<void> {
        // Group issues that can be commented inline
        const reviewComments = issues
            .filter(issue => issue.line > 0)
            .map(issue => ({
                path: issue.file,
                line: issue.line,
                body: this.formatIssueComment(issue)
            }));

        if (reviewComments.length > 0) {
            try {
                await this.github.createReview(
                    pr.number,
                    pr.head.sha,
                    reviewComments,
                    'COMMENT',
                    GitHubApiClient.formatIssuesComment(issues)
                );
                vscode.window.showInformationMessage(`Created review with ${reviewComments.length} comments`);
            } catch (error) {
                vscode.window.showErrorMessage(`Failed to create review: ${error}`);
            }
        } else {
            // Create a general comment if no inline comments
            await this.github.createPRComment(
                pr.number,
                GitHubApiClient.formatIssuesComment(issues)
            );
        }
    }

    /**
     * Create GitHub issues for critical/high severity problems
     */
    private async createIssuesForProblems(pr: PullRequest, issues: ContentIssue[]): Promise<void> {
        const criticalIssues = issues.filter(
            issue => issue.severity === 'critical' || issue.severity === 'high'
        );

        for (const issue of criticalIssues) {
            try {
                await this.github.createIssue(
                    `[Content] ${issue.type}: ${issue.file}:${issue.line}`,
                    `## Issue Details\n\n` +
                    `**File:** ${issue.file}\n` +
                    `**Line:** ${issue.line}\n` +
                    `**Severity:** ${issue.severity}\n` +
                    `**Type:** ${issue.type}\n\n` +
                    `### Description\n${issue.message}\n\n` +
                    (issue.suggestion ? `### Suggestion\n${issue.suggestion}\n\n` : '') +
                    `### Related PR\n#${pr.number}`,
                    ['content-validation', `severity-${issue.severity}`, issue.type],
                    []
                );
            } catch (error) {
                console.error(`Failed to create issue for ${issue.file}:${issue.line}`, error);
            }
        }

        if (criticalIssues.length > 0) {
            vscode.window.showInformationMessage(`Created ${criticalIssues.length} issue(s) for critical/high severity problems`);
        }
    }

    /**
     * Format a single issue as a comment
     */
    private formatIssueComment(issue: ContentIssue): string {
        const emoji = {
            critical: '🔴',
            high: '🟡',
            medium: '🔵',
            low: '🟠'
        }[issue.severity];

        let comment = `${emoji} **${issue.severity.toUpperCase()}** - ${issue.type}\n\n`;
        comment += issue.message;
        
        if (issue.suggestion) {
            comment += `\n\n💡 **Suggestion:** ${issue.suggestion}`;
        }

        return comment;
    }

    /**
     * Generate analysis summary
     */
    private generateSummary(issues: ContentIssue[]): AnalysisResult['summary'] {
        const bySeverity = issues.reduce((acc, issue) => {
            acc[issue.severity] = (acc[issue.severity] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        const byType = issues.reduce((acc, issue) => {
            acc[issue.type] = (acc[issue.type] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        return {
            total: issues.length,
            bySeverity,
            byType
        };
    }

    /**
     * Check if file is a text file that should be analyzed
     */
    private isTextFile(filename: string): boolean {
        const textExtensions = [
            '.txt', '.md', '.markdown', '.json', '.yml', '.yaml',
            '.js', '.ts', '.jsx', '.tsx', '.vue', '.html', '.css',
            '.scss', '.less', '.py', '.java', '.go', '.rs', '.rb',
            '.php', '.sh', '.bash', '.xml', '.svg'
        ];

        return textExtensions.some(ext => filename.toLowerCase().endsWith(ext));
    }
}
