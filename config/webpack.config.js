
      /*#######.
     ########",#:
   #########',##".
  ##'##'## .##',##.
   ## ## ## # ##",#.
    ## ## ## ## ##'
     ## ## ## :##
      ## ## ##*/

const { join } = require('path')

const PROJECT_ROOT = join(__dirname, '..')
const SOURCE_FOLDER = join(PROJECT_ROOT, 'src')
const BUILD_FOLDER = join(PROJECT_ROOT, 'build')

/**
 * @type {import("webpack").Configuration}
 */
const config = {
  watch: true,
  mode: 'development',
  target: 'node',
  devtool: 'inline-source-map',
  entry: {
    client: join(SOURCE_FOLDER, 'client/index.ts'),
    server: join(SOURCE_FOLDER, 'server/index.ts')
  },
  output: {
    path: BUILD_FOLDER,
    filename: '[name].js',
    libraryTarget: "commonjs2",
    devtoolModuleFilenameTemplate: '[absolute-resource-path]'
  },
  externals: {
    vscode: 'commonjs vscode',
    'vscode-languageclient': 'commonjs vscode-languageclient'
  },
  module: {
    exprContextCritical: false,
    rules: [{ test: /\.ts$/, loader: 'ts-loader' }]
  },
  resolve: {
    extensions: ['.ts', '.js', '.json']
  }
}

module.exports = config
