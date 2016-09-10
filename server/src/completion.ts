import { exec } from 'child_process'
import { TextDocument, Position } from 'vscode-languageserver'
import { CompletionItemKind } from 'vscode-languageserver'

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
  detail ? detail
    .replace('#]', ' ')
    .replace(/([<\[]#)|(#>)/g, '')
    .trim()
    : ''

/**
 * Get CompletionItemKind from formatted detail
 * TODO: RegExes need rework and flow needs optimization
 */
const itemKind = (detail: string) =>
  // is a Macro Function?
  detail.match(/^[^a-z ]+\(.*\)/) ?
    CompletionItemKind.Function
    // is a Function?
    : detail.match(/.*\(.*\)/) ?
      CompletionItemKind.Function
      // is an Enum?
      : detail.match(/^enum /) ?
        CompletionItemKind.Enum
        // is a Pointer or a Reference?
        : detail.match(/.*[*&]+/) ?
          CompletionItemKind.Reference
          // is an Object Macro?
          : detail.match(/^[^a-z]+$/) ?
            CompletionItemKind.Snippet
            // is a Type?
            : detail.match(/^[^ ()*]+$/) ?
              CompletionItemKind.Keyword
              // is a Variable
              : CompletionItemKind.Variable

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
      line.match(/^COMPLETION/))

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

/**
 * Helper when checking completion start column
 */
const isDelimiter = (char: string) =>
  '~`!@#$%^&*()-+={}[]|\\\'";:/?<>,. \t\n'.indexOf(char) !== -1

/**
 * Get Clang completion correctly formatted for VSCode
 */
export const getCompletion = (config: IConfig, document: TextDocument,
  position: Position): Promise<ICompletionItem[]> =>
  new Promise(resolve => {
    let text = document.getText()

    // Prevent completion when typing first `:`
    // TODO: Optimize (Use of split will be slow on big files)
    let lineContent = text.split('\n')[position.line]
    let column = position.character

    // Check for scope operator (::)
    // If scope operator not entirely typed return no completion
    if (lineContent[column - 1] === ':'
      && lineContent[column - 2] !== ':') {
      return Promise.resolve(null)
    }

    let command = buildCommand(config.userFlags, {
      line: position.line,
      character: column
    }, document.languageId)
    let execOptions = { cwd: config.workspaceRoot }

    let child = exec(command, execOptions, (err, stdout, stderr) => {
      // Omit errors, simply read stdout for clang completions
      let completions = completionList(stdout.toString())
      resolve(completions)
    })

    // Pass code to clang via stdin
    child.stdin.write(text)
    child.stdin.emit('end')
  })
