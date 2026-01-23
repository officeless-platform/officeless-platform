#!/usr/bin/env node

/**
 * Script to update diagram image references after re-rendering
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DOCS_DIR = path.join(__dirname, '..', 'docs');
const DIAGRAMS_DIR = path.join(__dirname, '..', 'assets', 'diagrams', 'rendered');

function generateDiagramFilename(content, index, fileBaseName) {
    const hash = crypto.createHash('md5').update(content).digest('hex').substring(0, 8);
    return `${fileBaseName}-diagram-${index + 1}-${hash}.svg`;
}

function updateFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;
    const fileBaseName = path.basename(filePath, '.md');
    
    // Find all mermaid code blocks and update image references
    const codeBlockRegex = /<pre><code class="language-mermaid">([\s\S]*?)<\/code><\/pre>/g;
    const imgRegex = /<img src="\{\{ site\.baseurl \}\}\/assets\/diagrams\/rendered\/([^"]+)" alt="Mermaid Diagram"/g;
    
    let match;
    const diagrams = [];
    let index = 0;
    
    // Extract mermaid code blocks
    while ((match = codeBlockRegex.exec(content)) !== null) {
        const mermaidCode = match[1]
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .replace(/&amp;/g, '&')
            .replace(/&#39;/g, "'")
            .trim();
        
        if (mermaidCode && mermaidCode.length > 0) {
            const expectedFilename = generateDiagramFilename(mermaidCode, index, fileBaseName);
            diagrams.push({ code: mermaidCode, expectedFilename, index });
            index++;
        }
    }
    
    // Update image references
    let imgMatch;
    let imgIndex = 0;
    while ((imgMatch = imgRegex.exec(content)) !== null) {
        if (imgIndex < diagrams.length) {
            const oldFilename = imgMatch[1];
            const newFilename = diagrams[imgIndex].expectedFilename;
            
            if (oldFilename !== newFilename) {
                // Check if new file exists
                const newPath = path.join(DIAGRAMS_DIR, newFilename);
                if (fs.existsSync(newPath)) {
                    content = content.replace(
                        `<img src="{{ site.baseurl }}/assets/diagrams/rendered/${oldFilename}"`,
                        `<img src="{{ site.baseurl }}/assets/diagrams/rendered/${newFilename}"`
                    );
                    console.log(`    Updated reference: ${oldFilename} -> ${newFilename}`);
                }
            }
            imgIndex++;
        }
    }
    
    if (content !== originalContent) {
        fs.writeFileSync(filePath, content, 'utf8');
        return true;
    }
    
    return false;
}

function main() {
    console.log('Updating diagram image references...\n');
    
    const files = fs.readdirSync(DOCS_DIR)
        .filter(file => file.endsWith('.md'))
        .map(file => path.join(DOCS_DIR, file))
        .sort();
    
    let updatedCount = 0;
    files.forEach(file => {
        console.log(`Processing ${path.basename(file)}...`);
        if (updateFile(file)) {
            updatedCount++;
            console.log(`  ✓ Updated`);
        } else {
            console.log(`  - No changes needed`);
        }
        console.log('');
    });
    
    console.log(`Done! Updated ${updatedCount} file(s).`);
}

if (require.main === module) {
    main();
}

module.exports = { updateFile };
