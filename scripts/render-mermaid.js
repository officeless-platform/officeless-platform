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
        // In version 11.x, the CLI is at src/cli.js and it's an ES module
        // Best approach is to use npx which handles the binary correctly
        let mermaidCLI;
        try {
            execSync('which npx', { stdio: 'pipe' });
            mermaidCLI = 'npx'; // Use npx to run mermaid-cli (handles ES modules correctly)
        } catch (e) {
            // Try to find the binary directly (for version 11.x it's at src/cli.js)
            const possiblePaths = [
                path.join(__dirname, '..', 'node_modules', '@mermaid-js', 'mermaid-cli', 'src', 'cli.js'),
                path.join(process.cwd(), 'node_modules', '@mermaid-js', 'mermaid-cli', 'src', 'cli.js'),
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
            
            if (!mermaidCLI) {
                console.error('Error: @mermaid-js/mermaid-cli is not installed.');
                console.error('Please install it with: npm install --save-dev @mermaid-js/mermaid-cli');
                process.exit(1);
            }
        }
        
        // Render using mermaid-cli
        // -b transparent: transparent background (no colors/backgrounds)
        // -w 800: width 800px (more vertical layout, height auto-calculated)
        // -s 2: scale 2 for better quality
        let command;
        if (mermaidCLI === 'npx') {
            // Use npx which handles ES modules correctly
            command = `npx -y @mermaid-js/mermaid-cli -i "${tempFile}" -o "${outputPath}" -b transparent -w 800 -s 2`;
        } else {
            // For direct path, use node to run the ES module
            command = `node "${mermaidCLI}" -i "${tempFile}" -o "${outputPath}" -b transparent -w 800 -s 2`;
        }
        
        execSync(command, {
            stdio: 'pipe',
            encoding: 'utf8',
            env: { ...process.env, NODE_OPTIONS: '--no-warnings' }
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
    
    // Define regex for both markdown and HTML mermaid code blocks
    const markdownMermaidRegex = /```mermaid\n([\s\S]*?)```/g;
    const htmlMermaidRegex = /<pre><code class="language-mermaid">([\s\S]*?)<\/code><\/pre>/g;
    
    // Check if file has mermaid code blocks that need rendering
    const hasMarkdownMermaid = markdownMermaidRegex.test(content);
    const hasHtmlMermaid = htmlMermaidRegex.test(content);
    const hasRenderedDiagram = content.includes('mermaid-diagram-container') && content.includes('<img src="{{ site.baseurl }}');
    
    // Skip only if it has rendered diagrams AND no mermaid code blocks at all
    if (hasRenderedDiagram && !hasMarkdownMermaid && !hasHtmlMermaid) {
        console.log(`  Skipping ${path.basename(filePath)} (already rendered, no mermaid code blocks)`);
        return false;
    }
    
    // Reset regexes for actual matching
    markdownMermaidRegex.lastIndex = 0;
    htmlMermaidRegex.lastIndex = 0;
    
    let match;
    let newContent = content;
    let offset = 0;
    let diagramIndex = 0;
    const fileBaseName = path.basename(filePath, '.md');
    const matches = [];
    
    // Collect all markdown mermaid code blocks
    while ((match = markdownMermaidRegex.exec(content)) !== null) {
        matches.push({
            fullMatch: match[0],
            mermaidCode: match[1].trim(),
            startIndex: match.index,
            type: 'markdown'
        });
    }
    
    // Collect all HTML mermaid code blocks
    while ((match = htmlMermaidRegex.exec(content)) !== null) {
        // Unescape HTML entities
        const mermaidCode = match[1]
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .replace(/&amp;/g, '&')
            .replace(/&#39;/g, "'")
            .trim();
        
        matches.push({
            fullMatch: match[0],
            mermaidCode: mermaidCode,
            startIndex: match.index,
            type: 'html'
        });
    }
    
    if (matches.length === 0) {
        return false; // No diagrams to process
    }
    
    console.log(`  Found ${matches.length} Mermaid diagram(s)`);
    
    // Process matches in reverse order to maintain correct indices
    for (let i = matches.length - 1; i >= 0; i--) {
        const { fullMatch, mermaidCode, startIndex, type } = matches[i];
        
        // Generate filename for this diagram
        const diagramFilename = generateDiagramFilename(mermaidCode, i, fileBaseName);
        const diagramPath = path.join(DIAGRAMS_DIR, diagramFilename);
        // Use Jekyll baseurl format for proper path resolution
        const relativePath = `{{ site.baseurl }}/assets/diagrams/rendered/${diagramFilename}`;
        
        // Render diagram
        console.log(`  Rendering diagram ${i + 1}/${matches.length}...`);
        if (renderMermaidToSVG(mermaidCode, diagramPath)) {
            // Create replacement with rendered SVG and collapsible code
            // Using HTML details/summary for collapsible section
            // Use HTML img tag with Jekyll baseurl for proper image rendering
            // Use HTML pre/code tags instead of markdown code blocks (markdown doesn't process inside HTML)
            const escapedCode = mermaidCode
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#39;');
            
            const replacement = `<div class="mermaid-diagram-container">

<img src="${relativePath}" alt="Mermaid Diagram" style="max-width: 100%; height: auto;">

<details>
<summary>View Mermaid source code</summary>

<pre><code class="language-mermaid">${escapedCode}</code></pre>

</details>

</div>`;
            
            // Replace the code block (markdown or HTML) with the HTML structure
            // For HTML blocks, we need to find the full container structure and replace it
            if (type === 'html') {
                // Find the mermaid-diagram-container that contains this code block
                const adjustedStart = startIndex + offset;
                const beforeMatch = newContent.substring(0, adjustedStart);
                
                // Find the start of the mermaid-diagram-container
                const containerStart = beforeMatch.lastIndexOf('<div class="mermaid-diagram-container">');
                
                if (containerStart !== -1) {
                    // Find the matching closing </div> for the container
                    // Count div tags to find the right closing tag
                    let divCount = 0;
                    let containerEnd = containerStart;
                    let found = false;
                    
                    for (let i = containerStart; i < newContent.length; i++) {
                        const substr = newContent.substring(i, i + 4);
                        const endSubstr = newContent.substring(i, i + 6);
                        if (substr === '<div') {
                            divCount++;
                        } else if (endSubstr === '</div>') {
                            divCount--;
                            if (divCount === 0) {
                                containerEnd = i + 6;
                                found = true;
                                break;
                            }
                        }
                    }
                    
                    if (found) {
                        // Replace the entire container
                        const fullContainer = newContent.substring(containerStart, containerEnd);
                        newContent = newContent.substring(0, containerStart) + replacement + newContent.substring(containerEnd);
                        // Adjust offset for subsequent replacements
                        offset += replacement.length - fullContainer.length;
                    } else {
                        // Fallback: just replace the code block
                        newContent = newContent.substring(0, adjustedStart) + replacement + newContent.substring(adjustedStart + fullMatch.length);
                        offset += replacement.length - fullMatch.length;
                    }
                } else {
                    // No container found, just replace the code block
                    newContent = newContent.substring(0, adjustedStart) + replacement + newContent.substring(adjustedStart + fullMatch.length);
                    offset += replacement.length - fullMatch.length;
                }
            } else {
                // Markdown block - simple replacement
                const adjustedStart = startIndex + offset;
                newContent = newContent.substring(0, adjustedStart) + replacement + newContent.substring(adjustedStart + fullMatch.length);
                offset += replacement.length - fullMatch.length;
            }
            
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
