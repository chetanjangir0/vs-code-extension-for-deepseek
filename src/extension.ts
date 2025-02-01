import Ollama from 'ollama';
import * as vscode from 'vscode';

interface Message{
	role:"user" | "system",
	content:string,
}
export function activate(context: vscode.ExtensionContext) {
	console.log('"deepseek-for-vscode" is now active!');

	// Reset chat history when VS Code starts (might change later)
	context.workspaceState.update("chatHistory", []);

	const disposable = vscode.commands.registerCommand('deepseek-for-vscode.chat', async () => {
		const panel = vscode.window.createWebviewPanel(
			'deepseek_chat',
			'Deepseek Chat',
			vscode.ViewColumn.One,
			{
				enableScripts:true,
				retainContextWhenHidden: true // Keeps webview alive even when switching tabs
			}
		)
		panel.webview.html = getWebviewContent();

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
				console.log(messages)
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


function getWebviewContent():string{
	return /*html*/`
	<!DOCTYPE html>
	<html lang="en">

	<head>
		<meta charset="UTF-8">
		<style>
			@import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@300;400;500;600;700&display=swap');

			* {
				color: whitesmoke;
				font-family: "Rajdhani", serif;
				box-sizing: border-box;
			}

			body {
				margin: 1rem;
				background-color: #1a1a1a;
			}

			#prompt {
				background-color: transparent;
				width: 100%;
				outline:none;
				resize: none;
				border: none;
			}
			#promptContainer{
				position:fixed;
				bottom: 0;
				width: 100%;
			}
			#inputBox{
				background-color: #2d2d2d;
				width: 50%;
				text-align: center;
				margin: 0 auto;
				border-radius: 0.4rem;
				padding: 0.6rem 0.6rem 0 0.6rem;
			}
			#askButton{
				display: flex;
				align-items: center;
				justify-content: center;
				border-radius: 50%;
				border: none;
				height: 1.7rem;
				width: 1.7rem;
				cursor: pointer;
				margin-left: 1rem;
			}
			#modelsDropdown{
				width: 8rem;
				height: 1.5rem;
				background-color: #2d2d2d;
				border-radius: 0.3rem;
				border: none;
				text-align: center;
			}
			#modelsDropdown:hover{
				background-color: #1a1a1a;
				cursor: pointer;
			}
			#optionsContainer{
				display: flex;
				align-items: center;
				justify-content: start;
				padding-left: 1rem;
			}

			.response {
				border: 1px solid #ccc;
				margin-top: 1rem;
				padding: 0.5rem;
			}
		</style>
	</head>

	<body>
		<h2>Deepseek for vscode</h2>
		<div id="promptContainer">
			<div id="inputBox">
				<div>
					<textarea id="prompt" rows="3" placeholder="Ask something..."></textarea>
					<div id="optionsContainer">
						<select id="modelsDropdown">
							<option value="" disabled selected>Select a model</option>
							<option value="">Select a model</option>
							<option value="">Select a model</option>
							<option value="">Select a model</option>
						</select>
						<button id="askButton"">
							<svg width="14" height="16" viewBox="0 0 14 16" fill="none" xmlns="http://www.w3.org/2000/svg">
								<path fill-rule="evenodd" clip-rule="evenodd" d="M7 16c-.595 0-1.077-.462-1.077-1.032V1.032C5.923.462 6.405 0 7 0s1.077.462 1.077 1.032v13.936C8.077 15.538 7.595 16 7 16z" fill="#2a2a2a"></path>
								<path fill-rule="evenodd" clip-rule="evenodd" d="M.315 7.44a1.002 1.002 0 0 1 0-1.46L6.238.302a1.11 1.11 0 0 1 1.523 0c.421.403.421 1.057 0 1.46L1.838 7.44a1.11 1.11 0 0 1-1.523 0z" fill="#2a2a2a"></path>
								<path fill-rule="evenodd" clip-rule="evenodd" d="M13.685 7.44a1.11 1.11 0 0 1-1.523 0L6.238 1.762a1.002 1.002 0 0 1 0-1.46 1.11 1.11 0 0 1 1.523 0l5.924 5.678c.42.403.42 1.056 0 1.46z" fill="#2a2a2a"></path>
							</svg>
						</button>
					</div>
				</div>
			</div>
		</div>
		<div id="chatsContainer"></div>
		<script>
			const vscode = acquireVsCodeApi();
			const askBtn = document.getElementById("askButton");
			const dropdown = document.getElementById("modelsDropdown");
			const container = document.getElementById("chatsContainer");
			let currentResponseDiv = null; // track active response div

			askBtn.addEventListener("click", () => {
				const prompt = document.getElementById("prompt").value;
				askBtn.disabled = true;
				vscode.postMessage({ command: "chat", text: prompt, selectedModel: dropdown.value });
			});

			window.addEventListener("message", event => {
				const { command, text, models } = event.data;
				if (command == "chatResponse") {
					if (!currentResponseDiv) {
						currentResponseDiv = document.createElement("div");
						currentResponseDiv.classList.add("response")
						container.appendChild(currentResponseDiv);
					}

					currentResponseDiv.innerText = text;
				} else if (command == "responseEnd") {
					askBtn.disabled = false;
					currentResponseDiv = null // reset for next response
				} else if (command == "modelsList") {
					dropdown.innerHTML = '<option value="" disabled selected>Select a model</option>' + models.map(model => '<option value="' + model + '">' + model + '</option>').join('');
				}
			})
		</script>
	</body>

	</html>
	`
}
export function deactivate() {}
