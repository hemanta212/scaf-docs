// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import starlightSidebarTopics from 'starlight-sidebar-topics';
import mermaid from 'astro-mermaid';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

// Import the scaf grammar for syntax highlighting
const scafGrammar = require('./src/grammars/scaf.tmLanguage.json');

// https://astro.build/config
export default defineConfig({
	markdown: {
		shikiConfig: {
			langs: [
				// Add scaf language
				{
					...scafGrammar,
				},
			],
		},
	},
	integrations: [
		mermaid(),
		starlight({
			title: 'scaf',
			description: 'A declarative DSL for database test scaffolding',
			logo: {
				src: './src/assets/logo.svg',
				alt: 'scaf',
				replacesTitle: true,
			},
			favicon: '/favicon.svg',
			social: [
				{ icon: 'github', label: 'GitHub', href: 'https://github.com/rlch/scaf' },
			],
			editLink: {
				baseUrl: 'https://github.com/rlch/scaf-docs/edit/main/',
			},
			plugins: [
				starlightSidebarTopics([
					{
						label: 'Guide',
						link: '/getting-started/introduction/',
						icon: 'open-book',
						items: [
							{
								label: 'Getting Started',
								items: [
									{ label: 'Introduction', slug: 'getting-started/introduction' },
									{ label: 'Installation', slug: 'getting-started/installation' },
									{ label: 'Quick Start', slug: 'getting-started/quick-start' },
								],
							},
							{
								label: 'DSL Syntax',
								items: [
									{ label: 'Overview', slug: 'dsl/overview' },
									{ label: 'Queries', slug: 'dsl/queries' },
									{ label: 'Tests & Groups', slug: 'dsl/tests' },
									{ label: 'Setup & Teardown', slug: 'dsl/setup' },
									{ label: 'Assertions', slug: 'dsl/assertions' },
									{ label: 'Imports', slug: 'dsl/imports' },
								],
							},
							{
								label: 'Configuration',
								items: [
									{ label: 'scaf.yaml', slug: 'config/yaml' },
									{ label: 'Databases', slug: 'config/databases' },
									{ label: 'Adapters', slug: 'config/adapters' },
								],
							},
						],
					},
					{
						label: 'CLI',
						link: '/cli/test/',
						icon: 'seti:shell',
						items: [
							{
								label: 'Commands',
								items: [
									{ label: 'scaf test', slug: 'cli/test' },
									{ label: 'scaf generate', slug: 'cli/generate' },
									{ label: 'scaf fmt', slug: 'cli/fmt' },
								],
							},
						],
					},
					{
						label: 'Editor',
						link: '/editor/overview/',
						icon: 'laptop',
						items: [
							{
								label: 'Editor Integration',
								items: [
									{ label: 'Overview', slug: 'editor/overview' },
									{ label: 'Neovim (scaf.nvim)', slug: 'editor/neovim' },
									{ label: 'Tree-sitter Grammar', slug: 'editor/tree-sitter' },
									{ label: 'Language Server', slug: 'editor/lsp' },
								],
							},
						],
					},
					{
						label: 'Reference',
						link: '/reference/syntax/',
						icon: 'document',
						items: [
							{
								label: 'Reference',
								items: [
									{ label: 'Syntax Reference', slug: 'reference/syntax' },
									{ label: 'Value Types', slug: 'reference/values' },
									{ label: 'Expression Language', slug: 'reference/expressions' },
								],
							},
						],
					},
				]),
			],
			customCss: ['./src/styles/custom.css'],
		}),
	],
});
