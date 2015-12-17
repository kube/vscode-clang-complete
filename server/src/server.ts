'use strict'

import { readFile } from 'fs'
import { join } from 'path'
import { exec } from 'child_process'

import {
IPCMessageReader, IPCMessageWriter, createConnection, IConnection, TextDocumentSyncKind, TextDocuments, ITextDocument, InitializeParams, InitializeResult, TextDocumentPosition, CompletionItem, CompletionItemKind
} from 'vscode-languageserver'

import { ClangCompletionItem, ClangCompletionList } from './ClangCompletion'


let connection: IConnection = createConnection(new IPCMessageReader(process), new IPCMessageWriter(process))

let documents: TextDocuments = new TextDocuments()
documents.listen(connection)

let workspaceRoot: string
let userFlags: string[]


connection.onInitialize((params): Promise<InitializeResult> => {
	workspaceRoot = params.rootPath

	let promise = new Promise(function(resolve) {

		// Check presence of a .clang_complete file
		readFile(join(workspaceRoot, './.clang_complete'), function(err, data) {

			// If found store its arguments
			if (!err) {
				userFlags = data.toString().split('\n')
			}

			resolve({
				capabilities: {
					// TextDocument Full-Sync mode
					textDocumentSync: documents.syncKind,

					// Accept completion, and provide triggerCharacters
					completionProvider: {
						resolveProvider: true,
						triggerCharacters: ['.', '>', ':']
					}
				}
			})

		})
	})
	return promise
})


connection.onCompletion((textDocumentPosition): Promise<CompletionItem[]> => {
	let document = documents.get(textDocumentPosition.uri)
	let documentText = document.getText()
	let position = textDocumentPosition.position

	let commandArgs = [
		'clang',
		'-cc1']

	commandArgs = commandArgs.concat(userFlags)

	commandArgs = commandArgs.concat([
		'-fsyntax-only',
		'-xc',
		'-code-completion-at',
		`-:${position.line + 1}:${position.character + 1}`
	])

	let command = commandArgs.join(' ')

	let execOptions = {
		cwd: workspaceRoot
	}

	let promise = new Promise(function(resolve) {
		let child = exec(command, execOptions, function(err, stdout, stderr) {

			// Omit errors, simply read stdout for clang completions
			let completions = new ClangCompletionList(stdout.toString())
			let completionItemsArray = completions.build()

			resolve(completionItemsArray)
		})
		child.stdin.write(documentText)
		child.stdin.emit('end')
	})
	return promise
})


connection.onCompletionResolve(function(item) {
	// Clean detail on resolve
	item.detail = ClangCompletionItem.cleanType(item.detail)
	return item
})

connection.listen()
