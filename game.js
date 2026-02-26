// ══════════════════════════════════════════════════════════════════════
//  POKÉMON FAN EDITION · game.js v3.0
//  4 Towns · Fixed Battle · Proper Collision · Fire Red Style
// ══════════════════════════════════════════════════════════════════════
(function () {
  'use strict';

  // ─── CANVAS ──────────────────────────────────────────────────────────
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  const battleBgCanvas = document.getElementById('battleBgCanvas');
  const battleBgCtx = battleBgCanvas && battleBgCanvas.getContext('2d');
  const battleFxCanvas = document.getElementById('battleFxCanvas');
  const battleFxCtx = battleFxCanvas && battleFxCanvas.getContext('2d');
  const enemySpCanvas = document.getElementById('enemySpriteCanvas');
  const enemySpCtx = enemySpCanvas && enemySpCanvas.getContext('2d');
  const playerSpCanvas = document.getElementById('playerSpriteCanvas');
  const playerSpCtx = playerSpCanvas && playerSpCanvas.getContext('2d');
  const minimapCanvas = document.getElementById('minimapCanvas');
  const minimapCtx = minimapCanvas && minimapCanvas.getContext('2d');
  const introBgCanvas = document.getElementById('introBgCanvas');
  const introBgCtx = introBgCanvas && introBgCanvas.getContext('2d');

  let W = 0, H = 0, TILE = 0;
  function resize() {
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight;
    if (battleBgCanvas) { battleBgCanvas.width = W; battleBgCanvas.height = H; }
    if (battleFxCanvas) { battleFxCanvas.width = W; battleFxCanvas.height = H; }
    if (introBgCanvas) { introBgCanvas.width = W; introBgCanvas.height = H; }
    TILE = Math.max(24, Math.floor(Math.min(W, H) / 18));
    if (introBgCtx && gameState === 'intro') drawIntroStars(introBgCtx, W, H);
    if (gameState !== 'intro' && gameState !== 'starter') updateCamera();
  }
  window.addEventListener('resize', resize);

  // ─── PALETTE ─────────────────────────────────────────────────────────
  const C = {
    bg: '#78b838', dark: '#0f380f', mid: '#306230', light: '#8bac0f',
    white: '#e0f8d0', path: '#e0c870', pathD: '#c8aa50',
    water: '#4090d8', waterL: '#70b8f8', waterD: '#2858a8',
    tree: '#285818', treeMid: '#386828', treeTop: '#204810',
    red: '#cc2200', flower: '#ff6090', sand: '#d4c090',
    roofRed: '#d04040', roofBrown: '#8b5a2b',
    wallCream: '#f0e8b0', wallGray: '#c0c0a8',
    doorBrown: '#804020', windowBlue: '#88d0f8',
    pcRed: '#e04848', pcWhite: '#f8f0f0',
    martBlue: '#3070c0', martLight: '#7ab0e0',
    stoneGray: '#9090a0', stoneDark: '#505060',
  };

  // ─── TILE TYPES ──────────────────────────────────────────────────────
  const T = {
    GRASS: 0, TALL: 1, TREE: 2, PATH: 3, WATER: 4,
    HOUSE: 5, SIGN: 6, WALL: 7, FLOWER: 8, SAND: 9,
    FENCE: 10, POKE_CENTER: 11, MART: 12, NPC: 13,
    CAVE: 14, BRIDGE: 15, LEDGE: 16, MOUNTAIN: 17,
    HOUSE2: 18, HOUSE3: 19, GYM: 20, TREE_TOP: 21,
    DOOR: 22, PATH_DARK: 23, WATER_EDGE: 24, STONE: 25,
  };

  // ─── MAP ─────────────────────────────────────────────────────────────
  // Each character = one tile. Map is 48 wide × 50 tall.
  // Read left-to-right, top-to-bottom.
  //
  // Key:
  //  T = tree (blocked)      . = grass (walkable)
  //  # = wall (blocked)      ~ = water (blocked)
  //  P = path                t = tall grass (encounters)
  //  H = house (red roof)    h = house2 (blue roof)
  //  L = lab/house3 (brown)  G = gym (purple roof)
  //  C = pokémon center      M = poké mart
  //  D = door                S = sign
  //  F = flower              f = fence
  //  B = bridge              ^ = ledge (jump down only)
  //  V = cave entrance       _ = water edge (path over water)
  //
  // Layout (48×50):
  //  rows  0-11  : VIRIDIAN CITY
  //  rows 12-22  : ROUTE 1 (connecting path)
  //  rows 23-37  : PALLET TOWN
  //  rows 38-49  : SOUTH WATER (Route 21 placeholder)
  //
  // Columns:
  //  cols  0- 5  : west border
  //  cols  6-19  : VIRIDIAN / ROUTE 1 / PALLET
  //  cols 20-25  : east border / Route 2 stub
  //
  // NOTE: This first build is intentionally SMALL and CORRECT.
  // Pallet Town is at the bottom. Viridian City at the top.
  // Route 1 connects them through the middle.
  // All buildings are solid blocks — no procedural math.

  const MW = 28, MH = 50;

  // prettier-ignore
  const MAP_STR = [
  //0         1         2
  //0123456789012345678901234567
  'TTTTTTTTTTTTTTTTTTTTTTTTTTTT', // row 0
  'TCCCCCC.......MMMMMMM.TTTТTT', // row 1  (Viridian: PC left, Mart right)
  'T######.......#######.TTTTTT', // row 2
  'T######D.....D#######.TTTTTT', // row 3
  'T......PPPPPPP......STTTTТTT', // row 4  (horizontal path)
  'T...S..PPPPPPP......STTTTТTT', // row 5
  'TGGGGGG.......HHHHHHH.TTTTTT', // row 6  (Viridian: Gym left, House right)
  'T######.......#######.TTTTTT', // row 7
  'T######D.....D#######.TTTTTT', // row 8
  'T......PPPPPPP............TT', // row 9
  'T......PPPPPPP............TT', // row 10
  'TTTTTTTTTTPPPTTTTTTTTTTTTTTT', // row 11 - south wall of Viridian
  'TTTTTTTTT.PPP.TTTTTTTTTTTTTT', // row 12 - route 1 begins
  'TTTTTTTT..PPP..TTTTTTTTTTTTT', // row 13
  'T.......t.PPP.t...........TT', // row 14
  'T.......t.PPP.t...........TT', // row 15
  'T.......t.PPP.t...........TT', // row 16
  'T......StSPPP.t...........TT', // row 17 sign on east side
  'T.......t.PPP.t...........TT', // row 18
  'T.......t.PPP.t...........TT', // row 19
  'T.......t.PPP.t...........TT', // row 20
  '^^^^^^^^^^PPP^^^^^^^^^^^^^TT', // row 21 ledge
  'T.........PPP.............TT', // row 22
  'T.......t.PPP.t...........TT', // row 23
  'T.......t.PPP.t...........TT', // row 24
  'T.......t.PPP.t...........TT', // row 25
  'T.......t.PPP.t...........TT', // row 26
  'T.......t.PPP.t...........TT', // row 27
  'T.......t.PPP.t...........TT', // row 28
  'T......StSPPP.t...........TT', // row 29 sign
  'T.........PPP.............TT', // row 30
  'TTTTTTTT.TPPPTTTTTTTTTTTTTTT', // row 31 - pallet town north wall
  'T.......PPPPPP............TT', // row 32 - pallet entry path
  'T.HHHHH.PPPPPP.hhhhh......TT', // row 33 player house, rival house
  'T.#####.PPPPPP.#####......TT', // row 34
  'T.#####.PPPPPP.#####......TT', // row 35
  'T.##D##.PPPPPP.##D##......TT', // row 36 doors
  'T.......PPPPPP............TT', // row 37
  'TFFFFFFPPPPPPPPFFFFFFFFFFF.T', // row 38 fence row
  'T......PPPPPPPP...........TT', // row 39 - path widens in Pallet
  'T.LLLLLLLLLL....hhhhh.....TT', // row 40 oak lab (wide), small house
  'T.##########....#####.....TT', // row 41
  'T.##########....#####.....TT', // row 42
  'T.##########....##D##.....TT', // row 43
  'T.####D#####....FF.FF.....TT', // row 44 lab door
  'T..S.........S............TT', // row 45 signs
  'T..FFF.....FFF............TT', // row 46 flower patches
  'T..FFF.....FFF............TT', // row 47
  'T~~~~~~~~~~~~~~~~~~~~~~~~~TT', // row 48 water south
  'TTTTTTTTTTTTTTTTTTTTTTTTTTTT', // row 49
  ];

  // character → tile type
  const CHAR_TO_TILE = {
    'T': T.TREE,    '.': T.GRASS,  '#': T.WALL,   '~': T.WATER,
    'P': T.PATH,    't': T.TALL,   'H': T.HOUSE,  'h': T.HOUSE2,
    'L': T.HOUSE3,  'G': T.GYM,   'C': T.POKE_CENTER, 'M': T.MART,
    'D': T.DOOR,    'S': T.SIGN,   'F': T.FLOWER, 'f': T.FENCE,
    'B': T.BRIDGE,  '^': T.LEDGE,  'V': T.CAVE,   '_': T.BRIDGE,
    ' ': T.GRASS,
  };

  // Parse the string map into a flat Uint8Array
  const MAP = new Uint8Array(MW * MH);
  for (let row = 0; row < MH; row++) {
    const line = MAP_STR[row] || '';
    for (let col = 0; col < MW; col++) {
      const ch = line[col] || 'T';
      MAP[row * MW + col] = CHAR_TO_TILE[ch] ?? T.WALL;
    }
  }

  function getTile(tx, ty) {
    if (tx < 0 || ty < 0 || tx >= MW || ty >= MH) return T.WALL;
    return MAP[ty * MW + tx];
  }

  // ─── COLLISION ───────────────────────────────────────────────────────
  const BLOCKED_TILES = new Set([
    T.TREE, T.WALL, T.WATER, T.FENCE,
    T.HOUSE, T.HOUSE2, T.HOUSE3, T.GYM,
    T.POKE_CENTER, T.MART, T.CAVE, T.MOUNTAIN, T.STONE,
  ]);
  // Tiles you can interact with but not walk on
  const INTERACT_TILES = new Set([
    T.POKE_CENTER, T.MART, T.GYM, T.HOUSE, T.HOUSE2, T.HOUSE3,
    T.DOOR, T.SIGN, T.CAVE,
  ]);

  function isBlocked(tx, ty) {
    const tile = getTile(tx, ty);
    if (BLOCKED_TILES.has(tile)) return true;
    for (const npc of currentNPCs) {
      if (!npc.defeated && npc.tx === tx && npc.ty === ty) return true;
    }
    return false;
  }

  // ─── SIGNS & LOCATIONS ───────────────────────────────────────────────
  // Key format: 'col-row'  (x-y in tile coords)
  const SIGNS = {
    // Viridian City signs (rows 4-5, col 13 based on map)
    '13-4':  'VIRIDIAN CITY\nEver green and fresh.\nPop. 12',
    '13-5':  'VIRIDIAN GYM →\nGym Leader: ???\nMystery specialist.',
    // Route 1 signs (col 10, rows 17 and 29)
    '10-17': 'ROUTE 1\nWild Pokémon live\nin the TALL GRASS!',
    '10-29': 'PALLET TOWN ↓\nHome of PROF. OAK\nRoute 1 — stay alert!',
    // Pallet Town signs (rows 45, cols 3 and 14)
    '3-45':  'PALLET TOWN\nA tranquil setting of\nrustic pursuit.\nPop. 5',
    '14-45': 'ROUTE 1 ↑\nViridian City is\n3km to the north.',
  };

  // ─── NPC DATABASE ─────────────────────────────────────────────────────
  // Positions match the new 28×50 character map above.
  // Viridian City: rows 0-10.  Route 1: rows 12-30.  Pallet: rows 31-47.
  const NPC_DEFS = [
    // ── VIRIDIAN CITY (rows 0-10) ──
    { id: 'HIKER_VIR',   tx:10, ty:4,  emoji:'🧓', name:'HIKER',      area:'viridian',
      dialog:["VIRIDIAN GYM is\nclosed for now...", "No one knows who\nthe Gym Leader is!", "Train hard first!"] },
    { id: 'GIRL_VIR',    tx:18, ty:4,  emoji:'👧', name:'GIRL',       area:'viridian',
      dialog:["The POKÉ MART\nhas great items!", "Stock up on\nPOKÉ BALLS!"] },
    { id: 'TRAINER_VIR', tx:20, ty:9,  emoji:'👦', name:'BUG CATCHER', area:'viridian', trainer:true,
      dialog:["Bug types are\nthe BEST!", "Prove me wrong!"], pokemon:'CATERPIE', level:5 },
    { id: 'OLD_VIR',     tx:9,  ty:9,  emoji:'👴', name:'OLD FISHER',  area:'viridian',
      dialog:["I fish every day\nfor MAGIKARP here.", "Weak... but it\nbecomes GYARADOS!", "Incredible!"] },
    // ── ROUTE 1 (rows 12-30) ──
    { id: 'LASS_R1',     tx:15, ty:18, emoji:'🧒', name:'LASS',        area:'route1',
      dialog:["I love PIDGEY!\nThey fly so high~", "The tall grass\nis full of Pokémon!"] },
    { id: 'TRAINER_R1',  tx:10, ty:25, emoji:'🧑', name:'YOUNGSTER JOE', area:'route1', trainer:true,
      dialog:["Hey! I bet my\nSHORTS are comfy!", "Battle me!"], pokemon:'RATTATA', level:4 },
    // ── PALLET TOWN (rows 31-47) ──
    { id: 'GIRL_PALLET', tx:5,  ty:37, emoji:'👧', name:'GIRL',        area:'pallet',
      dialog:["My dad is away\nat Viridian City...", "He works for\nPROF. OAK!", "Stay safe out there!"] },
    { id: 'BOY_PALLET',  tx:18, ty:37, emoji:'👦', name:'RIVAL BOY',   area:'pallet',
      dialog:["Prof. OAK gave\nus starter Pokémon!", "I picked BULBASAUR!\nIt's the strongest!", "Try to keep up!"] },
    { id: 'OLD_PALLET',  tx:10, ty:42, emoji:'👴', name:'OLD MAN',     area:'pallet',
      dialog:["I used to be a\nPokémon trainer!", "The POKÉMON CENTER\nin Viridian is free.", "Use it often!"] },
  ];

  // Location zones — based on new 28×50 map
  // Viridian: rows 0-10.  Route 1: rows 12-30.  Pallet: rows 31-47.  Water: rows 48+
  function getLocationName(tx, ty) {
    if (ty <= 10) return 'VIRIDIAN CITY';
    if (ty <= 30) return 'ROUTE 1';
    if (ty <= 47) return 'PALLET TOWN';
    return 'SOUTH WATERS';
  }

  // Wild Pokémon by area
  const WILD_POOLS = {
    viridian:  ['PIDGEY','RATTATA','JIGGLYPUFF','CATERPIE'],
    route1:    ['PIDGEY','RATTATA','CATERPIE','WEEDLE'],
    pallet:    ['RATTATA','PIDGEY'],
    water:     ['MAGIKARP','MAGIKARP','PSYDUCK'],
  };

  function getWildPool(tx, ty) {
    const loc = getLocationName(tx, ty);
    if (loc === 'VIRIDIAN CITY') return WILD_POOLS.viridian;
    if (loc === 'ROUTE 1')       return WILD_POOLS.route1;
    return WILD_POOLS.pallet;
  }

  // ─── POKÉMON DATABASE ─────────────────────────────────────────────
  const POKEMON = {
    BULBASAUR:   { name:'BULBASAUR',  emoji:'🌱', type:['GRASS','POISON'], maxHp:22, atk:9,  def:9,  spd:7,  moves:['TACKLE','VINE WHIP','GROWL','LEECH SEED'],     xpY:64,  evolveAt:16, evolveTo:'IVYSAUR',    desc:'A seed Pokémon. The bulb grows as it evolves.' },
    IVYSAUR:     { name:'IVYSAUR',    emoji:'🌿', type:['GRASS','POISON'], maxHp:32, atk:14, def:13, spd:9,  moves:['VINE WHIP','RAZOR LEAF','TACKLE','LEECH SEED'],xpY:142, evolveAt:32, evolveTo:'VENUSAUR',   desc:'The bud on its back blossoms before evolving.' },
    VENUSAUR:    { name:'VENUSAUR',   emoji:'🌺', type:['GRASS','POISON'], maxHp:50, atk:20, def:18, spd:12, moves:['RAZOR LEAF','SOLAR BEAM','TACKLE','LEECH SEED'],xpY:281, desc:'Its flower aroma soothes all emotions.' },
    CHARMANDER:  { name:'CHARMANDER',emoji:'🔥', type:['FIRE'],           maxHp:18, atk:12, def:6,  spd:10, moves:['SCRATCH','EMBER','GROWL','TAIL WHIP'],          xpY:62,  evolveAt:16, evolveTo:'CHARMELEON', desc:'Flame on tail indicates life force.' },
    CHARMELEON:  { name:'CHARMELEON',emoji:'🦎', type:['FIRE'],           maxHp:28, atk:18, def:10, spd:14, moves:['SCRATCH','EMBER','SLASH','DRAGON RAGE'],        xpY:142, evolveAt:36, evolveTo:'CHARIZARD',  desc:'Sharp claws, lashes tail powerfully.' },
    CHARIZARD:   { name:'CHARIZARD', emoji:'🐉', type:['FIRE','FLYING'],  maxHp:45, atk:28, def:16, spd:20, moves:['SLASH','FLAMETHROWER','DRAGON RAGE','FLY'],     xpY:266, desc:'Breathes fire hot enough to melt boulders.' },
    SQUIRTLE:    { name:'SQUIRTLE',  emoji:'🐢', type:['WATER'],          maxHp:20, atk:10, def:11, spd:8,  moves:['TACKLE','WATER GUN','TAIL WHIP','WITHDRAW'],    xpY:65,  evolveAt:16, evolveTo:'WARTORTLE',  desc:'Shell hardens after withdrawal.' },
    WARTORTLE:   { name:'WARTORTLE', emoji:'🌊', type:['WATER'],          maxHp:30, atk:15, def:16, spd:11, moves:['WATER GUN','BITE','RAPID SPIN','SKULL BASH'],   xpY:142, evolveAt:36, evolveTo:'BLASTOISE',  desc:'Its fluffy tail sweeps mystically.' },
    BLASTOISE:   { name:'BLASTOISE', emoji:'💧', type:['WATER'],          maxHp:48, atk:22, def:22, spd:14, moves:['HYDRO PUMP','BITE','RAPID SPIN','SKULL BASH'],  xpY:265, desc:'Water jets from shell pierce steel.' },
    PIKACHU:     { name:'PIKACHU',   emoji:'⚡', type:['ELECTRIC'],       maxHp:16, atk:14, def:6,  spd:14, moves:['THUNDER SHOCK','QUICK ATK','GROWL','TAIL WHIP'],xpY:82,  desc:'Stores electricity in cheek pouches.' },
    PIDGEY:      { name:'PIDGEY',    emoji:'🐦', type:['NORMAL','FLYING'],maxHp:14, atk:7,  def:5,  spd:9,  moves:['TACKLE','GUST','SAND-ATTACK'],                 xpY:55,  evolveAt:18, evolveTo:'PIDGEOTTO',  desc:'Very docile. Excellent flier.' },
    PIDGEOTTO:   { name:'PIDGEOTTO', emoji:'🦅', type:['NORMAL','FLYING'],maxHp:22, atk:12, def:9,  spd:14, moves:['GUST','QUICK ATK','SAND-ATTACK','WING ATTACK'], xpY:113, desc:'Territorial. Blasts enemies away with wings.' },
    RATTATA:     { name:'RATTATA',   emoji:'🐭', type:['NORMAL'],         maxHp:12, atk:8,  def:4,  spd:11, moves:['TACKLE','QUICK ATK','BITE'],                   xpY:57,  evolveAt:20, evolveTo:'RATICATE',   desc:'Gnaws with powerful teeth.' },
    RATICATE:    { name:'RATICATE',  emoji:'🐀', type:['NORMAL'],         maxHp:20, atk:14, def:8,  spd:16, moves:['QUICK ATK','BITE','HYPER FANG','SCARY FACE'],  xpY:116, desc:'Whiskers sense air movements.' },
    CATERPIE:    { name:'CATERPIE',  emoji:'🐛', type:['BUG'],            maxHp:10, atk:5,  def:7,  spd:4,  moves:['TACKLE','STRING SHOT'],                        xpY:53,  evolveAt:7,  evolveTo:'METAPOD',    desc:'Voracious eater that devours leaves.' },
    METAPOD:     { name:'METAPOD',   emoji:'🥚', type:['BUG'],            maxHp:14, atk:4,  def:14, spd:2,  moves:['HARDEN','TACKLE'],                             xpY:72,  evolveAt:10, evolveTo:'BUTTERFREE', desc:'Hard shell. Preparing to evolve.' },
    BUTTERFREE:  { name:'BUTTERFREE',emoji:'🦋', type:['BUG','FLYING'],   maxHp:20, atk:9,  def:8,  spd:12, moves:['CONFUSION','GUST','TACKLE','SLEEP POWDER'],    xpY:160, desc:'Covered in poisonous scales.' },
    WEEDLE:      { name:'WEEDLE',    emoji:'🐝', type:['BUG','POISON'],   maxHp:10, atk:7,  def:5,  spd:6,  moves:['POISON STING','STRING SHOT'],                  xpY:52,  evolveAt:7,  evolveTo:'KAKUNA',     desc:'Venomous needles. Avoid!' },
    KAKUNA:      { name:'KAKUNA',    emoji:'🫙', type:['BUG','POISON'],   maxHp:14, atk:5,  def:14, spd:3,  moves:['HARDEN','POISON STING'],                       xpY:72,  evolveAt:10, evolveTo:'BEEDRILL',   desc:'Steel-hard shell. Awaiting evolution.' },
    BEEDRILL:    { name:'BEEDRILL',  emoji:'🐞', type:['BUG','POISON'],   maxHp:20, atk:15, def:7,  spd:14, moves:['POISON STING','TWINEEDLE','FURY ATTACK','RAGE'],xpY:159, desc:'Three poisonous stingers.' },
    ZUBAT:       { name:'ZUBAT',     emoji:'🦇', type:['POISON','FLYING'],maxHp:13, atk:7,  def:5,  spd:9,  moves:['LEECH LIFE','SUPERSONIC','BITE'],              xpY:54,  evolveAt:22, evolveTo:'GOLBAT',     desc:'No eyes. Relies on ultrasonic waves.' },
    GOLBAT:      { name:'GOLBAT',    emoji:'🦉', type:['POISON','FLYING'],maxHp:24, atk:13, def:9,  spd:15, moves:['BITE','CONFUSE RAY','WING ATTACK','LEECH LIFE'],xpY:171, desc:'Won\'t stop draining energy when full.' },
    GEODUDE:     { name:'GEODUDE',   emoji:'🪨', type:['ROCK','GROUND'],  maxHp:18, atk:10, def:16, spd:3,  moves:['TACKLE','ROCK THROW','DEFENSE CURL'],          xpY:86,  evolveAt:25, evolveTo:'GRAVELER',   desc:'Climbers mistake it for a boulder.' },
    GRAVELER:    { name:'GRAVELER',  emoji:'⛰', type:['ROCK','GROUND'],  maxHp:28, atk:16, def:22, spd:5,  moves:['ROCK THROW','EARTHQUAKE','DEFENSE CURL','SELF-DESTRUCT'],xpY:187,desc:'Falls while rolling down mountains.' },
    CLEFAIRY:    { name:'CLEFAIRY',  emoji:'🌙', type:['NORMAL','FAIRY'], maxHp:22, atk:9,  def:9,  spd:7,  moves:['POUND','GROWL','SING','DOUBLESLAP'],           xpY:68,  desc:'Believed to have come from space.' },
    JIGGLYPUFF:  { name:'JIGGLYPUFF',emoji:'🎤', type:['NORMAL','FAIRY'], maxHp:24, atk:7,  def:4,  spd:6,  moves:['TACKLE','SING','POUND','DISABLE'],             xpY:76,  desc:'Its lullaby causes deep sleep.' },
    MEOWTH:      { name:'MEOWTH',    emoji:'🐱', type:['NORMAL'],         maxHp:14, atk:9,  def:5,  spd:12, moves:['SCRATCH','BITE','GROWL','PAY DAY'],            xpY:69,  evolveAt:28, evolveTo:'PERSIAN',    desc:'Fascinated by shiny objects.' },
    PERSIAN:     { name:'PERSIAN',   emoji:'🐈', type:['NORMAL'],         maxHp:22, atk:14, def:9,  spd:18, moves:['SCRATCH','SLASH','BITE','FURY SWIPES'],        xpY:154, desc:'Extremely sharp claws.' },
    PSYDUCK:     { name:'PSYDUCK',   emoji:'🦆', type:['WATER'],          maxHp:18, atk:10, def:8,  spd:8,  moves:['SCRATCH','WATER GUN','DISABLE','CONFUSION'],   xpY:80,  evolveAt:33, evolveTo:'GOLDUCK',    desc:'Always has a headache.' },
    GOLDUCK:     { name:'GOLDUCK',   emoji:'🦅', type:['WATER'],          maxHp:28, atk:16, def:13, spd:13, moves:['WATER GUN','CONFUSION','FURY SWIPES','AMNESIA'],xpY:174, desc:'Swift, powerful swimmer.' },
    ABRA:        { name:'ABRA',      emoji:'🔮', type:['PSYCHIC'],        maxHp:12, atk:6,  def:4,  spd:16, moves:['TELEPORT','CONFUSION'],                       xpY:73,  evolveAt:16, evolveTo:'KADABRA',    desc:'Teleports to safety before danger.' },
    KADABRA:     { name:'KADABRA',   emoji:'🌀', type:['PSYCHIC'],        maxHp:18, atk:10, def:6,  spd:20, moves:['CONFUSION','PSYBEAM','DISABLE','RECOVER'],     xpY:145, desc:'Emits alpha waves causing headaches.' },
    MAGIKARP:    { name:'MAGIKARP',  emoji:'🐟', type:['WATER'],          maxHp:8,  atk:2,  def:4,  spd:10, moves:['SPLASH','TACKLE'],                            xpY:20,  evolveAt:20, evolveTo:'GYARADOS',   desc:'Nearly useless in battle.' },
    GYARADOS:    { name:'GYARADOS',  emoji:'🐲', type:['WATER','FLYING'], maxHp:48, atk:25, def:16, spd:16, moves:['BITE','TWISTER','HYDRO PUMP','DRAGON RAGE'],   xpY:214, desc:'Filled with rage. Never stops rampaging.' },
    STARYU:      { name:'STARYU',    emoji:'⭐', type:['WATER'],          maxHp:16, atk:10, def:9,  spd:15, moves:['TACKLE','WATER GUN','RAPID SPIN','MINIMIZE'],  xpY:84,  evolveAt:0,  evolveTo:null,         desc:'Glows red at night.' },
  };

  const MOVES = {
    'TACKLE':        { pwr:12, type:'NORMAL',   pp:35, acc:100, cat:'physical', desc:'A full-body tackle.' },
    'SCRATCH':       { pwr:12, type:'NORMAL',   pp:35, acc:100, cat:'physical', desc:'Scratches with claws.' },
    'POUND':         { pwr:10, type:'NORMAL',   pp:35, acc:100, cat:'physical', desc:'Pounds with forelegs.' },
    'DOUBLESLAP':    { pwr:15, type:'NORMAL',   pp:10, acc:85,  cat:'physical', desc:'Slaps 2-5 times.' },
    'WATER GUN':     { pwr:22, type:'WATER',    pp:25, acc:100, cat:'special',  desc:'Squirts water to attack.' },
    'HYDRO PUMP':    { pwr:40, type:'WATER',    pp:5,  acc:80,  cat:'special',  desc:'Huge water shot.' },
    'WITHDRAW':      { pwr:0,  type:'WATER',    pp:40, acc:100, cat:'status',   desc:'Withdraws into shell; raises DEF.' },
    'SKULL BASH':    { pwr:26, type:'NORMAL',   pp:15, acc:100, cat:'physical', desc:'Tucks head; attacks next turn.' },
    'RAPID SPIN':    { pwr:10, type:'NORMAL',   pp:40, acc:100, cat:'physical', desc:'High-speed body spin.' },
    'MINIMIZE':      { pwr:0,  type:'NORMAL',   pp:20, acc:100, cat:'status',   desc:'Minimizes body to raise EVA.' },
    'VINE WHIP':     { pwr:20, type:'GRASS',    pp:25, acc:100, cat:'physical', desc:'Strikes with slender vines.' },
    'RAZOR LEAF':    { pwr:26, type:'GRASS',    pp:25, acc:95,  cat:'physical', desc:'Sharp leaves; high crit rate.' },
    'SOLAR BEAM':    { pwr:40, type:'GRASS',    pp:10, acc:100, cat:'special',  desc:'Absorbs light then fires beam.' },
    'LEECH SEED':    { pwr:0,  type:'GRASS',    pp:10, acc:90,  cat:'status',   desc:'Plants a draining seed.' },
    'EMBER':         { pwr:22, type:'FIRE',     pp:25, acc:100, cat:'special',  desc:'Weak flame. May BURN.' },
    'FLAMETHROWER':  { pwr:36, type:'FIRE',     pp:15, acc:100, cat:'special',  desc:'Scorching fire. May BURN.' },
    'SLASH':         { pwr:28, type:'NORMAL',   pp:20, acc:100, cat:'physical', desc:'High crit-ratio slash.' },
    'DRAGON RAGE':   { pwr:30, type:'DRAGON',   pp:10, acc:100, cat:'special',  desc:'Draconic energy attack.' },
    'FLY':           { pwr:28, type:'FLYING',   pp:15, acc:95,  cat:'physical', desc:'Flies up then attacks.' },
    'THUNDER SHOCK': { pwr:20, type:'ELECTRIC', pp:30, acc:100, cat:'special',  desc:'Zaps foe. May PARALYZE.' },
    'THUNDERBOLT':   { pwr:36, type:'ELECTRIC', pp:15, acc:100, cat:'special',  desc:'Strong lightning. May PARALYZE.' },
    'GUST':          { pwr:18, type:'FLYING',   pp:35, acc:100, cat:'special',  desc:'Whirling wind attack.' },
    'WING ATTACK':   { pwr:24, type:'FLYING',   pp:35, acc:100, cat:'physical', desc:'Strikes with wings.' },
    'QUICK ATK':     { pwr:16, type:'NORMAL',   pp:30, acc:100, cat:'physical', desc:'Hits first always.' },
    'BITE':          { pwr:20, type:'DARK',     pp:25, acc:100, cat:'physical', desc:'Hard bite. May flinch.' },
    'HYPER FANG':    { pwr:26, type:'NORMAL',   pp:15, acc:90,  cat:'physical', desc:'Sharp fang attack.' },
    'FURY ATTACK':   { pwr:8,  type:'NORMAL',   pp:20, acc:85,  cat:'physical', desc:'Jabs 2-5 times.' },
    'FURY SWIPES':   { pwr:8,  type:'NORMAL',   pp:15, acc:80,  cat:'physical', desc:'Rakes foe 2-5 times.' },
    'TWINEEDLE':     { pwr:18, type:'BUG',      pp:20, acc:100, cat:'physical', desc:'Two needles. May POISON.' },
    'RAGE':          { pwr:16, type:'NORMAL',   pp:20, acc:100, cat:'physical', desc:'Boosts ATK with rage.' },
    'SCARY FACE':    { pwr:0,  type:'NORMAL',   pp:10, acc:100, cat:'status',   desc:'Sharply reduces SPD.' },
    'POISON STING':  { pwr:16, type:'POISON',   pp:35, acc:100, cat:'physical', desc:'Toxic needle. May POISON.' },
    'LEECH LIFE':    { pwr:12, type:'BUG',      pp:15, acc:100, cat:'physical', desc:'Drains blood for HP.' },
    'ROCK THROW':    { pwr:24, type:'ROCK',     pp:15, acc:90,  cat:'physical', desc:'Hurls small rocks.' },
    'EARTHQUAKE':    { pwr:40, type:'GROUND',   pp:10, acc:100, cat:'physical', desc:'Powerful ground quake.' },
    'SELF-DESTRUCT': { pwr:60, type:'NORMAL',   pp:5,  acc:100, cat:'physical', desc:'Explosion! User faints.' },
    'CONFUSION':     { pwr:22, type:'PSYCHIC',  pp:25, acc:100, cat:'special',  desc:'Telekinetic. May confuse.' },
    'PSYBEAM':       { pwr:30, type:'PSYCHIC',  pp:20, acc:100, cat:'special',  desc:'Peculiar ray. May confuse.' },
    'CONFUSE RAY':   { pwr:0,  type:'GHOST',    pp:10, acc:100, cat:'status',   desc:'Confuses the target.' },
    'BODY SLAM':     { pwr:30, type:'NORMAL',   pp:15, acc:100, cat:'physical', desc:'May PARALYZE.' },
    'AMNESIA':       { pwr:0,  type:'PSYCHIC',  pp:20, acc:100, cat:'status',   desc:'Sharply raises Sp. Def.' },
    'REST':          { pwr:0,  type:'PSYCHIC',  pp:10, acc:100, cat:'status',   desc:'Sleep to restore HP.' },
    'TWISTER':       { pwr:20, type:'DRAGON',   pp:20, acc:100, cat:'special',  desc:'Vicious tornado.' },
    'SPLASH':        { pwr:0,  type:'WATER',    pp:40, acc:100, cat:'status',   desc:'Nothing happens.' },
    'HARDEN':        { pwr:0,  type:'NORMAL',   pp:30, acc:100, cat:'status',   desc:'Raises DEF.' },
    'SLEEP POWDER':  { pwr:0,  type:'GRASS',    pp:15, acc:75,  cat:'status',   desc:'Scatters sleep powder.' },
    'PAY DAY':       { pwr:18, type:'NORMAL',   pp:20, acc:100, cat:'physical', desc:'Earn money after battle!' },
    'GROWL':         { pwr:0,  type:'NORMAL',   pp:40, acc:100, cat:'status',   desc:'Lowers foe\'s ATK.' },
    'TAIL WHIP':     { pwr:0,  type:'NORMAL',   pp:30, acc:100, cat:'status',   desc:'Lowers foe\'s DEF.' },
    'SING':          { pwr:0,  type:'NORMAL',   pp:15, acc:55,  cat:'status',   desc:'Puts foe to sleep.' },
    'SUPERSONIC':    { pwr:0,  type:'NORMAL',   pp:20, acc:55,  cat:'status',   desc:'Confuses foe.' },
    'SAND-ATTACK':   { pwr:0,  type:'NORMAL',   pp:15, acc:100, cat:'status',   desc:'Reduces foe accuracy.' },
    'STRING SHOT':   { pwr:0,  type:'BUG',      pp:40, acc:95,  cat:'status',   desc:'Sprays string; lowers SPD.' },
    'DEFENSE CURL':  { pwr:0,  type:'NORMAL',   pp:40, acc:100, cat:'status',   desc:'Raises DEF.' },
    'DISABLE':       { pwr:0,  type:'NORMAL',   pp:20, acc:100, cat:'status',   desc:'Disables last move.' },
    'TELEPORT':      { pwr:0,  type:'PSYCHIC',  pp:20, acc:100, cat:'status',   desc:'Switches out.' },
    'RECOVER':       { pwr:0,  type:'NORMAL',   pp:20, acc:100, cat:'status',   desc:'Restores half max HP.' },
  };

  const TYPE_EFF = {
    FIRE:     { GRASS:2, ICE:2, BUG:2, STEEL:2,       WATER:.5, ROCK:.5, FIRE:.5, DRAGON:.5 },
    WATER:    { FIRE:2, GROUND:2, ROCK:2,              GRASS:.5, WATER:.5, DRAGON:.5 },
    GRASS:    { WATER:2, GROUND:2, ROCK:2,             FIRE:.5, GRASS:.5, POISON:.5, FLYING:.5, BUG:.5, DRAGON:.5, STEEL:.5 },
    ELECTRIC: { WATER:2, FLYING:2,                     GRASS:.5, ELECTRIC:.5, DRAGON:.5, GROUND:0 },
    NORMAL:   { ROCK:.5, STEEL:.5,                     GHOST:0 },
    FLYING:   { GRASS:2, FIGHTING:2, BUG:2,            ROCK:.5, STEEL:.5, ELECTRIC:.5 },
    ROCK:     { FIRE:2, ICE:2, FLYING:2, BUG:2,        FIGHTING:.5, GROUND:.5, STEEL:.5 },
    POISON:   { GRASS:2, FAIRY:2,                      POISON:.5, GROUND:.5, ROCK:.5, GHOST:.5, STEEL:0 },
    BUG:      { GRASS:2, PSYCHIC:2, DARK:2,            FIRE:.5, FIGHTING:.5, FLYING:.5, GHOST:.5, STEEL:.5, FAIRY:.5 },
    DARK:     { PSYCHIC:2, GHOST:2,                    FIGHTING:.5, DARK:.5, FAIRY:.5 },
    PSYCHIC:  { FIGHTING:2, POISON:2,                  PSYCHIC:.5, DARK:0, STEEL:.5 },
    DRAGON:   { DRAGON:2,                              STEEL:.5, FAIRY:0 },
    GROUND:   { FIRE:2, ELECTRIC:2, POISON:2, ROCK:2, STEEL:2, FLYING:0 },
    ICE:      { GRASS:2, GROUND:2, FLYING:2, DRAGON:2, FIRE:.5, WATER:.5, ICE:.5, STEEL:.5 },
    FAIRY:    { FIGHTING:2, DARK:2, DRAGON:2,          FIRE:.5, POISON:.5, STEEL:.5 },
  };

  function typeEff(atkT, defTypes) {
    let m = 1;
    for (const dt of defTypes) m *= (TYPE_EFF[atkT]?.[dt] ?? 1);
    return m;
  }

  const TYPE_COLOR = {
    NORMAL:'#a0a080', FIRE:'#e84820', WATER:'#4888f8', GRASS:'#78c840',
    ELECTRIC:'#f8d030', BUG:'#a8b820', ROCK:'#b8a038', POISON:'#a040a0',
    FLYING:'#a890f0', DARK:'#705848', ICE:'#98d8d8', PSYCHIC:'#f85888',
    FAIRY:'#f0b6bc', GROUND:'#d8b060', GHOST:'#705898', DRAGON:'#7038f8',
    STEEL:'#b8b8d0', FIGHTING:'#c03020',
  };

  // ─── SHOP ITEMS ───────────────────────────────────────────────────
  const SHOP_ITEMS = [
    { id:'POTION',       name:'POTION',       emoji:'💊', price:300,  desc:'Restores 20 HP.',         effect:'heal20' },
    { id:'SUPER_POTION', name:'SUPER POTION', emoji:'💉', price:700,  desc:'Restores 50 HP.',         effect:'heal50' },
    { id:'FULL_RESTORE', name:'FULL RESTORE', emoji:'✨', price:3000, desc:'Fully restores HP.',      effect:'fullrestore' },
    { id:'POKEBALL',     name:'POKÉ BALL',    emoji:'⚫', price:200,  desc:'Catch wild Pokémon.',     effect:'catch' },
    { id:'GREAT_BALL',   name:'GREAT BALL',   emoji:'🔵', price:600,  desc:'Better catch rate.',      effect:'catch_great' },
    { id:'ULTRA_BALL',   name:'ULTRA BALL',   emoji:'🟡', price:1200, desc:'Even better catch rate!', effect:'catch_ultra' },
    { id:'ANTIDOTE',     name:'ANTIDOTE',     emoji:'🧪', price:100,  desc:'Cures POISON.',           effect:'cure_psn' },
    { id:'PARALYZE_HEAL',name:'PARA-HEAL',    emoji:'⚡', price:200,  desc:'Cures PARALYSIS.',        effect:'cure_prz' },
    { id:'AWAKENING',    name:'AWAKENING',    emoji:'☕', price:250,  desc:'Cures SLEEP.',            effect:'cure_slp' },
    { id:'BURN_HEAL',    name:'BURN HEAL',    emoji:'🧊', price:250,  desc:'Cures BURN.',             effect:'cure_brn' },
    { id:'FULL_HEAL',    name:'FULL HEAL',    emoji:'💫', price:600,  desc:'Cures all status.',       effect:'full_heal' },
    { id:'RARE_CANDY',   name:'RARE CANDY',   emoji:'🍬', price:4800, desc:'Raises level by 1.',      effect:'rare_candy' },
    { id:'REPEL',        name:'REPEL',        emoji:'🧴', price:350,  desc:'Repels wild Pokémon\n(100 steps).',effect:'repel' },
    { id:'ESCAPE_ROPE',  name:'ESCAPE ROPE',  emoji:'🪢', price:550,  desc:'Escape from caves.',      effect:'escape' },
  ];

  // ─── GAME STATE ───────────────────────────────────────────────────────
  let gameState = 'intro';
  let playerPoke = null;
  let playerHp = 0, playerXp = 0, playerXpNext = 100;
  let playerMoney = 500, playerBadges = 0;
  let playerBag = [];
  let playerPokedex = new Set();
  let enemyPoke = null, enemyHp = 0;
  let enemyStatus = null, playerStatus = null;
  // FIXED: Clear, well-defined battle state
  let battlePhase = 'choose'; // 'choose' | 'anim' | 'result' | 'fight' | 'bag' | 'catch'
  let selectedBOpt = 0, selectedMOpt = 0, selectedMenuOpt = 0, selectedBagOpt = 0;
  let selectedShopOpt = 0;
  let dialogQueue = [], dialogCallback = null, dialogPortrait = '💬', dialogSpeaker = '';
  let cameraX = 0, cameraY = 0;
  let steps = 0, wins = 0, frameCount = 0;
  let location = 'PALLET TOWN';
  let weather = 'clear';
  let weatherParts = [];
  let battleParts = [];
  let minimapVisible = true;
  let hintFaded = false;
  let dayTime = 0;
  let starterIdx = 1;
  let shopItem = null;
  let npcDefeated = {};
  let introBgStars = [];
  let battleStreak = 0;
  let movePP = {};
  let enemyMovePP = {};
  let leechSeedActive = false;
  let isTrainerBattle = false;
  let activeNpc = null;
  let currentNPCs = [];
  let repelSteps = 0;
  let locationLabelAlpha = 0;
  let toastTimer = null;

  const player = {
    x: 10, y: 36, px: 0, py: 0, dir: 2, moving: false, _pendingBattle: null, name: 'RED',
  };

  // ─── WEB AUDIO SFX ────────────────────────────────────────────────────
  let audioCtx = null;
  function ensureAudio() {
    if (!audioCtx) { try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) {} }
    if (audioCtx?.state === 'suspended') audioCtx.resume().catch(() => {});
  }
  function playTone(freq, dur, type = 'square', vol = 0.12, delay = 0) {
    if (!audioCtx) return;
    try {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain); gain.connect(audioCtx.destination);
      osc.type = type; osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, audioCtx.currentTime + delay);
      gain.gain.linearRampToValueAtTime(vol, audioCtx.currentTime + delay + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + delay + dur);
      osc.start(audioCtx.currentTime + delay);
      osc.stop(audioCtx.currentTime + delay + dur + 0.05);
    } catch (e) {}
  }
  function sfxStep()      { playTone(200 + Math.random() * 40, 0.04, 'square', 0.03); }
  function sfxConfirm()   { playTone(440, 0.07, 'square', 0.1); playTone(660, 0.1, 'square', 0.1, 0.07); }
  function sfxCancel()    { playTone(300, 0.06, 'square', 0.08); playTone(200, 0.08, 'square', 0.08, 0.06); }
  function sfxHit()       { playTone(180, 0.12, 'sawtooth', 0.14); playTone(120, 0.1, 'sawtooth', 0.1, 0.06); }
  function sfxSuperHit()  { playTone(280, 0.14, 'sawtooth', 0.18); playTone(200, 0.12, 'sawtooth', 0.15, 0.06); playTone(160, 0.1, 'sawtooth', 0.1, 0.12); }
  function sfxFaint()     { [500, 400, 300, 200, 150].forEach((f, i) => playTone(f, 0.1, 'square', 0.1, i * 0.1)); }
  function sfxLevelUp()   { [330, 440, 550, 660, 880, 1100].forEach((f, i) => playTone(f, 0.14, 'square', 0.13, i * 0.07)); }
  function sfxCatch()     { [440, 330, 220, 330, 440, 550].forEach((f, i) => playTone(f, 0.1, 'square', 0.1, i * 0.12)); }
  function sfxEncounter() { [200, 250, 200, 300, 400].forEach((f, i) => playTone(f, 0.08, 'sawtooth', 0.15, i * 0.06)); }
  function sfxMenu()      { playTone(330, 0.05, 'square', 0.08); }
  function sfxEvolve()    { [330, 440, 550, 660, 770, 880, 1100, 880, 660].forEach((f, i) => playTone(f, 0.15, 'square', 0.15, i * 0.09)); }
  function sfxCritical()  { playTone(880, 0.05, 'square', 0.2); playTone(660, 0.1, 'square', 0.18, 0.05); }
  function sfxHeal()      { [440, 550, 660, 770].forEach((f, i) => playTone(f, 0.1, 'sine', 0.12, i * 0.06)); }
  function sfxEscape()    { [330, 220, 110].forEach((f, i) => playTone(f, 0.1, 'sawtooth', 0.1, i * 0.08)); }

  // ─── INPUT ────────────────────────────────────────────────────────────
  const keys = {};
  const keyMap = {
    'ArrowUp': 'up', 'ArrowDown': 'down', 'ArrowLeft': 'left', 'ArrowRight': 'right',
    'w': 'up', 's': 'down', 'a': 'left', 'd': 'right',
    'z': 'A', 'x': 'B', 'Enter': 'A', 'Escape': 'B', ' ': 'start', 'm': 'map',
  };
  document.addEventListener('keydown', e => {
    const k = keyMap[e.key] ?? e.key.toLowerCase();
    if (!keys[k]) { keys[k] = true; handleInput(k); }
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) e.preventDefault();
  });
  document.addEventListener('keyup', e => {
    const k = keyMap[e.key] ?? e.key.toLowerCase();
    keys[k] = false;
  });

  function handleInput(key) {
    ensureAudio();
    if (!hintFaded && ['up', 'down', 'left', 'right'].includes(key)) {
      hintFaded = true;
      document.getElementById('controls-hint')?.classList.add('fade');
    }
    if (gameState === 'intro')         { if (key === 'A' || key === 'start') { sfxConfirm(); showStarter(); } return; }
    if (gameState === 'starter')       { handleStarterInput(key); return; }
    if (gameState === 'dialog')        { if (key === 'A' || key === 'B') { sfxConfirm(); advanceDialog(); } return; }
    if (gameState === 'battle')        { handleBattleInput(key); return; }
    if (gameState === 'menu')          { handleMenuInput(key); return; }
    if (gameState === 'pokemon-panel') { if (key === 'B' || key === 'start') closePokemonPanel(); return; }
    if (gameState === 'shop')          { handleShopInput(key); return; }
    if (gameState === 'overworld') {
      if (key === 'start') { sfxMenu(); openMenu(); }
      else if (key === 'A') { interact(); }
      else if (key === 'map') { toggleMinimap(); }
    }
  }

  // ─── INTRO ────────────────────────────────────────────────────────────
  function generateIntroStars(w, h) {
    introBgStars = Array.from({ length: 140 }, () => ({
      x: Math.random() * w, y: Math.random() * h,
      r: Math.random() * 1.8 + .3, spd: Math.random() * .3 + .1,
      twinkle: Math.random() * Math.PI * 2,
      col: Math.random() < .1 ? '#ffcc44' : Math.random() < .3 ? '#aaddff' : '#e0f8d0',
    }));
  }
  function drawIntroStars(c, w, h) {
    if (!c) return;
    c.fillStyle = 'rgba(0,0,0,.18)'; c.fillRect(0, 0, w, h);
    for (const s of introBgStars) {
      const alpha = 0.4 + 0.6 * Math.abs(Math.sin(s.twinkle));
      c.fillStyle = s.col; c.globalAlpha = alpha;
      c.beginPath(); c.arc(s.x, s.y, s.r, 0, Math.PI * 2); c.fill();
      s.twinkle += .02; s.y -= s.spd;
      if (s.y < -2) { s.y = h + 2; s.x = Math.random() * w; }
    }
    c.globalAlpha = 1;
  }

  // ─── STARTER SELECTION ────────────────────────────────────────────────
  function showStarter() {
    document.getElementById('intro-screen').classList.add('hidden');
    document.getElementById('starter-screen').classList.remove('hidden');
    gameState = 'starter';
    highlightStarterCard();
  }
  function highlightStarterCard() {
    document.querySelectorAll('.starter-card').forEach((el, i) => {
      el.classList.toggle('selected-starter', i === starterIdx);
    });
  }
  function handleStarterInput(key) {
    if (key === 'left')  { starterIdx = Math.max(0, starterIdx - 1); sfxMenu(); highlightStarterCard(); }
    if (key === 'right') { starterIdx = Math.min(2, starterIdx + 1); sfxMenu(); highlightStarterCard(); }
    if (key === 'A')     { confirmStarter(); }
  }
  document.querySelectorAll('.starter-card').forEach((el, i) => {
    el.addEventListener('click', () => {
      ensureAudio(); starterIdx = i;
      highlightStarterCard();
      setTimeout(() => confirmStarter(), 120);
    });
  });
  function confirmStarter() {
    const names = ['BULBASAUR', 'CHARMANDER', 'SQUIRTLE'];
    const chosen = names[starterIdx];
    sfxLevelUp();
    playerPoke = deepClone(POKEMON[chosen]);
    playerPoke.level = 5;
    playerHp = playerPoke.maxHp;
    playerXp = 0; playerXpNext = 100;
    steps = 0; wins = 0; battleStreak = 0;
    playerPokedex = new Set([chosen]);
    initMovePP(playerPoke);
    document.getElementById('starter-screen').classList.add('hidden');
    document.getElementById('game-wrap').classList.remove('hidden');
    gameState = 'overworld';
    resize();
    player.px = player.x * TILE; player.py = player.y * TILE;
    updateNPCsForLocation();
    updateHUD();
    showDialog([
      `You chose ${playerPoke.name}!\nA fine choice!`,
      "Visit VIRIDIAN CITY\nto the north on\nROUTE 1!",
      "Walk in TALL GRASS\nto encounter wild\nPOKÉMON!",
      "Use Z/Enter to\nconfirm, X/Esc to\ncancel. SPACE=Menu.",
      "4 towns await!\nPallet, Viridian,\nPewter, Cerulean!",
    ], () => { gameState = 'overworld'; }, '🎓', 'PROF. OAK');
  }

  // ─── UTILS ────────────────────────────────────────────────────────────
  function deepClone(o) { return JSON.parse(JSON.stringify(o)); }
  function initMovePP(poke) {
    poke.moves.forEach(m => { if (!(m in movePP)) movePP[m] = MOVES[m]?.pp || 10; });
  }

  // ─── TILE RENDERING ─────────────────────────────────────────────────
  const tileColorMap = {
    [T.GRASS]: '#78b838', [T.TALL]: '#286018', [T.TREE]: '#0f380f',
    [T.PATH]: '#e0c870', [T.PATH_DARK]: '#c8a848',
    [T.WATER]: '#3080c8', [T.WATER_EDGE]: '#4898e0',
    [T.HOUSE]: '#bf4040', [T.HOUSE2]: '#4060c0', [T.HOUSE3]: '#806020',
    [T.GYM]: '#804080', [T.POKE_CENTER]: '#e05050', [T.MART]: '#3060a0',
    [T.SIGN]: '#c8a860', [T.WALL]: '#604820',
    [T.FLOWER]: '#78b838', [T.SAND]: '#d4c080',
    [T.FENCE]: '#8b5a2b', [T.CAVE]: '#303838', [T.BRIDGE]: '#c8a040',
    [T.LEDGE]: '#a09030', [T.MOUNTAIN]: '#485868', [T.STONE]: '#484858',
    [T.DOOR]: '#804020', [T.TREE_TOP]: '#104010',
  };

  function drawTile(t, x, y, s) {
    const q = s / 8;
    ctx.fillStyle = tileColorMap[t] ?? '#787878';
    ctx.fillRect(x, y, s, s);

    switch (t) {
      case T.GRASS: {
        // Lighter green base with subtle texture
        ctx.fillStyle = '#90c848'; ctx.fillRect(x, y, s, s);
        // Grass blades
        if (frameCount % 60 < 1 || true) { // static for perf
          ctx.fillStyle = '#68a828';
          ctx.fillRect(x + q, y + 3*q, q, 3*q);
          ctx.fillRect(x + 4*q, y + 2*q, q, 4*q);
          ctx.fillRect(x + 6*q, y + 3*q, q, 3*q);
        }
        break;
      }
      case T.TALL: {
        ctx.fillStyle = '#1a4808'; ctx.fillRect(x, y, s, s);
        ctx.fillStyle = '#225010';
        ctx.fillRect(x, y, q*2, s); ctx.fillRect(x+4*q, y, q*2, s);
        ctx.fillStyle = '#2a5818';
        ctx.fillRect(x+q, y+q, q*2, s-q); ctx.fillRect(x+5*q, y, q*2, s);
        break;
      }
      case T.TREE: {
        // Fire Red style trees - darker, 3D look
        ctx.fillStyle = '#183808'; ctx.fillRect(x, y, s, s);
        ctx.fillStyle = '#245010'; ctx.fillRect(x+q, y+q, s-2*q, s-2*q);
        ctx.fillStyle = '#306818'; ctx.fillRect(x+2*q, y+q, s-4*q, s-3*q);
        ctx.fillStyle = '#3a7820'; ctx.fillRect(x+3*q, y+2*q, s-6*q, s-5*q);
        // Highlight top
        ctx.fillStyle = '#4a8828'; ctx.fillRect(x+3*q, y+2*q, 2*q, q);
        // Trunk
        ctx.fillStyle = '#604020'; ctx.fillRect(x+3*q, y+6*q, 2*q, 2*q);
        break;
      }
      case T.PATH: {
        ctx.fillStyle = '#e8d078'; ctx.fillRect(x, y, s, s);
        // Subtle stone texture
        ctx.fillStyle = '#d8c060';
        ctx.fillRect(x, y, q, q); ctx.fillRect(x+4*q, y+4*q, q, q);
        ctx.fillRect(x+2*q, y+6*q, q, q); ctx.fillRect(x+6*q, y+2*q, q, q);
        break;
      }
      case T.PATH_DARK: {
        ctx.fillStyle = '#c8a848'; ctx.fillRect(x, y, s, s);
        ctx.fillStyle = '#b89838';
        ctx.fillRect(x+q, y+q, q, q); ctx.fillRect(x+5*q, y+5*q, q, q);
        break;
      }
      case T.WATER: {
        const w = Math.floor(frameCount / 20) % 4;
        ctx.fillStyle = '#3890d8'; ctx.fillRect(x, y, s, s);
        ctx.fillStyle = '#50a8f0';
        ctx.fillRect(x + w * 2 * q, y + 2*q, 3*q, q);
        ctx.fillRect(x + (6 - w*2)*q % (s), y + 5*q, 3*q, q);
        ctx.fillStyle = 'rgba(255,255,255,0.15)';
        ctx.fillRect(x, y, s, 2*q);
        break;
      }
      case T.BRIDGE: {
        ctx.fillStyle = '#d4a840'; ctx.fillRect(x, y, s, s);
        ctx.fillStyle = '#b08830';
        ctx.fillRect(x, y, q, s); ctx.fillRect(x+7*q, y, q, s);
        ctx.fillStyle = '#c09840';
        ctx.fillRect(x+q, y+2*q, 6*q, q); ctx.fillRect(x+q, y+5*q, 6*q, q);
        break;
      }
      case T.HOUSE: {
        // Fire Red style house - red roof, cream walls
        // Roof
        ctx.fillStyle = '#d04040'; ctx.fillRect(x, y, s, 3*q);
        ctx.fillStyle = '#a82828'; ctx.fillRect(x, y+3*q, s, q); // roof edge
        // Walls
        ctx.fillStyle = '#f0e8c0'; ctx.fillRect(x, y+4*q, s, 4*q);
        // Door
        ctx.fillStyle = '#804020'; ctx.fillRect(x+3*q, y+5*q, 2*q, 3*q);
        // Windows
        ctx.fillStyle = '#88d8f8'; ctx.fillRect(x+q, y+4.5*q, 1.5*q, 1.5*q);
        ctx.fillStyle = '#88d8f8'; ctx.fillRect(x+5.5*q, y+4.5*q, 1.5*q, 1.5*q);
        // Window frames
        ctx.fillStyle = '#604820';
        ctx.fillRect(x+q, y+4.5*q, 0.3*q, 1.5*q); ctx.fillRect(x+2.2*q, y+4.5*q, 0.3*q, 1.5*q);
        break;
      }
      case T.HOUSE2: {
        // Blue roof variant
        ctx.fillStyle = '#3050d0'; ctx.fillRect(x, y, s, 3*q);
        ctx.fillStyle = '#2030a0'; ctx.fillRect(x, y+3*q, s, q);
        ctx.fillStyle = '#e8e8e0'; ctx.fillRect(x, y+4*q, s, 4*q);
        ctx.fillStyle = '#805020'; ctx.fillRect(x+3*q, y+5*q, 2*q, 3*q);
        ctx.fillStyle = '#88d8f8'; ctx.fillRect(x+q, y+4.5*q, 1.5*q, 1.5*q);
        ctx.fillStyle = '#88d8f8'; ctx.fillRect(x+5.5*q, y+4.5*q, 1.5*q, 1.5*q);
        break;
      }
      case T.HOUSE3: {
        // Brown/lab style
        ctx.fillStyle = '#806020'; ctx.fillRect(x, y, s, 3*q);
        ctx.fillStyle = '#604010'; ctx.fillRect(x, y+3*q, s, q);
        ctx.fillStyle = '#d8d0a0'; ctx.fillRect(x, y+4*q, s, 4*q);
        ctx.fillStyle = '#703010'; ctx.fillRect(x+3*q, y+5*q, 2*q, 3*q);
        ctx.fillStyle = '#88c8e8'; ctx.fillRect(x+q, y+4.5*q, 1.5*q, 1.5*q);
        ctx.fillStyle = '#88c8e8'; ctx.fillRect(x+5.5*q, y+4.5*q, 1.5*q, 1.5*q);
        break;
      }
      case T.POKE_CENTER: {
        ctx.fillStyle = '#e04848'; ctx.fillRect(x, y, s, 3*q);
        ctx.fillStyle = '#c02020'; ctx.fillRect(x, y+3*q, s, q);
        ctx.fillStyle = '#f8f0f0'; ctx.fillRect(x, y+4*q, s, 4*q);
        ctx.fillStyle = '#804020'; ctx.fillRect(x+3*q, y+5*q, 2*q, 3*q);
        // Plus cross
        ctx.fillStyle = '#e04848';
        ctx.fillRect(x+3.5*q, y+q, q, 2*q); ctx.fillRect(x+2.5*q, y+1.5*q, 3*q, q);
        ctx.fillStyle = '#88d8f8'; ctx.fillRect(x+q, y+4.5*q, 1.5*q, 1.5*q);
        ctx.fillStyle = '#88d8f8'; ctx.fillRect(x+5.5*q, y+4.5*q, 1.5*q, 1.5*q);
        break;
      }
      case T.MART: {
        ctx.fillStyle = '#2860c0'; ctx.fillRect(x, y, s, 3*q);
        ctx.fillStyle = '#183890'; ctx.fillRect(x, y+3*q, s, q);
        ctx.fillStyle = '#e8eef8'; ctx.fillRect(x, y+4*q, s, 4*q);
        ctx.fillStyle = '#804020'; ctx.fillRect(x+3*q, y+5*q, 2*q, 3*q);
        // Window with $ sign
        ctx.fillStyle = '#70b8e8'; ctx.fillRect(x+q, y+1*q, 6*q, 2*q);
        ctx.fillStyle = '#88d8f8'; ctx.fillRect(x+q, y+4.5*q, 1.5*q, 1.5*q);
        ctx.fillStyle = '#88d8f8'; ctx.fillRect(x+5.5*q, y+4.5*q, 1.5*q, 1.5*q);
        break;
      }
      case T.GYM: {
        ctx.fillStyle = '#6020a0'; ctx.fillRect(x, y, s, 3*q);
        ctx.fillStyle = '#401880'; ctx.fillRect(x, y+3*q, s, q);
        ctx.fillStyle = '#d8d0e8'; ctx.fillRect(x, y+4*q, s, 4*q);
        ctx.fillStyle = '#603010'; ctx.fillRect(x+3*q, y+5*q, 2*q, 3*q);
        // Badge icon
        ctx.fillStyle = '#f8d020';
        ctx.beginPath(); ctx.arc(x+4*q, y+1.5*q, 1.5*q, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = '#88d8f8'; ctx.fillRect(x+q, y+4.5*q, 1.5*q, 1.5*q);
        ctx.fillStyle = '#88d8f8'; ctx.fillRect(x+5.5*q, y+4.5*q, 1.5*q, 1.5*q);
        break;
      }
      case T.DOOR: {
        ctx.fillStyle = '#e8d078'; ctx.fillRect(x, y, s, s); // path below
        ctx.fillStyle = '#804020'; ctx.fillRect(x+2*q, y, 4*q, 7*q);
        ctx.fillStyle = '#c06030'; ctx.fillRect(x+3*q, y+q, 2*q, 5*q);
        ctx.fillStyle = '#f8d060'; // knob
        ctx.beginPath(); ctx.arc(x+5.5*q, y+4*q, q*.4, 0, Math.PI*2); ctx.fill();
        break;
      }
      case T.SIGN: {
        ctx.fillStyle = '#e8d078'; ctx.fillRect(x, y, s, s);
        ctx.fillStyle = '#d4a850'; ctx.fillRect(x+2*q, y+2*q, 4*q, 3*q);
        ctx.fillStyle = '#b08030'; ctx.fillRect(x+2*q, y+2*q, 4*q, q*.5);
        ctx.fillStyle = '#7a5018'; ctx.fillRect(x+3.5*q, y+q, q, q+2); ctx.fillRect(x+3.5*q, y+5*q, q, 3*q);
        break;
      }
      case T.FENCE: {
        ctx.fillStyle = '#f0e0b0'; ctx.fillRect(x, y, s, s);
        ctx.fillStyle = '#a07030';
        ctx.fillRect(x, y+3*q, s, q);
        ctx.fillRect(x+2*q, y+q, q, 6*q);
        ctx.fillRect(x+5*q, y+q, q, 6*q);
        break;
      }
      case T.FLOWER: {
        ctx.fillStyle = '#88c840'; ctx.fillRect(x, y, s, s);
        const fa = Math.floor(frameCount / 30) % 2;
        ctx.fillStyle = '#ff80a0';
        ctx.fillRect(x + (fa ? 4 : 2) * q, y + 2*q, 2*q, 2*q);
        ctx.fillRect(x + (fa ? 2 : 5) * q, y + 5*q, 2*q, 2*q);
        ctx.fillStyle = '#ffee40';
        ctx.fillRect(x + (fa ? 5 : 3) * q, y + 3*q, q, q);
        ctx.fillRect(x + (fa ? 3 : 6) * q, y + 6*q, q, q);
        break;
      }
      case T.LEDGE: {
        ctx.fillStyle = '#a89020'; ctx.fillRect(x, y, s, s);
        ctx.fillStyle = '#808010';
        ctx.fillRect(x, y, s, q); // top edge
        ctx.fillStyle = '#c0b030';
        ctx.fillRect(x, y+q, s, s-q);
        // Arrows
        ctx.fillStyle = '#404010';
        ctx.fillRect(x+3*q, y+3*q, 2*q, q);
        ctx.fillRect(x+2*q, y+4*q, q, q); ctx.fillRect(x+5*q, y+4*q, q, q);
        break;
      }
      case T.MOUNTAIN: {
        ctx.fillStyle = '#3a4858'; ctx.fillRect(x, y, s, s);
        ctx.fillStyle = '#506070'; ctx.fillRect(x+q, y+q, s-2*q, s-2*q);
        ctx.fillStyle = '#687888'; ctx.fillRect(x+2*q, y+q, q*2, q*3);
        ctx.fillStyle = '#4a5868'; ctx.fillRect(x+5*q, y+2*q, q*2, q*4);
        // Snow cap
        ctx.fillStyle = '#d0e0f0'; ctx.fillRect(x+3*q, y, 2*q, 2*q);
        break;
      }
      case T.CAVE:
      case T.STONE: {
        ctx.fillStyle = t === T.CAVE ? '#283038' : '#404050';
        ctx.fillRect(x, y, s, s);
        ctx.fillStyle = t === T.CAVE ? '#384048' : '#505060';
        ctx.fillRect(x+q, y+q, s-2*q, s-2*q);
        // Rock details
        ctx.fillStyle = t === T.CAVE ? '#202830' : '#303040';
        ctx.fillRect(x+2*q, y+2*q, 2*q, q); ctx.fillRect(x+5*q, y+4*q, 2*q, q);
        break;
      }
      case T.WALL: {
        ctx.fillStyle = '#604820'; ctx.fillRect(x, y, s, s);
        ctx.fillStyle = '#503818';
        ctx.fillRect(x, y, s, q); ctx.fillRect(x, y, q, s);
        break;
      }
    }
  }

  // ─── PLAYER SPRITE ────────────────────────────────────────────────────
  function drawPlayer() {
    const sx = Math.round(player.px - cameraX);
    const sy = Math.round(player.py - cameraY);
    const q = TILE / 8;
    const bob = player.moving ? Math.floor(frameCount / 5) % 2 : 0;
    const leg = player.moving ? Math.floor(frameCount / 5) % 4 : 0;

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,.25)';
    ctx.beginPath();
    ctx.ellipse(sx + TILE / 2, sy + TILE - q * .5, TILE / 2.5, q * .7, 0, 0, Math.PI * 2);
    ctx.fill();

    // Shoes - walking animation
    ctx.fillStyle = '#202020';
    if (leg < 2) {
      ctx.fillRect(sx+2*q, sy+6*q+bob*q, 2*q, 2*q);
      ctx.fillRect(sx+4*q, sy+6*q+(1-bob)*q, 2*q, 2*q);
    } else {
      ctx.fillRect(sx+2*q, sy+6*q+(1-bob)*q, 2*q, 2*q);
      ctx.fillRect(sx+4*q, sy+6*q+bob*q, 2*q, 2*q);
    }
    // Pants (blue jeans)
    ctx.fillStyle = '#2848b8';
    ctx.fillRect(sx+2*q, sy+5*q, 4*q, 2*q);
    // Body (red jacket)
    ctx.fillStyle = '#cc2020';
    ctx.fillRect(sx+2*q, sy+3*q, 4*q, 3*q);
    // Jacket collar/accent
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(sx+3*q, sy+3*q, 2*q, q*.6);
    // Arms
    ctx.fillStyle = '#cc2020';
    const armSwing = player.moving ? bob : 0;
    ctx.fillRect(sx+q, sy+3*q, q, 2*q+armSwing*q);
    ctx.fillRect(sx+6*q, sy+3*q, q, 2*q+(1-armSwing)*q);
    // Hands
    ctx.fillStyle = '#f0c890';
    ctx.fillRect(sx+q, sy+5*q+armSwing*q, q, q);
    ctx.fillRect(sx+6*q, sy+5*q+(1-armSwing)*q, q, q);
    // Head / face
    ctx.fillStyle = '#f0c890';
    ctx.fillRect(sx+2*q, sy+q, 4*q, 3*q);
    // Eyes (direction-based)
    ctx.fillStyle = '#201010';
    if (player.dir === 0) { // up - back of head
      ctx.fillStyle = '#f0c890'; // no eyes visible
    } else if (player.dir === 2) { // down
      ctx.fillRect(sx+3*q, sy+2*q, q*.7, q*.7);
      ctx.fillRect(sx+4.5*q, sy+2*q, q*.7, q*.7);
      // Mouth
      ctx.fillStyle = '#c07060';
      ctx.fillRect(sx+3.2*q, sy+3*q-.3, 1.6*q, .4*q);
    } else { // side
      const ex = player.dir === 1 ? sx+5*q : sx+2.5*q;
      ctx.fillRect(ex, sy+2*q, q*.7, q*.7);
    }
    // Hat (red cap)
    ctx.fillStyle = '#cc2020';
    ctx.fillRect(sx+q, sy, 6*q, q*1.5);
    ctx.fillRect(sx+q, sy+q*.5, 7*q, q*.8); // brim
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(sx+2*q, sy, 2.5*q, q*.8); // white front panel
    // Hair under hat (brown)
    ctx.fillStyle = '#603820';
    ctx.fillRect(sx+2*q, sy+q, q, q*.5);
    ctx.fillRect(sx+5*q, sy+q, q, q*.5);
  }

  // ─── NPC RENDERING ────────────────────────────────────────────────────
  function drawNpcs() {
    for (const npc of currentNPCs) {
      if (npc.defeated) continue;
      const sx = Math.round(npc.tx * TILE - cameraX);
      const sy = Math.round(npc.ty * TILE - cameraY);
      if (sx < -TILE || sx > W + TILE || sy < -TILE || sy > H + TILE) continue;
      const q = TILE / 8;
      const bob = Math.floor(frameCount / 20) % 2;

      // Shadow
      ctx.fillStyle = 'rgba(0,0,0,.18)';
      ctx.beginPath();
      ctx.ellipse(sx + TILE / 2, sy + TILE - q * .5, TILE / 2.5, q * .6, 0, 0, Math.PI * 2);
      ctx.fill();

      // Simple NPC sprite using emoji on colored bg
      ctx.font = `${TILE * 0.75}px serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      // Trainer exclamation
      if (npc.trainer && !npc.defeated) {
        ctx.font = `bold ${TILE * 0.4}px 'Press Start 2P', monospace`;
        ctx.fillStyle = '#ff4400';
        ctx.textAlign = 'center';
        ctx.fillText('!', sx + TILE / 2, sy - q * 1.5);
      }

      ctx.font = `${TILE * 0.75}px serif`;
      ctx.textAlign = 'center';
      ctx.fillText(npc.emoji, sx + TILE / 2, sy + TILE / 2 - bob * q * 0.3);
      ctx.textAlign = 'left';
      ctx.textBaseline = 'alphabetic';
    }
  }

  // ─── POKEMON SPRITE (in battle) ──────────────────────────────────────
  function drawPokemonSprite(c, emoji, size, frame, isEnemy) {
    if (!c) return;
    c.clearRect(0, 0, size, size);
    const bounce = isEnemy ? Math.sin(frame * 0.08) * 3 : Math.cos(frame * 0.06) * 2;
    c.font = `${size * 0.8}px serif`;
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillText(emoji, size / 2, size / 2 + bounce);
  }

  // ─── WEATHER ──────────────────────────────────────────────────────────
  function initWeather(type) {
    weather = type;
    weatherParts = [];
    const n = type === 'rain' ? 120 : type === 'snow' ? 80 : 40;
    for (let i = 0; i < n; i++) {
      if (type === 'rain')  weatherParts.push({ x: Math.random() * W, y: Math.random() * H, vx: -2, vy: 16 });
      if (type === 'snow')  weatherParts.push({ x: Math.random() * W, y: Math.random() * H, vy: .8, r: 1 + Math.random() * 2.5, ph: Math.random() * Math.PI * 2 });
      if (type === 'fog')   weatherParts.push({ x: Math.random() * W, y: Math.random() * H, r: 60 + Math.random() * 100, spd: .2 + Math.random() * .3, ph: Math.random() * Math.PI * 2 });
    }
  }
  function drawWeather() {
    if (weather === 'clear') return;
    if (weather === 'rain') {
      ctx.strokeStyle = 'rgba(160,200,255,0.32)'; ctx.lineWidth = 1;
      for (const p of weatherParts) {
        ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x - 3, p.y + 10); ctx.stroke();
        p.x += p.vx; p.y += p.vy;
        if (p.y > H) { p.y = -10; p.x = Math.random() * W; }
      }
    } else if (weather === 'snow') {
      ctx.fillStyle = 'rgba(255,255,255,.65)';
      for (const p of weatherParts) {
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
        p.x += Math.sin(frameCount * .02 + p.ph) * .6; p.y += p.vy;
        if (p.y > H) { p.y = -5; p.x = Math.random() * W; }
      }
    } else if (weather === 'fog') {
      for (const p of weatherParts) {
        const alpha = .04 + .03 * Math.abs(Math.sin(frameCount * .008 + p.ph));
        ctx.fillStyle = `rgba(200,200,220,${alpha})`;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
        p.x += p.spd;
        if (p.x > W + p.r) p.x = -p.r;
      }
    }
  }

  // ─── MINIMAP ──────────────────────────────────────────────────────────
  function drawMinimap() {
    if (!minimapCtx || !minimapVisible) return;
    const mc = minimapCanvas;
    const cw = mc.width, ch = mc.height;
    const tw = cw / MW, th = ch / MH;
    minimapCtx.fillStyle = '#050e05';
    minimapCtx.fillRect(0, 0, cw, ch);
    for (let ty = 0; ty < MH; ty++) {
      for (let tx = 0; tx < MW; tx++) {
        const t = getTile(tx, ty);
        let col;
        if (t === T.WATER) col = '#2858b0';
        else if (t === T.TREE || t === T.WALL || t === T.MOUNTAIN) col = '#0f2a0f';
        else if (t === T.TALL) col = '#3a6a1a';
        else if (t === T.PATH || t === T.PATH_DARK || t === T.BRIDGE) col = '#a89040';
        else if (t === T.GRASS || t === T.FLOWER || t === T.LEDGE) col = '#487828';
        else if (t === T.POKE_CENTER) col = '#cc4444';
        else if (t === T.MART) col = '#4488cc';
        else if (t === T.GYM) col = '#8040a0';
        else if (t === T.HOUSE || t === T.HOUSE2 || t === T.HOUSE3) col = '#886632';
        else if (t === T.STONE || t === T.CAVE) col = '#404050';
        else col = '#2a4a2a';
        minimapCtx.fillStyle = col;
        minimapCtx.fillRect(tx * tw, ty * th, Math.ceil(tw) + 0.5, Math.ceil(th) + 0.5);
      }
    }
    // NPC dots
    for (const npc of currentNPCs) {
      if (npc.defeated) continue;
      minimapCtx.fillStyle = npc.trainer ? '#ff8800' : '#88cc88';
      minimapCtx.fillRect(npc.tx * tw - 1, npc.ty * th - 1, 3, 3);
    }
    // Player
    minimapCtx.fillStyle = '#ff3300';
    minimapCtx.fillRect(player.x * tw - 1.5, player.y * th - 1.5, 3, 3);
    // Viewport
    minimapCtx.strokeStyle = 'rgba(155,188,15,.7)';
    minimapCtx.lineWidth = 1;
    const vx = (cameraX / TILE) * tw, vy = (cameraY / TILE) * th;
    const vw = (W / TILE) * tw, vh = (H / TILE) * th;
    minimapCtx.strokeRect(vx, vy, vw, vh);
  }
  function toggleMinimap() {
    minimapVisible = !minimapVisible;
    document.getElementById('minimap-wrap')?.classList.toggle('hidden', !minimapVisible);
  }

  // ─── CAMERA ───────────────────────────────────────────────────────────
  function updateCamera() {
    const tx = player.px - W / 2 + TILE / 2;
    const ty = player.py - H / 2 + TILE / 2;
    cameraX = Math.max(0, Math.min(tx, MW * TILE - W));
    cameraY = Math.max(0, Math.min(ty, MH * TILE - H));
  }

  // ─── DAY/NIGHT ────────────────────────────────────────────────────────
  function updateDayNight() {
    dayTime = (dayTime + 0.00005) % 1;
    const overlay = document.getElementById('daynight-overlay');
    const timeBox = document.getElementById('hud-time-box');
    if (!overlay) return;
    let col = 'transparent', icon = '☀';
    if (dayTime > 0.75 || dayTime < 0.05) { col = 'rgba(5,5,30,0.55)'; icon = '🌙'; }
    else if (dayTime < 0.2) { col = 'rgba(60,20,0,0.25)'; icon = '🌅'; }
    else if (dayTime > 0.65) { col = 'rgba(40,10,60,0.2)'; icon = '🌆'; }
    overlay.style.background = col;
    if (timeBox) timeBox.textContent = icon;
  }

  // ─── OVERWORLD RENDER ─────────────────────────────────────────────────
  function drawOverworld() {
    ctx.fillStyle = C.dark; ctx.fillRect(0, 0, W, H);
    const sx0 = Math.max(0, Math.floor(cameraX / TILE));
    const sy0 = Math.max(0, Math.floor(cameraY / TILE));
    const sx1 = Math.min(MW, sx0 + Math.ceil(W / TILE) + 2);
    const sy1 = Math.min(MH, sy0 + Math.ceil(H / TILE) + 2);
    for (let ty = sy0; ty < sy1; ty++)
      for (let tx = sx0; tx < sx1; tx++)
        drawTile(getTile(tx, ty), Math.round(tx * TILE - cameraX), Math.round(ty * TILE - cameraY), TILE);
    drawNpcs();
    drawPlayer();
    drawWeather();
    drawLocationLabel();
    drawMinimap();
  }

  function drawLocationLabel() {
    if (locationLabelAlpha <= 0) return;
    locationLabelAlpha -= 0.006;
    ctx.save();
    ctx.globalAlpha = Math.max(0, Math.min(1, locationLabelAlpha));
    const txt = location.toUpperCase();
    ctx.font = `bold ${TILE * 0.35}px 'Press Start 2P', monospace`;
    ctx.textAlign = 'center';
    const tw = ctx.measureText(txt).width;
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(W / 2 - tw / 2 - 16, H * 0.1, tw + 32, TILE * 0.55);
    ctx.fillStyle = '#e0f8d0';
    ctx.fillText(txt, W / 2, H * 0.1 + TILE * 0.42);
    ctx.restore();
    ctx.textAlign = 'left';
  }

  // ─── MOVEMENT ─────────────────────────────────────────────────────────
  function tryMove(dx, dy, dir) {
    if (player.moving) return;
    player.dir = dir;
    const nx = player.x + dx, ny = player.y + dy;

    // Ledge: can only go down
    const curTile = getTile(player.x, player.y);
    const nextTile = getTile(nx, ny);
    if (curTile === T.LEDGE && dy > 0 && !isBlocked(nx, ny + 1)) {
      // Jump the ledge - move 2 tiles down
      player.x = nx; player.y = ny + 1;
      player.moving = true; steps += 2;
      document.getElementById('hud-steps-num').textContent = steps;
      return;
    }

    if (isBlocked(nx, ny)) return;

    // Check trainer aggro
    for (const npc of currentNPCs) {
      if (npc.trainer && !npc.defeated && npc.tx === nx && npc.ty === ny) {
        selectedNpc = npc;
        gameState = 'dialog';
        showDialog([...npc.dialog, `${npc.name} wants to battle!`],
          () => { triggerTrainerBattle(npc); }, npc.emoji, npc.name);
        return;
      }
    }

    player.x = nx; player.y = ny; player.moving = true; steps++;
    document.getElementById('hud-steps-num').textContent = steps;

    // Repel tick
    if (repelSteps > 0) repelSteps--;

    updateLocationName(nx, ny);

    if (steps % 2 === 0) sfxStep();

    // Encounter
    if (repelSteps <= 0) {
      if (nextTile === T.TALL && Math.random() < 0.2)        player._pendingBattle = { x: nx, y: ny };
      else if (nextTile === T.WATER && Math.random() < 0.12)  player._pendingBattle = { x: nx, y: ny, water: true };
    }
  }

  function updateMovement() {
    if (player.moving) {
      const tx = player.x * TILE, ty = player.y * TILE;
      const spd = TILE * .3;
      const dx = tx - player.px, dy = ty - player.py;
      if (Math.abs(dx) <= spd && Math.abs(dy) <= spd) {
        player.px = tx; player.py = ty; player.moving = false;
        if (player._pendingBattle) {
          const pb = player._pendingBattle;
          player._pendingBattle = null;
          const pool = pb.water ? WILD_POOLS.water : getWildPool(pb.x, pb.y);
          setTimeout(() => triggerWildBattle(pool), 60);
        }
      } else {
        player.px += Math.sign(dx) * spd;
        player.py += Math.sign(dy) * spd;
      }
    } else {
      if (keys['up'])    tryMove(0, -1, 0);
      if (keys['right']) tryMove(1, 0, 1);
      if (keys['down'])  tryMove(0, 1, 2);
      if (keys['left'])  tryMove(-1, 0, 3);
    }
  }

  let selectedNpc = null;

  function updateLocationName(tx, ty) {
    const loc = getLocationName(tx, ty);
    if (loc !== location) {
      location = loc;
      document.getElementById('hud-location').textContent = loc;
      locationLabelAlpha = 2.5;
      showToast(`Entered: ${loc}`);
      updateNPCsForLocation();
    }
  }

  function updateNPCsForLocation() {
    const loc = getLocationName(player.x, player.y);
    let areaKey = 'pallet';
    if (loc === 'VIRIDIAN CITY') areaKey = 'viridian';
    else if (loc === 'ROUTE 1')  areaKey = 'route1';
    else if (loc === 'PALLET TOWN') areaKey = 'pallet';

    currentNPCs = NPC_DEFS
      .filter(n => n.area === areaKey)
      .map(n => ({ ...n, defeated: !!npcDefeated[n.id] }));
  }

  // ─── INTERACT ─────────────────────────────────────────────────────────
  function interact() {
    const deltas = [[0, -1], [1, 0], [0, 1], [-1, 0]];
    const [ddx, ddy] = deltas[player.dir];
    const tx = player.x + ddx, ty = player.y + ddy;
    const tile = getTile(tx, ty);
    const signKey = `${tx}-${ty}`;

    // NPCs
    for (const npc of currentNPCs) {
      if (npc.tx === tx && npc.ty === ty) {
        if (npc.trainer && !npc.defeated) {
          showDialog([...npc.dialog, `${npc.name} wants to battle!`],
            () => triggerTrainerBattle(npc), npc.emoji, npc.name);
        } else if (npc.trainer && npc.defeated) {
          showDialog(['...', 'You beat me fair\nand square.', 'Come back stronger!'], () => { gameState = 'overworld'; }, npc.emoji, npc.name);
        } else {
          const di = npc.dialogIdx || 0;
          showDialog(npc.dialog, () => { gameState = 'overworld'; }, npc.emoji, npc.name);
        }
        return;
      }
    }

    // Signs
    if (SIGNS[signKey]) { showDialog([SIGNS[signKey]], () => { gameState = 'overworld'; }, '📋', 'SIGN'); return; }

    // Buildings
    if (tile === T.POKE_CENTER || tile === T.DOOR && getTile(tx, ty - 1) === T.POKE_CENTER) {
      healAtCenter(); return;
    }
    // Check if door leads to specific building
    if (tile === T.DOOR) {
      // What building is above the door?
      const above = getTile(tx, ty - 1);
      if (above === T.POKE_CENTER) { healAtCenter(); return; }
      if (above === T.MART) { openShop(); return; }
      if (above === T.GYM) {
        showDialog([
          'GYM\nBadge challenge!',
          'You need to be\nstronger first!',
          `Your ${playerPoke?.name} is\nLv.${playerPoke?.level} — try\nmore battles first!`,
        ], () => { gameState = 'overworld'; }, '🏅', 'GYM');
        return;
      }
      // Regular house
      const houseLines = [
        ['Home sweet home.\nNobody is here.'],
        ['A smell of cooking\ncomes from inside!'],
        ['A note:\n"Gone to VIRIDIAN\nCITY. Back soon."'],
        ['Lots of Pokémon\nmemorabilia inside!'],
      ];
      showDialog(houseLines[Math.floor(Math.random() * houseLines.length)], () => { gameState = 'overworld'; }, '🏠', 'HOUSE');
      return;
    }
    if (tile === T.MART) { openShop(); return; }
    if (tile === T.POKE_CENTER) { healAtCenter(); return; }
    if (tile === T.GYM) {
      showDialog([
        'GYM — This is where\nPokémon battles\nhappen!',
        'Defeat the Gym\nLeader for a BADGE!',
      ], () => { gameState = 'overworld'; }, '🏅', 'GYM');
      return;
    }
    if (tile === T.HOUSE || tile === T.HOUSE2 || tile === T.HOUSE3) {
      showDialog(['The door is locked.', 'Try knocking\non the DOOR below!'], () => { gameState = 'overworld'; }, '🏠', 'HOUSE');
      return;
    }
    if (tile === T.CAVE) {
      showDialog(['A dark cave entrance...', 'Bring plenty of\nPOTIONS!', 'ZUBAT and GEODUDE\nlurk within!'], () => { gameState = 'overworld'; }, '🕳', 'CAVE');
      return;
    }
    if (tile === T.WATER) {
      showDialog(['Deep blue water\nglistens ahead.', 'You\'d need SURF\nto cross it!'], () => { gameState = 'overworld'; }, '💧', 'WATER');
      return;
    }
    if (tile === T.SIGN) {
      // Check around sign
      for (const [key, val] of Object.entries(SIGNS)) {
        const [sx, sy] = key.split('-').map(Number);
        if (sx === tx && sy === ty) {
          showDialog([val], () => { gameState = 'overworld'; }, '📋', 'SIGN');
          return;
        }
      }
    }
  }

  function healAtCenter() {
    sfxHeal();
    const old = playerHp;
    playerHp = playerPoke.maxHp;
    playerStatus = null;
    leechSeedActive = false;
    playerPoke.moves.forEach(m => movePP[m] = MOVES[m]?.pp || 10);
    updateHUD();
    showDialog([
      'NURSE JOY:\nWelcome to the\nPOKÉMON CENTER!',
      `Your ${playerPoke.name} has\nbeen fully healed!\n♥ HP & PP restored!`,
      old < playerPoke.maxHp ? '✓ HP fully restored!' : '♥ Already at full HP!',
    ], () => { gameState = 'overworld'; }, '💊', 'NURSE JOY');
  }

  // ─── DIALOG ───────────────────────────────────────────────────────────
  const dlgBox = document.getElementById('dialog-box');
  const dlgTextEl = document.getElementById('dialog-text');
  const dlgSpkrEl = document.getElementById('dialog-speaker');
  const dlgPortEl = document.getElementById('dialog-portrait');
  let twTimer = null, twFull = '', twIdx = 0;

  function showDialog(lines, cb, portrait, speaker) {
    gameState = 'dialog';
    dlgBox.classList.remove('hidden');
    dialogQueue = [...lines]; dialogCallback = cb || null;
    dialogPortrait = portrait || '💬'; dialogSpeaker = speaker || '';
    nextLine();
  }
  function nextLine() {
    if (!dialogQueue.length) {
      dlgBox.classList.add('hidden');
      if (dialogCallback) { const cb = dialogCallback; dialogCallback = null; cb(); }
      return;
    }
    const line = dialogQueue.shift();
    twFull = line; twIdx = 0;
    dlgTextEl.textContent = '';
    dlgPortEl.textContent = dialogPortrait;
    dlgSpkrEl.textContent = dialogSpeaker;
    clearTimeout(twTimer); typeChar();
  }
  function typeChar() {
    if (twIdx >= twFull.length) return;
    dlgTextEl.textContent += twFull[twIdx++];
    twTimer = setTimeout(typeChar, 22);
  }
  function advanceDialog() {
    if (twIdx < twFull.length) { clearTimeout(twTimer); twIdx = twFull.length; dlgTextEl.textContent = twFull; }
    else nextLine();
  }

  // ─── HUD ──────────────────────────────────────────────────────────────
  function updateHUD() {
    if (!playerPoke) return;
    const pct = playerHp / playerPoke.maxHp * 100;
    const xpPct = Math.min(100, playerXp / playerXpNext * 100);
    document.getElementById('hud-poke-icon').textContent = playerPoke.emoji;
    document.getElementById('hud-pokemon-name').textContent = playerPoke.name;
    document.getElementById('hud-level-badge').textContent = `Lv.${playerPoke.level}`;
    const hpBar = document.getElementById('hud-hp-bar');
    if (hpBar) {
      hpBar.style.width = pct + '%';
      hpBar.style.background = pct > 50 ? 'var(--hp-g)' : pct > 25 ? 'var(--hp-y)' : 'var(--hp-r)';
    }
    document.getElementById('hud-hp-text').textContent = `${playerHp}/${playerPoke.maxHp}`;
    const xpBar = document.getElementById('hud-xp-bar');
    if (xpBar) xpBar.style.width = xpPct + '%';
    document.getElementById('hud-wins-num').textContent = wins;
    document.getElementById('hud-money').textContent = playerMoney;
    document.getElementById('sm-money-val').textContent = playerMoney;
    document.getElementById('hud-badge-count').textContent = playerBadges;
  }

  function showToast(msg) {
    const t = document.getElementById('toast');
    if (!t) return;
    t.textContent = msg; t.classList.remove('hidden');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.add('hidden'), 2800);
  }

  // ─── BATTLE BACKGROUND ────────────────────────────────────────────────
  function drawBattleBg() {
    if (!battleBgCtx) return;
    const bw = battleBgCanvas.width, bh = battleBgCanvas.height;
    const sky = battleBgCtx.createLinearGradient(0, 0, 0, bh * .55);
    const isNight = dayTime < 0.2 || dayTime > 0.8;
    if (isNight) {
      sky.addColorStop(0, '#050820'); sky.addColorStop(1, '#1a2855');
    } else if (weather === 'rain') {
      sky.addColorStop(0, '#445566'); sky.addColorStop(1, '#667788');
    } else {
      sky.addColorStop(0, '#5090d8'); sky.addColorStop(1, '#90c0f0');
    }
    battleBgCtx.fillStyle = sky; battleBgCtx.fillRect(0, 0, bw, bh * .55);
    // Ground
    const gnd = battleBgCtx.createLinearGradient(0, bh * .55, 0, bh);
    gnd.addColorStop(0, '#5a9830'); gnd.addColorStop(1, '#2a6010');
    battleBgCtx.fillStyle = gnd; battleBgCtx.fillRect(0, bh * .55, bw, bh * .45);
    // Ground lines
    battleBgCtx.strokeStyle = 'rgba(0,0,0,.12)'; battleBgCtx.lineWidth = 1;
    for (let i = 0; i < 20; i++) {
      const y = bh * .55 + i * (bh * .45 / 20);
      battleBgCtx.beginPath(); battleBgCtx.moveTo(0, y); battleBgCtx.lineTo(bw, y); battleBgCtx.stroke();
    }
    // Clouds or stars
    if (isNight) {
      battleBgCtx.fillStyle = 'rgba(255,255,255,.8)';
      for (let i = 0; i < 60; i++) {
        battleBgCtx.fillRect(Math.random() * bw, Math.random() * bh * .5, 1, 1);
      }
    } else {
      battleBgCtx.fillStyle = 'rgba(255,255,255,.75)';
      for (const cl of [{ x: bw * .12, y: bh * .1, r: 50 }, { x: bw * .55, y: bh * .07, r: 65 }, { x: bw * .82, y: bh * .13, r: 42 }]) {
        battleBgCtx.beginPath(); battleBgCtx.arc(cl.x, cl.y, cl.r, 0, Math.PI * 2); battleBgCtx.fill();
        battleBgCtx.beginPath(); battleBgCtx.arc(cl.x + cl.r * .65, cl.y, cl.r * .7, 0, Math.PI * 2); battleBgCtx.fill();
      }
    }
    // Player platform
    battleBgCtx.fillStyle = 'rgba(100,180,60,.6)';
    battleBgCtx.beginPath();
    battleBgCtx.ellipse(bw * .25, bh * .7, bw * .12, bh * .04, 0, 0, Math.PI * 2); battleBgCtx.fill();
    // Enemy platform
    battleBgCtx.fillStyle = 'rgba(100,180,60,.5)';
    battleBgCtx.beginPath();
    battleBgCtx.ellipse(bw * .73, bh * .42, bw * .1, bh * .03, 0, 0, Math.PI * 2); battleBgCtx.fill();
  }

  // ─── BATTLE PARTICLES ─────────────────────────────────────────────────
  function spawnBattleParticles(x, y, color, count = 18) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const spd = 1 + Math.random() * 4;
      battleParts.push({
        x, y, vx: Math.cos(angle) * spd, vy: Math.sin(angle) * spd,
        life: 1, decay: 0.03 + Math.random() * 0.04, color, r: 2 + Math.random() * 5,
      });
    }
  }
  function updateBattleParticles() {
    if (!battleFxCtx) return;
    battleFxCtx.clearRect(0, 0, W, H);
    for (const p of battleParts) {
      p.x += p.vx; p.y += p.vy; p.vy += 0.12; p.life -= p.decay;
      if (p.life <= 0) continue;
      battleFxCtx.globalAlpha = p.life;
      battleFxCtx.fillStyle = p.color;
      battleFxCtx.beginPath();
      battleFxCtx.arc(p.x, p.y, p.r * p.life, 0, Math.PI * 2);
      battleFxCtx.fill();
    }
    battleParts = battleParts.filter(p => p.life > 0);
    battleFxCtx.globalAlpha = 1;
  }

  // ─── BATTLE: TRIGGER ──────────────────────────────────────────────────
  function triggerWildBattle(pool) {
    const key = pool[Math.floor(Math.random() * pool.length)];
    const poke = deepClone(POKEMON[key] || POKEMON.RATTATA);
    poke.level = Math.max(2, (playerPoke?.level || 5) + Math.floor(Math.random() * 5) - 2);
    startBattle(poke, false, null);
  }
  function triggerTrainerBattle(npc) {
    const poke = deepClone(POKEMON[npc.pokemon] || POKEMON.RATTATA);
    poke.level = npc.level || 5;
    startBattle(poke, true, npc);
  }

  function startBattle(poke, trainer, npc) {
    sfxEncounter();
    isTrainerBattle = trainer;
    activeNpc = npc;
    enemyPoke = poke;
    const scale = Math.max(0.5, enemyPoke.level / 5);
    enemyPoke.maxHp = Math.max(8, Math.round(enemyPoke.maxHp * scale));
    enemyHp = enemyPoke.maxHp;
    enemyStatus = null; playerStatus = null;
    leechSeedActive = false;
    enemyMovePP = {};
    enemyPoke.moves.forEach(m => { enemyMovePP[m] = MOVES[m]?.pp || 10; });
    playerPokedex.add(enemyPoke.name);

    // Flash effect
    const fl = document.createElement('div');
    fl.className = 'flash-overlay';
    document.getElementById('game-wrap').appendChild(fl);
    setTimeout(() => fl.remove(), 500);

    setTimeout(() => {
      drawBattleBg();
      const spSize = Math.min(160, W * .18);
      if (enemySpCanvas) { enemySpCanvas.width = enemySpCanvas.height = spSize; }
      if (playerSpCanvas) { playerSpCanvas.width = playerSpCanvas.height = spSize * .85; }

      document.getElementById('enemy-tag').textContent = trainer ? (npc?.name || 'TRAINER') : 'WILD';
      document.getElementById('enemy-name').textContent = enemyPoke.name;
      document.getElementById('enemy-level').textContent = `Lv.${enemyPoke.level}`;
      document.getElementById('player-poke-name').textContent = playerPoke.name;
      document.getElementById('player-level').textContent = `Lv.${playerPoke.level}`;
      updateStatusBadge('enemy', null); updateStatusBadge('player', null);
      updateBattleHpBars();

      document.getElementById('battle-screen').classList.remove('hidden');
      gameState = 'battle';
      battlePhase = 'choose';
      selectedBOpt = 0; selectedMOpt = 0;
      document.getElementById('move-menu').classList.add('hidden');
      document.getElementById('bag-battle-menu').classList.add('hidden');
      document.getElementById('battle-menu').style.display = '';
      updateBattleOptUI();
      setBattleMsg(trainer ? `${npc?.name || 'TRAINER'} sent out ${enemyPoke.name}!` : `A wild ${enemyPoke.name} appeared!`);
    }, 250);
  }

  // ─── BATTLE: UI ───────────────────────────────────────────────────────
  const battleMsgEl = document.getElementById('battle-msg');
  const battleOpts = document.querySelectorAll('.b-opt');
  const moveMenuEl = document.getElementById('move-menu');
  const moveGridEl = document.getElementById('move-grid');
  const bagBattleEl = document.getElementById('bag-battle-menu');
  const bagBattleList = document.getElementById('bag-battle-list');

  function setBattleMsg(txt) { if (battleMsgEl) battleMsgEl.textContent = txt; }
  function updateBattleOptUI() { battleOpts.forEach((el, i) => el.classList.toggle('selected', i === selectedBOpt)); }
  function updateMoveOptUI() {
    document.querySelectorAll('.move-item').forEach((el, i) => el.classList.toggle('selected', i === selectedMOpt));
    const mv = playerPoke.moves[selectedMOpt];
    const md = MOVES[mv];
    if (md) {
      const ms_type = document.getElementById('ms-type');
      if (ms_type) { ms_type.textContent = md.type; ms_type.style.background = TYPE_COLOR[md.type] + '33'; ms_type.style.color = TYPE_COLOR[md.type]; ms_type.style.borderColor = TYPE_COLOR[md.type]; }
      const ms_pwr = document.getElementById('ms-pwr'); if (ms_pwr) ms_pwr.textContent = `PWR ${md.pwr || '—'}`;
      const ms_acc = document.getElementById('ms-acc'); if (ms_acc) ms_acc.textContent = `ACC ${md.acc}%`;
      const ms_pp = document.getElementById('ms-pp'); if (ms_pp) ms_pp.textContent = `PP ${movePP[mv] ?? md.pp}/${md.pp}`;
      const ms_cat = document.getElementById('ms-cat'); if (ms_cat) ms_cat.textContent = md.cat.toUpperCase();
    }
  }
  function updateBattleHpBars() {
    const eP = Math.max(0, enemyHp / enemyPoke.maxHp * 100);
    const pP = Math.max(0, playerHp / playerPoke.maxHp * 100);
    const enemyHpBar = document.getElementById('enemy-hp-bar');
    const playerHpBar = document.getElementById('player-hp-bar');
    const playerHpText = document.getElementById('player-hp-text');
    const playerXpBar = document.getElementById('player-xp-bar');
    if (enemyHpBar) { enemyHpBar.style.width = eP + '%'; enemyHpBar.style.background = eP > 50 ? 'var(--hp-g)' : eP > 25 ? 'var(--hp-y)' : 'var(--hp-r)'; }
    if (playerHpBar) { playerHpBar.style.width = pP + '%'; playerHpBar.style.background = pP > 50 ? 'var(--hp-g)' : pP > 25 ? 'var(--hp-y)' : 'var(--hp-r)'; }
    if (playerHpText) playerHpText.textContent = `${playerHp} / ${playerPoke.maxHp}`;
    const xpP = Math.min(100, playerXp / playerXpNext * 100);
    if (playerXpBar) playerXpBar.style.width = xpP + '%';
    updateHUD();
  }
  function updateStatusBadge(who, status) {
    const el = document.getElementById(`${who}-status-badge`);
    if (!el) return;
    if (!status) { el.className = 'status-hidden'; el.textContent = ''; return; }
    const map = { psn: 's-psn', brn: 's-brn', slp: 's-slp', prz: 's-prz', frz: 's-frz' };
    const labels = { psn: 'PSN', brn: 'BRN', slp: 'SLP', prz: 'PRZ', frz: 'FRZ' };
    el.className = `status-badge ${map[status] || ''}`;
    el.textContent = labels[status] || status.toUpperCase();
  }

  // ─── BATTLE: INPUT ─────────────────────────────────────────────────────
  // FIXED: All battle input goes through battlePhase, no stuck states
  function handleBattleInput(key) {
    if (battlePhase === 'anim' || battlePhase === 'catch') return; // locked during animation

    if (battlePhase === 'result') {
      if (key === 'A' || key === 'B') { sfxConfirm(); endBattle(); }
      return;
    }
    if (battlePhase === 'choose') {
      if (key === 'up' && selectedBOpt > 1)         { selectedBOpt -= 2; sfxMenu(); }
      if (key === 'down' && selectedBOpt < 2)        { selectedBOpt += 2; sfxMenu(); }
      if (key === 'left' && selectedBOpt % 2)        { selectedBOpt--; sfxMenu(); }
      if (key === 'right' && !(selectedBOpt % 2))    { selectedBOpt++; sfxMenu(); }
      updateBattleOptUI();
      if (key === 'A') { sfxConfirm(); selectAction(['fight', 'bag', 'pokemon', 'run'][selectedBOpt]); }
      return;
    }
    if (battlePhase === 'fight') {
      const n = playerPoke.moves.length;
      if (key === 'up' && selectedMOpt > 1)          { selectedMOpt -= 2; sfxMenu(); }
      if (key === 'down' && selectedMOpt < n - 1)    { selectedMOpt += 2; sfxMenu(); }
      if (key === 'left' && selectedMOpt % 2)        { selectedMOpt--; sfxMenu(); }
      if (key === 'right' && !(selectedMOpt % 2) && selectedMOpt + 1 < n) { selectedMOpt++; sfxMenu(); }
      updateMoveOptUI();
      if (key === 'A') { sfxConfirm(); useMove(playerPoke.moves[selectedMOpt]); }
      if (key === 'B') {
        sfxCancel(); battlePhase = 'choose';
        moveMenuEl.classList.add('hidden');
        document.getElementById('battle-menu').style.display = '';
        setBattleMsg(`What will ${playerPoke.name} do?`);
        updateBattleOptUI();
      }
      return;
    }
    if (battlePhase === 'bag') {
      const bagItems = playerBag.filter(i => i.qty > 0);
      if (key === 'up' && selectedBagOpt > 0)                       { selectedBagOpt--; sfxMenu(); }
      if (key === 'down' && selectedBagOpt < bagItems.length - 1)   { selectedBagOpt++; sfxMenu(); }
      updateBagOptUI(bagItems);
      if (key === 'A') { sfxConfirm(); useBagItem(bagItems[selectedBagOpt]); }
      if (key === 'B') { sfxCancel(); closeBagMenu(); }
    }
  }

  function selectAction(act) {
    if (act === 'fight') {
      battlePhase = 'fight'; selectedMOpt = 0;
      openMoveMenu();
    } else if (act === 'run') {
      if (isTrainerBattle) { setBattleMsg("Can't flee from\na Trainer battle!"); return; }
      const escape = playerPoke.spd > enemyPoke.spd ? 0.85 : 0.6;
      if (Math.random() < escape) {
        sfxEscape(); setBattleMsg('Got away safely!');
        battlePhase = 'result';
      } else {
        setBattleMsg("Can't escape!"); doEnemyTurn();
      }
    } else if (act === 'bag') {
      battlePhase = 'bag'; openBagMenu();
    } else if (act === 'pokemon') {
      setBattleMsg('No other POKÉMON!');
    }
  }

  function openMoveMenu() {
    document.getElementById('battle-menu').style.display = 'none';
    moveMenuEl.classList.remove('hidden');
    bagBattleEl.classList.add('hidden');
    moveGridEl.innerHTML = '';
    playerPoke.moves.forEach((m, i) => {
      const md = MOVES[m];
      const tc = md ? TYPE_COLOR[md.type] || '#888' : '#888';
      const pp = movePP[m] ?? md?.pp ?? 10;
      const ppMax = md?.pp ?? 10;
      const ppLow = pp <= Math.floor(ppMax / 3);
      const div = document.createElement('div');
      div.className = 'move-item' + (i === 0 ? ' selected' : '');
      div.innerHTML = `<span style="color:${tc};font-size:9px">■</span>${m}<span class="move-pp-inline" style="color:${ppLow ? '#ff4444' : '#aaa'}">${pp}/${ppMax}</span>`;
      div.addEventListener('click', () => {
        selectedMOpt = i; sfxMenu(); updateMoveOptUI();
        setTimeout(() => { sfxConfirm(); useMove(m); }, 100);
      });
      moveGridEl.appendChild(div);
    });
    updateMoveOptUI();
    setBattleMsg('Choose a move:');
  }

  function openBagMenu() {
    document.getElementById('battle-menu').style.display = 'none';
    moveMenuEl.classList.add('hidden');
    bagBattleEl.classList.remove('hidden');
    selectedBagOpt = 0;
    const items = playerBag.filter(i => i.qty > 0);
    if (!items.length) {
      bagBattleList.innerHTML = '<div class="bag-item">Bag is empty!</div>';
    } else {
      bagBattleList.innerHTML = '';
      items.forEach((it, i) => {
        const d = document.createElement('div');
        d.className = 'bag-item' + (i === 0 ? ' selected' : '');
        d.innerHTML = `<span>${it.emoji} ${it.name}</span><span>×${it.qty}</span>`;
        d.addEventListener('click', () => { selectedBagOpt = i; sfxMenu(); updateBagOptUI(items); });
        bagBattleList.appendChild(d);
      });
    }
  }
  function updateBagOptUI(items) {
    document.querySelectorAll('#bag-battle-list .bag-item').forEach((el, i) => el.classList.toggle('selected', i === selectedBagOpt));
  }
  function closeBagMenu() {
    battlePhase = 'choose';
    bagBattleEl.classList.add('hidden');
    document.getElementById('battle-menu').style.display = '';
    setBattleMsg(`What will ${playerPoke.name} do?`);
    updateBattleOptUI();
  }

  function useBagItem(item) {
    if (!item) return;
    if (item.effect === 'catch' || item.effect === 'catch_great' || item.effect === 'catch_ultra') {
      if (isTrainerBattle) { setBattleMsg("Can't catch\nTrainer's Pokémon!"); return; }
      attemptCatch(item); return;
    }
    // Healing items
    let msg = '';
    if (item.effect === 'heal20') { playerHp = Math.min(playerPoke.maxHp, playerHp + 20); msg = `Used ${item.name}!\n+20 HP restored!`; sfxHeal(); }
    else if (item.effect === 'heal50') { playerHp = Math.min(playerPoke.maxHp, playerHp + 50); msg = `Used ${item.name}!\n+50 HP restored!`; sfxHeal(); }
    else if (item.effect === 'fullrestore') { playerHp = playerPoke.maxHp; playerStatus = null; updateStatusBadge('player', null); msg = 'FULL RESTORE!\nHP & Status healed!'; sfxHeal(); }
    else if (item.effect === 'cure_psn' && playerStatus === 'psn') { playerStatus = null; updateStatusBadge('player', null); msg = 'ANTIDOTE!\nPoison cured!'; sfxHeal(); }
    else if (item.effect === 'cure_prz' && playerStatus === 'prz') { playerStatus = null; updateStatusBadge('player', null); msg = 'PARA-HEAL!\nParalysis cured!'; sfxHeal(); }
    else if (item.effect === 'cure_slp' && playerStatus === 'slp') { playerStatus = null; updateStatusBadge('player', null); msg = 'AWAKENING!\nWoke up!'; sfxHeal(); }
    else if (item.effect === 'cure_brn' && playerStatus === 'brn') { playerStatus = null; updateStatusBadge('player', null); msg = 'BURN HEAL!\nBurn cured!'; sfxHeal(); }
    else if (item.effect === 'full_heal') { playerStatus = null; updateStatusBadge('player', null); msg = 'FULL HEAL!\nAll status cured!'; sfxHeal(); }
    else if (item.effect === 'repel') { repelSteps = 100; msg = 'REPEL applied!\n100 steps repelled.'; }
    else if (item.effect === 'escape') { endBattle(); showToast('Escaped from cave!'); return; }
    else { msg = `Used ${item.name}!\nBut it had no effect!`; closeBagMenu(); return; }

    item.qty--;
    if (item.qty <= 0) playerBag = playerBag.filter(b => b.qty > 0);
    updateBattleHpBars();
    setBattleMsg(msg);
    closeBagMenu();
    // After using item, enemy gets a turn
    battlePhase = 'anim';
    setTimeout(() => doEnemyTurn(), 1300);
  }

  function attemptCatch(item) {
    battlePhase = 'catch';
    const catchOverlay = document.getElementById('catch-overlay');
    const pokeballAnim = document.getElementById('pokeball-anim');
    const catchResult = document.getElementById('catch-result');
    const ballIcon = item.effect === 'catch_ultra' ? '🟡' : item.effect === 'catch_great' ? '🔵' : '⚫';
    pokeballAnim.textContent = ballIcon;
    catchResult.textContent = '';
    catchOverlay.classList.remove('hidden');

    item.qty--;
    if (item.qty <= 0) playerBag = playerBag.filter(b => b.qty > 0);

    const hpFraction = enemyHp / enemyPoke.maxHp;
    const baseRate = item.effect === 'catch_ultra' ? 2 : item.effect === 'catch_great' ? 1.5 : 1;
    const statusBonus = enemyStatus === 'slp' || enemyStatus === 'frz' ? 1.5 : enemyStatus ? 1.2 : 1;
    const catchChance = Math.min(0.95, baseRate * statusBonus * (1 - hpFraction * .65));

    sfxCatch();
    let shakeCount = 0;
    const maxShakes = Math.min(3, Math.floor(catchChance * 4));
    const interval = setInterval(() => {
      shakeCount++;
      pokeballAnim.style.transform = `rotate(${shakeCount % 2 === 0 ? -15 : 15}deg)`;
      if (shakeCount >= maxShakes) { clearInterval(interval); }
    }, 500);

    setTimeout(() => {
      clearInterval(interval);
      pokeballAnim.style.transform = '';
      const caught = Math.random() < catchChance;
      catchResult.textContent = caught ? `★ ${enemyPoke.name} was caught!` : `${enemyPoke.name} broke free!`;
      setTimeout(() => {
        catchOverlay.classList.add('hidden');
        if (caught) {
          wins++; battleStreak++;
          playerPokedex.add(enemyPoke.name);
          updateHUD();
          showToast(`★ Caught ${enemyPoke.name}!`);
          setBattleMsg(`${enemyPoke.name} was caught!\nAdded to POKÉDEX!`);
          // Give XP for catching
          const xpGain = Math.floor((enemyPoke.xpY || 60) * (enemyPoke.level / 5) * .5);
          playerXp += xpGain;
          while (playerXp >= playerXpNext && playerPoke.level < 100) {
            playerXp -= playerXpNext; playerXpNext = Math.floor(playerXpNext * 1.6);
            levelUpPokemon(playerPoke);
          }
          updateBattleHpBars();
          battlePhase = 'result';
        } else {
          setBattleMsg(`${enemyPoke.name} broke free!`);
          doEnemyTurn();
        }
      }, 1800);
    }, maxShakes * 500 + 800);
  }

  // ─── DAMAGE CALC ──────────────────────────────────────────────────────
  function calcDmg(attacker, moveName, defender) {
    const md = MOVES[moveName];
    if (!md || md.pwr === 0) return { dmg: 0, eff: 1 };
    const eff = typeEff(md.type, defender.type);
    const variance = 0.85 + Math.random() * .15;
    const stab = attacker.type.includes(md.type) ? 1.5 : 1;
    const dmg = Math.max(1, Math.round(md.pwr * (attacker.atk / defender.def) * variance * .65 * eff * stab));
    return { dmg, eff };
  }

  function floatDmg(dmg, x, y, color) {
    const el = document.createElement('div');
    el.className = 'dmg-float';
    el.textContent = `-${dmg}`;
    el.style.cssText = `left:${x}px;top:${y}px;color:${color || '#ff4444'}`;
    document.getElementById('game-wrap').appendChild(el);
    setTimeout(() => el.remove(), 1300);
  }
  function floatXp(xp, x, y) {
    const el = document.createElement('div');
    el.className = 'xp-float';
    el.textContent = `+${xp} XP`;
    el.style.cssText = `left:${x}px;top:${y}px`;
    document.getElementById('game-wrap').appendChild(el);
    setTimeout(() => el.remove(), 1600);
  }
  function floatMsg(txt, x, y, color = '#ffdd44') {
    const el = document.createElement('div');
    el.className = 'crit-label';
    el.textContent = txt;
    el.style.cssText = `left:${x}px;top:${y}px;color:${color}`;
    document.getElementById('game-wrap').appendChild(el);
    setTimeout(() => el.remove(), 900);
  }
  function shakeEl(el) {
    if (!el) return;
    el.classList.remove('shake-el'); void el.offsetWidth; el.classList.add('shake-el');
    setTimeout(() => el.classList.remove('shake-el'), 450);
  }

  // ─── STATUS EFFECTS ───────────────────────────────────────────────────
  function applyStatusToEnemy(moveName) {
    if (enemyStatus) return;
    if ((moveName==='EMBER' || moveName==='FLAMETHROWER') && Math.random()<.15)   { enemyStatus='brn'; updateStatusBadge('enemy','brn'); }
    else if ((moveName==='THUNDER SHOCK'||moveName==='THUNDERBOLT')&&Math.random()<.15) { enemyStatus='prz'; updateStatusBadge('enemy','prz'); }
    else if ((moveName==='POISON STING'||moveName==='TWINEEDLE')&&Math.random()<.35)    { enemyStatus='psn'; updateStatusBadge('enemy','psn'); }
    else if ((moveName==='SING'||moveName==='SLEEP POWDER')&&Math.random()<.6)          { enemyStatus='slp'; updateStatusBadge('enemy','slp'); }
    else if (moveName==='BODY SLAM'&&Math.random()<.3)  { enemyStatus='prz'; updateStatusBadge('enemy','prz'); }
  }
  function applyStatusToPlayer(moveName) {
    if (playerStatus) return;
    if (moveName==='EMBER'&&Math.random()<.1)             { playerStatus='brn'; updateStatusBadge('player','brn'); }
    else if (moveName==='THUNDER SHOCK'&&Math.random()<.1){ playerStatus='prz'; updateStatusBadge('player','prz'); }
    else if (moveName==='POISON STING'&&Math.random()<.3) { playerStatus='psn'; updateStatusBadge('player','psn'); }
    else if (moveName==='SING'&&Math.random()<.5)         { playerStatus='slp'; updateStatusBadge('player','slp'); }
    else if (moveName==='BODY SLAM'&&Math.random()<.3)    { playerStatus='prz'; updateStatusBadge('player','prz'); }
  }

  // ─── BATTLE: PLAYER TURN ──────────────────────────────────────────────
  function useMove(moveName) {
    document.getElementById('battle-menu').style.display = '';
    moveMenuEl.classList.add('hidden');
    battlePhase = 'anim'; // FIXED: lock input during animation

    // PP check
    if (!movePP[moveName] || movePP[moveName] <= 0) {
      setBattleMsg(`${moveName} has no PP!\nUsing STRUGGLE!`);
      moveName = 'TACKLE';
    } else {
      movePP[moveName]--;
    }

    // Status: paralysis
    if (playerStatus === 'prz' && Math.random() < 0.25) {
      setBattleMsg(`${playerPoke.name} is\nparalyzed! Can't move!`);
      setTimeout(() => doEnemyTurn(), 1200);
      return;
    }
    // Status: sleep
    if (playerStatus === 'slp') {
      if (Math.random() < 0.33) { playerStatus = null; updateStatusBadge('player', null); setBattleMsg(`${playerPoke.name} woke up!`); }
      else { setBattleMsg(`${playerPoke.name} is\nfast asleep!`); }
      setTimeout(() => doEnemyTurn(), 1200);
      return;
    }

    const md = MOVES[moveName];

    // Status moves
    if (md && md.pwr === 0) {
      handleStatusMove(moveName);
      return;
    }

    // Accuracy check
    const hitRoll = Math.random() * 100;
    if (hitRoll > (md?.acc || 100)) {
      setBattleMsg(`${playerPoke.name} used\n${moveName}!\nBut it missed!`);
      setTimeout(() => doEnemyTurn(), 1300);
      return;
    }

    const result = calcDmg(playerPoke, moveName, enemyPoke);
    const isCrit = Math.random() < 0.0625;
    let dmg = result.dmg;
    if (isCrit) { dmg = Math.floor(dmg * 1.5); sfxCritical(); }

    let effMsg = '';
    if (result.eff > 1.5) effMsg = '\nSUPER EFFECTIVE!';
    else if (result.eff < 0.8 && result.eff > 0) effMsg = '\nNot very effective...';
    else if (result.eff === 0) effMsg = '\nNo effect!';

    enemyHp = Math.max(0, enemyHp - dmg);
    shakeEl(document.getElementById('enemy-sprite-wrap'));
    floatDmg(dmg, W * .62, H * .25, result.eff >= 2 ? '#ff4444' : result.eff >= 1 ? '#ffdd44' : '#88aaff');
    if (isCrit) floatMsg('CRITICAL!', W * .55, H * .22, '#ff9900');
    if (result.eff >= 2) floatMsg('SUPER!', W * .6, H * .18, '#ff4444');
    result.eff >= 2 ? sfxSuperHit() : sfxHit();
    spawnBattleParticles(W * .7, H * .38, TYPE_COLOR[md?.type || 'NORMAL'] || '#fff', isCrit ? 28 : 18);
    updateBattleHpBars();
    setBattleMsg(`${playerPoke.name} used\n${moveName}!${effMsg}`);
    applyStatusToEnemy(moveName);

    // Status damage tick
    doStatusTicks();

    // FIXED: Always transition to enemy turn or result - no stuck states
    setTimeout(() => {
      if (enemyHp <= 0) {
        enemyFainted();
      } else {
        doEnemyTurn();
      }
    }, 1300);
  }

  function handleStatusMove(moveName) {
    let msg = `${playerPoke.name} used\n${moveName}!`;
    if (moveName === 'LEECH SEED') {
      leechSeedActive = true;
      msg += '\nEnemy seeded!';
    } else if (moveName === 'SING' || moveName === 'SLEEP POWDER') {
      if (!enemyStatus && Math.random() < .6) {
        enemyStatus = 'slp'; updateStatusBadge('enemy', 'slp');
        msg += '\nEnemy fell asleep!';
      } else { msg += '\nBut it failed!'; }
    } else if (moveName === 'RECOVER' || moveName === 'REST') {
      const heal = Math.floor(playerPoke.maxHp / 2);
      playerHp = Math.min(playerPoke.maxHp, playerHp + heal);
      if (moveName === 'REST') playerStatus = 'slp';
      msg += `\n${playerPoke.name} healed!`;
      sfxHeal(); updateBattleHpBars();
    } else if (moveName === 'WITHDRAW' || moveName === 'HARDEN' || moveName === 'DEFENSE CURL') {
      playerPoke.def = Math.min(playerPoke.def + 3, 99);
      msg += `\n${playerPoke.name} DEF raised!`;
    } else if (moveName === 'GROWL') {
      enemyPoke.atk = Math.max(1, enemyPoke.atk - 1);
      msg += '\nEnemy ATK lowered!';
    } else if (moveName === 'TAIL WHIP') {
      enemyPoke.def = Math.max(1, enemyPoke.def - 1);
      msg += '\nEnemy DEF lowered!';
    } else if (moveName === 'AMNESIA') {
      playerPoke.def += 4;
      msg += '\nSp. Def sharply raised!';
    } else { msg += '\nBut nothing happened...'; }

    setBattleMsg(msg);
    // FIXED: Always progress after status move
    setTimeout(() => {
      if (enemyHp <= 0) { enemyFainted(); return; }
      doEnemyTurn();
    }, 1300);
  }

  // ─── ENEMY FAINTED ────────────────────────────────────────────────────
  function enemyFainted() {
    sfxFaint();
    battleStreak++;
    const xpGain = Math.floor((enemyPoke.xpY || 60) * (enemyPoke.level / 5) * (.7 + Math.random() * .6));
    const streakBonus = battleStreak >= 5 ? 1.5 : battleStreak >= 3 ? 1.25 : 1;
    const finalXp = Math.floor(xpGain * streakBonus);
    playerXp += finalXp;
    wins++;
    document.getElementById('hud-wins-num').textContent = wins;
    floatXp(finalXp, W * .58, H * .6);

    if (isTrainerBattle && activeNpc) {
      const prize = (activeNpc.level || 5) * 60;
      playerMoney += prize;
      npcDefeated[activeNpc.id] = true;
      playerBadges++;
      // Update current NPCs
      updateNPCsForLocation();
      setBattleMsg(`${activeNpc.name} was\ndefeated!\n+₽${prize}  +1 BADGE!`);
    } else {
      setBattleMsg(`Wild ${enemyPoke.name}\nfainted!${streakBonus > 1 ? ' STREAK!' : ''}\n+${finalXp} EXP!`);
    }

    // Level up
    while (playerXp >= playerXpNext && playerPoke.level < 100) {
      playerXp -= playerXpNext;
      playerXpNext = Math.floor(playerXpNext * 1.6);
      levelUpPokemon(playerPoke);
    }
    updateBattleHpBars();
    // FIXED: set to result so player can press A to exit
    battlePhase = 'result';
  }

  function levelUpPokemon(poke) {
    if (poke.level >= 100) return;
    poke.level++;
    const hpg = Math.floor(2 + Math.random() * 4);
    poke.maxHp += hpg; playerHp = Math.min(playerHp + hpg, poke.maxHp);
    poke.atk += Math.floor(Math.random() * 2) + 1;
    poke.def += Math.floor(Math.random() * 2);
    poke.spd += Math.floor(Math.random() * 2);
    sfxLevelUp();
    const banner = document.getElementById('levelup-banner');
    const bannerText = document.getElementById('levelup-text');
    if (banner && bannerText) {
      bannerText.textContent = `${poke.name} grew to Lv.${poke.level}!`;
      banner.classList.remove('hidden');
      setTimeout(() => banner.classList.add('hidden'), 3200);
    }
    document.getElementById('player-level').textContent = `Lv.${poke.level}`;
    updateHUD();

    if (poke.evolveAt && poke.level >= poke.evolveAt && poke.evolveTo && POKEMON[poke.evolveTo]) {
      setTimeout(() => checkEvolution(poke), 2500);
    }
  }

  function checkEvolution(poke) {
    const evoTarget = POKEMON[poke.evolveTo];
    if (!evoTarget) return;
    sfxEvolve();
    const oldName = poke.name;
    const hpRatio = playerHp / poke.maxHp;
    Object.assign(poke, deepClone(evoTarget));
    poke.level = playerPoke.level;
    poke.maxHp = Math.max(poke.maxHp, Math.round(evoTarget.maxHp * poke.level / 5));
    playerHp = Math.max(1, Math.round(hpRatio * poke.maxHp));
    initMovePP(poke);
    showToast(`✨ ${oldName} evolved into ${poke.name}!`);
    updateHUD(); updateBattleHpBars();
  }

  // ─── ENEMY AI TURN ────────────────────────────────────────────────────
  function doEnemyTurn() {
    if (enemyHp <= 0) { enemyFainted(); return; } // safety check

    // Sleep check
    if (enemyStatus === 'slp') {
      setBattleMsg(`${enemyPoke.name} is\nfast asleep!`);
      if (Math.random() < .33) { enemyStatus = null; updateStatusBadge('enemy', null); }
      doStatusTicks();
      battlePhase = 'choose';
      setTimeout(() => { setBattleMsg(`What will ${playerPoke.name} do?`); updateBattleOptUI(); }, 1200);
      return;
    }
    // Paralysis
    if (enemyStatus === 'prz' && Math.random() < .25) {
      setBattleMsg(`${enemyPoke.name} is\nparalyzed! Couldn't move!`);
      doStatusTicks();
      battlePhase = 'choose';
      setTimeout(() => { setBattleMsg(`What will ${playerPoke.name} do?`); updateBattleOptUI(); }, 1200);
      return;
    }

    // AI: pick move
    const atkMoves = enemyPoke.moves.filter(m => {
      const md = MOVES[m];
      return md && md.pwr > 0 && (enemyMovePP[m] ?? md.pp) > 0;
    });
    const statusMoves = enemyPoke.moves.filter(m => {
      const md = MOVES[m];
      return md && md.pwr === 0 && (enemyMovePP[m] ?? md.pp) > 0;
    });

    let em;
    const hpRatio = enemyHp / enemyPoke.maxHp;
    if (statusMoves.length && Math.random() < 0.2 && hpRatio > 0.5) {
      em = statusMoves[Math.floor(Math.random() * statusMoves.length)];
    } else {
      em = atkMoves.length ? atkMoves[Math.floor(Math.random() * atkMoves.length)] : enemyPoke.moves[0];
    }

    if (enemyMovePP[em] !== undefined) enemyMovePP[em]--;
    const md = MOVES[em];

    // Status move
    if (!md || md.pwr === 0) {
      let msg = `${enemyPoke.name} used\n${em}!`;
      if (em === 'GROWL') { playerPoke.atk = Math.max(1, playerPoke.atk - 1); msg += '\nYour ATK lowered!'; }
      else if (em === 'TAIL WHIP') { playerPoke.def = Math.max(1, playerPoke.def - 1); msg += '\nYour DEF lowered!'; }
      else if (em === 'SING' && !playerStatus && Math.random() < .5) { playerStatus = 'slp'; updateStatusBadge('player', 'slp'); msg += '\nYou fell asleep!'; }
      setBattleMsg(msg);
      doStatusTicks();
      // FIXED: always go back to choose
      battlePhase = 'choose';
      setTimeout(() => { setBattleMsg(`What will ${playerPoke.name} do?`); updateBattleOptUI(); }, 1400);
      return;
    }

    // Accuracy
    if (Math.random() * 100 > (md?.acc || 100)) {
      setBattleMsg(`${enemyPoke.name} used\n${em}!\nBut it missed!`);
      doStatusTicks();
      battlePhase = 'choose';
      setTimeout(() => { setBattleMsg(`What will ${playerPoke.name} do?`); updateBattleOptUI(); }, 1400);
      return;
    }

    const res = calcDmg(enemyPoke, em, playerPoke);
    let eDmg = res.dmg;
    const isCrit = Math.random() < 0.05;
    if (isCrit) eDmg = Math.floor(eDmg * 1.5);

    playerHp = Math.max(0, playerHp - eDmg);
    shakeEl(document.getElementById('player-sprite-wrap'));
    floatDmg(eDmg, W * .22, H * .6, res.eff >= 2 ? '#ff4444' : '#ff8888');
    if (isCrit) floatMsg('CRITICAL!', W * .18, H * .55, '#ff9900');
    res.eff >= 2 ? sfxSuperHit() : sfxHit();
    spawnBattleParticles(W * .28, H * .72, TYPE_COLOR[md?.type || 'NORMAL'] || '#fff');
    applyStatusToPlayer(em);
    doStatusTicks();
    updateBattleHpBars();
    setBattleMsg(`${enemyPoke.name} used\n${em}!`);

    if (playerHp <= 0) {
      setTimeout(() => {
        sfxFaint();
        playerHp = Math.max(1, Math.floor(playerPoke.maxHp / 4));
        updateBattleHpBars();
        battleStreak = 0;
        setBattleMsg(`${playerPoke.name} fainted!\nHealed to 25% HP.\nHead to a Pokémon Center!`);
        // FIXED: set to result
        battlePhase = 'result';
      }, 1000);
      return;
    }

    // FIXED: Back to choose
    battlePhase = 'choose';
    setTimeout(() => {
      setBattleMsg(`What will ${playerPoke.name} do?`);
      updateBattleOptUI();
    }, 1400);
  }

  function doStatusTicks() {
    // Leech seed
    if (leechSeedActive && enemyHp > 0) {
      const drain = Math.floor(enemyPoke.maxHp / 8);
      enemyHp = Math.max(0, enemyHp - drain);
      playerHp = Math.min(playerPoke.maxHp, playerHp + Math.floor(drain / 2));
    }
    if (playerStatus === 'psn' || playerStatus === 'brn') playerHp = Math.max(1, playerHp - Math.floor(playerPoke.maxHp / 8));
    if (enemyStatus === 'psn' || enemyStatus === 'brn')   enemyHp = Math.max(0, enemyHp - Math.floor(enemyPoke.maxHp / 8));
    updateBattleHpBars();
  }

  // ─── END BATTLE ───────────────────────────────────────────────────────
  function endBattle() {
    document.getElementById('battle-screen').classList.add('hidden');
    const catchOverlay = document.getElementById('catch-overlay');
    if (catchOverlay) catchOverlay.classList.add('hidden');
    battleParts = [];
    gameState = 'overworld';
    battlePhase = 'choose';
    leechSeedActive = false;
    updateHUD();
  }

  // ─── MENU ─────────────────────────────────────────────────────────────
  const startMenuEl = document.getElementById('start-menu');
  const menuItems = document.querySelectorAll('.menu-item');

  function openMenu() {
    gameState = 'menu'; selectedMenuOpt = 0;
    document.getElementById('sm-player-name').textContent = player.name;
    updateHUD();
    startMenuEl.classList.remove('hidden');
    updateMenuOptUI();
  }
  function closeMenu() { startMenuEl.classList.add('hidden'); gameState = 'overworld'; }
  function updateMenuOptUI() { menuItems.forEach((el, i) => el.classList.toggle('selected', i === selectedMenuOpt)); }
  function handleMenuInput(key) {
    if (key === 'up' && selectedMenuOpt > 0) { selectedMenuOpt--; sfxMenu(); updateMenuOptUI(); }
    if (key === 'down' && selectedMenuOpt < menuItems.length - 1) { selectedMenuOpt++; sfxMenu(); updateMenuOptUI(); }
    if (key === 'A') { sfxConfirm(); const act = menuItems[selectedMenuOpt]?.dataset?.action; handleMenuAction(act); }
    if (key === 'B' || key === 'start') { sfxCancel(); closeMenu(); }
  }
  function handleMenuAction(act) {
    if (act === 'pokemon')  { closeMenu(); openPokemonPanel(); }
    else if (act === 'bag') { closeMenu(); showBagOutOfBattle(); }
    else if (act === 'save') { sfxConfirm(); savegame(); closeMenu(); showToast('Game saved!'); }
    else if (act === 'quit') { closeMenu(); returnToTitle(); }
    else { closeMenu(); }
  }
  menuItems.forEach((el, i) => {
    el.addEventListener('click', () => { ensureAudio(); selectedMenuOpt = i; sfxMenu(); updateMenuOptUI(); setTimeout(() => { sfxConfirm(); handleMenuAction(el.dataset.action); }, 100); });
  });

  // ─── SAVE / LOAD ──────────────────────────────────────────────────────
  function savegame() {
    try {
      const sv = {
        name: player.name, x: player.x, y: player.y,
        pokemon: playerPoke?.name, level: playerPoke?.level,
        hp: playerHp, xp: playerXp, xpNext: playerXpNext,
        money: playerMoney, badges: playerBadges,
        bag: playerBag, wins, steps,
        npcDefeated, pokedex: [...playerPokedex],
        poke: playerPoke,
      };
      localStorage.setItem('pkm_save', JSON.stringify(sv));
    } catch (e) {}
  }
  function tryLoadSave() {
    try { return JSON.parse(localStorage.getItem('pkm_save')); } catch (e) { return null; }
  }
  function returnToTitle() {
    document.getElementById('game-wrap').classList.add('hidden');
    document.getElementById('intro-screen').classList.remove('hidden');
    gameState = 'intro';
  }

  // ─── BAG OUT OF BATTLE ────────────────────────────────────────────────
  function showBagOutOfBattle() {
    if (!playerBag.length) { showToast('Bag is empty!'); return; }
    const lines = playerBag.map(it => `${it.emoji} ${it.name} ×${it.qty} — ${it.effect}`);
    showDialog(['YOUR BAG:', ...lines, 'Use items from\nbattle screen!'], () => { gameState = 'overworld'; }, '🎒', 'BAG');
  }

  // ─── POKÉMON PANEL ────────────────────────────────────────────────────
  const pokemonPanel = document.getElementById('pokemon-panel');
  document.getElementById('pp-close')?.addEventListener('click', () => { sfxCancel(); closePokemonPanel(); });

  function openPokemonPanel() {
    if (!playerPoke) return;
    gameState = 'pokemon-panel';
    pokemonPanel.classList.remove('hidden');
    // Sprite
    const spBig = document.getElementById('pp-sprite-big');
    if (spBig) spBig.textContent = playerPoke.emoji;
    // Types
    const typeBadges = document.getElementById('pp-type-badges');
    if (typeBadges) {
      typeBadges.innerHTML = '';
      playerPoke.type.forEach(t => {
        const b = document.createElement('span');
        b.className = `s-type-badge type-${t}`;
        b.style.background = TYPE_COLOR[t] + '44';
        b.style.color = TYPE_COLOR[t];
        b.style.border = `1px solid ${TYPE_COLOR[t]}`;
        b.textContent = t;
        typeBadges.appendChild(b);
      });
    }
    // Flavor
    const flv = document.getElementById('pp-flavor');
    if (flv) flv.textContent = playerPoke.desc || '';
    // Stats
    const sg = document.getElementById('pp-stats-grid');
    if (sg) {
      sg.innerHTML = `
        <div class="stat-row"><span>HP</span><span>${playerHp}/${playerPoke.maxHp}</span></div>
        <div class="stat-row"><span>ATK</span><span>${playerPoke.atk}</span></div>
        <div class="stat-row"><span>DEF</span><span>${playerPoke.def}</span></div>
        <div class="stat-row"><span>SPD</span><span>${playerPoke.spd}</span></div>
        <div class="stat-row"><span>LVL</span><span>${playerPoke.level}</span></div>
        <div class="stat-row"><span>TYPE</span><span>${playerPoke.type.join('/')}</span></div>
      `;
    }
    // XP
    const xpLbl = document.getElementById('pp-xp-label');
    if (xpLbl) xpLbl.textContent = `${playerXp}/${playerXpNext}`;
    const xpBar = document.getElementById('pp-xp-bar');
    if (xpBar) xpBar.style.width = Math.min(100, playerXp / playerXpNext * 100) + '%';
    // Moves
    const ml = document.getElementById('pp-moves-list');
    if (ml) {
      ml.innerHTML = '';
      playerPoke.moves.forEach(m => {
        const md = MOVES[m];
        const pp = movePP[m] ?? md?.pp ?? 10;
        const d = document.createElement('div');
        d.className = 'pp-move-row';
        d.style.borderLeft = `3px solid ${md ? TYPE_COLOR[md.type] || '#888' : '#888'}`;
        d.innerHTML = `<span>${m}</span><span style="color:#aaa;font-size:0.6em">${pp}/${md?.pp || '?'}PP</span>`;
        ml.appendChild(d);
      });
    }
    const ptitle = document.getElementById('pp-title');
    if (ptitle) ptitle.textContent = `${playerPoke.name}  Lv.${playerPoke.level}`;
  }
  function closePokemonPanel() { pokemonPanel.classList.add('hidden'); gameState = 'overworld'; }

  // ─── SHOP ─────────────────────────────────────────────────────────────
  const shopPanel = document.getElementById('shop-panel');
  document.getElementById('shop-close')?.addEventListener('click', () => { sfxCancel(); closeShop(); });
  document.getElementById('shop-buy-btn')?.addEventListener('click', () => { sfxConfirm(); buyItem(); });

  function openShop() {
    gameState = 'shop'; selectedShopOpt = 0; shopItem = null;
    const list = document.getElementById('shop-items');
    if (list) {
      list.innerHTML = '';
      SHOP_ITEMS.forEach((it, i) => {
        const d = document.createElement('div');
        d.className = 'shop-item' + (i === 0 ? ' selected' : '');
        d.innerHTML = `<span class="shop-item-icon">${it.emoji}</span><span class="shop-item-name">${it.name}</span><span class="shop-item-price">₽${it.price}</span>`;
        d.addEventListener('click', () => { selectedShopOpt = i; sfxMenu(); updateShopUI(); });
        list.appendChild(d);
      });
    }
    updateShopUI();
    shopPanel.classList.remove('hidden');
    renderShopBag();
  }
  function closeShop() { shopPanel.classList.add('hidden'); gameState = 'overworld'; }
  function updateShopUI() {
    document.querySelectorAll('.shop-item').forEach((el, i) => el.classList.toggle('selected', i === selectedShopOpt));
    const it = SHOP_ITEMS[selectedShopOpt];
    if (!it) return;
    shopItem = it;
    document.getElementById('shop-item-name').textContent = it.name;
    document.getElementById('shop-item-desc').textContent = it.desc;
    document.getElementById('shop-item-price').textContent = `₽${it.price}`;
    document.getElementById('shop-wallet-val').textContent = playerMoney;
    const buyBtn = document.getElementById('shop-buy-btn');
    if (buyBtn) buyBtn.classList.toggle('hidden', playerMoney < it.price);
  }
  function buyItem() {
    if (!shopItem || playerMoney < shopItem.price) return;
    playerMoney -= shopItem.price;
    const existing = playerBag.find(b => b.id === shopItem.id);
    if (existing) existing.qty++;
    else playerBag.push({ id: shopItem.id, name: shopItem.name, emoji: shopItem.emoji, effect: shopItem.effect, qty: 1 });
    sfxLevelUp();
    updateHUD(); updateShopUI(); renderShopBag();
    showToast(`Bought ${shopItem.name}! ₽${playerMoney} left`);
  }
  function renderShopBag() {
    const el = document.getElementById('shop-bag-preview');
    if (!el) return;
    el.innerHTML = '';
    if (!playerBag.length) { el.innerHTML = '<div class="bag-preview-item"><span>Empty</span></div>'; return; }
    playerBag.forEach(it => {
      const d = document.createElement('div'); d.className = 'bag-preview-item';
      d.innerHTML = `<span>${it.emoji} ${it.name}</span><span>×${it.qty}</span>`;
      el.appendChild(d);
    });
  }
  function handleShopInput(key) {
    if (key === 'up' && selectedShopOpt > 0)                    { selectedShopOpt--; sfxMenu(); updateShopUI(); }
    if (key === 'down' && selectedShopOpt < SHOP_ITEMS.length - 1) { selectedShopOpt++; sfxMenu(); updateShopUI(); }
    if (key === 'A') { sfxConfirm(); buyItem(); }
    if (key === 'B') { sfxCancel(); closeShop(); }
  }

  // ─── MAIN LOOP ────────────────────────────────────────────────────────
  function gameLoop() {
    frameCount++;
    if (gameState === 'intro') {
      if (introBgCtx) drawIntroStars(introBgCtx, W, H);
    } else if (['overworld', 'dialog', 'menu', 'pokemon-panel', 'shop'].includes(gameState)) {
      ctx.clearRect(0, 0, W, H);
      if (gameState === 'overworld') updateMovement();
      updateCamera();
      drawOverworld();
      updateDayNight();
    } else if (gameState === 'battle') {
      if (enemySpCtx && enemySpCanvas) drawPokemonSprite(enemySpCtx, enemyPoke.emoji, enemySpCanvas.width, frameCount, true);
      if (playerSpCtx && playerSpCanvas) drawPokemonSprite(playerSpCtx, playerPoke.emoji, playerSpCanvas.width, frameCount, false);
      updateBattleParticles();
    }
    requestAnimationFrame(gameLoop);
  }

  // ─── INIT ─────────────────────────────────────────────────────────────
  player.px = player.x * 28; player.py = player.y * 28;
  resize();
  generateIntroStars(W, H);
  dayTime = Math.random();

  // Add Pokédex to menu if missing
  const menuDiv = document.getElementById('start-menu');
  if (menuDiv) {
    const saveItem = menuDiv.querySelector('[data-action="save"]');
    if (saveItem && !menuDiv.querySelector('[data-action="pokedex"]')) {
      const pdxItem = document.createElement('div');
      pdxItem.className = 'menu-item';
      pdxItem.dataset.action = 'pokedex';
      pdxItem.textContent = '📕 POKÉDEX';
      menuDiv.insertBefore(pdxItem, saveItem);
    }
  }

  // Load save
  const sv = tryLoadSave();
  if (sv) {
    const el = document.getElementById('intro-save-info');
    if (el) el.textContent = `Continue: ${sv.name} · ${sv.pokemon} Lv.${sv.level} · ${sv.wins || 0} wins · ₽${sv.money || 0}`;
  }

  // Weather
  const weathers = ['clear', 'clear', 'clear', 'clear', 'rain', 'snow', 'fog'];
  initWeather(weathers[Math.floor(Math.random() * weathers.length)]);

  // Init NPCs
  updateNPCsForLocation();

  // Intro key
  document.addEventListener('keydown', e => {
    if ((e.key === 'Enter' || e.key === ' ') && gameState === 'intro') { ensureAudio(); sfxConfirm(); showStarter(); }
  });

  gameLoop();
})();
