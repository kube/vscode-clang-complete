import { CompletionItemKind } from 'vscode-languageserver'

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
 * TODO: RegExes need rework and flow optimization
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
export const completionList = (output: string) =>
  output
    .split('\n')

    // Keep only completion lines
    .filter(line =>
      line.match(/^COMPLETION/))

    // Remove `COMPLETION:` at beginning of line
    .map(line => line.substring(11))

    // Split label and detail
    .map(line => line.split(':'))

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
