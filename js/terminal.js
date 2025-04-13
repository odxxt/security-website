/**
 * Terminal.js
 * Interactive terminal script for portfolio website
 */

document.addEventListener('DOMContentLoaded', () => {
    // Initialize terminal
    const terminal = new Terminal();
    terminal.init();

    // Expose terminal instance to window for other scripts to access
    window.terminal = terminal;

    // Auto-type and execute whoami command after a delay
    setTimeout(() => {
        terminal.showStartupSequence();
    }, 800);

    // Add event listener for reset button
    const resetButton = document.getElementById('terminal-reset');
    if (resetButton) {
        resetButton.addEventListener('click', () => {
            terminal.resetTerminal();
        });
    }

    // Handle focus/blur events for terminal glow
    document.addEventListener('click', (e) => {
        if (e.target.closest('#terminal-container')) {
            terminal.setFocus(true);
        } else {
            terminal.setFocus(false);
            // Start idle timer immediately when focus is lost
            terminal.startIdleTimer();
        }
    });
});

class Terminal {
    constructor() {
        this.input = document.getElementById('terminal-input');
        this.output = document.getElementById('terminal-output');
        this.cursor = document.getElementById('terminal-cursor');
        this.terminalBody = document.getElementById('terminal-body');
        this.inputLine = document.querySelector('.terminal-input-line');
        this.terminalContainer = document.getElementById('terminal-container');
        this.idleMessage = document.getElementById('terminal-idle-message');
        this.prompt = document.querySelector('.terminal-prompt');

        this.commandHistory = [];
        this.historyIndex = -1;

        this.cursorBlinking = true;
        this.isActive = true;
        this.isFocused = true;
        this.idleTimer = null;
        this.lastActivityTime = Date.now();
        this.idleTimeout = 10000; // 10 seconds

        // --- Snake Game State ---
        this.isGameActive = false;
        this.snakeGame = {
            intervalId: null,
            gameContainer: null,
            boardElement: null,
            snakeElements: [],
            foodElement: null,
            scoreElement: null,

            // --- Increased Board Size ---
            boardWidth: 30,      // Grid units (Increased from 25)
            boardHeight: 20,     // Grid units (Increased from 15)
            blockSize: 16,       // Pixel size of each block (Keep this for now, or adjust if needed)
            // --- End Increased Board Size ---

            snake: [],
            direction: { x: 1, y: 0 },
            food: { x: 0, y: 0 },
            score: 0,
            speed: 160,          // Slightly faster speed (adjust for feel)
            gameOver: false,
            gameKeydownListener: null,
        };
        // --- End Snake Game State ---


    }

    init() {
        // Set up event listeners
        this.input.addEventListener('input', this.handleInput.bind(this));
        this.input.addEventListener('keydown', this.handleKeyDown.bind(this));

        // Focus input when clicking anywhere on terminal
        this.terminalBody.addEventListener('click', () => {
            if (this.isActive) {
                this.input.focus();
                this.handleActivity();
                this.setFocus(true);
            }
        });

        // Maintain focus on terminal input
        window.addEventListener('click', (e) => {
            if (e.target.closest('.terminal-body') && this.isActive) {
                this.input.focus();
                this.handleActivity();
                this.setFocus(true);
            }
        });

        // Start cursor blinking
        this.startCursorBlink();

        // Focus input on load
        this.input.focus();

        // Initialize idle timer immediately on page load
        this.startIdleTimer();

        // Make sure terminal has active state initially
        this.setFocus(true);

        // Initialize the ASCII art
        this.initAsciiArt();

        // Initial cursor position update
        this.updateCursorPosition();
    }

    /**
     * Show startup sequence with animated typing and command execution
     */
    showStartupSequence() {
        // Clear any existing content first
        this.output.innerHTML = '';

        // Add an initial welcome message
        this.printLine('Welcome to macOS Terminal');

        // Remove the input prompt line initially
        this.inputLine.style.display = 'none';

        // Clear the input field first
        this.input.value = '';
        this.updateCursorPosition();

        // Create a prompt line
        const promptLine = document.createElement('div');
        promptLine.className = 'terminal-line';
        promptLine.textContent = 'abdulaziz@odxxt ~ % ';
        this.output.appendChild(promptLine);
        this.scrollToBottom();

        // Simulate typing with a blinking cursor
        const command = 'whoami';
        let index = 0;
        const typingInterval = setInterval(() => {
            if (index < command.length) {
                promptLine.textContent += command[index];
                index++;
                this.scrollToBottom();
            } else {
                clearInterval(typingInterval);

                // Add a small visual delay and then show enter key press
                setTimeout(() => {
                    // Show the enter key pressed
                    this.addEnterKeyAnimation(promptLine);

                    // Execute command after animation
                    setTimeout(() => {
                        // Now show the whoami results
                        this.showWhoAmI();

                        // Restore the input line at the very end
                        setTimeout(() => {
                            this.inputLine.style.display = 'flex';
                            this.input.focus();
                        }, 500);
                    }, 300);
                }, 500);
            }
        }, 200); // Slower typing for dramatic effect
    }

    /**
     * Add an enter key press animation to a typed command line
     * @param {HTMLElement} promptLine - The line element containing the command
     */
    addEnterKeyAnimation(promptLine) {
        // Add a blinking effect to simulate Enter key press
        promptLine.classList.add('command-enter');

        // Remove the effect after animation completes
        setTimeout(() => {
            promptLine.classList.remove('command-enter');
        }, 250);
    }

    initAsciiArt() {
        this.asciiArt = {
            name: [
                " █████╗ ██████╗ ██████╗ ██╗   ██╗██╗      █████╗ ███████╗██╗███████╗     █████╗ ██╗      ██████╗ ██████╗  █████╗ ████████╗ ",
                "██╔══██╗██╔══██╗██╔══██╗██║   ██║██║     ██╔══██╗╚══███╔╝██║╚══███╔╝    ██╔══██╗██║     ██╔═══██╗██╔══██╗██╔══██╗╚══██╔══╝ ",
                "███████║██████╔╝██║  ██║██║   ██║██║     ███████║  ███╔╝ ██║  ███╔╝     ███████║██║     ██║   ██║██║  ██║███████║   ██║    ",
                "██╔══██║██╔══██╗██║  ██║██║   ██║██║     ██╔══██║ ███╔╝  ██║ ███╔╝      ██╔══██║██║     ██║   ██║██║  ██║██╔══██║   ██║    ",
                "██║  ██║██████╔╝██████╔╝╚██████╔╝███████╗██║  ██║███████╗██║███████╗    ██║  ██║███████╗╚██████╔╝██████╔╝██║  ██║   ██║    ",
                "╚═╝  ╚═╝╚═════╝ ╚═════╝  ╚═════╝ ╚══════╝╚═╝  ╚═╝╚══════╝╚═╝╚══════╝    ╚═╝  ╚═╝╚══════╝ ╚═════╝ ╚═════╝ ╚═╝  ╚═╝   ╚═╝    "
            ],
            odxxt: [
                " ██████╗ ██████╗ ██╗  ██╗██╗  ██╗████████╗",
                "██╔═══██╗██╔══██╗╚██╗██╔╝╚██╗██╔╝╚══██╔══╝",
                "██║   ██║██║  ██║ ╚███╔╝  ╚███╔╝    ██║   ",
                "██║   ██║██║  ██║ ██╔██╗  ██╔██╗    ██║   ",
                "╚██████╔╝██████╔╝██╔╝ ██╗██╔╝ ██╗   ██║   ",
                " ╚═════╝ ╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═╝   ╚═╝   "
            ]
        };
    }

    setFocus(focused) {
        if (!this.isActive) return;

        this.isFocused = focused;

        if (focused) {
            this.terminalContainer.classList.add('active');
            this.terminalContainer.classList.remove('inactive');
            this.input.focus();
            this.handleActivity();
        } else {
            this.terminalContainer.classList.remove('active');
            this.terminalContainer.classList.add('inactive');
            // When losing focus, start the idle timer immediately
            this.startIdleTimer();
        }
    }

    startCursorBlink() {
        // We use CSS animation for the blinking effect
        if (!this.cursorBlinking) {
            this.cursor.style.animation = 'cursor-blink 1s infinite';
            this.cursorBlinking = true;
        }
    }

    stopCursorBlink() {
        if (this.cursorBlinking) {
            this.cursor.style.animation = 'none';
            this.cursor.style.opacity = '1';
            this.cursorBlinking = false;
        }
    }

    startIdleTimer() {
        // Clear any existing timer
        this.clearIdleTimer();

        // Set idle message to appear after 10 seconds of inactivity
        this.idleTimer = setTimeout(() => {
            if (this.isActive) { // Show regardless of activity or focus
                this.idleMessage.classList.add('visible');
            }
        }, this.idleTimeout);

        this.lastActivityTime = Date.now();
    }

    clearIdleTimer() {
        if (this.idleTimer) {
            clearTimeout(this.idleTimer);
            this.idleTimer = null;
        }
    }

    handleActivity() {
        // Hide idle message
        this.idleMessage.classList.remove('visible');

        // Reset the idle timer
        this.startIdleTimer();
    }

    handleInput(e) {
        // Position cursor after input text
        this.updateCursorPosition();
        this.handleActivity();
    }

    updateCursorPosition() {
        // Get the input element and its text width
        const inputText = this.input.value;

        // Get prompt element width
        const promptRect = this.prompt.getBoundingClientRect();
        const promptWidth = promptRect.width;

        // Create a temporary span to measure text width
        const span = document.createElement('span');
        span.style.font = window.getComputedStyle(this.input).font;
        span.style.visibility = 'hidden';
        span.style.position = 'absolute';
        span.style.whiteSpace = 'pre';
        span.textContent = inputText;
        document.body.appendChild(span);

        // Calculate cursor position based on input text width
        const inputWidth = span.getBoundingClientRect().width;
        document.body.removeChild(span);

        // Position cursor after the prompt and input text
        // Add a small offset for spacing
        this.cursor.style.left = `${promptWidth + inputWidth + 2}px`;
    }

    handleKeyDown(e) {
        // Hide idle message and reset timer on any key press
        this.handleActivity();

        switch (e.key) {
            case 'Enter':
                e.preventDefault();
                const command = this.input.value.trim();
                if (command) {
                    this.addToHistory(command);
                    this.executeCommand(command);
                } else {
                    this.printPrompt();
                }
                break;

            case 'ArrowUp':
                e.preventDefault();
                this.navigateHistory(1); // Changed direction to match macOS behavior
                break;

            case 'ArrowDown':
                e.preventDefault();
                this.navigateHistory(-1); // Changed direction to match macOS behavior
                break;

            case 'Tab':
                e.preventDefault();
                this.autocomplete();
                break;
        }
    }

    addToHistory(command) {
        // Insert at beginning to make newest commands appear first in history
        this.commandHistory.unshift(command);
        if (this.commandHistory.length > 50) {
            this.commandHistory.pop();
        }
        this.historyIndex = -1;
    }

    navigateHistory(direction) {
        if (this.commandHistory.length === 0) return;

        this.historyIndex += direction;

        if (this.historyIndex < -1) {
            this.historyIndex = -1;
        } else if (this.historyIndex >= this.commandHistory.length) {
            this.historyIndex = this.commandHistory.length - 1;
        }

        if (this.historyIndex === -1) {
            this.input.value = '';
        } else {
            this.input.value = this.commandHistory[this.historyIndex];
        }

        // Move cursor to end of input
        setTimeout(() => {
            this.input.selectionStart = this.input.selectionEnd = this.input.value.length;
            this.updateCursorPosition();
        }, 0);
    }

    autocomplete() {
        const command = this.input.value.toLowerCase();
        const commands = [
            'help', 'whoami', 'about', 'projects', 'tools',
            'clear', 'exit', 'skills', 'contact', 'github',
            'passwordgen', 'ping', 'traceroute', 'hashgen', 
            'destruct', 'hack', 'odxxt', 'type', 'sudo', 'ascii',
            'snake', 'hi'
        ];

        const matches = commands.filter(cmd => cmd.startsWith(command));

        if (matches.length === 1) {
            this.input.value = matches[0];
            this.updateCursorPosition();
        } else if (matches.length > 1) {
            this.printLine(`abdulaziz@odxxt ~ % ${command}`);
            this.printLine(matches.join('  '));
            this.printPrompt();
        }
    }

    showWhoAmI() {
        // Clear the terminal for a clean start
        this.clearTerminal();

        // Add a loading sequence for dramatic effect
        const loadingSteps = [
            'Loading profile...',
            'Retrieving information...',
            'Authenticating identity...',
            'Profile found.'
        ];

        let stepIndex = 0;
        const loadingInterval = setInterval(() => {
            if (stepIndex < loadingSteps.length) {
                this.printLine(loadingSteps[stepIndex]);
                stepIndex++;
            } else {
                clearInterval(loadingInterval);

                // Show the ASCII art and profile information with staggered timing
                setTimeout(() => {
                    // Display ASCII art name with glitch effect
                    this.printLine('');
                    this.printAsciiArt('name');

                    // Add a glitch effect
                    this.addGlitchEffect();

                    setTimeout(() => {
                        // Basic info with special styling for Security Engineer
                        const titleLine = document.createElement('div');
                        titleLine.className = 'terminal-line highlighted-title';
                        titleLine.textContent = 'Security Engineer At Diyar United Company';
                        this.output.appendChild(titleLine);
                        this.scrollToBottom();

                        // Add glitch effect to title
                        setTimeout(() => {
                            this.addGlitchEffect();
                            this.printLine('');

                            // Final instructions
                            setTimeout(() => {
                                this.printLine('');
                                this.printLine('Type "help" for available commands');
                                this.printPrompt();
                            }, 300);
                        }, 150);
                    }, 500);
                }, 500);
            }
        }, 400);

        // Don't print prompt here, it will be handled by the animation sequence
    }

    /**
     * Display the secret ODXXT lab info - completely redesigned version
     */
    showOdxxt() {
        // Add glitch effect to the terminal
        this.terminalBody.classList.add('glitch');
        setTimeout(() => {
            this.terminalBody.classList.remove('glitch');
        }, 2);

        // Clear terminal for dramatic effect
        this.clearTerminal();

        // Disable regular input during the sequence
        this.isActive = false;
        this.input.disabled = true;
        this.cursor.style.display = 'none';
        this.inputLine.style.display = 'none';

        // Simulate a system takeover
        const hackingLines = [
            "INITIATING SYSTEM OVERRIDE...",
            "BYPASSING SECURITY PROTOCOLS...",
            "ACCESSING KERNEL MEMORY...",
            "DISABLING COUNTERMEASURES...",
            "██████████ 100% COMPLETE",
            ""
        ];

        let lineIndex = 0;
        const typeHackingSequence = () => {
            if (lineIndex < hackingLines.length) {
                this.simulateTyping(hackingLines[lineIndex], 30, () => {
                    lineIndex++;
                    setTimeout(typeHackingSequence, 200);
                });
            } else {
                // Matrix-like effect after hacking sequence
                this.printLine("SYSTEM ACCESS GRANTED");
                setTimeout(() => startMatrixEffect(), 250);
            }
        };

        // Start the hacking sequence
        typeHackingSequence();

        // Create a Matrix-like rain effect
        const startMatrixEffect = () => {
            // Create a container for the matrix effect
            const matrixContainer = document.createElement('div');
            matrixContainer.className = 'matrix-container';
            this.output.appendChild(matrixContainer);

            // Add matrix characters
            const matrixChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789$#@%&*()+=<>?/\\|{}[]~";
            const maxColumns = 40;
            const maxRows = 15;

            // Function to create a random matrix character
            const createMatrixChar = (row, col) => {
                const char = document.createElement('span');
                char.className = 'matrix-char';
                char.textContent = matrixChars.charAt(Math.floor(Math.random() * matrixChars.length));
                char.style.gridRow = row;
                char.style.gridColumn = col;
                char.style.animationDelay = `${Math.random() * 2}s`;
                return char;
            };

            // Fill the matrix with characters
            for (let row = 1; row <= maxRows; row++) {
                for (let col = 1; col <= maxColumns; col++) {
                    matrixContainer.appendChild(createMatrixChar(row, col));
                }
            }

            // After matrix effect, reveal the ODXXT interface
            setTimeout(() => {
                this.output.removeChild(matrixContainer);
                revealOdxxtInterface();
            }, 2000);
        };

        // Reveal the ODXXT interface
        const revealOdxxtInterface = () => {
            // Clear the output and show the ODXXT ASCII art
            this.output.innerHTML = '';
            this.printAsciiArt('odxxt');

            // Create the terminal title
            const terminalTitle = document.createElement('div');
            terminalTitle.className = 'odxxt-terminal-title';
            terminalTitle.textContent = '[ TERMINAL CUSTOMIZATION INTERFACE ]';
            this.output.appendChild(terminalTitle);

            setTimeout(() => {
                // Add system status indicators
                const statusContainer = document.createElement('div');
                statusContainer.className = 'odxxt-status-container';
                this.output.appendChild(statusContainer);

                const statusLabels = [
                    { label: 'SYSTEM STATUS', value: 'ONLINE', class: 'status-online' },
                    { label: 'CURRENT THEME', value: 'DEFAULT', class: 'status-active' },
                    { label: 'AUTO-SAVE', value: 'ENABLED', class: 'status-enabled' },
                    { label: 'CREATIVITY MODE', value: 'ACTIVE', class: 'status-active' }
                ];

                statusLabels.forEach(status => {
                    const statusItem = document.createElement('div');
                    statusItem.className = 'odxxt-status-item';
                    statusItem.innerHTML = `<span class="status-label">${status.label}:</span> <span class="status-value ${status.class}">${status.value}</span>`;
                    statusContainer.appendChild(statusItem);
                });

                setTimeout(() => {
                    // Add interactive menu
                    this.printLine('');
                    this.printLine('SELECT AN OPTION:');

                    const menuItems = [
                        { id: '1', label: 'Terminal Theme Gallery' },
                        { id: '2', label: 'Command History Logs' },
                        { id: '3', label: 'System Performance Dashboard' },
                        { id: '4', label: 'Exit Interface' }
                    ];

                    const menuContainer = document.createElement('div');
                    menuContainer.className = 'odxxt-menu-container';
                    this.output.appendChild(menuContainer);

                    menuItems.forEach(item => {
                        const menuItem = document.createElement('div');
                        menuItem.className = 'odxxt-menu-item';
                        menuItem.setAttribute('data-id', item.id);
                        menuItem.innerHTML = `<span class="menu-id">${item.id}</span> <span class="menu-label">${item.label}</span>`;
                        menuContainer.appendChild(menuItem);

                        // Add click handlers for each option
                        menuItem.addEventListener('click', () => {
                            handleMenuSelection(item.id);
                        });
                    });

                    // Enable keyboard navigation
                    this.enableOdxxtKeyboardInput(menuItems.map(item => item.id));

                    // Scroll to make sure everything is visible
                    //this.scrollToBottom();
                }, 500);
            }, 500);
        };

        // Handle menu selection
        const handleMenuSelection = (id) => {
            // Remove keyboard listener
            this.disableOdxxtKeyboardInput();

            // Clear the terminal again for the selected option
            this.output.innerHTML = '';

            switch(id) {
                case '1':
                    // Terminal Themes
                    showThemeGallery();
                    break;
                case '2':
                    // Command Logs
                    showCommandLogs();
                    break;
                case '3':
                    // System Performance
                    showPerformanceDashboard();
                    break;
                case '4':
                    // Exit
                    exitOdxxtInterface();
                    break;
            }
        };

        // Theme Gallery View
        const showThemeGallery = () => {
            this.printLine('TERMINAL THEME GALLERY');
            this.printLine('----------------------');
            this.printLine('');

            setTimeout(() => {
                // Create theme preview container
                const themeContainer = document.createElement('div');
                themeContainer.className = 'theme-gallery-container';
                this.output.appendChild(themeContainer);

                // Define available themes
                const themes = [
                    { id: 'default', name: 'Classic Terminal', bg: '#0c0c0c', text: '#ffffff', accent: '#cccccc' },
                    { id: 'matrix', name: 'Matrix Green', bg: '#0f0f0f', text: '#00ff00', accent: '#00cc00' },
                    { id: 'sunset', name: 'Sunset Orange', bg: '#1a0f0f', text: '#ff9900', accent: '#cc5500' },
                    { id: 'midnight', name: 'Midnight Blue', bg: '#0f1a2c', text: '#3498db', accent: '#1e5b8d' },
                    { id: 'neon', name: 'Neon Dreams', bg: '#120b1a', text: '#f700ff', accent: '#9600ff' },
                    { id: 'retro', name: 'Retro Amber', bg: '#191a19', text: '#ffb000', accent: '#cc8800' }
                ];

                // Add theme previews
                themes.forEach(theme => {
                    const themePreview = document.createElement('div');
                    themePreview.className = 'theme-preview';
                    themePreview.setAttribute('data-theme', theme.id);
                    themePreview.style.backgroundColor = theme.bg;

                    const themeName = document.createElement('div');
                    themeName.className = 'theme-name';
                    themeName.textContent = theme.name;
                    themeName.style.color = theme.text;

                    const themeDemo = document.createElement('div');
                    themeDemo.className = 'theme-demo';
                    themeDemo.innerHTML = `<span style="color:${theme.accent}">user@system ~</span> <span style="color:${theme.text}">$</span>`;

                    const themeSelect = document.createElement('div');
                    themeSelect.className = 'theme-select';
                    themeSelect.textContent = 'APPLY THEME';
                    themeSelect.style.backgroundColor = theme.accent;
                    themeSelect.style.color = theme.bg;

                    themePreview.appendChild(themeName);
                    themePreview.appendChild(themeDemo);
                    themePreview.appendChild(themeSelect);
                    themeContainer.appendChild(themePreview);

                    // Add click handler
                    themeSelect.addEventListener('click', () => {
                        applyTheme(theme);
                    });
                });

                setTimeout(() => {
                    this.printLine('');
                    this.printLine('Click on a theme to preview and apply it to your terminal.');
                    this.printLine('Terminal themes persist during your session.');
                    this.printLine('');

                    // Add back button
                    addBackButton();
                }, 500);
            }, 500);
        };

        // Apply a theme to the terminal
        const applyTheme = (theme) => {
            // Apply theme colors to terminal
            const terminalContainer = document.getElementById('terminal-container');
            const terminalBody = document.getElementById('terminal-body');
            const terminalHeader = document.querySelector('.terminal-header');

            if (terminalContainer && terminalBody && terminalHeader) {
                // Show a theme applying message
                this.printLine('');
                this.printLine(`Applying theme: ${theme.name}...`);

                // Apply the theme with transitions
                terminalBody.style.transition = 'background-color 0.5s ease, color 0.5s ease';
                terminalContainer.style.transition = 'box-shadow 0.5s ease';

                // Change colors
                terminalBody.style.backgroundColor = theme.bg;
                terminalBody.style.color = theme.text;
                terminalHeader.style.backgroundColor = theme.bg === '#0c0c0c' ? '#1a1a1a' : theme.bg;

                // Update terminal glow if it's an active terminal
                if (terminalContainer.classList.contains('active')) {
                    const glowColor = theme.id === 'default' ? 'rgba(255, 255, 255, 0.15)' :
                                    theme.id === 'matrix' ? 'rgba(0, 255, 0, 0.2)' :
                                    theme.id === 'sunset' ? 'rgba(255, 153, 0, 0.2)' :
                                    theme.id === 'midnight' ? 'rgba(52, 152, 219, 0.2)' :
                                    theme.id === 'neon' ? 'rgba(247, 0, 255, 0.2)' :
                                    'rgba(255, 176, 0, 0.2)';

                    terminalContainer.style.boxShadow = `0 0 30px ${glowColor}, 0 10px 30px rgba(0, 0, 0, 0.3)`;
                }

                // Show success message after a short delay
                setTimeout(() => {
                    this.printLine(`Theme "${theme.name}" applied successfully!`);
                }, 700);
            }
        };

        // Command History Logs
        const showCommandLogs = () => {
            this.printLine('COMMAND HISTORY LOGS');
            this.printLine('--------------------');
            this.printLine('');

            setTimeout(() => {
                // Create logs visualization
                const logsContainer = document.createElement('div');
                logsContainer.className = 'command-logs-container';
                this.output.appendChild(logsContainer);

                // Get command history
                const history = this.commandHistory.slice(0, 15); // Get up to 15 most recent commands

                if (history.length === 0) {
                    // No commands yet
                    this.printLine('No commands have been executed in this session.');
                    this.printLine('Try running some commands first!');
                } else {
                    // Create command log entries
                    history.forEach((cmd, index) => {
                        const logEntry = document.createElement('div');
                        logEntry.className = 'command-log-entry';

                        const timestamp = document.createElement('span');
                        timestamp.className = 'log-timestamp';
                        // Generate a fake timestamp (current time minus random minutes)
                        const now = new Date();
                        now.setMinutes(now.getMinutes() - Math.floor(Math.random() * index * 2));
                        now.setSeconds(now.getSeconds() - Math.floor(Math.random() * index * 2));
                        timestamp.textContent = now.toLocaleTimeString();

                        const command = document.createElement('span');
                        command.className = 'log-command';
                        command.textContent = cmd;

                        // Add a replay button
                        const replayBtn = document.createElement('span');
                        replayBtn.className = 'log-replay';
                        replayBtn.textContent = 'REPLAY';
                        replayBtn.addEventListener('click', () => {
                            // Go back to main terminal
                            exitOdxxtInterface();
                            // Wait a bit then replay the command
                            setTimeout(() => {
                                this.simulateTypingCommand(cmd, 50);
                            }, 1000);
                        });

                        logEntry.appendChild(timestamp);
                        logEntry.appendChild(command);
                        logEntry.appendChild(replayBtn);
                        logsContainer.appendChild(logEntry);
                    });

                    setTimeout(() => {
                        this.printLine('');
                        this.printLine('Click "REPLAY" on any command to execute it again.');
                        this.printLine(`Total commands this session: ${history.length}`);
                        this.printLine('');
                    }, 300);
                }

                // Add back button
                addBackButton();
            }, 500);
        };

        // System Performance Dashboard
        const showPerformanceDashboard = () => {
            this.printLine('SYSTEM PERFORMANCE DASHBOARD');
            this.printLine('----------------------------');
            this.printLine('');

            setTimeout(() => {
                // Create performance container
                const perfContainer = document.createElement('div');
                perfContainer.className = 'performance-container';
                this.output.appendChild(perfContainer);

                // Create performance metrics
                const metrics = [
                    { name: 'CPU Usage', value: Math.floor(Math.random() * 40) + 10, max: 100, unit: '%', class: 'cpu' },
                    { name: 'Memory', value: Math.floor(Math.random() * 2048) + 1024, max: 4096, unit: 'MB', class: 'memory' },
                    { name: 'Network', value: Math.floor(Math.random() * 90) + 10, max: 100, unit: 'Mbps', class: 'network' },
                    { name: 'Disk I/O', value: Math.floor(Math.random() * 40) + 5, max: 100, unit: 'MB/s', class: 'disk' }
                ];

                // Add metrics with gauges
                metrics.forEach(metric => {
                    const metricItem = document.createElement('div');
                    metricItem.className = `performance-metric ${metric.class}`;

                    const metricName = document.createElement('div');
                    metricName.className = 'metric-name';
                    metricName.textContent = metric.name;

                    const metricGauge = document.createElement('div');
                    metricGauge.className = 'metric-gauge';

                    const metricBar = document.createElement('div');
                    metricBar.className = 'metric-bar';
                    const percentage = (metric.value / metric.max) * 100;
                    metricBar.style.width = `${percentage}%`;

                    // Color based on percentage
                    if (percentage < 30) metricBar.classList.add('metric-low');
                    else if (percentage < 70) metricBar.classList.add('metric-medium');
                    else metricBar.classList.add('metric-high');

                    const metricValue = document.createElement('div');
                    metricValue.className = 'metric-value';
                    metricValue.textContent = `${metric.value} ${metric.unit}`;

                    metricGauge.appendChild(metricBar);
                    metricItem.appendChild(metricName);
                    metricItem.appendChild(metricGauge);
                    metricItem.appendChild(metricValue);
                    perfContainer.appendChild(metricItem);
                });

                // Create a CPU load graph
                const graphContainer = document.createElement('div');
                graphContainer.className = 'performance-graph-container';

                const graphTitle = document.createElement('div');
                graphTitle.className = 'graph-title';
                graphTitle.textContent = 'CPU Load History';

                const graph = document.createElement('div');
                graph.className = 'cpu-load-graph';

                // Generate random data points for the graph
                for (let i = 0; i < 40; i++) {
                    const dataPoint = document.createElement('div');
                    dataPoint.className = 'graph-point';
                    const value = Math.floor(Math.random() * 70) + 5;
                    dataPoint.style.height = `${value}%`;

                    // Color based on value
                    if (value < 30) dataPoint.classList.add('load-low');
                    else if (value < 70) dataPoint.classList.add('load-medium');
                    else dataPoint.classList.add('load-high');

                    graph.appendChild(dataPoint);
                }

                graphContainer.appendChild(graphTitle);
                graphContainer.appendChild(graph);
                perfContainer.appendChild(graphContainer);

                setTimeout(() => {
                    this.printLine('');
                    this.printLine('System Performance Summary:');
                    this.printLine('• System load: Normal');
                    this.printLine('• Uptime: 3 days, 7 hours');
                    this.printLine('• Active processes: 87');
                    this.printLine('');

                    // Add back button
                    addBackButton();
                }, 500);
            }, 500);
        };

        // Add back button to return to main menu
        const addBackButton = () => {
            const backButton = document.createElement('div');
            backButton.className = 'odxxt-back-button';
            backButton.innerHTML = '[ RETURN TO MAIN MENU ]';
            this.output.appendChild(backButton);

            // Add click handler
            backButton.addEventListener('click', () => {
                revealOdxxtInterface();
            });

            this.scrollToBottom();
        };

        // Exit the ODXXT interface
        const exitOdxxtInterface = () => {
            this.clearTerminal();
            this.printLine('EXITING ODXXT INTERFACE...');

            setTimeout(() => {
                this.printLine('TERMINAL RESTORED');
                this.printLine('');

                // Re-enable terminal input
                this.isActive = true;
                this.input.disabled = false;
                this.cursor.style.display = 'inline';
                this.inputLine.style.display = 'flex';
                this.printPrompt();
                this.input.focus();
            }, 1000);
        };
    }

    /**
     * Enable keyboard input for ODXXT interface
     */
    enableOdxxtKeyboardInput(validKeys) {
        this.odxxtKeyHandler = (e) => {
            if (validKeys.includes(e.key)) {
                // Find and click the corresponding menu item
                const menuItems = document.querySelectorAll('.odxxt-menu-item');
                menuItems.forEach(item => {
                    if (item.getAttribute('data-id') === e.key) {
                        item.click();
                    }
                });
            }
        };

        document.addEventListener('keydown', this.odxxtKeyHandler);
    }

    /**
     * Disable keyboard input for ODXXT interface
     */
    disableOdxxtKeyboardInput() {
        if (this.odxxtKeyHandler) {
            document.removeEventListener('keydown', this.odxxtKeyHandler);
            this.odxxtKeyHandler = null;
        }
    }

    /**
     * Simulate typing a command and then execute it
     * @param {string} command - The command to type and execute
     * @param {number} speed - The typing speed in milliseconds per character
     */
    simulateTypingCommand(command, speed = 30) {
        // Create a new line with the prompt
        const promptLine = document.createElement('div');
        promptLine.className = 'terminal-line';
        promptLine.textContent = 'abdulaziz@odxxt ~ % ';
        this.output.appendChild(promptLine);
        this.scrollToBottom();

        // Simulate typing the command
        let index = 0;
        const typingInterval = setInterval(() => {
            if (index < command.length) {
                promptLine.textContent += command[index];
                index++;
                this.scrollToBottom();
            } else {
                clearInterval(typingInterval);

                // Add a small delay before executing the command
                setTimeout(() => {
                    // Execute command without printing it again
                    this.executeCommand(command, true);
                }, 300);
            }
        }, speed);
    }

    executeCommand(command, skipPrintCommand = false) {
        const cmd = command.toLowerCase().trim();
        const args = command.split(' ').slice(1); // Get arguments

        // Print command to output only if not skipped
        if (!skipPrintCommand) {
            this.printLine(`abdulaziz@odxxt ~ % ${command}`);
        }

        // Clear input
        this.input.value = '';
        this.updateCursorPosition();

        let shouldPrintPrompt = true;

        // Process command
        switch (cmd.split(' ')[0]) {

            case 'help':
                // Check if there are any arguments
                const helpArgs = command.split(' ').slice(1);
                this.showHelp(helpArgs);
                break;

            case 'whoami':
                this.showWhoAmI();
                shouldPrintPrompt = false; // Method handles its own prompt
                break;

            case 'about':
                this.scrollToSection('about');
                this.printLine('Navigating to About Me section...');
                break;

            case 'tools':
                this.scrollToSection('tools');
                this.printLine('Navigating to Security Toolkit section...');
                break;

            case 'projects':
                this.scrollToSection('projects');
                this.printLine('Navigating to Projects & Experiences section...');
                break;

            case 'clear':
                this.clearTerminal();
                shouldPrintPrompt = false; // We'll handle this in clearTerminal
                break;

            case 'exit':
                this.exitTerminal();
                shouldPrintPrompt = false; // Don't show prompt after exit
                break;

            case 'skills':
                this.showSkills();
                break;

            case 'contact':
                this.showContact();
                break;

            case 'github':
                this.openGitHub();
                break;

            case 'sudo':
                this.printLine('Permission denied: Operation not permitted');
                this.printLine('Nice try though 😉');
                break;

            case 'ascii': {
                const asciiText = args.join(' ');
                // Truncate text if needed
                let truncatedText = asciiText;
                let wasTruncated = false;
                if (asciiText.length > 15) {
                    truncatedText = asciiText.substring(0, 15);
                    wasTruncated = true;
                }
                this.disableTerminalForAscii();
                this.createAsciiControlPanel(truncatedText || '', wasTruncated); // Pass truncation flag
                shouldPrintPrompt = false;
                break;
            }   

            case 'passwordgen':
                this.simulateTyping(this.passwordgen(), 30, () => {
                    this.printPrompt();
                });
                shouldPrintPrompt = false;
                break;

            case 'hack':
                this.simulateHacking();
                shouldPrintPrompt = false; 
                break;

            case 'destruct':
                this.simulateSelfDestruct();
                shouldPrintPrompt = false;
                break;

            case 'odxxt':
                this.showOdxxt();
                shouldPrintPrompt = false;
                break;
            
            case 'hi':
                this.showhi();
                shouldPrintPrompt = false;
                break;

            case 'type':
                // Check if text is provided
                const typeText = command.split(' ').slice(1).join(' ');
                if (typeText) {
                    this.simulateTyping(typeText, 30, () => {
                        this.printPrompt();
                    });
                } else {
                    this.simulateTyping("This text is being typed...", 30, () => {
                        this.printPrompt();
                    });
                }
                shouldPrintPrompt = false;
                break;

            case 'ping': {
                let args = command.split(" "); // Get IP or domain from command
                if (args.length < 2) {
                    this.printLine('Usage: ping <IP or domain>');
                } else {
                    this.ping(args[1]);
                    shouldPrintPrompt = false;
                }
                break;
            }

            case 'traceroute': {
                let args = command.split(" ");
                if (args.length < 2) {
                    this.printLine('Usage: traceroute <domain>');
                } else {
                    this.traceroute(args[1]);
                    shouldPrintPrompt = false;
                }
                break;
            }

            case 'snake':{
                if (!this.isGameActive) { // Prevent starting if already active
                   this.showSnakeGameVisual();
                   shouldPrintPrompt = false;
                } else {
                    this.printLine("Snake game is already running!");
                }
                break;
            }
            
            case 'hashgen': {
                let args = command.split(" ");
                if (args.length < 2) {
                    this.printLine('Usage: hashgen "<string>"');
                } else {
                    this.hashgen(args.slice(1).join(" "));
                    shouldPrintPrompt = false;
                }
                break;
            }

            default:
                this.printLine(`zsh: command not found: ${command}`);
                this.printLine('Type "help" for available commands');
        }

        // Show new prompt after command execution if needed
        if (shouldPrintPrompt) {
            this.printPrompt();
        }
    }

    showHelp(args) {
        const flags = args || []; // Ensure flags is an array
        const showAll = flags.includes('-a');
        const showUtility = flags.includes('-u');
        const showFun = flags.includes('-f');
        // Determine if only specific flags were used (not -a)
        const showSpecific = !showAll && (showUtility || showFun);
        // Show main summary only if no flags are given
        const showMainSummary = !showAll && !showUtility && !showFun;

        // Start help output container
        this.printLine('<div class="help-container">'); // Wrap output

        if (showMainSummary) {
            this.printLine('<div class="help-title">Available Commands Summary</div>');
            this.printLine('Basic commands are listed below. Use flags for more details:');
            this.printLine('<div class="help-command-line"><span class="help-command">help -a</span><span class="help-description">Show All Commands</span></div>');
            this.printLine('<div class="help-command-line"><span class="help-command">help -u</span><span class="help-description">Show Utility Commands</span></div>');
            this.printLine('<div class="help-command-line"><span class="help-command">help -f</span><span class="help-description">Show Fun Commands</span></div>');
            this.printLine(''); // Spacer

            // Display a few key commands directly
             this.printLine('<div class="help-category-title">Key Commands:</div>');
             this.printLine('<div class="help-command-line"><span class="help-command">whoami</span><span class="help-description">Display my profile information.</span></div>');
             this.printLine('<div class="help-command-line"><span class="help-command">about</span><span class="help-description">Navigate to the About Me section.</span></div>');
             this.printLine('<div class="help-command-line"><span class="help-command">tools</span><span class="help-description">Navigate to the My Toolkit section.</span></div>');
             this.printLine('<div class="help-command-line"><span class="help-command">projects</span><span class="help-description">Navigate to Projects & Experiences.</span></div>');
             this.printLine('<div class="help-command-line"><span class="help-command">clear</span><span class="help-description">Clear the terminal screen.</span></div>');
             this.printLine('<div class="help-command-line"><span class="help-command">exit</span><span class="help-description">Terminate the current session.</span></div>');
             this.printLine(''); // Spacer
             this.printLine('Use <span class="help-key">↑</span> / <span class="help-key">↓</span> for command history, <span class="help-key">Tab</span> for autocomplete.');

        } else {
            // Show detailed sections based on flags

            // --- Navigation & Information ---
            // Show if -a is used, or if no specific flag (-u or -f) is used (acts as default category)
            if (showAll || !showSpecific) {
                this.printLine('<div class="help-category-title">Navigation & Information:</div>');
                this.printLine('<div class="help-command-line"><span class="help-command">whoami</span><span class="help-description">Display my profile information.</span></div>');
                this.printLine('<div class="help-command-line"><span class="help-command">about</span><span class="help-description">Navigate to the About Me section.</span></div>');
                this.printLine('<div class="help-command-line"><span class="help-command">tools</span><span class="help-description">Navigate to the My Toolkit section.</span></div>');
                this.printLine('<div class="help-command-line"><span class="help-command">projects</span><span class="help-description">Navigate to Projects & Experiences.</span></div>');
                this.printLine('<div class="help-command-line"><span class="help-command">contact</span><span class="help-description">Display contact information.</span></div>');
                this.printLine('<div class="help-command-line"><span class="help-command">github</span><span class="help-description">Open my GitHub profile in a new tab.</span></div>');
            }

             // --- Terminal Control ---
             // Show if -a is used, or if no specific flag (-u or -f) is used
             if (showAll || !showSpecific) {
                this.printLine('<div class="help-category-title">Terminal Control:</div>');
                this.printLine('<div class="help-command-line"><span class="help-command">clear</span><span class="help-description">Clear the terminal screen.</span></div>');
                this.printLine('<div class="help-command-line"><span class="help-command">exit</span><span class="help-description">Terminate the current session.</span></div>');
                this.printLine('<div class="help-command-line"><span class="help-command">help [-a|-u|-f]</span><span class="help-description">Show help messages (flags optional).</span></div>');
                this.printLine('<div class="help-command-line"><span class="help-command"><span class="help-key">↑</span> / <span class="help-key">↓</span> Keys</span><span class="help-description">Navigate command history.</span></div>');
                this.printLine('<div class="help-command-line"><span class="help-command"><span class="help-key">Tab</span> Key</span><span class="help-description">Attempt command auto-completion.</span></div>');
            }

            // --- Utility Commands ---
            if (showAll || showUtility) {
                this.printLine('<div class="help-category-title">Utilities:</div>');
                this.printLine('<div class="help-command-line"><span class="help-command">ping <target></span><span class="help-description">Simulate pinging an IP or domain.</span></div>');
                this.printLine('<div class="help-command-line"><span class="help-command">traceroute <domain></span><span class="help-description">Simulate tracing the route to a domain.</span></div>');
                this.printLine('<div class="help-command-line"><span class="help-command">hashgen <string></span><span class="help-description">Generate the SHA-256 hash of a string.</span></div>');
                this.printLine('<div class="help-command-line"><span class="help-command">passwordgen</span><span class="help-description">Generate a random secure password.</span></div>');
                this.printLine('<div class="help-command-line"><span class="help-command">type <text></span><span class="help-description">Simulate typing animation for the given text.</span></div>');
                 this.printLine('<div class="help-command-line"><span class="help-command">ascii [text]</span><span class="help-description">Open ASCII Art generator (optional text).</span></div>');
            }

            // --- Fun Commands & Games ---
            if (showAll || showFun) {
                this.printLine('<div class="help-category-title">Fun & Games:</div>');
                this.printLine('<div class="help-command-line"><span class="help-command">odxxt</span><span class="help-description">Access the terminal customization interface.</span></div>');
                this.printLine('<div class="help-command-line"><span class="help-command">snake</span><span class="help-description">Play the classic Snake game.</span></div>');
                this.printLine('<div class="help-command-line"><span class="help-command">hack</span><span class="help-description">Run a simulated hacking sequence.</span></div>');
                this.printLine('<div class="help-command-line"><span class="help-command">destruct</span><span class="help-description">Initiate a simulated self-destruct sequence.</span></div>');
                this.printLine('<div class="help-command-line"><span class="help-command">sudo [...]</span><span class="help-description">Attempt to run a command with elevated privileges.</span></div>');
            }
        }

        // End help output container
        this.printLine('</div>'); // Close help-container
    }

    showhi() {
        const responses = [
            "Hello! Looking to explore my projects? Try typing 'projects'.",
            "Hey there! Want to know more about me? Just type 'whoami'.",
            "Hi! Curious about my security tools? Use 'tools' to check them out.",
            "Hello! Need my contact info? Simply type 'contact'.",
            "Greetings! If you’re here for my GitHub, type 'github'.",
            "Hey! To learn about my skills, type 'skills'.",
            "Ah, you're here! Use 'about' to learn more about me.",
            "Hello! Ready to dive into my portfolio? Start with 'whoami'.",
            "Hey! Want to see what I’ve worked on? Just type 'projects'.",
            "Hi there! Need help? Type 'help' for all commands.",
            "Secret activated! Try typing 'odxxt' 😉"  // New odxxt command with a wink
        ];
    
        // Pick a random response
        const randomResponse = responses[Math.floor(Math.random() * responses.length)];
        this.printLine(`<div class="command-line">${randomResponse}</div>`);
    }

    showSkills() {
        this.printLine('Technical Skills:');
        this.printLine('');
        this.printLine('Security:');
        this.printLine('  • Network Security & Monitoring');
        this.printLine('  • Penetration Testing');
        this.printLine('  • Vulnerability Assessment');
        this.printLine('  • Security Frameworks (NIST, ISO)');
        this.printLine('');
        this.printLine('Tools & Technologies:');
        this.printLine('  • CrowdStrike, Splunk, Wireshark');
        this.printLine('  • Metasploit, Nessus, Burp Suite');
        this.printLine('  • Firewall Configuration');
        this.printLine('  • Cloud Security (AWS, Azure)');
    }

    showContact() {
        this.printLine('Contact Information:');
        this.printLine('');
        this.printLine('Email: contact@example.com');
        this.printLine('LinkedIn: linkedin.com/in/abdulaziz-alodat');
        this.printLine('GitHub: github.com/abdulaziz-alodat');
        this.printLine('');
        this.printLine('Feel free to reach out for collaborations or questions!');
    }

    openGitHub() {
        this.printLine('Opening GitHub profile...');
        window.open('https://github.com/odxxt', '_blank');
    }

    exitTerminal() {
        this.printLine('Session terminated.');
        this.printLine('');
        this.printLine('[Process completed]');

        // Disable input and idle messages
        this.isActive = false;
        this.input.disabled = true;
        this.cursor.style.display = 'none';
        this.inputLine.style.display = 'none';
        this.idleMessage.classList.remove('visible');

        // Remove glow effect
        this.terminalContainer.classList.remove('active');
        this.terminalContainer.classList.add('inactive');

        // Show reset button
        const resetButton = document.getElementById('terminal-reset');
        if (resetButton) {
            resetButton.style.display = 'block';
        }

        // Clear idle timer
        this.clearIdleTimer();
    }

    endTerminal() {
        // Similar to exitTerminal but for self-destruct
        this.isActive = false;
        this.input.disabled = true;
        this.cursor.style.display = 'none';
        this.inputLine.style.display = 'none';
        this.idleMessage.classList.remove('visible');

        // Remove glow effect with more dramatic style
        this.terminalContainer.classList.remove('active');
        this.terminalContainer.classList.add('inactive');
        this.terminalContainer.style.opacity = '0.5';

        // Show reset button
        const resetButton = document.getElementById('terminal-reset');
        if (resetButton) {
            resetButton.style.display = 'block';
        }

        // Clear idle timer
        this.clearIdleTimer();
    }

    resetTerminal() {
        // Re-enable input
        this.isActive = true;
        this.input.disabled = false;
        this.cursor.style.display = 'inline';
        this.inputLine.style.display = 'flex';

        // Restore glow effect
        this.terminalContainer.classList.remove('inactive');
        this.terminalContainer.classList.add('active');
        this.terminalContainer.style.opacity = '1';

        // Hide reset button
        const resetButton = document.getElementById('terminal-reset');
        if (resetButton) {
            resetButton.style.display = 'none';
        }

        // Clear terminal and restart with the startup sequence
        this.output.innerHTML = '';
        // Use a short delay before starting the sequence
        setTimeout(() => {
            this.showStartupSequence();
        }, 300);

        // Focus input
        this.input.focus();

        // Start cursor blinking again
        this.startCursorBlink();

        // Reset idle timer immediately
        this.startIdleTimer();

        // Update cursor position
        this.updateCursorPosition();
    }

    clearTerminal() {
        this.output.innerHTML = '';
        this.printPrompt();

        // Update cursor position after clearing
        setTimeout(() => {
            this.updateCursorPosition();
        }, 0);
    }

    scrollToSection(sectionId) {
        const section = document.getElementById(sectionId);
        if (section) {
            section.scrollIntoView({ behavior: 'smooth' });
        }
    }

    printLine(text) {
        const line = document.createElement('div');
        line.className = 'terminal-line';
        line.innerHTML = text;  // Changed from .textContent to .innerHTML
        this.output.appendChild(line);
        this.scrollToBottom();
    }

    printAsciiArt(artName) {
        if (this.asciiArt[artName]) {
            const art = document.createElement('div');
            art.className = 'ascii-art';
            art.textContent = this.asciiArt[artName].join('\n');
            this.output.appendChild(art);
            this.scrollToBottom();
        }
    }

    printPrompt() {
        const prompt = document.createElement('div');
        prompt.className = 'terminal-line';
        this.output.appendChild(prompt);
        this.scrollToBottom();

        // Update prompt reference and cursor position after adding new prompt
        setTimeout(() => {
            this.prompt = document.querySelector('.terminal-prompt');
            this.updateCursorPosition();
        }, 0);
    }

    scrollToBottom() {
        this.terminalBody.scrollTop = this.terminalBody.scrollHeight;
    }

    addGlitchEffect() {
        // Add a glitch effect to the last line
        const lines = this.output.querySelectorAll('.terminal-line, .ascii-art');
        if (lines.length > 0) {
            const lastElement = lines[lines.length - 1];
            lastElement.classList.add('glitch');

            // Remove the glitch class after animation completes
            setTimeout(() => {
                lastElement.classList.remove('glitch');
            }, 300);
        }
    }

    simulateHacking() {
        this.printLine('Initiating hack sequence...');

        let hackingTexts = [
            'Bypassing firewall...',
            'Accessing mainframe...',
            'Decrypting secure connections...',
            'Bypassing RSA encryption...',
            'Accessing classified files...',
            'Downloading sensitive data...',
            'Covering tracks...',
            'Erasing logs...',
            'Establishing backdoor...'
        ];

        let i = 0;
        const hackInterval = setInterval(() => {
            if (i < hackingTexts.length) {
                this.printLine(hackingTexts[i]);
                this.addGlitchEffect();
                i++;
            } else {
                clearInterval(hackInterval);
                this.printLine('');
                this.printLine('ACCESS DENIED: Security protocols engaged');
                this.printLine('IP logged. Countermeasures activated.');
                this.printLine('');
                this.printLine('Just kidding! That would be illegal. 😉');
                this.printPrompt();
            }
        }, 300);
    }

    simulateTyping(text, speed = 30, callback) {
        let index = 0;
        let line = document.createElement('div');  // Create a new line for typing
        line.className = 'terminal-line';
        this.output.appendChild(line);  // Append the line to the terminal output
        this.scrollToBottom();

        let typingInterval = setInterval(() => {
            if (index < text.length) {
                line.textContent += text[index];  // Append character instead of replacing
                index++;
                this.scrollToBottom();
            } else {
                clearInterval(typingInterval);
                if (callback) callback();  // Call the callback after typing finishes
            }
        }, speed);
    }

    simulateSelfDestruct() {
        this.clearTerminal();
        this.printLine("⚠️ WARNING: Self-destruct sequence initiated!");
        this.printLine("❗ This cannot be undone ❗");

        let countdown = 10;
        let interval = setInterval(() => {
            this.printLine(`💥 Detonating in ${countdown}...`);
            countdown--;

            if (countdown < 0) {
                clearInterval(interval);
                this.clearTerminal();
                this.printLine("💀 SYSTEM DESTROYED 💀");

                // Call endTerminal() after self-destruct
                this.endTerminal();
            }
        }, 1000);
    }

    passwordgen(length = 16) {
        const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+";
        let password = "";
        for (let i = 0; i < length; i++) {
            password += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return `Generated Password: ${password}`;  // Return the generated password
    }

    ping(target) {
        this.printLine(`Pinging ${target}...`);

        let count = 4; // Number of ping replies
        let replies = 0;

        let interval = setInterval(() => {
            if (replies >= count) {
                clearInterval(interval);
                this.printLine('');
                this.printLine(`Ping statistics for ${target}:`);
                this.printLine(`    Packets: Sent = ${count}, Received = ${count}, Lost = 0`);
                this.printPrompt();
                return;
            }

            let time = Math.floor(Math.random() * 50) + 1;
            this.printLine(`Reply from ${target}: bytes=32 time=${time}ms TTL=64`);
            replies++;
        }, 1000); // Send one reply per second
    }

    traceroute(target) {
        this.printLine(`Tracing route to ${target}...`);

        let hops = [
            "192.168.1.1",
            "10.24.32.1",
            "198.51.100.5",
            "8.8.8.8"
        ];

        let i = 0;
        let interval = setInterval(() => {
            if (i < hops.length) {
                let time = Math.floor(Math.random() * 50) + 1;
                this.printLine(`${i + 1} ${hops[i]}  ${time} ms`);
                i++;
            } else {
                clearInterval(interval);
                this.printLine("Trace complete.");
                this.printPrompt();
            }
        }, 1000);
    }

    async hashgen(input) {
        if (!input) {
            this.printLine("Usage: hashgen <string>");
            this.printPrompt();
            return;
        }

        const encoder = new TextEncoder();
        const data = encoder.encode(input);

        try {
            // Hashing the input using SHA-256
            const hashBuffer = await crypto.subtle.digest("SHA-256", data);

            // Convert hash to hex string
            const hashHex = Array.from(new Uint8Array(hashBuffer))
                .map(b => b.toString(16).padStart(2, '0')).join('');

            // Print results with a typing effect
            this.simulateTyping(`🔑 SHA-256: ${hashHex}`, 30, () => {
                this.printPrompt();
            });
        } catch (error) {
            this.printLine("❌ Hashing failed: " + error.message);
            this.printPrompt();
        }
    }

    /**
     * Disable the regular terminal while a game is active
     */
    disableTerminalForGame() {
        this.isGameActive = true;
        this.isActive = false; // Disable general terminal activity
        this.input.disabled = true;
        this.cursor.style.display = 'none';
        this.inputLine.style.display = 'none';
        this.clearIdleTimer(); // Stop idle messages during game
        this.idleMessage.classList.remove('visible');

        // Clear terminal output for the game
        this.output.innerHTML = '';
    }

    /**
     * Re-enable the terminal after a game is closed
     */
    enableTerminalAfterGame() {
        this.isGameActive = false;
        this.isActive = true; // Re-enable terminal activity
        this.input.disabled = false;
        this.cursor.style.display = 'inline';
        this.inputLine.style.display = 'flex';

        // Remove game specific listeners if they exist
        if (this.snakeGame.gameKeydownListener) {
            document.removeEventListener('keydown', this.snakeGame.gameKeydownListener);
            this.snakeGame.gameKeydownListener = null;
        }

        // Show prompt and focus
        this.printPrompt();
        this.input.focus();
        this.startIdleTimer(); // Restart idle timer
    }

    
     // --- Visual Snake Game Methods ---

     showSnakeGameVisual() {
        this.disableTerminalForGame();
        const game = this.snakeGame;

        // Reset game state
        game.snake = [{ x: 7, y: 10 }, { x: 6, y: 10 }, { x: 5, y: 10 }]; // Adjusted starting pos for bigger board
        game.direction = { x: 1, y: 0 };
        game.score = 0;
        game.gameOver = false;
        game.snakeElements = [];
        game.foodElement = null;

        // --- Create Game UI Elements ---
        game.gameContainer = document.createElement('div');
        game.gameContainer.className = 'snake-visual-container';
        this.output.appendChild(game.gameContainer);

        const title = document.createElement('div');
        title.className = 'snake-visual-title';
        title.textContent = 'SNAKE';
        game.gameContainer.appendChild(title);

        game.boardElement = document.createElement('div');
        game.boardElement.className = 'snake-visual-board';
        // Update board pixel dimensions based on new grid size
        game.boardElement.style.width = `${game.boardWidth * game.blockSize}px`;
        game.boardElement.style.height = `${game.boardHeight * game.blockSize}px`;
        game.gameContainer.appendChild(game.boardElement);

        // Create Score & Instructions elements (same as before)
        game.scoreElement = document.createElement('div');
        game.scoreElement.className = 'snake-visual-score';
        game.scoreElement.textContent = 'Score: 0';
        game.gameContainer.appendChild(game.scoreElement);

        const instructions = document.createElement('div');
        instructions.className = 'snake-visual-instructions';
        instructions.innerHTML = `Use <span class="key">ARROW KEYS</span> | <span class="key">Q</span> to Quit`;
        game.gameContainer.appendChild(instructions);
        // --- End UI Elements ---


        // Initial setup
        this.initializeSnakeVisuals(); // Create initial snake divs
        this.spawnFoodVisual();      // Place initial food div

        // Add keydown listener
        game.gameKeydownListener = this.handleSnakeInputVisual.bind(this);
        document.addEventListener('keydown', game.gameKeydownListener);

        // Start the game loop
        game.intervalId = setInterval(this.snakeGameLoopVisual.bind(this), game.speed);

        this.scrollToBottom();
    }

    // Helper to calculate pixel position (no changes needed)
    calculatePixelPosition(x, y) {
        const game = this.snakeGame;
        return {
            left: `${x * game.blockSize}px`,
            top: `${y * game.blockSize}px`,
        };
    }

    // initializeSnakeVisuals (no changes needed - still creates initial divs)
    initializeSnakeVisuals() {
        const game = this.snakeGame;
        game.snakeElements.forEach(el => el.remove());
        game.snakeElements = [];

        game.snake.forEach((segment, index) => {
            const segmentElement = document.createElement('div');
            segmentElement.className = 'snake-segment';
            if (index === 0) {
                segmentElement.classList.add('snake-head');
            }
            const pos = this.calculatePixelPosition(segment.x, segment.y);
            segmentElement.style.left = pos.left;
            segmentElement.style.top = pos.top;
            segmentElement.style.width = `${game.blockSize}px`;
            segmentElement.style.height = `${game.blockSize}px`;

            game.boardElement.appendChild(segmentElement);
            game.snakeElements.push(segmentElement);
        });
    }

    // spawnFoodVisual (no changes needed)
    spawnFoodVisual() {
        const game = this.snakeGame;
        let foodPos;
        do {
            foodPos = {
                x: Math.floor(Math.random() * game.boardWidth),
                y: Math.floor(Math.random() * game.boardHeight),
            };
        } while (game.snake.some(seg => seg.x === foodPos.x && seg.y === foodPos.y));

        game.food = foodPos;

        if (!game.foodElement) {
            game.foodElement = document.createElement('div');
            game.foodElement.className = 'snake-food';
            game.foodElement.style.width = `${game.blockSize}px`;
            game.foodElement.style.height = `${game.blockSize}px`;
            game.boardElement.appendChild(game.foodElement);
        }

        const pos = this.calculatePixelPosition(foodPos.x, foodPos.y);
        game.foodElement.style.left = pos.left;
        game.foodElement.style.top = pos.top;
    }


    // handleSnakeInputVisual (no changes needed)
    handleSnakeInputVisual(e) {
        if (!this.isGameActive) return;
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
             e.preventDefault();
        }
        const game = this.snakeGame;
        const currentDir = game.direction;
        let newDir = { ...currentDir };
        switch (e.key) {
            case 'ArrowUp': if (currentDir.y === 0) newDir = { x: 0, y: -1 }; break;
            case 'ArrowDown': if (currentDir.y === 0) newDir = { x: 0, y: 1 }; break;
            case 'ArrowLeft': if (currentDir.x === 0) newDir = { x: -1, y: 0 }; break;
            case 'ArrowRight': if (currentDir.x === 0) newDir = { x: 1, y: 0 }; break;
            case 'q': case 'Q': case 'Escape': this.endSnakeGameVisual('Game Aborted!'); return;
        }
        game.direction = newDir;
    }

    // --- Updated Game Loop for Smoother Movement ---
    snakeGameLoopVisual() {
        if (this.snakeGame.gameOver) return;

        const game = this.snakeGame;

        // --- Calculate New Head Position (Logical) ---
        const currentHeadLogical = game.snake[0];
        const newHeadLogical = {
             x: currentHeadLogical.x + game.direction.x,
             y: currentHeadLogical.y + game.direction.y
        };

        // --- Check Collisions ---
        if (newHeadLogical.x < 0 || newHeadLogical.x >= game.boardWidth ||
            newHeadLogical.y < 0 || newHeadLogical.y >= game.boardHeight) {
            this.endSnakeGameVisual('Game Over - Wall Collision!');
            return;
        }
        for (let i = 0; i < game.snake.length; i++) { // Check against all segments now
             if (newHeadLogical.x === game.snake[i].x && newHeadLogical.y === game.snake[i].y) {
                this.endSnakeGameVisual('Game Over - Self Collision!');
                return;
            }
        }

        // --- Handle Food Eating ---
        const ateFood = (newHeadLogical.x === game.food.x && newHeadLogical.y === game.food.y);

        // --- Update Snake Logically ---
        game.snake.unshift(newHeadLogical); // Add new head to logical array

        // --- Update Visually ---
        // Remove 'snake-head' class from the old head element
        if (game.snakeElements.length > 0) {
             game.snakeElements[0].classList.remove('snake-head');
        }

        // Create the NEW head element
        const newHeadElement = document.createElement('div');
        newHeadElement.className = 'snake-segment snake-head'; // Add head class immediately
        newHeadElement.style.width = `${game.blockSize}px`;
        newHeadElement.style.height = `${game.blockSize}px`;
        const headPos = this.calculatePixelPosition(newHeadLogical.x, newHeadLogical.y);
        newHeadElement.style.left = headPos.left;
        newHeadElement.style.top = headPos.top;

        // Add new head element to the board and our tracking array
        game.boardElement.appendChild(newHeadElement);
        game.snakeElements.unshift(newHeadElement); // Add to the beginning of the elements array

        // --- Handle Tail Removal (if no food eaten) ---
        if (!ateFood) {
            game.snake.pop(); // Remove tail logically

            // Remove tail element visually
            if (game.snakeElements.length > game.snake.length) { // Ensure element exists
                 const tailElement = game.snakeElements.pop(); // Get the last element
                 if (tailElement) {
                      tailElement.remove(); // Remove from DOM
                 }
            }
        } else {
            // Food was eaten: Update score and spawn new food
            game.score += 10;
            game.scoreElement.textContent = `Score: ${game.score}`;
            this.spawnFoodVisual(); // Spawn new food visually
        }
    }
    // --- End Updated Game Loop ---


    // endSnakeGameVisual (no significant changes needed, maybe adjust message positioning if board is huge)
    endSnakeGameVisual(message) {
        if (this.snakeGame.gameOver) return;
        const game = this.snakeGame;
        game.gameOver = true;
        clearInterval(game.intervalId);
        if (game.gameKeydownListener) {
            document.removeEventListener('keydown', game.gameKeydownListener);
            game.gameKeydownListener = null;
        }

        const gameOverMsg = document.createElement('div');
        gameOverMsg.className = 'snake-visual-gameover';
        gameOverMsg.innerHTML = `
            <div>${message}</div>
            <div>Final Score: ${game.score}</div>
            <div class="return-msg">Returning to terminal...</div>
        `;
        // Ensure boardElement exists before appending
        if (game.boardElement) {
             game.boardElement.appendChild(gameOverMsg);
             game.boardElement.classList.add('game-over-fade');
        } else {
             // Fallback if board is already gone somehow
             if(game.gameContainer) game.gameContainer.appendChild(gameOverMsg);
        }

        setTimeout(() => {
            if (game.gameContainer) {
                game.gameContainer.remove();
                game.gameContainer = null;
                game.boardElement = null;
                game.foodElement = null;
                game.scoreElement = null;
                game.snakeElements = [];
            }
            this.enableTerminalAfterGame();
        }, 3000);
    }




    /**
     * Disable the regular terminal while the ASCII panel is active
     */
    disableTerminalForAscii() {
        // Disable normal input
        this.isActive = false;
        this.input.disabled = true;
        this.cursor.style.display = 'none';
        this.inputLine.style.display = 'none';

        // Create an overlay to visually hide previous terminal output
        const overlay = document.createElement('div');
        overlay.className = 'terminal-overlay';
        overlay.id = 'terminal-overlay';
        this.terminalBody.insertBefore(overlay, this.output);
    }

    /**
     * Re-enable the terminal after ASCII panel is closed
     */
    enableTerminalAfterAscii() {
        // Re-enable terminal
        this.isActive = true;
        this.input.disabled = false;
        this.cursor.style.display = 'inline';
        this.inputLine.style.display = 'flex';

        // Remove overlay
        const overlay = document.getElementById('terminal-overlay');
        if (overlay) {
            overlay.remove();
        }

        // Show prompt
        this.printPrompt();
        this.input.focus();
    }

    /**
     * Create the ASCII art control panel
     * @param {string} text - The text to render
     * @param {boolean} wasTruncated - Whether the text was truncated
     */
    createAsciiControlPanel(text, wasTruncated) {
        // Clear any existing panel first
        const existingPanel = document.querySelector('.ascii-control-panel');
        if (existingPanel) {
            existingPanel.remove();
        }

        // Clear the output to make room for the panel
        this.output.innerHTML = '';

        // Create container for the control panel
        const controlPanel = document.createElement('div');
        controlPanel.className = 'ascii-control-panel';

        // Add title
        const title = document.createElement('div');
        title.className = 'ascii-control-title';
        title.textContent = 'ASCII ART GENERATOR';
        controlPanel.appendChild(title);

        // Input section for text
        const inputSection = document.createElement('div');
        inputSection.className = 'ascii-input-section';

        const inputLabel = document.createElement('div');
        inputLabel.className = 'ascii-label';
        inputLabel.textContent = 'Text:';

        const textInput = document.createElement('input');
        textInput.type = 'text';
        textInput.className = 'ascii-text-input';
        textInput.value = text;
        textInput.maxLength = 15;
        textInput.placeholder = 'Enter text (max 15 chars)';

        inputSection.appendChild(inputLabel);
        inputSection.appendChild(textInput);

        // Font selection section
        const fontSection = document.createElement('div');
        fontSection.className = 'ascii-font-section';

        const fontLabel = document.createElement('div');
        fontLabel.className = 'ascii-label';
        fontLabel.textContent = 'Font:';

        const fontSelector = document.createElement('div');
        fontSelector.className = 'ascii-font-selector';

        // Get font list from AsciiFonts
        const fonts = AsciiFonts.getFontList();

        // Add font options
        fonts.forEach(font => {
            const fontOption = document.createElement('div');
            fontOption.className = 'ascii-font-option';
            fontOption.setAttribute('data-font', font.id);
            fontOption.textContent = font.name;

            // Set the first font as selected by default
            if (font.id === 'standard') {
                fontOption.classList.add('selected');
            }

            fontOption.addEventListener('click', () => {
                // Remove selected class from all options
                fontSelector.querySelectorAll('.ascii-font-option').forEach(opt => {
                    opt.classList.remove('selected');
                });

                // Add selected class to clicked option
                fontOption.classList.add('selected');

                // Update preview
                this.updateAsciiPreview(textInput.value, font.id);
            });

            fontSelector.appendChild(fontOption);
        });

        fontSection.appendChild(fontLabel);
        fontSection.appendChild(fontSelector);

        // Preview section
        const previewSection = document.createElement('div');
        previewSection.className = 'ascii-preview-section';

        const previewLabel = document.createElement('div');
        previewLabel.className = 'ascii-label';
        previewLabel.textContent = 'Preview:';

        const preview = document.createElement('pre');
        preview.className = 'ascii-preview';
        preview.id = 'ascii-preview';

        previewSection.appendChild(previewLabel);
        previewSection.appendChild(preview);

        // Action buttons section
        const actionSection = document.createElement('div');
        actionSection.className = 'ascii-action-section';

        const generateButton = document.createElement('button');
        generateButton.className = 'ascii-action-button generate';
        generateButton.textContent = 'GENERATE';

        const copyButton = document.createElement('button');
        copyButton.className = 'ascii-action-button copy';
        copyButton.textContent = 'COPY';

        // Add exit button
        const exitButton = document.createElement('button');
        exitButton.className = 'ascii-action-button exit';
        exitButton.textContent = 'EXIT';

        actionSection.appendChild(generateButton);
        actionSection.appendChild(copyButton);
        actionSection.appendChild(exitButton);

        // Add all sections to control panel
        controlPanel.appendChild(inputSection);
        controlPanel.appendChild(fontSection);
        controlPanel.appendChild(previewSection);
        controlPanel.appendChild(actionSection);

        // Add control panel to output
        this.output.appendChild(controlPanel);

        // Show note if text was truncated
        if (wasTruncated) {
            const noteDiv = document.createElement('div');
            noteDiv.className = 'ascii-note';
            noteDiv.textContent = 'Note: Text was truncated to 15 characters maximum.';
            noteDiv.style.color = 'var(--text-dim)';
            noteDiv.style.fontSize = '12px';
            noteDiv.style.textAlign = 'center';
            noteDiv.style.marginTop = '10px';
            controlPanel.appendChild(noteDiv);
        }

        // Set up event listeners
        textInput.addEventListener('input', () => {
            // Get the currently selected font
            const selectedFont = fontSelector.querySelector('.selected').getAttribute('data-font');
            // Update preview as user types
            this.updateAsciiPreview(textInput.value, selectedFont);
            // Enable generate button if text is not empty
            generateButton.disabled = textInput.value.trim() === '';
        });

        // Add click handler for generate button
        generateButton.addEventListener('click', () => {
            if (textInput.value.trim() === '') return;

            const selectedFont = fontSelector.querySelector('.selected').getAttribute('data-font');
            this.generateFinalAscii(textInput.value, selectedFont);
            copyButton.disabled = false;
        });

        // Add click handler for copy button
        copyButton.addEventListener('click', () => {
            const asciiArt = preview.textContent;
            if (!asciiArt.trim()) return;

            this.copyToClipboard(asciiArt);

            // Visual feedback
            copyButton.textContent = 'COPIED!';
            copyButton.classList.add('copied');

            setTimeout(() => {
                copyButton.textContent = 'COPY';
                copyButton.classList.remove('copied');
            }, 2000);
        });

        // Add click handler for exit button
        exitButton.addEventListener('click', () => {
            this.enableTerminalAfterAscii();
        });

        // Initially disable copy button until something is generated
        copyButton.disabled = true;

        // Initially disable generate button if text is empty
        generateButton.disabled = textInput.value.trim() === '';

        // Generate initial preview if text is provided
        if (text) {
            this.updateAsciiPreview(text, 'standard');
        }

        // Focus the text input for immediate editing
        setTimeout(() => {
            textInput.focus();
            textInput.select();
        }, 100);
    }

    /**
     * Update the ASCII art preview
     * @param {string} text - The text to convert
     * @param {string} fontId - The font ID to use
     */
    updateAsciiPreview(text, fontId) {
        const preview = document.getElementById('ascii-preview');
        if (!preview) return;

        const asciiArt = this.generateAsciiFont(text, fontId);
        preview.textContent = asciiArt;
    }

    /**
     * Generate final ASCII art and display
     * @param {string} text - The text to convert
     * @param {string} fontId - The font ID to use
     */
    generateFinalAscii(text, fontId) {
        const preview = document.getElementById('ascii-preview');
        if (!preview) return;

        const asciiArt = this.generateAsciiFont(text, fontId);
        preview.textContent = asciiArt;

        // Add a success message
        this.printLine('');
        this.printLine('ASCII art generated! Click COPY to copy to clipboard.');
    }

    /**
     * Copy text to clipboard
     * @param {string} text - The text to copy
     */
    copyToClipboard(text) {
        // Create a temporary element to hold the text
        const tempElement = document.createElement('textarea');
        tempElement.value = text;
        document.body.appendChild(tempElement);

        // Select and copy
        tempElement.select();
        document.execCommand('copy');

        // Remove the temporary element
        document.body.removeChild(tempElement);

        // Show feedback
        this.printLine('ASCII art copied to clipboard!');
    }

    /**
     * Generate ASCII art using the specified font
     * @param {string} text - The text to convert
     * @param {string} fontId - The font ID to use
     * @returns {string} - The generated ASCII art
     */
    generateAsciiFont(text, fontId) {
        // If no text, return empty string
        if (!text || text.trim() === '') {
            return '';
        }

        // Verify that AsciiFonts is available
        if (typeof AsciiFonts === 'undefined') {
            console.error('AsciiFonts is not defined. Make sure ascii-fonts.js is loaded.');
            return text;
        }

        // Get the appropriate character map based on font
        let charMap;

        switch (fontId) {
            case 'standard':
                charMap = AsciiFonts.standard;
                break;
            case 'bold':
                charMap = AsciiFonts.bold;
                break;
            case 'thin':
                charMap = AsciiFonts.thin;
                break;
            case 'digital':
                charMap = AsciiFonts.digital;
                break;
            case 'bubble':
                charMap = AsciiFonts.bubble;
                break;
            case 'calvinS':
                charMap = AsciiFonts.calvinS;
                break;
            default:
                charMap = AsciiFonts.standard;
        }

        // Convert text to lowercase for mapping
        const lowerText = text.toLowerCase();

        // Determine how many lines are in each character (assuming all have the same)
        const lineCount = charMap['a'] ? charMap['a'].length : 4;

        // Initialize result with empty lines
        let result = new Array(lineCount).fill('');

        // Build the ASCII art line by line
        for (let i = 0; i < lowerText.length; i++) {
            const char = lowerText[i];
            // Get character lines from map or use default
            const charLines = charMap[char] || AsciiFonts.defaultChar;

            // Add each line to the result
            for (let j = 0; j < lineCount; j++) {
                if (charLines[j]) {
                    result[j] += charLines[j];
                } else {
                    result[j] += ' '.repeat(charLines[0].length || 5);
                }
            }
        }

        // Set data-font attribute on the preview element
        const preview = document.getElementById('ascii-preview');
        if (preview) {
            preview.setAttribute('data-font', fontId);
        }

        // Join lines with newlines
        return result.join('\n');
    }
}
