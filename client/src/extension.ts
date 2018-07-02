
      /*#######.
     ########",#:
   #########',##".
  ##'##'## .##',##.
   ## ## ## # ##",#.
    ## ## ## ## ##'
     ## ## ## :##
      ## ## ##*/

'use strict'

import { join } from 'path'
import { workspace, Disposable, ExtensionContext } from 'vscode'
import {
  LanguageClient,
  LanguageClientOptions,
  SettingMonitor,
  ServerOptions,
  TransportKind
} from 'vscode-languageclient'

export function activate(context: ExtensionContext) {
  const serverModule = context.asAbsolutePath(join('server', 'server.js'))
  const debugOptions = { execArgv: ['--nolazy', '--debug=6004'] }

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
    documentSelector: ['c', 'cpp'],
    synchronize: {
      configurationSection: 'clangComplete',
      fileEvents: workspace.createFileSystemWatcher('**/.clang_complete')
    }
  }

  const disposable = new LanguageClient(
    'ClangComplete',
    serverOptions,
    clientOptions
  ).start()

  context.subscriptions.push(disposable)
}
