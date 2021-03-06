
      /*#######.
     ########",#:
   #########',##".
  ##'##'## .##',##.
   ## ## ## # ##",#.
    ## ## ## ## ##'
     ## ## ## :##
      ## ## ##*/

import when from 'when-switch'
import { set } from 'monolite'
import { pipe } from 'ramda'
import { exec } from 'child_process'
import { config } from './config'
import { Position, CompletionItemKind } from 'vscode-languageserver'

export type CompletionItem = {
  label: string
  detail: string
  kind: CompletionItemKind
}

/**
 * Format Clang detail output to be readable
 */
export const formatDetail = (detail: string) =>
  detail
    .replace('#]', ' ')
    .replace(/([<\[]#)|(#>)/g, '')
    .trim()

/**
 * Get CompletionItemKind from formatted detail
 * TODO: RegExes need rework and flow needs optimization
 */
export const itemKind = (detail: string) =>
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
 * TODO: Use stream as input
 */
export const completionList = (output: string): CompletionItem[] =>
  output
    .split('\n')
    // Keep only completion lines
    .filter(line => /^COMPLETION/.test(line))
    .map(
      pipe(
        // Remove `COMPLETION:` at beginning of line
        _ => _.substring(11),

        // Split label and detail
        _ => _.split(/:(.+)?/),

        // Array to formatted object
        ([label, detail]) => ({
          label: label ? label.trim() : '',
          detail: detail ? detail.trim() : ''
        }),

        // Format detail with readable type
        $ => set($, _ => _.detail)(formatDetail),

        // Set itemKind from detail
        ({ label, detail }) => ({
          label,
          detail,
          kind: itemKind(detail)
        })
      )
    )

/**
 * Build Clang shell command
 */
export const buildCommand = (position: Position, languageId: string) =>
  [
    'clang',
    '-cc1',
    ...config.userFlags,
    '-fsyntax-only',
    languageId === 'c' ? '-xc' : '-xc++',
    '-code-completion-macros',
    '-code-completion-at',
    `-:${position.line + 1}:${position.character + 1}`
  ].join(' ')

/**
 * Helper when checking completion start column
 */
export const isDelimiter = (char: string) =>
  '~`!@#$%^&*()-+={}[]|\\\'";:/?<>,. \t\n'.includes(char)

/**
 * Get Clang completion correctly formatted for VSCode
 */
export async function getCompletion(
  languageId: string,
  documentContent: string,
  position: Position
): Promise<CompletionItem[]> {
  // Prevent completion when typing first `:`
  // TODO: Optimize (Use of split will be slow on big files)
  const lineContent = documentContent.split('\n')[position.line]
  let column = position.character

  // Check for scope operator (::)
  // If scope operator not entirely typed return no completion
  if (
    lineContent.charAt(column - 1) === ':' &&
    (lineContent.charAt(column - 2) !== ':' || languageId !== 'c++')
  ) {
    return []
  }

  // Get real completion column
  // Clang won't give correct completion if token is already partially typed
  while (column > 0 && !isDelimiter(lineContent.charAt(column - 1))) {
    column--
  }

  const command = buildCommand(
    {
      line: position.line,
      character: column
    },
    languageId
  )
  const execOptions = { cwd: config.workspaceRoot || '' }

  return new Promise<CompletionItem[]>(resolve => {
    const child = exec(command, execOptions, (_err, stdout, stderr) =>
      // Omit errors, simply read stdout for clang completions
      resolve(completionList(stdout))
    )

    // Pass code to clang via stdin
    child.stdin.end(documentContent)
  })
}
