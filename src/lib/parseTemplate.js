// Spec 9.1 — upload validation for View 6.
//
// All of this runs in the browser. SheetJS is bundled at build time and no
// part of the file leaves the page.

import { SHEET_NAME, TEMPLATE_HEADERS, TEMPLATE_ROWS } from './questions.js'

export const MAX_FILE_BYTES = 10 * 1024 * 1024

export const MESSAGES = {
  extension:
    'This portal accepts the official template as an Excel workbook (.xlsx) or its CSV export. Please upload one of those.',
  unreadable:
    'We couldn’t read that file. It may be corrupted or password-protected. Try re-saving it and uploading again.',
  sheet:
    'This doesn’t look like the official template — we couldn’t find the ‘Supplier Assessment 2026’ sheet. Download the template above and use that file.',
  headers:
    'This doesn’t look like the official template — the column headings don’t match. Download the template above and use that file.',
  tooLarge:
    'That file is larger than 10 MB. Please upload the completed template, not a document pack.',
  questions: (missing) =>
    `This file doesn’t match the official 2026 template. ${missing} of the 30 questions are missing or have been changed. Download a fresh copy of the template above and transfer your answers into it.`,
}

// Case-insensitive, and blind to leading/trailing whitespace and non-breaking
// spaces. Internal whitespace runs collapse too, because a CSV round-trip
// through a spreadsheet app can rewrap them.
function normalise(value) {
  return String(value ?? '')
    .replace(/ /g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
}

const extensionOf = (name) => {
  const match = /\.([A-Za-z0-9]+)$/.exec(String(name ?? ''))
  return match ? match[1].toLowerCase() : ''
}

// Blob.text() and Blob.arrayBuffer() rather than FileReader, so the parser can
// be exercised outside a browser as well as inside one.
async function readFile(file, asText) {
  return asText ? await file.text() : new Uint8Array(await file.arrayBuffer())
}

// Every .xlsx is a zip archive, so a readable one starts with "PK". A file that
// does not is either corrupted or password-protected — both are check 2.
function hasZipSignature(bytes) {
  return bytes.length > 3 && bytes[0] === 0x50 && bytes[1] === 0x4b
}

// Check 4 — find the header row and the column each heading sits in.
function findHeader(rows) {
  for (let i = 0; i < Math.min(rows.length, 20); i += 1) {
    const cells = rows[i] ?? []
    const positions = {}
    for (const heading of TEMPLATE_HEADERS) {
      const target = normalise(heading)
      const index = cells.findIndex((cell) => normalise(cell) === target)
      if (index === -1) {
        positions.missing = true
        break
      }
      positions[heading] = index
    }
    if (!positions.missing) return { index: i, positions }
  }
  return null
}

// Check 5 — every one of the thirty question texts appears in the QUESTION /
// METRIC column, in the template's order. Matching is on question text alone,
// which is what lets row 23's wrong `S5` section tag through untouched.
function matchQuestions(rows, headerIndex, questionColumn) {
  const matches = []
  const missing = []
  let cursor = headerIndex + 1

  for (const definition of TEMPLATE_ROWS) {
    const target = normalise(definition.templateText)
    let found = -1
    for (let i = cursor; i < rows.length; i += 1) {
      if (normalise((rows[i] ?? [])[questionColumn]) === target) {
        found = i
        break
      }
    }
    if (found === -1) {
      missing.push(definition.id)
    } else {
      matches.push({ definition, rowIndex: found })
      cursor = found + 1
    }
  }

  return { matches, missing }
}

const DECLARATION_LABELS = new Set([
  normalise('Authorised Signatory Name:'),
  normalise('Date (DD Month YYYY):'),
  normalise('Signature / Digital Auth:'),
])

// The shipped template puts labels in the declaration row's response cells, so
// a cell is only a prefill value when it is not one of those labels.
function readDeclaration(rows, positions) {
  const responseColumn = positions['SUPPLIER RESPONSE']
  const notesColumn = positions['NOTES / EVIDENCE']

  for (const row of rows) {
    const first = normalise((row ?? [])[0])
    if (!first.startsWith('declaration')) continue

    const pick = (column) => {
      const raw = String((row ?? [])[column] ?? '').trim()
      return raw && !DECLARATION_LABELS.has(normalise(raw)) ? raw : ''
    }
    return { signatory: pick(responseColumn), date: pick(notesColumn) }
  }
  return { signatory: '', date: '' }
}

/**
 * Validates and parses an uploaded file.
 *
 * Returns either { ok: false, message } — the first failing check's exact
 * message — or { ok: true, answers, notes, declaration }.
 */
export async function parseTemplateFile(file) {
  // Size is checked before anything is read into memory.
  if (file.size > MAX_FILE_BYTES) {
    return { ok: false, message: MESSAGES.tooLarge }
  }

  // Check 1 — extension.
  const extension = extensionOf(file.name)
  if (extension !== 'xlsx' && extension !== 'csv') {
    return { ok: false, message: MESSAGES.extension }
  }
  const isCsv = extension === 'csv'

  // Check 2 — the file can be opened and read.
  let sheetToRows
  let workbook
  try {
    // Imported here rather than at module scope: SheetJS is only needed once a
    // supplier actually chooses a file, so it stays out of the initial bundle.
    const XLSX = await import('xlsx')
    const data = await readFile(file, isCsv)
    if (!isCsv && !hasZipSignature(data)) {
      // SheetJS will happily sniff arbitrary bytes into an empty sheet rather
      // than throwing, which would leak a corrupt file through to check 3.
      throw new Error('not a workbook')
    }
    workbook = isCsv
      ? XLSX.read(data, { type: 'string', raw: true })
      : XLSX.read(data, { type: 'array' })
    if (!workbook?.SheetNames?.length) throw new Error('empty workbook')
    sheetToRows = (sheet) =>
      XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '', blankrows: true, raw: false })
  } catch {
    return { ok: false, message: MESSAGES.unreadable }
  }

  // Check 3 — the sheet name, for .xlsx only. A CSV export carries none.
  let sheet
  if (isCsv) {
    sheet = workbook.Sheets[workbook.SheetNames[0]]
  } else {
    if (!workbook.SheetNames.includes(SHEET_NAME)) {
      return { ok: false, message: MESSAGES.sheet }
    }
    sheet = workbook.Sheets[SHEET_NAME]
  }
  if (!sheet) return { ok: false, message: MESSAGES.unreadable }

  // `header: 1` gives plain arrays rather than objects keyed by file content,
  // and `defval` pads short rows — which is what carries row 12's missing
  // columns E and F through as empty instead of as a structural mismatch.
  let rows
  try {
    rows = sheetToRows(sheet)
  } catch {
    return { ok: false, message: MESSAGES.unreadable }
  }

  // Check 4 — the seven column headings.
  const header = findHeader(rows)
  if (!header) return { ok: false, message: MESSAGES.headers }

  // Check 5 — all thirty question texts, in order.
  const questionColumn = header.positions['QUESTION / METRIC']
  const { matches, missing } = matchQuestions(rows, header.index, questionColumn)
  if (missing.length > 0) {
    return { ok: false, message: MESSAGES.questions(missing.length) }
  }

  // On pass: read column E and column F. Column G (Status) is ignored entirely.
  const responseColumn = header.positions['SUPPLIER RESPONSE']
  const notesColumn = header.positions['NOTES / EVIDENCE']
  const answers = {}
  const notes = {}

  for (const { definition, rowIndex } of matches) {
    const row = rows[rowIndex] ?? []
    answers[definition.id] = String(row[responseColumn] ?? '').trim()
    notes[definition.id] = String(row[notesColumn] ?? '').trim()
  }

  return {
    ok: true,
    answers,
    notes,
    declaration: readDeclaration(rows, header.positions),
  }
}
