const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// ===== RESPONSIVE CANVAS =====
function resizeCanvas() {
    canvas.width = window.innerWidth > 400 ? 400 : window.innerWidth;
    canvas.height = window.innerHeight > 700 ? 700 : window.innerHeight;
}
window.addEventListener("resize", resizeCanvas);
resizeCanvas();

// ===== LOAD IMAGES =====
const birdImg = new Image();
birdImg.src = 'images/bird_flap.png';
const bgImg = new Image();
bgImg.src = 'images/background.png';

// ===== GAME VARIABLES =====
let bird = { x: 50, y: 300, width: 40, height: 30, gravity: 0.6, lift: -10, velocity: 0 };
let pipes = [];
let frame = 0;
let score = 0;
let flapFrame = 0;
let gameStarted = false;
let isPaused = false;

// ===== USERNAME & HIGHSCORE =====
let username = "";
let highscore = 0;
let showUsernamePopup = true;

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
        ctx.fillRect(pipe.x, 0, pipe.width, pipe.top);
        ctx.fillRect(pipe.x, canvas.height - pipe.bottom, pipe.width, pipe.bottom);
    }
}
function drawScore() {
    ctx.fillStyle = "white";
    ctx.font = Math.floor(canvas.width/15) + "px Arial";
    ctx.textAlign = "left";
    ctx.fillText(username + " Score: " + score, 10, 30);
    ctx.fillText("Highscore: " + highscore, 10, 60);
}
function drawGameOverScreen() {
    ctx.fillStyle = "rgba(0,0,0,0.5)";
    ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.fillStyle = "white";
    ctx.font = Math.floor(canvas.width/10) + "px Arial";
    ctx.textAlign = "center";
    ctx.fillText("GAME OVER", canvas.width/2, canvas.height/2-40);
    ctx.font = Math.floor(canvas.width/20) + "px Arial";
    ctx.fillText(username + " Score: " + score, canvas.width/2, canvas.height/2);
    ctx.fillText("Tap to Restart", canvas.width/2, canvas.height/2+40);
    drawLeaderboard();
}
function drawLeaderboard() {
    const top = getTopLeaderboard();
    ctx.fillStyle = "white";
    ctx.font = Math.floor(canvas.width/20) + "px Arial";
    ctx.textAlign = "center";
    ctx.fillText("LEADERBOARD", canvas.width/2, canvas.height/2 + 100);
    for(let i=0; i<top.length; i++) {
        const [name, sc] = top[i];
        ctx.fillText(`${i+1}. ${name} - ${sc}`, canvas.width/2, canvas.height/2 + 140 + i*25);
    }
}
function drawUsernamePopup() {
    ctx.fillStyle = "rgba(0,0,0,0.7)";
    ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.fillStyle = "white";
    ctx.font = Math.floor(canvas.width/12) + "px Arial";
    ctx.textAlign = "center";
    ctx.fillText("Enter Username:", canvas.width/2, canvas.height/2 - 20);
    ctx.strokeStyle = "white";
    ctx.lineWidth = 2;
    ctx.strokeRect(canvas.width/2 - 100, canvas.height/2, 200, 40);
    if(username) ctx.fillText(username, canvas.width/2, canvas.height/2 + 30);
}

// ===== GAME LOGIC =====
function updatePipes() {
    if(frame % 100 === 0) {
        let top = Math.random() * (canvas.height/2);
        let bottom = canvas.height - top - 150;
        pipes.push({ x: canvas.width, width:50, top, bottom });
    }
    for(let pipe of pipes) pipe.x -= 2.5;
    pipes = pipes.filter(pipe => pipe.x + pipe.width > 0);
}
function checkCollision() {
    for(let pipe of pipes) {
        if(bird.x < pipe.x + pipe.width && bird.x + bird.width > pipe.x &&
           (bird.y < pipe.top || bird.y + bird.height > canvas.height - pipe.bottom)) gameOver();
    }
    if(bird.y + bird.height > canvas.height || bird.y < 0) gameOver();
}
function resetGame() {
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
    else if(!gameStarted && username) resetGame();
}

// Keyboard
document.addEventListener("keydown", e => {
    if(showUsernamePopup) {
        if(e.key.length === 1 && username.length < 10) username += e.key;
        if(e.key === "Backspace") username = username.slice(0,-1);
        if(e.key === "Enter" && username) {
            showUsernamePopup = false;
            localStorage.setItem("flappyUsername", username);
            resetGame();
        }
    } else {
        if(e.code === "Space") flap();
        if(e.code === "KeyP") isPaused = !isPaused;
    }
});

// Touch input
canvas.addEventListener("touchstart", e => {
    e.preventDefault();
    if(showUsernamePopup && username) {
        showUsernamePopup = false;
        localStorage.setItem("flappyUsername", username);
        resetGame();
    } else flap();
});

// ===== MAIN LOOP =====
function update() {
    drawBackground();

    if(showUsernamePopup) drawUsernamePopup();
    else {
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
            ctx.font = Math.floor(canvas.width/10) + "px Arial";
            ctx.textAlign = "center";
            ctx.fillText("PAUSED", canvas.width/2, canvas.height/2);
        }
    }

    requestAnimationFrame(update);
}

// ===== START GAME SETUP =====
birdImg.onload = () => {
    bgImg.onload = () => {
        username = localStorage.getItem("flappyUsername") || "";
        showUsernamePopup = !username;
        if(!showUsernamePopup) resetGame();
        update();
    };
};
