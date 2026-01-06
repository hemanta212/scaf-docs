# Validate Phase

## Goal
Ensure all scaf code blocks in docs are valid syntax.

## Approach
Extract code blocks, run through parser, fail if invalid.

## Manual Validation
```bash
# Extract all scaf fenced blocks from docs
grep -Pzo '(?s)```scaf\n(.*?)\n```' src/content/docs/**/*.mdx > /tmp/blocks.scaf

# Or per-file extraction (simpler)
for f in src/content/docs/**/*.mdx; do
  # Extract blocks and test parse
  # TODO: once scaf has --check flag, use it
done
```

## Using scaf fmt
```bash
# If scaf fmt can read stdin or temp files:
scaf fmt --check /tmp/extracted-block.scaf
```

## Reference Validation
Compare docs examples against the canonical source:
- `../scaf/example/learn-scaf-in-y-minutes.scaf`

This file is tested and always valid. Docs examples should be subsets of patterns shown there.

## CI Integration
Add to docs build:
```yaml
- name: Validate docs examples
  run: |
    # Extract and validate all scaf blocks
    ./scripts/validate-docs.sh
```

## What to Check
- [ ] `fn` keyword (not `query`)
- [ ] Typed params syntax: `fn Name(param: type)`
- [ ] Assert uses parens: `assert (expr)` or `assert { (expr) }`
- [ ] Setup calls without $ prefix: `setup fixtures.Create(id: 1)`

## Future: scaf integration
Ideal: `scaf check-docs src/content/docs/` that:
1. Finds all ```scaf blocks
2. Parses each
3. Reports errors with file:line
