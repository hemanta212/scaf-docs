# Research Phase

## Goal
Extract API/syntax changes from scaf code since last docs sync.

## Steps

1. **Find last sync point**
   ```bash
   git tag -l "docs-sync-*" --sort=-version:refname | head -1
   ```
   If no tag, compare file modification dates between scaf/ and scaf-docs/.

2. **Get changed code files**
   ```bash
   git log <last-tag>..HEAD --name-only -- ../scaf/*.go ../scaf/**/*.go
   ```
   Focus on: ast.go, parser.go, lexer.go, cmd/scaf/*.go

3. **For each changed file, extract**
   - New/changed keywords (fn, query, assert, etc.)
   - Parameter syntax changes
   - New AST node types
   - CLI flag changes

4. **Cross-reference with docs**
   - Map code areas to docs: ast.go → dsl/*.mdx, cmd/ → cli/*.mdx
   - Note what docs say vs what code does

5. **Output specs to `.sync/specs/`**
   One file per area:
   - `keywords.md` - syntax keyword changes
   - `types.md` - type annotation changes  
   - `assertions.md` - assert syntax changes
   - `cli.md` - command/flag changes

## Spec File Format
```markdown
# <Area Name>

## Code Reality
- File: <path>#L<line>
- Current syntax: <example>

## Docs Say
- File: <docs-path>
- Documented syntax: <example>

## Delta
- Change X to Y
- Add documentation for Z
```

## Reference
- Primary source of truth: `scaf/example/learn-scaf-in-y-minutes.scaf`
- AST definitions: `scaf/ast.go`
