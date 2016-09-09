import { CompletionItem, CompletionItemKind } from 'vscode-languageserver'

export class ClangCompletionItem {
  name: string
  type: string

  constructor(line: string) {
    let info = this.parseLine(line)
    this.name = info.name
    this.type = info.type
  }

  private parseLine(line: string) {
    let splitted = line.split(':')

    let name = splitted[1] ? splitted[1].trim() : null
    let type = splitted[2] ? splitted[2].trim() : null

    return { name, type }
  }

  private formatType(type: string): string {
    // Quick and dirty cleaning
    if (!type) {
      return ''
    }
    return type
      .replace('#]', ' ')
      .replace(/([<\[]#)|(#>)/g, '')
      .trim()
  }

  private getItemKind(type: string): CompletionItemKind {
    if (type.match(/.*\(.*\)/)) {
      return CompletionItemKind.Function
    }
    else if (type.match(/^enum /)) {
      return CompletionItemKind.Enum
    }
    else if (type.match(/^[^ ()*]+$/)) {
      return CompletionItemKind.Keyword
    }
    else {
      return CompletionItemKind.Variable
    }
  }

  build(): CompletionItem {
    return {
      label: this.name,
      detail: this.formatType(this.type),
      kind: this.getItemKind(this.formatType(this.type))
    }
  }
}
