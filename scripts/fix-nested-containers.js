#!/usr/bin/env node

/**
 * Script to fix nested mermaid-diagram-container divs
 */

const fs = require('fs');
const path = require('path');

const DOCS_DIR = path.join(__dirname, '..', 'docs');

function fixNestedContainers(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;
    
    // Pattern to find nested containers: <div class="mermaid-diagram-container">...<div class="mermaid-diagram-container">
    // We want to keep only the outermost container
    const nestedPattern = /<div class="mermaid-diagram-container">\s*<div class="mermaid-diagram-container">/g;
    
    // Find all nested patterns and fix them
    let match;
    let fixed = false;
    
    while ((match = nestedPattern.exec(content)) !== null) {
        // Find the position
        const startPos = match.index;
        
        // Find the matching closing tags
        let divCount = 0;
        let outerEnd = -1;
        let innerEnd = -1;
        
        for (let i = startPos; i < content.length; i++) {
            if (content.substring(i, i + 4) === '<div') {
                divCount++;
            } else if (content.substring(i, i + 6) === '</div>') {
                divCount--;
                if (divCount === 1 && innerEnd === -1) {
                    innerEnd = i + 6; // End of inner container
                } else if (divCount === 0) {
                    outerEnd = i + 6; // End of outer container
                    break;
                }
            }
        }
        
        if (innerEnd !== -1 && outerEnd !== -1) {
            // Extract the inner container content (without the outer div tags)
            const innerContent = content.substring(startPos + '<div class="mermaid-diagram-container">'.length, innerEnd - '</div>'.length);
            
            // Replace nested structure with single container
            const replacement = `<div class="mermaid-diagram-container">${innerContent}</div>`;
            content = content.substring(0, startPos) + replacement + content.substring(outerEnd);
            fixed = true;
            
            // Reset regex to start from beginning
            nestedPattern.lastIndex = 0;
        }
    }
    
    if (fixed) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`  Fixed nested containers in ${path.basename(filePath)}`);
        return true;
    }
    
    return false;
}

function main() {
    console.log('Fixing nested mermaid-diagram-container divs...\n');
    
    const files = fs.readdirSync(DOCS_DIR)
        .filter(file => file.endsWith('.md'))
        .map(file => path.join(DOCS_DIR, file))
        .sort();
    
    let fixedCount = 0;
    files.forEach(file => {
        if (fixNestedContainers(file)) {
            fixedCount++;
        }
    });
    
    console.log(`\nDone! Fixed ${fixedCount} file(s).`);
}

if (require.main === module) {
    main();
}

module.exports = { fixNestedContainers };
