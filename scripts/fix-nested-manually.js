#!/usr/bin/env node

/**
 * Manual fix: Remove all nested containers, keep only the innermost one with valid structure
 */

const fs = require('fs');
const path = require('path');

const DOCS_DIR = path.join(__dirname, '..', 'docs');

function fixNestedContainers(content) {
    let result = content;
    let changed = true;
    let maxIterations = 50;
    let iterations = 0;
    
    while (changed && iterations < maxIterations) {
        changed = false;
        iterations++;
        
        // Find pattern: <div class="mermaid-diagram-container"> followed by another <div class="mermaid-diagram-container">
        const nestedPattern = /<div class="mermaid-diagram-container">\s*(<img[^>]*>|<details|<div class="mermaid-diagram-container">)/g;
        let match;
        
        while ((match = nestedPattern.exec(result)) !== null) {
            const startPos = match.index;
            
            // Check if the next thing is another container div
            const afterStart = result.substring(startPos + '<div class="mermaid-diagram-container">'.length).trim();
            if (afterStart.startsWith('<div class="mermaid-diagram-container">')) {
                // Find the innermost container that has the code block
                let searchPos = startPos;
                let innermostStart = -1;
                let innermostEnd = -1;
                
                // Find all containers starting from this position
                const containerStarts = [];
                let pos = searchPos;
                while ((pos = result.indexOf('<div class="mermaid-diagram-container">', pos)) !== -1) {
                    containerStarts.push(pos);
                    pos += '<div class="mermaid-diagram-container">'.length;
                }
                
                // Find the innermost one (last in sequence) that has a code block
                for (let i = containerStarts.length - 1; i >= 0; i--) {
                    const containerStart = containerStarts[i];
                    
                    // Find the end of this container
                    let divCount = 0;
                    let containerEnd = -1;
                    
                    for (let j = containerStart; j < result.length; j++) {
                        if (result.substring(j, j + 4) === '<div') {
                            divCount++;
                        } else if (result.substring(j, j + 6) === '</div>') {
                            divCount--;
                            if (divCount === 0) {
                                containerEnd = j + 6;
                                break;
                            }
                        }
                    }
                    
                    if (containerEnd !== -1) {
                        const containerContent = result.substring(containerStart, containerEnd);
                        // Check if this container has a code block (it's the valid one)
                        if (containerContent.includes('<pre><code class="language-mermaid">')) {
                            innermostStart = containerStart;
                            innermostEnd = containerEnd;
                            break;
                        }
                    }
                }
                
                if (innermostStart !== -1 && innermostEnd !== -1) {
                    // Extract the innermost container content
                    const innermostContent = result.substring(innermostStart, innermostEnd);
                    
                    // Replace from outer start to outer end with just the innermost content
                    // Find the outer end
                    let divCount = 0;
                    let outerEnd = -1;
                    
                    for (let j = startPos; j < result.length; j++) {
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
                    
                    if (outerEnd !== -1 && outerEnd >= innermostEnd) {
                        result = result.substring(0, startPos) + innermostContent + result.substring(outerEnd);
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
    const cleaned = fixNestedContainers(content);
    
    if (cleaned !== content) {
        fs.writeFileSync(filePath, cleaned, 'utf8');
        console.log(`  Fixed ${path.basename(filePath)}`);
        return true;
    }
    
    return false;
}

function main() {
    console.log('Fixing nested containers manually...\n');
    
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

module.exports = { fixNestedContainers, processFile };
