## overview

|                            | count        |
| -------------------------- | ------------ |
| repos with workflows       | 2660         |
| repos with at least one if | 1149 (43.2%) |
| ifs                        | 8206         |
| unparseable ifs            | 4            |

## categories

| category                                                                                                                                                                                                                                                    | level | ifs  | repos | % of repos |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----- | ---- | ----- | ---------- |
| [github.event / github.ref](#githubevent-githubref-job-level) ([docs](https://docs.github.com/en/actions/reference/workflows-and-actions/contexts#github-context))                                                                                          | job   | 1335 | 522   | 19.6%      |
| [github.event / github.ref](#githubevent-githubref-step-level) ([docs](https://docs.github.com/en/actions/reference/workflows-and-actions/contexts#github-context))                                                                                         | step  | 929  | 372   | 14.0%      |
| [status check functions](#status-check-functions-job-level) ([docs](https://docs.github.com/en/actions/reference/workflows-and-actions/expressions#status-check-functions))                                                                                 | job   | 397  | 151   | 5.7%       |
| [status check functions](#status-check-functions-step-level) ([docs](https://docs.github.com/en/actions/reference/workflows-and-actions/expressions#status-check-functions))                                                                                | step  | 1229 | 317   | 11.9%      |
| [steps context](#steps-context-step-level) ([docs](https://docs.github.com/en/actions/reference/workflows-and-actions/contexts#steps-context))                                                                                                              | step  | 1363 | 352   | 13.2%      |
| [matrix context](#matrix-context-step-level) ([docs 1](https://docs.github.com/en/actions/reference/workflows-and-actions/contexts#matrix-context), [docs 2](https://docs.github.com/en/actions/reference/workflows-and-actions/contexts#strategy-context)) | step  | 1035 | 204   | 7.7%       |
| [needs context](#needs-context-job-level) ([docs 1](https://docs.github.com/en/actions/reference/workflows-and-actions/contexts#needs-context), [docs 2](https://docs.github.com/en/actions/reference/workflows-and-actions/contexts#jobs-context))         | job   | 822  | 207   | 7.8%       |
| [needs context](#needs-context-step-level) ([docs 1](https://docs.github.com/en/actions/reference/workflows-and-actions/contexts#needs-context), [docs 2](https://docs.github.com/en/actions/reference/workflows-and-actions/contexts#jobs-context))        | step  | 132  | 45    | 1.7%       |
| [github.repository / github.actor](#githubrepository-githubactor-job-level) ([docs](https://docs.github.com/en/actions/reference/workflows-and-actions/contexts#github-context))                                                                            | job   | 873  | 243   | 9.1%       |
| [github.repository / github.actor](#githubrepository-githubactor-step-level) ([docs](https://docs.github.com/en/actions/reference/workflows-and-actions/contexts#github-context))                                                                           | step  | 42   | 19    | 0.7%       |
| [inputs context](#inputs-context-job-level) ([docs](https://docs.github.com/en/actions/reference/workflows-and-actions/contexts#inputs-context))                                                                                                            | job   | 225  | 48    | 1.8%       |
| [inputs context](#inputs-context-step-level) ([docs](https://docs.github.com/en/actions/reference/workflows-and-actions/contexts#inputs-context))                                                                                                           | step  | 382  | 59    | 2.2%       |
| [env context](#env-context-step-level) ([docs](https://docs.github.com/en/actions/reference/workflows-and-actions/contexts#env-context))                                                                                                                    | step  | 391  | 77    | 2.9%       |
| [runner context](#runner-context-step-level) ([docs](https://docs.github.com/en/actions/reference/workflows-and-actions/contexts#runner-context))                                                                                                           | step  | 349  | 67    | 2.5%       |
| [vars context](#vars-context-job-level) ([docs](https://docs.github.com/en/actions/reference/workflows-and-actions/contexts#vars-context))                                                                                                                  | job   | 29   | 13    | 0.5%       |
| [vars context](#vars-context-step-level) ([docs](https://docs.github.com/en/actions/reference/workflows-and-actions/contexts#vars-context))                                                                                                                 | step  | 123  | 13    | 0.5%       |
| other                                                                                                                                                                                                                                                       | job   | 9    | 3     | 0.1%       |
| other                                                                                                                                                                                                                                                       | step  | 26   | 9     | 0.3%       |
| constant                                                                                                                                                                                                                                                    | job   | 8    | 8     | 0.3%       |
| constant                                                                                                                                                                                                                                                    | step  | 3    | 3     | 0.1%       |

## github.event / github.ref, job level

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

## github.event / github.ref, step level

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

## status check functions, job level

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

## status check functions, step level

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

## steps context, step level

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

## matrix context, step level

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

## needs context, job level

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

## needs context, step level

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

## github.repository / github.actor, job level

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

## github.repository / github.actor, step level

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

## inputs context, job level

| ifs | shape                                                                                                                                                                                                                                  |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 43  | `always() && (needs.*.outputs.* == ? \|\| (github.event_name == ? && inputs.*))`                                                                                                                                                       |
| 22  | `inputs.*`                                                                                                                                                                                                                             |
| 15  | `inputs.* == ? \|\| inputs.* == ?`                                                                                                                                                                                                     |
| 14  | `inputs.* != ? && needs.*.outputs.* && github.repository == ?`                                                                                                                                                                         |
| 12  | `inputs.* == ?`                                                                                                                                                                                                                        |
| 9   | `always() && (github.ref == ? \|\| github.ref == ?) && (needs.*.outputs.* == ? \|\| (github.event_name == ? && inputs.*)) && needs.*.result == ? && (needs.*.result == ? \|\| needs.*.outputs.* != ?)`                                 |
| 6   | `needs.*.outputs.* == ? && !inputs.*`                                                                                                                                                                                                  |
| 5   | `!inputs.*`                                                                                                                                                                                                                            |
| 4   | `(github.event_name == ? && github.event.pull_request.merged == true && github.event.pull_request.base.ref == ? && github.event.pull_request.head.repo.full_name == github.repository) \|\| (github.event_name == ? && inputs.* == ?)` |
| 4   | `(github.repository_owner == ? \|\| github.repository_owner == ?) && (inputs.* == true \|\| needs.*.outputs.* == ?)`                                                                                                                   |

## inputs context, step level

| ifs | shape                                  |
| --- | -------------------------------------- |
| 102 | `inputs.* == ?`                        |
| 54  | `inputs.*`                             |
| 47  | `inputs.* != ?`                        |
| 35  | `!inputs.*`                            |
| 12  | `inputs.* != ? && inputs.* != ?`       |
| 8   | `github.event_name == ? && inputs.*`   |
| 8   | `inputs.* == true \|\| inputs.* == ?`  |
| 6   | `steps.*.outputs.* == ? \|\| inputs.*` |
| 6   | `runner.os == ? && inputs.*`           |
| 5   | `inputs.* == true`                     |

## env context, step level

| ifs | shape                                                                              |
| --- | ---------------------------------------------------------------------------------- |
| 138 | `env.* == ?`                                                                       |
| 121 | `env.* != ?`                                                                       |
| 18  | `env.* != ? && env.* == ?`                                                         |
| 12  | `env.* != ? && env.* != ?`                                                         |
| 9   | `always() && env.* == ?`                                                           |
| 8   | `failure() && env.* != ?`                                                          |
| 7   | `env.* == ? && env.* != ?`                                                         |
| 4   | `env.* == ? && matrix.* == ?`                                                      |
| 4   | `github.event_name == ? && env.* == ?`                                             |
| 4   | `github.repository == ? && !env.* && github.ref == ? && runner.os == ? && !vars.*` |

## runner context, step level

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

## vars context, job level

| ifs | shape                                                                                                                                                                                                                   |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 7   | `!contains(vars.*, ?)`                                                                                                                                                                                                  |
| 6   | `github.event_name != ? && (vars.* != ? \|\| vars.* != ?)`                                                                                                                                                              |
| 4   | `vars.* != ?`                                                                                                                                                                                                           |
| 2   | `github.event_name == ? && startswith(github.ref, ?) && vars.* == ?`                                                                                                                                                    |
| 2   | `vars.* == ?`                                                                                                                                                                                                           |
| 2   | `vars.* != ? \|\| vars.* != ?`                                                                                                                                                                                          |
| 1   | `always() && needs.*.result == ? && needs.*.result == ? && needs.*.result == ? && needs.*.result == ? && needs.*.result == ? && needs.*.result == ? && (needs.*.result == ? \|\| (vars.* != ? && needs.*.result == ?))` |
| 1   | `github.event_name != ? && github.ref == ? && vars.* == ?`                                                                                                                                                              |
| 1   | `contains(fromjson(vars.* \|\| ?), github.ref_name)`                                                                                                                                                                    |
| 1   | `vars.* == ? \|\| contains(vars.*, github.ref_name)`                                                                                                                                                                    |

## vars context, step level

| ifs | shape                                                                                |
| --- | ------------------------------------------------------------------------------------ |
| 67  | `vars.* != ?`                                                                        |
| 13  | `vars.* == ?`                                                                        |
| 12  | `github.event_name != ? && vars.* != ?`                                              |
| 8   | `runner.os == ? && !vars.*`                                                          |
| 4   | `github.repository == ? && !env.* && github.ref == ? && runner.os == ? && !vars.*`   |
| 3   | `vars.* != ? && !contains(vars.*, ?)`                                                |
| 3   | `vars.*`                                                                             |
| 3   | `github.repository == ? && github.ref == ? && runner.os == ? && !vars.*`             |
| 2   | `github.repository == ? && github.ref == ? && runner.os == ? && inputs.* && !vars.*` |
| 1   | `vars.* != ? && vars.* != ?`                                                         |
