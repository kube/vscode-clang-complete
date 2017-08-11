
      /*#######.
     ########",#:
   #########',##".
  ##'##'## .##',##.
   ## ## ## # ##",#.
    ## ## ## ## ##'
     ## ## ## :##
      ## ## ##*/

import when from 'when-switch'
import { exec } from 'child_process'
import { TextDocument, Position } from 'vscode-languageserver'
import { CompletionItemKind } from 'vscode-languageserver'
import Uri from 'vscode-uri'
import * as path from 'path'


export interface IConfig {
  workspaceRoot: string,
  userFlags: string[]
}

export interface ICompletionItem {
  label: string,
  detail: string,
  kind: CompletionItemKind
}

/**
 * Format Clang detail output to be readable
 */
const formatDetail = (detail: string) =>
  detail ?
    detail
      .replace('#]', ' ')
      .replace(/([<\[]#)|(#>)/g, '')
      .trim()
    : ''

/**
 * Get CompletionItemKind from formatted detail
 * TODO: RegExes need rework and flow needs optimization
 */
const itemKind = (detail: string) =>
  when(detail)
    // is a Macro Function
    .match(/^[^a-z ]+\(.*\)/, CompletionItemKind.Function)
    // is a Function
    .match(/.*\(.*\)/, CompletionItemKind.Function)
    // is an Enum
    .match(/^enum /, CompletionItemKind.Enum)
    // is a Pointer or a Reference
    .match(/.*[*&]+/, CompletionItemKind.Reference)
    // is an Object Macro
    .match(/^[^a-z]+$/, CompletionItemKind.Snippet)
    // is a Type
    .match(/^[^ ()*]+$/, CompletionItemKind.Keyword)
    // is a Variable
    .else(CompletionItemKind.Variable)

/**
 * Get Clang completion output and format it for VSCode
 *
 * TODO: This function would be more optimized with function composition
 * or pipeline on item instead of array
 *
 * TODO: Use stream as input
 */
const completionList = (output: string): ICompletionItem[] =>
  output
    .split('\n')

    // Keep only completion lines
    .filter(line =>
      /^COMPLETION/.test(line))

    // Remove `COMPLETION:` at beginning of line
    .map(line => line.substring(11))

    // Split label and detail
    .map(line => line.split(/:(.+)?/))

    // Array to formatted object
    .map(([label, detail]) => ({
      label: label ? label.trim() : null,
      detail: detail ? detail.trim() : null
    }))

    // Format detail with readable type
    .map(({ label, detail }) => ({
      label,
      detail: formatDetail(detail)
    }))

    // Set itemKind from detail
    .map(({ label, detail }) => ({
      label: label,
      detail: detail,
      kind: itemKind(detail)
    }))

/**
 * Build Clang shell command
 */
const buildCommand =
  (userFlags: string[], position: Position, doc: TextDocument) =>
    [
      'clang',
      '-fsyntax-only',
      ...userFlags,
      `-I${path.dirname(Uri.parse(doc.uri).fsPath)}`,
      doc.languageId === 'c' ? '-x c' : '-x c++',
      '-Xclang',
      `-code-completion-at=-:${position.line + 1}:${position.character + 1}`,
      `-`
    ]
      .join(' ')

/**
 * Helper when checking completion start column
 */
const isDelimiter = (char: string) =>
  '~`!@#$%^&*()-+={}[]|\\\'";:/?<>,. \t\n'.includes(char)

/**
 * Get Clang completion correctly formatted for VSCode
 */
export const getCompletion =
  (config: IConfig, document: TextDocument, position: Position)
    : Promise<ICompletionItem[]> =>

    new Promise(resolve => {
      const text = document.getText()

      // Prevent completion when typing first `:`
      // TODO: Optimize (Use of split will be slow on big files)
      const lineContent = text.split('\n')[position.line]
      let column = position.character

      // Check for scope operator (::)
      // If scope operator not entirely typed return no completion
      if (lineContent.charAt(column - 1) === ':'
        && lineContent.charAt(column - 2) !== ':') {
        return Promise.resolve(null)
      }

      // Get real completion column
      // Clang won't give correct completion if token is already partially typed
      while (column > 0 && !isDelimiter(lineContent.charAt(column - 1))) {
        column--
      }

      const command = buildCommand(config.userFlags, {
        line: position.line,
        character: column
      }, document)
      console.log(command)
      const execOptions = { cwd: config.workspaceRoot }

      const child = exec(command, execOptions, (err, stdout, stderr) => {
        // Omit errors, simply read stdout for clang completions
        console.log(err)
        resolve(completionList(stdout))
      }
      )

      // Pass code to clang via stdin
      child.stdin.end(text)
    })
