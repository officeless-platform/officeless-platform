# Officeless Architecture Reference

> Enterprise-grade architecture documentation for Solution Architects, Enterprise IT, and Security/Compliance teams

## Documentation Site

Visit the live documentation at: **[https://officeless-platform.github.io/officeless-platform/](https://officeless-platform.github.io/officeless-platform/)**

## What is Officeless?

[Officeless](https://mekari.com/en/product/officeless/) is a platform solution designed to build custom applications tailored to your business needs. This repository contains comprehensive technical architecture documentation for enterprise deployments, hybrid cloud scenarios, and regulatory compliance requirements.

## Repository Structure

```
.
├── _config.yml          # Jekyll configuration
├── _layouts/            # Jekyll layouts
├── _includes/           # Jekyll includes (header, footer, sidebar)
├── assets/              # CSS, JS, and images
├── docs/                # Documentation files
└── .github/workflows/   # GitHub Actions workflows
```

## Local Development

To preview the documentation locally, you'll need both Ruby (for Jekyll) and Node.js (for Mermaid diagram rendering).

### Prerequisites

1. **Ruby** (3.0+ recommended) and **Bundler**
   ```bash
   # Check if Ruby is installed
   ruby --version
   
   # Install Bundler if not installed
   gem install bundler
   ```

2. **Node.js** (14.0+ required) and **npm**
   ```bash
   # Check if Node.js is installed
   node --version
   npm --version
   ```

### Setup Steps

1. **Install Ruby dependencies (Jekyll)**
   ```bash
   bundle install
   ```

2. **Install Node.js dependencies (Mermaid CLI)**
   ```bash
   npm install
   ```

3. **Render Mermaid diagrams** (optional, but recommended)
   ```bash
   npm run render-diagrams
   ```
   This will pre-render all Mermaid diagrams as SVG files for faster page loads.

### Running the Development Server

**Option 1: Jekyll only (if diagrams are already rendered)**
```bash
bundle exec jekyll serve
```

**Option 2: Build everything (render diagrams + Jekyll)**
```bash
npm run build-docs
# Then in another terminal:
bundle exec jekyll serve
```

**Option 3: Jekyll with auto-reload and watch mode**
```bash
bundle exec jekyll serve --livereload --watch
```

### Accessing the Site

Once the server is running, open your browser to:
- **Local URL**: `http://localhost:4000/officeless-platform/`
- **Network URL**: `http://127.0.0.1:4000/officeless-platform/`

The `--livereload` flag will automatically refresh the browser when you make changes to files.

### Troubleshooting

**Issue: `bundle install` fails**
- Make sure Ruby and Bundler are installed correctly
- Try `gem update bundler` if you have an older version

**Issue: Diagrams not showing**
- Run `npm run render-diagrams` to generate SVG files
- Check that `assets/diagrams/rendered/` directory contains SVG files

**Issue: Port 4000 already in use**
- Use a different port: `bundle exec jekyll serve --port 4001`

**Issue: Changes not reflecting**
- Stop the server (Ctrl+C) and restart
- Or use `--watch` flag for auto-reload

## Contributing

This documentation is maintained for internal enablement and external technical evaluation. For updates or corrections, please follow the standard contribution process.

---

**Note**: This documentation is suitable for sharing with enterprise customers, auditors, and regulatory bodies. It maintains a technical, non-sales focused approach appropriate for Solution Architect and technical leadership audiences.
