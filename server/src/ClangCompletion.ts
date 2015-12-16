import {CompletionItem, CompletionItemKind} from 'vscode-languageserver'

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

	static cleanType(type: string): string {
		// Quick and dirty cleaning
		return type
			.replace('#]', ' ')
			.replace(/([<\[]#)|(#>)/g, '')
			.trim()
	}
}


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
		var completionItemsArray = []

		this.completions
			.forEach(completion =>
				completionItemsArray.push({
					label: completion.name,
					detail: completion.type,
					kind: CompletionItemKind.Function,
					data: completionItemsArray.length + 1
				}))
		return completionItemsArray
	}
}