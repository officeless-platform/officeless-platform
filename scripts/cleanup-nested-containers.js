#!/usr/bin/env node

/**
 * Script to clean up deeply nested mermaid-diagram-container divs
 * Removes all nested containers, keeping only the outermost one
 */

const fs = require('fs');
const path = require('path');

const DOCS_DIR = path.join(__dirname, '..', 'docs');

function findContainerBounds(content, startPos) {
    // Find the start of a container
    const containerStart = content.indexOf('<div class="mermaid-diagram-container">', startPos);
    if (containerStart === -1) return null;
    
    // Find the matching closing tag by counting divs
    let divCount = 0;
    let containerEnd = -1;
    
    for (let i = containerStart; i < content.length; i++) {
        if (content.substring(i, i + 4) === '<div') {
            divCount++;
        } else if (content.substring(i, i + 6) === '</div>') {
            divCount--;
            if (divCount === 0) {
                containerEnd = i + 6;
                break;
            }
        }
    }
    
    if (containerEnd === -1) return null;
    
    return { start: containerStart, end: containerEnd };
}

function removeNestedContainers(content) {
    let result = content;
    let changed = true;
    
    // Keep removing nested containers until no more are found
    while (changed) {
        changed = false;
        const pattern = /<div class="mermaid-diagram-container">\s*<div class="mermaid-diagram-container">/;
        const match = result.match(pattern);
        
        if (match) {
            const startPos = match.index;
            const bounds = findContainerBounds(result, startPos);
            
            if (bounds) {
                // Extract inner content (between the two opening divs and before the first closing div)
                const innerStart = startPos + '<div class="mermaid-diagram-container">'.length;
                
                // Find the inner container's end
                let innerDivCount = 0;
                let innerEnd = -1;
                for (let i = innerStart; i < bounds.end; i++) {
                    if (result.substring(i, i + 4) === '<div') {
                        innerDivCount++;
                    } else if (result.substring(i, i + 6) === '</div>') {
                        innerDivCount--;
                        if (innerDivCount === 0) {
                            innerEnd = i + 6;
                            break;
                        }
                    }
                }
                
                if (innerEnd !== -1) {
                    // Extract content between the two containers
                    const betweenContent = result.substring(innerStart, innerEnd - '</div>'.length);
                    
                    // Replace nested structure with single container
                    const replacement = `<div class="mermaid-diagram-container">${betweenContent}</div>`;
                    result = result.substring(0, startPos) + replacement + result.substring(innerEnd);
                    changed = true;
                }
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
        console.log(`  Fixed nested containers in ${path.basename(filePath)}`);
        return true;
    }
    
    return false;
}

function main() {
    console.log('Cleaning up nested mermaid-diagram-container divs...\n');
    
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
