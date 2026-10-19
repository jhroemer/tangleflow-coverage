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
