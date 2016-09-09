import { exec } from 'child_process'
import { TextDocument, Position } from 'vscode-languageserver'
import { completionList } from './completionList'

export interface IConfig {
  workspaceRoot: string,
  userFlags: string[]
}

const buildCommand = (userFlags: string[], position: Position,
  languageId: string) => ['clang', '-cc1']
    .concat(userFlags)
    .concat([
      '-fsyntax-only',
      languageId === 'c' ? '-xc' : '-xc++',
      '-code-completion-macros',
      '-code-completion-at',
      `-:${position.line + 1}:${position.character + 1}`
    ])
    .join(' ')


export const getCompletion = (config: IConfig, document: TextDocument,
  position: Position) =>
  new Promise(resolve => {
    let command = buildCommand(config.userFlags, position, document.languageId)
    let execOptions = { cwd: config.workspaceRoot }

    let child = exec(command, execOptions, (err, stdout, stderr) => {
      // Omit errors, simply read stdout for clang completions
      const text = stdout.toString()

      let completions = completionList(text)
      resolve(completions)
    })

    // Pass code to clang via stdin
    child.stdin.write(document.getText())
    child.stdin.emit('end')
  })
