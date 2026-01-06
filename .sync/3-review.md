# Review Phase

## Goal
Verify doc updates are correct and nothing broke.

## Steps

1. **Collect all doc changes**
   ```bash
   git diff --name-only src/content/docs/
   ```

2. **For each changed doc**
   - Extract all code blocks marked as `scaf`
   - Verify syntax matches current parser expectations
   - Cross-check against `scaf/example/learn-scaf-in-y-minutes.scaf`

3. **Regression checks**
   - No accidental keyword reversions (fn→query)
   - Type annotations still documented correctly
   - Assert syntax uses parens not semicolons
   - Setup call params don't have $ prefix

4. **Consistency checks**
   - Same feature described same way across files
   - No contradictions between overview.mdx and detail pages
   - All internal links still valid

5. **Output**
   - PASS: All checks passed
   - FAIL: List issues with file:line refs

## Quick Validation Commands
```bash
# Check if examples would parse (future: scaf fmt --check)
grep -n "^\`\`\`scaf" src/content/docs/**/*.mdx

# Look for old syntax
grep -rn "^query " src/content/docs/
grep -rn "assert {" src/content/docs/ | grep ";"
```

## Final Step
If PASS, create sync tag:
```bash
git tag docs-sync-$(date +%Y-%m-%d)
```
