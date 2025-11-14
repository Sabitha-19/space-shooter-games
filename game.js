// -------------------------------
// CANVAS SETUP
// -------------------------------
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// -------------------------------
// SOUNDS
// -------------------------------
let sounds = {
  shoot: new Audio("sounds/shoot.mp3"),
  explosion: new Audio("sounds/explosion.mp3"),
  pickup: new Audio("sounds/pickup.mp3"),
  start: new Audio("sounds/start.mp3"),
  gameover: new Audio("sounds/gameover.mp3"),
  bgm: new Audio("sounds/bgm.mp3")
};

sounds.bgm.loop = true;
sounds.bgm.volume = 0.3;
let isMuted = false;

// -------------------------------
// GAME VARIABLES
// -------------------------------
let player = {
  x: canvas.width / 2,
  y: canvas.height - 80,
  w: 40,
  h: 40,
  speed: 6
};

let bullets = [];
let enemies = [];
let enemyBullets = [];
let powerUps = [];
let boss = null;

let score = 0;
let lives = 3;

let tripleShot = false;
let shield = false;
let powerTimer = 0;

// -------------------------------
// INPUT
// -------------------------------
let keys = {};

document.addEventListener("keydown", e => keys[e.key] = true);
document.addEventListener("keyup", e => keys[e.key] = false);

// -------------------------------
// MUTE BUTTON
// -------------------------------
document.getElementById("muteBtn").onclick = () => {
  isMuted = !isMuted;
  document.getElementById("muteBtn").textContent = isMuted ? "🔈" : "🔊";
  if (isMuted) sounds.bgm.pause();
  else sounds.bgm.play();
};

// -------------------------------
// PLAYER SHOOT
// -------------------------------
function shoot() {
  if (!isMuted) sounds.shoot.cloneNode(true).play();

  if (tripleShot) {
    bullets.push({ x: player.x, y: player.y, dy: -8 });
    bullets.push({ x: player.x - 15, y: player.y, dy: -8 });
    bullets.push({ x: player.x + 15, y: player.y, dy: -8 });
  } else {
    bullets.push({ x: player.x, y: player.y, dy: -8 });
  }
}

setInterval(shoot, 400);

// -------------------------------
// SPAWN ENEMIES
// -------------------------------
setInterval(() => {
  enemies.push({
    x: Math.random() * (canvas.width - 40),
    y: -40,
    w: 35,
    h: 35,
    hp: 1
  });

  // Chance to drop power-up
  if (Math.random() < 0.10) {
    powerUps.push({
      x: Math.random() * canvas.width,
      y: -20,
      type: Math.random() < 0.5 ? "triple" : "shield"
    });
  }
}, 700);

// -------------------------------
// SPAWN BOSS
// -------------------------------
function spawnBoss() {
  if (!boss && score >= 200) {
    boss = {
      x: canvas.width / 2,
      y: 60,
      w: 120,
      h: 60,
      hp: 30,
      dir: 1
    };
  }
}

// -------------------------------
// GAME LOOP
// -------------------------------
function update() {

  spawnBoss();

  // MOVEMENT
  if (keys["ArrowLeft"]) player.x -= player.speed;
  if (keys["ArrowRight"]) player.x += player.speed;

  // LIMIT BOUNDS
  player.x = Math.max(0, Math.min(canvas.width, player.x));

  // BULLET MOVEMENT
  bullets.forEach(b => b.y += b.dy);
  bullets = bullets.filter(b => b.y > 0);

  // ENEMY MOVEMENT
  enemies.forEach(e => e.y += 2);
  enemies = enemies.filter(e => e.y < canvas.height);

  // ENEMY SHOOT
  enemies.forEach(e => {
    if (Math.random() < 0.01) {
      enemyBullets.push({ x: e.x, y: e.y, dy: 4 });
    }
  });

  // ENEMY BULLET MOVEMENT
  enemyBullets.forEach(b => b.y += b.dy);
  enemyBullets = enemyBullets.filter(b => b.y < canvas.height);

  // BOSS MOVEMENT
  if (boss) {
    boss.x += 3 * boss.dir;
    if (boss.x < 0 || boss.x + boss.w > canvas.width) boss.dir *= -1;

    if (Math.random() < 0.03) {
      enemyBullets.push({
        x: boss.x + boss.w / 2,
        y: boss.y,
        dy: 5
      });
    }
  }

  // BULLET → ENEMY COLLISION
  bullets.forEach((b, i) => {
    enemies.forEach((e, j) => {
      if (
        b.x > e.x && b.x < e.x + e.w &&
        b.y > e.y && b.y < e.y + e.h
      ) {
        enemies.splice(j, 1);
        bullets.splice(i, 1);
        score += 10;
        if (!isMuted) sounds.explosion.cloneNode(true).play();
      }
    });
  });

  // BULLET → BOSS COLLISION
  if (boss) {
    bullets.forEach((b, i) => {
      if (
        b.x > boss.x && b.x < boss.x + boss.w &&
        b.y > boss.y && b.y < boss.y + boss.h
      ) {
        boss.hp--;
        bullets.splice(i, 1);

        if (!isMuted) sounds.explosion.cloneNode(true).play();

        if (boss.hp <= 0) {
          score += 200;
          boss = null;
        }
      }
    });
  }

  // PLAYER HIT BY BULLET
  enemyBullets.forEach((b, i) => {
    if (
      Math.abs(b.x - player.x) < 20 &&
      Math.abs(b.y - player.y) < 20
    ) {
      if (shield) {
        shield = false;
      } else {
        lives--;
      }
      enemyBullets.splice(i, 1);

      if (lives <= 0) {
        if (!isMuted) sounds.gameover.play();
        alert("GAME OVER!\nScore: " + score);
        document.location.reload();
      }
    }
  });

  // POWER-UP PICKUP
  powerUps.forEach((p, i) => {
    if (Math.hypot(player.x - p.x, player.y - p.y) < 30) {

      if (!isMuted) sounds.pickup.play();

      if (p.type === "triple") tripleShot = true;
      if (p.type === "shield") shield = true;

      powerTimer = 500;
      powerUps.splice(i, 1);
    }
  });

  // POWER TIMER EXPIRE
  if (powerTimer > 0) {
    powerTimer--;
    if (powerTimer <= 0) {
      tripleShot = false;
      shield = false;
    }
  }

}

// -------------------------------
// DRAW
// -------------------------------
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // PLAYER
  ctx.fillStyle = "#7b61ff";
  ctx.beginPath();
  ctx.arc(player.x, player.y, 20, 0, Math.PI * 2);
  ctx.fill();

  // SHIELD
  if (shield) {
    ctx.strokeStyle = "#00eaff";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(player.x, player.y, 30, 0, Math.PI * 2);
    ctx.stroke();
  }

  // BULLETS
  ctx.fillStyle = "#fff7b0";
  bullets.forEach(b => {
    ctx.fillRect(b.x - 3, b.y, 6, 15);
  });

  // ENEMIES
  ctx.fillStyle = "#ff80d5";
  enemies.forEach(e => {
    ctx.fillRect(e.x, e.y, e.w, e.h);
  });

  // POWER-UPS
  powerUps.forEach(p => {
    ctx.fillStyle = p.type === "triple" ? "#ffdf70" : "#00ffff";
    ctx.beginPath();
    ctx.arc(p.x, p.y, 12, 0, Math.PI * 2);
    ctx.fill();
  });

  // BOSS
  if (boss) {
    ctx.fillStyle = "#ff3333";
    ctx.fillRect(boss.x, boss.y, boss.w, boss.h);
    ctx.fillStyle = "#fff";
    ctx.fillText("BOSS HP: " + boss.hp, boss.x, boss.y - 10);
  }

  // UI
  ctx.fillStyle = "#fff";
  ctx.font = "20px Arial";
  ctx.fillText("Score: " + score, 20, 40);
  ctx.fillText("Lives: " + lives, 20, 70);
}

// -------------------------------
// MAIN LOOP
// -------------------------------
function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}

// START GAME
sounds.start.play();
setTimeout(() => {
  if (!isMuted) sounds.bgm.play();
}, 2000);

loop();
