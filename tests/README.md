# Local test pass

Five suites covering the acceptance criteria in spec Section 13 that can be
checked before deployment. They are deliberately dependency-light: plain Node
scripts, no test framework.

The three browser suites stub the two Supabase calls a submit makes
(`tests/support/supabase-mock.mjs`), so they run offline and deterministically.
That stub is also how acceptance criterion 11 is checked now: the page
legitimately talks to the network from v3.0 on, so the suites no longer assert
"no request leaves the page" — they assert that the requests which do leave
carry no file content, and that nothing *but* Supabase leaves.

`tests/persistence.test.mjs` is the only suite that touches the real database.
It needs a service role key, because the anon key cannot read either table
back — which is the point of the RLS design. It cleans up every row it writes.

Playwright is **not** a project dependency — installing it would add a browser
download to the Netlify build. Install it only when you want to run the browser
suites:

```
npm install --no-save playwright vite-node
npm run build
npx vite preview --port 4173 --strictPort &

npx vite-node tests/parser.test.mjs tests/fixtures   # upload validation, rules, identity gate
node tests/ui.test.mjs  tests/fixtures               # landing page, brand, Path A door two
node tests/ui2.test.mjs tests/fixtures               # Path B, both doors, responsive
node tests/ui3.test.mjs tests/fixtures               # Path A door one, restart, submit failure

# Against the real database (criteria 4, 5, 6, 7, 11, 13):
VITE_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... \
  npx vite-node tests/persistence.test.mjs
```

`npm test` runs the parser suite; `npm run test:ui` runs the three browser
suites.

Set `CHROME_PATH` if Playwright's bundled Chromium is not where it expects it,
for example `CHROME_PATH=/opt/pw-browsers/chromium-1194/chrome-linux/chrome`.
A Playwright version newer than the installed browser build needs this.

`tests/fixtures/` holds files generated from the shipped template: a CSV export,
a filled copy, and five files that must each be rejected with their own message.
Regenerate them from `public/assets/The_Corporate_Supplier_Questionnaire_2026.xlsx`
if the template ever changes.
