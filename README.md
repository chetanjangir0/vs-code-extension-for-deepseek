# Ollama Hub: GUI for Local Models

[![VS Code Extension](https://img.shields.io/badge/VS%20Code-Extension-brightgreen)](https://marketplace.visualstudio.com/vscode)

A VS Code extension that provides graphical interface for managing and interacting with your local Ollama models(like deepseek) directly within VS Code..

## Usage

1. Open the command palette (`Ctrl+Shift+P` or `Cmd+Shift+P`)
2. Search for and select `chat with ollama hub`
3. Type your message in the text area
4. Select your preferred model from the dropdown
5. Click "Ask" or press `Enter` to send

## Features

- 💬 **Real-time Chat Interface** - Streamlined chat UI within VS Code
- 🚀 **Streaming Responses** - Receive AI responses in real-time
- 📚 **Session History** - Maintains conversation context during VS Code session
- 🤖 **Multi-Model Support** - Switch between different Ollama models
- ⚡ **Lightning Fast** - Optimized for quick interactions
- 🔒 **Local Processing** - Works with locally hosted Ollama instances

## Prerequisites

- [Node.js](https://nodejs.org/) (v16+)
- [VS Code](https://code.visualstudio.com/) (latest version)
- [Ollama](https://ollama.ai/) installed and running locally with at least one model

## Installation

1. Clone the repository:
```bash
git clone https://github.com/chetanjangir0/Ollama-Hub-a-vs-code-extension-.git
cd Ollama-Hub-a-vs-code-extension
```

2. Install dependencies:
```bash
npm install
```

3. Run the extension in development mode:
```bash
npm run watch
```

4. Press `F5` to open a new VS Code window with the extension loaded

**Note:** First response might take longer as Ollama loads the model into memory

## Configuration

Ensure Ollama is running with your preferred models. Popular options:
```bash
ollama pull deepseek
ollama pull llama2
```
