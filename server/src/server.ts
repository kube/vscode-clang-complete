
      /*#######.
     ########",#:
   #########',##".
  ##'##'## .##',##.
   ## ## ## # ##",#.
    ## ## ## ## ##'
     ## ## ## :##
      ## ## ##*/

import { join, relative } from 'path'
import { readFile } from './utils'
import { getCompletion } from './completion'
import { config } from './config'
import {
  IPCMessageReader,
  IPCMessageWriter,
  createConnection,
  TextDocuments,
  ServerCapabilities
} from 'vscode-languageserver'

const connection = createConnection(
  new IPCMessageReader(process),
  new IPCMessageWriter(process)
)

const textDocuments = new TextDocuments()
textDocuments.listen(connection)

async function getFlagsFromClangCompleteFile() {
  // Check presence of a .clang_complete file
  const filePath = join(config.workspaceRoot || '', './.clang_complete')

  //TODO: Should check if file exist, and reject error when appropriate
  try {
    return (await readFile(filePath)).toString().split('\n')
  } catch {
    return []
  }
}

connection.onInitialize(async params => {
  setTimeout(() => connection.sendNotification('Hello'), 4000)

  const userFlags = await getFlagsFromClangCompleteFile()

  // Initialize config
  config.userFlags = userFlags
  config.workspaceRoot = params.rootUri
    ? // Remove file:// protocol on rootUri
    params.rootUri.substring(5)
    : ''

  const capabilities: ServerCapabilities = {
    // TextDocument Full-Sync mode
    textDocumentSync: textDocuments.syncKind,

    // Accept completion, and set triggerCharacters
    completionProvider: {
      resolveProvider: true,
      triggerCharacters: ['.', '>', ':']
    }
  }

  return { capabilities }
})

connection.onDidChangeWatchedFiles(async notification => {
  // Remove file:// protocol at beginning of uri
  const fileAbsolutePath = notification.changes[0].uri.substring(5)
  const fileRelativePath = relative(
    config.workspaceRoot || '',
    fileAbsolutePath
  )

  // If file is .clang_complete at workspace root
  if (fileRelativePath === '.clang_complete') {
    config.userFlags = await getFlagsFromClangCompleteFile()
  }
})

connection.onCompletion(async textDocumentPosition => {
  const textDocument = textDocuments.get(textDocumentPosition.textDocument.uri)
  const position = textDocumentPosition.position

  if (textDocument) {
    return getCompletion(
      textDocument.languageId,
      textDocument.getText(),
      position
    )
  } else {
    return []
  }
})

connection.onCompletionResolve(item => item)

connection.listen()
