
      /*#######.
     ########",#:
   #########',##".
  ##'##'## .##',##.
   ## ## ## # ##",#.
    ## ## ## ## ##'
     ## ## ## :##
      ## ## ##*/

const baseConfig = require('./webpack.config')

/**
 * @type {import("webpack").Configuration}
 */
const config = {
  ...baseConfig,
  mode: 'production',
  devtool: undefined
}

module.exports = config
