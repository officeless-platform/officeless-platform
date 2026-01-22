# Mermaid Diagram Rendering

This documentation uses pre-rendered Mermaid diagrams for better compatibility and performance.

## Rendering Diagrams

To render all Mermaid diagrams in the documentation:

```bash
# Install dependencies (first time only)
npm install

# Render all diagrams
npm run render-diagrams
```

This will:
1. Find all ````mermaid` code blocks in the `docs/` directory
2. Render them to SVG files in `assets/diagrams/rendered/`
3. Update the markdown files to include the rendered SVG images
4. Add collapsible sections with the original Mermaid code (collapsed by default)

## How It Works

The script (`scripts/render-mermaid.js`):
- Extracts Mermaid code blocks from markdown files
- Uses `@mermaid-js/mermaid-cli` to render them to SVG
- Replaces the code blocks with:
  - The rendered SVG image
  - A collapsible `<details>` section containing the original Mermaid code

## Requirements

- Node.js >= 14.0.0
- `@mermaid-js/mermaid-cli` (installed via `npm install`)

## Updating Diagrams

When you update a Mermaid diagram:
1. Edit the Mermaid code in the markdown file
2. Run `npm run render-diagrams` to regenerate the SVG
3. Commit both the updated markdown and the new SVG file

## Manual Rendering

If you need to render a single diagram manually:

```bash
npx @mermaid-js/mermaid-cli -i diagram.mmd -o diagram.svg -b transparent -w 1200
```
