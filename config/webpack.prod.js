
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
  watch: false,
  mode: 'production',
  devtool: undefined
}

module.exports = config
