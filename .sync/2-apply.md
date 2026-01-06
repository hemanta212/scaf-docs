# Apply Phase

## Goal
Update docs to match specs. Use parallel agents for independent files.

## Input
Spec files from `.sync/specs/*.md`

## Steps

1. **Read all specs**, group by target doc file

2. **Spawn parallel agents** for independent doc files:
   - Each agent gets: target .mdx + relevant spec sections
   - Agents can run in parallel if touching different files

3. **Per-file update rules**
   - Replace old syntax with new (e.g., `query` → `fn`)
   - Update code examples to match current parser
   - Keep prose structure, only change technical content
   - Preserve frontmatter, imports, components

4. **Do NOT**
   - Rewrite prose style
   - Add new sections not in spec
   - Remove content unless spec says deprecated

## Parallel Agent Prompt Template
```
Update <file.mdx> based on this spec:
<paste relevant spec section>

Rules:
- Only change syntax/examples mentioned in spec
- Keep all other content unchanged
- Verify examples would parse with current scaf
```

## Completion
After all agents finish, run phase 3 (review).
