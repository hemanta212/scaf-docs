# scaf Documentation

Documentation site for [scaf](https://github.com/rlch/scaf), the database test scaffolding DSL.

Built with [Astro](https://astro.build/) and [Starlight](https://starlight.astro.build/).

## Development

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Structure

```
src/
├── assets/           # Logo and images
├── content/docs/     # Documentation pages (MDX)
│   ├── getting-started/
│   ├── dsl/
│   ├── cli/
│   ├── config/
│   ├── editor/
│   └── reference/
├── styles/           # Custom CSS
└── content.config.ts # Content schema
```

## Related Repositories

- [scaf](https://github.com/rlch/scaf) - Main scaf CLI and DSL
- [tree-sitter-scaf](https://github.com/rlch/tree-sitter-scaf) - Tree-sitter grammar
- [scaf.nvim](https://github.com/rlch/scaf.nvim) - Neovim plugin

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run `npm run build` to verify
5. Submit a pull request

## License

MIT
