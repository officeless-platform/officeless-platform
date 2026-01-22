#!/usr/bin/env node

/**
 * Script to fix duplicate mermaid-diagram-container structures
 */

const fs = require('fs');
const path = require('path');

const DOCS_DIR = path.join(__dirname, '..', 'docs');

function fixFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;
    
    // Find all mermaid diagram blocks
    const diagramBlocks = content.match(/<div class="mermaid-diagram-container">[\s\S]*?<\/div>/g);
    
    if (!diagramBlocks) {
        return false;
    }
    
    // Process each block
    diagramBlocks.forEach(block => {
        // Check if this block has nested structure
        const nestedDivs = (block.match(/<div class="mermaid-diagram-container">/g) || []).length;
        
        if (nestedDivs > 1) {
            // Extract the first image path
            const imageMatch = block.match(/!\[Mermaid Diagram\]\(([^)]+)\)/);
            // Extract the mermaid code (the last one, which is the actual code)
            const mermaidMatches = block.match(/```mermaid\n([\s\S]*?)```/g);
            
            if (imageMatch && mermaidMatches && mermaidMatches.length > 0) {
                const imagePath = imageMatch[1];
                // Get the last mermaid code block (the actual source)
                const lastMermaid = mermaidMatches[mermaidMatches.length - 1];
                const mermaidCode = lastMermaid.replace(/```mermaid\n/, '').replace(/```$/, '').trim();
                
                // Create clean replacement
                const cleanBlock = `<div class="mermaid-diagram-container">

![Mermaid Diagram](${imagePath})

<details>
<summary>View Mermaid source code</summary>

\`\`\`mermaid
${mermaidCode}
\`\`\`

</details>

</div>`;
                
                // Replace the nested block with clean block
                content = content.replace(block, cleanBlock);
            }
        }
    });
    
    if (content !== originalContent) {
        fs.writeFileSync(filePath, content, 'utf8');
        return true;
    }
    
    return false;
}

function main() {
    console.log('Fixing duplicate structures in documentation files...\n');
    
    const files = fs.readdirSync(DOCS_DIR)
        .filter(file => file.endsWith('.md'))
        .map(file => path.join(DOCS_DIR, file));
    
    let fixedCount = 0;
    files.forEach(file => {
        if (fixFile(file)) {
            console.log(`Fixed: ${path.basename(file)}`);
            fixedCount++;
        }
    });
    
    console.log(`\nDone! Fixed ${fixedCount} file(s).`);
}

if (require.main === module) {
    main();
}

module.exports = { fixFile };
