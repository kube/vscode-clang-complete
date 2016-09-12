
      /*#######.
     ########",#:
   #########',##".
  ##'##'## .##',##.
   ## ## ## # ##",#.
    ## ## ## ## ##'
     ## ## ## :##
      ## ## ##*/

'use strict'

import { readFile } from 'fs'
import { join as joinPath, relative as relativePath } from 'path'

import {
  IPCMessageReader, IPCMessageWriter, createConnection, IConnection, TextDocumentSyncKind, TextDocuments, InitializeParams, InitializeResult, CompletionItem
} from 'vscode-languageserver'

import { getCompletion } from './completion'


let connection = createConnection(new IPCMessageReader(process),
  new IPCMessageWriter(process))

let documents = new TextDocuments()
documents.listen(connection)


const config = {
  workspaceRoot: '',
  userFlags: [] as string[]
}

const getFlagsFromClangCompleteFile = (): Promise<string[]> =>
  new Promise(resolve => {
    // Check presence of a .clang_complete file
    let filePath = joinPath(config.workspaceRoot, './.clang_complete')

    readFile(filePath, (err, data) => {
      // If found file set userFlags, else set no flag
      let userFlags = data ? data.toString().split('\n') : []
      resolve(userFlags)
    })
  })

connection.onInitialize((params): Promise<InitializeResult> =>
  new Promise(resolve =>
    getFlagsFromClangCompleteFile()
      .then(userFlags => {

        // Initialize config
        config.userFlags = userFlags
        config.workspaceRoot = params.rootPath

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
  ))

connection.onDidChangeWatchedFiles(notification => {
  // Remove file:// protocol at beginning of uri
  let fileAbsolutePath = notification.changes[0].uri.substring(5)
  let fileRelativePath = relativePath(config.workspaceRoot, fileAbsolutePath)

  // If file is .clang_complete at workspace root
  if (fileRelativePath === '.clang_complete') {
    getFlagsFromClangCompleteFile()
      .then(userFlags =>
        config.userFlags = userFlags)
  }
})

connection.onCompletion(textDocumentPosition => {
  let document = documents.get(textDocumentPosition.textDocument.uri)
  let position = textDocumentPosition.position

  return getCompletion(config, document, position)
})

connection.onCompletionResolve(item => item)

connection.listen()
