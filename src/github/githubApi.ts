import * as vscode from 'vscode';

export interface PullRequest {
    number: number;
    title: string;
    body: string;
    head: {
        sha: string;
        ref: string;
    };
    base: {
        sha: string;
        ref: string;
    };
    changed_files: number;
    state: string;
}

export interface PullRequestFile {
    filename: string;
    status: string;
    additions: number;
    deletions: number;
    changes: number;
    patch?: string;
    contents_url: string;
}

export interface ContentIssue {
    file: string;
    line: number;
    message: string;
    severity: 'critical' | 'high' | 'medium' | 'low';
    type: string;
    suggestion?: string;
}

export class GitHubApiClient {
    private token: string;
    private owner: string;
    private repo: string;
    private baseUrl = 'https://api.github.com';

    constructor(token: string, owner: string, repo: string) {
        this.token = token;
        this.owner = owner;
        this.repo = repo;
    }

    /**
     * Fetch pull request details
     */
    async getPullRequest(prNumber: number): Promise<PullRequest> {
        const response = await this.fetch(`/repos/${this.owner}/${this.repo}/pulls/${prNumber}`);
        return await response.json() as PullRequest;
    }

    /**
     * Get files changed in a pull request
     */
    async getPullRequestFiles(prNumber: number): Promise<PullRequestFile[]> {
        const response = await this.fetch(`/repos/${this.owner}/${this.repo}/pulls/${prNumber}/files`);
        return await response.json() as PullRequestFile[];
    }

    /**
     * Get file content from repository
     */
    async getFileContent(path: string, ref: string): Promise<string> {
        const response = await this.fetch(`/repos/${this.owner}/${this.repo}/contents/${path}?ref=${ref}`);
        const data = await response.json() as { content?: string };
        
        if (data.content) {
            return Buffer.from(data.content, 'base64').toString('utf-8');
        }
        return '';
    }

    /**
     * Create a review comment on a specific line in a PR
     */
    async createReviewComment(
        prNumber: number,
        commitId: string,
        path: string,
        line: number,
        body: string
    ): Promise<void> {
        await this.fetch(
            `/repos/${this.owner}/${this.repo}/pulls/${prNumber}/comments`,
            {
                method: 'POST',
                body: JSON.stringify({
                    commit_id: commitId,
                    path,
                    line,
                    body
                })
            }
        );
    }

    /**
     * Create a general PR comment
     */
    async createPRComment(prNumber: number, body: string): Promise<void> {
        await this.fetch(
            `/repos/${this.owner}/${this.repo}/issues/${prNumber}/comments`,
            {
                method: 'POST',
                body: JSON.stringify({ body })
            }
        );
    }

    /**
     * Create a PR review with multiple comments
     */
    async createReview(
        prNumber: number,
        commitId: string,
        comments: Array<{ path: string; line: number; body: string }>,
        event: 'COMMENT' | 'APPROVE' | 'REQUEST_CHANGES' = 'COMMENT',
        reviewBody?: string
    ): Promise<void> {
        await this.fetch(
            `/repos/${this.owner}/${this.repo}/pulls/${prNumber}/reviews`,
            {
                method: 'POST',
                body: JSON.stringify({
                    commit_id: commitId,
                    body: reviewBody,
                    event,
                    comments: comments.map(c => ({
                        path: c.path,
                        line: c.line,
                        body: c.body
                    }))
                })
            }
        );
    }

    /**
     * Create an issue in the repository
     */
    async createIssue(
        title: string,
        body: string,
        labels?: string[],
        assignees?: string[]
    ): Promise<any> {
        const response = await this.fetch(
            `/repos/${this.owner}/${this.repo}/issues`,
            {
                method: 'POST',
                body: JSON.stringify({
                    title,
                    body,
                    labels,
                    assignees
                })
            }
        );
        return await response.json();
    }

    /**
     * Update file content in a branch (for auto-fixes)
     */
    async updateFile(
        path: string,
        content: string,
        branch: string,
        message: string
    ): Promise<void> {
        // First, get the current file SHA
        const fileResponse = await this.fetch(
            `/repos/${this.owner}/${this.repo}/contents/${path}?ref=${branch}`
        );
        const fileData = await fileResponse.json() as { sha: string };

        // Update the file
        await this.fetch(
            `/repos/${this.owner}/${this.repo}/contents/${path}`,
            {
                method: 'PUT',
                body: JSON.stringify({
                    message,
                    content: Buffer.from(content).toString('base64'),
                    sha: fileData.sha,
                    branch
                })
            }
        );
    }

    /**
     * Helper method for making authenticated GitHub API requests
     */
    private async fetch(endpoint: string, options: RequestInit = {}): Promise<Response> {
        const url = `${this.baseUrl}${endpoint}`;
        const headers = {
            'Authorization': `token ${this.token}`,
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json',
            ...options.headers
        };

        const response = await fetch(url, {
            ...options,
            headers
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`GitHub API error: ${response.status} - ${error}`);
        }

        return response;
    }

    /**
     * Format content issues into a readable comment
     */
    static formatIssuesComment(issues: ContentIssue[]): string {
        const grouped = issues.reduce((acc, issue) => {
            if (!acc[issue.severity]) {
                acc[issue.severity] = [];
            }
            acc[issue.severity].push(issue);
            return acc;
        }, {} as Record<string, ContentIssue[]>);

        let comment = '## 🔍 Content Validation Report\n\n';
        
        const severityEmojis = {
            critical: '🔴',
            high: '🟡',
            medium: '🔵',
            low: '🟠'
        };

        for (const severity of ['critical', 'high', 'medium', 'low']) {
            if (grouped[severity]?.length > 0) {
                comment += `### ${severityEmojis[severity as keyof typeof severityEmojis]} ${severity.toUpperCase()} (${grouped[severity].length})\n\n`;
                grouped[severity].forEach(issue => {
                    comment += `- **${issue.file}:${issue.line}** - ${issue.message}\n`;
                    if (issue.suggestion) {
                        comment += `  - _Suggestion:_ ${issue.suggestion}\n`;
                    }
                });
                comment += '\n';
            }
        }

        return comment;
    }
}
