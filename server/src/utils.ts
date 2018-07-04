
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
