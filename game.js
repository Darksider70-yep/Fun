// ══════════════════════════════════════════════════════════════
//  POKÉMON RED — Fullscreen Fan Edition  |  game.js
//  Fullscreen canvas RPG: overworld, battles, dialog, HUD, FX
// ══════════════════════════════════════════════════════════════

(function () {
  'use strict';

  // ─── CANVAS SETUP ─────────────────────────────────────────
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  const battleBgCanvas = document.getElementById('battleBgCanvas');
  const battleBgCtx = battleBgCanvas && battleBgCanvas.getContext('2d');

  let W = 0, H = 0, TILE = 0, MAP_COLS = 0, MAP_ROWS = 0;

  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
    if (battleBgCanvas) {
      battleBgCanvas.width  = W;
      battleBgCanvas.height = H;
    }
    TILE     = Math.max(24, Math.floor(Math.min(W, H) / 22));
    MAP_COLS = Math.ceil(W / TILE) + 3;
    MAP_ROWS = Math.ceil(H / TILE) + 3;
    if (gameState === 'overworld' || gameState === 'dialog') {
      updateCamera();
    }
  }
  window.addEventListener('resize', resize);

  // ─── PALETTE ──────────────────────────────────────────────
  const C = {
    bg:      '#9bbc0f', dark:  '#0f380f', mid:   '#306230',
    light:   '#8bac0f', white: '#e0f8d0', path:  '#c8b560',
    water:   '#3060b8', waterL:'#6090e8', red:   '#cc2200',
    sand:    '#d4b060', flower:'#ff6080', tree2: '#204810',
  };

  // ─── TILE TYPES ───────────────────────────────────────────
  const T = {
    GRASS:0, TALL:1, TREE:2, PATH:3, WATER:4,
    HOUSE:5, SIGN:6,  WALL:7, FLOWER:8, SAND:9,
    FENCE:10, POKE_CENTER:11, MART:12,
  };

  // ─── MAP DATA (30 × 25) ───────────────────────────────────
  const FULL_MAP_W = 30, FULL_MAP_H = 25;
  // prettier-ignore
  const MAP_DATA = [
    2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,
    2,3,3,3,3,3,2,1,1,1,1,1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,
    2,3,0,0,11,3,2,1,1,1,1,1,2,6,0,0,0,0,8,0,2,2,2,2,2,2,2,2,2,2,
    2,3,0,0,0,3,3,1,1,1,1,1,2,0,0,0,0,0,0,0,2,2,2,2,2,2,2,2,2,2,
    2,3,0,0,5,3,2,1,1,1,1,1,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,2,
    2,3,0,0,0,3,2,0,0,0,0,0,3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,3,2,
    2,3,3,3,3,3,3,0,0,0,0,0,3,0,5,0,0,5,0,0,0,0,0,8,0,8,0,0,3,2,
    2,2,10,10,2,2,2,1,1,1,1,1,3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,3,2,
    4,4,4,3,4,4,4,1,1,1,1,1,3,0,0,12,0,0,0,0,0,0,0,0,0,0,0,0,3,2,
    4,4,4,3,4,4,4,1,1,1,1,1,3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,3,2,
    4,4,4,3,4,4,4,0,0,0,0,0,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,
    2,2,2,3,2,2,2,0,0,0,0,0,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,
    2,1,1,3,1,1,2,0,0,0,0,0,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,
    2,1,1,3,1,1,2,1,1,1,1,1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,
    2,1,1,3,1,1,2,1,1,1,1,1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,
    2,2,2,3,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,
    2,9,9,3,9,9,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,
    2,9,9,3,9,9,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,
    4,4,4,3,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,
    4,4,4,3,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,
    2,2,2,3,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,
    2,0,0,3,0,0,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,
    2,0,0,3,0,0,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,
    2,1,1,3,1,1,1,1,1,1,1,1,1,1,1,1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,
    2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,
  ];

  const SIGNS = {
    '13-2': 'PALLET TOWN\nA TRANQUIL SETTING\nOF RUSTIC PURSUIT',
    '7-1':  'ROUTE 1\nWILD POKÉMON LIVE\nIN TALL GRASS!',
    '18-2': 'POKÉMON LEAGUE\nREGISTRATION\nSEAS YOUR FUTURE',
  };

  const LOCATION_MAP = {
    default: 'PALLET TOWN',
    route1: 'ROUTE 1',
    route2: 'ROUTE 2',
    lake: 'CERULEAN LAKE',
  };

  // ─── POKÉMON DATABASE ─────────────────────────────────────
  const POKEMON = {
    SQUIRTLE:   { name:'SQUIRTLE',   sprite:'🐢', type:'WATER',  maxHp:20, atk:10, def:8,  moves:['TACKLE','WATER GUN','TAIL WHIP','GROWL'],    level:5,  xpYield:65,  desc:'A tiny turtle Pokémon.' },
    BULBASAUR:  { name:'BULBASAUR',  sprite:'🌱', type:'GRASS',  maxHp:22, atk:9,  def:9,  moves:['TACKLE','VINE WHIP','GROWL','LEECH SEED'],   level:5,  xpYield:64,  desc:'A strange seed grows on its back.' },
    CHARMANDER: { name:'CHARMANDER', sprite:'🔥', type:'FIRE',   maxHp:18, atk:12, def:6,  moves:['SCRATCH','EMBER','GROWL','TAIL WHIP'],       level:5,  xpYield:62,  desc:'The fire on its tail shows emotion.' },
    PIKACHU:    { name:'PIKACHU',    sprite:'⚡', type:'ELECTRIC',maxHp:16, atk:13, def:6,  moves:['THUNDER SHOCK','QUICK ATK','GROWL','TAIL WHIP'],level:5,xpYield:82, desc:'When several gather, lightning strikes.' },
    PIDGEY:     { name:'PIDGEY',     sprite:'🐦', type:'NORMAL', maxHp:14, atk:7,  def:5,  moves:['TACKLE','GUST','SAND-ATTACK','QUICK ATK'],   level:3,  xpYield:55,  desc:'A common sight in forests and woods.' },
    RATTATA:    { name:'RATTATA',    sprite:'🐭', type:'NORMAL', maxHp:12, atk:8,  def:4,  moves:['TACKLE','TAIL WHIP','QUICK ATK','BITE'],     level:2,  xpYield:57,  desc:'Will chew on anything with its sharp fangs.' },
    CATERPIE:   { name:'CATERPIE',   sprite:'🐛', type:'BUG',    maxHp:10, atk:5,  def:7,  moves:['TACKLE','STRING SHOT'],                     level:2,  xpYield:53,  desc:'Its feet have suction cups.' },
    WEEDLE:     { name:'WEEDLE',     sprite:'🐝', type:'BUG',    maxHp:10, atk:7,  def:5,  moves:['POISON STING','STRING SHOT'],               level:2,  xpYield:52,  desc:'A poisonous needle on its head.' },
    ZUBAT:      { name:'ZUBAT',      sprite:'🦇', type:'POISON', maxHp:13, atk:7,  def:5,  moves:['LEECH LIFE','SUPERSONIC','BITE'],            level:4,  xpYield:54,  desc:'Emits supersonic waves.' },
    GEODUDE:    { name:'GEODUDE',    sprite:'🪨', type:'ROCK',   maxHp:18, atk:10, def:14, moves:['TACKLE','ROCK THROW','DEFENSE CURL'],        level:4,  xpYield:86,  desc:'Mistaken for boulders.' },
  };

  const MOVES_DB = {
    'TACKLE':      { power:10, type:'NORMAL',   pp:35, accuracy:100, cat:'physical', desc:'Normal attack.' },
    'WATER GUN':   { power:20, type:'WATER',    pp:25, accuracy:100, cat:'special',  desc:'Shoots water.' },
    'VINE WHIP':   { power:18, type:'GRASS',    pp:25, accuracy:100, cat:'physical', desc:'Strikes with vines.' },
    'EMBER':       { power:20, type:'FIRE',     pp:25, accuracy:100, cat:'special',  desc:'Burns the foe.' },
    'SCRATCH':     { power:12, type:'NORMAL',   pp:35, accuracy:100, cat:'physical', desc:'Scratches with claws.' },
    'THUNDER SHOCK':{ power:18,type:'ELECTRIC', pp:30, accuracy:100, cat:'special',  desc:'Zaps the foe.' },
    'TAIL WHIP':   { power:0,  type:'NORMAL',   pp:30, accuracy:100, cat:'status',   desc:'Lowers DEF.' },
    'GROWL':       { power:0,  type:'NORMAL',   pp:40, accuracy:100, cat:'status',   desc:'Lowers ATK.' },
    'LEECH SEED':  { power:0,  type:'GRASS',    pp:10, accuracy:90,  cat:'status',   desc:'Drains HP each turn.' },
    'SAND-ATTACK': { power:0,  type:'NORMAL',   pp:15, accuracy:100, cat:'status',   desc:'Reduces accuracy.' },
    'STRING SHOT':  { power:0,  type:'BUG',     pp:40, accuracy:95,  cat:'status',   desc:'Lowers SPD.' },
    'GUST':        { power:16, type:'FLYING',   pp:35, accuracy:100, cat:'special',  desc:'Stirs up gusts.' },
    'QUICK ATK':   { power:14, type:'NORMAL',   pp:30, accuracy:100, cat:'physical', desc:'Strikes first.' },
    'BITE':        { power:18, type:'DARK',     pp:25, accuracy:100, cat:'physical', desc:'May cause flinch.' },
    'POISON STING':{ power:15, type:'POISON',   pp:35, accuracy:100, cat:'physical', desc:'May poison foe.' },
    'ROCK THROW':  { power:22, type:'ROCK',     pp:15, accuracy:90,  cat:'physical', desc:'Hurls a boulder.' },
    'LEECH LIFE':  { power:10, type:'BUG',      pp:15, accuracy:100, cat:'physical', desc:'Restores HP.' },
    'SUPERSONIC':  { power:0,  type:'NORMAL',   pp:20, accuracy:55,  cat:'status',   desc:'Confuses foe.' },
    'DEFENSE CURL':{ power:0,  type:'NORMAL',   pp:40, accuracy:100, cat:'status',   desc:'Raises DEF.' },
  };

  const TYPE_COLORS = {
    NORMAL:'#a0a080', FIRE:'#e84820', WATER:'#4888f8', GRASS:'#78c840',
    ELECTRIC:'#f8d030', BUG:'#a8b820', ROCK:'#b8a038', POISON:'#a040a0',
    FLYING:'#a890f0', DARK:'#705848', ICE:'#98d8d8', PSYCHIC:'#f85888',
  };

  const WILD_POOL_GRASS = ['PIDGEY','RATTATA','CATERPIE','WEEDLE'];
  const WILD_POOL_TALL  = ['PIDGEY','RATTATA','ZUBAT','GEODUDE'];

  // ─── GAME STATE ───────────────────────────────────────────
  let gameState = 'intro'; // intro | overworld | dialog | battle | menu | pokemon-panel
  let playerPokemon = null;
  let playerHp = 0, playerXp = 0, playerXpNext = 100;
  let enemyPokemon = null, enemyHp = 0;
  let dialogQueue = [], dialogCallback = null;
  let dialogSpeaker = '', dialogPortrait = '';
  let battleState = 'choose'; // choose | fight | anim | result
  let selectedBattleOpt = 0, selectedMoveOpt = 0, selectedMenuOpt = 0;
  let cameraX = 0, cameraY = 0;
  let steps = 0, wins = 0, frameCount = 0;
  let playerLocation = 'PALLET TOWN';
  let weather = 'clear'; // clear | rain | snow
  let weatherParticles = [];
  let toastTimeout = null;
  let hintVisible = true;

  // ─── PLAYER ───────────────────────────────────────────────
  const player = {
    x: 5, y: 3,
    px: 5 * 32, py: 3 * 32,
    dir: 2, moving: false,
    _pendingBattle: false,
    name: 'RED',
  };

  // ─── INPUT ────────────────────────────────────────────────
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

  function handleInput(key) {
    // Hide hint after first interaction
    if (hintVisible && (key === 'up'||key==='down'||key==='left'||key==='right')) {
      hintVisible = false;
      const hint = document.getElementById('controls-hint');
      if (hint) hint.classList.add('hide');
    }

    if (gameState === 'intro') {
      if (key === 'start' || key === 'a' || key === 'enter') startGame();
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
    if (gameState === 'pokemon-panel') {
      if (key === 'b' || key === 'start') closePokemonPanel();
      return;
    }
    if (gameState === 'overworld') {
      if (key === 'start') openMenu();
      if (key === 'a') interact();
    }
  }

  // ─── GAME START ───────────────────────────────────────────
  function startGame() {
    const intro = document.getElementById('intro-screen');
    if (intro) intro.classList.add('hidden');
    const wrap = document.getElementById('game-wrap');
    if (wrap) wrap.classList.remove('hidden');

    playerPokemon = deepClone(POKEMON.SQUIRTLE);
    playerHp = playerPokemon.maxHp;
    playerXp = 0; playerXpNext = 100;
    steps = 0; wins = 0;
    gameState = 'overworld';

    resize();
    player.px = player.x * TILE;
    player.py = player.y * TILE;
    updateHUD();

    showDialog([
      "Welcome to the world of\nPOKÉMON!",
      "My name is OAK!\nPeople call me the\nPOKÉMON PROFESSOR!",
      "This world is inhabited by\ncreatures called POKÉMON!",
      "You received SQUIRTLE!\nExplore ROUTE 1 and\nfight wild POKÉMON!",
      "Walk into TALL GRASS\nfor wild encounters.\nPress A near signs & buildings."
    ], () => { gameState = 'overworld'; }, '🎓', 'PROF. OAK');
  }

  function deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  // ─── MAP HELPERS ──────────────────────────────────────────
  function getTile(tx, ty) {
    if (tx < 0 || ty < 0 || tx >= FULL_MAP_W || ty >= FULL_MAP_H) return T.WALL;
    return MAP_DATA[ty * FULL_MAP_W + tx];
  }

  function isBlocked(t) {
    return t === T.TREE || t === T.WALL || t === T.WATER || t === T.FENCE;
  }

  // ─── RENDERING ────────────────────────────────────────────
  function tileColor(t) {
    switch(t) {
      case T.GRASS:  return C.bg;
      case T.TALL:   return C.mid;
      case T.TREE:   return C.dark;
      case T.PATH:   return C.path;
      case T.WATER:  return C.water;
      case T.HOUSE:  return C.mid;
      case T.POKE_CENTER: return '#d87070';
      case T.MART:   return '#70a8d8';
      case T.SIGN:   return C.light;
      case T.WALL:   return C.dark;
      case T.FLOWER: return C.bg;
      case T.SAND:   return C.sand;
      case T.FENCE:  return '#8b5a2b';
      default:       return C.bg;
    }
  }

  function drawTile(t, x, y, s) {
    // Base color
    ctx.fillStyle = tileColor(t);
    ctx.fillRect(x, y, s, s);

    const q = s / 8;

    if (t === T.TREE) {
      ctx.fillStyle = C.mid;
      ctx.fillRect(x+q, y+q, s-2*q, s-2*q);
      ctx.fillStyle = C.tree2;
      ctx.fillRect(x+2*q, y+2*q, s-4*q, s-4*q);
      ctx.fillStyle = C.dark;
      ctx.fillRect(x+3*q, y+5*q, 2*q, 3*q);
    }
    if (t === T.HOUSE) {
      ctx.fillStyle = '#d4c080';
      ctx.fillRect(x+q, y+3*q, s-2*q, 5*q);
      ctx.fillStyle = C.dark;
      ctx.fillRect(x+3*q, y+4*q, 2*q, 4*q);
      ctx.fillStyle = '#a0d0f8';
      ctx.fillRect(x+5*q, y+4*q, 2*q, 2*q);
      ctx.fillStyle = C.red;
      ctx.fillRect(x, y+q, s, 3*q);
      ctx.fillRect(x+2*q, y, 4*q, 2*q);
    }
    if (t === T.POKE_CENTER) {
      ctx.fillStyle = '#c08080';
      ctx.fillRect(x+q, y+3*q, s-2*q, 5*q);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(x+2*q, y+4*q, 4*q, 4*q);
      ctx.fillStyle = '#d04040';
      ctx.fillRect(x, y+q, s, 3*q);
      ctx.fillRect(x+2*q, y, 4*q, 2*q);
      ctx.fillStyle = '#ff8080';
      ctx.fillRect(x+3*q, y+q, 2*q, 2*q);
    }
    if (t === T.MART) {
      ctx.fillStyle = '#a0c0e0';
      ctx.fillRect(x+q, y+3*q, s-2*q, 5*q);
      ctx.fillStyle = '#4080a0';
      ctx.fillRect(x, y+q, s, 3*q);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(x+2*q, y+4*q, 4*q, 3*q);
      ctx.fillStyle = '#80c0ff';
      ctx.fillRect(x+3*q, y+q, 2*q, 2*q);
    }
    if (t === T.SIGN) {
      ctx.fillStyle = C.path;
      ctx.fillRect(x+2*q, y+2*q, 4*q, 3*q);
      ctx.fillStyle = C.dark;
      ctx.fillRect(x+3*q, y+q, 2*q, 2*q);
      ctx.fillRect(x+3*q, y+5*q, 2*q, 3*q);
    }
    if (t === T.FLOWER) {
      const anim = Math.floor(frameCount / 30) % 2;
      ctx.fillStyle = C.flower;
      if (anim === 0) {
        ctx.fillRect(x+2*q, y+2*q, 2*q, 2*q);
        ctx.fillRect(x+5*q, y+5*q, 2*q, 2*q);
      } else {
        ctx.fillRect(x+4*q, y+2*q, 2*q, 2*q);
        ctx.fillRect(x+2*q, y+5*q, 2*q, 2*q);
      }
      ctx.fillStyle = '#50c820';
      ctx.fillRect(x+3*q, y+3*q, q, 4*q);
    }
    if (t === T.WATER) {
      const wave = Math.floor(frameCount / 18) % 3;
      ctx.fillStyle = C.waterL;
      ctx.fillRect(x+(wave)*q, y+2*q, 3*q, q);
      ctx.fillRect(x+(5-wave)*q, y+5*q, 3*q, q);
    }
    if (t === T.FENCE) {
      ctx.fillStyle = '#6b3a1f';
      ctx.fillRect(x, y+3*q, s, q);
      ctx.fillRect(x+2*q, y+q, q, 6*q);
      ctx.fillRect(x+5*q, y+q, q, 6*q);
    }
    if (t === T.TALL) {
      ctx.fillStyle = C.light;
      ctx.fillRect(x+q, y, 2*q, 6*q);
      ctx.fillRect(x+5*q, y+q, 2*q, 5*q);
      ctx.fillStyle = C.bg;
      ctx.fillRect(x+q, y+6*q, 2*q, 2*q);
    }
  }

  function drawPlayer() {
    const sx = Math.round(player.px - cameraX);
    const sy = Math.round(player.py - cameraY);
    const q  = TILE / 8;
    const leg = player.moving ? Math.floor(frameCount/5)%2 : 0;

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.beginPath();
    ctx.ellipse(sx + TILE/2, sy + TILE - q, TILE/2.5, q, 0, 0, Math.PI*2);
    ctx.fill();

    // Legs
    ctx.fillStyle = '#2a4a20';
    if (leg === 0 || !player.moving) {
      ctx.fillRect(sx+2*q, sy+6*q, 2*q, 2*q);
      ctx.fillRect(sx+4*q, sy+6*q, 2*q, 2*q);
    } else {
      ctx.fillRect(sx+2*q, sy+5*q, 2*q, 3*q);
      ctx.fillRect(sx+4*q, sy+6*q, 2*q, 2*q);
    }

    // Body (red jacket)
    ctx.fillStyle = '#c42020';
    ctx.fillRect(sx+2*q, sy+4*q, 4*q, 3*q);
    // Collar / detail
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(sx+3*q, sy+4*q, 2*q, q);

    // Arms
    ctx.fillStyle = '#c42020';
    ctx.fillRect(sx+q, sy+4*q, q, 3*q);
    ctx.fillRect(sx+6*q, sy+4*q, q, 3*q);

    // Head
    ctx.fillStyle = '#f5deb3';
    ctx.fillRect(sx+2*q, sy+2*q, 4*q, 3*q);
    // Eyes
    ctx.fillStyle = '#1a0808';
    if (player.dir === 0) {
      ctx.fillRect(sx+2*q, sy+2*q, q, q);
      ctx.fillRect(sx+5*q, sy+2*q, q, q);
    } else if (player.dir === 2 || player.dir === 1 || player.dir === 3) {
      ctx.fillRect(sx+2*q, sy+3*q, q, q);
      ctx.fillRect(sx+5*q, sy+3*q, q, q);
    }

    // Hat
    ctx.fillStyle = '#c42020';
    ctx.fillRect(sx+q, sy, 6*q, 2*q);
    ctx.fillRect(sx+q, sy+q, 7*q, q); // brim
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(sx+2*q, sy, 2*q, q); // logo mark
  }

  function drawHUDCanvas() {
    // Small HP text in top-left of canvas while in overworld
  }

  function drawWeather() {
    if (weather === 'clear') return;
    if (weather === 'rain') {
      ctx.strokeStyle = 'rgba(150,200,255,0.35)';
      ctx.lineWidth = 1;
      weatherParticles.forEach(p => {
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x - 2, p.y + 8);
        ctx.stroke();
        p.x += p.vx; p.y += p.vy;
        if (p.y > H) { p.y = -10; p.x = Math.random() * W; }
      });
    }
    if (weather === 'snow') {
      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      weatherParticles.forEach(p => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI*2);
        ctx.fill();
        p.x += Math.sin(frameCount * 0.02 + p.phase) * 0.5;
        p.y += p.vy;
        if (p.y > H) { p.y = -5; p.x = Math.random() * W; }
      });
    }
  }

  function initWeather() {
    weatherParticles = [];
    const count = 80;
    for (let i = 0; i < count; i++) {
      if (weather === 'rain') {
        weatherParticles.push({ x: Math.random()*W, y: Math.random()*H, vx: -1, vy: 12 });
      } else if (weather === 'snow') {
        weatherParticles.push({ x: Math.random()*W, y: Math.random()*H, vy: 0.8, r: 1+Math.random()*2, phase: Math.random()*Math.PI*2 });
      }
    }
  }

  function updateCamera() {
    const tx = player.px - W/2 + TILE/2;
    const ty = player.py - H/2 + TILE/2;
    cameraX = Math.max(0, Math.min(tx, FULL_MAP_W * TILE - W));
    cameraY = Math.max(0, Math.min(ty, FULL_MAP_H * TILE - H));
  }

  function drawOverworld() {
    // Background
    ctx.fillStyle = C.dark;
    ctx.fillRect(0, 0, W, H);

    // Tiles
    const startTX = Math.max(0, Math.floor(cameraX / TILE));
    const startTY = Math.max(0, Math.floor(cameraY / TILE));
    const endTX   = Math.min(FULL_MAP_W, startTX + MAP_COLS);
    const endTY   = Math.min(FULL_MAP_H, startTY + MAP_ROWS);

    for (let ty = startTY; ty < endTY; ty++) {
      for (let tx = startTX; tx < endTX; tx++) {
        const tile = getTile(tx, ty);
        const sx = Math.round(tx * TILE - cameraX);
        const sy = Math.round(ty * TILE - cameraY);
        drawTile(tile, sx, sy, TILE);
      }
    }

    drawPlayer();
    drawWeather();
  }

  // ─── MOVEMENT ─────────────────────────────────────────────
  const MOVE_SPEED_RATIO = 0.15; // fraction of TILE per frame

  function tryMove(dx, dy, dir) {
    if (player.moving) return;
    player.dir = dir;
    const nx = player.x + dx, ny = player.y + dy;
    const tile = getTile(nx, ny);
    if (isBlocked(tile)) return;
    player.x = nx; player.y = ny;
    player.moving = true;
    steps++;
    document.getElementById('hud-steps-num').textContent = steps;

    // Update location
    updatePlayerLocation(nx, ny);

    if (tile === T.TALL && Math.random() < 0.22) {
      player._pendingBattle = 'tall';
    } else if (tile === T.GRASS && Math.random() < 0.04) {
      player._pendingBattle = 'grass';
    }
  }

  function updatePlayerLocation(tx, ty) {
    let loc = 'PALLET TOWN';
    if (tx >= 7 && tx <= 11 && ty >= 1 && ty <= 14) loc = 'ROUTE 1';
    if (tx >= 12 && tx <= 28) loc = 'ROUTE 2';
    if (ty >= 18 && ty <= 19) loc = 'CERULEAN LAKE';
    if (loc !== playerLocation) {
      playerLocation = loc;
      document.getElementById('hud-location').textContent = loc;
      showToast(`Entered ${loc}`);
    }
  }

  function updateMovement() {
    if (player.moving) {
      const targetX = player.x * TILE;
      const targetY = player.y * TILE;
      const speed = TILE * MOVE_SPEED_RATIO;
      const dx = targetX - player.px;
      const dy = targetY - player.py;
      if (Math.abs(dx) <= speed && Math.abs(dy) <= speed) {
        player.px = targetX;
        player.py = targetY;
        player.moving = false;
        if (player._pendingBattle) {
          const pool = player._pendingBattle === 'tall' ? WILD_POOL_TALL : WILD_POOL_GRASS;
          player._pendingBattle = false;
          setTimeout(() => triggerBattle(pool), 80);
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

  // ─── INTERACT ─────────────────────────────────────────────
  function interact() {
    const dirs = [[0,-1],[1,0],[0,1],[-1,0]];
    const [dx,dy] = dirs[player.dir];
    const tx = player.x + dx, ty = player.y + dy;
    const tile = getTile(tx, ty);
    const key = `${tx}-${ty}`;

    if (SIGNS[key]) {
      showDialog([SIGNS[key]], () => { gameState = 'overworld'; }, '📋', 'SIGN');
    } else if (tile === T.HOUSE) {
      showDialog(['The door is locked.\nNobody seems to be home.'], () => { gameState = 'overworld'; }, '🏠', 'HOUSE');
    } else if (tile === T.POKE_CENTER) {
      const prevHp = playerHp;
      playerHp = playerPokemon.maxHp;
      updateHUD();
      showDialog([
        'NURSE JOY: Welcome to\nthe POKÉMON CENTER!',
        `We restored your\n${playerPokemon.name} to full health!`,
        `${prevHp < playerPokemon.maxHp ? 'HP fully restored!' : 'Your Pokémon was\nalready healthy!'}`
      ], () => { gameState = 'overworld'; }, '💊', 'NURSE JOY');
    } else if (tile === T.MART) {
      showDialog([
        'CLERK: Welcome to the\nPOKÉ MART!',
        'We\'re sold out right now.\nCheck back later!',
      ], () => { gameState = 'overworld'; }, '🏪', 'POKÉ MART');
    }
  }

  // ─── DIALOG ───────────────────────────────────────────────
  const dialogBox     = document.getElementById('dialog-box');
  const dialogTextEl  = document.getElementById('dialog-text');
  const dialogSpeakerEl = document.getElementById('dialog-speaker');
  const dialogPortraitEl = document.getElementById('dialog-portrait');

  let twTimeout = null, twFull = '', twIdx = 0;

  function showDialog(lines, cb, portrait, speaker) {
    gameState = 'dialog';
    dialogBox.classList.remove('hidden');
    dialogQueue = [...lines];
    dialogCallback = cb || null;
    dialogPortrait = portrait || '💬';
    dialogSpeaker  = speaker  || '';
    showNextDialog();
  }

  function showNextDialog() {
    if (dialogQueue.length === 0) {
      dialogBox.classList.add('hidden');
      if (dialogCallback) { const cb = dialogCallback; dialogCallback = null; cb(); }
      return;
    }
    const line = dialogQueue.shift();
    twFull = line; twIdx = 0;
    dialogTextEl.textContent = '';
    dialogPortraitEl.textContent = dialogPortrait;
    dialogSpeakerEl.textContent = dialogSpeaker;
    clearTimeout(twTimeout);
    typeNextChar();
  }

  function typeNextChar() {
    if (twIdx >= twFull.length) return;
    dialogTextEl.textContent += twFull[twIdx++];
    twTimeout = setTimeout(typeNextChar, 28);
  }

  function advanceDialog() {
    if (twIdx < twFull.length) {
      clearTimeout(twTimeout);
      twIdx = twFull.length;
      dialogTextEl.textContent = twFull;
    } else {
      showNextDialog();
    }
  }

  // ─── HUD UPDATE ───────────────────────────────────────────
  function updateHUD() {
    if (!playerPokemon) return;
    const nameEl = document.getElementById('hud-pokemon-name');
    const hpBar  = document.getElementById('hud-hp-bar');
    const hpText = document.getElementById('hud-hp-text');
    if (nameEl) nameEl.textContent = playerPokemon.name;
    const pct = playerHp / playerPokemon.maxHp * 100;
    if (hpBar) {
      hpBar.style.width = pct + '%';
      hpBar.style.background = pct > 50 ? 'var(--hp-green)' : pct > 25 ? 'var(--hp-yellow)' : 'var(--hp-red)';
    }
    if (hpText) hpText.textContent = `${playerHp} / ${playerPokemon.maxHp}`;
    document.getElementById('hud-wins-num').textContent = wins;
  }

  // ─── TOAST NOTIFICATION ───────────────────────────────────
  function showToast(msg) {
    const t = document.getElementById('toast');
    if (!t) return;
    t.textContent = msg;
    t.classList.remove('hidden');
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => t.classList.add('hidden'), 2400);
  }

  // ─── BATTLE ───────────────────────────────────────────────
  const battleScreen = document.getElementById('battle-screen');
  const battleMsgEl  = document.getElementById('battle-msg');
  const battleMenu   = document.getElementById('battle-menu');
  const battleOpts   = document.querySelectorAll('.battle-opt');
  const moveMenu     = document.getElementById('move-menu');
  const moveList     = document.getElementById('move-list');
  const moveTypeEl   = document.getElementById('move-type');
  const movePpEl     = document.getElementById('move-pp');
  const enemyHpBar   = document.getElementById('enemy-hp-bar');
  const playerHpBar  = document.getElementById('player-hp-bar');
  const enemyNameEl  = document.getElementById('enemy-name');
  const enemyTagEl   = document.getElementById('enemy-tag');
  const enemyLevelEl = document.getElementById('enemy-level');
  const enemySpriteEl= document.getElementById('enemy-sprite');
  const playerSpriteEl=document.getElementById('player-sprite');
  const playerPokeNameEl = document.getElementById('player-poke-name');
  const playerLevelEl    = document.getElementById('player-level');
  const playerHpTextEl   = document.getElementById('player-hp-text');
  const playerXpBar      = document.getElementById('player-xp-bar');
  const enemyPanel       = document.getElementById('enemy-panel');
  const playerPanel      = document.getElementById('player-panel');

  function triggerBattle(pool) {
    pool = pool || WILD_POOL_GRASS;
    const wildKey = pool[Math.floor(Math.random() * pool.length)];
    enemyPokemon = deepClone(POKEMON[wildKey]);
    // Scale enemy level slightly
    enemyPokemon.level = Math.max(2, Math.floor(playerPokemon.level * (0.8 + Math.random() * 0.5)));
    enemyHp = enemyPokemon.maxHp;

    // Flash effect
    const flash = document.createElement('div');
    flash.className = 'flash-overlay';
    document.getElementById('game-wrap').appendChild(flash);
    setTimeout(() => flash.remove(), 500);

    // Draw battle background
    setTimeout(() => {
      drawBattleBg();
      // Update UI elements
      enemyTagEl.textContent  = 'Wild';
      enemyNameEl.textContent = enemyPokemon.name;
      enemyLevelEl.textContent = `Lv.${enemyPokemon.level}`;
      enemySpriteEl.textContent = enemyPokemon.sprite;
      playerSpriteEl.textContent = playerPokemon.sprite;
      playerPokeNameEl.textContent = playerPokemon.name;
      playerLevelEl.textContent = `Lv.${playerPokemon.level}`;

      updateBattleHpBars();

      battleScreen.classList.remove('hidden');
      gameState = 'battle';
      battleState = 'choose';
      selectedBattleOpt = 0;
      moveMenu.classList.add('hidden');
      updateBattleOptUI();
      setBattleMsg(`A wild ${enemyPokemon.name}\nappeared!`);
    }, 200);
  }

  function drawBattleBg() {
    if (!battleBgCtx) return;
    const bw = battleBgCanvas.width, bh = battleBgCanvas.height;
    // Sky gradient
    const sky = battleBgCtx.createLinearGradient(0, 0, 0, bh * 0.6);
    sky.addColorStop(0, '#1a3a6a');
    sky.addColorStop(1, '#4a80c0');
    battleBgCtx.fillStyle = sky;
    battleBgCtx.fillRect(0, 0, bw, bh * 0.6);
    // Ground
    const gnd = battleBgCtx.createLinearGradient(0, bh*0.6, 0, bh);
    gnd.addColorStop(0, '#5a9a30');
    gnd.addColorStop(1, '#3a6a18');
    battleBgCtx.fillStyle = gnd;
    battleBgCtx.fillRect(0, bh * 0.6, bw, bh * 0.4);
    // Grid lines on ground
    battleBgCtx.strokeStyle = 'rgba(0,0,0,0.2)';
    battleBgCtx.lineWidth = 1;
    for (let i = 0; i < 20; i++) {
      const y = bh * 0.6 + i * (bh * 0.4 / 20);
      battleBgCtx.beginPath();
      battleBgCtx.moveTo(0, y); battleBgCtx.lineTo(bw, y);
      battleBgCtx.stroke();
    }
    // Clouds
    battleBgCtx.fillStyle = 'rgba(255,255,255,0.7)';
    for (let c of [{x:bw*0.15,y:bh*0.1,r:40},{x:bw*0.6,y:bh*0.08,r:55},{x:bw*0.8,y:bh*0.15,r:35}]) {
      battleBgCtx.beginPath();
      battleBgCtx.arc(c.x, c.y, c.r, 0, Math.PI*2);
      battleBgCtx.fill();
      battleBgCtx.beginPath();
      battleBgCtx.arc(c.x+c.r*0.6, c.y, c.r*0.7, 0, Math.PI*2);
      battleBgCtx.fill();
    }
  }

  function updateBattleHpBars() {
    const ePct = Math.max(0, enemyHp / enemyPokemon.maxHp * 100);
    const pPct = Math.max(0, playerHp / playerPokemon.maxHp * 100);
    enemyHpBar.style.width = ePct + '%';
    enemyHpBar.style.background = ePct > 50 ? 'var(--hp-green)' : ePct > 25 ? 'var(--hp-yellow)' : 'var(--hp-red)';
    playerHpBar.style.width = pPct + '%';
    playerHpBar.style.background = pPct > 50 ? 'var(--hp-green)' : pPct > 25 ? 'var(--hp-yellow)' : 'var(--hp-red)';
    playerHpTextEl.textContent = `${playerHp} / ${playerPokemon.maxHp}`;
    updateHUD();
  }

  function setBattleMsg(txt) {
    if (battleMsgEl) battleMsgEl.textContent = txt;
  }

  function updateBattleOptUI() {
    battleOpts.forEach((el, i) => el.classList.toggle('selected', i === selectedBattleOpt));
  }

  function updateMoveOptUI() {
    const items = moveList.querySelectorAll('.move-item');
    items.forEach((el, i) => el.classList.toggle('selected', i === selectedMoveOpt));
    // Update move info panel
    const moveName = playerPokemon.moves[selectedMoveOpt];
    const moveData = MOVES_DB[moveName];
    if (moveData) {
      const typeColor = TYPE_COLORS[moveData.type] || '#888';
      moveTypeEl.textContent = moveData.type;
      moveTypeEl.style.background = typeColor + '44';
      moveTypeEl.style.borderColor = typeColor;
      moveTypeEl.style.color = typeColor;
      movePpEl.textContent = `PP: ${moveData.pp}`;
    }
  }

  function handleBattleInput(key) {
    if (battleState === 'anim') return;
    if (battleState === 'result') {
      if (key === 'a' || key === 'b') continueBattle();
      return;
    }
    if (battleState === 'choose') {
      if (key === 'up'    && selectedBattleOpt > 1) selectedBattleOpt -= 2;
      if (key === 'down'  && selectedBattleOpt < 2) selectedBattleOpt += 2;
      if (key === 'left'  && selectedBattleOpt % 2 === 1) selectedBattleOpt--;
      if (key === 'right' && selectedBattleOpt % 2 === 0) selectedBattleOpt++;
      updateBattleOptUI();
      if (key === 'a') {
        const actions = ['fight','bag','pokemon','run'];
        selectBattleOpt(actions[selectedBattleOpt]);
      }
      return;
    }
    if (battleState === 'fight') {
      const moves = playerPokemon.moves;
      if (key === 'up'    && selectedMoveOpt > 1)              selectedMoveOpt -= 2;
      if (key === 'down'  && selectedMoveOpt < moves.length-1) selectedMoveOpt += 2;
      if (key === 'left'  && selectedMoveOpt % 2 === 1)        selectedMoveOpt--;
      if (key === 'right' && selectedMoveOpt % 2 === 0 && selectedMoveOpt+1 < moves.length) selectedMoveOpt++;
      updateMoveOptUI();
      if (key === 'a')   useMove(moves[selectedMoveOpt]);
      if (key === 'b') { battleState = 'choose'; moveMenu.classList.add('hidden'); setBattleMsg(`What will ${playerPokemon.name} do?`); }
    }
  }

  function selectBattleOpt(opt) {
    if (opt === 'fight') {
      battleState = 'fight';
      selectedMoveOpt = 0;
      openMoveMenu();
    } else if (opt === 'run') {
      // 75% chance to flee
      if (Math.random() < 0.75) {
        battleScreen.classList.add('hidden');
        gameState = 'overworld';
        showDialog(['Got away safely!'], () => { gameState = 'overworld'; }, '🏃', '');
      } else {
        setBattleMsg("Can't escape!");
        battleState = 'anim';
        setTimeout(() => {
          battleState = 'choose';
          setBattleMsg(`What will ${playerPokemon.name} do?`);
          updateBattleOptUI();
        }, 1200);
      }
    } else if (opt === 'bag') {
      setBattleMsg("You have no items!");
      battleState = 'result';
    } else if (opt === 'pokemon') {
      setBattleMsg(`No other POKÉMON!`);
      battleState = 'result';
    }
  }

  function openMoveMenu() {
    moveMenu.classList.remove('hidden');
    moveList.innerHTML = '';
    playerPokemon.moves.forEach((m, i) => {
      const div = document.createElement('div');
      div.className = 'move-item' + (i === 0 ? ' selected' : '');
      const mData = MOVES_DB[m];
      const typeColor = mData ? (TYPE_COLORS[mData.type] || '#888') : '#888';
      div.innerHTML = `<span style="color:${typeColor};margin-right:4px;">■</span>${m}`;
      moveList.appendChild(div);
    });
    updateMoveOptUI();
  }

  function spawnDamageNumber(dmg, x, y, color) {
    const el = document.createElement('div');
    el.className = 'dmg-number';
    el.textContent = `-${dmg}`;
    el.style.left = x + 'px';
    el.style.top  = y + 'px';
    el.style.color = color || '#ff4040';
    document.getElementById('game-wrap').appendChild(el);
    setTimeout(() => el.remove(), 1300);
  }

  function spawnXpPopup(xp) {
    const el = document.createElement('div');
    el.className = 'xp-popup';
    el.textContent = `+${xp} XP`;
    el.style.left = (W * 0.55) + 'px';
    el.style.top  = (H * 0.62) + 'px';
    document.getElementById('game-wrap').appendChild(el);
    setTimeout(() => el.remove(), 1600);
  }

  function shakeElement(el) {
    el.classList.remove('shake-enemy', 'shake-player');
    void el.offsetWidth; // reflow
    el.classList.add('shake-enemy');
    setTimeout(() => el.classList.remove('shake-enemy'), 450);
  }

  function calcDamage(attacker, moveName, defender) {
    const move = MOVES_DB[moveName];
    if (!move || move.power === 0) return 0;
    const base = move.power;
    const atkStat = attacker.atk || 10;
    const defStat = defender.def || 8;
    const variance = 0.85 + Math.random() * 0.15;
    let dmg = Math.max(1, Math.round((base * atkStat / defStat * variance) * 0.6));
    // Critical hit (1/16 chance)
    if (Math.random() < 0.0625) {
      dmg = Math.floor(dmg * 1.5);
      setTimeout(() => setBattleMsg('Critical hit!'), 600);
    }
    return dmg;
  }

  function useMove(moveName) {
    moveMenu.classList.add('hidden');
    battleState = 'anim';

    const move = MOVES_DB[moveName] || { power: 10, type: 'NORMAL', pp: 35, cat: 'physical' };
    const dmg = calcDamage(playerPokemon, moveName, enemyPokemon);

    enemyHp = Math.max(0, enemyHp - dmg);
    if (dmg > 0) {
      shakeElement(document.getElementById('enemy-sprite-wrap'));
      spawnDamageNumber(dmg, W * 0.6, H * 0.25, '#ffdd44');
    }
    updateBattleHpBars();

    if (dmg > 0) {
      setBattleMsg(`${playerPokemon.name} used\n${moveName}!`);
    } else {
      setBattleMsg(`${playerPokemon.name} used\n${moveName}!\nBut it had no effect...`);
    }

    setTimeout(() => {
      if (enemyHp <= 0) {
        const xpGain = Math.floor(enemyPokemon.xpYield * enemyPokemon.level / 7);
        playerXp += xpGain;
        spawnXpPopup(xpGain);
        setBattleMsg(`Wild ${enemyPokemon.name}\nfainted!\n+${xpGain} EXP. Points`);
        wins++;
        document.getElementById('hud-wins-num').textContent = wins;
        // Update XP bar
        const xpPct = Math.min(100, (playerXp / playerXpNext) * 100);
        if (playerXpBar) playerXpBar.style.width = xpPct + '%';
        // Level up check
        if (playerXp >= playerXpNext) {
          playerXp -= playerXpNext;
          playerXpNext = Math.floor(playerXpNext * 1.5);
          playerPokemon.level++;
          const hpGain = Math.floor(Math.random() * 3) + 2;
          playerPokemon.maxHp += hpGain;
          playerHp = Math.min(playerHp + hpGain, playerPokemon.maxHp);
          playerPokemon.atk += Math.floor(Math.random() * 2);
          setTimeout(() => {
            setBattleMsg(`${playerPokemon.name} grew to\nLv.${playerPokemon.level}!`);
            playerLevelEl.textContent = `Lv.${playerPokemon.level}`;
            updateBattleHpBars();
          }, 1400);
        }
        battleState = 'result';
        return;
      }

      // Enemy turn
      const eMoves = enemyPokemon.moves.filter(m => (MOVES_DB[m]?.power || 0) > 0);
      const eMove = eMoves.length ? eMoves[Math.floor(Math.random()*eMoves.length)] : enemyPokemon.moves[0];
      const eDmg = calcDamage(enemyPokemon, eMove, playerPokemon);

      playerHp = Math.max(0, playerHp - eDmg);
      if (eDmg > 0) {
        shakeElement(document.getElementById('player-sprite-wrap'));
        spawnDamageNumber(eDmg, W * 0.25, H * 0.58, '#ff6060');
      }
      updateBattleHpBars();
      setBattleMsg(`${enemyPokemon.name} used\n${eMove}!`);

      if (playerHp <= 0) {
        battleState = 'result';
        setTimeout(() => {
          setBattleMsg(`${playerPokemon.name} fainted!\nHealed at POKÉMON CENTER...`);
          playerHp = playerPokemon.maxHp;
          updateBattleHpBars();
        }, 1100);
        return;
      }

      setTimeout(() => {
        battleState = 'choose';
        setBattleMsg(`What will ${playerPokemon.name} do?`);
        updateBattleOptUI();
      }, 1300);
    }, 1100);
  }

  function continueBattle() {
    if (playerHp <= 0) { playerHp = playerPokemon.maxHp; updateBattleHpBars(); }
    battleScreen.classList.add('hidden');
    gameState = 'overworld';
    battleState = 'choose';
    updateHUD();
  }

  // ─── START MENU ───────────────────────────────────────────
  const startMenuEl = document.getElementById('start-menu');
  const menuItems   = document.querySelectorAll('.menu-item');

  function openMenu() {
    gameState = 'menu';
    selectedMenuOpt = 0;
    updateMenuUI();
    startMenuEl.classList.remove('hidden');
  }

  function closeMenu() {
    startMenuEl.classList.add('hidden');
    gameState = 'overworld';
  }

  function updateMenuUI() {
    menuItems.forEach((el, i) => el.classList.toggle('selected', i === selectedMenuOpt));
  }

  function handleMenuInput(key) {
    if (key === 'up'    && selectedMenuOpt > 0)                selectedMenuOpt--;
    if (key === 'down'  && selectedMenuOpt < menuItems.length-1) selectedMenuOpt++;
    if (key === 'b' || key === 'start') { closeMenu(); return; }
    updateMenuUI();
    if (key === 'a') {
      const action = menuItems[selectedMenuOpt].dataset.action;
      if (action === 'pokemon') {
        closeMenu();
        openPokemonPanel();
      } else if (action === 'bag') {
        closeMenu();
        showDialog(['Your bag is empty.\nVisit the POKÉ MART\nto buy items!'], () => { gameState = 'overworld'; }, '🎒', 'BAG');
      } else if (action === 'save') {
        closeMenu();
        const saveData = { name: player.name, pokemon: playerPokemon.name, hp: playerHp, xp: playerXp, wins, steps, level: playerPokemon.level };
        try { localStorage.setItem('pokeSave', JSON.stringify(saveData)); } catch(e) {}
        showDialog(['Game progress saved!\n(POKÉMON RED FAN EDITION)'], () => { gameState = 'overworld'; }, '💾', 'SAVE');
      } else if (action === 'options') {
        closeMenu();
        showDialog([
          'SPEED: FAST\nTEXT: NORMAL\nBATTLE SCENE: ON',
          'No changes available\nin this demo version.'
        ], () => { gameState = 'overworld'; }, '⚙', 'OPTIONS');
      } else if (action === 'quit') {
        closeMenu();
        document.getElementById('intro-screen').classList.remove('hidden');
        document.getElementById('game-wrap').classList.add('hidden');
        gameState = 'intro';
      }
    }
  }

  // ─── POKÉMON PANEL ────────────────────────────────────────
  const pokemonPanel = document.getElementById('pokemon-panel');

  function openPokemonPanel() {
    if (!playerPokemon) return;
    gameState = 'pokemon-panel';
    const pp = playerPokemon;
    const pct = playerHp / pp.maxHp * 100;
    const hpColor = pct > 50 ? 'var(--hp-green)' : pct > 25 ? 'var(--hp-yellow)' : 'var(--hp-red)';

    document.getElementById('pp-sprite').textContent = pp.sprite;
    document.getElementById('pp-info').innerHTML = `
      <div><span>NAME: </span>${pp.name}</div>
      <div><span>TYPE: </span>${pp.type}</div>
      <div><span>LEVEL: </span>${pp.level}</div>
      <div><span>HP: </span><span style="color:${hpColor}">${playerHp} / ${pp.maxHp}</span></div>
      <div><span>ATK: </span>${pp.atk}</div>
      <div><span>DEF: </span>${pp.def}</div>
      <div><span>EXP: </span>${playerXp} / ${playerXpNext}</div>
      <div><span>WINS: </span>${wins}</div>
    `;

    const movesEl = document.getElementById('pp-moves');
    movesEl.innerHTML = '<div style="font-size:7px;color:var(--gb-green);margin-bottom:8px;">MOVES:</div>';
    pp.moves.forEach(m => {
      const md = MOVES_DB[m];
      const tc = md ? (TYPE_COLORS[md.type] || '#888') : '#888';
      const pwr = md ? (md.power > 0 ? `PWR ${md.power}` : 'STATUS') : '—';
      const div = document.createElement('div');
      div.className = 'pp-move-tag' + (md?.power > 0 ? ' power-tag' : '');
      div.innerHTML = `<span style="color:${tc}">■</span> ${m} <span style="opacity:0.6;font-size:6px">${pwr} ${md?.type||''}</span>`;
      movesEl.appendChild(div);
    });

    pokemonPanel.classList.remove('hidden');
  }

  function closePokemonPanel() {
    pokemonPanel.classList.add('hidden');
    gameState = 'overworld';
  }

  const ppClose = document.getElementById('pokemon-panel-close');
  if (ppClose) ppClose.addEventListener('click', closePokemonPanel);

  // ─── INTRO PARTICLES ─────────────────────────────────────
  function initIntroParticles() {
    const container = document.getElementById('intro-particles');
    if (!container) return;
    for (let i = 0; i < 30; i++) {
      const p = document.createElement('div');
      p.className = 'intro-particle';
      const size = 2 + Math.random() * 5;
      p.style.cssText = `
        width:${size}px; height:${size}px;
        left:${Math.random()*100}%;
        top:${80 + Math.random()*20}%;
        animation-duration:${4 + Math.random()*8}s;
        animation-delay:${Math.random()*5}s;
        opacity:0;
      `;
      container.appendChild(p);
    }
  }

  // ─── MAIN GAME LOOP ───────────────────────────────────────
  function gameLoop() {
    frameCount++;
    if (gameState === 'overworld' || gameState === 'dialog' || gameState === 'menu' || gameState === 'pokemon-panel') {
      ctx.clearRect(0, 0, W, H);
      updateMovement();
      updateCamera();
      drawOverworld();
    }
    requestAnimationFrame(gameLoop);
  }

  // ─── KEYBOARD INTRO SHORTCUT ──────────────────────────────
  document.addEventListener('keydown', e => {
    if (e.key === 'Enter' && gameState === 'intro') {
      startGame();
    }
  });

  // ─── LOAD SAVE (optional) ─────────────────────────────────
  function tryLoadSave() {
    try {
      const raw = localStorage.getItem('pokeSave');
      if (!raw) return false;
      const save = JSON.parse(raw);
      return save;
    } catch(e) { return false; }
  }

  // ─── INIT ─────────────────────────────────────────────────
  initIntroParticles();
  resize();
  gameLoop();

  // Attempt to pre-load save info for display
  const savedGame = tryLoadSave();
  if (savedGame) {
    const promptEl = document.getElementById('intro-prompt');
    if (promptEl) promptEl.textContent = `— PRESS ENTER · SAVE: ${savedGame.name} Lv.${savedGame.level} —`;
  }

  // Random weather on load
  const weathers = ['clear','clear','clear','rain','snow','clear'];
  weather = weathers[Math.floor(Math.random()*weathers.length)];
  if (weather !== 'clear') initWeather();

})();
