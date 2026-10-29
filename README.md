# tangleflow-coverage

## Running

```sh
npm run coverage:scan         # new scan, saved to coverage/<date>.json
npm run coverage:report       # coverage/README.md from the newest scan
npm run coverage:report -- coverage/2026-09-21.json
```

`coverage:scan` lists every repo on knot1, keeps those with a `.github/workflows`
folder and no `.tangled` folder, runs tangleflow on each workflow file, and
writes one result per file.

```sh
npm run if-usage:scan                                 # new scan, saved to if-usage/<date>.jsonl
npm run if-usage:extract -- if-usage/2026-10-22.jsonl # if-usage/workflows.jsonl from a scan
npm run if-usage:report                               # if-usage/report.md from workflows.jsonl
```

`if-usage:scan` lists every active repo on knot1 and saves each file in its
`.github/workflows` folder. Errors go to `if-usage/<date>-errors.jsonl`.
`if-usage:extract` parses the workflow files and writes one row per workflow
with its job and step `if`s. `if-usage:report` sorts the `if`s into categories
and counts them per job and step level, as a share of all repos with workflows.
