import * as vscode from 'vscode';


export function activate(context: vscode.ExtensionContext) {
	console.log('"deepseek-for-vscode" is now active!');

	const disposable = vscode.commands.registerCommand('deepseek-for-vscode.chat', () => {
		const panel = vscode.window.createWebviewPanel(
			'deepseek_chat',
			'Deepseek Chat',
			vscode.ViewColumn.One,
			{enableScripts:true}
		)

		panel.webview.html = getWebviewContent();
		
	});

	context.subscriptions.push(disposable);
}


function getWebviewContent():string{
	return /*html*/`
		<!DOCTYPE html>
		<html lang="en">
		<head>
			<meta charset="UTF-8">
			<style>
			
			</style>
		</head>
		<body>
			<h1>Deepseek for vscode</h1>
		</body>
		</html>
	`
}
export function deactivate() {}
