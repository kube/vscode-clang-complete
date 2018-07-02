
      /*#######.
     ########",#:
   #########',##".
  ##'##'## .##',##.
   ## ## ## # ##",#.
    ## ## ## ## ##'
     ## ## ## :##
      ## ## ##*/

export type Config = {
  workspaceRoot: string | null
  userFlags: string[]
}

export const config: Config = {
  workspaceRoot: null,
  userFlags: []
}
