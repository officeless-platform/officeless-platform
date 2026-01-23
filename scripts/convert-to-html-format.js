#!/usr/bin/env node

/**
 * Script to convert existing markdown image syntax to HTML img tags
 * and markdown code blocks to HTML pre/code tags
 */

const fs = require('fs');
const path = require('path');

const DOCS_DIR = path.join(__dirname, '..', 'docs');

function convertFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;
    
    // First, remove any duplicate closing tags
    content = content.replace(/<\/details>\s*<\/div>\s*<\/details>\s*<\/div>/g, '</details>\n\n</div>');
    
    // Find all mermaid-diagram-container blocks (non-greedy to avoid nested matches)
    const containerRegex = /<div class="mermaid-diagram-container">([\s\S]*?)<\/div>(?!\s*<div class="mermaid-diagram-container">)/g;
    let match;
    const replacements = [];
    
    while ((match = containerRegex.exec(content)) !== null) {
        const block = match[0];
        const innerContent = match[1];
        
        // Check if it needs conversion (has markdown image syntax)
        if (innerContent.includes('![Mermaid Diagram]')) {
            // Extract image path
            const imageMatch = innerContent.match(/!\[Mermaid Diagram\]\(([^)]+)\)/);
            // Extract mermaid code (get the last one if multiple)
            const codeMatches = innerContent.match(/```mermaid\n([\s\S]*?)```/g);
            
            if (imageMatch && codeMatches && codeMatches.length > 0) {
                const imagePath = imageMatch[1];
                // Get the last code block (the actual source)
                const lastCodeMatch = codeMatches[codeMatches.length - 1];
                const mermaidCode = lastCodeMatch.replace(/```mermaid\n/, '').replace(/```$/, '').trim();
                
                // Escape HTML in code
                const escapedCode = mermaidCode
                    .replace(/&/g, '&amp;')
                    .replace(/</g, '&lt;')
                    .replace(/>/g, '&gt;')
                    .replace(/"/g, '&quot;')
                    .replace(/'/g, '&#39;');
                
                // Create HTML version
                const htmlBlock = `<div class="mermaid-diagram-container">

<img src="${imagePath}" alt="Mermaid Diagram" style="max-width: 100%; height: auto;">

<details>
<summary>View Mermaid source code</summary>

<pre><code class="language-mermaid">${escapedCode}</code></pre>

</details>

</div>`;
                
                replacements.push({ block, htmlBlock });
            }
        }
    }
    
    // Apply replacements in reverse order
    for (let i = replacements.length - 1; i >= 0; i--) {
        content = content.replace(replacements[i].block, replacements[i].htmlBlock);
    }
    
    // Clean up any remaining duplicate structures
    content = content.replace(/<\/details>\s*<\/div>\s*<\/details>\s*<\/div>/g, '</details>\n\n</div>');
    
    if (content !== originalContent) {
        fs.writeFileSync(filePath, content, 'utf8');
        return true;
    }
    
    return false;
}

function main() {
    console.log('Converting markdown syntax to HTML format...\n');
    
    const files = fs.readdirSync(DOCS_DIR)
        .filter(file => file.endsWith('.md'))
        .map(file => path.join(DOCS_DIR, file));
    
    let convertedCount = 0;
    files.forEach(file => {
        if (convertFile(file)) {
            console.log(`Converted: ${path.basename(file)}`);
            convertedCount++;
        }
    });
    
    console.log(`\nDone! Converted ${convertedCount} file(s).`);
}

if (require.main === module) {
    main();
}

module.exports = { convertFile };
