#!/usr/bin/env node

/**
 * Script to fix all nested mermaid-diagram-container divs by removing inner containers
 */

const fs = require('fs');
const path = require('path');

const DOCS_DIR = path.join(__dirname, '..', 'docs');

function fixFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    const original = content;
    
    // Find all occurrences of nested containers
    // Pattern: <div class="mermaid-diagram-container">...<div class="mermaid-diagram-container">
    const nestedRegex = /<div class="mermaid-diagram-container">\s*<div class="mermaid-diagram-container">/g;
    
    let match;
    let fixed = false;
    
    while ((match = nestedRegex.exec(content)) !== null) {
        const start = match.index;
        
        // Find the end of the outer container by counting divs
        let divCount = 0;
        let outerEnd = -1;
        let innerEnd = -1;
        
        for (let i = start; i < content.length; i++) {
            if (content.substring(i, i + 4) === '<div') {
                divCount++;
            } else if (content.substring(i, i + 6) === '</div>') {
                divCount--;
                if (divCount === 1 && innerEnd === -1) {
                    innerEnd = i + 6; // End of first inner container
                } else if (divCount === 0) {
                    outerEnd = i + 6; // End of outer container
                    break;
                }
            }
        }
        
        if (innerEnd !== -1 && outerEnd !== -1) {
            // Extract content between the two opening divs and before the first closing div
            const innerStart = start + '<div class="mermaid-diagram-container">'.length;
            const innerContent = content.substring(innerStart, innerEnd - '</div>'.length);
            
            // Replace with single container
            const replacement = `<div class="mermaid-diagram-container">${innerContent}</div>`;
            content = content.substring(0, start) + replacement + content.substring(innerEnd);
            fixed = true;
            
            // Reset regex
            nestedRegex.lastIndex = 0;
        }
    }
    
    if (fixed) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`  Fixed ${path.basename(filePath)}`);
        return true;
    }
    
    return false;
}

function main() {
    console.log('Fixing all nested containers...\n');
    
    const files = fs.readdirSync(DOCS_DIR)
        .filter(file => file.endsWith('.md'))
        .map(file => path.join(DOCS_DIR, file));
    
    let count = 0;
    files.forEach(file => {
        if (fixFile(file)) {
            count++;
        }
    });
    
    console.log(`\nDone! Fixed ${count} file(s).`);
}

if (require.main === module) {
    main();
}

module.exports = { fixFile };
