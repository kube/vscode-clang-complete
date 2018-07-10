
      /*#######.
     ########",#:
   #########',##".
  ##'##'## .##',##.
   ## ## ## # ##",#.
    ## ## ## ## ##'
     ## ## ## :##
      ## ## ##*/

import { workspace, ExtensionContext } from 'vscode'
import {
  LanguageClient,
  LanguageClientOptions,
  ServerOptions,
  TransportKind
} from 'vscode-languageclient'

export function activate(context: ExtensionContext) {
  const serverModule = context.asAbsolutePath('build/server.js')
  const debugOptions = { execArgv: ['--nolazy', '--inspect=6004'] }

  const serverOptions: ServerOptions = {
    run: {
      module: serverModule,
      transport: TransportKind.ipc
    },
    debug: {
      module: serverModule,
      transport: TransportKind.ipc,
      options: debugOptions
    }
  }

  const clientOptions: LanguageClientOptions = {
    // Register server for C and C++ files
    documentSelector: [
      { scheme: 'file', language: 'c' },
      { scheme: 'file', language: 'cpp' }
    ],
    synchronize: {
      configurationSection: 'clangComplete',
      fileEvents: workspace.createFileSystemWatcher('**/.clang_complete')
    }
  }

  const languageClient = new LanguageClient(
    'ClangComplete',
    serverOptions,
    clientOptions
  )

  context.subscriptions.push(languageClient.start())
}
