#!/usr/bin/env node

const { join } = require('path')
const { execSync } = require('child_process')
const { mkdirp, writeFile, readFile, copy } = require('fs-extra')
const {
  pick,
  intersection,
  pipe,
  removeMarkdownImages,
  removeMarkdownSection
} = require('./lib')

const PROJECT_ROOT = join(__dirname, '..')
const BUNDLE_FOLDER = join(PROJECT_ROOT, 'bundle')
const VSCE_BIN = join(PROJECT_ROOT, 'node_modules/.bin/vsce')
const BUNDLED_FILES = ['build', 'README.md', 'icon.png', '.vscodeignore']

const PACKAGEJSON_PRESERVED_KEYS = [
  'name',
  'displayName',
  'description',
  'author',
  'license',
  'version',
  'publisher',
  'icon',
  'repository',
  'bugs',
  'homepage',
  'engines',
  'categories',
  'activationEvents',
  'main',
  'contributes'
]

const packageJson = require('../package.json')
const webpackConfig = require('../config/webpack.config')
const moduleDependencies = packageJson.dependencies
const externalModules = webpackConfig.externals

const cleanPackageJson = {
  // Remove dev-specific properties
  ...pick(packageJson, PACKAGEJSON_PRESERVED_KEYS),

  // Leave dependencies that are not bundled with Webpack
  // but need to be present in extension package
  dependencies: pick(
    moduleDependencies,
    intersection(Object.keys(moduleDependencies), Object.keys(externalModules))
  )
}

const cleanReadme = async readmePath =>
  pipe(readmePath)(
    _ => readFile(_, 'utf8'),
    removeMarkdownImages,
    removeMarkdownSection('Install'),
    removeMarkdownSection('Development'),
    _ => writeFile(readmePath, _)
  )

const main = async () => {
  await mkdirp(BUNDLE_FOLDER)

  await writeFile(
    join(BUNDLE_FOLDER, 'package.json'),
    JSON.stringify(cleanPackageJson, null, 2)
  )

  for (let fileName of BUNDLED_FILES) {
    const currentPath = join(PROJECT_ROOT, fileName)
    const targetPath = join(BUNDLE_FOLDER, fileName)
    await copy(currentPath, targetPath)
  }

  await cleanReadme(join(BUNDLE_FOLDER, 'README.md'))
  execSync('yarn', { cwd: BUNDLE_FOLDER })
  execSync(`${VSCE_BIN} package`, { cwd: BUNDLE_FOLDER })
}

main()
