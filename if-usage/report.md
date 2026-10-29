## overview

|                            | count        |
| -------------------------- | ------------ |
| repos with workflows       | 2660         |
| repos with at least one if | 1149 (43.2%) |
| ifs                        | 8206         |
| unparseable ifs            | 4            |

## categories

| category            | level | ifs  | repos | % of repos |
| ------------------- | ----- | ---- | ----- | ---------- |
| trigger or ref      | job   | 1335 | 522   | 19.6%      |
| trigger or ref      | step  | 929  | 372   | 14.0%      |
| status function     | job   | 397  | 151   | 5.7%       |
| status function     | step  | 1229 | 317   | 11.9%      |
| earlier step result | step  | 1363 | 352   | 13.2%      |
| configuration       | job   | 254  | 60    | 2.3%       |
| configuration       | step  | 878  | 132   | 5.0%       |
| matrix              | step  | 1035 | 204   | 7.7%       |
| earlier job result  | job   | 822  | 207   | 7.8%       |
| earlier job result  | step  | 132  | 45    | 1.7%       |
| repo or actor guard | job   | 873  | 243   | 9.1%       |
| repo or actor guard | step  | 42   | 19    | 0.7%       |
| runner              | step  | 349  | 67    | 2.5%       |
| other               | job   | 9    | 3     | 0.1%       |
| other               | step  | 26   | 9     | 0.3%       |
| constant            | job   | 8    | 8     | 0.3%       |
| constant            | step  | 3    | 3     | 0.1%       |

## trigger or ref, job level

| ifs | shape                                                                                                                                                                                                                                                                                                                                  |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 60  | `startswith(github.ref, ?)`                                                                                                                                                                                                                                                                                                            |
| 51  | `github.event_name == ?`                                                                                                                                                                                                                                                                                                               |
| 43  | `always() && (needs.*.outputs.* == ? \|\| (github.event_name == ? && inputs.*))`                                                                                                                                                                                                                                                       |
| 42  | `needs.*.outputs.* == ? && github.event_name != ?`                                                                                                                                                                                                                                                                                     |
| 38  | `github.ref == ?`                                                                                                                                                                                                                                                                                                                      |
| 32  | `(github.event_name == ? && contains(github.event.comment.body, ?)) \|\| (github.event_name == ? && contains(github.event.comment.body, ?)) \|\| (github.event_name == ? && contains(github.event.review.body, ?)) \|\| (github.event_name == ? && (contains(github.event.issue.body, ?) \|\| contains(github.event.issue.title, ?)))` |
| 30  | `!github.event.pull_request.merged && contains(github.event.pull_request.labels.*.name, ?)`                                                                                                                                                                                                                                            |
| 30  | `(github.event.action == ? && github.event.label.name == ?) \|\| (github.event.action == ? && contains(github.event.pull_request.labels.*.name, ?))`                                                                                                                                                                                   |
| 30  | `!github.event.repository.is_template`                                                                                                                                                                                                                                                                                                 |
| 23  | `!contains(github.event.head_commit.message, ?)`                                                                                                                                                                                                                                                                                       |

## trigger or ref, step level

| ifs | shape                                       |
| --- | ------------------------------------------- |
| 244 | `github.event_name == ?`                    |
| 160 | `github.event_name != ?`                    |
| 58  | `github.ref == ?`                           |
| 53  | `startswith(github.ref, ?)`                 |
| 44  | `github.event.release.prerelease == false`  |
| 44  | `github.event.release.prerelease == true`   |
| 24  | `github.event_name == ? && github.ref == ?` |
| 22  | `always() && github.event_name == ?`        |
| 12  | `github.event_name != ? && vars.* != ?`     |
| 11  | `github.ref != ?`                           |

## status function, job level

| ifs | shape                                                                                                                                                                                                  |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 120 | `always()`                                                                                                                                                                                             |
| 43  | `always() && (needs.*.outputs.* == ? \|\| (github.event_name == ? && inputs.*))`                                                                                                                       |
| 24  | `failure()`                                                                                                                                                                                            |
| 15  | `!cancelled() && needs.*.result == ?`                                                                                                                                                                  |
| 14  | `always() && needs.*.result == ?`                                                                                                                                                                      |
| 10  | `always() && needs.*.result == ? && (needs.*.result == ? \|\| needs.*.result == ?)`                                                                                                                    |
| 10  | `always() && (needs.*.result == ? \|\| needs.*.result == ?)`                                                                                                                                           |
| 9   | `!cancelled()`                                                                                                                                                                                         |
| 9   | `always() && (github.ref == ? \|\| github.ref == ?) && (needs.*.outputs.* == ? \|\| (github.event_name == ? && inputs.*)) && needs.*.result == ? && (needs.*.result == ? \|\| needs.*.outputs.* != ?)` |
| 8   | `(github.repository_owner == ? \|\| github.repository_owner == ?) && always()`                                                                                                                         |

## status function, step level

| ifs | shape                                                 |
| --- | ----------------------------------------------------- |
| 672 | `always()`                                            |
| 197 | `failure()`                                           |
| 51  | `!cancelled()`                                        |
| 29  | `success()`                                           |
| 28  | `always() && steps.*.outputs.* == ?`                  |
| 22  | `always() && github.event_name == ?`                  |
| 22  | `always() && !cancelled()`                            |
| 19  | `failure() && steps.*.outcome == ?`                   |
| 18  | `success() && steps.*.outputs.* != steps.*.outputs.*` |
| 13  | `steps.*.outputs.* != ? && success()`                 |

## earlier step result, step level

| ifs | shape                                                 |
| --- | ----------------------------------------------------- |
| 545 | `steps.*.outputs.* == ?`                              |
| 259 | `steps.*.outputs.* != ?`                              |
| 88  | `!steps.*.outputs.*`                                  |
| 70  | `steps.*.outcome == ?`                                |
| 42  | `steps.*.outputs.*`                                   |
| 28  | `steps.*.outputs.* == ? && steps.*.outputs.* == ?`    |
| 28  | `always() && steps.*.outputs.* == ?`                  |
| 25  | `!steps.*.outputs.* && !steps.*.outputs.*`            |
| 19  | `failure() && steps.*.outcome == ?`                   |
| 18  | `success() && steps.*.outputs.* != steps.*.outputs.*` |

## configuration, job level

| ifs | shape                                                                                                                                                                                                  |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 43  | `always() && (needs.*.outputs.* == ? \|\| (github.event_name == ? && inputs.*))`                                                                                                                       |
| 22  | `inputs.*`                                                                                                                                                                                             |
| 15  | `inputs.* == ? \|\| inputs.* == ?`                                                                                                                                                                     |
| 14  | `inputs.* != ? && needs.*.outputs.* && github.repository == ?`                                                                                                                                         |
| 12  | `inputs.* == ?`                                                                                                                                                                                        |
| 9   | `always() && (github.ref == ? \|\| github.ref == ?) && (needs.*.outputs.* == ? \|\| (github.event_name == ? && inputs.*)) && needs.*.result == ? && (needs.*.result == ? \|\| needs.*.outputs.* != ?)` |
| 7   | `!contains(vars.*, ?)`                                                                                                                                                                                 |
| 6   | `needs.*.outputs.* == ? && !inputs.*`                                                                                                                                                                  |
| 6   | `github.event_name != ? && (vars.* != ? \|\| vars.* != ?)`                                                                                                                                             |
| 5   | `!inputs.*`                                                                                                                                                                                            |

## configuration, step level

| ifs | shape                            |
| --- | -------------------------------- |
| 138 | `env.* == ?`                     |
| 121 | `env.* != ?`                     |
| 102 | `inputs.* == ?`                  |
| 67  | `vars.* != ?`                    |
| 54  | `inputs.*`                       |
| 47  | `inputs.* != ?`                  |
| 35  | `!inputs.*`                      |
| 18  | `env.* != ? && env.* == ?`       |
| 13  | `vars.* == ?`                    |
| 12  | `inputs.* != ? && inputs.* != ?` |

## matrix, step level

| ifs | shape                              |
| --- | ---------------------------------- |
| 456 | `matrix.* == ?`                    |
| 172 | `matrix.*`                         |
| 69  | `matrix.* != ?`                    |
| 68  | `startswith(matrix.*, ?)`          |
| 27  | `runner.os != ? && matrix.*`       |
| 27  | `runner.os == ? && matrix.*`       |
| 13  | `matrix.* == ? && matrix.* == ?`   |
| 12  | `!matrix.*`                        |
| 8   | `matrix.* == ? \|\| matrix.* == ?` |
| 8   | `matrix.*.cross`                   |

## earlier job result, job level

| ifs | shape                                                                                                                        |
| --- | ---------------------------------------------------------------------------------------------------------------------------- |
| 254 | `needs.*.outputs.* == ?`                                                                                                     |
| 79  | `needs.*.outputs.* != ?`                                                                                                     |
| 43  | `always() && (needs.*.outputs.* == ? \|\| (github.event_name == ? && inputs.*))`                                             |
| 42  | `needs.*.outputs.* == ? && github.event_name != ?`                                                                           |
| 21  | `github.event_name == ? && startswith(github.ref, ?) && needs.*.outputs.* != ?`                                              |
| 16  | `needs.*.result == ? && needs.*.outputs.* == ?`                                                                              |
| 15  | `fromjson(needs.*.outputs.*)[?][?][?][?] != null && (needs.*.outputs.* == ? \|\| fromjson(needs.*.outputs.*)[?][?][?] == ?)` |
| 15  | `!cancelled() && needs.*.result == ?`                                                                                        |
| 14  | `inputs.* != ? && needs.*.outputs.* && github.repository == ?`                                                               |
| 14  | `always() && needs.*.result == ?`                                                                                            |

## earlier job result, step level

| ifs | shape                                                                        |
| --- | ---------------------------------------------------------------------------- |
| 53  | `needs.*.outputs.* == ?`                                                     |
| 17  | `contains(needs.*.result, ?) \|\| contains(needs.*.result, ?)`               |
| 16  | `needs.*.result == ?`                                                        |
| 9   | `needs.*.outputs.* != ?`                                                     |
| 8   | `(!cancelled()) && needs.*.result != ? && contains(needs.*.outputs.*, ?)`    |
| 3   | `needs.*.outputs.* == ? && steps.*.outputs.* != ?`                           |
| 3   | `always() && (contains(needs.*.result, ?) \|\| contains(needs.*.result, ?))` |
| 3   | `failure() \|\| needs.*.outputs.* != ?`                                      |
| 2   | `needs.*.result != ?`                                                        |
| 2   | `matrix.* != ? && needs.*.outputs.* == ? && steps.*.outputs.* != ?`          |

## repo or actor guard, job level

| ifs | shape                                                                                                                                                                                           |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 347 | `github.repository == ?`                                                                                                                                                                        |
| 111 | `(github.repository_owner == ? \|\| github.repository_owner == ?)`                                                                                                                              |
| 79  | `github.repository_owner == ?`                                                                                                                                                                  |
| 61  | `github.actor == ?`                                                                                                                                                                             |
| 20  | `github.event_name == ? && github.event.pull_request.merged == true && startswith(github.event.pull_request.head.ref, ?) && github.event.pull_request.head.repo.full_name == github.repository` |
| 18  | `github.event.pull_request.head.repo.full_name == github.repository && github.event_name == ?`                                                                                                  |
| 14  | `inputs.* != ? && needs.*.outputs.* && github.repository == ?`                                                                                                                                  |
| 10  | `(github.repository_owner == ? \|\| github.repository_owner == ?) && github.ref == ?`                                                                                                           |
| 8   | `(github.repository_owner == ? \|\| github.repository_owner == ?) && always()`                                                                                                                  |
| 8   | `github.repository == ? && github.ref == ?`                                                                                                                                                     |

## repo or actor guard, step level

| ifs | shape                                                                                                                                                                                             |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 4   | `github.repository == ? && !env.* && github.ref == ? && runner.os == ? && !vars.*`                                                                                                                |
| 3   | `github.repository == ?`                                                                                                                                                                          |
| 3   | `github.repository == ? && github.ref == ? && runner.os == ? && !vars.*`                                                                                                                          |
| 3   | `github.repository == ? && (((github.ref == ? \|\| startswith(github.ref, ?)) && (!(contains(github.event.head_commit.message, ?)))) \|\| (github.ref == ?)) && (matrix.* == ? && matrix.* == ?)` |
| 2   | `github.event.pull_request.head.repo.full_name != github.repository \|\| github.actor == ?`                                                                                                       |
| 2   | `github.event.pull_request.head.repo.full_name == github.repository && github.actor != ?`                                                                                                         |
| 2   | `github.event_name != ? \|\| github.event.pull_request.head.repo.full_name == github.repository`                                                                                                  |
| 2   | `github.event_name != ? && github.actor != ?`                                                                                                                                                     |
| 2   | `github.repository == ? && github.ref == ? && runner.os == ? && inputs.* && !vars.*`                                                                                                              |
| 1   | `always() && github.event.pull_request.head.repo.full_name == github.repository`                                                                                                                  |

## runner, step level

| ifs | shape                                                                              |
| --- | ---------------------------------------------------------------------------------- |
| 186 | `runner.os == ?`                                                                   |
| 42  | `runner.os != ?`                                                                   |
| 27  | `runner.os != ? && matrix.*`                                                       |
| 27  | `runner.os == ? && matrix.*`                                                       |
| 8   | `runner.os == ? && !vars.*`                                                        |
| 6   | `runner.os == ? && inputs.*`                                                       |
| 4   | `runner.os == ? && !inputs.*`                                                      |
| 4   | `github.repository == ? && !env.* && github.ref == ? && runner.os == ? && !vars.*` |
| 3   | `runner.os == ? \|\| runner.os == ?`                                               |
| 3   | `runner.os == ? && env.*`                                                          |
