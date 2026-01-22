# GitHub Pages Setup Guide

This guide explains how to set up and deploy GitHub Pages for the Officeless Architecture Reference documentation.

## Prerequisites

- GitHub repository with push access
- GitHub Pages enabled (see steps below)

## Setup Methods

### Method 1: GitHub Actions (Recommended)

This repository includes a GitHub Actions workflow (`.github/workflows/pages.yml`) that automatically builds and deploys the site when you push to the `main` branch.

#### Steps:

1. **Enable GitHub Pages in Repository Settings**
   - Go to your repository on GitHub
   - Navigate to **Settings** → **Pages**
   - Under **Source**, select **GitHub Actions**
   - Click **Save**

2. **Push the workflow file** (if not already committed)
   ```bash
   git add .github/workflows/pages.yml
   git commit -m "Add GitHub Pages workflow"
   git push
   ```

3. **Verify deployment**
   - Go to **Actions** tab in your repository
   - You should see the "Deploy GitHub Pages" workflow running
   - Once complete, your site will be available at:
     `https://<username>.github.io/<repository-name>/`
   - Or if using custom domain: your configured domain

### Method 2: Branch-based Deployment (Alternative)

If you prefer not to use GitHub Actions:

1. **Enable GitHub Pages in Repository Settings**
   - Go to **Settings** → **Pages**
   - Under **Source**, select **Deploy from a branch**
   - Select branch: `main` (or `gh-pages` if you prefer)
   - Select folder: `/ (root)`
   - Click **Save**

2. **Note**: This method requires Jekyll to be enabled in GitHub Pages settings, which will automatically build your site from the repository root.

## Configuration Files

The repository includes the following configuration:

- **`_config.yml`**: Jekyll configuration with theme and navigation
- **`Gemfile`**: Ruby dependencies for Jekyll
- **`.github/workflows/pages.yml`**: GitHub Actions workflow for automated deployment
- **`docs/index.md`**: Landing page for the documentation

## Site Structure

```
/
├── _config.yml          # Jekyll configuration
├── Gemfile              # Ruby dependencies
├── README.md            # Repository README
├── docs/                # Documentation files
│   ├── index.md         # Landing page
│   ├── 01-overview.md
│   ├── 02-platform-architecture.md
│   └── ...
└── .github/workflows/   # GitHub Actions
    └── pages.yml
```

## Custom Domain (Optional)

To use a custom domain:

1. **Add CNAME file** (if using `docs/` folder):
   ```bash
   echo "docs.yourdomain.com" > docs/CNAME
   ```

2. **Or add to repository root** (if using root):
   ```bash
   echo "docs.yourdomain.com" > CNAME
   ```

3. **Configure DNS**
   - Add a CNAME record pointing to `<username>.github.io`
   - Or A records pointing to GitHub Pages IPs:
     - 185.199.108.153
     - 185.199.109.153
     - 185.199.110.153
     - 185.199.111.153

4. **Enable in GitHub Settings**
   - Go to **Settings** → **Pages**
   - Enter your custom domain
   - Enable **Enforce HTTPS**

## Troubleshooting

### Build Failures

1. **Check GitHub Actions logs**
   - Go to **Actions** tab
   - Click on the failed workflow
   - Review error messages

2. **Common issues**:
   - Missing dependencies: Check `Gemfile`
   - Jekyll errors: Review `_config.yml` syntax
   - Markdown errors: Check markdown file syntax

### Site Not Updating

1. **Clear GitHub Pages cache**:
   - Make a small change to any file
   - Commit and push
   - This triggers a rebuild

2. **Check deployment status**:
   - Go to **Settings** → **Pages**
   - Verify deployment status

### Mermaid Diagrams Not Rendering

GitHub Pages with Jekyll may not render Mermaid diagrams by default. Options:

1. **Use GitHub's native Mermaid support** (recommended):
   - Mermaid diagrams in markdown are rendered automatically on GitHub
   - For GitHub Pages, consider using a Mermaid plugin or converting to images

2. **Convert to images**:
   - Use [Mermaid Live Editor](https://mermaid.live/) to generate SVG/PNG
   - Store in `assets/diagrams/` folder
   - Reference in markdown: `![Diagram](./assets/diagrams/platform.svg)`

## Local Development

To preview the site locally:

1. **Install Ruby and Bundler**:
   ```bash
   # macOS
   brew install ruby
   gem install bundler
   
   # Linux
   sudo apt-get install ruby-full
   gem install bundler
   ```

2. **Install dependencies**:
   ```bash
   bundle install
   ```

3. **Run Jekyll server**:
   ```bash
   bundle exec jekyll serve
   ```

4. **View site**:
   - Open browser to `http://localhost:4000`

## URL Structure

After deployment, your documentation will be available at:

- **Homepage**: `https://<username>.github.io/<repository-name>/`
- **Documentation**: `https://<username>.github.io/<repository-name>/docs/01-overview.html`
- **Or with baseurl**: `https://<username>.github.io/<repository-name>/docs/01-overview.html`

## Additional Resources

- [GitHub Pages Documentation](https://docs.github.com/en/pages)
- [Jekyll Documentation](https://jekyllrb.com/docs/)
- [Jekyll Themes](https://jekyllthemes.io/)
