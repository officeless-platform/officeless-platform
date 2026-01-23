#!/usr/bin/env node

/**
 * Script to remove duplicate closing tags from mermaid diagram containers
 */

const fs = require('fs');
const path = require('path');

const DOCS_DIR = path.join(__dirname, '..', 'docs');

function fixFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;
    
    // Remove duplicate closing tags pattern: </details></div></details></div>
    content = content.replace(/<\/details>\s*<\/div>\s*<\/details>\s*<\/div>/g, '</details>\n\n</div>');
    
    // Also fix if there are extra closing divs
    content = content.replace(/<\/div>\s*<\/div>\s*<\/div>/g, '</div>');
    
    if (content !== originalContent) {
        fs.writeFileSync(filePath, content, 'utf8');
        return true;
    }
    
    return false;
}

function main() {
    console.log('Removing duplicate closing tags...\n');
    
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
