# Project Working Agreements

- Treat commit and push as one operation for this project. When the user asks to commit, immediately push that commit to the configured upstream branch and verify that local `HEAD` equals the remote-tracking branch, unless the user explicitly asks for a local-only commit or says not to push.
- After completing and verifying a design/UI change or a meridian implementation, commit it immediately, push it to the configured upstream branch, and verify that local `HEAD` equals the remote-tracking branch. Do not wait for a separate commit request unless the user explicitly asks not to commit or push.
- Do not include unrelated or pre-existing working-tree changes in a commit.
