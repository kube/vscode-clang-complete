
      /*#######.
     ########",#:
   #########',##".
  ##'##'## .##',##.
   ## ## ## # ##",#.
    ## ## ## ## ##'
     ## ## ## :##
      ## ## ##*/

import { readFile as readFileAsync } from 'fs'

export const readFile = (filePath: string) =>
  new Promise<Buffer>((resolve, reject) => {
    readFileAsync(filePath, (err, data) => (err ? reject(err) : resolve(data)))
  })

export const createRegexMatcher = (regex: RegExp) => (str: string) => {
  const matches: RegExpMatchArray[] = []

  while (true) {
    const match = regex.exec(str)

    if (match) {
      matches.push(match)
    } else {
      break
    }
  }
  return matches
}
