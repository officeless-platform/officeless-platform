#!/usr/bin/env node

/**
 * Final fix: Remove all nested containers, keep only the innermost valid container
 */

const fs = require('fs');
const path = require('path');

const DOCS_DIR = path.join(__dirname, '..', 'docs');

function findInnermostContainer(content, startPos) {
    // Find all containers starting from startPos
    const containers = [];
    let pos = startPos;
    
    while ((pos = content.indexOf('<div class="mermaid-diagram-container">', pos)) !== -1) {
        // Find the end of this container
        let divCount = 0;
        let containerEnd = -1;
        
        for (let i = pos; i < content.length; i++) {
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
        
        if (containerEnd !== -1) {
            containers.push({ start: pos, end: containerEnd });
            pos = containerEnd;
        } else {
            break;
        }
    }
    
    // Return the innermost (last) container that has a code block
    for (let i = containers.length - 1; i >= 0; i--) {
        const container = containers[i];
        const containerContent = content.substring(container.start, container.end);
        if (containerContent.includes('<pre><code class="language-mermaid">')) {
            return container;
        }
    }
    
    return containers.length > 0 ? containers[containers.length - 1] : null;
}

function fixFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    const original = content;
    
    // Find all container starts
    const containerPattern = /<div class="mermaid-diagram-container">/g;
    const containerStarts = [];
    let match;
    
    while ((match = containerPattern.exec(content)) !== null) {
        containerStarts.push(match.index);
    }
    
    // Process in reverse to maintain indices
    for (let i = containerStarts.length - 1; i >= 0; i--) {
        const startPos = containerStarts[i];
        const innermost = findInnermostContainer(content, startPos);
        
        if (innermost && innermost.start === startPos) {
            // This is already the innermost, check if there are nested ones before it
            if (i > 0) {
                const prevStart = containerStarts[i - 1];
                // Check if this container is nested inside the previous one
                const prevInnermost = findInnermostContainer(content, prevStart);
                if (prevInnermost && prevInnermost.end > innermost.end) {
                    // Previous container wraps this one, extract inner content and replace outer
                    const innerContent = content.substring(innermost.start, innermost.end);
                    const outerContent = content.substring(prevStart, prevInnermost.end);
                    
                    // Replace outer with inner
                    content = content.substring(0, prevStart) + innerContent + content.substring(prevInnermost.end);
                }
            }
        }
    }
    
    // Also fix any remaining nested patterns
    let changed = true;
    let iterations = 0;
    while (changed && iterations < 10) {
        changed = false;
        iterations++;
        
        const nestedPattern = /<div class="mermaid-diagram-container">\s*<div class="mermaid-diagram-container">/g;
        let nestedMatch;
        
        while ((nestedMatch = nestedPattern.exec(content)) !== null) {
            const outerStart = nestedMatch.index;
            const innerStart = outerStart + '<div class="mermaid-diagram-container">'.length;
            
            // Find inner end
            let divCount = 0;
            let innerEnd = -1;
            
            for (let i = innerStart; i < content.length; i++) {
                if (content.substring(i, i + 4) === '<div') {
                    divCount++;
                } else if (content.substring(i, i + 6) === '</div>') {
                    divCount--;
                    if (divCount === 0) {
                        innerEnd = i + 6;
                        break;
                    }
                }
            }
            
            if (innerEnd !== -1) {
                // Find outer end
                divCount = 0;
                let outerEnd = -1;
                
                for (let i = outerStart; i < content.length; i++) {
                    if (content.substring(i, i + 4) === '<div') {
                        divCount++;
                    } else if (content.substring(i, i + 6) === '</div>') {
                        divCount--;
                        if (divCount === 0) {
                            outerEnd = i + 6;
                            break;
                        }
                    }
                }
                
                if (outerEnd !== -1) {
                    // Extract inner content
                    const innerContent = content.substring(innerStart, innerEnd - '</div>'.length);
                    const replacement = `<div class="mermaid-diagram-container">${innerContent}</div>`;
                    content = content.substring(0, outerStart) + replacement + content.substring(outerEnd);
                    changed = true;
                    nestedPattern.lastIndex = 0;
                    break;
                }
            }
        }
    }
    
    if (content !== original) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`  Fixed ${path.basename(filePath)}`);
        return true;
    }
    
    return false;
}

function main() {
    console.log('Fixing all nested containers (final)...\n');
    
    const files = fs.readdirSync(DOCS_DIR)
        .filter(file => file.endsWith('.md'))
        .map(file => path.join(DOCS_DIR, file))
        .sort();
    
    let fixedCount = 0;
    files.forEach(file => {
        if (fixFile(file)) {
            fixedCount++;
        }
    });
    
    console.log(`\nDone! Fixed ${fixedCount} file(s).`);
}

if (require.main === module) {
    main();
}

module.exports = { fixFile };
