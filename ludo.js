// Sound Management Variables
let isSoundEnabled = true;
let currentVolume = 0.7; // Default volume 70%

// यहाँ आप अपनी किसी भी .mp3 फाइल का नाम डाल सकते हैं
// अभी टेस्टिंग के लिए मैंने एक ऑनलाइन फ्री डाइस साउंड का लिंक डाल दिया है
const diceSound = new Audio('dice.mp3'); 

// Settings Event Listeners (Sound toggle aur Volume Slider ke liye)
document.addEventListener("DOMContentLoaded", () => {
    const soundToggle = document.getElementById('sound-toggle');
    const volumeSlider = document.getElementById('volume-slider');

    if(soundToggle) {
        soundToggle.addEventListener('change', function(e) {
            isSoundEnabled = e.target.checked;
        });
    }

    if(volumeSlider) {
        volumeSlider.addEventListener('input', function(e) {
            currentVolume = e.target.value / 100; // 0 se 1 ke beech set karta hai
        });
    }
});

// Sound Play karne ka function
function playDiceSound() {
    if (isSoundEnabled) {
        diceSound.volume = currentVolume;
        diceSound.currentTime = 0; // Taki jaldi-jaldi click karne per bhi sound start se play ho
        diceSound.play().catch(e => console.log("Audio block ho gaya: " + e));
    }
}


// Game State & Tokens Logic
let gameMode = '2player';
let activeTurn = 1; // 1 = Player 1 (Yellow), 2 = Player 2 (Red)
let currentRoll = 0;
let isLocked = false;
let awaitingMove = false; 

// Player Tokens arrays (4 tokens each)
let p1Tokens = [];
let p2Tokens = [];

// FIXED: Exact 52-cell continuous outer path
const commonPath = [
    "cell-6-7", "cell-5-7", "cell-4-7", "cell-3-7", "cell-2-7", "cell-1-7", // 0-5
    "cell-1-8", // 6 (Top Turn)
    "cell-1-9", "cell-2-9", "cell-3-9", "cell-4-9", "cell-5-9", "cell-6-9", // 7-12
    "cell-7-10", "cell-7-11", "cell-7-12", "cell-7-13", "cell-7-14", "cell-7-15", // 13-18
    "cell-8-15", // 19 (Right Turn)
    "cell-9-15", "cell-9-14", "cell-9-13", "cell-9-12", "cell-9-11", "cell-9-10", // 20-25
    "cell-10-9", "cell-11-9", "cell-12-9", "cell-13-9", "cell-14-9", "cell-15-9", // 26-31
    "cell-15-8", // 32 (Bottom Turn)
    "cell-15-7", "cell-14-7", "cell-13-7", "cell-12-7", "cell-11-7", "cell-10-7", // 33-38
    "cell-9-6", "cell-9-5", "cell-9-4", "cell-9-3", "cell-9-2", "cell-9-1", // 39-44
    "cell-8-1", // 45 (Left Turn)
    "cell-7-1", "cell-7-2", "cell-7-3", "cell-7-4", "cell-7-5", "cell-7-6" // 46-51
];

// Profile Setup
document.getElementById('image-input').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(event) {
            document.getElementById('avatar-preview').innerHTML = `<img src="${event.target.result}">`;
        };
        reader.readAsDataURL(file);
    }
});

function saveProfileData() {
    const userName = document.getElementById('username-input').value.trim();
    if (userName !== "") {
        document.getElementById('p1-label').innerText = `${userName} (You)`;
    }
    toggleModal('profile-modal');
}

function toggleModal(id) {
    document.getElementById(id).classList.toggle('active');
}

function createLudoBoardUI() {
    const boardGrid = document.getElementById('board-grid');
    boardGrid.innerHTML = '';
    
    for (let row = 1; row <= 15; row++) {
        for (let col = 1; col <= 15; col++) {
            if (row === 1 && col === 1) {
                // Red Home (Top Left - Functional)
                boardGrid.innerHTML += `<div class="home-box border-red">
                    <div class="home-inner-box" id="p2-home-0" onclick="handleTokenClick(this.id)"></div>
                    <div class="home-inner-box" id="p2-home-1" onclick="handleTokenClick(this.id)"></div>
                    <div class="home-inner-box" id="p2-home-2" onclick="handleTokenClick(this.id)"></div>
                    <div class="home-inner-box" id="p2-home-3" onclick="handleTokenClick(this.id)"></div>
                </div>`;
            } else if (row === 10 && col === 1) {
                // Yellow Home (Bottom Left - Functional)
                boardGrid.innerHTML += `<div class="home-box border-yellow">
                    <div class="home-inner-box" id="p1-home-0" onclick="handleTokenClick(this.id)"></div>
                    <div class="home-inner-box" id="p1-home-1" onclick="handleTokenClick(this.id)"></div>
                    <div class="home-inner-box" id="p1-home-2" onclick="handleTokenClick(this.id)"></div>
                    <div class="home-inner-box" id="p1-home-3" onclick="handleTokenClick(this.id)"></div>
                </div>`;
            } else if (row === 1 && col === 10) {
                // Green Home (Top Right - Sirf dikhne ke liye non-functional tokens)
                boardGrid.innerHTML += `<div class="home-box border-green">
                    <div class="home-inner-box token-green"></div>
                    <div class="home-inner-box token-green"></div>
                    <div class="home-inner-box token-green"></div>
                    <div class="home-inner-box token-green"></div>
                </div>`;
            } else if (row === 10 && col === 10) {
                // Blue Home (Bottom Right - Sirf dikhne ke liye non-functional tokens)
                boardGrid.innerHTML += `<div class="home-box border-blue">
                    <div class="home-inner-box token-blue"></div>
                    <div class="home-inner-box token-blue"></div>
                    <div class="home-inner-box token-blue"></div>
                    <div class="home-inner-box token-blue"></div>
                </div>`;
            } else if (row === 7 && col === 7) {
                // Center Box
                boardGrid.innerHTML += `<div class="center-box"></div>`;
            } else if ((row <= 6 && col <= 6) || (row <= 6 && col >= 10) || (row >= 10 && col <= 6) || (row >= 10 && col >= 10) || (row >= 7 && row <= 9 && col >= 7 && col <= 9)) {
                continue; 
            } else {
                // Path Cells
                boardGrid.innerHTML += `<div class="cell" id="cell-${row}-${col}" onclick="handleTokenClick(this.id)"></div>`;
            }
        }
    }
}


function startGame(mode) {
    gameMode = mode;
    activeTurn = 1;
    isLocked = false;
    awaitingMove = false;
    
    p1Tokens = [0,1,2,3].map(id => ({id: id, state: 'home', step: 0}));
    p2Tokens = [0,1,2,3].map(id => ({id: id, state: 'home', step: 0}));

    document.getElementById('main-menu-screen').classList.remove('active');
    document.getElementById('game-screen').classList.add('active');
    
    if (mode === 'computer') {
        // Computer label reversed UI format update
        document.getElementById('p2-label').innerText = "🤖 Computer"; 
        document.getElementById('p2-btn').style.display = 'none';
    } else {
        document.getElementById('p2-label').innerText = "Player 2";
        document.getElementById('p2-btn').style.display = 'block';
    }
    
    createLudoBoardUI();
    updateBoardVisuals();
    setTurnUI();
}

function exitGame() {
    document.getElementById('game-screen').classList.remove('active');
    document.getElementById('main-menu-screen').classList.add('active');
}

function setTurnUI() {
    document.getElementById('p1-dice').innerText = "-";
    document.getElementById('p2-dice').innerText = "-";

    if (activeTurn === 1) {
        document.getElementById('player1-panel').classList.add('active-turn');
        document.getElementById('player2-panel').classList.remove('active-turn');
        document.getElementById('p1-btn').disabled = false;
        document.getElementById('p2-btn').disabled = true;
    } else {
        document.getElementById('player2-panel').classList.add('active-turn');
        document.getElementById('player1-panel').classList.remove('active-turn');
        document.getElementById('p1-btn').disabled = true;
        document.getElementById('p2-btn').disabled = (gameMode === 'computer');
    }
}

function updateBoardVisuals() {
    document.querySelectorAll('.cell, .home-inner-box').forEach(el => {
        el.classList.remove('token-yellow', 'token-red', 'glow-yellow', 'glow-red', 'clickable');
    });

    p1Tokens.forEach(t => {
        if (t.state === 'home') document.getElementById(`p1-home-${t.id}`).classList.add('token-yellow');
        else if (t.state === 'path') {
            let pathIdx = (43 + t.step) % 52; // Yellow Track starts at index 43 (cell-9-2)
            document.getElementById(commonPath[pathIdx]).classList.add('token-yellow');
        }
    });

    p2Tokens.forEach(t => {
        if (t.state === 'home') document.getElementById(`p2-home-${t.id}`).classList.add('token-red');
        else if (t.state === 'path') {
            let pathIdx = (4 + t.step) % 52; // Red Track starts at index 4 (cell-2-7)
            document.getElementById(commonPath[pathIdx]).classList.add('token-red');
        }
    });
}

function handleRoll(player) {
    if (isLocked || activeTurn !== player) return;

    playDiceSound(); // <--- आवाज़ यहाँ प्ले होगी

    currentRoll = Math.floor(Math.random() * 6) + 1;
    document.getElementById(`p${player}-dice`).innerText = currentRoll;
    
    isLocked = true; 
    document.getElementById(`p${player}-btn`).disabled = true;

    checkMovableTokens();
}

function checkMovableTokens() {
    let hasMovable = false;
    let tokens = activeTurn === 1 ? p1Tokens : p2Tokens;
    let playerPrefix = activeTurn === 1 ? 'p1' : 'p2';
    let startIndex = activeTurn === 1 ? 43 : 4;
    let glowClass = activeTurn === 1 ? 'glow-yellow' : 'glow-red';

    tokens.forEach(t => {
        if (t.state === 'home' && currentRoll === 6) {
            document.getElementById(`${playerPrefix}-home-${t.id}`).classList.add(glowClass, 'clickable');
            hasMovable = true;
        } else if (t.state === 'path' && t.step + currentRoll <= 52) {
            let pathIdx = (startIndex + t.step) % 52;
            document.getElementById(commonPath[pathIdx]).classList.add(glowClass, 'clickable');
            hasMovable = true;
        }
    });

    if (hasMovable) {
        awaitingMove = true; 
    } else {
        setTimeout(finalizeTurn, 1000); // 6 आने पर भी कोई मूव ना होने पर टर्न पास कर देगा
    }
}

function handleTokenClick(elementId) {
    if (!awaitingMove) return;

    let clickedToken = null;
    let tokens = activeTurn === 1 ? p1Tokens : p2Tokens;
    let playerPrefix = activeTurn === 1 ? 'p1' : 'p2';
    let startIndex = activeTurn === 1 ? 43 : 4;

    for (let t of tokens) {
        if (t.state === 'home' && currentRoll === 6 && elementId === `${playerPrefix}-home-${t.id}`) {
            clickedToken = t; break;
        }
        if (t.state === 'path' && t.step + currentRoll <= 52) {
            let pathIdx = (startIndex + t.step) % 52;
            if (elementId === commonPath[pathIdx]) {
                clickedToken = t; break;
            }
        }
    }

    if (!clickedToken) return;

    if (clickedToken.state === 'home') {
        clickedToken.state = 'path';
        clickedToken.step = 0; 
    } else {
        clickedToken.step += currentRoll;
        if (clickedToken.step >= 52) {
            clickedToken.state = 'finished'; 
        }
    }

    awaitingMove = false;
    updateBoardVisuals();
    checkWinCondition();
    
    setTimeout(finalizeTurn, 500);
}

function finalizeTurn() {
    isLocked = false;
    
    if (currentRoll !== 6) {
        activeTurn = activeTurn === 1 ? 2 : 1;
    }
    
    setTurnUI();

    if (activeTurn === 2 && gameMode === 'computer') {
        runComputerTurn();
    }
}

function checkWinCondition() {
    if (p1Tokens.every(t => t.state === 'finished')) {
        alert(document.getElementById('p1-label').innerText + " Wins! 🎉");
        exitGame();
    } else if (p2Tokens.every(t => t.state === 'finished')) {
        alert("Player 2 Wins! 🎉");
        exitGame();
    }
}

function runComputerTurn() {
    isLocked = true;
    document.getElementById('p2-dice').innerText = "🎲";

    setTimeout(() => {
        playDiceSound(); // <--- कंप्यूटर के रोल करते समय आवाज़ यहाँ प्ले होगी
        
        currentRoll = Math.floor(Math.random() * 6) + 1;
        document.getElementById('p2-dice').innerText = currentRoll;

        let movableTokens = p2Tokens.filter(t => 
            (t.state === 'home' && currentRoll === 6) || 
            (t.state === 'path' && t.step + currentRoll <= 52)
        );

        if (movableTokens.length > 0) {
            let tokenToMove = movableTokens.find(t => t.state === 'home') || movableTokens[0];

            setTimeout(() => {
                if (tokenToMove.state === 'home') {
                    tokenToMove.state = 'path';
                    tokenToMove.step = 0;
                } else {
                    tokenToMove.step += currentRoll;
                    if (tokenToMove.step >= 52) tokenToMove.state = 'finished';
                }
                updateBoardVisuals();
                checkWinCondition();
                setTimeout(finalizeTurn, 800);
            }, 1000);
        } else {
            setTimeout(finalizeTurn, 1000);
        }
    }, 1000);
}
