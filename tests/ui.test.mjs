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
  'Why We Are Asking',
  'Two Routes. One Destination.',
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
const overlineColor = await page.evaluate(() => getComputedStyle(document.querySelector('section p')).color)
check('hero overline is Burnt Clay', overlineColor, 'rgb(179, 86, 52)')

// --- Criterion 3: "Go to step 1" scrolls and does nothing else ---
check('scroll starts at top', await page.evaluate(() => window.scrollY) < 10, true)
await page.getByRole('button', { name: 'Go to step 1' }).click()
await page.waitForTimeout(900)
const scrolled = await page.evaluate(() => {
  const target = document.getElementById('two-routes').getBoundingClientRect().top
  return { y: window.scrollY, targetTop: Math.round(target) }
})
check('scrolled down the page', scrolled.y > 300, true)
check('"Two Routes" is at the top of the viewport', Math.abs(scrolled.targetTop) < 40, true)
check('still on the landing page', await page.getByRole('heading', { name: 'Key Resources' }).isVisible(), true)

// --- Criteria 4 and 7: both door choosers ---
await page.getByRole('button', { name: 'Submit EcoVadis Scorecard' }).click()
check('View 2 opens', await page.getByRole('heading', { name: 'EcoVadis Scorecard' }).isVisible(), true)
check('two EcoVadis doors, neither gated',
  await page.getByRole('button', { name: /Upload your scorecard|Enter your scorecard details/ }).count(), 2)

// --- Criterion 6: the nine EcoVadis questions ---
await page.getByRole('button', { name: 'Enter your scorecard details' }).click()
const evLabels = await page.locator('label').allInnerTexts()
check('Q8 spelling corrected', evLabels.some((l) => l.includes('receive a medal in the last cycle')), true)
check('Q9 spelling corrected', evLabels.some((l) => l.includes('receive a badge in the last cycle')), true)
check('no "recieved" anywhere', (await page.content()).includes('recieved'), false)
check('no "cicle" anywhere', (await page.content()).includes('cicle'), false)
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
