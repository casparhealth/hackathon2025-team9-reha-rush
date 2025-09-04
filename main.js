// Game constants
const COLORS = {
    GREEN: '#21BEBA',    // Caspar Clinic turquoise
    CORAL: '#FF6B6B',     // Coral Clinic
    YELLOW: '#FFD93D',   // Yellow Clinic
    WALL: '#e2e8f0',     // Light gray walls
    CORRIDOR: '#f8fafc', // Very light gray corridor
    SWITCH: '#21BEBA',   // Turquoise switches
    SPAWN: '#94a3b8'     // Cardboard box color
};

const CELL_SIZE = 56;
const DIRECTIONS = {
    NORTH: { x: 0, y: -1, name: 'north' },
    EAST: { x: 1, y: 0, name: 'east' },
    SOUTH: { x: 0, y: 1, name: 'south' },
    WEST: { x: -1, y: 0, name: 'west' }
};

const ASSETS = {
    'clinic_caspar': 'assets/clinic_caspar.png',
    'clinic_coral': 'assets/clinic_coral.png',
    'clinic_yellow': 'assets/clinic_yellow.png',
    'equipment_ball': 'assets/equipment_ball.png',
    'equipment_dumbbell': 'assets/equipment_dumbbell.png',
    'equipment_folder': 'assets/equipment_folder.png',
};

// Level definitions
const LEVELS = {
    1: {
        // Tutorial / Practice level
        attempts: 3,
        spawnInterval: 4200,
        moveSpeed: 560,
        isTutorial: true,
        maxConcurrentCarts: 1,
        map: [
            "############",
            "#S--+--G  ##",
            "#   |     ##",
            "#   |     ##",
            "#   B     ##",
            "#         ##",
            "#         ##",
            "############"
        ],
        colors: ['G', 'B']
    },
    2: {
        attempts: 7,
        spawnInterval: 4200,
        moveSpeed: 530,
        maxConcurrentCarts: 2,
        map: [
            "############",
            "#S--+--G  ##",
            "#   |  |  ##",
            "#   |  |  ##",
            "#   +--+  ##",
            "#   +--B  ##",
            "#         ##",
            "#         ##",
            "############"
        ],
        colors: ['G', 'B']
    },
    3: {
        attempts: 8,
        spawnInterval: 3900,
        moveSpeed: 490,
        map: [
            "##############",
            "#S--+----+G ##",
            "#   |    |  ##",
            "#   +----+--O#",
            "#   |        #",
            "#   +----B   #",
            "#            #",
            "#            #",
            "##############"
        ],
        colors: ['G', 'B', 'O']
    },
    4: {
        attempts: 10,
        spawnInterval: 3200,
        moveSpeed: 320,
        map: [
            "##############",
            "#S---+---G  ##",
            "#    |   |  ##",
            "#    +---+--O#",
            "#    |       #",
            "# B--+       #",
            "#            #",
            "#            #",
            "##############"
        ],
        colors: ['G', 'B', 'O']
    },
    5: {
        attempts: 10,
        spawnInterval: 1500,
        moveSpeed: 300,
        map: [
            "##############",
            "#S--+---G   ##",
            "#   |   |   ##",
            "#   +---+--O##",
            "#       |   ##",
            "#   B   +    #",
            "#            #",
            "#            #",
            "##############"
        ],
        colors: ['G', 'B', 'O']
    }
};

// Game state
class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.currentLevel = 1;
        this.totalScore = 0;
        this.levelScore = 0;
        this.attempts = 0;
        this.hearts = 3;
        this.paused = false;
        this.gameOver = false;
        this.won = false;
        
        this.grid = [];
        this.carts = [];
        this.switches = [];
        this.spawn = null;
        this.departments = [];
        
        this.lastSpawn = 0;
        this.colorIndex = 0;
        this.lastMove = 0;
        this.selectedSwitchIndex = 0;
        
        this.audioContext = null;
        // Tutorial state
        this.tutorialActive = false;
        this.tutorialStep = 0;
        this.ttsPlayed = false;
        this.assets = {}; // To store loaded images
        this.assetsLoaded = false;
        
        this.loadAssets().then(() => {
            this.assetsLoaded = true;
            this.initAudio();
            this.setupEventListeners();
            this.initLevel();
            this.gameLoop();
        });
    }
    
    async loadAssets() {
        const promises = Object.entries(ASSETS).map(([key, src]) => {
            return new Promise((resolve, reject) => {
                const img = new Image();
                img.src = src;
                img.onload = () => {
                    this.assets[key] = img;
                    resolve();
                };
                img.onerror = () => {
                    console.error(`Failed to load asset: ${src}`);
                    // Resolve anyway so the game doesn't break if an image is missing
                    resolve(); 
                };
            });
        });
        await Promise.all(promises);
    }

    initAudio() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.log('Audio not supported');
        }
    }
    
    playSound(frequency, duration = 100, type = 'sine') {
        if (!this.audioContext) return;
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.frequency.value = frequency;
        oscillator.type = type;
        
        gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration / 1000);
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + duration / 1000);
    }
    
    setupEventListeners() {
        // Canvas click for switches
        this.canvas.addEventListener('click', (e) => this.handleClick(e));
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.handleClick(e.touches[0]);
        });
        
        // Control buttons
        document.getElementById('pause-btn').addEventListener('click', () => this.togglePause());
        document.getElementById('restart-btn').addEventListener('click', () => this.restart());
        document.getElementById('next-level-btn').addEventListener('click', () => this.nextLevel());
        document.getElementById('game-over-restart').addEventListener('click', () => this.restart());
        document.getElementById('game-over-next').addEventListener('click', () => this.nextLevel());
        
        // Resize handling
        window.addEventListener('resize', () => this.resizeCanvas());
        this.resizeCanvas();
    }
    
    resizeCanvas() {
        const container = document.querySelector('.canvas-container');
        const containerRect = container.getBoundingClientRect();
        
        const level = LEVELS[this.currentLevel];
        const gridWidth = level.map[0].length * CELL_SIZE;
        const gridHeight = level.map.length * CELL_SIZE;
        
        const scaleX = (containerRect.width - 40) / gridWidth;
        const scaleY = (containerRect.height - 40) / gridHeight;
        const scale = Math.min(scaleX, scaleY, 1);
        
        this.canvas.width = gridWidth;
        this.canvas.height = gridHeight;
        this.canvas.style.width = `${gridWidth * scale}px`;
        this.canvas.style.height = `${gridHeight * scale}px`;
        
        this.scale = scale;
    }
    
    initLevel() {
        const level = LEVELS[this.currentLevel];
        this.grid = [];
        this.carts = [];
        this.switches = [];
        this.departments = [];
        this.spawn = null;
        this.lastSpawn = 0;
        this.colorIndex = 0;
        this.lastMove = 0;
        this.selectedSwitchIndex = 0;
        this.levelScore = 0;
        this.attempts = 0;
        
        // Parse map
        for (let y = 0; y < level.map.length; y++) {
            this.grid[y] = [];
            for (let x = 0; x < level.map[y].length; x++) {
                const cell = level.map[y][x];
                this.grid[y][x] = cell;
                
                if (cell === 'S') {
                    this.spawn = { x, y };
                } else if (cell === '+') {
                    this.switches.push({ 
                        x, 
                        y, 
                        direction: DIRECTIONS.EAST // Will be corrected after all switches are loaded
                    });
                } else if (cell === 'G' || cell === 'B' || cell === 'O') {
                    this.departments.push({ x, y, color: cell });
                }
            }
        }
        
        // Initialize switch directions to valid options
        this.switches.forEach(switchObj => {
            const validDirs = this.getValidDirectionsForSwitch(switchObj);
            if (validDirs.length > 0) {
                switchObj.direction = validDirs[0];
            }
        });
        
        this.updateUI();
        this.resizeCanvas();
        
        // Tutorial setup for level 1 (always show)
        if (level.isTutorial) {
            this.tutorialActive = true;
            this.tutorialStep = 0;
            this.ttsPlayed = false;
            const overlay = document.getElementById('tutorial-overlay');
            const text = document.getElementById('tutorial-text');
            const skip = document.getElementById('tutorial-skip');
            if (overlay && text) {
                overlay.style.display = 'block';
                text.textContent = 'Rotate the highlighted switch to change the route.';
            }
            if (skip) skip.onclick = () => { this.endTutorial(); };
        }
        
        // Hide hint after level 1
        const hint = document.getElementById('hint');
        if (this.currentLevel > 1) {
            hint.style.display = 'none';
        } else {
            hint.style.display = 'block';
        }

        // Speak hint aloud on Level 1 (one time per session)
        if (this.currentLevel === 1 && !this.ttsPlayed) {
            const textToRead = (hint && hint.textContent) ? hint.textContent : 'Click switches to change their direction and route training equipment to matching reha clinics.';
            this.speak(textToRead);
            this.ttsPlayed = true;
        }
    }

    speak(text) {
        try {
            if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
                const utterance = new SpeechSynthesisUtterance(text);
                utterance.rate = 0.95;
                utterance.pitch = 1.0;
                utterance.volume = 1.0;
                window.speechSynthesis.cancel();
                window.speechSynthesis.speak(utterance);
            }
        } catch {}
    }
    
    handleClick(e) {
        if (this.paused || this.gameOver) return;
        
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        
        const x = Math.floor((e.clientX - rect.left) * scaleX / CELL_SIZE);
        const y = Math.floor((e.clientY - rect.top) * scaleY / CELL_SIZE);
        
        // Check if clicked on a switch
        const switchIndex = this.switches.findIndex(s => s.x === x && s.y === y);
        if (switchIndex !== -1) {
            this.selectedSwitchIndex = switchIndex;
            this.cycleSwitchDirection(this.switches[switchIndex]);
            this.playSound(600, 150);
            if (this.tutorialActive && this.tutorialStep === 0) {
                const text = document.getElementById('tutorial-text');
                if (text) text.textContent = 'Deliver the green ball to the green clinic.';
                this.tutorialStep = 1;
            }
        }
    }
    
    cycleSwitchDirection(switchObj) {
        // Get the two valid directions for this switch
        const validDirections = this.getValidDirectionsForSwitch(switchObj);
        
        if (validDirections.length >= 2) {
            const currentIndex = validDirections.findIndex(d => d === switchObj.direction);
            const nextIndex = (currentIndex + 1) % validDirections.length;
            switchObj.direction = validDirections[nextIndex];
        }
    }
    
    getValidDirectionsForSwitch(switchObj) {
        const allDirections = [DIRECTIONS.NORTH, DIRECTIONS.EAST, DIRECTIONS.SOUTH, DIRECTIONS.WEST];
        const validDirections = [];
        
        // Check which directions lead to valid paths
        for (const direction of allDirections) {
            const nextX = switchObj.x + direction.x;
            const nextY = switchObj.y + direction.y;
            
            if (this.isValidPath(nextX, nextY)) {
                validDirections.push(direction);
            }
        }
        
        // For forward-only movement, exclude directions that lead back towards spawn
        const forwardDirections = this.getForwardDirections(switchObj, validDirections);
        
        // Return only forward directions, limited to 2 max
        return forwardDirections.slice(0, 2);
    }
    
    getForwardDirections(switchObj, validDirections) {
        if (!this.spawn || validDirections.length <= 2) {
            return validDirections;
        }
        
        // Calculate distance from switch to spawn for each direction
        const directionScores = validDirections.map(direction => {
            const targetX = switchObj.x + direction.x;
            const targetY = switchObj.y + direction.y;
            
            // Distance from spawn (farther = more forward)
            const distanceFromSpawn = Math.abs(targetX - this.spawn.x) + Math.abs(targetY - this.spawn.y);
            
            // Check if this direction leads towards a department
            const leadsTowardsDepartment = this.departments.some(dept => {
                const deptDistance = Math.abs(targetX - dept.x) + Math.abs(targetY - dept.y);
                const currentDistance = Math.abs(switchObj.x - dept.x) + Math.abs(switchObj.y - dept.y);
                return deptDistance < currentDistance; // Getting closer to a department
            });
            
            return {
                direction,
                score: distanceFromSpawn + (leadsTowardsDepartment ? 10 : 0)
            };
        });
        
        // Sort by score (higher = more forward) and return top 2
        directionScores.sort((a, b) => b.score - a.score);
        return directionScores.slice(0, 2).map(item => item.direction);
    }
    
    
    isValidPath(x, y) {
        if (y < 0 || y >= this.grid.length || x < 0 || x >= this.grid[y].length) {
            return false;
        }
        
        const cell = this.grid[y][x];
        return cell !== '#' && cell !== ' ';
    }
    
    getProgressiveSpeed() {
        const level = LEVELS[this.currentLevel];
        const baseSpeed = level.moveSpeed;
        const baseSpawn = level.spawnInterval;
        
        // Speed increases every 3 points, but not too fast
        const speedBoost = Math.floor(this.totalScore / 3) * 30;
        const spawnBoost = Math.floor(this.totalScore / 3) * 100;
        
        const minMoveFactor = (this.currentLevel <= 2) ? 0.9 : 0.6;
        const minSpawnFactor = (this.currentLevel <= 2) ? 0.9 : 0.7;
        return {
            moveSpeed: Math.max(baseSpeed - speedBoost, baseSpeed * minMoveFactor),
            spawnInterval: Math.max(baseSpawn - spawnBoost, baseSpawn * minSpawnFactor)
        };
    }
    
    spawnCart() {
        if (!this.spawn) return;
        
        const level = LEVELS[this.currentLevel];
        const colors = level.colors;
        const color = colors[this.colorIndex % colors.length];
        this.colorIndex++;
        
        // Check if spawn is blocked
        const existingCart = this.carts.find(c => c.x === this.spawn.x && c.y === this.spawn.y);
        if (existingCart) return; // Don't spawn if blocked
        
        let itemType = 'ball';
        if (color === 'B') itemType = 'dumbbell';
        if (color === 'O') itemType = 'folder';

        this.carts.push({
            x: this.spawn.x,
            y: this.spawn.y,
            targetX: this.spawn.x,
            targetY: this.spawn.y,
            color: color,
            itemType: itemType, // Add itemType to cart object
            direction: DIRECTIONS.EAST, // Default spawn direction
            moving: false,
            moveProgress: 0
        });
    }
    
    moveCart(cart) {
        if (cart.moving) return;
        
        let nextX = cart.x;
        let nextY = cart.y;
        let nextDirection = cart.direction;
        
        // Check current cell for special behavior
        const currentCell = this.grid[cart.y][cart.x];
        
        if (currentCell === '+') {
            // Switch - use switch direction but enforce forward-only (no 180° reverse)
            const switchObj = this.switches.find(s => s.x === cart.x && s.y === cart.y);
            if (switchObj) {
                let desired = switchObj.direction;
                const isOpposite = (a, b) => a && b && a.x === -b.x && a.y === -b.y;
                // Gather valid directions from this tile
                const allDirs = [DIRECTIONS.NORTH, DIRECTIONS.EAST, DIRECTIONS.SOUTH, DIRECTIONS.WEST];
                const validDirs = allDirs.filter(d => this.isValidPath(cart.x + d.x, cart.y + d.y));
                const nonOpposite = validDirs.filter(d => !isOpposite(d, cart.direction));
                // If desired reverses, choose a non-opposite alternative
                if (isOpposite(desired, cart.direction) || !this.isValidPath(cart.x + desired.x, cart.y + desired.y)) {
                    // Prefer going straight if possible
                    const straight = nonOpposite.find(d => d.x === cart.direction.x && d.y === cart.direction.y);
                    if (straight) {
                        desired = straight;
                    } else if (nonOpposite.length > 0) {
                        desired = nonOpposite[0];
                    }
                }
                nextDirection = desired;
            }
        }
        
        // Calculate next position
        nextX = cart.x + nextDirection.x;
        nextY = cart.y + nextDirection.y;
        
        // Check bounds and valid path
        if (!this.isValidPath(nextX, nextY)) {
            // Cart is stuck - remove it (collision with wall)
            this.removeCart(cart);
            return;
        }
        
        // Check for collision with other carts at target position
        const collision = this.carts.find(c => c !== cart &&
            ((c.x === nextX && c.y === nextY) ||
             (c.targetX === nextX && c.targetY === nextY)));

        if (collision) {
            // Forward-only: if the next tile is (or will be) occupied, wait this tick.
            // No collision, no heart loss.
            return;
        }
        
        // Start moving
        cart.targetX = nextX;
        cart.targetY = nextY;
        cart.direction = nextDirection;
        cart.moving = true;
        cart.moveProgress = 0;
    }
    
    updateCartMovement(cart, deltaTime) {
        if (!cart.moving) return;
        
        const progressiveSpeed = this.getProgressiveSpeed();
        cart.moveProgress += deltaTime / progressiveSpeed.moveSpeed;
        
        if (cart.moveProgress >= 1) {
            // Movement complete
            cart.x = cart.targetX;
            cart.y = cart.targetY;
            cart.moving = false;
            cart.moveProgress = 0;
            
            // Check if reached department
            this.checkDelivery(cart);
        }
    }
    
    checkDelivery(cart) {
        const currentCell = this.grid[cart.y][cart.x];
        
        if (currentCell === 'G' || currentCell === 'B' || currentCell === 'O') {
            this.attempts++;
            
            if (currentCell === cart.color) {
                // Correct delivery
                this.levelScore++;
                this.playSound(800, 200);
                this.removeCart(cart);
                if (this.tutorialActive && this.tutorialStep >= 1) {
                    // After first successful delivery, end tutorial softly
                    this.endTutorial();
                }
            } else {
                // Wrong delivery
                this.playSound(200, 400, 'sawtooth');
                this.removeCart(cart);
                // Visual feedback: flash clinic red briefly
                this.flashClinic(cart.x, cart.y);
                const level = LEVELS[this.currentLevel];
                if (!level.isTutorial) this.loseHeart();
            }
            
            // Check if level complete (10 attempts)
            const level = LEVELS[this.currentLevel];
            if (this.attempts >= level.attempts) {
                this.completeLevel();
            }
            
            this.updateUI();
        }
    }
    
    removeCart(cart) {
        const index = this.carts.indexOf(cart);
        if (index > -1) {
            this.carts.splice(index, 1);
        }
    }

    endTutorial() {
        const overlay = document.getElementById('tutorial-overlay');
        if (overlay) overlay.style.display = 'none';
        this.tutorialActive = false;
        try { localStorage.setItem('rr_seen_tutorial','1'); } catch {}
    }
    
    loseHeart() {
        this.hearts--;
        this.updateUI();
        
        if (this.hearts <= 0) {
            this.gameOver = true;
            this.showGameOver(false);
        }
    }
    
    completeLevel() {
        // Add level score to total score
        this.totalScore += this.levelScore;
        
        this.won = true;
        this.gameOver = true;
        this.showGameOver(true);
    }
    
    showGameOver(won) {
        const gameOverDiv = document.getElementById('game-over');
        const title = document.getElementById('game-over-title');
        const message = document.getElementById('game-over-message');
        const nextBtn = document.getElementById('game-over-next');
        const levelBtn = document.getElementById('next-level-btn');
        
        if (won) {
            title.textContent = 'Level Complete!';
            message.textContent = `Level Score: ${this.levelScore}/10 | Total: ${this.totalScore}`;
            
            if (this.currentLevel < Object.keys(LEVELS).length) {
                nextBtn.style.display = 'inline-block';
                levelBtn.style.display = 'inline-block';
            } else {
                nextBtn.style.display = 'none';
                levelBtn.style.display = 'none';
                title.textContent = 'Game Complete!';
                message.textContent = `Final Score: ${this.totalScore}`;
            }
        } else {
            title.textContent = 'Game Over';
            message.textContent = 'Try again!';
            nextBtn.style.display = 'none';
            levelBtn.style.display = 'none';
        }
        
        gameOverDiv.style.display = 'flex';
    }
    
    togglePause() {
        this.paused = !this.paused;
        const btn = document.getElementById('pause-btn');
        btn.textContent = this.paused ? 'Resume' : 'Pause';
        btn.classList.toggle('paused', this.paused);
    }
    
    restart() {
        this.gameOver = false;
        this.won = false;
        this.hearts = 3;
        this.score = 0;
        document.getElementById('game-over').style.display = 'none';
        document.getElementById('next-level-btn').style.display = 'none';
        this.initLevel();
    }
    
    nextLevel() {
        if (this.currentLevel < Object.keys(LEVELS).length) {
            this.currentLevel++;
            this.gameOver = false;
            this.won = false;
            this.hearts = 3;
            document.getElementById('game-over').style.display = 'none';
            document.getElementById('next-level-btn').style.display = 'none';
            this.initLevel();
        }
    }
    
    updateUI() {
        document.getElementById('level-display').textContent = `Level ${this.currentLevel}`;
        document.getElementById('score-display').textContent = `Score: ${this.levelScore}/${this.attempts} | Total: ${this.totalScore}`;
        
        const heartsDisplay = '❤️'.repeat(this.hearts) + '🖤'.repeat(3 - this.hearts);
        document.getElementById('hearts-display').textContent = `Hearts: ${heartsDisplay}`;
    }
    
    gameLoop() {
        const now = Date.now();
        const deltaTime = now - (this.lastTime || now);
        this.lastTime = now;
        
        if (!this.paused && !this.gameOver) {
            // Use progressive speed based on score
            const progressiveSpeed = this.getProgressiveSpeed();
            
            // Spawn carts
            if (now - this.lastSpawn >= progressiveSpeed.spawnInterval) {
                this.spawnCart();
                this.lastSpawn = now;
            }
            
            // Move carts
            if (now - this.lastMove >= progressiveSpeed.moveSpeed) {
                this.carts.forEach(cart => this.moveCart(cart));
                this.lastMove = now;
            }
            
            // Update cart animations
            this.carts.forEach(cart => this.updateCartMovement(cart, deltaTime));
        }
        
        this.render();
        requestAnimationFrame(() => this.gameLoop());
    }
    
    render() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw grid
        this.drawGrid();
        
        // Draw carts
        this.carts.forEach(cart => this.drawCart(cart));
        
        // Draw switches with arrows
        this.switches.forEach((switchObj, index) => this.drawSwitch(switchObj, index === this.selectedSwitchIndex));
        
        // Apply transient effects (clinic flashes)
        if (this._fx && this._fx.clinicFlash && Date.now() < this._fx.clinicFlash.until) {
            const fx = this._fx.clinicFlash;
            const px = fx.x * CELL_SIZE;
            const py = fx.y * CELL_SIZE;
            this.ctx.fillStyle = 'rgba(255,0,0,0.25)';
            this.ctx.fillRect(px, py, CELL_SIZE, CELL_SIZE);
        }
    }

    flashClinic(x, y) {
        if (!this._fx) this._fx = {};
        this._fx.clinicFlash = { x, y, until: Date.now() + 500 };
    }
    
    drawGrid() {
        for (let y = 0; y < this.grid.length; y++) {
            for (let x = 0; x < this.grid[y].length; x++) {
                const cell = this.grid[y][x];
                const px = x * CELL_SIZE;
                const py = y * CELL_SIZE;
                
                this.ctx.fillStyle = this.getCellColor(cell);
                this.ctx.fillRect(px, py, CELL_SIZE, CELL_SIZE);
                
                // Draw cell borders
                this.ctx.strokeStyle = '#e2e8f0';
                this.ctx.lineWidth = 1;
                this.ctx.strokeRect(px, py, CELL_SIZE, CELL_SIZE);
                
                // Draw clinic buildings
                if (cell === 'G' || cell === 'B' || cell === 'O') {
                    this.drawClinic(px, py, cell);
                }
                
                // Draw spawn pad
                if (cell === 'S') {
                    this.drawSpawnPad(px, py);
                }
            }
        }
    }
    
    getCellColor(cell) {
        switch (cell) {
            case '#': return COLORS.WALL;
            case 'G': // Make clinic background same as path
            case 'B': // Make clinic background same as path
            case 'O': // Make clinic background same as path
            case 'S': return '#f1f5f9';  // Light blue-gray for spawn
            case '+': return '#e0f7f7';  // Very light turquoise for switch
            case '-':
            case '|':
                return COLORS.CORRIDOR;
            default: return '#fafafa';
        }
    }

    // Utility to draw rounded rects
    #roundRect(x, y, w, h, r, fill, stroke) {
        const ctx = this.ctx;
        if (r < 2) { if (fill) { ctx.fillRect(x, y, w, h); } if (stroke) { ctx.strokeRect(x, y, w, h); } return; }
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + r);
        ctx.lineTo(x + w, y + h - r);
        ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        ctx.lineTo(x + r, y + h);
        ctx.quadraticCurveTo(x, y + h, x, y + h - r);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.closePath();
        if (fill) ctx.fill();
        if (stroke) ctx.stroke();
    }
    
    drawClinic(x, y, type) {
        const cx = x + CELL_SIZE / 2;
        const cy = y + CELL_SIZE / 2;
        const s = CELL_SIZE * 1; // Fill the cell completely
        const bx = cx - s / 2;
        const by = cy - s / 2;

        let assetKey;
        if (type === 'G') assetKey = 'clinic_caspar';
        else if (type === 'B') assetKey = 'clinic_coral';
        else if (type === 'O') assetKey = 'clinic_yellow';

        const img = this.assets[assetKey];
        if (img) {
            // Add a manual offset to correct for transparent padding in the asset
            const offsetX = s * 0.1; 
            const offsetY = s * 0.1;
            this.ctx.drawImage(img, bx - offsetX, by - offsetY, s, s);
        } else {
            // Fallback drawing if image fails to load
            this.ctx.fillStyle = '#cccccc';
            this.ctx.fillRect(bx, by, s, s);
            this.ctx.fillStyle = '#000000';
            this.ctx.fillText('?', cx, cy);
        }
    }
    
    drawSpawnPad(x, y) {
        const cx = x + CELL_SIZE / 2;
        const cy = y + CELL_SIZE / 2;
        const r = CELL_SIZE * 0.32;
        // Pad base
        this.ctx.fillStyle = '#e6f7f6';
        this.ctx.strokeStyle = '#21BEBA';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.arc(cx, cy, r, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.stroke();
        // Chevrons
        this.ctx.strokeStyle = '#21BEBA';
        this.ctx.lineWidth = 3;
        const chevron = (ox, oy) => {
            this.ctx.beginPath();
            this.ctx.moveTo(ox - r*0.05, oy - r*0.18);
            this.ctx.lineTo(ox + r*0.15, oy);
            this.ctx.lineTo(ox - r*0.05, oy + r*0.18);
            this.ctx.stroke();
        };
        // Position chevrons to point right
        chevron(cx - r*0.2, cy);
        chevron(cx + r*0.2, cy);
    }
    
    drawCart(cart) {
        let drawX = cart.x * CELL_SIZE;
        let drawY = cart.y * CELL_SIZE;
        if (cart.moving) {
            const p = Math.min(cart.moveProgress, 1);
            drawX += (cart.targetX - cart.x) * CELL_SIZE * p;
            drawY += (cart.targetY - cart.y) * CELL_SIZE * p;
        }
        const cx = drawX + CELL_SIZE / 2;
        const cy = drawY + CELL_SIZE / 2;
        const s = CELL_SIZE * 0.95; // Make cart nearly full cell size
        const bx = cx - s / 2;
        const by = cy - s / 2;

        let assetKey;
        if (cart.itemType === 'ball') assetKey = 'equipment_ball';
        else if (cart.itemType === 'dumbbell') assetKey = 'equipment_dumbbell';
        else assetKey = 'equipment_folder';

        const img = this.assets[assetKey];
        if (img) {
            this.ctx.drawImage(img, bx, by, s, s);
        } else {
            // Fallback drawing if image fails to load
            this.ctx.fillStyle = '#cccccc';
            this.ctx.fillRect(bx, by, s, s);
            this.ctx.fillStyle = '#000000';
            this.ctx.fillText('?', cx, cy);
        }
    }
    
    drawSwitch(switchObj, isSelected = false) {
        const px = switchObj.x * CELL_SIZE;
        const py = switchObj.y * CELL_SIZE;
        const centerX = px + CELL_SIZE / 2;
        const centerY = py + CELL_SIZE / 2;
        const switchRadius = CELL_SIZE * 0.35;
        
        // Switch base (circle)
        this.ctx.fillStyle = isSelected ? '#21BEBA' : 'white';
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, switchRadius, 0, 2 * Math.PI);
        this.ctx.fill();
        
        // Switch border
        this.ctx.strokeStyle = '#21BEBA';
        this.ctx.lineWidth = isSelected ? 4 : 2;
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, switchRadius, 0, 2 * Math.PI);
        this.ctx.stroke();
        
        // Arrow indicating direction
        this.ctx.strokeStyle = isSelected ? 'white' : '#21BEBA';
        this.ctx.fillStyle = isSelected ? 'white' : '#21BEBA';
        this.ctx.lineWidth = 3;
        this.ctx.lineCap = 'round';
        
        const arrowSize = switchRadius * 0.6;
        const dir = switchObj.direction;
        
        // Arrow line
        this.ctx.beginPath();
        this.ctx.moveTo(centerX, centerY);
        this.ctx.lineTo(centerX + dir.x * arrowSize, centerY + dir.y * arrowSize);
        this.ctx.stroke();
        
        // Arrow head
        const headSize = arrowSize * 0.4;
        const headX = centerX + dir.x * arrowSize;
        const headY = centerY + dir.y * arrowSize;
        
        this.ctx.beginPath();
        this.ctx.moveTo(headX, headY);
        if (dir === DIRECTIONS.NORTH) {
            this.ctx.lineTo(headX - headSize, headY + headSize);
            this.ctx.lineTo(headX + headSize, headY + headSize);
        } else if (dir === DIRECTIONS.SOUTH) {
            this.ctx.lineTo(headX - headSize, headY - headSize);
            this.ctx.lineTo(headX + headSize, headY - headSize);
        } else if (dir === DIRECTIONS.EAST) {
            this.ctx.lineTo(headX - headSize, headY - headSize);
            this.ctx.lineTo(headX - headSize, headY + headSize);
        } else if (dir === DIRECTIONS.WEST) {
            this.ctx.lineTo(headX + headSize, headY - headSize);
            this.ctx.lineTo(headX + headSize, headY + headSize);
        }
        this.ctx.closePath();
        this.ctx.fill();
    }
}

// Start the game when page loads
window.addEventListener('load', () => {
    // Simple navigation for mock overlays
    const landing = document.getElementById('landing-overlay');
    const library = document.getElementById('library-overlay');
    const openLibrary = document.getElementById('menu-training');
    const backToDashboard = document.getElementById('back-to-dashboard');
    const playAttention = document.getElementById('play-attention');
    const playReadingGame = document.getElementById('play-reading-game');
    const ctaTrainBrain = document.getElementById('cta-train-brain');
    const menuTrainBrain = document.getElementById('train-brain-menu');
    const pillTrainBrain = document.getElementById('train-brain-pill');
    const resetTutorialBtn = document.getElementById('reset-tutorial');

    let gameInstance = null;

    const startGame = () => {
        if (!gameInstance) {
            gameInstance = new Game();
        }
        if (library) library.style.display = 'none';
        if (landing) landing.style.display = 'none';
    };

    // Check for URL params to show a specific view
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('view') === 'library') {
        // Skip landing, go straight to library
        landing.style.display = 'none';
        library.style.display = 'flex';
    }

    // Flow: Landing (full image) -> Library -> Game
    if (landing && library) {
        const goLibrary = () => {
            landing.style.display = 'none';
            library.style.display = 'flex';
        };
        landing.addEventListener('click', goLibrary);
        if (menuTrainBrain) menuTrainBrain.addEventListener('click', goLibrary);
        if (pillTrainBrain) pillTrainBrain.addEventListener('click', goLibrary);
        
        if (resetTutorialBtn) resetTutorialBtn.addEventListener('click', () => {
            try { localStorage.removeItem('rr_seen_tutorial'); } catch {}
            alert('Tutorial will show again on Level 1.');
        });

        if (backToDashboard) backToDashboard.addEventListener('click', () => {
            library.style.display = 'none';
            landing.style.display = 'flex';
        });

        if (playAttention) playAttention.addEventListener('click', startGame);
        
        if (playReadingGame) {
            playReadingGame.addEventListener('click', () => {
                window.location.href = 'games/reha-rush/index.html';
            });
        }
    } else {
        startGame();
    }
});