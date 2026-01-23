#!/usr/bin/env node

/**
 * Script to force re-render diagrams that have been updated
 * Extracts mermaid code from details sections and re-renders
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const crypto = require('crypto');

const DOCS_DIR = path.join(__dirname, '..', 'docs');
const DIAGRAMS_DIR = path.join(__dirname, '..', 'assets', 'diagrams', 'rendered');

function generateDiagramFilename(content, index, fileBaseName) {
    const hash = crypto.createHash('md5').update(content).digest('hex').substring(0, 8);
    return `${fileBaseName}-diagram-${index + 1}-${hash}.svg`;
}

function renderMermaidToSVG(mermaidCode, outputPath) {
    try {
        const tempFile = path.join(DIAGRAMS_DIR, `temp-${Date.now()}.mmd`);
        fs.writeFileSync(tempFile, mermaidCode, 'utf8');
        
        let mermaidCLI;
        try {
            execSync('which npx', { stdio: 'pipe' });
            mermaidCLI = 'npx';
        } catch (e) {
            const possiblePaths = [
                path.join(__dirname, '..', 'node_modules', '@mermaid-js', 'mermaid-cli', 'src', 'cli.js'),
                path.join(process.cwd(), 'node_modules', '@mermaid-js', 'mermaid-cli', 'src', 'cli.js')
            ];
            
            for (const possiblePath of possiblePaths) {
                if (fs.existsSync(possiblePath)) {
                    mermaidCLI = possiblePath;
                    break;
                }
            }
        }
        
        if (!mermaidCLI) {
            console.error('Error: mermaid-cli not found');
            return false;
        }
        
        let command;
        if (mermaidCLI === 'npx') {
            command = `npx -y @mermaid-js/mermaid-cli -i "${tempFile}" -o "${outputPath}" -b transparent -w 800 -H auto -s 2`;
        } else {
            command = `node "${mermaidCLI}" -i "${tempFile}" -o "${outputPath}" -b transparent -w 800 -H auto -s 2`;
        }
        
        execSync(command, {
            stdio: 'pipe',
            encoding: 'utf8',
            env: { ...process.env, NODE_OPTIONS: '--no-warnings' }
        });
        
        if (fs.existsSync(tempFile)) {
            fs.unlinkSync(tempFile);
        }
        
        return true;
    } catch (error) {
        console.error(`Error rendering diagram:`, error.message);
        return false;
    }
}

function processFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const fileBaseName = path.basename(filePath, '.md');
    
    // Find all mermaid code blocks in details sections
    const codeBlockRegex = /<pre><code class="language-mermaid">([\s\S]*?)<\/code><\/pre>/g;
    let match;
    const diagrams = [];
    let index = 0;
    
    while ((match = codeBlockRegex.exec(content)) !== null) {
        const mermaidCode = match[1]
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .replace(/&amp;/g, '&')
            .replace(/&#39;/g, "'")
            .trim();
        
        if (mermaidCode && mermaidCode.length > 0) {
            const diagramFilename = generateDiagramFilename(mermaidCode, index, fileBaseName);
            const diagramPath = path.join(DIAGRAMS_DIR, diagramFilename);
            diagrams.push({ code: mermaidCode, path: diagramPath, filename: diagramFilename, index });
            index++;
        }
    }
    
    if (diagrams.length === 0) {
        return false;
    }
    
    console.log(`  Found ${diagrams.length} diagram(s) to render`);
    
    // Render each diagram
    diagrams.forEach((diagram, i) => {
        console.log(`  Rendering diagram ${i + 1}/${diagrams.length}...`);
        if (renderMermaidToSVG(diagram.code, diagram.path)) {
            console.log(`    ✓ Rendered: ${diagram.filename}`);
        } else {
            console.log(`    ✗ Failed: ${diagram.filename}`);
        }
    });
    
    return true;
}

function main() {
    console.log('Force re-rendering updated diagrams...\n');
    
    const files = fs.readdirSync(DOCS_DIR)
        .filter(file => file.endsWith('.md'))
        .map(file => path.join(DOCS_DIR, file))
        .sort();
    
    let processedCount = 0;
    files.forEach(file => {
        console.log(`Processing ${path.basename(file)}...`);
        if (processFile(file)) {
            processedCount++;
        }
        console.log('');
    });
    
    console.log(`Done! Processed ${processedCount} file(s).`);
}

if (require.main === module) {
    main();
}

module.exports = { processFile, renderMermaidToSVG };
