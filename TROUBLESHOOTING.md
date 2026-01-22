# Troubleshooting GitHub Pages 404

## Common Issues and Solutions

### Issue: Getting 404 at root URL

**Possible Causes:**
1. Baseurl mismatch between `_config.yml` and GitHub Pages settings
2. Index.html not being generated correctly
3. GitHub Pages serving from wrong directory

**Solutions:**

1. **Check GitHub Pages Settings:**
   - Go to repository Settings → Pages
   - Source should be set to "GitHub Actions"
   - Verify the deployment is successful

2. **Verify Base Path:**
   - For repository `officeless-platform/officeless-platform`
   - URL should be: `https://officeless-platform.github.io/officeless-platform/`
   - Baseurl should be: `/officeless-platform`

3. **Check Workflow Logs:**
   - Go to Actions tab
   - Check the "Build with Jekyll" step
   - Look for the "Building Jekyll with baseurl:" message
   - Verify the baseurl matches your repository structure

4. **Verify Build Output:**
   - Check if `_site/index.html` exists after build
   - Check if `_site/docs/index.html` exists
   - Verify all paths include the baseurl prefix

5. **Test Locally:**
   ```bash
   bundle exec jekyll build --baseurl "/officeless-platform"
   # Check _site directory structure
   ls -la _site/
   ```

### If Still Getting 404:

1. **Clear GitHub Pages Cache:**
   - Make a small change to any file
   - Commit and push
   - This triggers a rebuild

2. **Check Repository Name:**
   - If repository is `officeless-platform/officeless-platform`
   - Baseurl should be `/officeless-platform`
   - If repository is `officeless-platform/officeless-platform` (user/org page)
   - Baseurl might be empty `/`

3. **Verify All URLs:**
   - All internal links should use `{{ site.baseurl }}` or `relative_url` filter
   - External links should be absolute URLs

4. **Check Permalinks:**
   - Ensure `docs/index.md` has `permalink: /docs/index.html`
   - Root `index.html` should have `permalink: /`
