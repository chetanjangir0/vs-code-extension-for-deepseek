import Ollama from 'ollama';
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

		panel.webview.onDidReceiveMessage(async (message:any) => {
			if (message.command == "chat"){
				const userPrompt = message.text;
				let responseText = ''
				try{
					const streamResponse = await Ollama.chat({
						model:"deepseek-r1:1.5b",
						messages:[{role:'user', content:userPrompt}],
						stream:true
					})
					for await (const part of streamResponse){// loop asynchronously
						responseText += part.message.content;
						panel.webview.postMessage({command:"chatResponse", text:responseText})
					}
				} catch(err){
					panel.webview.postMessage({command:'chatResponse', text:`Error: ${String(err)}`})
				}
			}
		});
		
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
			<h2>Deepseek for vscode</h2>
			<textarea id="prompt" rows="3" placeholder="Ask something..."></textarea>
			<button id="askButton">Ask</button>
			<div id="response"></div>
			<script>
				const vscode = acquireVsCodeApi();
				console.log('live')
				document.getElementById("askButton").addEventListener("click", () => {
					const prompt = document.getElementById("prompt").value;
					vscode.postMessage({command:"chat", text:prompt});
				});
				
				window.addEventListener("message", event => {
					const {command, text} = event.data;
					if (command == "chatResponse"){
						document.getElementById("response").innerText = text;
					}
				})
			</script>
		</body>
		</html>
	`
}
export function deactivate() {}
