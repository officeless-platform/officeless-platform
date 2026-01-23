#!/usr/bin/env node

/**
 * Aggressive cleanup: Remove all nested containers, keep only the innermost valid one
 */

const fs = require('fs');
const path = require('path');

const DOCS_DIR = path.join(__dirname, '..', 'docs');

function aggressiveCleanup(content) {
    let result = content;
    let changed = true;
    let iterations = 0;
    const maxIterations = 20;
    
    while (changed && iterations < maxIterations) {
        changed = false;
        iterations++;
        
        // Find all container starts
        const containerPattern = /<div class="mermaid-diagram-container">/g;
        const containers = [];
        let match;
        
        while ((match = containerPattern.exec(result)) !== null) {
            containers.push(match.index);
        }
        
        // Find nested pairs
        for (let i = 0; i < containers.length - 1; i++) {
            const outerStart = containers[i];
            const innerStart = containers[i + 1];
            
            // Check if inner is immediately after outer (nested)
            const between = result.substring(outerStart + '<div class="mermaid-diagram-container">'.length, innerStart).trim();
            if (between.length < 50) { // Likely nested
                // Find outer end
                let divCount = 0;
                let outerEnd = -1;
                
                for (let j = outerStart; j < result.length; j++) {
                    if (result.substring(j, j + 4) === '<div') {
                        divCount++;
                    } else if (result.substring(j, j + 6) === '</div>') {
                        divCount--;
                        if (divCount === 0) {
                            outerEnd = j + 6;
                            break;
                        }
                    }
                }
                
                if (outerEnd !== -1) {
                    // Find inner end
                    divCount = 0;
                    let innerEnd = -1;
                    
                    for (let j = innerStart; j < outerEnd; j++) {
                        if (result.substring(j, j + 4) === '<div') {
                            divCount++;
                        } else if (result.substring(j, j + 6) === '</div>') {
                            divCount--;
                            if (divCount === 0) {
                                innerEnd = j + 6;
                                break;
                            }
                        }
                    }
                    
                    if (innerEnd !== -1) {
                        // Extract inner content (without the inner div tags)
                        const innerContent = result.substring(innerStart + '<div class="mermaid-diagram-container">'.length, innerEnd - '</div>'.length);
                        
                        // Replace outer with inner content
                        const replacement = `<div class="mermaid-diagram-container">${innerContent}</div>`;
                        result = result.substring(0, outerStart) + replacement + result.substring(outerEnd);
                        changed = true;
                        break; // Process one at a time
                    }
                }
            }
        }
    }
    
    return result;
}

function processFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const cleaned = aggressiveCleanup(content);
    
    if (cleaned !== content) {
        fs.writeFileSync(filePath, cleaned, 'utf8');
        console.log(`  Fixed ${path.basename(filePath)}`);
        return true;
    }
    
    return false;
}

function main() {
    console.log('Aggressively cleaning nested containers...\n');
    
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

module.exports = { aggressiveCleanup, processFile };
