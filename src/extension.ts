import * as vscode from 'vscode';
import { GitHubApiClient } from './github/githubApi';
import { PRAnalyzer } from './github/prAnalyzer';
import { ContentValidator } from './validation/contentValidator';
import { AutoFixAgent } from './agents/autoFixAgent';

let analyzer: PRAnalyzer | null = null;

export function activate(context: vscode.ExtensionContext) {
	console.log('Content Checker extension is now active!');

	// Command: Validate PR Content
	const validatePRCommand = vscode.commands.registerCommand('content-checker.validatePR', async () => {
		await validatePullRequest(false);
	});

	// Command: Validate and Auto-fix PR Content
	const validateAndFixPRCommand = vscode.commands.registerCommand('content-checker.validateAndFixPR', async () => {
		await validatePullRequest(true);
	});

	// Command: Configure GitHub Settings
	const configureCommand = vscode.commands.registerCommand('content-checker.configure', async () => {
		await configureGitHubSettings(context);
	});

	// Command: Preview Auto-fixes
	const previewFixesCommand = vscode.commands.registerCommand('content-checker.previewFixes', async () => {
		await previewAutoFixes();
	});

	// Command: Run Content Validation on Current File
	const validateFileCommand = vscode.commands.registerCommand('content-checker.validateFile', async () => {
		await validateCurrentFile();
	});

	context.subscriptions.push(
		validatePRCommand,
		validateAndFixPRCommand,
		configureCommand,
		previewFixesCommand,
		validateFileCommand
	);

	// Initialize analyzer with saved settings
	initializeAnalyzer(context);
}

/**
 * Initialize the PR analyzer with GitHub settings
 */
async function initializeAnalyzer(context: vscode.ExtensionContext): Promise<PRAnalyzer | null> {
	const config = vscode.workspace.getConfiguration('contentChecker');
	const token = config.get<string>('githubToken');
	const owner = config.get<string>('githubOwner');
	const repo = config.get<string>('githubRepo');

	if (!token || !owner || !repo) {
		return null;
	}

	try {
		const github = new GitHubApiClient(token, owner, repo);
		const validator = new ContentValidator();
		const autoFix = new AutoFixAgent();
		analyzer = new PRAnalyzer(github, validator, autoFix);
		return analyzer;
	} catch (error) {
		vscode.window.showErrorMessage(`Failed to initialize Content Checker: ${error}`);
		return null;
	}
}

/**
 * Validate Pull Request
 */
async function validatePullRequest(autoFix: boolean): Promise<void> {
	if (!analyzer) {
		const result = await vscode.window.showWarningMessage(
			'GitHub not configured. Configure now?',
			'Configure', 'Cancel'
		);
		
		if (result === 'Configure') {
			await vscode.commands.executeCommand('content-checker.configure');
			return;
		}
		return;
	}

	const prNumber = await vscode.window.showInputBox({
		prompt: 'Enter Pull Request number',
		placeHolder: 'e.g., 123',
		validateInput: (value) => {
			return /^\d+$/.test(value) ? null : 'Please enter a valid PR number';
		}
	});

	if (!prNumber) {
		return;
	}

	try {
		const createComments = await vscode.window.showQuickPick(
			['Yes', 'No'],
			{ placeHolder: 'Create PR comments for issues?' }
		);

		const createIssues = await vscode.window.showQuickPick(
			['Yes', 'No'],
			{ placeHolder: 'Create GitHub issues for critical/high severity problems?' }
		);

		const result = await analyzer.analyzePR(parseInt(prNumber), {
			autoFix,
			createComments: createComments === 'Yes',
			createIssues: createIssues === 'Yes'
		});

		// Show results
		const message = `✅ Analysis complete!\n\n` +
			`Total issues: ${result.summary.total}\n` +
			`Auto-fixable: ${result.autoFixable.length}\n` +
			`By severity:\n` +
			Object.entries(result.summary.bySeverity)
				.map(([severity, count]) => `  ${severity}: ${count}`)
				.join('\n');

		await vscode.window.showInformationMessage(message, { modal: true });

		// Show detailed results in output channel
		const output = vscode.window.createOutputChannel('Content Checker');
		output.clear();
		output.appendLine('=== Content Validation Results ===\n');
		output.appendLine(`PR #${prNumber}\n`);
		output.appendLine(`Total Issues: ${result.summary.total}`);
		output.appendLine(`Auto-fixable: ${result.autoFixable.length}\n`);
		
		for (const issue of result.issues) {
			output.appendLine(`[${issue.severity.toUpperCase()}] ${issue.file}:${issue.line}`);
			output.appendLine(`  Type: ${issue.type}`);
			output.appendLine(`  Message: ${issue.message}`);
			if (issue.suggestion) {
				output.appendLine(`  Suggestion: ${issue.suggestion}`);
			}
			output.appendLine('');
		}
		
		output.show();

	} catch (error) {
		vscode.window.showErrorMessage(`Failed to validate PR: ${error}`);
	}
}

/**
 * Configure GitHub Settings
 */
async function configureGitHubSettings(context: vscode.ExtensionContext): Promise<void> {
	const config = vscode.workspace.getConfiguration('contentChecker');

	const token = await vscode.window.showInputBox({
		prompt: 'Enter GitHub Personal Access Token',
		password: true,
		value: config.get<string>('githubToken', ''),
		placeHolder: 'ghp_xxxxxxxxxxxx'
	});

	if (!token) {
		return;
	}

	const owner = await vscode.window.showInputBox({
		prompt: 'Enter GitHub Repository Owner',
		value: config.get<string>('githubOwner', ''),
		placeHolder: 'e.g., microsoft'
	});

	if (!owner) {
		return;
	}

	const repo = await vscode.window.showInputBox({
		prompt: 'Enter GitHub Repository Name',
		value: config.get<string>('githubRepo', ''),
		placeHolder: 'e.g., vscode'
	});

	if (!repo) {
		return;
	}

	await config.update('githubToken', token, vscode.ConfigurationTarget.Global);
	await config.update('githubOwner', owner, vscode.ConfigurationTarget.Workspace);
	await config.update('githubRepo', repo, vscode.ConfigurationTarget.Workspace);

	vscode.window.showInformationMessage('✅ GitHub settings saved!');

	// Reinitialize analyzer
	analyzer = await initializeAnalyzer(context);
}

/**
 * Preview auto-fixes without applying
 */
async function previewAutoFixes(): Promise<void> {
	const editor = vscode.window.activeTextEditor;
	if (!editor) {
		vscode.window.showInformationMessage('No active editor');
		return;
	}

	const validator = new ContentValidator();
	const autoFix = new AutoFixAgent();

	const content = editor.document.getText();
	const filename = editor.document.fileName;

	const issues = await validator.validateContent(content, filename);
	const autoFixableIssues = issues.filter(issue => autoFix.canAutoFix(issue));

	if (autoFixableIssues.length === 0) {
		vscode.window.showInformationMessage('No auto-fixable issues found');
		return;
	}

	const previews = autoFix.previewFixes(content, autoFixableIssues);
	
	const output = vscode.window.createOutputChannel('Content Checker - Preview');
	output.clear();
	output.appendLine('=== Auto-fix Preview ===\n');
	
	for (const preview of previews) {
		output.appendLine(`Line ${preview.issue.line} - ${preview.issue.type}:`);
		output.appendLine(`  Original: ${preview.original.trim()}`);
		output.appendLine(`  Fixed:    ${preview.fixed.trim()}`);
		output.appendLine('');
	}
	
	output.show();
}

/**
 * Validate current file
 */
async function validateCurrentFile(): Promise<void> {
	const editor = vscode.window.activeTextEditor;
	if (!editor) {
		vscode.window.showInformationMessage('No active editor');
		return;
	}

	const validator = new ContentValidator();
	const content = editor.document.getText();
	const filename = editor.document.fileName;

	vscode.window.withProgress({
		location: vscode.ProgressLocation.Notification,
		title: 'Validating content...',
		cancellable: false
	}, async () => {
		const issues = await validator.validateContent(content, filename);

		if (issues.length === 0) {
			vscode.window.showInformationMessage('✅ No content issues found!');
			return;
		}

		const output = vscode.window.createOutputChannel('Content Checker');
		output.clear();
		output.appendLine(`=== Content Validation: ${filename} ===\n`);
		output.appendLine(`Total Issues: ${issues.length}\n`);

		for (const issue of issues) {
			output.appendLine(`[${issue.severity.toUpperCase()}] Line ${issue.line}`);
			output.appendLine(`  Type: ${issue.type}`);
			output.appendLine(`  Message: ${issue.message}`);
			if (issue.suggestion) {
				output.appendLine(`  Suggestion: ${issue.suggestion}`);
			}
			output.appendLine('');
		}

		output.show();

		vscode.window.showWarningMessage(
			`Found ${issues.length} content issue(s)`,
			'View Details'
		).then(result => {
			if (result === 'View Details') {
				output.show();
			}
		});
	});
}

export function deactivate() {
	analyzer = null;
}
