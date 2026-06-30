const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
const stripHtmlText = (html) => html.replace(/(<([^>]+)>)/g, '')

const collectSearchResults = (slides, keyword, modifier) => {
  if (!keyword) return []
  const textList = []
  const matchRegex = new RegExp(escapeRegExp(keyword), modifier)

  for (const slide of slides) {
    for (const el of slide.elements) {
      if (el.type === 'text') {
        const text = stripHtmlText(el.content)
        const rets = text.match(matchRegex)
        rets && textList.push(...new Array(rets.length).fill({
          slideId: slide.id,
          elId: el.id,
          elType: el.type,
        }))
      }
      else if (el.type === 'shape' && el.text?.content) {
        const text = stripHtmlText(el.text.content)
        const rets = text.match(matchRegex)
        rets && textList.push(...new Array(rets.length).fill({
          slideId: slide.id,
          elId: el.id,
          elType: el.type,
        }))
      }
    }
  }

  return textList
}

const getOccurrenceInElement = (results, resultIndex) => {
  const target = results[resultIndex]
  if (!target) return 0

  let occurrence = 0
  for (let i = 0; i < resultIndex; i++) {
    const item = results[i]
    if (item.slideId !== target.slideId || item.elId !== target.elId) continue
    if (target.elType !== 'table' && item.elType !== 'table') occurrence++
  }
  return occurrence
}

const replaceNthInString = (content, keyword, nth, replacement, modifier) => {
  const regex = new RegExp(escapeRegExp(keyword), modifier)
  let count = 0
  return content.replace(regex, (match) => {
    if (count === nth) {
      count++
      return replacement
    }
    count++
    return match
  })
}

const slides = [
  {
    id: 'slide-1',
    elements: [{ id: 'el-1', type: 'text', content: '<p>新年IT核心绩效</p>' }],
  },
  {
    id: 'slide-2',
    elements: [
      { id: 'el-2', type: 'text', content: '<p>总结新年成果与计划</p>' },
      { id: 'el-3', type: 'shape', text: { content: '<p>新年新气象</p>' } },
    ],
  },
]

const results = collectSearchResults(slides, '新年', 'g')
console.assert(results.length === 3, `expected 3 matches, got ${results.length}`)
console.assert(results[0].slideId === 'slide-1', 'first match should be slide-1')
console.assert(results[1].slideId === 'slide-2', 'second match should be slide-2')
console.assert(results[2].elId === 'el-3', 'third match should be shape element')

const occurrence = getOccurrenceInElement(results, 2)
console.assert(occurrence === 0, `shape first match occurrence should be 0, got ${occurrence}`)

const replaced = replaceNthInString(
  '<p>总结新年成果与新年计划</p>',
  '新年',
  1,
  '明年',
  'g',
)
console.assert(
  replaced === '<p>总结新年成果与明年计划</p>',
  `replace nth failed: ${replaced}`,
)

console.log('verify-search: all assertions passed')
