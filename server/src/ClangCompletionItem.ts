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

  private cleanType(type: string): string {
    // Quick and dirty cleaning
    if (!type) {
      return ''
    }
    return type
      .replace('#]', ' ')
      .replace(/([<\[]#)|(#>)/g, '')
      .trim()
  }

  private itemKind(type: string): CompletionItemKind {
    // is a Macro Function?
    if (type.match(/^[^a-z ]+\(.*\)/)) {
      return CompletionItemKind.Function
    }
    // is a Function?
    else if (type.match(/.*\(.*\)/)) {
      return CompletionItemKind.Function
    }
    // is an Enum?
    else if (type.match(/^enum /)) {
      return CompletionItemKind.Enum
    }
    // is a Pointer or a Reference?
    else if (type.match(/.*[*&]+/)) {
      return CompletionItemKind.Reference
    }
    // is an Object Macro?
    else if (type.match(/^[^a-z]+$/)) {
      return CompletionItemKind.Snippet
    }
    // is a Type?
    else if (type.match(/^[^ ()*]+$/)) {
      return CompletionItemKind.Keyword
    }
    // is a Variable
    else {
      return CompletionItemKind.Variable
    }
  }

  build(): CompletionItem {
    return {
      label: this.name,
      detail: this.cleanType(this.type),
      kind: this.itemKind(this.cleanType(this.type))
    }
  }
}
