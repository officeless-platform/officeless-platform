(function() {
    // Get theme from localStorage or default to light
    const getTheme = () => {
        const stored = localStorage.getItem('theme');
        if (stored) return stored;
        
        // Check system preference
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            return 'dark';
        }
        
        return 'light';
    };

    // Set theme
    const setTheme = (theme) => {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
        
        // Update Prism theme if available
        const prismLight = document.querySelector('link[data-theme="prism-light"]');
        const prismDark = document.querySelector('link[data-theme="prism-dark"]');
        
        if (prismLight && prismDark) {
            if (theme === 'dark') {
                prismLight.disabled = true;
                prismDark.disabled = false;
            } else {
                prismLight.disabled = false;
                prismDark.disabled = true;
            }
        }
        
        // Dispatch theme change event
        const event = new CustomEvent('themeChanged', { detail: { theme } });
        document.dispatchEvent(event);
        
        // Update Mermaid theme if available
        if (window.mermaid) {
            mermaid.initialize({ 
                startOnLoad: false, 
                theme: theme === 'dark' ? 'dark' : 'default' 
            });
        }
    };

    // Initialize theme
    const initTheme = () => {
        const theme = getTheme();
        setTheme(theme);
    };

    // Theme toggle button
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            const currentTheme = document.documentElement.getAttribute('data-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            setTheme(newTheme);
        });
    }

    // Listen for system theme changes
    if (window.matchMedia) {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        mediaQuery.addEventListener('change', (e) => {
            // Only auto-switch if user hasn't manually set a preference
            if (!localStorage.getItem('theme')) {
                setTheme(e.matches ? 'dark' : 'light');
            }
        });
    }

    // Initialize on page load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initTheme);
    } else {
        initTheme();
    }
})();
