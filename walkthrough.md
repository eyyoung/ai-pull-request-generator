# Get Started with PR Comment Generator

## Welcome to PR Comment Generator!

This extension helps you create high-quality pull request descriptions automatically using AI. Let's get you set up and running in just a few steps.

### Configure Your API Key

Before you can start generating PR descriptions, you'll need to set up your OpenAI API key:

1. Open VS Code settings (Cmd/Ctrl + ,)
2. Search for "PR Comment Generator"
3. Enter your OpenAI API key in the "API Key" field

[Configure Settings](command:workbench.action.openSettings?%22prCommentGenerator.apiKey%22)

### Access the PR Generator

The PR Generator is available in your activity bar:

1. Look for the PR Generator icon in the activity bar
2. Click it to open the sidebar
3. You'll see your current branch and Jira ticket information

[Open PR Generator](command:workbench.view.pr-generator)

### Customize Your Template

You can customize how your PR descriptions are generated:

1. Expand the "Template Configuration" section in the sidebar
2. Modify the template to match your team's PR format
3. Use placeholders like {currentBranch}, {jiraTicket}, etc.
4. Click "Save Template" to update

[Configure Template](command:pr-comment-generator.configureTemplate)

### Generate Your First PR Description

Now you're ready to generate your first PR description:

1. Make sure you're on your feature branch
2. Click "Generate PR Description" in the sidebar
3. Review the generated description
4. Use "Copy to Clipboard" to use it in your PR

[Generate PR Description](command:pr-comment-generator.generatePRComment)

## What's Next?

- Explore the extension settings for more customization options
- Check out our [documentation](https://github.com/Young/pr-comment-generator) for advanced features
- Report any issues or suggest improvements on our GitHub repository

Happy coding! 🚀
