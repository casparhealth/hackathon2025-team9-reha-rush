// Game constants
const COLORS = {
    GREEN: '#21BEBA',    // Caspar Clinic turquoise
    BLUE: '#6C5CE7',     // Violet Clinic
    ORANGE: '#FF7A00',   // Orange Clinic
    WALL: '#e2e8f0',     // Light gray walls
    CORRIDOR: '#f8fafc', // Very light gray corridor
    SWITCH: '#21BEBA',   // Turquoise switches
    SPAWN: '#94a3b8'     // Cardboard box color
};

const CELL_SIZE = 40;
const DIRECTIONS = {
    NORTH: { x: 0, y: -1, name: 'north' },
    EAST: { x: 1, y: 0, name: 'east' },
    SOUTH: { x: 0, y: 1, name: 'south' },
    WEST: { x: -1, y: 0, name: 'west' }
};

// Level definitions
const LEVELS = {
    1: {
        attempts: 10,
        spawnInterval: 3000,
        moveSpeed: 400,
        map: [
            "############",
            "#S--+--G  ##",
            "#   |  |  ##",
            "#   |  |  ##",
            "#   +--B  ##",
            "#          #",
            "#          #",
            "############"
        ],
        colors: ['G', 'B']
    },
    2: {
        attempts: 10,
        spawnInterval: 2800,
        moveSpeed: 380,
        map: [
            "############",
            "#S--+--G  ##",
            "#   |  |  ##",
            "#   +--+  ##",
            "#   |  B  ##",
            "#   |     ##",
            "#         ##",
            "############"
        ],
        colors: ['G', 'B']
    },
    3: {
        attempts: 10,
        spawnInterval: 3200,
        moveSpeed: 450,
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
        spawnInterval: 2400,
        moveSpeed: 340,
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
        spawnInterval: 2200,
        moveSpeed: 320,
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
        this.initAudio();
        this.setupEventListeners();
        this.initLevel();
        this.gameLoop();
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
        
        // Hide hint after level 1
        const hint = document.getElementById('hint');
        if (this.currentLevel > 1) {
            hint.style.display = 'none';
        } else {
            hint.style.display = 'block';
        }
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
        
        return {
            moveSpeed: Math.max(baseSpeed - speedBoost, baseSpeed * 0.6), // Don't go below 60% of base speed
            spawnInterval: Math.max(baseSpawn - spawnBoost, baseSpawn * 0.7) // Don't go below 70% of base spawn time
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
        
        this.carts.push({
            x: this.spawn.x,
            y: this.spawn.y,
            targetX: this.spawn.x,
            targetY: this.spawn.y,
            color: color,
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
            // Switch - use switch direction
            const switchObj = this.switches.find(s => s.x === cart.x && s.y === cart.y);
            if (switchObj) {
                nextDirection = switchObj.direction;
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
            // Collision - both carts are removed
            this.removeCart(cart);
            this.removeCart(collision);
            this.loseHeart();
            this.playSound(150, 300, 'sawtooth');
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
            } else {
                // Wrong delivery
                this.playSound(200, 400, 'sawtooth');
                this.removeCart(cart);
                this.loseHeart();
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
                
                // Draw cardboard box
                if (cell === 'S') {
                    this.drawCardboardBox(px, py);
                }
            }
        }
    }
    
    getCellColor(cell) {
        switch (cell) {
            case '#': return COLORS.WALL;
            case 'G': return '#f0fffe';  // Light turquoise background
            case 'B': return '#f8f7ff';  // Light violet background  
            case 'O': return '#fff8f0';  // Light orange background
            case 'S': return '#f1f5f9';  // Light blue-gray for spawn
            case '+': return '#e0f7f7';  // Very light turquoise for switch
            case '-':
            case '|':
                return COLORS.CORRIDOR;
            default: return '#fafafa';
        }
    }
    
    drawClinic(x, y, type) {
        const centerX = x + CELL_SIZE / 2;
        const centerY = y + CELL_SIZE / 2;
        const buildingSize = CELL_SIZE * 0.8;
        const buildingX = centerX - buildingSize / 2;
        const buildingY = centerY - buildingSize / 2;
        
        // Clinic colors
        let clinicColor, clinicName;
        switch (type) {
            case 'G':
                clinicColor = COLORS.GREEN;
                clinicName = 'Caspar';
                break;
            case 'B':
                clinicColor = COLORS.BLUE;
                clinicName = 'Violet';
                break;
            case 'O':
                clinicColor = COLORS.ORANGE;
                clinicName = 'Orange';
                break;
        }
        
        // Building base
        this.ctx.fillStyle = 'white';
        this.ctx.fillRect(buildingX, buildingY, buildingSize, buildingSize);
        
        // Building outline
        this.ctx.strokeStyle = clinicColor;
        this.ctx.lineWidth = 3;
        this.ctx.strokeRect(buildingX, buildingY, buildingSize, buildingSize);
        
        // Roof/top section
        const roofHeight = buildingSize * 0.25;
        this.ctx.fillStyle = clinicColor;
        this.ctx.fillRect(buildingX, buildingY, buildingSize, roofHeight);
        
        // Door
        const doorWidth = buildingSize * 0.2;
        const doorHeight = buildingSize * 0.4;
        const doorX = centerX - doorWidth / 2;
        const doorY = buildingY + buildingSize - doorHeight;
        this.ctx.fillStyle = clinicColor;
        this.ctx.fillRect(doorX, doorY, doorWidth, doorHeight);
        
        // Windows
        const windowSize = buildingSize * 0.15;
        const windowY = buildingY + roofHeight + 8;
        this.ctx.fillStyle = clinicColor;
        this.ctx.fillRect(buildingX + 6, windowY, windowSize, windowSize);
        this.ctx.fillRect(buildingX + buildingSize - windowSize - 6, windowY, windowSize, windowSize);
        
        // Only show name for Caspar clinic
        if (type === 'G') {
            this.ctx.fillStyle = 'white';
            this.ctx.font = 'bold 8px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(clinicName, centerX, buildingY + roofHeight/2 + 2);
        }
    }
    
    drawCardboardBox(x, y) {
        const centerX = x + CELL_SIZE / 2;
        const centerY = y + CELL_SIZE / 2;
        const boxSize = CELL_SIZE * 0.7;
        const boxX = centerX - boxSize / 2;
        const boxY = centerY - boxSize / 2;
        
        // Box base
        this.ctx.fillStyle = '#d4a574';  // Cardboard brown
        this.ctx.fillRect(boxX, boxY, boxSize, boxSize);
        
        // Box outline
        this.ctx.strokeStyle = '#8b5a2b';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(boxX, boxY, boxSize, boxSize);
        
        // Box tape/stripes
        this.ctx.strokeStyle = '#a67c52';
        this.ctx.lineWidth = 2;
        // Horizontal stripe
        this.ctx.beginPath();
        this.ctx.moveTo(boxX, centerY);
        this.ctx.lineTo(boxX + boxSize, centerY);
        this.ctx.stroke();
        
        // Vertical stripe  
        this.ctx.beginPath();
        this.ctx.moveTo(centerX, boxY);
        this.ctx.lineTo(centerX, boxY + boxSize);
        this.ctx.stroke();
        
        // "Equipment" text
        this.ctx.fillStyle = '#5a3e2b';
        this.ctx.font = 'bold 7px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('EQUIP', centerX, centerY - 3);
        this.ctx.fillText('MENT', centerX, centerY + 5);
    }
    
    drawCart(cart) {
        const level = LEVELS[this.currentLevel];
        let drawX = cart.x * CELL_SIZE;
        let drawY = cart.y * CELL_SIZE;
        
        // Animate movement
        if (cart.moving) {
            const progress = Math.min(cart.moveProgress, 1);
            drawX += (cart.targetX - cart.x) * CELL_SIZE * progress;
            drawY += (cart.targetY - cart.y) * CELL_SIZE * progress;
        }
        
        // Draw gymnastic ball (sphere)
        const centerX = drawX + CELL_SIZE / 2;
        const centerY = drawY + CELL_SIZE / 2;
        const radius = CELL_SIZE * 0.3;
        
        const color = cart.color === 'G' ? COLORS.GREEN : 
                      cart.color === 'B' ? COLORS.BLUE : COLORS.ORANGE;
        
        // Ball shadow
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        this.ctx.beginPath();
        this.ctx.ellipse(centerX + 2, centerY + 2, radius, radius * 0.3, 0, 0, 2 * Math.PI);
        this.ctx.fill();
        
        // Ball main body
        this.ctx.fillStyle = color;
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
        this.ctx.fill();
        
        // Ball highlight
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        this.ctx.beginPath();
        this.ctx.arc(centerX - radius * 0.3, centerY - radius * 0.3, radius * 0.3, 0, 2 * Math.PI);
        this.ctx.fill();
        
        // Ball outline
        this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
        this.ctx.stroke();
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
    new Game();
});