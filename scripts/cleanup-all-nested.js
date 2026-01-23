#!/usr/bin/env node

/**
 * Comprehensive script to clean up all nested and corrupted mermaid-diagram-container divs
 */

const fs = require('fs');
const path = require('path');

const DOCS_DIR = path.join(__dirname, '..', 'docs');

function findAndExtractValidContainer(content, startPos) {
    // Look for a valid container structure: <div class="mermaid-diagram-container">...<img>...<details>...<pre><code>...</code></pre>...</details>...</div>
    const containerStart = content.indexOf('<div class="mermaid-diagram-container">', startPos);
    if (containerStart === -1) return null;
    
    // Find the matching closing </div>
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
    
    const containerContent = content.substring(containerStart, containerEnd);
    
    // Check if this container has the expected structure (img and code block)
    const hasImg = containerContent.includes('<img src="{{ site.baseurl }}');
    const hasCodeBlock = containerContent.includes('<pre><code class="language-mermaid">');
    
    if (hasImg && hasCodeBlock) {
        return { start: containerStart, end: containerEnd, content: containerContent };
    }
    
    return null;
}

function cleanFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    const original = content;
    
    // Find all valid containers
    const validContainers = [];
    let searchPos = 0;
    
    while (true) {
        const container = findAndExtractValidContainer(content, searchPos);
        if (!container) break;
        
        validContainers.push(container);
        searchPos = container.end;
    }
    
    // If we found valid containers and there are nested ones, clean them up
    if (validContainers.length > 0) {
        // Remove all container divs first
        let cleaned = content;
        let offset = 0;
        
        // Process in reverse to maintain indices
        for (let i = validContainers.length - 1; i >= 0; i--) {
            const container = validContainers[i];
            const adjustedStart = container.start + offset;
            const adjustedEnd = container.end + offset;
            
            // Check if this container is nested inside another
            if (i > 0) {
                const prevContainer = validContainers[i - 1];
                if (adjustedStart > prevContainer.start && adjustedEnd < prevContainer.end) {
                    // This is nested, remove it
                    cleaned = cleaned.substring(0, adjustedStart) + cleaned.substring(adjustedEnd);
                    offset -= (adjustedEnd - adjustedStart);
                }
            }
        }
        
        content = cleaned;
    }
    
    // Also remove any corrupted patterns like "subgraph<div" or escaped HTML in code blocks
    content = content.replace(/subgraph\s*<div class="mermaid-diagram-container">/g, 'subgraph "');
    content = content.replace(/subgraph\s*&lt;div class="mermaid-diagram-container"&gt;/g, 'subgraph "');
    
    // Remove any escaped HTML that got into mermaid code blocks
    content = content.replace(/&lt;div class="mermaid-diagram-container"&gt;/g, '');
    content = content.replace(/&lt;\/div&gt;/g, '');
    content = content.replace(/&lt;img[^&]*&gt;/g, '');
    content = content.replace(/&lt;details&gt;/g, '');
    content = content.replace(/&lt;\/details&gt;/g, '');
    content = content.replace(/&lt;pre&gt;&lt;code[^&]*&gt;/g, '');
    content = content.replace(/&lt;\/code&gt;&lt;\/pre&gt;/g, '');
    
    if (content !== original) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`  Cleaned ${path.basename(filePath)}`);
        return true;
    }
    
    return false;
}

function main() {
    console.log('Cleaning up all nested and corrupted containers...\n');
    
    const files = fs.readdirSync(DOCS_DIR)
        .filter(file => file.endsWith('.md'))
        .map(file => path.join(DOCS_DIR, file))
        .sort();
    
    let fixedCount = 0;
    files.forEach(file => {
        if (cleanFile(file)) {
            fixedCount++;
        }
    });
    
    console.log(`\nDone! Cleaned ${fixedCount} file(s).`);
}

if (require.main === module) {
    main();
}

module.exports = { cleanFile };
