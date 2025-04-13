/**
 * Grid Animation
 * Creates subtle enhancements to the grid background
 */

document.addEventListener('DOMContentLoaded', () => {
    // Create grid points at intersections
    createGridPoints();

    // Track mouse movement with throttling
    let lastTime = 0;
    document.addEventListener('mousemove', (e) => {
        const now = Date.now();
        // Throttle to 30fps (roughly 33ms between frames)
        if (now - lastTime >= 33) {
            lastTime = now;
            handleMouseMove(e);
        }
    });
});

function createGridPoints() {
    const gridSize = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--grid-size'));
    const body = document.querySelector('body');
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // Limit the number of points for performance (create fewer points on smaller screens)
    const columnStep = window.innerWidth < 768 ? 4 : (window.innerWidth < 1200 ? 2 : 1);
    const rowStep = window.innerWidth < 768 ? 4 : (window.innerWidth < 1200 ? 2 : 1);

    // Calculate number of points
    const columns = Math.ceil(viewportWidth / gridSize);
    const rows = Math.ceil(viewportHeight / gridSize);

    // Create a container for grid points
    const pointsContainer = document.createElement('div');
    pointsContainer.className = 'grid-points';
    pointsContainer.style.position = 'fixed';
    pointsContainer.style.top = '0';
    pointsContainer.style.left = '0';
    pointsContainer.style.width = '100%';
    pointsContainer.style.height = '100%';
    pointsContainer.style.pointerEvents = 'none';
    pointsContainer.style.zIndex = '0';

    // Create grid points at intersections
    for (let i = 0; i <= rows; i += rowStep) {
        for (let j = 0; j <= columns; j += columnStep) {
            const point = document.createElement('div');
            point.className = 'grid-point';
            point.style.position = 'absolute';
            point.style.width = '2px';
            point.style.height = '2px';
            point.style.borderRadius = '50%';
            point.style.backgroundColor = 'rgba(255, 255, 255, 0.15)';
            point.style.left = `${j * gridSize}px`;
            point.style.top = `${i * gridSize}px`;
            point.style.transform = 'translate(-50%, -50%)';
            point.style.transition = 'transform 0.3s ease, background-color 0.3s ease';

            // Add data attributes for position
            point.dataset.x = j * gridSize;
            point.dataset.y = i * gridSize;

            pointsContainer.appendChild(point);
        }
    }

    // Append the container to the body
    body.appendChild(pointsContainer);

    // Remove and recreate points on window resize, but with debouncing
    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            if (document.querySelector('.grid-points')) {
                body.removeChild(document.querySelector('.grid-points'));
            }
            createGridPoints();
        }, 250); // Wait 250ms after resize ends
    });
}

function handleMouseMove(e) {
    const mouseX = e.clientX;
    const mouseY = e.clientY;
    const points = document.querySelectorAll('.grid-point');

    // Effect radius - smaller on mobile for performance
    const radius = window.innerWidth < 768 ? 80 : 150;

    points.forEach(point => {
        // Calculate distance from mouse to point
        const pointX = parseInt(point.dataset.x);
        const pointY = parseInt(point.dataset.y);

        const distanceX = mouseX - pointX;
        const distanceY = mouseY - pointY;
        const distance = Math.sqrt(distanceX * distanceX + distanceY * distanceY);

        // Apply effect if within radius
        if (distance < radius) {
            // Calculate effect strength (inverse proportion to distance)
            const strength = 1 - (distance / radius);

            // Apply visual effect
            point.style.transform = `translate(-50%, -50%) scale(${1 + strength})`;
            point.style.backgroundColor = `rgba(255, 255, 255, ${0.15 + strength * 0.5})`;
        } else {
            // Reset to default only if necessary (check current state)
            if (point.style.transform !== 'translate(-50%, -50%) scale(1)') {
                point.style.transform = 'translate(-50%, -50%) scale(1)';
                point.style.backgroundColor = 'rgba(255, 255, 255, 0.15)';
            }
        }
    });
}
