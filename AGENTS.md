# Project Working Agreements

- **Never run `git commit` or `git push` until the user explicitly orders it.** No exceptions, whatever the change is and however well it is verified. This replaces the earlier agreement to commit and push automatically after a verified design, UI or meridian change.
- The reason is Vercel: this project is close to its deployment storage limit, and every push spends a deployment. Work is landed in one batch, when the user chooses, so that a session's worth of commits costs one deployment instead of several.
- Do the work, verify it, and stop at the working tree. Report what is modified or staged and wait.
- When the user does order a commit, treat commit and push as one operation: push to the configured upstream branch and verify that local `HEAD` equals the remote-tracking branch, unless they ask for a local-only commit.
- Do not include unrelated or pre-existing working-tree changes in a commit.
