/**
 * Common items of two arrays
 * @param {number[]} a
 * @param {number[]} b
 */
exports.intersection = (a, b) =>
  a.reduce(
    (acc, current) => (b.includes(current) ? [...acc, current] : acc),
    []
  )

/**
 * Create new object with only properties that are in keys array
 * @param {{}} obj
 * @param {string[]} keys
 */
exports.pick = (obj, keys) =>
  keys.reduce((acc, current) => ({ ...acc, [current]: obj[current] }), {})

/**
 * Remove images from a Markdown
 * @param {string} source
 */
exports.removeMarkdownImages = source => {
  return source.replace(/<img(\n.*)*>(\n\s*)*/gm, '')
}

/**
 * Remove an entire section given a title from a Markdown
 * @param {string} source
 * @param {string} title
 */
exports.removeMarkdownSection = (title, source) => {
  const SECTION_REGEX = /^(#+)\s*(.*)$/

  return source.split('\n').reduce(
    (context, line) => {
      const match = line.match(SECTION_REGEX)
      const isLineTitle = !!match
      const lineTitle = match && match[2]
      const lineTitleLevel = match && match[1].length

      const justEnteredSection =
        context.inSectionToRemove === false &&
        isLineTitle &&
        lineTitle === title

      const justLeftSection =
        !justEnteredSection &&
        context.inSectionToRemove === true &&
        isLineTitle &&
        lineTitle !== title &&
        lineTitleLevel <= context.sectionTitleLevel

      const inSectionToRemove =
        justEnteredSection || (context.inSectionToRemove && !justLeftSection)

      const sectionTitleLevel = inSectionToRemove
        ? justEnteredSection
          ? lineTitleLevel
          : context.sectionTitleLevel
        : 0

      const output = inSectionToRemove
        ? context.output
        : context.output + line + '\n'

      return {
        output,
        inSectionToRemove,
        sectionTitleLevel
      }
    },
    {
      inSectionToRemove: false,
      sectionTitleLevel: 0,
      output: ''
    }
  ).output
}
