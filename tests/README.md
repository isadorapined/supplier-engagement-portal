# Local test pass

Four suites covering the acceptance criteria in spec Section 13 that can be
checked before deployment. They are deliberately dependency-light: plain Node
scripts, no test framework.

Playwright is **not** a project dependency — installing it would add a browser
download to the Netlify build. Install it only when you want to run the browser
suites:

```
npm install --no-save playwright vite-node
npm run build
npx vite preview --port 4173 --strictPort &

npx vite-node tests/parser.test.mjs tests/fixtures   # upload validation and rules
node tests/ui.test.mjs  tests/fixtures               # landing page, brand, Path A door two
node tests/ui2.test.mjs tests/fixtures               # Path B, both doors, responsive
node tests/ui3.test.mjs tests/fixtures               # Path A door one, nothing retained
```

Set `CHROME_PATH` if Playwright's bundled Chromium is not where it expects it,
for example `CHROME_PATH=/opt/pw-browsers/chromium-1194/chrome-linux/chrome`.

`tests/fixtures/` holds files generated from the shipped template: a CSV export,
a filled copy, and five files that must each be rejected with their own message.
Regenerate them from `public/assets/The_Corporate_Supplier_Questionnaire_2026.xlsx`
if the template ever changes.
