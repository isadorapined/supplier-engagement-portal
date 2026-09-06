import { chromium } from 'playwright'
import path from 'node:path'

const DIR = process.argv[2]
const BASE = 'http://localhost:4173'
let failures = 0
const check = (label, actual, expected) => {
  const ok = JSON.stringify(actual) === JSON.stringify(expected)
  if (!ok) failures += 1
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}`)
  if (!ok) console.log(`        expected: ${JSON.stringify(expected)}\n        actual:   ${JSON.stringify(actual)}`)
}

const browser = await chromium.launch({ ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : null) })
const context = await browser.newContext({ viewport: { width: 1280, height: 900 } })
const page = await context.newPage()

// Criterion 19: watch for any request leaving the page after load.
const escaped = []
page.on('request', (r) => {
  const u = r.url()
  if (u.startsWith(BASE) || u.startsWith('data:') || u.startsWith('blob:')) return
  if (u.includes('fonts.googleapis.com') || u.includes('fonts.gstatic.com')) return
  escaped.push(`${r.method()} ${u}`)
})
const consoleErrors = []
page.on('pageerror', (e) => consoleErrors.push(String(e)))

await page.goto(BASE, { waitUntil: 'networkidle' })

// --- Criterion 1: landing page renders in full, in order ---
const headings = await page.locator('h1, h2').allInnerTexts()
check('landing headings in order', headings, [
  'We don’t just manufacture products. We engineer a sustainable future.',
  'Why We Are Asking.',
  'Step 1 — Choose a path.',
  'What Happens Next.',
  'Key Resources',
])
check('four stat figures', await page.locator('dl dt').allInnerTexts(), ['690,000','71%','2045','500+'])
check('four timeline steps', await page.locator('ol > li').count(), 4)
check('three resource cards', await page.getByRole('link', { name: /View Document|View Policy|Contact EHS/ }).count(), 3)
check('mailto is a plain anchor', await page.getByRole('link', { name: 'Contact EHS' }).getAttribute('href'),
  'mailto:sustainability@thecorporate.com?subject=Supplier%20Portal%20Help%20Desk%20Query')
check('View Document points at the PDF', await page.getByRole('link', { name: 'View Document' }).getAttribute('href'),
  '/assets/The_Corporate_Supplier_Code_of_Conduct_2026.pdf')

// --- Criterion 2: brand applied, The Corporate's identity gone ---
const html = await page.content()
const banned = ['Playfair', 'Acid Lime', '#C4F000', '#D6FF3F', 'Ink/Stone/Linen']
check('no v1.0 brand tokens in the markup', banned.filter((b) => html.includes(b)), [])
const bodyFont = await page.evaluate(() => getComputedStyle(document.body).fontFamily)
const h1Font = await page.evaluate(() => getComputedStyle(document.querySelector('h1')).fontFamily)
check('body is Inter', bodyFont.includes('Inter'), true)
check('headings are DM Sans', h1Font.includes('DM Sans'), true)
const bg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor)
check('page background is Mint Cream', bg, 'rgb(238, 244, 240)')
check('v2.0 wording is gone from the build', html.includes('Two Routes'), false)

// --- Criteria 3, 4, 6, 8, 9, 10: the v2.1 visual direction on the landing page ---
const INK = 'rgb(11, 49, 66)'
const MINT = 'rgb(238, 244, 240)'
const SILVER = 'rgb(218, 217, 217)'
const TEAL = 'rgb(55, 102, 62)'
const CLAY = 'rgb(179, 86, 52)'
const BARE = 'rgba(0, 0, 0, 0)'

const hero = await page.evaluate(() => {
  const s = (el) => getComputedStyle(el)
  const band = document.querySelector('h1').closest('section')
  const paras = [...band.querySelectorAll('p')]
  const cards = [...band.querySelectorAll('dl > div')]
  return {
    band: s(band).backgroundColor,
    overline: s(paras[0]).color,
    h1: s(band.querySelector('h1')).color,
    body: s(paras[1]).color,
    cardCount: cards.length,
    cardBg: [...new Set(cards.map((c) => s(c).backgroundColor))],
    cardRounded: cards.every((c) => parseFloat(s(c).borderTopLeftRadius) > 0),
    cardText: [...new Set(cards.flatMap((c) => [s(c.querySelector('dt')).color, s(c.querySelector('dd')).color]))],
    note: [s(paras[2]).color, s(paras[2]).backgroundColor],
    button: s(band.querySelector('button')).backgroundColor,
    darkBands: [...document.querySelectorAll('section')].filter((el) => s(el).backgroundColor === 'rgb(11, 49, 66)').length,
  }
})
check('criterion 3 - hero band is Deep Space Blue', hero.band, INK)
check('criterion 3 - overline is Silver', hero.overline, SILVER)
check('criterion 3 - H1 is Mint Cream', hero.h1, MINT)
check('criterion 3 - hero body is Mint Cream', hero.body, MINT)
check('criterion 3 - Scope 3 note is Mint Cream, bare on the band', hero.note, [MINT, BARE])
check('criterion 3 - the hero is the only dark band', hero.darkBands, 1)
check('criterion 4 - four stat cards', hero.cardCount, 4)
check('criterion 4 - stat cards are Silver and rounded', [hero.cardBg, hero.cardRounded], [[SILVER], true])
check('criterion 4 - figures and labels are Deep Space Blue', hero.cardText, [INK])
check('criterion 5 - Go to step 1 is Burnt Clay', hero.button, CLAY)

const why = await page.evaluate(() => {
  const s = (el) => getComputedStyle(el)
  const h = [...document.querySelectorAll('h2')].find((el) => el.textContent.includes('Why We Are Asking'))
  const section = h.closest('section')
  const paras = [...h.nextElementSibling.children]
  const boxes = paras.map((el) => el.getBoundingClientRect())
  return {
    sectionBg: s(section).backgroundColor,
    overline: s(section.querySelector('p')).color,
    heading: h.textContent,
    count: paras.length,
    borders: [...new Set(paras.map((el) => s(el).borderLeftColor + ' ' + s(el).borderLeftWidth))],
    bgs: [...new Set(paras.map((el) => s(el).backgroundColor))],
    text: [...new Set(paras.map((el) => s(el).color))],
    clipped: paras.some((el) => el.scrollHeight > el.clientHeight + 1),
    overlapping: boxes.some((b, i) => i > 0 && b.top < boxes[i - 1].bottom),
  }
})
check('criterion 6 - section is Silver', why.sectionBg, SILVER)
check('criterion 6 - overline is Deep Teal', why.overline, TEAL)
check('criterion 6 - heading carries a full stop', why.heading, 'Why We Are Asking.')
check('criterion 6 - three paragraphs', why.count, 3)
check('criterion 6 - thick Deep Teal left border', why.borders, [TEAL + ' 4px'])
check('criterion 6 - paragraphs sit directly on Silver, no card', why.bgs, [BARE])
check('criterion 6 - paragraph text is Deep Space Blue', why.text, [INK])
check('criterion 6 - nothing clipped or overlapping', [why.clipped, why.overlapping], [false, false])

const paths = await page.evaluate(() => {
  const s = (el) => getComputedStyle(el)
  const section = document.getElementById('step-1')
  const cards = [...section.querySelectorAll('div.grid > div')]
  return {
    sectionBg: s(section).backgroundColor,
    count: cards.length,
    bg: [...new Set(cards.map((c) => s(c).backgroundColor))],
    rounded: cards.every((c) => parseFloat(s(c).borderTopLeftRadius) > 0),
    overlines: cards.map((c) => c.querySelector('p').textContent),
    overlineColor: [...new Set(cards.map((c) => s(c.querySelector('p')).color))],
    heading: [...new Set(cards.map((c) => s(c.querySelector('h3')).color))],
    body: [...new Set(cards.map((c) => s(c.querySelectorAll('p')[1]).color))],
    button: [...new Set(cards.map((c) => s(c.querySelector('button')).backgroundColor))],
  }
})
check('criterion 8 - path section is Mint Cream', paths.sectionBg, MINT)
check('criterion 8 - two Deep Space Blue rounded cards', [paths.count, paths.bg, paths.rounded], [2, [INK], true])
check('criterion 8 - overlines read Path A and Path B', paths.overlines, ['Path A', 'Path B'])
check('criterion 8 - overlines are Silver', paths.overlineColor, [SILVER])
check('criterion 8 - headings Mint Cream, body Silver', [paths.heading, paths.body], [[MINT], [SILVER]])
check('criterion 13 - path card buttons are Burnt Clay', paths.button, [CLAY])

const timeline = await page.evaluate(() => {
  const step = document.querySelector('ol > li')
  const s = getComputedStyle(step)
  return {
    resting: s.backgroundColor,
    duration: s.transitionDuration,
    number: getComputedStyle(step.querySelector('p')).color,
  }
})
check('criterion 9 - timeline transitions over ~200ms', timeline.duration, '0.2s')
check('criterion 9 - the resting step is not already Silver', timeline.resting === SILVER, false)
check('criterion 9 - the step number keeps its colour', timeline.number, CLAY)

check('criterion 10 - Key Resources closes with a full stop', html.includes('Everything you need.'), true)

// --- Criterion 3: "Go to step 1" scrolls and does nothing else ---
check('scroll starts at top', await page.evaluate(() => window.scrollY) < 10, true)
await page.getByRole('button', { name: 'Go to step 1' }).click()
await page.waitForTimeout(900)
const scrolled = await page.evaluate(() => {
  const target = document.getElementById('step-1').getBoundingClientRect().top
  return { y: window.scrollY, targetTop: Math.round(target) }
})
check('scrolled down the page', scrolled.y > 300, true)
check('"Step 1" is at the top of the viewport', Math.abs(scrolled.targetTop) < 40, true)
check('still on the landing page', await page.getByRole('heading', { name: 'Key Resources' }).isVisible(), true)

// --- Criteria 4 and 7: both door choosers ---
await page.getByRole('button', { name: 'Submit EcoVadis Scorecard' }).click()
check('View 2 opens', await page.getByRole('heading', { name: 'EcoVadis Scorecard' }).isVisible(), true)
check('two EcoVadis doors, neither gated',
  await page.getByRole('button', { name: /Upload your scorecard|Enter your scorecard details/ }).count(), 2)

const doors = await page.evaluate(() => {
  const s = (el) => getComputedStyle(el)
  const cards = [...document.querySelectorAll('main div.grid > div')]
  return {
    count: cards.length,
    bg: [...new Set(cards.map((c) => s(c).backgroundColor))],
    overline: [...new Set(cards.map((c) => s(c.querySelector('p')).color))],
    heading: [...new Set(cards.map((c) => s(c.querySelector('h3')).color))],
    body: [...new Set(cards.map((c) => s(c.querySelectorAll('p')[1]).color))],
    button: [...new Set(cards.map((c) => s(c.querySelector('button')).backgroundColor))],
  }
})
check('criterion 11 - door cards match the path cards', doors,
  { count: 2, bg: [INK], overline: [SILVER], heading: [MINT], body: [SILVER], button: [CLAY] })

// --- Criterion 6: the nine EcoVadis questions ---
await page.getByRole('button', { name: 'Enter your scorecard details' }).click()
const evLabels = await page.locator('label').allInnerTexts()
check('Q8 spelling corrected', evLabels.some((l) => l.includes('receive a medal in the last cycle')), true)
check('Q9 spelling corrected', evLabels.some((l) => l.includes('receive a badge in the last cycle')), true)
check('no "recieved" anywhere', (await page.content()).includes('recieved'), false)
check('no "cicle" anywhere', (await page.content()).includes('cicle'), false)
const form = await page.evaluate(() => {
  const s = (el) => getComputedStyle(el)
  const controls = [...document.querySelectorAll('main input, main select, main textarea')]
  const panels = [...document.querySelectorAll('main > div.rounded-lg')]
  return {
    panels: [...new Set(panels.map((el) => s(el).backgroundColor))],
    bg: [...new Set(controls.map((el) => s(el).backgroundColor))],
    text: [...new Set(controls.map((el) => s(el).color))],
    bottom: [...new Set(controls.map((el) => s(el).borderBottomColor + ' ' + s(el).borderBottomWidth))],
    sides: [...new Set(controls.flatMap((el) => [s(el).borderTopWidth, s(el).borderLeftWidth, s(el).borderRightWidth]))],
    shadow: [...new Set(controls.map((el) => s(el).boxShadow))],
    labels: [...new Set([...document.querySelectorAll('main label')].map((el) => s(el).color))],
    requiredTag: s(document.querySelector('main label span')).color,
  }
})
check('criterion 12 - form panels are Silver', form.panels, [SILVER])
check('criterion 12 - fields are Mint Cream with Deep Space Blue text', [form.bg, form.text], [[MINT], [INK]])
check('criterion 12 - Deep Teal bottom border only', form.bottom, [TEAL + ' 2px'])
check('criterion 12 - nothing on the other three sides', form.sides, ['0px'])
check('criterion 12 - no box shadow on any field', form.shadow, ['none'])
check('criterion 12 - labels are Deep Space Blue', form.labels, [INK])
check('criterion 12 - (required) is Burnt Clay', form.requiredTag, CLAY)

const buttons = await page.evaluate(() => {
  const s = (el) => getComputedStyle(el)
  const byName = (name) => [...document.querySelectorAll('button')].find((b) => b.textContent.trim() === name)
  return {
    submit: s(byName('Submit')).backgroundColor,
    backBg: s(byName('Back')).backgroundColor,
    backText: s(byName('Back')).color,
  }
})
check('criterion 13 - Submit is Deep Teal', buttons.submit, TEAL)
check('criterion 13 - Back is plain Deep Space Blue text', [buttons.backBg, buttons.backText], [BARE, INK])

const medalOptions = await page.locator('#ev-Q8 option').allInnerTexts()
check('medal option set', medalOptions.slice(1), ['None','Bronze','Silver','Gold','Platinum'])
const badgeOptions = await page.locator('#ev-Q9 option').allInnerTexts()
check('badge option set', badgeOptions.slice(1), ['None','Committed','Other'])

// Criterion 20: the notice, worded exactly.
const NOTICE = 'Your answers stay in your browser. This portal does not store, transmit, or email anything you enter. Closing this tab clears it.'
check('notice above the submit control', (await page.content()).includes(NOTICE), true)

// Gating, then a real submission through this door.
await page.getByRole('button', { name: 'Submit', exact: true }).click()
check('blocked submission names the fields', await page.getByRole('alert').isVisible(), true)
const alertStyle = await page.evaluate(() => {
  const s = getComputedStyle(document.querySelector('[role="alert"]'))
  return { color: s.color, bg: s.backgroundColor, border: s.borderTopWidth }
})
check('criterion 12 - validation is Burnt Clay text with no panel', alertStyle,
  { color: CLAY, bg: BARE, border: '0px' })
await page.fill('#evf-company', 'Northwind Components GmbH')
await page.fill('#evf-name', 'Marta Vogel')
await page.fill('#evf-title', 'Head of Sustainability')
await page.fill('#evf-email', 'marta.vogel@northwind-components.de')
await page.fill('#ev-Q1', '2026-02-11')
await page.fill('#ev-Q2', '2027-02-11')
await page.fill('#ev-Q3', '68')
await page.fill('#ev-Q4', '71')
await page.selectOption('#ev-Q8', 'Silver')
await page.getByRole('button', { name: 'Submit', exact: true }).click()

// --- Criterion 18: the confirmation screen ---
check('confirmation opens', await page.getByRole('heading', { name: 'Submission complete.' }).isVisible(), true)
const summary = await page.locator('dl > div').allInnerTexts()
const summaryText = summary.join('\n')
check('shows the path', summaryText.includes('EcoVadis Scorecard'), true)
check('shows the door', summaryText.includes('Filled in here'), true)
check('shows the company', summaryText.includes('Northwind Components GmbH'), true)
check('shows the contact email', summaryText.includes('marta.vogel@northwind-components.de'), true)
check('counts 5 of 9 answered', summaryText.includes('5 of 9'), true)
check('timestamp formatted', /\d{1,2} \w+ \d{4}, \d{2}:\d{2}/.test(summaryText), true)
check('notice on the confirmation screen', (await page.content()).includes(NOTICE), true)
check('deadline restated', (await page.content()).includes('30 September 2026'), true)

// --- Criterion 21: "Start another submission" clears everything ---
await page.getByRole('button', { name: 'Start another submission' }).click()
await page.getByRole('button', { name: 'Submit EcoVadis Scorecard' }).click()
await page.getByRole('button', { name: 'Enter your scorecard details' }).click()
check('company field cleared', await page.inputValue('#evf-company'), '')
check('score cleared', await page.inputValue('#ev-Q3'), '')
check('medal cleared', await page.inputValue('#ev-Q8'), '')

console.log(`\n--- requests that left the page: ${escaped.length ? escaped.join(', ') : 'none'}`)
check('criterion 19 — nothing left the page', escaped, [])
check('no page errors', consoleErrors, [])

await browser.close()
console.log(failures === 0 ? '\nAll UI checks passed.' : `\n${failures} check(s) failed.`)
process.exit(failures === 0 ? 0 : 1)
