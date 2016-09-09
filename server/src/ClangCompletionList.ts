import { CompletionItem } from 'vscode-languageserver'
import { ClangCompletionItem } from './ClangCompletionItem'

function isCompletionLine(line) {
  return line.match(/^COMPLETION:/)
}

export class ClangCompletionList {
  private completions: Array<ClangCompletionItem> = []

  constructor(clangOutput: string) {
    let lines = clangOutput.split('\n')

    this.completions = lines
      .filter(line =>
        isCompletionLine(line))
      .map(line =>
        new ClangCompletionItem(line))
  }

  build(): CompletionItem[] {
    return this.completions
      .map(completion =>
        completion.build())
  }
}
