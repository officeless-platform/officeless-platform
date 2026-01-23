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
   
   **⚠️ Important**: Avoid using system Ruby on macOS. Use a Ruby version manager instead.
   
   **Option A: Using Homebrew (Recommended)**
   ```bash
   # Install Ruby via Homebrew
   brew install ruby
   
   # Add to your ~/.zshrc or ~/.bash_profile:
   export PATH="/opt/homebrew/opt/ruby/bin:$PATH"
   export PATH="/opt/homebrew/lib/ruby/gems/3.3.0/bin:$PATH"
   
   # Reload shell
   source ~/.zshrc  # or source ~/.bash_profile
   
   # Verify installation
   ruby --version  # Should show 3.x.x
   ```
   
   **Option B: Using rbenv (Alternative)**
   ```bash
   # Install rbenv via Homebrew
   brew install rbenv ruby-build
   
   # Add to your ~/.zshrc or ~/.bash_profile:
   eval "$(rbenv init - zsh)"  # or eval "$(rbenv init - bash)"
   
   # Reload shell and install Ruby
   source ~/.zshrc
   rbenv install 3.3.0
   rbenv global 3.3.0
   
   # Verify installation
   ruby --version
   ```
   
   **Install Bundler**
   ```bash
   gem install bundler
   ```

2. **Node.js** (14.0+ required) and **npm**
   ```bash
   # Check if Node.js is installed
   node --version
   npm --version
   
   # If not installed, use Homebrew:
   brew install node
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

**Issue: `bundle install` fails with "Operation not permitted" or permission errors**
- **Solution**: You're using system Ruby. Switch to Homebrew Ruby or rbenv (see Prerequisites above)
- System Ruby requires sudo, which is not recommended
- After switching, run `bundle install` again

**Issue: `eventmachine` gem fails to compile with "iostream file not found"**
- **Solution 1**: Make sure Xcode Command Line Tools are installed:
  ```bash
  xcode-select --install
  ```
- **Solution 2**: Set SDK path before installing:
  ```bash
  export SDKROOT=$(xcrun --show-sdk-path)
  bundle install
  ```
- **Solution 3**: Use a Ruby version manager (rbenv/rvm) instead of system Ruby
- **Solution 4**: Install eventmachine separately with flags:
  ```bash
  gem install eventmachine -- --with-cppflags=-I$(xcrun --show-sdk-path)/usr/include
  ```

**Issue: Ruby version is too old (< 3.0)**
- Jekyll 4.3+ requires Ruby 3.0+
- Use Homebrew or rbenv to install Ruby 3.0+ (see Prerequisites)

**Issue: Diagrams not showing**
- Run `npm run render-diagrams` to generate SVG files
- Check that `assets/diagrams/rendered/` directory contains SVG files

**Issue: Port 4000 already in use**
- Use a different port: `bundle exec jekyll serve --port 4001`

**Issue: Changes not reflecting**
- Stop the server (Ctrl+C) and restart
- Or use `--watch` flag for auto-reload

**Issue: "Command not found: bundle"**
- Make sure Bundler is installed: `gem install bundler`
- If using rbenv, run `rbenv rehash` after installing bundler

## Contributing

This documentation is maintained for internal enablement and external technical evaluation. For updates or corrections, please follow the standard contribution process.

---

**Note**: This documentation is suitable for sharing with enterprise customers, auditors, and regulatory bodies. It maintains a technical, non-sales focused approach appropriate for Solution Architect and technical leadership audiences.
