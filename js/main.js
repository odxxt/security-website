/**
 * Main.js
 * Main script for portfolio website
 */

document.addEventListener('DOMContentLoaded', () => {
    // Initialize smooth scrolling
    initSmoothScroll();

    // Initialize navigation
    initNavigation();

    // Initialize section animations
    initSectionAnimations();

    // Initialize tool controls
    initToolControls();

    // Initialize project carousel
    initProjectCarousel();

    // Initialize scroll indicator text change
    initializeScrollIndicator();

    // Initialize go-to-top button
    initGoToTopButton();

    // Initialize odxxt label interactivity
    initOdxxtLabel();

    // Initialize scramble effect when the document is ready
    initScrambleEffect();   

    // Initialize Eye animation stuff
    initInteractiveEye();

    // Initialize the tooltips
    initEducationTooltips(); 
});

/**
 * Education Tooltip Logic
 */
function initEducationTooltips() {
    const educationCard = document.getElementById('education-card');
    const triggers = [
        { id: 'edu-trigger-auk', tooltipId: 'tooltip-auk' },
        { id: 'edu-trigger-rbs', tooltipId: 'tooltip-rbs' }
    ];
    const tooltips = {}; // Store tooltip elements

    // Get references to tooltip elements
    triggers.forEach(t => {
        const tooltipEl = document.getElementById(t.tooltipId);
        if (tooltipEl) {
            tooltips[t.tooltipId] = tooltipEl;
            // Ensure tooltip is positioned fixed for consistent calculation
            tooltipEl.style.position = 'fixed'; // Important for consistent positioning logic
        } else {
            console.warn(`Tooltip element not found: ${t.tooltipId}`);
        }
    });

    if (!educationCard) {
        console.warn("Education card not found for desktop tooltip positioning.");
        // We can still proceed for mobile positioning if triggers/tooltips exist
    }

    const hideAllTooltips = () => {
        Object.values(tooltips).forEach(tooltip => {
            if (tooltip) {
                tooltip.classList.remove('visible');
            }
        });
    };

    triggers.forEach(triggerInfo => {
        const triggerElement = document.getElementById(triggerInfo.id);
        const tooltipElement = tooltips[triggerInfo.tooltipId];

        if (triggerElement && tooltipElement) {
            triggerElement.addEventListener('mouseenter', (event) => {
                hideAllTooltips(); // Hide others first

                const triggerRect = triggerElement.getBoundingClientRect();
                // Get tooltip dimensions *before* making calculations
                // Temporarily make it visible but off-screen to measure accurately
                tooltipElement.style.visibility = 'hidden';
                tooltipElement.style.display = 'flex'; // Ensure dimensions are calculated if it was display:none
                const tooltipWidth = tooltipElement.offsetWidth;
                const tooltipHeight = tooltipElement.offsetHeight;
                tooltipElement.style.display = ''; // Reset display
                tooltipElement.style.visibility = ''; // Reset visibility

                let topPos, leftPos;
                const mobileBreakpoint = 768; // Same breakpoint as your CSS
                const gap = 10; // Gap between trigger and tooltip on mobile
                const edgeMargin = 10; // Minimum distance from viewport edges

                if (window.innerWidth <= mobileBreakpoint) {
                    // --- Mobile Positioning ---
                    // Position above the trigger, horizontally centered

                    // Calculate initial centered left position
                    leftPos = triggerRect.left + (triggerRect.width / 2) - (tooltipWidth / 2);

                    // Calculate initial top position (above trigger)
                    topPos = triggerRect.top - tooltipHeight - gap;

                    // Boundary Checks (Mobile)
                    // Prevent going off left edge
                    if (leftPos < edgeMargin) {
                        leftPos = edgeMargin;
                    }
                    // Prevent going off right edge
                    else if (leftPos + tooltipWidth > window.innerWidth - edgeMargin) {
                        leftPos = window.innerWidth - tooltipWidth - edgeMargin;
                    }
                    // Prevent going off top edge (if it happens, position below trigger instead)
                    if (topPos < edgeMargin) {
                        topPos = triggerRect.bottom + gap;
                    }

                    // Adjust animation origin for pop-up effect
                    tooltipElement.style.transformOrigin = 'center bottom';

                } else {
                    // --- Desktop Positioning (Original Side Logic) ---
                    if (!educationCard) { // Safety check if card is missing
                        console.warn("Education card missing, cannot calculate desktop tooltip position accurately.");
                        // Fallback to a simpler position if needed, or just don't show
                        return;
                    }
                    const cardRect = educationCard.getBoundingClientRect();

                    // Initial position: To the left of the card, vertically near trigger top
                    leftPos = cardRect.left - tooltipWidth - 20; // Left of card - tooltip width - gap
                    topPos = triggerRect.top - 5; // Align near top of trigger, adjust offset

                    // Boundary Checks (Desktop)
                    // If too close to left edge, try positioning to the right of the card
                    if (leftPos < edgeMargin) {
                        leftPos = cardRect.right + 20;
                    }
                    // Prevent going off top edge
                    if (topPos < edgeMargin) {
                        topPos = edgeMargin;
                    }
                    // Prevent going off bottom edge (optional)
                    if (topPos + tooltipHeight > window.innerHeight - edgeMargin) {
                        topPos = window.innerHeight - tooltipHeight - edgeMargin;
                    }

                    // Reset animation origin for desktop fade-in
                    tooltipElement.style.transformOrigin = 'center center';
                }

                // Apply the calculated positions
                tooltipElement.style.top = `${topPos}px`;
                tooltipElement.style.left = `${leftPos}px`;

                tooltipElement.classList.add('visible');
            });

            triggerElement.addEventListener('mouseleave', () => {
                // Simple hide on mouse leave
                tooltipElement.classList.remove('visible');
            });
        } else {
            if (!triggerElement) console.warn(`Trigger element not found: ${triggerInfo.id}`);
            // Tooltip element warning is handled above
        }
    });

    // Optional: Hide tooltip if clicking outside
    document.addEventListener('click', (event) => {
        let isOverTriggerOrTooltip = false;
        triggers.forEach(triggerInfo => {
            const triggerElement = document.getElementById(triggerInfo.id);
            const tooltipElement = tooltips[triggerInfo.tooltipId];
            if ((triggerElement && triggerElement.contains(event.target)) || (tooltipElement && tooltipElement.classList.contains('visible') && tooltipElement.contains(event.target))) {
                isOverTriggerOrTooltip = true;
            }
        });

        if (!isOverTriggerOrTooltip) {
            hideAllTooltips();
        }
    });
}

/**
 * Interactive Eye Corner Logic (Auto-Appear, Toggle, Hover)
 */
function initInteractiveEye() {
    const cornerElement = document.getElementById('corner-element');
    const pupil = document.getElementById('eye-pupil');
    const iris = document.getElementById('eye-iris');

    if (!cornerElement || !pupil || !iris) {
        console.error("Eye elements not found!");
        return;
    }

    let isEyeActive = false; // Start with angle showing
    let isClickable = false; // Start non-clickable
    let animationFrameId = null;
    let idleTimeoutId = null;
    const IDLE_TIME = 3000;
    const APPEAR_DELAY = 15000; // 15 seconds

    // --- Reset Idle Timer ---
    const resetIdleTimer = () => {
        clearTimeout(idleTimeoutId);
        cornerElement.classList.remove('eye-idle');
        if(pupil) pupil.style.animation = '';

        if (isEyeActive) {
             idleTimeoutId = setTimeout(() => {
                cornerElement.classList.add('eye-idle');
                if(pupil) pupil.style.transform = '';
            }, IDLE_TIME);
        }
    };

    // --- Mouse Move Handler ---
    const handleMouseMove = (event) => {
        // Only track if eye is active *AND* elements exist
        if (!isEyeActive || !iris || !pupil) return;

        resetIdleTimer(); // Reset idle on mouse move

        const irisRect = iris.getBoundingClientRect();
        if (irisRect.width === 0 || irisRect.height === 0) return; // Check validity

        const irisCenterX = irisRect.left + irisRect.width / 2;
        const irisCenterY = irisRect.top + irisRect.height / 2;
        const irisRadius = irisRect.width / 2;
        const pupilRadius = pupil.offsetWidth / 2;
        const maxPupilOffset = Math.max(0, irisRadius - pupilRadius - 2);

        const mouseX = event.clientX;
        const mouseY = event.clientY;
        const deltaX = mouseX - irisCenterX;
        const deltaY = mouseY - irisCenterY;
        const angle = Math.atan2(deltaY, deltaX);
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        const desiredOffset = Math.min(distance * 0.15, maxPupilOffset);

        const pupilX = desiredOffset * Math.cos(angle);
        const pupilY = desiredOffset * Math.sin(angle);

        cancelAnimationFrame(animationFrameId);
        animationFrameId = requestAnimationFrame(() => {
            // Check elements exist and not idle before transforming
            if (pupil && !cornerElement.classList.contains('eye-idle')) {
                pupil.style.transform = `translate(${pupilX}px, ${pupilY}px)`;
            }
        });
    };

     // --- Toggle Eye State Function ---
     const toggleEyeState = () => {
         // Only toggle if clicking is enabled
         if (!isClickable) return;

        isEyeActive = !isEyeActive; // Flip the state

        if (isEyeActive) {
            // Activate Eye
            cornerElement.classList.add('corner-eye-active');
            document.addEventListener('mousemove', handleMouseMove, { passive: true });
            resetIdleTimer();
            if(pupil) pupil.style.transform = '';
        } else {
            // Deactivate Eye (Return to Angle)
            cornerElement.classList.remove('corner-eye-active');
            cornerElement.classList.remove('eye-idle');
            document.removeEventListener('mousemove', handleMouseMove);
            cancelAnimationFrame(animationFrameId);
            clearTimeout(idleTimeoutId);
            if(pupil) {
                 pupil.style.animation = '';
                 pupil.style.transform = 'translate(0, 0)';
            }
        }
    };

    // --- Initial Setup ---
    if(pupil) pupil.style.transform = 'translate(0, 0)'; // Center pupil initially

    // --- AUTOMATIC APPEARANCE & CLICK LISTENER ATTACHMENT ---
    console.log(`Eye corner will appear and be enabled in ${APPEAR_DELAY / 1000} seconds.`);
    const initialTimeoutId = setTimeout(() => {
        if (!cornerElement) return; // Check element still exists

        console.log("Activating eye automatically.");
        isClickable = true; // Enable clicking NOW
        cornerElement.classList.add('corner-ready'); // Enable hover effects & pointer cursor

        // Trigger the first toggle to show the eye
        toggleEyeState(); // This will set isEyeActive = true

        // Attach the click listener AFTER the delay and initial toggle
        cornerElement.addEventListener('click', toggleEyeState);

    }, APPEAR_DELAY);
    // --- End Automatic Appearance ---

}






// Initialize smooth scrolling
function initSmoothScroll() {
    // Add smooth scrolling to all links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();

            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);

            if (targetElement) {
                // Scroll smoothly to the target
                window.scrollTo({
                    top: targetElement.offsetTop,
                    behavior: 'smooth'
                });
            }
        });
    });
}

// Initialize navigation
function initNavigation() {
    const navButtons = document.querySelectorAll('.nav-btn');

    // Navigation sections
    const sections = [
        document.querySelector('.hero-section'),    // Home
        document.querySelector('.about-section'),   // About
        document.querySelector('.tools-section'),   // Security Toolkit
        document.querySelector('.projects-section') // Projects & Experience
    ];

    // Add click event to navigation buttons
    navButtons.forEach((btn, index) => {
        btn.addEventListener('click', () => {
            if (sections[index]) {
                // If clicking the home button, scroll to top
                if (index === 0) {
                    window.scrollTo({
                        top: 0,
                        behavior: 'smooth'
                    });

                    // Also focus the terminal input for better UX
                    setTimeout(() => {
                        const terminalInput = document.getElementById('terminal-input');
                        if (terminalInput) terminalInput.focus();
                    }, 800);
                } else {
                    window.scrollTo({
                        top: sections[index].offsetTop,
                        behavior: 'smooth'
                    });
                }
            }
        });
    });

    // Highlight active nav button based on scroll position
    window.addEventListener('scroll', () => {
        const scrollPosition = window.scrollY;

        sections.forEach((section, index) => {
            if (!section) return;

            const sectionTop = section.offsetTop - 100;
            const sectionBottom = sectionTop + section.offsetHeight;

            if (scrollPosition >= sectionTop && scrollPosition < sectionBottom) {
                // Remove active class from all buttons
                navButtons.forEach(btn => btn.classList.remove('active'));
                // Add active class to current button
                navButtons[index].classList.add('active');
            }
        });
    });
}

// Initialize section animations
function initSectionAnimations() {
    const elements = document.querySelectorAll('.project-card, .tool-card, .about-card, .main-heading, .sub-heading');

    elements.forEach(el => {
        // Set initial state directly via JavaScript
        el.style.opacity = '0';
        el.style.transform = 'translateY(50px)';
        el.style.transition = 'opacity 0.5s ease, transform 0.8s ease';
    });

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
                observer.unobserve(entry.target);  // Only reveal once
            }
        });
    }, { threshold: 0.1 });

    elements.forEach(el => observer.observe(el));
}


    // Add visible class that will trigger animation
    setTimeout(() => {
        elements.forEach((el, index) => {
            setTimeout(() => {
                el.style.opacity = '1';
                el.style.transform = 'translateY(0)';
            }, index * 100); // Stagger the animations
        });
    }, 500);


// Initialize project carousel
function initProjectCarousel() {
    const track = document.getElementById('carousel-track');
    const prevButton = document.getElementById('prev-project');
    const nextButton = document.getElementById('next-project');
    const progressFill = document.getElementById('progress-fill');

    if (!track || !prevButton || !nextButton || !progressFill) return;

    const cards = track.querySelectorAll('.project-card');
    if (cards.length === 0) return;

    // Variables for carousel state
    let currentPosition = 0;
    let cardWidth = cards[0].offsetWidth;
    let cardGap = 30; // Gap between cards
    const cardsPerView = getCardsPerView();
    let maxPosition = track.scrollWidth - cardsPerView * (cardWidth + cardGap);

    // Calculate how many cards are visible based on viewport width
    function getCardsPerView() {
        const carouselWidth = track.parentElement.offsetWidth;
        return Math.max(1, Math.floor(carouselWidth / (cardWidth + cardGap)));
    }

    // Update carousel position
    function updateCarousel(position) {
        // Ensure position is within bounds
        currentPosition = Math.max(0, Math.min(position, maxPosition));
        track.style.transform = `translateX(-${currentPosition}px)`;

        // Update progress bar
        const progress = (currentPosition / maxPosition) * 100;
        progressFill.style.width = `${progress}%`;

        // Update button states
        prevButton.disabled = currentPosition <= 0;
        nextButton.disabled = currentPosition >= maxPosition;

        // Visual feedback for buttons
        prevButton.style.opacity = currentPosition <= 0 ? '0.5' : '1';
        nextButton.style.opacity = currentPosition >= maxPosition ? '0.5' : '1';
    }

    // Move carousel by a specific amount
    function moveCarousel(amount) {
        updateCarousel(currentPosition + amount);
    }

    // Move to next slide
    function nextSlide() {
        moveCarousel(cardWidth + cardGap);
    }

    // Move to previous slide
    function prevSlide() {
        moveCarousel(-(cardWidth + cardGap));
    }

    // Event listeners for buttons
    prevButton.addEventListener('click', prevSlide);
    nextButton.addEventListener('click', nextSlide);

    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
        // Only handle these keys when not in terminal
        if (document.activeElement && document.activeElement.id === 'terminal-input') {
            return;
        }

        if (e.key === 'ArrowLeft') {
            prevSlide();
        } else if (e.key === 'ArrowRight') {
            nextSlide();
        }
    });

    // Mouse wheel navigation
    track.addEventListener('wheel', (e) => {
        if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
            // User is scrolling horizontally with touchpad
            e.preventDefault();
            moveCarousel(e.deltaX);
        } else if (Math.abs(e.deltaY) > 0) {
            // User is scrolling vertically, treat as horizontal
            e.preventDefault();
            moveCarousel(e.deltaY);
        }
    }, { passive: false });

    // Touch events for mobile swiping
    let touchStartX = 0;
    let touchMoveX = 0;
    let isDragging = false;

    track.addEventListener('touchstart', (e) => {
        touchStartX = e.touches[0].clientX;
        isDragging = true;
    }, { passive: true });

    track.addEventListener('touchmove', (e) => {
        if (!isDragging) return;

        touchMoveX = e.touches[0].clientX;
        const diffX = touchStartX - touchMoveX;

        // Prevent page scrolling during swipe
        if (Math.abs(diffX) > 5) {
            e.preventDefault();
        }

        // Apply a drag effect to the track
        const dragOffset = currentPosition + diffX;

        // Apply bounds to the drag
        if (dragOffset >= 0 && dragOffset <= maxPosition) {
            track.style.transform = `translateX(-${dragOffset}px)`;
        }
    }, { passive: false });

    track.addEventListener('touchend', () => {
        if (!isDragging) return;

        const diffX = touchStartX - touchMoveX;

        // Determine if we should snap to next/prev cards
        if (diffX > 50) {
            // Swipe left, go to next
            nextSlide();
        } else if (diffX < -50) {
            // Swipe right, go to previous
            prevSlide();
        } else {
            // Small movement, snap back
            updateCarousel(currentPosition);
        }

        isDragging = false;
    });

    // Mouse drag for desktop
    let mouseStartX = 0;
    let mouseMoveX = 0;

    track.addEventListener('mousedown', (e) => {
        mouseStartX = e.clientX;
        isDragging = true;
        track.style.cursor = 'grabbing';

        // Prevent text selection during drag
        e.preventDefault();
    });

    document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;

        mouseMoveX = e.clientX;
        const diffX = mouseStartX - mouseMoveX;

        // Apply a drag effect to the track
        const dragOffset = currentPosition + diffX;

        // Apply bounds to the drag
        if (dragOffset >= 0 && dragOffset <= maxPosition) {
            track.style.transform = `translateX(-${dragOffset}px)`;
        }
    });

    document.addEventListener('mouseup', () => {
        if (!isDragging) return;

        const diffX = mouseStartX - mouseMoveX;

        // Determine if we should snap to next/prev cards
        if (diffX > 50) {
            // Drag left, go to next
            nextSlide();
        } else if (diffX < -50) {
            // Drag right, go to previous
            prevSlide();
        } else {
            // Small movement, snap back
            updateCarousel(currentPosition);
        }

        isDragging = false;
        track.style.cursor = 'grab';
    });

    // Handle window resize
    window.addEventListener('resize', () => {
        // Recalculate dimensions
        cardWidth = cards[0].offsetWidth;
        const cardsPerView = getCardsPerView();
        maxPosition = track.scrollWidth - cardsPerView * (cardWidth + cardGap);

        // Update carousel position
        updateCarousel(currentPosition);
    });

    // Initialize
    track.style.cursor = 'grab';
    updateCarousel(0);
}

// Initialize tool controls
function initToolControls() {
    const toolControls = document.querySelectorAll('.tool-control');
    const toolCards = document.querySelectorAll('.tool-card');
    const controlCircles = document.querySelectorAll('.control-circle');

    if (toolControls.length === 0 || toolCards.length === 0) {
        return;
    }

    // --- Function to reset all cards to default visible state ---
    const resetFilters = () => {
        controlCircles.forEach(circle => circle.classList.remove('active'));
        toolCards.forEach(card => {
            card.style.opacity = '1';
            card.style.transform = 'translateY(0) scale(1)';
            card.style.pointerEvents = 'auto';
        });
    };

    // --- Attach Click Listeners ---
    toolControls.forEach(control => {
        control.addEventListener('click', () => {
            const filterValue = control.getAttribute('data-filter');
            const clickedCircle = control.querySelector('.control-circle');

            // Check if the clicked filter is already active
            if (clickedCircle && clickedCircle.classList.contains('active')) {
                // --- If already active, deactivate it and reset all cards ---
                resetFilters();
            } else {
                // --- If not active, activate it and filter ---
                // 1. Update button states
                controlCircles.forEach(circle => circle.classList.remove('active')); // Deactivate all others
                if (clickedCircle) {
                    clickedCircle.classList.add('active'); // Activate clicked one
                }

                // 2. Filter cards
                toolCards.forEach(card => {
                    const cardCategory = card.getAttribute('data-category');
                    const shouldShow = (cardCategory === filterValue); // Direct match

                    if (shouldShow) {
                        card.style.opacity = '1';
                        card.style.transform = 'translateY(0) scale(1)';
                        card.style.pointerEvents = 'auto';
                    } else {
                        card.style.opacity = '0.3'; // Fade out non-matching
                        card.style.transform = 'translateY(5px) scale(0.98)';
                        card.style.pointerEvents = 'none';
                    }
                });
            }
        });
    });
}

/**
 * Initialize scroll indicator with text change effect
 */
function initializeScrollIndicator() {
    const scrollText = document.querySelector('.scroll-text');
    const heroSection = document.querySelector('.hero-section');
    const originalText = ">_ SCROLL TO EXPLORE";
    const alternateText = ">_ GO TO TOP";

    if (!scrollText || !heroSection) return;

    // Track scroll position
    window.addEventListener('scroll', () => {
        const heroBottom = heroSection.getBoundingClientRect().bottom;
        const isOutsideHero = heroBottom < 0;

        if (isOutsideHero && scrollText.getAttribute('data-text') !== 'alternate') {
            morphText(scrollText, originalText, alternateText);
            scrollText.setAttribute('data-text', 'alternate');
        } else if (!isOutsideHero && scrollText.getAttribute('data-text') === 'alternate') {
            morphText(scrollText, alternateText, originalText);
            scrollText.setAttribute('data-text', 'original');
        }
    });

    // Initialize data-text attribute
    scrollText.setAttribute('data-text', 'original');

    // Make scroll text clickable to scroll to top or down
    scrollText.style.cursor = 'pointer';
    scrollText.addEventListener('click', () => {
        const isOutsideHero = heroSection.getBoundingClientRect().bottom < 0;

        if (isOutsideHero) {
            // Scroll to top
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        } else {
            // Scroll to about section
            const aboutSection = document.getElementById('about');
            if (aboutSection) {
                aboutSection.scrollIntoView({ behavior: 'smooth' });
            }
        }
    });
}

/**
 * Initialize Go to Top button
 */
function initGoToTopButton() {
    const goToTopBtn = document.getElementById('go-to-top');
    const heroSection = document.querySelector('.hero-section');

    if (!goToTopBtn || !heroSection) return;

    // Add click event to scroll to top
    goToTopBtn.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });

    // Show/hide based on scroll position
    window.addEventListener('scroll', () => {
        const heroBottom = heroSection.getBoundingClientRect().bottom;
        const isOutsideHero = heroBottom < 0;

        if (isOutsideHero) {
            goToTopBtn.classList.add('visible');
        } else {
            goToTopBtn.classList.remove('visible');
        }
    });
}

/**
 * Morphs text with a hacker-style effect
 * @param {HTMLElement} element - The element containing the text
 * @param {string} currentText - The current text
 * @param {string} targetText - The target text
 */
function morphText(element, currentText, targetText) {
    // First, create arrays of characters from both texts
    const currentChars = currentText.split('');
    const targetChars = targetText.split('');
    const maxLength = Math.max(currentChars.length, targetChars.length);

    // Pad the shorter array with spaces
    while (currentChars.length < maxLength) currentChars.push(' ');
    while (targetChars.length < maxLength) targetChars.push(' ');

    // Random character set for glitch effect
    const glitchChars = '!@#$%^&*()_+-={}[]|;:,.<>?/\\`~ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

    // Keep track of which positions are still morphing
    const morphing = new Array(maxLength).fill(true);
    let count = 0;
    const maxCount = 6; // How many iterations before revealing final character

    // Start the animation
    const interval = setInterval(() => {
        count++;
        let result = '';
        let stillMorphing = false;

        for (let i = 0; i < maxLength; i++) {
            // If this position is still morphing
            if (morphing[i]) {
                if (count < maxCount) {
                    // During morph: show random character
                    result += glitchChars.charAt(Math.floor(Math.random() * glitchChars.length));
                    stillMorphing = true;
                } else if (count === maxCount) {
                    // End of morph: show final character
                    result += targetChars[i];
                    morphing[i] = false;
                }
            } else {
                // Already finished morphing this position
                result += targetChars[i];
            }
        }

        // Update the element text
        element.textContent = result;

        // If no more morphing or we've reached the max count, stop
        if (!stillMorphing || count >= maxCount) {
            clearInterval(interval);
            element.textContent = targetText;
        }
    }, 50);
}

/**
 * Initialize the odxxt label interactivity
 */
function initOdxxtLabel() {
    const labLabel = document.querySelector('.lab-label');
    if (!labLabel) return;

    // Add click event to execute odxxt command in terminal
    labLabel.addEventListener('click', () => {
        // Find terminal instance
        const terminalInput = document.getElementById('terminal-input');
        const terminal = document.querySelector('.terminal-container');

        if (terminalInput && terminal) {
            // Scroll to top where terminal is visible
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });

            // Focus terminal and add active class
            setTimeout(() => {
                labLabel.classList.add('active');
                labLabel.classList.add('pulse');

                // Focus and set terminal input to "odxxt" and trigger execution after a delay
                terminalInput.focus();

                // Simulate typing
                const simulateTyping = (text, callback) => {
                    let index = 0;
                    terminalInput.value = '';

                    const typeInterval = setInterval(() => {
                        if (index < text.length) {
                            terminalInput.value += text[index];
                            index++;
                        } else {
                            clearInterval(typeInterval);
                            if (callback) callback();
                        }
                    }, 100);
                };

                // Type "odxxt" and press Enter
                simulateTyping('odxxt', () => {
                    // Add enter key animation effect
                    setTimeout(() => {
                        // Get the terminal instance to use the enter animation function
                        if (window.terminal && typeof window.terminal.addEnterKeyAnimation === 'function') {
                            // Find the last line in the terminal that contains odxxt
                            const terminalOutput = document.getElementById('terminal-output');
                            if (terminalOutput) {
                                const lines = terminalOutput.querySelectorAll('.terminal-line');
                                if (lines.length > 0) {
                                    const lastLine = lines[lines.length - 1];
                                    if (lastLine.textContent.includes('odxxt')) {
                                        window.terminal.addEnterKeyAnimation(lastLine);
                                    }
                                }
                            }
                        }

                        // Trigger Enter key press after typing completes
                        setTimeout(() => {
                            const enterEvent = new KeyboardEvent('keydown', {
                                key: 'Enter',
                                code: 'Enter',
                                keyCode: 13,
                                which: 13,
                                bubbles: true
                            });
                            terminalInput.dispatchEvent(enterEvent);

                            // Remove active class after command execution
                            setTimeout(() => {
                                labLabel.classList.remove('active');
                                setTimeout(() => {
                                    labLabel.classList.remove('pulse');
                                }, 3000);
                            }, 500);
                        }, 300);
                    }, 200);
                });
            }, 800);
        }
    });

    // Add hover interaction
    labLabel.addEventListener('mouseenter', () => {
        // Make label pulsate briefly on hover
        if (!labLabel.classList.contains('active')) {
            labLabel.classList.add('pulse');
        }
    });

    labLabel.addEventListener('mouseleave', () => {
        // Remove pulse effect when not active
        if (!labLabel.classList.contains('active')) {
            labLabel.classList.remove('pulse');
        }
    });
}

function scrambleText(element, originalText) {
    const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
    let iterations = 0;
    const maxIterations = originalText.length; 
    const revealSpeed = 2;  // Reduced speed for subtle reveal
    const glitchChance = 0.1;  // 10% chance of showing a random character briefly

    const interval = setInterval(() => {
        element.innerText = originalText
            .split("")
            .map((char, index) => {
                if (index < iterations) return char; 
                if (char === " ") return " "; 
                if (Math.random() < glitchChance) return chars[Math.floor(Math.random() * chars.length)];
                return char;
            })
            .join("");

        if (iterations >= maxIterations) clearInterval(interval);

        iterations += 1 / revealSpeed;  // Control the smoothness of reveal
    }, 40);  // Reduced interval for faster and smoother effect
}





function initScrambleEffect() {
 // Select specific headers you want to animate
    const headers = document.querySelectorAll('.animated-heading');

    headers.forEach(header => {
        const originalText = header.innerText;

        header.addEventListener('mouseenter', () => {
            scrambleText(header, originalText);
        });
    });
}



