// ══════════════════════════════════════════════════════
//  POKéMON RED  –  game.js
//  Top-down RPG with overworld, battles, and dialog
// ══════════════════════════════════════════════════════

(function () {
  'use strict';

  // ─── CANVAS ───────────────────────────────────────────
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  // ─── PALETTE (GB Green) ───────────────────────────────
  const C = {
    bg:      '#9bbc0f',
    dark:    '#0f380f',
    mid:     '#306230',
    light:   '#8bac0f',
    white:   '#e0f8d0',
    red:     '#c0392b',
    path:    '#c8b560',
    water:   '#4878c8',
    waterL:  '#8aaaf0',
  };

  // ─── TILE TYPES ───────────────────────────────────────
  const T = {
    GRASS:  0,
    TALL:   1,   // wild encounter zone
    TREE:   2,
    PATH:   3,
    WATER:  4,
    HOUSE:  5,
    SIGN:   6,
    WALL:   7,
  };

  // ─── MAP (20×18 tiles, each tile = 8px on 160×144 canvas) ─
  const TILE_SIZE = 8;
  const MAP_W = 20, MAP_H = 18;

  // prettier-ignore
  const MAP = [
    2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,
    2,3,3,3,5,2,2,1,1,1,1,2,2,2,2,2,2,2,2,2,
    2,3,0,3,3,3,3,1,1,1,1,2,6,0,0,0,0,2,2,2,
    2,3,0,0,0,0,3,1,1,1,1,2,0,0,0,0,0,2,2,2,
    2,3,0,0,5,0,3,1,1,1,1,3,3,3,3,3,3,3,3,2,
    2,3,0,0,0,0,3,0,0,0,0,3,0,0,0,0,0,0,3,2,
    2,3,3,3,3,3,3,0,0,0,0,3,0,5,0,0,5,0,3,2,
    2,2,2,3,2,2,2,1,1,1,1,3,0,0,0,0,0,0,3,2,
    4,4,4,3,4,4,4,1,1,1,1,3,0,0,0,0,0,0,3,2,
    4,4,4,3,4,4,4,1,1,1,1,3,3,3,3,3,3,3,3,2,
    4,4,4,3,4,4,4,0,0,0,0,2,2,2,2,2,2,2,2,2,
    2,2,2,3,2,2,2,0,0,0,0,2,2,2,2,2,2,2,2,2,
    2,1,1,3,1,1,2,0,0,0,0,2,2,2,2,2,2,2,2,2,
    2,1,1,3,1,1,2,1,1,1,1,2,2,2,2,2,2,2,2,2,
    2,1,1,3,1,1,2,1,1,1,1,2,2,2,2,2,2,2,2,2,
    2,2,2,3,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,
    2,0,0,3,0,0,2,2,2,2,2,2,2,2,2,2,2,2,2,2,
    2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,
  ];

  // Signs content
  const SIGNS = {
    '2-12': 'PALLET TOWN\nA TRANQUIL SETTING\nOF RUSTIC PURSUIT',
    '12-2': 'ROUTE 1\nWILD POKéMON LIVE\nIN TALL GRASS!',
  };

  // ─── PLAYER ───────────────────────────────────────────
  const player = {
    x: 3, y: 3,         // tile position
    px: 3*8, py: 3*8,   // pixel position (for smooth movement)
    dir: 2,             // 0=up 1=right 2=down 3=left
    moving: false,
    moveTimer: 0,
    name: 'RED',
  };

  // ─── POKÉMON DATA ─────────────────────────────────────
  const POKEMON = {
    SQUIRTLE:  { name:'SQUIRTLE',  sprite:'🐢', type:'WATER', maxHp:20, moves:['TACKLE','WATER GUN','TAIL WHIP','GROWL'],   level:5 },
    BULBASAUR: { name:'BULBASAUR', sprite:'🌱', type:'GRASS',  maxHp:22, moves:['TACKLE','VINE WHIP','GROWL','LEECH SEED'], level:5 },
    CHARMANDER:{ name:'CHARMANDER',sprite:'🔥', type:'FIRE',   maxHp:18, moves:['SCRATCH','EMBER','GROWL','TAIL WHIP'],     level:5 },
    PIDGEY:    { name:'PIDGEY',    sprite:'🐦', type:'NORMAL', maxHp:14, moves:['TACKLE','GUST','SAND-ATTACK','QUICK ATK'], level:3 },
    RATTATA:   { name:'RATTATA',   sprite:'🐭', type:'NORMAL', maxHp:12, moves:['TACKLE','TAIL WHIP','QUICK ATK','BITE'],   level:2 },
    CATERPIE:  { name:'CATERPIE',  sprite:'🐛', type:'BUG',    maxHp:10, moves:['TACKLE','STRING SHOT'],                   level:2 },
    WEEDLE:    { name:'WEEDLE',    sprite:'🐝', type:'BUG',    maxHp:10, moves:['POISON STING','STRING SHOT'],              level:2 },
  };

  const MOVE_POWER = {
    'TACKLE':10,'WATER GUN':20,'VINE WHIP':18,'EMBER':20,'SCRATCH':10,
    'TAIL WHIP':0,'GROWL':0,'LEECH SEED':0,'SAND-ATTACK':0,'STRING SHOT':0,
    'GUST':16,'QUICK ATK':14,'BITE':18,'POISON STING':15,
  };

  const WILD_ENCOUNTERS = ['PIDGEY','RATTATA','CATERPIE','WEEDLE'];

  // ─── GAME STATE ───────────────────────────────────────
  let gameState = 'intro'; // intro | overworld | dialog | battle | menu | gameover
  let playerPokemon = null;
  let playerHp = 0;
  let enemyPokemon = null;
  let enemyHp = 0;
  let dialogQueue = [];
  let dialogCallback = null;
  let battleState = 'choose'; // choose | fight | anim | result | faint
  let selectedBattleOpt = 0;
  let selectedMoveOpt = 0;
  let selectedMenuOpt = 0;
  let cameraX = 0, cameraY = 0;
  let steps = 0;
  let wins = 0;
  let frameCount = 0;

  // ─── INPUT ────────────────────────────────────────────
  const keys = {};
  const keyMap = {
    'ArrowUp':'up','ArrowDown':'down','ArrowLeft':'left','ArrowRight':'right',
    'w':'up','s':'down','a':'left','d':'right',
    'z':'a','x':'b','Enter':'start','Shift':'select',
  };

  document.addEventListener('keydown', e => {
    const k = keyMap[e.key] || e.key.toLowerCase();
    if (!keys[k]) { keys[k] = true; handleInput(k); }
    if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(e.key)) e.preventDefault();
  });
  document.addEventListener('keyup', e => {
    const k = keyMap[e.key] || e.key.toLowerCase();
    keys[k] = false;
  });

  // Touch/click controls
  document.querySelectorAll('.dpad-btn, .action-btn, .ss-btn').forEach(btn => {
    const key = btn.dataset.key;
    btn.addEventListener('pointerdown', () => { handleInput(key); keys[key] = true; });
    btn.addEventListener('pointerup', () => { keys[key] = false; });
    btn.addEventListener('pointerleave', () => { keys[key] = false; });
  });

  function handleInput(key) {
    if (gameState === 'intro') {
      if (key === 'start' || key === 'a') startGame();
      return;
    }
    if (gameState === 'dialog') {
      if (key === 'a' || key === 'b') advanceDialog();
      return;
    }
    if (gameState === 'battle') {
      handleBattleInput(key);
      return;
    }
    if (gameState === 'menu') {
      handleMenuInput(key);
      return;
    }
    if (gameState === 'overworld') {
      if (key === 'start') openMenu();
      if (key === 'a') interact();
    }
  }

  // ─── GAME START ───────────────────────────────────────
  function startGame() {
    document.getElementById('intro-screen').classList.add('hidden');
    playerPokemon = Object.assign({}, POKEMON.SQUIRTLE);
    playerHp = playerPokemon.maxHp;
    gameState = 'overworld';
    showDialog([
      "Welcome to the world of\nPOKéMON!",
      "My name is OAK!\nPeople call me the\nPOKéMON PROF!",
      "This world is inhabited by\ncreatures called POKéMON!",
      "You have SQUIRTLE!\nExplore ROUTE 1\nand catch 'em all!",
      "Walk into TALL GRASS\nfor wild battles!\nPress A near SIGNS."
    ], () => { gameState = 'overworld'; });
  }

  // ─── OVERWORLD RENDERING ─────────────────────────────
  function getTile(tx, ty) {
    if (tx < 0 || ty < 0 || tx >= MAP_W || ty >= MAP_H) return T.WALL;
    return MAP[ty * MAP_W + tx];
  }

  function tileColor(t) {
    switch(t) {
      case T.GRASS: return C.bg;
      case T.TALL:  return C.mid;
      case T.TREE:  return C.dark;
      case T.PATH:  return C.path;
      case T.WATER: return C.water;
      case T.HOUSE: return C.mid;
      case T.SIGN:  return C.light;
      case T.WALL:  return C.dark;
      default:      return C.bg;
    }
  }

  function drawTile(t, x, y) {
    ctx.fillStyle = tileColor(t);
    ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);

    // Extra detail
    if (t === T.TREE) {
      ctx.fillStyle = C.mid;
      ctx.fillRect(x+1, y+1, 6, 6);
      ctx.fillStyle = C.dark;
      ctx.fillRect(x+3, y+5, 2, 3);
    }
    if (t === T.HOUSE) {
      ctx.fillStyle = '#c8b560';
      ctx.fillRect(x+1, y+4, 6, 4);
      ctx.fillStyle = C.dark;
      ctx.fillRect(x+3, y+5, 2, 3); // door
      // roof
      ctx.fillStyle = '#c0392b';
      ctx.fillRect(x, y+2, 8, 3);
      ctx.fillRect(x+2, y, 4, 3);
    }
    if (t === T.SIGN) {
      ctx.fillStyle = C.path;
      ctx.fillRect(x+2, y+2, 4, 4);
      ctx.fillStyle = C.dark;
      ctx.fillRect(x+3, y+6, 2, 2);
    }
    if (t === T.WATER) {
      ctx.fillStyle = C.waterL;
      if ((x/TILE_SIZE + y/TILE_SIZE + Math.floor(frameCount/20)) % 2 === 0) {
        ctx.fillRect(x+1, y+2, 3, 2);
        ctx.fillRect(x+5, y+5, 2, 2);
      }
    }
    if (t === T.TALL) {
      ctx.fillStyle = C.light;
      ctx.fillRect(x+1, y, 2, 6);
      ctx.fillRect(x+5, y+1, 2, 5);
    }
  }

  function drawPlayer() {
    const px = player.px - cameraX;
    const py = player.py - cameraY;
    const dirs = ['▲','►','▼','◄'];
    const t = frameCount;

    // Body
    ctx.fillStyle = '#c0392b';
    ctx.fillRect(px+2, py+3, 4, 5);
    // Head
    ctx.fillStyle = '#f5deb3';
    ctx.fillRect(px+2, py+1, 4, 3);
    // Hat
    ctx.fillStyle = '#c0392b';
    ctx.fillRect(px+1, py, 6, 2);
    // Eyes
    ctx.fillStyle = C.dark;
    if (player.dir === 2) { ctx.fillRect(px+2, py+2, 1, 1); ctx.fillRect(px+5, py+2, 1, 1); }
    if (player.dir === 0) { ctx.fillRect(px+2, py+1, 1, 1); ctx.fillRect(px+5, py+1, 1, 1); }
    // Legs (animated)
    const leg = player.moving ? Math.floor(t/6)%2 : 0;
    ctx.fillStyle = '#306230';
    ctx.fillRect(px+2, py+8, 2, 2);
    ctx.fillRect(px+4, py+8, 2, 2);
    if (leg && player.moving) {
      ctx.fillRect(px+2, py+7, 2, 2);
    }
  }

  function drawHUD() {
    // Steps counter
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(0, 0, 60, 9);
    ctx.fillStyle = C.white;
    ctx.font = '5px "Press Start 2P"';
    ctx.fillText(`${playerPokemon?.name?.slice(0,5)} HP:${playerHp}`, 2, 7);
  }

  function updateCamera() {
    const targetCX = player.px - 80 + 4;
    const targetCY = player.py - 72 + 4;
    cameraX = Math.max(0, Math.min(targetCX, MAP_W * TILE_SIZE - 160));
    cameraY = Math.max(0, Math.min(targetCY, MAP_H * TILE_SIZE - 144));
  }

  function drawOverworld() {
    // Draw all tiles
    for (let ty = 0; ty < MAP_H; ty++) {
      for (let tx = 0; tx < MAP_W; tx++) {
        drawTile(getTile(tx, ty), tx*TILE_SIZE - cameraX, ty*TILE_SIZE - cameraY);
      }
    }
    drawPlayer();
    drawHUD();
  }

  // ─── MOVEMENT ─────────────────────────────────────────
  const MOVE_SPEED = 2; // pixels per frame
  const MOVE_FRAMES = TILE_SIZE / MOVE_SPEED; // 4 frames per tile

  function tryMove(dx, dy, dir) {
    if (player.moving) return;
    player.dir = dir;
    const nx = player.x + dx, ny = player.y + dy;
    const tile = getTile(nx, ny);
    if (tile === T.TREE || tile === T.WALL || tile === T.HOUSE || tile === T.WATER) return;
    player.x = nx; player.y = ny;
    player.moving = true;
    player.moveTimer = MOVE_FRAMES;
    steps++;
    // Check for wild encounter in tall grass
    if (tile === T.TALL && Math.random() < 0.2) {
      // Will trigger battle when movement finishes
      player._pendingBattle = true;
    }
  }

  function updateMovement() {
    if (player.moving) {
      const dx = player.x * TILE_SIZE - player.px;
      const dy = player.y * TILE_SIZE - player.py;
      const speed = MOVE_SPEED;
      if (Math.abs(dx) < speed && Math.abs(dy) < speed) {
        player.px = player.x * TILE_SIZE;
        player.py = player.y * TILE_SIZE;
        player.moving = false;
        if (player._pendingBattle) {
          player._pendingBattle = false;
          triggerBattle();
        }
      } else {
        player.px += Math.sign(dx) * speed;
        player.py += Math.sign(dy) * speed;
      }
    } else {
      if (keys['up'])    tryMove(0,-1,0);
      if (keys['right']) tryMove(1,0,1);
      if (keys['down'])  tryMove(0,1,2);
      if (keys['left'])  tryMove(-1,0,3);
    }
  }

  // ─── INTERACT ─────────────────────────────────────────
  function interact() {
    const dirs = [[0,-1],[1,0],[0,1],[-1,0]];
    const [dx,dy] = dirs[player.dir];
    const tx = player.x + dx, ty = player.y + dy;
    const tile = getTile(tx, ty);
    const key = `${tx}-${ty}`;
    if (tile === T.SIGN && SIGNS[key]) {
      showDialog([SIGNS[key]], () => { gameState = 'overworld'; });
    } else if (tile === T.HOUSE) {
      showDialog(["The door is locked.\nNobody is home."], () => { gameState = 'overworld'; });
    }
  }

  // ─── DIALOG ───────────────────────────────────────────
  const dialogBox = document.getElementById('dialog-box');
  const dialogText = document.getElementById('dialog-text');

  let typewriterTimeout = null;
  let typewriterFull = '';
  let typewriterIdx = 0;

  function showDialog(lines, cb) {
    gameState = 'dialog';
    dialogBox.classList.remove('hidden');
    dialogQueue = [...lines];
    dialogCallback = cb || null;
    showNextDialog();
  }

  function showNextDialog() {
    if (dialogQueue.length === 0) {
      dialogBox.classList.add('hidden');
      if (dialogCallback) { const cb = dialogCallback; dialogCallback = null; cb(); }
      return;
    }
    const line = dialogQueue.shift();
    typewriterFull = line.replace(/\n/g, '\n');
    typewriterIdx = 0;
    dialogText.textContent = '';
    clearTimeout(typewriterTimeout);
    typeNext();
  }

  function typeNext() {
    if (typewriterIdx >= typewriterFull.length) return;
    dialogText.textContent += typewriterFull[typewriterIdx++];
    typewriterTimeout = setTimeout(typeNext, 30);
  }

  function advanceDialog() {
    if (typewriterIdx < typewriterFull.length) {
      // Skip typewriter
      clearTimeout(typewriterTimeout);
      typewriterIdx = typewriterFull.length;
      dialogText.textContent = typewriterFull;
    } else {
      showNextDialog();
    }
  }

  // ─── BATTLE ───────────────────────────────────────────
  const battleScreen = document.getElementById('battle-screen');
  const battleText   = document.getElementById('battle-text');
  const battleOpts   = document.querySelectorAll('.battle-opt');
  const moveMenu     = document.getElementById('move-menu');
  const moveList     = document.getElementById('move-list');
  const playerHpBar  = document.getElementById('player-hp-bar');
  const enemyHpBar   = document.getElementById('enemy-hp-bar');
  const playerHpNum  = document.getElementById('player-hp-num');
  const enemyNameEl  = document.getElementById('enemy-name');
  const enemyLevelEl = document.getElementById('enemy-level');
  const enemySpriteEl= document.getElementById('enemy-sprite');
  const playerSpriteEl=document.getElementById('player-sprite');
  const playerNameEl = document.getElementById('player-name');
  const playerLevelEl= document.getElementById('player-level');
  const battlePName  = document.getElementById('battle-pokemon-name');

  function triggerBattle() {
    const wildKey = WILD_ENCOUNTERS[Math.floor(Math.random() * WILD_ENCOUNTERS.length)];
    enemyPokemon = Object.assign({}, POKEMON[wildKey]);
    enemyHp = enemyPokemon.maxHp;

    // Update UI
    enemyNameEl.textContent = 'WILD ' + enemyPokemon.name;
    enemyLevelEl.textContent = 'Lv' + enemyPokemon.level;
    enemySpriteEl.textContent = enemyPokemon.sprite;
    playerSpriteEl.textContent = playerPokemon.sprite;
    playerNameEl.textContent = playerPokemon.name;
    playerLevelEl.textContent = 'Lv' + playerPokemon.level;
    battlePName.textContent = playerPokemon.name;
    updateHpBars();

    battleScreen.classList.remove('hidden');
    gameState = 'battle';
    battleState = 'choose';
    selectedBattleOpt = 0;
    moveMenu.classList.add('hidden');
    updateBattleOptUI();
    setBattleText(`A wild ${enemyPokemon.name}\nappeared!`);
  }

  function updateHpBars() {
    const pPct = Math.max(0, playerHp / playerPokemon.maxHp * 100);
    const ePct = Math.max(0, enemyHp / enemyPokemon.maxHp * 100);
    playerHpBar.style.width = pPct + '%';
    playerHpBar.style.background = pPct > 50 ? '#00a800' : pPct > 25 ? '#a8a800' : '#a80000';
    enemyHpBar.style.width = ePct + '%';
    enemyHpBar.style.background = ePct > 50 ? '#00a800' : ePct > 25 ? '#a8a800' : '#a80000';
    playerHpNum.textContent = playerHp;
  }

  function setBattleText(txt) {
    battleText.textContent = txt;
  }

  function updateBattleOptUI() {
    battleOpts.forEach((el,i) => {
      el.classList.toggle('selected', i === selectedBattleOpt);
    });
  }

  function updateMoveOptUI() {
    const items = moveList.querySelectorAll('.move-item');
    items.forEach((el,i) => el.classList.toggle('selected', i === selectedMoveOpt));
  }

  function handleBattleInput(key) {
    if (battleState === 'anim' || battleState === 'result') {
      if (key === 'a' || key === 'b') continueBattle();
      return;
    }
    if (battleState === 'choose') {
      const opts = ['fight','bag','pokemon','run'];
      if (key === 'up' && selectedBattleOpt > 1) selectedBattleOpt -= 2;
      if (key === 'down' && selectedBattleOpt < 2) selectedBattleOpt += 2;
      if (key === 'left' && selectedBattleOpt % 2 === 1) selectedBattleOpt--;
      if (key === 'right' && selectedBattleOpt % 2 === 0) selectedBattleOpt++;
      updateBattleOptUI();
      if (key === 'a') selectBattleOpt(opts[selectedBattleOpt]);
      return;
    }
    if (battleState === 'fight') {
      const moves = playerPokemon.moves;
      if (key === 'up' && selectedMoveOpt > 1) selectedMoveOpt -= 2;
      if (key === 'down' && selectedMoveOpt < moves.length - 1) selectedMoveOpt += 2;
      if (key === 'left' && selectedMoveOpt % 2 === 1) selectedMoveOpt--;
      if (key === 'right' && selectedMoveOpt % 2 === 0 && selectedMoveOpt+1 < moves.length) selectedMoveOpt++;
      updateMoveOptUI();
      if (key === 'a') useMove(moves[selectedMoveOpt]);
      if (key === 'b') { battleState = 'choose'; moveMenu.classList.add('hidden'); setBattleText(`What will ${playerPokemon.name} do?`); }
    }
  }

  function selectBattleOpt(opt) {
    if (opt === 'fight') {
      battleState = 'fight';
      selectedMoveOpt = 0;
      showMoveMenu();
    } else if (opt === 'run') {
      battleScreen.classList.add('hidden');
      gameState = 'overworld';
      showDialog([`Got away safely!`], () => { gameState = 'overworld'; });
    } else if (opt === 'bag') {
      showBattleMsg(`You don't have any items!`);
    } else if (opt === 'pokemon') {
      showBattleMsg(`No other POKéMON!`);
    }
  }

  function showMoveMenu() {
    moveMenu.classList.remove('hidden');
    moveList.innerHTML = '';
    playerPokemon.moves.forEach((m,i) => {
      const div = document.createElement('div');
      div.className = 'move-item' + (i===0?' selected':'');
      div.textContent = m;
      moveList.appendChild(div);
    });
    setBattleText('Choose a move:');
  }

  function useMove(moveName) {
    moveMenu.classList.add('hidden');
    battleState = 'anim';
    const power = MOVE_POWER[moveName] || 10;

    // Player attacks
    let dmg = 0;
    if (power > 0) {
      dmg = Math.max(1, Math.floor(power * (0.8 + Math.random() * 0.4)));
      enemyHp = Math.max(0, enemyHp - dmg);
    }
    updateHpBars();

    if (power === 0) {
      setBattleText(`${playerPokemon.name} used\n${moveName}!`);
    } else {
      setBattleText(`${playerPokemon.name} used\n${moveName}!\nDealt ${dmg} damage!`);
    }

    setTimeout(() => {
      if (enemyHp <= 0) {
        setBattleText(`Wild ${enemyPokemon.name}\nfainted!\nYou win!`);
        battleState = 'result';
        wins++;
        return;
      }
      // Enemy attacks
      const eMoves = enemyPokemon.moves.filter(m => MOVE_POWER[m] > 0);
      const eMove = eMoves.length ? eMoves[Math.floor(Math.random()*eMoves.length)] : enemyPokemon.moves[0];
      const ePower = MOVE_POWER[eMove] || 8;
      const eDmg = ePower > 0 ? Math.max(1, Math.floor(ePower * (0.7 + Math.random()*0.4))) : 0;
      if (ePower > 0) playerHp = Math.max(0, playerHp - eDmg);
      updateHpBars();

      if (ePower > 0) {
        setBattleText(`${enemyPokemon.name} used\n${eMove}!\nDealt ${eDmg} damage!`);
      } else {
        setBattleText(`${enemyPokemon.name} used\n${eMove}!`);
      }

      if (playerHp <= 0) {
        battleState = 'result';
        setTimeout(() => {
          setBattleText(`${playerPokemon.name} fainted!\nHealed at POKéCENTER...`);
          playerHp = playerPokemon.maxHp;
          updateHpBars();
        }, 1000);
        return;
      }
      battleState = 'choose';
      setTimeout(() => {
        setBattleText(`What will ${playerPokemon.name} do?`);
        updateBattleOptUI();
      }, 1200);
    }, 1200);
  }

  function showBattleMsg(msg) {
    setBattleText(msg);
    battleState = 'result';
  }

  function continueBattle() {
    if (playerHp <= 0) { playerHp = playerPokemon.maxHp; updateHpBars(); }
    if (enemyHp <= 0 || battleState === 'result') {
      battleScreen.classList.add('hidden');
      gameState = 'overworld';
      battleState = 'choose';
    }
  }

  // ─── MENU ─────────────────────────────────────────────
  const startMenu = document.getElementById('start-menu');
  const menuItems = document.querySelectorAll('.menu-item');

  function openMenu() {
    gameState = 'menu';
    selectedMenuOpt = 0;
    updateMenuUI();
    startMenu.classList.remove('hidden');
  }

  function updateMenuUI() {
    menuItems.forEach((el,i) => el.classList.toggle('selected', i===selectedMenuOpt));
  }

  function handleMenuInput(key) {
    if (key === 'up' && selectedMenuOpt > 0) { selectedMenuOpt--; updateMenuUI(); }
    if (key === 'down' && selectedMenuOpt < menuItems.length-1) { selectedMenuOpt++; updateMenuUI(); }
    if (key === 'b' || key === 'start') { startMenu.classList.add('hidden'); gameState = 'overworld'; }
    if (key === 'a') {
      const action = menuItems[selectedMenuOpt].dataset.action;
      if (action === 'pokemon') {
        startMenu.classList.add('hidden');
        showDialog([
          `${playerPokemon.name}\nLv.${playerPokemon.level}\nHP: ${playerHp}/${playerPokemon.maxHp}\nType: ${playerPokemon.type}`,
          `Moves:\n${playerPokemon.moves.join(', ')}`,
          `Battles won: ${wins}\nSteps: ${steps}`
        ], () => { gameState = 'overworld'; });
      } else if (action === 'save') {
        startMenu.classList.add('hidden');
        showDialog(['Game saved!\n(Not really — this\nis a demo!)'], () => { gameState = 'overworld'; });
      } else if (action === 'quit') {
        startMenu.classList.add('hidden');
        document.getElementById('intro-screen').classList.remove('hidden');
        gameState = 'intro';
      }
    }
  }

  // ─── MAIN LOOP ────────────────────────────────────────
  function gameLoop() {
    frameCount++;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (gameState === 'overworld' || gameState === 'dialog') {
      updateMovement();
      updateCamera();
      drawOverworld();
    } else if (gameState === 'intro') {
      // Intro is HTML overlay, draw starfield on canvas
      drawStarfield();
    }

    requestAnimationFrame(gameLoop);
  }

  function drawStarfield() {
    ctx.fillStyle = '#0f380f';
    ctx.fillRect(0,0,160,144);
    ctx.fillStyle = C.light;
    for (let i = 0; i < 30; i++) {
      const x = (i * 53 + frameCount * 0.3) % 160;
      const y = (i * 37 + frameCount * 0.1) % 144;
      ctx.fillRect(Math.floor(x), Math.floor(y), 1, 1);
    }
  }

  // ─── INIT ─────────────────────────────────────────────
  gameLoop();

})();
