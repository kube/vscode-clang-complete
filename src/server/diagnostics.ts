
      /*#######.
     ########",#:
   #########',##".
  ##'##'## .##',##.
   ## ## ## # ##",#.
    ## ## ## ## ##'
     ## ## ## :##
      ## ## ##*/

import { when } from 'when-switch'
import { exec } from 'child_process'
import { createRegexMatcher } from './utils'
import { config } from './config'
import { Diagnostic, DiagnosticSeverity, Range } from 'vscode-languageserver'

/**
 * Build Clang shell command
 */
export const buildCommand = (languageId: string) =>
  [
    'clang',
    '-cc1',
    ...config.userFlags,
    '-fsyntax-only',
    languageId === 'c' ? '-xc' : '-xc++'
  ].join(' ')

const getSeverityFromString = (severity: string) =>
  when(severity)
    .is('fatal error', DiagnosticSeverity.Error)
    .is('error', DiagnosticSeverity.Error)
    .is('warning', DiagnosticSeverity.Warning)
    .is('info', DiagnosticSeverity.Information)
    .else(DiagnosticSeverity.Hint)

const getRangeFromString = (rawPosition: string): Range => {
  const [line, character] = rawPosition.split(':').map(x => parseInt(x) - 1)
  return {
    start: { line, character },
    end: { line, character }
  }
}
const matchDiagnostics = createRegexMatcher(
  /(.*):([0-9]+:[0-9]+):\s([a-z\s]+):\s(.*)+/gm
)

export const parseDiagnostics = (stderr: string) =>
  matchDiagnostics(stderr)
    .filter(([, fileName]) => fileName === '<stdin>')
    .map(([, , rawPosition, severity, message]) => ({
      message,
      range: getRangeFromString(rawPosition),
      severity: getSeverityFromString(severity)
    }))

export const requestDiagnostics = (
  languageId: string,
  documentContent: string
) => {
  const command = buildCommand(languageId)
  const execOptions = { cwd: config.workspaceRoot || '' }

  return new Promise<Diagnostic[]>(resolve => {
    const child = exec(command, execOptions, (_err, _stdout, stderr) => {
      resolve(parseDiagnostics(stderr))
    })

    // Pass code to clang via stdin
    child.stdin.end(documentContent)
  })
}
