# tangleflow-coverage

## Running

```sh
npm run scan                  # new scan, saved to scans/<date>.json
npm run report                # reports/<date>.md from the newest scan
npm run report -- scans/2026-09-21.json
```

`scan` lists every repo on knot1, keeps those with a `.github/workflows`
folder and no `.tangled` folder, runs tangleflow on each workflow file, and
writes one result per file.
