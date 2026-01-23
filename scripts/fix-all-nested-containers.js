#!/usr/bin/env node

/**
 * Script to fix all nested mermaid-diagram-container divs
 * Removes all nested containers, keeping only the outermost one
 */

const fs = require('fs');
const path = require('path');

const DOCS_DIR = path.join(__dirname, '..', 'docs');

function removeNestedContainers(content) {
    let result = content;
    let changed = true;
    let iterations = 0;
    const maxIterations = 10; // Prevent infinite loops
    
    // Keep removing nested containers until no more are found
    while (changed && iterations < maxIterations) {
        changed = false;
        iterations++;
        
        // Find pattern: <div class="mermaid-diagram-container">...<div class="mermaid-diagram-container">
        const pattern = /<div class="mermaid-diagram-container">\s*<div class="mermaid-diagram-container">/g;
        let match;
        
        while ((match = pattern.exec(result)) !== null) {
            const startPos = match.index;
            
            // Find the end of the outer container
            let divCount = 0;
            let outerEnd = -1;
            let innerEnd = -1;
            
            for (let i = startPos; i < result.length; i++) {
                if (result.substring(i, i + 4) === '<div') {
                    divCount++;
                } else if (result.substring(i, i + 6) === '</div>') {
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
                const innerStart = startPos + '<div class="mermaid-diagram-container">'.length;
                const innerContent = result.substring(innerStart, innerEnd - '</div>'.length);
                
                // Replace nested structure with single container
                const replacement = `<div class="mermaid-diagram-container">${innerContent}</div>`;
                result = result.substring(0, startPos) + replacement + result.substring(innerEnd);
                changed = true;
                
                // Reset regex to start from beginning
                pattern.lastIndex = 0;
                break; // Process one at a time
            }
        }
    }
    
    return result;
}

function processFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const cleaned = removeNestedContainers(content);
    
    if (cleaned !== content) {
        fs.writeFileSync(filePath, cleaned, 'utf8');
        console.log(`  Fixed ${path.basename(filePath)}`);
        return true;
    }
    
    return false;
}

function main() {
    console.log('Fixing all nested mermaid-diagram-container divs...\n');
    
    const files = fs.readdirSync(DOCS_DIR)
        .filter(file => file.endsWith('.md'))
        .map(file => path.join(DOCS_DIR, file))
        .sort();
    
    let fixedCount = 0;
    files.forEach(file => {
        if (processFile(file)) {
            fixedCount++;
        }
    });
    
    console.log(`\nDone! Fixed ${fixedCount} file(s).`);
}

if (require.main === module) {
    main();
}

module.exports = { removeNestedContainers, processFile };
