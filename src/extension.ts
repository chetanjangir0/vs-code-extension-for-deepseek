import Ollama from 'ollama';
import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
	console.log('"deepseek-for-vscode" is now active!');

	const disposable = vscode.commands.registerCommand('deepseek-for-vscode.chat', async () => {
		const panel = vscode.window.createWebviewPanel(
			'deepseek_chat',
			'Deepseek Chat',
			vscode.ViewColumn.One,
			{enableScripts:true}
		)
		panel.webview.html = getWebviewContent();

		// fetch model list from ollama as soon as the panel opens
		try {
			const modelResponse = await Ollama.list()
			const models = modelResponse.models.map(model => model.name);
			panel.webview.postMessage({command:"modelsList", models});
		} catch(err){
			console.log(err);
			panel.webview.postMessage({command:"modelList", models:`Error: ${String(err)}`});
		}
		
		panel.webview.onDidReceiveMessage(async (message:any) => {
			if (message.command == "chat"){
				const {text:userPrompt, selectedModel} = message;
				let responseText = '' + selectedModel;
				try{
					const streamResponse = await Ollama.chat({
						model:selectedModel,
						messages:[{role:'user', content:userPrompt}],
						stream:true
					})
					for await (const part of streamResponse){// loop asynchronously
						responseText += part.message.content;
						panel.webview.postMessage({command:"chatResponse", text:responseText})
					}
					panel.webview.postMessage({command:"responseEnd"})
				} catch(err){
					panel.webview.postMessage({command:'chatResponse', text:`Error: ${String(err)}`});
					panel.webview.postMessage({ command: "responseEnd" });  // Ensure button re-enables on error
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
				@import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@300;400;500;600;700&display=swap');
				*{
					font-family: "Rajdhani", serif;
				}
				body{
					margin: 1rem;
				}
				#prompt{
					width: 100%;
					box-sizing: border-box;
				}
				#response{
					border: 1px solid #ccc;
					margin-top: 1rem;
					padding: 0.5rem;
				}

			</style>
		</head>
		<body>
			<h2>Deepseek for vscode</h2>
			<textarea id="prompt" rows="3" placeholder="Ask something..."></textarea>
			<button id="askButton">Ask</button>
			<select id="modelsDropdown"></select>
			<div id="response"></div>
			<script>
				const vscode = acquireVsCodeApi();
				const askBtn = document.getElementById("askButton");
				const dropdown = document.getElementById("modelsDropdown");

				askBtn.addEventListener("click", () => {
					const prompt = document.getElementById("prompt").value;
					askBtn.disabled = true;
					vscode.postMessage({command:"chat", text:prompt, selectedModel: dropdown.value});
				});
				
				window.addEventListener("message", event => {
					const {command, text, models} = event.data;
					if (command == "chatResponse"){
						document.getElementById("response").innerText = text;
					} else if(command == "responseEnd"){
						askBtn.disabled = false;
					} else if(command == "modelsList"){
						dropdown.innerHTML = models.map(model => '<option value="' + model + '">' + model + '</option>').join('');
					}
				})
			</script>
		</body>
		</html>
	`
}
export function deactivate() {}
