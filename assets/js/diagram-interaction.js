/**
 * Diagram Interaction Script
 * Provides zoom in/out and pan/drag functionality for Mermaid diagrams
 */

(function() {
    'use strict';

    // Configuration
    const ZOOM_STEP = 0.1;
    const MIN_ZOOM = 0.5;
    const MAX_ZOOM = 3.0;
    const DEFAULT_ZOOM = 1.0;

    // Initialize diagram interactions
    function initDiagramInteractions() {
        const containers = document.querySelectorAll('.mermaid-diagram-container');
        
        containers.forEach(function(container) {
            const img = container.querySelector('img');
            if (!img) return;

            // Hide the details section (Mermaid source code)
            const details = container.querySelector('details');
            if (details) {
                details.style.display = 'none';
            }

            // Create wrapper for zoom/pan functionality
            const wrapper = document.createElement('div');
            wrapper.className = 'diagram-wrapper';
            wrapper.style.position = 'relative';
            wrapper.style.overflow = 'hidden';
            wrapper.style.width = '100%';
            wrapper.style.borderRadius = '8px';
            wrapper.style.background = 'var(--bg-primary)';
            wrapper.style.border = '1px solid var(--border-color)';

            // Create viewport for panning
            const viewport = document.createElement('div');
            viewport.className = 'diagram-viewport';
            viewport.style.position = 'relative';
            viewport.style.width = '100%';
            viewport.style.height = '100%';
            viewport.style.overflow = 'hidden';
            viewport.style.cursor = 'grab';

            // Wrap image in viewport
            const imgParent = img.parentNode;
            imgParent.insertBefore(wrapper, img);
            wrapper.appendChild(viewport);
            viewport.appendChild(img);

            // Set initial styles for image
            img.style.display = 'block';
            img.style.margin = '0';
            img.style.transition = 'transform 0.1s ease-out';
            img.style.userSelect = 'none';
            img.style.pointerEvents = 'none';

            // Create controls container
            const controls = document.createElement('div');
            controls.className = 'diagram-controls';
            controls.style.position = 'absolute';
            controls.style.top = '10px';
            controls.style.right = '10px';
            controls.style.zIndex = '10';
            controls.style.display = 'flex';
            controls.style.gap = '8px';
            controls.style.background = 'var(--bg-secondary)';
            controls.style.padding = '8px';
            controls.style.borderRadius = '6px';
            controls.style.boxShadow = 'var(--shadow-md)';
            controls.style.border = '1px solid var(--border-color)';

            // Zoom state
            let currentZoom = DEFAULT_ZOOM;
            let currentPanX = 0;
            let currentPanY = 0;
            let isDragging = false;
            let startX = 0;
            let startY = 0;
            let startPanX = 0;
            let startPanY = 0;

            // Create zoom in button
            const zoomInBtn = createButton('+', 'Zoom In', function() {
                zoomIn();
            });

            // Create zoom out button
            const zoomOutBtn = createButton('−', 'Zoom Out', function() {
                zoomOut();
            });

            // Create reset button
            const resetBtn = createButton('⟲', 'Reset View', function() {
                resetView();
            });

            // Create fullscreen button
            const fullscreenBtn = createButton('⛶', 'Fullscreen', function() {
                toggleFullscreen();
            });

            controls.appendChild(zoomInBtn);
            controls.appendChild(zoomOutBtn);
            controls.appendChild(resetBtn);
            controls.appendChild(fullscreenBtn);
            wrapper.appendChild(controls);

            // Apply transform
            function applyTransform() {
                img.style.transform = `translate(${currentPanX}px, ${currentPanY}px) scale(${currentZoom})`;
            }

            // Zoom functions
            function zoomIn() {
                if (currentZoom < MAX_ZOOM) {
                    currentZoom = Math.min(currentZoom + ZOOM_STEP, MAX_ZOOM);
                    applyTransform();
                    updateButtonStates();
                }
            }

            function zoomOut() {
                if (currentZoom > MIN_ZOOM) {
                    currentZoom = Math.max(currentZoom - ZOOM_STEP, MIN_ZOOM);
                    applyTransform();
                    updateButtonStates();
                }
            }

            function resetView() {
                currentZoom = DEFAULT_ZOOM;
                currentPanX = 0;
                currentPanY = 0;
                applyTransform();
                updateButtonStates();
            }

            function updateButtonStates() {
                zoomInBtn.disabled = currentZoom >= MAX_ZOOM;
                zoomOutBtn.disabled = currentZoom <= MIN_ZOOM;
            }

            // Mouse wheel zoom
            viewport.addEventListener('wheel', function(e) {
                e.preventDefault();
                const delta = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP;
                const oldZoom = currentZoom;
                currentZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, currentZoom + delta));
                
                if (oldZoom !== currentZoom) {
                    // Zoom towards mouse position
                    const rect = viewport.getBoundingClientRect();
                    const mouseX = e.clientX - rect.left;
                    const mouseY = e.clientY - rect.top;
                    
                    const zoomRatio = currentZoom / oldZoom;
                    currentPanX = mouseX - (mouseX - currentPanX) * zoomRatio;
                    currentPanY = mouseY - (mouseY - currentPanY) * zoomRatio;
                    
                    applyTransform();
                    updateButtonStates();
                }
            }, { passive: false });

            // Mouse drag for panning
            viewport.addEventListener('mousedown', function(e) {
                if (e.button === 0) { // Left mouse button
                    isDragging = true;
                    startX = e.clientX;
                    startY = e.clientY;
                    startPanX = currentPanX;
                    startPanY = currentPanY;
                    viewport.style.cursor = 'grabbing';
                    e.preventDefault();
                }
            });

            document.addEventListener('mousemove', function(e) {
                if (isDragging) {
                    const deltaX = e.clientX - startX;
                    const deltaY = e.clientY - startY;
                    currentPanX = startPanX + deltaX;
                    currentPanY = startPanY + deltaY;
                    applyTransform();
                }
            });

            document.addEventListener('mouseup', function() {
                if (isDragging) {
                    isDragging = false;
                    viewport.style.cursor = 'grab';
                }
            });

            // Touch support for mobile
            let touchStartDistance = 0;
            let touchStartZoom = DEFAULT_ZOOM;
            let touchStartPanX = 0;
            let touchStartPanY = 0;
            let touchStartCenterX = 0;
            let touchStartCenterY = 0;

            viewport.addEventListener('touchstart', function(e) {
                if (e.touches.length === 1) {
                    // Single touch - pan
                    isDragging = true;
                    startX = e.touches[0].clientX;
                    startY = e.touches[0].clientY;
                    startPanX = currentPanX;
                    startPanY = currentPanY;
                } else if (e.touches.length === 2) {
                    // Two touches - pinch zoom
                    e.preventDefault();
                    const touch1 = e.touches[0];
                    const touch2 = e.touches[1];
                    touchStartDistance = Math.hypot(
                        touch2.clientX - touch1.clientX,
                        touch2.clientY - touch1.clientY
                    );
                    touchStartZoom = currentZoom;
                    touchStartPanX = currentPanX;
                    touchStartPanY = currentPanY;
                    
                    // Calculate center point
                    const rect = viewport.getBoundingClientRect();
                    touchStartCenterX = ((touch1.clientX + touch2.clientX) / 2) - rect.left;
                    touchStartCenterY = ((touch1.clientY + touch2.clientY) / 2) - rect.top;
                }
            }, { passive: false });

            viewport.addEventListener('touchmove', function(e) {
                if (e.touches.length === 1 && isDragging) {
                    // Single touch - pan
                    const deltaX = e.touches[0].clientX - startX;
                    const deltaY = e.touches[0].clientY - startY;
                    currentPanX = startPanX + deltaX;
                    currentPanY = startPanY + deltaY;
                    applyTransform();
                } else if (e.touches.length === 2) {
                    // Two touches - pinch zoom
                    e.preventDefault();
                    const touch1 = e.touches[0];
                    const touch2 = e.touches[1];
                    const distance = Math.hypot(
                        touch2.clientX - touch1.clientX,
                        touch2.clientY - touch1.clientY
                    );
                    
                    if (touchStartDistance > 0) {
                        const zoomRatio = distance / touchStartDistance;
                        currentZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, touchStartZoom * zoomRatio));
                        
                        // Adjust pan to zoom towards center
                        const zoomChange = currentZoom / touchStartZoom;
                        currentPanX = touchStartCenterX - (touchStartCenterX - touchStartPanX) * zoomChange;
                        currentPanY = touchStartCenterY - (touchStartCenterY - touchStartPanY) * zoomChange;
                        
                        applyTransform();
                        updateButtonStates();
                    }
                }
            }, { passive: false });

            viewport.addEventListener('touchend', function() {
                isDragging = false;
                touchStartDistance = 0;
            });

            // Fullscreen functionality
            function toggleFullscreen() {
                if (!document.fullscreenElement) {
                    wrapper.requestFullscreen().then(function() {
                        fullscreenBtn.textContent = '⛶';
                        fullscreenBtn.title = 'Exit Fullscreen';
                    }).catch(function(err) {
                        console.error('Error entering fullscreen:', err);
                    });
                } else {
                    document.exitFullscreen().then(function() {
                        fullscreenBtn.textContent = '⛶';
                        fullscreenBtn.title = 'Fullscreen';
                    }).catch(function(err) {
                        console.error('Error exiting fullscreen:', err);
                    });
                }
            }

            // Update fullscreen button on fullscreen change
            document.addEventListener('fullscreenchange', function() {
                if (document.fullscreenElement === wrapper) {
                    fullscreenBtn.textContent = '⛶';
                    fullscreenBtn.title = 'Exit Fullscreen';
                } else {
                    fullscreenBtn.textContent = '⛶';
                    fullscreenBtn.title = 'Fullscreen';
                }
            });

            // Initialize button states
            updateButtonStates();
            applyTransform();

            // Set initial viewport height based on image
            img.addEventListener('load', function() {
                const aspectRatio = img.naturalHeight / img.naturalWidth;
                const containerWidth = wrapper.offsetWidth;
                const containerHeight = containerWidth * aspectRatio;
                viewport.style.height = containerHeight + 'px';
                wrapper.style.height = containerHeight + 'px';
            });

            // If image already loaded
            if (img.complete) {
                const aspectRatio = img.naturalHeight / img.naturalWidth;
                const containerWidth = wrapper.offsetWidth;
                const containerHeight = containerWidth * aspectRatio;
                viewport.style.height = containerHeight + 'px';
                wrapper.style.height = containerHeight + 'px';
            }
        });
    }

    // Helper function to create buttons
    function createButton(text, title, onClick) {
        const btn = document.createElement('button');
        btn.textContent = text;
        btn.title = title;
        btn.className = 'diagram-control-btn';
        btn.style.background = 'transparent';
        btn.style.border = '1px solid var(--border-color)';
        btn.style.color = 'var(--text-primary)';
        btn.style.padding = '6px 10px';
        btn.style.borderRadius = '4px';
        btn.style.cursor = 'pointer';
        btn.style.fontSize = '16px';
        btn.style.lineHeight = '1';
        btn.style.transition = 'all 0.2s ease';
        btn.style.minWidth = '32px';
        
        btn.addEventListener('click', onClick);
        
        btn.addEventListener('mouseenter', function() {
            if (!btn.disabled) {
                btn.style.background = 'var(--bg-tertiary)';
                btn.style.borderColor = 'var(--accent-color)';
            }
        });
        
        btn.addEventListener('mouseleave', function() {
            btn.style.background = 'transparent';
            btn.style.borderColor = 'var(--border-color)';
        });
        
        return btn;
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initDiagramInteractions);
    } else {
        initDiagramInteractions();
    }

    // Also initialize after a short delay to catch dynamically loaded content
    setTimeout(initDiagramInteractions, 500);
})();
