// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import simpleGit, { SimpleGit } from 'simple-git';
import axios from 'axios';
import { PRGeneratorSidebarProvider } from './sidebarProvider';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext): void {
	console.log('PR Comment Generator is now active!');

	const extractJiraTicket = (branchName: string): string => {
		// Common Jira ticket patterns: ABC-123, PROJECT-123, etc.
		const jiraPattern = /([A-Z]+-\d+)/;
		const match = branchName.match(jiraPattern);
		return match ? match[1] : 'No Jira ticket found';
	};

	const generatePRComment = async (): Promise<string> => {
		// Create status bar item for loading indicator
		const loadingStatus = vscode.window.createStatusBarItem(
			vscode.StatusBarAlignment.Right,
			100
		);
		loadingStatus.text = '$(sync~spin) Generating PR Comment...';

		try {
			const workspaceFolders = vscode.workspace.workspaceFolders;
			if (!workspaceFolders) {
				throw new Error('No workspace folder found');
			}

			const git: SimpleGit = simpleGit(workspaceFolders[0].uri.fsPath);

			// Check if the current directory is a git repository
			const isRepo = await git.checkIsRepo();
			if (!isRepo) {
				throw new Error('Not a git repository');
			}

			// Get current branch name
			const currentBranch = (await git.branch()).current;
			if (currentBranch === 'master' || currentBranch === 'main') {
				throw new Error(
					'Currently on master/main branch. Please switch to your feature branch.'
				);
			}

			// Get the diff between current branch and master
			const mainBranch = (await git.raw(['rev-parse', '--verify', 'master']))
				? 'origin/master'
				: 'origin/main';
			const diff = await git.diff([`${mainBranch}...${currentBranch}`]);

			if (!diff) {
				throw new Error('No differences found between branches');
			}

			// Get the commit messages between branches
			const commits = await git.log([`${mainBranch}..${currentBranch}`]);
			const commitMessages = commits.all.map((commit) => commit.message).join('\n');

			// Extract Jira ticket from branch name
			const jiraTicket = extractJiraTicket(currentBranch);

			// Get configuration
			const config = vscode.workspace.getConfiguration('prCommentGenerator');
			const apiKey = config.get('apiKey') as string;
			const template = config.get('template') as string;

			if (!apiKey) {
				throw new Error(
					'OpenAI API Key is not set. Please configure it in your settings.'
				);
			}

			if (!template) {
				throw new Error(
					'PR template is not set. Please configure it in your settings.'
				);
			}

			// Replace placeholders in template
			const prompt = template
				.replace('{currentBranch}', currentBranch)
				.replace('{targetBranch}', mainBranch)
				.replace('{jiraTicket}', jiraTicket)
				.replace('{commitMessages}', commitMessages)
				.replace('{diff}', diff);

			// Show loading status
			loadingStatus.show();

			// Call OpenAI GPT-4 Turbo API
			const response = await axios.post(
				'https://api.openai.com/v1/chat/completions',
				{
					model: 'gpt-4-turbo',
					messages: [
						{
							role: 'system',
							content:
								'You are a helpful assistant for generating pull request comments. Follow the template structure exactly as provided. If a Jira ticket is provided, include relevant information from the ticket number in the description. Only output the markdown content without any additional text or formatting.',
						},
						{ role: 'user', content: prompt },
					],
					temperature: 0.7,
				},
				{
					headers: {
						Authorization: `Bearer ${apiKey}`,
						'Content-Type': 'application/json',
					},
				}
			);

			const prComment = response.data.choices[0].message.content.trim();
			
			// Hide loading status
			loadingStatus.hide();
			
			return prComment;
		} catch (error) {
			// Hide loading status in case of error
			loadingStatus.hide();
			throw error;
		} finally {
			// Dispose of the status bar item
			loadingStatus.dispose();
		}
	};

	const configureTemplate = async () => {
		try {
			const config = vscode.workspace.getConfiguration('prCommentGenerator');
			const currentTemplate = config.get('template') as string;

			// Create a new untitled document with the current template
			const document = await vscode.workspace.openTextDocument({
				content: currentTemplate,
				language: 'markdown',
			});

			// Show the document in the editor
			const editor = await vscode.window.showTextDocument(document);

			// Create a status bar item for saving the template
			const saveButton = vscode.window.createStatusBarItem(
				vscode.StatusBarAlignment.Right,
				100
			);
			saveButton.text = '$(save) Save PR Template';
			saveButton.tooltip = 'Save the current content as your PR template';
			saveButton.command = 'pr-comment-generator.saveTemplate';
			saveButton.show();

			// Register the save command
			const saveDisposable = vscode.commands.registerCommand(
				'pr-comment-generator.saveTemplate',
				async () => {
					const newTemplate = editor.document.getText();
					await config.update(
						'template',
						newTemplate,
						vscode.ConfigurationTarget.Global
					);
					vscode.window.showInformationMessage('PR template saved successfully!');
					saveButton.dispose();
				}
			);

			// Clean up when the editor is closed
			const closeListener = vscode.workspace.onDidCloseTextDocument(async (doc) => {
				if (doc === document) {
					saveButton.dispose();
					closeListener.dispose();
					saveDisposable.dispose();
				}
			});

			context.subscriptions.push(saveDisposable, closeListener);
		} catch (error) {
			vscode.window.showErrorMessage(`Error configuring template: ${error}`);
		}
	};

	// Create and register sidebar provider
	const sidebarProvider = new PRGeneratorSidebarProvider(context.extensionUri, generatePRComment);
	const sidebarDisposable = vscode.window.registerWebviewViewProvider(
		PRGeneratorSidebarProvider.viewType,
		sidebarProvider
	);

	// Register commands
	const disposables = [
		vscode.commands.registerCommand(
			'pr-comment-generator.generatePRComment',
			generatePRComment
		),
		vscode.commands.registerCommand(
			'pr-comment-generator.configureTemplate',
			configureTemplate
		),
		vscode.commands.registerCommand(
			'pr-comment-generator.refreshSidebar',
			() => sidebarProvider.refresh()
		),
		sidebarDisposable
	];

	context.subscriptions.push(...disposables);
}

// this method is called when your extension is deactivated
// your extension is deactivated the very last time the command is executed
// context.subscriptions.push(
// 	vscode.commands.registerCommand('getting-started-sample.runCommand', async () => {
// 		await new Promise((resolve) => setTimeout(resolve, 1000));
// 		vscode.commands.executeCommand(
// 			'getting-started-sample.sayHello',
// 			vscode.Uri.joinPath(context.extensionUri, 'sample-folder')
// 		);
// 	})
// );

// context.subscriptions.push(
// 	vscode.commands.registerCommand(
// 		'getting-started-sample.changeSetting',
// 		async () => {
// 			await new Promise((resolve) => setTimeout(resolve, 1000));
// 			vscode.workspace
// 				.getConfiguration('getting-started-sample')
// 				.update('sampleSetting', true);
// 		}
// 	)
// );

// context.subscriptions.push(
// 	vscode.commands.registerCommand('getting-started-sample.setContext', async () => {
// 		await new Promise((resolve) => setTimeout(resolve, 1000));
// 		vscode.commands.executeCommand('setContext', 'gettingStartedContextKey', true);
// 	})
// );

// context.subscriptions.push(
// 	vscode.commands.registerCommand('getting-started-sample.sayHello', () => {
// 		vscode.window.showInformationMessage('Hello');
// 	})
// );

// context.subscriptions.push(
// 	vscode.commands.registerCommand('getting-started-sample.viewSources', () => {
// 		return { openFolder: vscode.Uri.joinPath(context.extensionUri, 'src') };
// 	})
// );
