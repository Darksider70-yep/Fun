const box = document.getElementById("box");
const scoreEl = document.getElementById("score");
const statusEl = document.getElementById("status");
const levelEl = document.getElementById("level");

const grid = [0, 70, 140, 210, 280];

let score = 0;
let stability = 1;
let index = 0;
let pattern = [];
let nextPos = null;

function generatePattern() {
  pattern = [];
  for (let i = 0; i < 10; i++) {
    pattern.push({
      x: grid[(i * stability) % grid.length],
      y: grid[(i * (stability + 1)) % grid.length]
    });
  }
}

function show(pos, duration = 600) {
  box.style.left = pos.x + "px";
  box.style.top = pos.y + "px";
  box.style.display = "block";
  setTimeout(() => (box.style.display = "none"), duration);
}

function round() {
  const current = pattern[index % pattern.length];
  nextPos = pattern[(index + 1) % pattern.length];

  statusEl.textContent = "Observe.";
  show(current);

  setTimeout(() => {
    statusEl.textContent = "Predict.";
    box.style.display = "block";
    box.style.left = current.x + "px";
    box.style.top = current.y + "px";
  }, 700);
}

box.onclick = () => {
  const correct =
    box.style.left === nextPos.x + "px" &&
    box.style.top === nextPos.y + "px";

  box.style.display = "none";

  if (correct) {
    score++;
    index++;
    statusEl.textContent = "Correct.";
  } else {
    statusEl.textContent = "The pattern shifted.";
    score = 0;
    index = 0;
    stability++;
    generatePattern();
  }

  scoreEl.textContent = "Score: " + score;
  levelEl.textContent = "Stability: " + stability;

  setTimeout(round, 700);
};

generatePattern();
round();
