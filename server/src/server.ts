
      /*#######.
     ########",#:
   #########',##".
  ##'##'## .##',##.
   ## ## ## # ##",#.
    ## ## ## ## ##'
     ## ## ## :##
      ## ## ##*/

import { readFile } from 'fs'
import { join, relative } from 'path'
import { getCompletion } from './completion'
import {
  IPCMessageReader, IPCMessageWriter,
  createConnection, TextDocuments
} from 'vscode-languageserver'


const connection =
  createConnection(
    new IPCMessageReader(process),
    new IPCMessageWriter(process)
  )

const documents = new TextDocuments()
documents.listen(connection)


const config = {
  workspaceRoot: '',
  userFlags: [] as string[]
}

const getFlagsFromClangCompleteFile = () =>
  new Promise<string[]>(resolve => {

    // Check presence of a .clang_complete file
    const filePath = join(config.workspaceRoot, './.clang_complete')

    //TODO: Should check if file exist, and reject error when appropriate
    readFile(filePath, (err, data) =>
      data ?
        // If found file set userFlags
        resolve(data.toString().split('\n'))
        // Else set no flag
        : resolve([])
    )
  })

connection.onInitialize(params =>
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
  const fileAbsolutePath = notification.changes[0].uri.substring(5)
  const fileRelativePath = relative(config.workspaceRoot, fileAbsolutePath)

  // If file is .clang_complete at workspace root
  if (fileRelativePath === '.clang_complete')
    getFlagsFromClangCompleteFile()
      .then(userFlags =>
        config.userFlags = userFlags
      )
})

connection.onCompletion(textDocumentPosition => {
  const document = documents.get(textDocumentPosition.textDocument.uri)
  const position = textDocumentPosition.position

  return getCompletion(config, document, position)
})

connection.onCompletionResolve(item => item)

connection.listen()
