const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Responsive ukuran canvas
function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener("resize", resizeCanvas);

// Popup username
let username = "";
const popupDiv = document.getElementById("usernamePopup");
const usernameInput = document.getElementById("usernameInput");
const startBtn = document.getElementById("startBtn");

startBtn.addEventListener("click", () => {
  username = usernameInput.value.trim();
  if (username) {
    localStorage.setItem("flappyUsername", username);
    popupDiv.style.display = "none";
    resetGame();
    requestAnimationFrame(gameLoop);
  }
});

// Cek kalau udah pernah isi
window.addEventListener("load", () => {
  username = localStorage.getItem("flappyUsername") || "";
  if (username) {
    popupDiv.style.display = "none";
    resetGame();
    requestAnimationFrame(gameLoop);
  }
});

// Load assets
const birdImg = new Image();
birdImg.src = "assets/bird.png"; // sprite sheet 3 frame
const bgImg = new Image();
bgImg.src = "assets/background.png";
const pipeImg = new Image();
pipeImg.src = "assets/pipe.png";

// Game vars
let bird = { x: 100, y: 200, w: 40, h: 30, vy: 0, frame: 0 };
let gravity = 0.5, jump = -8;
let pipes = [];
let frameCount = 0;
let score = 0;
let highscore = parseInt(localStorage.getItem("highscore")) || 0;
let leaderboard = JSON.parse(localStorage.getItem("leaderboard") || "[]");
let gameOver = false;

// Reset game
function resetGame() {
  bird.y = canvas.height / 2;
  bird.vy = 0;
  pipes = [];
  frameCount = 0;
  score = 0;
  gameOver = false;
}

// Input
document.addEventListener("keydown", e => {
  if (e.code === "Space") bird.vy = jump;
});
canvas.addEventListener("click", () => {
  bird.vy = jump;
});

// Update
function update() {
  bird.vy += gravity;
  bird.y += bird.vy;

  // Animasi sayap
  if (frameCount % 6 === 0) bird.frame = (bird.frame + 1) % 3;

  // Pipes
  if (frameCount % 90 === 0) {
    let gap = 150;
    let top = Math.random() * (canvas.height - gap - 200) + 50;
    pipes.push({ x: canvas.width, top, gap });
  }
  pipes.forEach(p => p.x -= 3);

  // Cek tabrakan
  for (let p of pipes) {
    if (
      bird.x < p.x + 60 &&
      bird.x + bird.w > p.x &&
      (bird.y < p.top || bird.y + bird.h > p.top + p.gap)
    ) {
      endGame();
    }
    if (p.x + 60 === bird.x) score++;
  }

  // Tanah/atas
  if (bird.y + bird.h > canvas.height || bird.y < 0) {
    endGame();
  }

  frameCount++;
}

// Gambar
function draw() {
  ctx.drawImage(bgImg, 0, 0, canvas.width, canvas.height);

  // Pipes
  pipes.forEach(p => {
    ctx.drawImage(pipeImg, p.x, 0, 60, p.top);
    ctx.drawImage(pipeImg, p.x, p.top + p.gap, 60, canvas.height - (p.top + p.gap));
  });

  // Bird
  let frameW = birdImg.width / 3;
  ctx.drawImage(
    birdImg,
    frameW * bird.frame, 0, frameW, birdImg.height,
    bird.x, bird.y, bird.w, bird.h
  );

  // Score
  ctx.fillStyle = "white";
  ctx.font = "24px Arial";
  ctx.fillText("Score: " + score, 20, 40);
  ctx.fillText("Highscore: " + highscore, 20, 70);
  ctx.fillText("User: " + username, 20, 100);
}

// End game
function endGame() {
  if (gameOver) return;
  gameOver = true;

  if (score > highscore) {
    highscore = score;
    localStorage.setItem("highscore", highscore);
  }

  leaderboard.push({ user: username, score });
  leaderboard.sort((a, b) => b.score - a.score);
  leaderboard = leaderboard.slice(0, 5);
  localStorage.setItem("leaderboard", JSON.stringify(leaderboard));

  setTimeout(() => {
    alert("Game Over!\nScore: " + score + "\nHighscore: " + highscore +
      "\nLeaderboard:\n" +
      leaderboard.map((e, i) => `${i+1}. ${e.user} - ${e.score}`).join("\n")
    );
    resetGame();
  }, 100);
}

// Loop
function gameLoop() {
  if (!gameOver) {
    update();
    draw();
    requestAnimationFrame(gameLoop);
  }
}
