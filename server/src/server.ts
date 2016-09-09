'use strict'

import { readFile } from 'fs'
import { join as joinPath, relative as relativePath } from 'path'

import {
  IPCMessageReader, IPCMessageWriter, createConnection, IConnection, TextDocumentSyncKind, TextDocuments, InitializeParams, InitializeResult, CompletionItem
} from 'vscode-languageserver'

import { ClangCompletionService } from './ClangCompletionService'


let connection: IConnection = createConnection(new IPCMessageReader(process), new IPCMessageWriter(process))

let documents: TextDocuments = new TextDocuments()
documents.listen(connection)

let workspaceRoot: string
let completionService: ClangCompletionService


function getFlagsFromClangCompleteFile(): Promise<string[]> {
  let promise = new Promise(resolve => {

    // Check presence of a .clang_complete file
    let filePath = joinPath(workspaceRoot, './.clang_complete')

    readFile(filePath, (err, data) => {
      // If found file set userFlags, else set no flag
      let userFlags = data ? data.toString().split('\n') : []
      resolve(userFlags)
    })
  })
  return promise
}


connection.onInitialize((params): Promise<InitializeResult> => {
  workspaceRoot = params.rootPath

  let promise = new Promise(resolve => {

    getFlagsFromClangCompleteFile()
      .then(userFlags => {

        // Initialize Completion Service
        completionService = new ClangCompletionService({
          userFlags,
          workspaceRoot
        })

        resolve({
          capabilities: {
            // TextDocument Full-Sync mode
            textDocumentSync: documents.syncKind,

            // Accept completion, and set triggerCharacters
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

connection.onDidChangeWatchedFiles(notification => {
  // Remove file:// protocol at beginning of uri
  let fileAbsolutePath = notification.changes[0].uri.replace(/^file:\/\//, '')
  let fileRelativePath = relativePath(workspaceRoot, fileAbsolutePath)

  // If file is .clang_complete at workspace root
  if (fileRelativePath === '.clang_complete') {
    getFlagsFromClangCompleteFile()
      .then(userFlags =>
        completionService.setUserFlags(userFlags))
  }
})

connection.onCompletion((textDocumentPosition): Promise<CompletionItem[]> => {
  let document = documents.get(textDocumentPosition.textDocument.uri)
  let position = textDocumentPosition.position

  return completionService.getCompletion(document, position)
})

connection.listen()
