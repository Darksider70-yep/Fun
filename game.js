const box = document.getElementById("box");
const game = document.getElementById("game");
const scoreEl = document.getElementById("score");
const statusEl = document.getElementById("status");

let score = 0;
let lastPos = null;
let nextPos = null;

function randomPos() {
  const max = 270;
  return {
    x: Math.floor(Math.random() * max),
    y: Math.floor(Math.random() * max)
  };
}

function showBox(pos, duration = 600) {
  box.style.left = pos.x + "px";
  box.style.top = pos.y + "px";
  box.style.display = "block";
  setTimeout(() => (box.style.display = "none"), duration);
}

function nextRound() {
  lastPos = nextPos || randomPos();
  nextPos = randomPos();

  statusEl.textContent = "Observe.";
  showBox(lastPos);

  setTimeout(() => {
    statusEl.textContent = "Predict.";
    box.style.display = "block";
    box.style.left = lastPos.x + "px";
    box.style.top = lastPos.y + "px";
  }, 800);
}

box.onclick = () => {
  const correct =
    box.style.left === nextPos.x + "px" &&
    box.style.top === nextPos.y + "px";

  if (correct) {
    score++;
    statusEl.textContent = "Correct.";
  } else {
    statusEl.textContent = "Wrong. Pattern shifted.";
    score = 0;
  }

  scoreEl.textContent = "Score: " + score;
  box.style.display = "none";
  setTimeout(nextRound, 700);
};

nextRound();
