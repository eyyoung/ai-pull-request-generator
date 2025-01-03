# PR Comment Generator

A VS Code extension that automatically generates high-quality pull request descriptions using OpenAI's GPT-4 model. It analyzes your git changes and creates structured, informative PR comments based on your commit history and code differences.

## Features

- 🤖 **AI-Powered PR Descriptions**: Leverages OpenAI's GPT-4 to generate contextual and meaningful PR descriptions
- 📝 **Customizable Templates**: Configure your own PR template with placeholders for git information
- 🎯 **Jira Integration**: Automatically detects and includes Jira ticket numbers from branch names
- 📊 **Git Analysis**: Incorporates branch information, commit messages, and code differences
- 🔄 **Live Preview**: See the generated PR description in real-time in the sidebar
- 📋 **Easy Copy**: One-click copy to clipboard functionality

## Requirements

- Visual Studio Code v1.74.0 or higher
- Git repository
- OpenAI API key

## Installation

1. Install the extension from the VS Code Marketplace
2. Configure your OpenAI API key in VS Code settings
3. Open a git repository
4. Access the PR Generator from the activity bar

## Getting Started

1. **Set up your OpenAI API Key**:
   - Open VS Code settings (Cmd/Ctrl + ,)
   - Search for "PR Comment Generator"
   - Enter your OpenAI API key in the "API Key" field

2. **Configure PR Template (Optional)**:
   - Click on the PR Generator icon in the activity bar
   - Expand the "Template Configuration" section
   - Customize the template according to your needs
   - Available placeholders:
     - `{currentBranch}`: Current branch name
     - `{targetBranch}`: Target branch (main/master)
     - `{jiraTicket}`: Extracted Jira ticket number
     - `{commitMessages}`: List of commit messages
     - `{diff}`: Git diff between branches

3. **Generate PR Description**:
   - Switch to your feature branch
   - Click on the PR Generator icon in the activity bar
   - Click "Generate PR Description"
   - Review the generated description
   - Click "Copy to Clipboard" to use it in your PR

## Default Template

The default template includes:
- Objective
- Changes made
- Jira ticket reference
- PR type (Feature/Bug Fix/Enhancement/Refactor)
- Checklist for quality assurance

## Extension Settings

This extension contributes the following settings:

* `prCommentGenerator.apiKey`: OpenAI API Key
* `prCommentGenerator.template`: PR description template

## Known Issues

- The extension requires an active internet connection for API calls
- Large diffs may be truncated due to API token limits

## Release Notes

### 0.0.1 (2025-01-05)

Initial release:
- Basic PR description generation
- Customizable templates
- Jira ticket detection
- Sidebar interface with live preview
- Copy to clipboard functionality

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This extension is licensed under the [MIT License](LICENSE).

## Acknowledgments

- OpenAI for providing the GPT-4 API
- VS Code team for the excellent extension API
- All contributors and users of this extension

---

**Enjoy generating better PR descriptions! 🚀**