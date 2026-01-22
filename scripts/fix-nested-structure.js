#!/usr/bin/env node

/**
 * Script to fix nested mermaid-diagram-container structures
 * Removes duplicate nested divs and images
 */

const fs = require('fs');
const path = require('path');

const DOCS_DIR = path.join(__dirname, '..', 'docs');

function fixFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;
    
    // Pattern: Find nested structure where we have:
    // <div>...![image]...<details>...<div>...![image]...<details>...code...</details>...</div>...</details>...</div>
    // And replace with:
    // <div>...![image]...<details>...code...</details>...</div>
    
    const pattern = /(<div class="mermaid-diagram-container">\s*!\[Mermaid Diagram\]\([^)]+\)\s*<details>\s*<summary>View Mermaid source code<\/summary>\s*)<div class="mermaid-diagram-container">\s*!\[Mermaid Diagram\]\([^)]+\)\s*<details>\s*<summary>View Mermaid source code<\/summary>\s*(```mermaid[\s\S]*?```)\s*<\/details>\s*<\/div>\s*<\/details>\s*<\/div>/g;
    
    content = content.replace(pattern, (match, p1, p2) => {
        return p1 + p2 + '\n\n</details>\n\n</div>';
    });
    
    if (content !== originalContent) {
        fs.writeFileSync(filePath, content, 'utf8');
        return true;
    }
    
    return false;
}

function main() {
    console.log('Fixing nested structures in documentation files...\n');
    
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
