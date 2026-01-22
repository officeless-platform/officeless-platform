#!/usr/bin/env node

/**
 * Script to render Mermaid diagrams to SVG and update documentation
 * This script processes all .md files in the docs/ directory and:
 * 1. Extracts Mermaid code blocks
 * 2. Renders them to SVG using @mermaid-js/mermaid-cli
 * 3. Updates the markdown files to include the rendered SVG
 * 4. Adds collapsible sections with the original Mermaid code (collapsed by default)
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const crypto = require('crypto');

const DOCS_DIR = path.join(__dirname, '..', 'docs');
const DIAGRAMS_DIR = path.join(__dirname, '..', 'assets', 'diagrams', 'rendered');

// Ensure diagrams directory exists
if (!fs.existsSync(DIAGRAMS_DIR)) {
    fs.mkdirSync(DIAGRAMS_DIR, { recursive: true });
}

// Function to generate a unique filename for a diagram
function generateDiagramFilename(content, index, fileBaseName) {
    const hash = crypto.createHash('md5').update(content).digest('hex').substring(0, 8);
    return `${fileBaseName}-diagram-${index + 1}-${hash}.svg`;
}

// Function to render Mermaid diagram to SVG
function renderMermaidToSVG(mermaidCode, outputPath) {
    try {
        // Create temporary file with Mermaid code
        const tempFile = path.join(DIAGRAMS_DIR, `temp-${Date.now()}.mmd`);
        fs.writeFileSync(tempFile, mermaidCode, 'utf8');
        
        // Check if mermaid-cli is available
        let mermaidCLI;
        const possiblePaths = [
            require.resolve('@mermaid-js/mermaid-cli/bin/mmdc'),
            path.join(__dirname, '..', 'node_modules', '@mermaid-js', 'mermaid-cli', 'bin', 'mmdc'),
            path.join(process.cwd(), 'node_modules', '@mermaid-js', 'mermaid-cli', 'bin', 'mmdc')
        ];
        
        for (const possiblePath of possiblePaths) {
            try {
                if (fs.existsSync(possiblePath)) {
                    mermaidCLI = possiblePath;
                    break;
                }
            } catch (e) {
                // Continue to next path
            }
        }
        
        // Try npx as fallback
        if (!mermaidCLI) {
            try {
                execSync('which npx', { stdio: 'pipe' });
                mermaidCLI = 'npx'; // Use npx to run mermaid-cli
            } catch (e) {
                console.error('Error: @mermaid-js/mermaid-cli is not installed.');
                console.error('Please install it with: npm install --save-dev @mermaid-js/mermaid-cli');
                process.exit(1);
            }
        }
        
        // Render using mermaid-cli
        // -b transparent: transparent background
        // -w 1200: width 1200px
        // -s 2: scale 2 for better quality
        let command;
        if (mermaidCLI === 'npx') {
            command = `npx -y @mermaid-js/mermaid-cli -i "${tempFile}" -o "${outputPath}" -b transparent -w 1200 -s 2`;
        } else {
            command = `"${mermaidCLI}" -i "${tempFile}" -o "${outputPath}" -b transparent -w 1200 -s 2`;
        }
        
        execSync(command, {
            stdio: 'pipe',
            encoding: 'utf8'
        });
        
        // Clean up temp file
        if (fs.existsSync(tempFile)) {
            fs.unlinkSync(tempFile);
        }
        
        return true;
    } catch (error) {
        console.error(`Error rendering diagram to ${outputPath}:`, error.message);
        if (error.stdout) console.error('STDOUT:', error.stdout);
        if (error.stderr) console.error('STDERR:', error.stderr);
        return false;
    }
}

// Function to process a markdown file
function processMarkdownFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const mermaidRegex = /```mermaid\n([\s\S]*?)```/g;
    let match;
    let newContent = content;
    let offset = 0;
    let diagramIndex = 0;
    const fileBaseName = path.basename(filePath, '.md');
    const matches = [];
    
    // Collect all matches first
    while ((match = mermaidRegex.exec(content)) !== null) {
        matches.push({
            fullMatch: match[0],
            mermaidCode: match[1].trim(),
            startIndex: match.index
        });
    }
    
    if (matches.length === 0) {
        return false; // No diagrams to process
    }
    
    console.log(`  Found ${matches.length} Mermaid diagram(s)`);
    
    // Process matches in reverse order to maintain correct indices
    for (let i = matches.length - 1; i >= 0; i--) {
        const { fullMatch, mermaidCode, startIndex } = matches[i];
        
        // Generate filename for this diagram
        const diagramFilename = generateDiagramFilename(mermaidCode, i, fileBaseName);
        const diagramPath = path.join(DIAGRAMS_DIR, diagramFilename);
        const relativePath = path.relative(path.dirname(filePath), diagramPath).replace(/\\/g, '/');
        
        // Render diagram
        console.log(`  Rendering diagram ${i + 1}/${matches.length}...`);
        if (renderMermaidToSVG(mermaidCode, diagramPath)) {
            // Create replacement with rendered SVG and collapsible code
            // Using HTML details/summary for collapsible section
            const replacement = `<div class="mermaid-diagram-container">

![Mermaid Diagram](${relativePath})

<details>
<summary>View Mermaid source code</summary>

\`\`\`mermaid
${mermaidCode}
\`\`\`

</details>

</div>`;
            
            // Replace in newContent (processing in reverse to maintain indices)
            const adjustedStart = startIndex + offset;
            const before = newContent.substring(0, adjustedStart);
            const after = newContent.substring(adjustedStart + fullMatch.length);
            newContent = before + replacement + after;
            
            // Update offset for next replacement
            offset += replacement.length - fullMatch.length;
            
            diagramIndex++;
        }
    }
    
    // Write updated content back to file
    if (newContent !== content) {
        fs.writeFileSync(filePath, newContent, 'utf8');
        console.log(`  ✓ Updated ${path.basename(filePath)}`);
        return true;
    }
    
    return false;
}

// Main function
function main() {
    console.log('Starting Mermaid diagram rendering...\n');
    
    // Process all markdown files in docs directory
    const files = fs.readdirSync(DOCS_DIR)
        .filter(file => file.endsWith('.md') && file !== 'index.md')
        .map(file => path.join(DOCS_DIR, file))
        .sort();
    
    console.log(`Found ${files.length} markdown files to process\n`);
    
    let processedCount = 0;
    files.forEach(file => {
        console.log(`Processing ${path.basename(file)}...`);
        if (processMarkdownFile(file)) {
            processedCount++;
        }
        console.log('');
    });
    
    console.log(`\nDone! Processed ${processedCount} file(s) with diagrams.`);
    console.log(`Rendered diagrams are in: ${DIAGRAMS_DIR}`);
}

if (require.main === module) {
    main();
}

module.exports = { processMarkdownFile, renderMermaidToSVG };
