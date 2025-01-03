import * as vscode from 'vscode';
import simpleGit, { SimpleGit } from 'simple-git';

export class PRGeneratorSidebarProvider implements vscode.WebviewViewProvider {
    public static readonly viewType = 'pr-generator-sidebar';
    private _view?: vscode.WebviewView;
    private _prResult = '';

    constructor(
        private readonly _extensionUri: vscode.Uri,
        private readonly _generatePRComment: () => Promise<string>
    ) {}

    public async resolveWebviewView(
        webviewView: vscode.WebviewView,
        _: vscode.WebviewViewResolveContext,
        _token: vscode.CancellationToken,
    ) {
        this._view = webviewView;

        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [this._extensionUri]
        };

        webviewView.webview.html = await this._getHtmlForWebview();

        // Handle messages from the webview
        webviewView.webview.onDidReceiveMessage(async (data) => {
            switch (data.type) {
                case 'generate':
                    try {
                        this._prResult = await this._generatePRComment();
                        await this.refresh();
                    } catch (error) {
                        if (error instanceof Error) {
                            vscode.window.showErrorMessage(error.message);
                        }
                    }
                    break;
                case 'refresh':
                    await this.refresh();
                    break;
                case 'saveTemplate':
                    try {
                        const config = vscode.workspace.getConfiguration('prCommentGenerator');
                        await config.update('template', data.value, vscode.ConfigurationTarget.Global);
                        vscode.window.showInformationMessage('Template saved successfully!');
                    } catch (error) {
                        if (error instanceof Error) {
                            vscode.window.showErrorMessage(error.message);
                        }
                    }
                    break;
            }
        });
    }

    public async refresh() {
        if (this._view) {
            this._view.webview.html = await this._getHtmlForWebview();
        }
    }

    private async _getGitInfo() {
        try {
            const workspaceFolders = vscode.workspace.workspaceFolders;
            if (!workspaceFolders) {
                return { error: 'No workspace folder found' };
            }

            const git: SimpleGit = simpleGit(workspaceFolders[0].uri.fsPath);

            const isRepo = await git.checkIsRepo();
            if (!isRepo) {
                return { error: 'Not a git repository' };
            }

            const currentBranch = (await git.branch()).current;
            const mainBranch = (await git.raw(['rev-parse', '--verify', 'master']))
                ? 'origin/master'
                : 'origin/main';

            // Extract Jira ticket from branch name
            const jiraPattern = /([A-Z]+-\d+)/;
            const match = currentBranch.match(jiraPattern);
            const jiraTicket = match ? match[1] : 'No Jira ticket found';

            return {
                currentBranch,
                targetBranch: mainBranch,
                jiraTicket
            };
        } catch (error) {
            return { error: String(error) };
        }
    }

    private async _getHtmlForWebview() {
        const gitInfo = await this._getGitInfo();
        const config = vscode.workspace.getConfiguration('prCommentGenerator');
        const template = config.get('template') as string || '';

        // Format the PR result by removing markdown code block syntax
        const formattedResult = this._prResult
            .replace(/^```[\w]*\n/, '') // Remove opening code block
            .replace(/\n```$/, '')      // Remove closing code block
            .trim();                    // Remove extra whitespace

        return `<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
                body {
                    padding: 15px;
                    font-family: var(--vscode-font-family);
                    color: var(--vscode-foreground);
                }
                .info-container {
                    background: var(--vscode-editor-background);
                    padding: 10px;
                    border-radius: 5px;
                    margin-bottom: 15px;
                }
                .info-item {
                    margin: 10px 0;
                }
                .label {
                    font-weight: bold;
                    color: var(--vscode-textPreformat-foreground);
                }
                .value {
                    word-break: break-all;
                }
                button {
                    background: var(--vscode-button-background);
                    color: var(--vscode-button-foreground);
                    border: none;
                    padding: 8px 12px;
                    border-radius: 3px;
                    cursor: pointer;
                    width: 100%;
                    margin: 5px 0;
                }
                button:hover {
                    background: var(--vscode-button-hoverBackground);
                }
                .error {
                    color: var(--vscode-errorForeground);
                    padding: 10px;
                    border: 1px solid var(--vscode-errorForeground);
                    border-radius: 3px;
                }
                .result-section {
                    margin-top: 20px;
                }
                .result-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 10px;
                }
                .result-title {
                    font-weight: bold;
                    color: var(--vscode-textPreformat-foreground);
                }
                .copy-button {
                    background: var(--vscode-button-secondaryBackground);
                    color: var(--vscode-button-secondaryForeground);
                    border: none;
                    padding: 4px 8px;
                    border-radius: 3px;
                    cursor: pointer;
                    font-size: 12px;
                }
                .copy-button:hover {
                    background: var(--vscode-button-secondaryHoverBackground);
                }
                .result-container {
                    background: var(--vscode-input-background);
                    border: 1px solid var(--vscode-input-border);
                    padding: 15px;
                    border-radius: 5px;
                    white-space: pre-wrap;
                    font-family: var(--vscode-editor-font-family);
                    font-size: var(--vscode-editor-font-size);
                }
                .copy-feedback {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    background: var(--vscode-notificationToast-background);
                    color: var(--vscode-notificationToast-foreground);
                    padding: 8px 16px;
                    border-radius: 4px;
                    display: none;
                    animation: fadeInOut 2s ease-in-out;
                }
                @keyframes fadeInOut {
                    0% { opacity: 0; }
                    10% { opacity: 1; }
                    90% { opacity: 1; }
                    100% { opacity: 0; }
                }
                .collapsible {
                    background: var(--vscode-button-secondaryBackground);
                    color: var(--vscode-button-secondaryForeground);
                    cursor: pointer;
                    padding: 10px;
                    width: 100%;
                    border: none;
                    text-align: left;
                    outline: none;
                    border-radius: 3px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin: 10px 0;
                }
                .collapsible:hover {
                    background: var(--vscode-button-secondaryHoverBackground);
                }
                .content {
                    padding: 0;
                    max-height: 0;
                    overflow: hidden;
                    transition: max-height 0.2s ease-out;
                    background: var(--vscode-editor-background);
                }
                .template-editor {
                    width: 100%;
                    min-height: 200px;
                    background: var(--vscode-input-background);
                    color: var(--vscode-input-foreground);
                    border: 1px solid var(--vscode-input-border);
                    padding: 8px;
                    font-family: var(--vscode-editor-font-family);
                    font-size: var(--vscode-editor-font-size);
                    resize: vertical;
                    margin: 10px 0;
                }
                .save-template {
                    background: var(--vscode-button-secondaryBackground);
                    margin-bottom: 10px;
                }
                .template-info {
                    font-size: 0.9em;
                    color: var(--vscode-descriptionForeground);
                    margin: 5px 0;
                }
            </style>
        </head>
        <body>
            ${gitInfo.error ? `
                <div class="error">
                    ${gitInfo.error}
                </div>
            ` : `
                <div class="info-container">
                    <div class="info-item">
                        <div class="label">Current Branch:</div>
                        <div class="value">${gitInfo.currentBranch}</div>
                    </div>
                    <div class="info-item">
                        <div class="label">Target Branch:</div>
                        <div class="value">${gitInfo.targetBranch}</div>
                    </div>
                    <div class="info-item">
                        <div class="label">Jira Ticket:</div>
                        <div class="value">${gitInfo.jiraTicket}</div>
                    </div>
                </div>
            `}
            <button onclick="generate()">Generate PR Description</button>
            <button onclick="refresh()">Refresh Information</button>

            <button class="collapsible">
                Template Configuration
                <span class="icon">▼</span>
            </button>
            <div class="content">
                <div class="template-info">
                    Available placeholders:
                    <ul>
                        <li>{currentBranch} - Current branch name</li>
                        <li>{targetBranch} - Target branch name</li>
                        <li>{jiraTicket} - Jira ticket number</li>
                        <li>{commitMessages} - List of commit messages</li>
                        <li>{diff} - Git diff between branches</li>
                    </ul>
                </div>
                <textarea class="template-editor" id="template-editor" placeholder="Enter your PR template here...">${template}</textarea>
                <button class="save-template" onclick="saveTemplate()">Save Template</button>
            </div>

            ${formattedResult ? `
                <div class="result-section">
                    <div class="result-header">
                        <span class="result-title">Generated PR Description</span>
                        <button class="copy-button" onclick="copyResult()">Copy to Clipboard</button>
                    </div>
                    <div class="result-container">${formattedResult}</div>
                </div>
                <div class="copy-feedback">Copied to clipboard!</div>
            ` : ''}

            <script>
                const vscode = acquireVsCodeApi();
                let generating = false;
                
                // Copy functionality
                async function copyResult() {
                    const resultContainer = document.querySelector('.result-container');
                    const feedback = document.querySelector('.copy-feedback');
                    
                    try {
                        await navigator.clipboard.writeText(resultContainer.textContent);
                        feedback.style.display = 'block';
                        setTimeout(() => {
                            feedback.style.display = 'none';
                        }, 2000);
                    } catch (err) {
                        vscode.postMessage({
                            type: 'error',
                            value: 'Failed to copy to clipboard'
                        });
                    }
                }

                // Collapsible functionality
                const coll = document.querySelector(".collapsible");
                const content = coll.nextElementSibling;
                coll.addEventListener("click", function() {
                    this.classList.toggle("active");
                    const icon = this.querySelector(".icon");
                    if (content.style.maxHeight) {
                        content.style.maxHeight = null;
                        icon.textContent = "▼";
                    } else {
                        content.style.maxHeight = content.scrollHeight + "px";
                        icon.textContent = "▲";
                    }
                });

                // Handle template changes
                let saveTimeout;
                const templateEditor = document.getElementById('template-editor');
                
                function saveTemplate() {
                    const template = templateEditor.value;
                    vscode.postMessage({
                        type: 'saveTemplate',
                        value: template
                    });
                }
                
                async function generate() {
                    if (generating) return;
                    
                    generating = true;
                    const button = document.querySelector('button');
                    const originalText = button.textContent;
                    button.textContent = 'Generating...';
                    button.disabled = true;
                    
                    vscode.postMessage({ type: 'generate' });
                    
                    setTimeout(() => {
                        generating = false;
                        button.textContent = originalText;
                        button.disabled = false;
                    }, 500);
                }
                
                function refresh() {
                    vscode.postMessage({ type: 'refresh' });
                }
            </script>
        </body>
        </html>`;
    }
}
