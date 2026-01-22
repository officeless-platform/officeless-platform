#!/usr/bin/env node

/**
 * Script to clean up duplicate mermaid-diagram-container structures
 * This fixes files that were processed multiple times
 */

const fs = require('fs');
const path = require('path');

const DOCS_DIR = path.join(__dirname, '..', 'docs');

function cleanupFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;
    
    // Pattern to match nested mermaid-diagram-container structures
    // This matches: <div>...<div>...![image]...![image]...<details>...<details>...</div>...</div>
    const nestedPattern = /<div class="mermaid-diagram-container">\s*<div class="mermaid-diagram-container">\s*!\[Mermaid Diagram\]\([^)]+\)\s*<details>[\s\S]*?<summary>View Mermaid source code<\/summary>\s*!\[Mermaid Diagram\]\([^)]+\)\s*<details>[\s\S]*?<summary>View Mermaid source code<\/summary>\s*```mermaid[\s\S]*?```\s*<\/details>\s*<\/div>\s*<\/details>\s*<\/div>/g;
    
    // Replace nested structure with clean single structure
    content = content.replace(nestedPattern, (match) => {
        // Extract the image path and mermaid code
        const imageMatch = match.match(/!\[Mermaid Diagram\]\(([^)]+)\)/);
        const mermaidMatch = match.match(/```mermaid\n([\s\S]*?)```/);
        
        if (imageMatch && mermaidMatch) {
            const imagePath = imageMatch[1];
            const mermaidCode = mermaidMatch[1].trim();
            
            return `<div class="mermaid-diagram-container">

![Mermaid Diagram](${imagePath})

<details>
<summary>View Mermaid source code</summary>

\`\`\`mermaid
${mermaidCode}
\`\`\`

</details>

</div>`;
        }
        return match;
    });
    
    // Remove any remaining duplicate image references on consecutive lines
    content = content.replace(
        /!\[Mermaid Diagram\]\([^)]+\)\s*\n\s*!\[Mermaid Diagram\]\([^)]+\)/g,
        (match) => {
            const firstMatch = match.match(/!\[Mermaid Diagram\]\([^)]+\)/);
            return firstMatch ? firstMatch[0] : match;
        }
    );
    
    // Fix path to use Jekyll baseurl format if not already
    if (!content.includes('{{ site.baseurl }}')) {
        content = content.replace(/\.\.\/assets\//g, '{{ site.baseurl }}/assets/');
    }
    
    if (content !== originalContent) {
        fs.writeFileSync(filePath, content, 'utf8');
        return true;
    }
    
    return false;
}

function main() {
    console.log('Cleaning up duplicate structures in documentation files...\n');
    
    const files = fs.readdirSync(DOCS_DIR)
        .filter(file => file.endsWith('.md'))
        .map(file => path.join(DOCS_DIR, file));
    
    let cleanedCount = 0;
    files.forEach(file => {
        if (cleanupFile(file)) {
            console.log(`Cleaned: ${path.basename(file)}`);
            cleanedCount++;
        }
    });
    
    console.log(`\nDone! Cleaned ${cleanedCount} file(s).`);
}

if (require.main === module) {
    main();
}

module.exports = { cleanupFile };
