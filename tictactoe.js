// --- AUDIO GENERATOR (No files needed!) ---
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
let masterGain = audioCtx.createGain();
masterGain.connect(audioCtx.destination);
masterGain.gain.value = 0.5; // Default volume

function playSound(freq, type, duration) {
    const oscillator = audioCtx.createOscillator();
    oscillator.type = type; // "sine", "square", "triangle"
    oscillator.frequency.setValueAtTime(freq, audioCtx.currentTime);
    oscillator.connect(masterGain);
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + duration);
}

// --- GAME ELEMENTS ---
const setupScreen = document.getElementById('setupScreen');
const gameScreen = document.getElementById('gameScreen');
const startBtn = document.getElementById('startBtn');
const backBtn = document.getElementById('backBtn');
const settingsModal = document.getElementById('settingsModal');
const openSettingsBtn = document.getElementById('openSettingsBtn');
const closeSettingsBtn = document.getElementById('closeSettingsBtn');
const volumeSlider = document.getElementById('volumeSlider');
const volumeValueDisplay = document.getElementById('volumeValue');

const cells = document.querySelectorAll('.cell');
const statusText = document.getElementById('status');
const resetBtn = document.getElementById('resetBtn');

// --- GAME VARIABLES ---
let board = ["", "", "", "", "", "", "", "", ""];
let currentPlayer = "X";
let running = false;
let isComputerThinking = false;
let player1Name = "Player 1", player2Name = "Player 2";
let score1 = 0, score2 = 0;
let playAgainstComputer = false;

// --- SETTINGS MODAL LOGIC ---
openSettingsBtn.addEventListener('click', () => settingsModal.style.display = "block");
closeSettingsBtn.addEventListener('click', () => settingsModal.style.display = "none");

volumeSlider.addEventListener('input', (e) => {
    let vol = parseFloat(e.target.value);
    masterGain.gain.value = vol;
    volumeValueDisplay.textContent = Math.round(vol * 100) + "%";
});

// --- SCREEN NAVIGATION LOGIC ---

// Start Game Button
startBtn.addEventListener('click', () => {
    player1Name = document.getElementById('p1Name').value || "Player 1";
    playAgainstComputer = document.getElementById('vsComputer').checked;
    player2Name = playAgainstComputer ? "Computer" : (document.getElementById('p2Name').value || "Player 2");
    
    document.getElementById('name1Display').textContent = player1Name;
    document.getElementById('name2Display').textContent = player2Name;
    
    setupScreen.style.display = "none";
    gameScreen.style.display = "block";
    initializeGame();
});

// Back to Menu Button
backBtn.addEventListener('click', () => {
    gameScreen.style.display = "none";
    setupScreen.style.display = "block";
    score1 = 0; 
    score2 = 0; 
    document.getElementById('score1').textContent = score1;
    document.getElementById('score2').textContent = score2;
});

// --- MAIN GAME LOGIC ---
function initializeGame() {
    cells.forEach(c => { 
        c.addEventListener('click', cellClicked); 
        c.textContent = ""; 
        c.classList.remove('win-highlight', 'pop'); 
    });
    resetBtn.addEventListener('click', () => initializeGame());
    board = ["", "", "", "", "", "", "", "", ""];
    currentPlayer = "X";
    running = true;
    statusText.textContent = `${currentPlayer === "X" ? player1Name : player2Name}'s turn`;
}

function cellClicked() {
    const idx = this.getAttribute('data-index');
    if (board[idx] !== "" || !running || isComputerThinking) return;
    
    // Play Click Sound
    playSound(440, 'sine', 0.1); 
    
    board[idx] = currentPlayer;
    this.textContent = currentPlayer;
    this.classList.add('pop');
    checkWinner();
}

function checkWinner() {
    const winConditions = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
    let roundWon = false;
    
    for(let cond of winConditions) {
        if(board[cond[0]] && board[cond[0]] === board[cond[1]] && board[cond[1]] === board[cond[2]]) {
            roundWon = true;
            cond.forEach(i => document.querySelector(`.cell[data-index="${i}"]`).classList.add('win-highlight'));
            break;
        }
    }
    
    if(roundWon) {
        statusText.textContent = `${currentPlayer === "X" ? player1Name : player2Name} Wins! 🎉`;
        running = false;
        
        // Play Win Sound
        playSound(587.33, 'triangle', 0.2); 
        setTimeout(() => playSound(880, 'sine', 0.4), 150); 
        
        currentPlayer === "X" ? score1++ : score2++;
        document.getElementById('score1').textContent = score1;
        document.getElementById('score2').textContent = score2;
    } else if(!board.includes("")) {
        statusText.textContent = "Draw! 🤝";
        running = false;
    } else {
        currentPlayer = currentPlayer === "X" ? "O" : "X";
        statusText.textContent = `${currentPlayer === "X" ? player1Name : player2Name}'s turn`;
        
        // Computer AI Turn
        if(playAgainstComputer && currentPlayer === "O") {
            isComputerThinking = true;
            setTimeout(() => {
                let empty = board.map((v,i) => v === "" ? i : null).filter(v => v !== null);
                if (empty.length > 0) {
                    let choice = empty[Math.floor(Math.random() * empty.length)];
                    
                    // FIXED: Computer click karne se pehle lock kholega
                    isComputerThinking = false; 
                    document.querySelector(`.cell[data-index="${choice}"]`).click();
                }
            }, 600);
        }
    }
}
