import * as vscode from 'vscode';


export function activate(context: vscode.ExtensionContext) {
	console.log('Congratulations, your extension "deepseek-for-vscode" is now active!');

	const disposable = vscode.commands.registerCommand('deepseek-for-vscode.helloWorld', () => {
		// The code you place here will be executed every time your command is executed
		// Display a message box to the user
		vscode.window.showInformationMessage('Hello World from deepseek for vscode!');
	});

	context.subscriptions.push(disposable);
}

export function deactivate() {}
