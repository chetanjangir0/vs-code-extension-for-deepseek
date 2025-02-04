import Ollama from 'ollama';
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

interface Message{
	role:"user" | "system",
	content:string,
}
export function activate(context: vscode.ExtensionContext) {
	console.log('"Ollama Hub" is now active!');

	// Reset chat history when VS Code starts (might change later)
	context.workspaceState.update("chatHistory", []);

	const disposable = vscode.commands.registerCommand('ollama_hub.chat', async () => {
		const panel = vscode.window.createWebviewPanel(
			'ollama_hub',
			'Ollama Hub',
			vscode.ViewColumn.One,
			{
				enableScripts:true,
				retainContextWhenHidden: true // Keeps webview alive even when switching tabs
			}
		)
		panel.webview.html = getWebviewContent(context);// load html from file

		// fetch model list from ollama as soon as the panel opens (for the dropdown)
		try {
			const modelResponse = await Ollama.list()
			const models = modelResponse.models.map(model => model.name);
			panel.webview.postMessage({command:"modelsList", models});
		} catch(err){
			console.log(err);
			panel.webview.postMessage({command:"modelList", models:`Error: ${String(err)}`});
		}
		
		// prompting something to the model
		panel.webview.onDidReceiveMessage(async (message:any) => {
			if (message.command == "chat"){
				const {text:userPrompt, selectedModel} = message;
				const userMessage:Message = {role:"user", content:userPrompt};

				//user globalState if you want the data to persist after closing vs code
				let messages:Message[] = context.workspaceState.get("chatHistory") ?? []; // data stored only for current session
				messages.push(userMessage);
				let responseText = "";
				try{
					const streamResponse = await Ollama.chat({
						model:selectedModel,
						messages:messages,
						stream:true
					})
					for await (const part of streamResponse){// loop asynchronously
						responseText += part.message.content;
						panel.webview.postMessage({command:"chatResponse", text:responseText})

					}
					panel.webview.postMessage({command:"responseEnd"})
					
					// update chat history
					const systemMessage:Message = {role:"system", content:responseText}
					messages.push(systemMessage);
					context.workspaceState.update("chatHistory", messages);
				} catch(err){
					panel.webview.postMessage({command:'chatResponse', text:`Error: ${String(err)}`});
					panel.webview.postMessage({ command: "responseEnd" });  // Ensure button re-enables on error
				}
			}
		});
		
	});

	context.subscriptions.push(disposable);
}


function getWebviewContent(context: vscode.ExtensionContext):string{
	const filePath = context.asAbsolutePath('src/webview.html');
    return fs.readFileSync(filePath, 'utf8');
}
export function deactivate() {}
