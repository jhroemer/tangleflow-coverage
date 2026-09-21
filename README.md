# tangled migration scanner

Small prototype for a project that scans tangled repos, finds repos with only a .github folder, runs tangflow on the files in the repo and reports back any errors, and potentially flags repos that can be fully migrated but haven't done so yet.

## Running

```sh
npm run discover                # out/repos.json: candidate repos on knot1, ~40 min
npm run scan                    # scans/<date>.json: one result per workflow file
npm run report [-- <scan>]      # out/report.json: ranked blockers, convertible repos
```

Discovery is separate from scanning so a stored repo set can be rescanned,
for example after a tangleflow upgrade. Every scan writes a dated file under
`scans/`, and the report reads the newest one unless given a path.
