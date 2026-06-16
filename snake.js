const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const scoreElement = document.getElementById("score");
const highScoreElement = document.getElementById("high-score");
const menuHighScoreElement = document.getElementById("menu-high-score");
const finalScoreElement = document.getElementById("final-score");

// Game Variables
let snake = [];
let food = {};
let direction = { x: 0, y: 0 };
let nextDirection = { x: 0, y: 0 };
let score = 0;
let highScore = localStorage.getItem("snakeHighScore") || 0;
let gameLoop;
let mode = 'easy'; // easy ya hard
const gridSize = 20;
let tileCountX, tileCountY;

// Canvas ko phone ki screen ke hisab se set karna
function resizeCanvas() {
    canvas.width = Math.floor(window.innerWidth / gridSize) * gridSize;
    canvas.height = Math.floor((window.innerHeight - 80) / gridSize) * gridSize;
    // Max width/height restrict karna
    if (canvas.width > 400) canvas.width = 400;
    if (canvas.height > 600) canvas.height = 600;
    tileCountX = canvas.width / gridSize;
    tileCountY = canvas.height / gridSize;
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas();
menuHighScoreElement.textContent = highScore;

// 🔊 SOUND GENERATOR: Phone speaker se beep sound nikalne ke liye
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playCoinSound() {
    if(audioCtx.state === 'suspended') audioCtx.resume();
    
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    osc.type = "sine";
    // Coin sound (High pitch beep)
    osc.frequency.setValueAtTime(800, audioCtx.currentTime); 
    osc.frequency.exponentialRampToValueAtTime(1200, audioCtx.currentTime + 0.1);
    
    // Volume control
    gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
    
    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    osc.start();
    osc.stop(audioCtx.currentTime + 0.1);
}

// GAME LOGIC
function startGame(selectedMode) {
    // Resume audio context directly on user interaction
    if(audioCtx.state === 'suspended') audioCtx.resume();

    mode = selectedMode;
    document.getElementById('main-menu').classList.add('hidden');
    document.getElementById('game-screen').classList.remove('hidden');
    document.getElementById('game-over').classList.add('hidden');
    
    // Initial Snake state (Start in center)
    snake = [{ x: Math.floor(tileCountX/2), y: Math.floor(tileCountY/2) }];
    direction = { x: 1, y: 0 }; 
    nextDirection = { x: 1, y: 0 };
    score = 0;
    
    scoreElement.textContent = score;
    highScoreElement.textContent = highScore;
    
    placeFood();
    
    if (gameLoop) clearInterval(gameLoop);
    gameLoop = setInterval(update, 120); // Game Speed (Lower = Faster)
}

function showMenu() {
    document.getElementById('main-menu').classList.remove('hidden');
    document.getElementById('game-screen').classList.add('hidden');
    menuHighScoreElement.textContent = highScore;
}

function placeFood() {
    food = {
        x: Math.floor(Math.random() * tileCountX),
        y: Math.floor(Math.random() * tileCountY)
    };
    
    // Make sure food snake ke upar spawn na ho
    for(let part of snake) {
        if(part.x === food.x && part.y === food.y) {
            placeFood();
            break;
        }
    }
}

function update() {
    direction = nextDirection;
    let head = { x: snake[0].x + direction.x, y: snake[0].y + direction.y };

    // Mode ke hisaab se screen rules
    if (mode === 'hard') {
        // Wall Collision (Game Over)
        if (head.x < 0 || head.x >= tileCountX || head.y < 0 || head.y >= tileCountY) {
            return gameOver();
        }
    } else {
        // Easy Mode (Screen wrap, No Collider)
        if (head.x < 0) head.x = tileCountX - 1;
        else if (head.x >= tileCountX) head.x = 0;
        
        if (head.y < 0) head.y = tileCountY - 1;
        else if (head.y >= tileCountY) head.y = 0;
    }

    // Khud se takrane ka check (Self elimination)
    for (let part of snake) {
        if (head.x === part.x && head.y === part.y) {
            return gameOver();
        }
    }

    // Move logic
    snake.unshift(head);

    // Food logic
    if (head.x === food.x && head.y === food.y) {
        score += 10;
        scoreElement.textContent = score;
        playCoinSound(); // Sound play karna
        placeFood(); // Naya coin banana
        // pop() skip kar rahe hain taaki length badh jaye
    } else {
        // Agar food nahi khaya to last element remove karo
        snake.pop();
    }

    draw();
}

function gameOver() {
    clearInterval(gameLoop);
    // Best Score Save logic
    if (score > highScore) {
        highScore = score;
        localStorage.setItem("snakeHighScore", highScore);
    }
    finalScoreElement.textContent = score;
    document.getElementById('game-over').classList.remove('hidden');
}

function draw() {
    // Screen clear karna (Hard mode me border draw karne ke liye thoda space)
    ctx.fillStyle = mode === 'hard' ? "#111" : "#000"; 
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Hard Mode Collider (Red Border)
    if (mode === 'hard') {
        ctx.strokeStyle = "#ff3333";
        ctx.lineWidth = 4;
        ctx.strokeRect(0, 0, canvas.width, canvas.height);
    }

    // Coin Draw (Gold Circle)
    ctx.fillStyle = "#FFD700";
    ctx.beginPath();
    ctx.arc(food.x * gridSize + gridSize/2, food.y * gridSize + gridSize/2, gridSize/2 - 2, 0, Math.PI * 2);
    ctx.fill();

    // Snake Draw
    snake.forEach((part, index) => {
        // Head ka color thoda light green, body dark green
        ctx.fillStyle = index === 0 ? "#4CAF50" : "#2E7D32";
        ctx.fillRect(part.x * gridSize, part.y * gridSize, gridSize - 1, gridSize - 1);
    });
}

// ====== SWIPE CONTROLS ======
let touchStartX = 0;
let touchStartY = 0;
let touchEndX = 0;
let touchEndY = 0;

document.addEventListener('touchstart', e => {
    touchStartX = e.changedTouches[0].screenX;
    touchStartY = e.changedTouches[0].screenY;
    touchEndX = touchStartX; // Reset
    touchEndY = touchStartY; // Reset
}, {passive: false});

document.addEventListener('touchmove', e => {
    e.preventDefault(); // Ye WebView mein pull-to-refresh aur scroll ko rokega
    touchEndX = e.changedTouches[0].screenX;
    touchEndY = e.changedTouches[0].screenY;
}, {passive: false});

document.addEventListener('touchend', e => {
    // Agar touchend naye coordinates de toh use karo, warna touchmove wale use honge
    if (e.changedTouches.length > 0) {
        touchEndX = e.changedTouches[0].screenX;
        touchEndY = e.changedTouches[0].screenY;
    }
    handleSwipe(touchStartX, touchStartY, touchEndX, touchEndY);
}, {passive: false});

function handleSwipe(startX, startY, endX, endY) {
    let diffX = endX - startX;
    let diffY = endY - startY;
    
    // X or Y Axis detection 
    if (Math.abs(diffX) > Math.abs(diffY)) {
        if (Math.abs(diffX) > 30) { 
            if (diffX > 0 && direction.x !== -1) { nextDirection = { x: 1, y: 0 }; } // Right
            else if (diffX < 0 && direction.x !== 1) { nextDirection = { x: -1, y: 0 }; } // Left
        }
    } else {
        if (Math.abs(diffY) > 30) {
            if (diffY > 0 && direction.y !== -1) { nextDirection = { x: 0, y: 1 }; } // Down
            else if (diffY < 0 && direction.y !== 1) { nextDirection = { x: 0, y: -1 }; } // Up
        }
    }
}

// PC me test karne ke liye keyboard arrows
document.addEventListener("keydown", e => {
    switch(e.key) {
        case "ArrowUp": if (direction.y !== 1) nextDirection = { x: 0, y: -1 }; break;
        case "ArrowDown": if (direction.y !== -1) nextDirection = { x: 0, y: 1 }; break;
        case "ArrowLeft": if (direction.x !== 1) nextDirection = { x: -1, y: 0 }; break;
        case "ArrowRight": if (direction.x !== -1) nextDirection = { x: 1, y: 0 }; break;
    }
});
