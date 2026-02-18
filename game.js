const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const info = document.getElementById("info");

let player = { x: 5, y: 5 };
let mode = "map"; // map | battle
let enemyHP = 10;

function drawMap() {
  ctx.fillStyle = "#88c070";
  ctx.fillRect(0, 0, 320, 320);

  ctx.fillStyle = "#000";
  ctx.fillRect(player.x * 32, player.y * 32, 32, 32);
}

function drawBattle() {
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, 320, 320);

  ctx.fillStyle = "#000";
  ctx.fillText("A wild MON appeared!", 50, 80);
  ctx.fillText("Enemy HP: " + enemyHP, 50, 120);
  ctx.fillText("[ CLICK TO ATTACK ]", 50, 180);
}

function render() {
  ctx.clearRect(0, 0, 320, 320);
  ctx.font = "14px monospace";

  if (mode === "map") drawMap();
  else drawBattle();
}

document.addEventListener("keydown", (e) => {
  if (mode !== "map") return;

  if (e.key === "ArrowUp") player.y--;
  if (e.key === "ArrowDown") player.y++;
  if (e.key === "ArrowLeft") player.x--;
  if (e.key === "ArrowRight") player.x++;

  player.x = Math.max(0, Math.min(9, player.x));
  player.y = Math.max(0, Math.min(9, player.y));

  if (Math.random() < 0.1) {
    mode = "battle";
    info.textContent = "Battle!";
  }
});

canvas.addEventListener("click", () => {
  if (mode !== "battle") return;

  enemyHP -= Math.floor(Math.random() * 4) + 1;

  if (enemyHP <= 0) {
    info.textContent = "You won. Adventure continues.";
    enemyHP = 10;
    mode = "map";
  }
});

setInterval(render, 100);
