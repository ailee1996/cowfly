const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// ===== RESPONSIVE CANVAS =====
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // scaling ukuran burung & pipa berdasarkan layar
    bird.width = canvas.width * 0.1;   // 10% lebar layar
    bird.height = canvas.height * 0.06; // 6% tinggi layar
    pipeWidth = canvas.width * 0.12;   // pipa 12% lebar layar
    pipeGap = canvas.height * 0.25;    // jarak atas-bawah antar pipa
}
window.addEventListener("resize", resizeCanvas);

// ===== LOAD IMAGES =====
const birdImg = new Image();
birdImg.src = 'images/bird_flap.png';
const bgImg = new Image();
bgImg.src = 'images/background.png';

// ===== GAME VARIABLES =====
let bird = { x: 50, y: 300, width: 40, height: 30, gravity: 0.6, lift: -12, velocity: 0 };
let pipes = [];
let frame = 0;
let score = 0;
let flapFrame = 0;
let gameStarted = false;
let isPaused = false;

let pipeWidth = 60;
let pipeGap = 150;

// ===== USERNAME & HIGHSCORE =====
let username = "Player"; // default langsung Player
let highscore = 0;

// ===== HELPER FUNCTIONS =====
function saveScoreToLeaderboard(username, score) {
    let leaderboard = JSON.parse(localStorage.getItem("flappyLeaderboard")) || {};
    if(!leaderboard[username] || score > leaderboard[username]) {
        leaderboard[username] = score;
    }
    localStorage.setItem("flappyLeaderboard", JSON.stringify(leaderboard));
}

function getTopLeaderboard(n = 5) {
    let leaderboard = JSON.parse(localStorage.getItem("flappyLeaderboard")) || {};
    let arr = Object.entries(leaderboard);
    arr.sort((a,b) => b[1]-a[1]);
    return arr.slice(0,n);
}

// ===== DRAW FUNCTIONS =====
function drawBackground() { ctx.drawImage(bgImg, 0, 0, canvas.width, canvas.height); }
function drawBird() {
    const frameX = flapFrame * bird.width;
    ctx.drawImage(birdImg, frameX, 0, bird.width, bird.height, bird.x, bird.y, bird.width, bird.height);
}
function drawPipes() {
    ctx.fillStyle = "green";
    for (let pipe of pipes) {
        ctx.fillRect(pipe.x, 0, pipeWidth, pipe.top);
        ctx.fillRect(pipe.x, canvas.height - pipe.bottom, pipeWidth, pipe.bottom);
    }
}
function drawScore() {
    ctx.fillStyle = "white";
    ctx.font = Math.floor(canvas.width/12) + "px Arial";
    ctx.textAlign = "left";
    ctx.fillText("Score: " + score, 20, 50);
    ctx.fillText("Highscore: " + highscore, 20, 100);
}
function drawGameOverScreen() {
    ctx.fillStyle = "rgba(0,0,0,0.5)";
    ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.fillStyle = "white";
    ctx.font = Math.floor(canvas.width/7) + "px Arial";
    ctx.textAlign = "center";
    ctx.fillText("GAME OVER", canvas.width/2, canvas.height/2-60);
    ctx.font = Math.floor(canvas.width/14) + "px Arial";
    ctx.fillText("Score: " + score, canvas.width/2, canvas.height/2);
    ctx.fillText("Tap to Restart", canvas.width/2, canvas.height/2+60);
    drawLeaderboard();
}
function drawLeaderboard() {
    const top = getTopLeaderboard();
    ctx.fillStyle = "white";
    ctx.font = Math.floor(canvas.width/15) + "px Arial";
    ctx.textAlign = "center";
    ctx.fillText("LEADERBOARD", canvas.width/2, canvas.height/2 + 120);
    for(let i=0; i<top.length; i++) {
        const [name, sc] = top[i];
        ctx.fillText(`${i+1}. ${name} - ${sc}`, canvas.width/2, canvas.height/2 + 160 + i*40);
    }
}

// ===== GAME LOGIC =====
function updatePipes() {
    if(frame % 100 === 0) {
        let top = Math.random() * (canvas.height/2);
        let bottom = canvas.height - top - pipeGap;
        pipes.push({ x: canvas.width, top, bottom });
    }
    for(let pipe of pipes) pipe.x -= canvas.width * 0.006; // speed relatif layar
    pipes = pipes.filter(pipe => pipe.x + pipeWidth > 0);
}
function checkCollision() {
    for(let pipe of pipes) {
        if(bird.x < pipe.x + pipeWidth && bird.x + bird.width > pipe.x &&
           (bird.y < pipe.top || bird.y + bird.height > canvas.height - pipe.bottom)) gameOver();
    }
    if(bird.y + bird.height > canvas.height || bird.y < 0) gameOver();
}
function resetGame() {
    bird.x = canvas.width * 0.15;
    bird.y = canvas.height/2;
    bird.velocity = 0;
    pipes = [];
    frame = 0;
    score = 0;
    flapFrame = 0;
    gameStarted = true;
    isPaused = false;
    highscore = localStorage.getItem(username + "_highscore") || 0;
}
function gameOver() {
    saveScoreToLeaderboard(username, score);
    if(score > highscore) {
        highscore = score;
        localStorage.setItem(username + "_highscore", highscore);
        alert("New Highscore: " + score);
    }
    drawGameOverScreen();
    gameStarted = false;
    isPaused = false;
}

// ===== INPUT =====
function flap() {
    if(gameStarted && !isPaused) bird.velocity = bird.lift;
    else if(!gameStarted) resetGame();
}

// Keyboard
document.addEventListener("keydown", e => {
    if(e.code === "Space") flap();
    if(e.code === "KeyP") isPaused = !isPaused;
});

// Touch input
canvas.addEventListener("touchstart", e => {
    e.preventDefault();
    flap();
});

// ===== MAIN LOOP =====
function update() {
    drawBackground();

    if(gameStarted && !isPaused) {
        bird.velocity += bird.gravity;
        bird.y += bird.velocity;

        updatePipes();
        checkCollision();

        frame++;
        score = Math.floor(frame/15);

        if(frame % 5 === 0) flapFrame = (flapFrame+1)%3;
    }

    drawPipes();
    drawBird();
    drawScore();

    if(!gameStarted) drawGameOverScreen();
    if(isPaused) {
        ctx.fillStyle = "rgba(0,0,0,0.5)";
        ctx.fillRect(0,0,canvas.width,canvas.height);
        ctx.fillStyle = "white";
        ctx.font = Math.floor(canvas.width/7) + "px Arial";
        ctx.textAlign = "center";
        ctx.fillText("PAUSED", canvas.width/2, canvas.height/2);
    }

    requestAnimationFrame(update);
}

// ===== START GAME SETUP =====
birdImg.onload = () => {
    bgImg.onload = () => {
        resizeCanvas();
        resetGame(); // langsung mulai tanpa popup
        update();
    };
};
