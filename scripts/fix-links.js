#!/usr/bin/env node

/**
 * Script to fix all markdown links from .md to .html
 */

const fs = require('fs');
const path = require('path');

const DOCS_DIR = path.join(__dirname, '..', 'docs');
const ROOT_DIR = path.join(__dirname, '..');

function fixLinksInFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;
    
    // Replace all .md links with .html
    // Pattern 1: [text](./XX-filename.md) or [text](XX-filename.md)
    content = content.replace(/\[([^\]]+)\]\((\.\/)?(\d{2}-[^)]+)\.md\)/g, '[$1]($2$3.html)');
    
    // Pattern 2: Links without numbers at start (like index.md, but we want to keep those)
    // Actually, let's be more specific - only fix numbered docs
    content = content.replace(/\[([^\]]+)\]\((\.\/)?(\d{2}-[^)]+)\.md\)/g, '[$1]($2$3.html)');
    
    // Pattern 3: Links with site.baseurl that have .md
    content = content.replace(/\[([^\]]+)\]\(\{\{ site\.baseurl \}\}\/docs\/(\d{2}-[^)]+)\.md\)/g, '[$1]({{ site.baseurl }}/docs/$2.html)');
    
    // Pattern 4: Any remaining .md links in markdown format (catch-all)
    // But be careful not to replace code blocks or other contexts
    // Only replace in markdown link format: [text](path.md)
    content = content.replace(/\[([^\]]+)\]\(([^)]+)\.md\)/g, (match, text, path) => {
        // Skip if it's in a code block or already processed
        if (path.includes('.html') || path.includes('{{')) {
            return match;
        }
        return `[${text}](${path}.html)`;
    });
    
    if (content !== originalContent) {
        fs.writeFileSync(filePath, content, 'utf8');
        return true;
    }
    
    return false;
}

function main() {
    console.log('Fixing markdown links from .md to .html...\n');
    
    // Fix docs directory
    const docFiles = fs.readdirSync(DOCS_DIR)
        .filter(file => file.endsWith('.md'))
        .map(file => path.join(DOCS_DIR, file));
    
    let fixedCount = 0;
    docFiles.forEach(file => {
        if (fixLinksInFile(file)) {
            console.log(`Fixed: ${path.basename(file)}`);
            fixedCount++;
        }
    });
    
    // Fix root index.md
    const rootIndex = path.join(ROOT_DIR, 'index.md');
    if (fs.existsSync(rootIndex)) {
        if (fixLinksInFile(rootIndex)) {
            console.log(`Fixed: index.md`);
            fixedCount++;
        }
    }
    
    console.log(`\nDone! Fixed ${fixedCount} file(s).`);
}

if (require.main === module) {
    main();
}

module.exports = { fixLinksInFile };
