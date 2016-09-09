import { exec } from 'child_process'
import { TextDocument, Position } from 'vscode-languageserver'
import { completionList } from './completionList'

export interface CompletionServiceParams {
  workspaceRoot: string
  userFlags: string[]
}

export class CompletionService {
  private userFlags: string[]
  private workspaceRoot: string

  constructor(params: CompletionServiceParams) {
    this.userFlags = params.userFlags || []
    this.workspaceRoot = params.workspaceRoot
  }

  private buildCommand(line: number, character: number, languageId: string) {

    let clangFrontend = {
      'c': '-xc',
      'cpp': '-xc++'
    }[languageId]

    return [
      'clang',
      '-cc1']
      .concat(this.userFlags)
      .concat([
        '-fsyntax-only',
        '-code-completion-macros',
        clangFrontend,
        '-code-completion-at',
        `-:${line + 1}:${character + 1}`
      ])
      .join(' ')
  }

  setUserFlags(userFlags: string[]) {
    this.userFlags = userFlags || []
  }

  getCompletion(document: TextDocument, position: Position) {
    let language = document.languageId

    let promise = new Promise(resolve => {
      let command = this.buildCommand(position.line, position.character,
        document.languageId)

      let execOptions = {
        cwd: this.workspaceRoot
      }

      let child = exec(command, execOptions, function (err, stdout, stderr) {
        // Omit errors, simply read stdout for clang completions
        let completions = completionList(stdout.toString())
        resolve(completions)
      })

      // Pass code to clang via stdin
      child.stdin.write(document.getText())
      child.stdin.emit('end')
    })
    return promise
  }
}
