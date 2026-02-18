// ══════════════════════════════════════════════════════════════════════
//  POKÉMON RED — Upgraded Fan Edition  ·  game.js
//  NEW: Starter select · Day/Night · NPC Trainers · Web Audio SFX
//       Item Shop · Pokéballs · Type effectiveness · Animated sprites
//       Minimap · Status effects · Particle system · Level cap 50
// ══════════════════════════════════════════════════════════════════════
(function () {
  'use strict';

  // ─── CANVAS ──────────────────────────────────────────────────────────
  const canvas   = document.getElementById('gameCanvas');
  const ctx      = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  const battleBgCanvas  = document.getElementById('battleBgCanvas');
  const battleBgCtx     = battleBgCanvas  && battleBgCanvas.getContext('2d');
  const battleFxCanvas  = document.getElementById('battleFxCanvas');
  const battleFxCtx     = battleFxCanvas  && battleFxCanvas.getContext('2d');
  const enemySpCanvas   = document.getElementById('enemySpriteCanvas');
  const enemySpCtx      = enemySpCanvas   && enemySpCanvas.getContext('2d');
  const playerSpCanvas  = document.getElementById('playerSpriteCanvas');
  const playerSpCtx     = playerSpCanvas  && playerSpCanvas.getContext('2d');
  const minimapCanvas   = document.getElementById('minimapCanvas');
  const minimapCtx      = minimapCanvas   && minimapCanvas.getContext('2d');
  const introBgCanvas   = document.getElementById('introBgCanvas');
  const introBgCtx      = introBgCanvas   && introBgCanvas.getContext('2d');

  let W = 0, H = 0, TILE = 0;
  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
    if (battleBgCanvas)  { battleBgCanvas.width = W; battleBgCanvas.height = H; }
    if (battleFxCanvas)  { battleFxCanvas.width = W; battleFxCanvas.height = H; }
    if (introBgCanvas)   { introBgCanvas.width  = W; introBgCanvas.height  = H; }
    TILE = Math.max(28, Math.floor(Math.min(W, H) / 20));
    if (introBgCanvas && gameState === 'intro') drawIntroStars(introBgCtx, W, H);
    if (gameState !== 'intro' && gameState !== 'starter') updateCamera();
  }
  window.addEventListener('resize', resize);

  // ─── PALETTE ─────────────────────────────────────────────────────────
  const C = {
    bg:'#9bbc0f', dark:'#0f380f', mid:'#306230', light:'#8bac0f',
    white:'#e0f8d0', path:'#c8b560', water:'#2858b0', waterL:'#5888e8',
    sand:'#d4b060', tree2:'#1c3808', red:'#cc2200', flower:'#ff6080',
  };

  // ─── TILE TYPES ──────────────────────────────────────────────────────
  const T = {
    GRASS:0, TALL:1, TREE:2, PATH:3, WATER:4, HOUSE:5,
    SIGN:6, WALL:7, FLOWER:8, SAND:9, FENCE:10,
    POKE_CENTER:11, MART:12, NPC:13, CAVE:14, BRIDGE:15,
  };

  // ─── MAP (38 × 30) ───────────────────────────────────────────────────
  const MW = 38, MH = 30;
  // prettier-ignore
  const MAP = [
    2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,
    2,3,3,3,3,3,3,2,1,1,1,1,1,1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,
    2,3,0,0,11,0,3,2,1,1,1,1,1,1,2,6,0,0,0,0,8,0,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,
    2,3,0,0,0,0,3,3,1,1,1,1,1,1,2,0,0,0,0,0,0,0,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,
    2,3,0,0,5,0,3,2,1,1,1,1,1,1,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,2,
    2,3,0,12,0,0,3,2,0,0,0,0,0,0,3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,3,2,
    2,3,3,3,3,3,3,3,0,0,0,0,0,0,3,0,5,0,0,5,0,0,0,0,0,8,8,0,0,0,2,2,0,0,5,0,3,2,
    2,2,10,10,10,2,2,2,1,1,1,1,1,1,3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,2,0,0,0,0,3,2,
    4,4,4,15,4,4,4,4,1,1,1,1,1,1,3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,2,0,0,0,0,3,2,
    4,4,4,15,4,4,4,4,1,1,1,1,1,1,3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,3,3,3,3,3,3,3,2,
    4,4,4,15,4,4,4,4,0,0,0,0,0,0,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,
    2,2,2,3,2,2,2,2,0,0,0,0,0,0,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,
    2,1,1,3,1,1,2,2,0,0,0,0,0,0,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,
    2,1,1,3,1,1,2,2,1,1,1,1,1,1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,
    2,1,1,3,1,1,2,2,1,1,1,1,1,1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,
    2,2,2,3,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,
    2,9,9,3,9,9,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,
    2,9,9,3,9,9,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,
    4,4,4,3,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,
    4,4,4,3,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,
    2,2,2,3,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,
    2,0,0,3,0,0,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,
    2,0,0,3,0,0,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,
    2,1,1,3,1,1,1,1,1,1,1,1,1,1,1,1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,
    2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,
    2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,
    2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,
    2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,
    2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,
    2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,
  ];

  const SIGNS = {
    '15-2': 'PALLET TOWN\nA TRANQUIL SETTING\nOF RUSTIC PURSUIT',
    '8-1':  'ROUTE 1\nWILD POKÉMON LIVE\nIN THE TALL GRASS!',
    '25-2': 'ROUTE 2 — NORTH\nPEWTER CITY 5km →',
  };

  // NPC data: { tx, ty, emoji, dir, dialog[] }
  const NPCS = [
    { tx:4, ty:6,  emoji:'👴', dir:2, name:'OLD MAN',    dialog:["In my day, we used\nABRA to teleport!","Those were simpler times..."] },
    { tx:17,ty:5,  emoji:'👧', dir:1, name:'LASS',       dialog:["La la la! I love\nPOKÉMON so much!","CLEFAIRY is my\nfavourite!"] },
    { tx:33,ty:6,  emoji:'👦', dir:0, name:'TRAINER',    dialog:["I\'m gonna be the\ngreatest TRAINER!","Battle me after\nyou beat the GYM."], trainer:true, pokemon:'RATTATA', level:4 },
    { tx:19,ty:8,  emoji:'🧓', dir:3, name:'FISHERMAN',  dialog:["The lake to the south\nis full of MAGIKARP!","They\'re weak, but\nGYARADOS is fearsome."] },
  ];

  // ─── POKÉMON DATABASE ─────────────────────────────────────────────
  const POKEMON = {
    BULBASAUR:  {name:'BULBASAUR',  emoji:'🌱', type:['GRASS','POISON'], maxHp:22, atk:9,  def:9,  spd:7,  moves:['TACKLE','VINE WHIP','GROWL','LEECH SEED'],     xpY:64,  desc:'A seed Pokémon. The bulb on its back grows larger as it evolves.'},
    CHARMANDER: {name:'CHARMANDER',emoji:'🔥', type:['FIRE'],           maxHp:18, atk:12, def:6,  spd:10, moves:['SCRATCH','EMBER','GROWL','TAIL WHIP'],           xpY:62,  desc:'The flame on its tail flickers when it\'s happy and blazes in battle.'},
    SQUIRTLE:   {name:'SQUIRTLE',  emoji:'🐢', type:['WATER'],          maxHp:20, atk:10, def:11, spd:8,  moves:['TACKLE','WATER GUN','TAIL WHIP','GROWL'],         xpY:65,  desc:'Its shell hardens after it withdraws. A formidable defensive Pokémon.'},
    PIKACHU:    {name:'PIKACHU',   emoji:'⚡', type:['ELECTRIC'],       maxHp:16, atk:14, def:6,  spd:14, moves:['THUNDER SHOCK','QUICK ATK','GROWL','TAIL WHIP'],  xpY:82,  desc:'Its cheeks store electricity. When threatened, it discharges instantly.'},
    PIDGEY:     {name:'PIDGEY',    emoji:'🐦', type:['NORMAL','FLYING'],maxHp:14, atk:7,  def:5,  spd:9,  moves:['TACKLE','GUST','SAND-ATTACK'],                   xpY:55,  desc:'Very docile. Hides in grass. Excellent flier despite its small size.'},
    RATTATA:    {name:'RATTATA',   emoji:'🐭', type:['NORMAL'],         maxHp:12, atk:8,  def:4,  spd:11, moves:['TACKLE','QUICK ATK','BITE'],                     xpY:57,  desc:'It gnaws on anything with its powerful teeth to keep them sharp.'},
    CATERPIE:   {name:'CATERPIE',  emoji:'🐛', type:['BUG'],            maxHp:10, atk:5,  def:7,  spd:4,  moves:['TACKLE','STRING SHOT'],                         xpY:53,  desc:'A voracious eater that devours leaves with reckless abandon.'},
    WEEDLE:     {name:'WEEDLE',    emoji:'🐝', type:['BUG','POISON'],   maxHp:10, atk:7,  def:5,  spd:6,  moves:['POISON STING','STRING SHOT'],                   xpY:52,  desc:'Its needles are venomous. Avoid the tip at all costs!'},
    ZUBAT:      {name:'ZUBAT',     emoji:'🦇', type:['POISON','FLYING'],maxHp:13, atk:7,  def:5,  spd:9,  moves:['LEECH LIFE','SUPERSONIC','BITE'],               xpY:54,  desc:'Has no eyes. It relies on ultrasonic waves to navigate.'},
    GEODUDE:    {name:'GEODUDE',   emoji:'🪨', type:['ROCK','GROUND'],  maxHp:18, atk:10, def:16, spd:3,  moves:['TACKLE','ROCK THROW','DEFENSE CURL'],           xpY:86,  desc:'Found on mountain paths. Climbers often mistake it for a boulder.'},
    JIGGLYPUFF: {name:'JIGGLYPUFF',emoji:'🎤', type:['NORMAL','FAIRY'], maxHp:24, atk:7,  def:4,  spd:6,  moves:['TACKLE','SING','POUND','DISABLE'],              xpY:76,  desc:'Its lullaby causes deep sleep. It keeps singing until the listener dozes off.'},
    MEOWTH:     {name:'MEOWTH',    emoji:'🐱', type:['NORMAL'],         maxHp:14, atk:9,  def:5,  spd:12, moves:['SCRATCH','BITE','GROWL','PAY DAY'],             xpY:69,  desc:'Fascinated by round, shiny objects. It wanders the streets at night.'},
  };

  // ─── MOVES DATABASE ───────────────────────────────────────────────
  const MOVES = {
    'TACKLE':       {pwr:12,type:'NORMAL',  pp:35,acc:100,cat:'physical',desc:'A full-body tackle.'},
    'SCRATCH':      {pwr:12,type:'NORMAL',  pp:35,acc:100,cat:'physical',desc:'Scratches with sharp claws.'},
    'WATER GUN':    {pwr:22,type:'WATER',   pp:25,acc:100,cat:'special', desc:'Squirts water to attack.'},
    'VINE WHIP':    {pwr:20,type:'GRASS',   pp:25,acc:100,cat:'physical',desc:'Strikes with slender vines.'},
    'EMBER':        {pwr:22,type:'FIRE',    pp:25,acc:100,cat:'special', desc:'A weak flame. May BURN.'},
    'THUNDER SHOCK':{pwr:20,type:'ELECTRIC',pp:30,acc:100,cat:'special', desc:'Zaps the foe with electricity. May PARALYZE.'},
    'GUST':         {pwr:18,type:'FLYING',  pp:35,acc:100,cat:'special', desc:'A gust of whirling winds.'},
    'QUICK ATK':    {pwr:16,type:'NORMAL',  pp:30,acc:100,cat:'physical',desc:'An almost invisible attack. Hits first.'},
    'BITE':         {pwr:20,type:'DARK',    pp:25,acc:100,cat:'physical',desc:'Bites hard. May cause flinching.'},
    'POISON STING': {pwr:16,type:'POISON',  pp:35,acc:100,cat:'physical',desc:'Stabs with a toxic needle. May POISON.'},
    'ROCK THROW':   {pwr:24,type:'ROCK',    pp:15,acc:90, cat:'physical',desc:'Hurls small rocks at the foe.'},
    'LEECH LIFE':   {pwr:12,type:'BUG',     pp:15,acc:100,cat:'physical',desc:'Drains blood to restore HP.'},
    'POUND':        {pwr:10,type:'NORMAL',  pp:35,acc:100,cat:'physical',desc:'Pounds with long tails or forelegs.'},
    'PAY DAY':      {pwr:18,type:'NORMAL',  pp:20,acc:100,cat:'physical',desc:'Coin attack. Earn money after battle!'},
    'GROWL':        {pwr:0, type:'NORMAL',  pp:40,acc:100,cat:'status',  desc:'Lowers the foe\'s ATK.'},
    'TAIL WHIP':    {pwr:0, type:'NORMAL',  pp:30,acc:100,cat:'status',  desc:'Lowers the foe\'s DEF.'},
    'SING':         {pwr:0, type:'NORMAL',  pp:15,acc:55, cat:'status',  desc:'Puts the foe to sleep.'},
    'SUPERSONIC':   {pwr:0, type:'NORMAL',  pp:20,acc:55, cat:'status',  desc:'Confuses the foe.'},
    'LEECH SEED':   {pwr:0, type:'GRASS',   pp:10,acc:90, cat:'status',  desc:'Plants a seed that drains HP each turn.'},
    'SAND-ATTACK':  {pwr:0, type:'NORMAL',  pp:15,acc:100,cat:'status',  desc:'Reduces the foe\'s accuracy.'},
    'STRING SHOT':  {pwr:0, type:'BUG',     pp:40,acc:95, cat:'status',  desc:'Sprays string to lower SPD.'},
    'DEFENSE CURL': {pwr:0, type:'NORMAL',  pp:40,acc:100,cat:'status',  desc:'Raises the user\'s DEF.'},
    'DISABLE':      {pwr:0, type:'NORMAL',  pp:20,acc:100,cat:'status',  desc:'Disables the foe\'s last move.'},
  };

  // Type effectiveness chart (attacker type → defender types)
  const TYPE_EFF = {
    FIRE:   {GRASS:2,ICE:2,BUG:2,STEEL:2,  WATER:.5,ROCK:.5,FIRE:.5,DRAGON:.5},
    WATER:  {FIRE:2,GROUND:2,ROCK:2,        GRASS:.5,WATER:.5,DRAGON:.5},
    GRASS:  {WATER:2,GROUND:2,ROCK:2,       FIRE:.5,GRASS:.5,POISON:.5,FLYING:.5,BUG:.5,DRAGON:.5,STEEL:.5},
    ELECTRIC:{WATER:2,FLYING:2,            GRASS:.5,ELECTRIC:.5,DRAGON:.5, GROUND:0},
    NORMAL: {ROCK:.5,STEEL:.5,             GHOST:0},
    FLYING: {GRASS:2,FIGHTING:2,BUG:2,     ROCK:.5,STEEL:.5,ELECTRIC:.5},
    ROCK:   {FIRE:2,ICE:2,FLYING:2,BUG:2,  FIGHTING:.5,GROUND:.5,STEEL:.5},
    POISON: {GRASS:2,FAIRY:2,              POISON:.5,GROUND:.5,ROCK:.5,GHOST:.5, STEEL:0},
    BUG:    {GRASS:2,PSYCHIC:2,DARK:2,     FIRE:.5,FIGHTING:.5,FLYING:.5,GHOST:.5,STEEL:.5,FAIRY:.5},
    DARK:   {PSYCHIC:2,GHOST:2,            FIGHTING:.5,DARK:.5,FAIRY:.5},
  };

  function typeEffectiveness(atkType, defTypes) {
    let mult = 1;
    for (const dt of defTypes) {
      mult *= (TYPE_EFF[atkType]?.[dt] ?? 1);
    }
    return mult;
  }

  const TYPE_COLOR = {
    NORMAL:'#a0a080',FIRE:'#e84820',WATER:'#4888f8',GRASS:'#78c840',
    ELECTRIC:'#f8d030',BUG:'#a8b820',ROCK:'#b8a038',POISON:'#a040a0',
    FLYING:'#a890f0',DARK:'#705848',ICE:'#98d8d8',PSYCHIC:'#f85888',
    FAIRY:'#f0b6bc',GROUND:'#d8b060',GHOST:'#705898',DRAGON:'#7038f8',
    STEEL:'#b8b8d0',FIGHTING:'#c03020',
  };

  const WILD_TALL  = ['PIDGEY','RATTATA','CATERPIE','WEEDLE','JIGGLYPUFF'];
  const WILD_DEEP  = ['PIDGEY','RATTATA','ZUBAT','GEODUDE','MEOWTH'];
  const WILD_WATER = ['RATTATA','CATERPIE','JIGGLYPUFF'];

  // ─── SHOP ITEMS ───────────────────────────────────────────────────
  const SHOP_ITEMS = [
    { id:'POTION',      name:'POTION',      emoji:'💊', price:300, desc:'Restores 20 HP to one Pokémon.',      effect:'heal20' },
    { id:'SUPER_POTION',name:'SUPER POTION',emoji:'💉', price:700, desc:'Restores 50 HP to one Pokémon.',      effect:'heal50' },
    { id:'POKEBALL',    name:'POKÉ BALL',   emoji:'⚫', price:200, desc:'A device used to catch wild Pokémon.', effect:'catch' },
    { id:'GREAT_BALL',  name:'GREAT BALL',  emoji:'🔵', price:600, desc:'A better Poké Ball. Higher catch rate.', effect:'catch_great' },
    { id:'ANTIDOTE',    name:'ANTIDOTE',    emoji:'🧪', price:100, desc:'Cures a Pokémon of POISON.',            effect:'cure_psn' },
    { id:'PARALYZE_HEAL',name:'PARALYZE HEAL',emoji:'⚡',price:200,desc:'Cures PARALYSIS.',                     effect:'cure_prz' },
    { id:'ESCAPE_ROPE', name:'ESCAPE ROPE', emoji:'🪢', price:550, desc:'Use to escape from caves.',            effect:'escape' },
  ];

  // ─── GAME STATE ───────────────────────────────────────────────────
  let gameState     = 'intro'; // intro|starter|overworld|dialog|battle|menu|pokemon-panel|shop|gameover
  let playerPoke    = null;
  let playerHp      = 0, playerXp = 0, playerXpNext = 100;
  let playerMoney   = 500, playerBadges = 0;
  let playerBag     = []; // { id, name, emoji, effect, qty }
  let enemyPoke     = null, enemyHp = 0;
  let enemyStatus   = null, playerStatus = null; // null | 'psn' | 'prz' | 'slp' | 'brn'
  let battleState   = 'choose'; // choose|fight|anim|result|catch
  let selectedBOpt  = 0, selectedMOpt = 0, selectedMenuOpt = 0, selectedBagOpt = 0;
  let selectedShopOpt = 0;
  let dialogQueue   = [], dialogCallback = null, dialogPortrait = '💬', dialogSpeaker = '';
  let cameraX = 0, cameraY = 0;
  let steps = 0, wins = 0, frameCount = 0;
  let location = 'PALLET TOWN';
  let weather = 'clear'; // clear|rain|snow|fog
  let weatherParts  = [];
  let battleParts   = []; // battle particle system
  let minimapVisible = true;
  let hintFaded     = false;
  let dayTime       = 0;    // 0-1, full day cycle, advances each frame
  let starterIdx    = 1;    // currently highlighted starter card
  let selectedNpc   = null;
  let toastTimer    = null;
  let shopItem      = null; // selected shop item
  let npcDefeated   = {};   // track trainer defeats
  let introBgStars  = [];

  // ─── PLAYER ───────────────────────────────────────────────────────
  const player = {
    x:5, y:3, px:5*28, py:3*28, dir:2, moving:false, _pendingBattle:null, name:'RED',
  };

  // ─── WEB AUDIO SFX ────────────────────────────────────────────────
  let audioCtx = null;
  function ensureAudio() {
    if (!audioCtx) { try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch(e){} }
    if (audioCtx?.state === 'suspended') audioCtx.resume().catch(()=>{});
  }
  function playTone(freq, dur, type='square', vol=0.12, delay=0) {
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
    } catch(e){}
  }
  function sfxStep()    { playTone(220,0.04,'square',0.04); }
  function sfxConfirm() { playTone(440,0.07,'square',0.1); playTone(660,0.1,'square',0.1,0.07); }
  function sfxCancel()  { playTone(300,0.06,'square',0.08); playTone(200,0.08,'square',0.08,0.06); }
  function sfxHit()     { playTone(180,0.12,'sawtooth',0.14); playTone(120,0.1,'sawtooth',0.1,0.06); }
  function sfxFaint()   { [500,400,300,200,150].forEach((f,i)=>playTone(f,0.1,'square',0.1,i*0.1)); }
  function sfxLevelUp() { [330,440,550,660,880].forEach((f,i)=>playTone(f,0.12,'square',0.12,i*0.08)); }
  function sfxCatch()   { [440,330,220,330,440,550].forEach((f,i)=>playTone(f,0.1,'square',0.1,i*0.12)); }
  function sfxEncounter(){ [200,250,200,300,400].forEach((f,i)=>playTone(f,0.08,'sawtooth',0.15,i*0.06)); }
  function sfxMenu()    { playTone(330,0.05,'square',0.08); }

  // ─── INPUT ────────────────────────────────────────────────────────
  const keys = {};
  const keyMap = {
    'ArrowUp':'up','ArrowDown':'down','ArrowLeft':'left','ArrowRight':'right',
    'w':'up','s':'down','a':'left','d':'right',
    'z':'a','x':'b','Enter':'a','Escape':'b',' ':'start','m':'map',
  };
  document.addEventListener('keydown', e => {
    const k = keyMap[e.key] ?? e.key.toLowerCase();
    if (!keys[k]) { keys[k] = true; handleInput(k); }
    if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(e.key)) e.preventDefault();
  });
  document.addEventListener('keyup', e => {
    const k = keyMap[e.key] ?? e.key.toLowerCase();
    keys[k] = false;
  });

  function handleInput(key) {
    ensureAudio();
    if (!hintFaded && (key==='up'||key==='down'||key==='left'||key==='right')) {
      hintFaded = true;
      document.getElementById('controls-hint')?.classList.add('fade');
    }
    if (gameState === 'intro') {
      if (key==='a'||key==='start') { sfxConfirm(); showStarter(); }
      return;
    }
    if (gameState === 'starter') { handleStarterInput(key); return; }
    if (gameState === 'dialog')  { if (key==='a'||key==='b') { sfxConfirm(); advanceDialog(); } return; }
    if (gameState === 'battle')  { handleBattleInput(key); return; }
    if (gameState === 'menu')    { handleMenuInput(key); return; }
    if (gameState === 'pokemon-panel') { if (key==='b'||key==='start') closePokemonPanel(); return; }
    if (gameState === 'shop')    { handleShopInput(key); return; }
    if (gameState === 'overworld') {
      if (key==='start' || key==='a' && gameState==='overworld') {
        if (key==='start') { sfxMenu(); openMenu(); }
        else interact();
      }
      if (key==='map') toggleMinimap();
    }
  }

  // ─── INTRO ────────────────────────────────────────────────────────
  function generateIntroStars(w, h) {
    introBgStars = Array.from({length:120},()=>({
      x:Math.random()*w, y:Math.random()*h,
      r:Math.random()*1.5+.3, spd:Math.random()*.3+.1,
      twinkle:Math.random()*Math.PI*2, col:Math.random()<.1?'#ffcc44':'#e0f8d0',
    }));
  }
  function drawIntroStars(c, w, h) {
    if (!c) return;
    c.fillStyle = 'rgba(0,0,0,.18)';
    c.fillRect(0,0,w,h);
    for (const s of introBgStars) {
      const alpha = 0.4+0.6*Math.abs(Math.sin(s.twinkle));
      c.fillStyle = s.col;
      c.globalAlpha = alpha;
      c.beginPath();
      c.arc(s.x, s.y, s.r, 0, Math.PI*2);
      c.fill();
      s.twinkle += .02; s.y -= s.spd;
      if (s.y < -2) { s.y = h+2; s.x = Math.random()*w; }
    }
    c.globalAlpha = 1;
  }

  // ─── STARTER SELECTION ────────────────────────────────────────────
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
    if (key==='left')  { starterIdx = Math.max(0, starterIdx-1); sfxMenu(); highlightStarterCard(); }
    if (key==='right') { starterIdx = Math.min(2, starterIdx+1); sfxMenu(); highlightStarterCard(); }
    if (key==='a') confirmStarter();
  }
  // Also allow click on cards
  document.querySelectorAll('.starter-card').forEach((el, i) => {
    el.addEventListener('click', () => {
      ensureAudio(); starterIdx = i;
      highlightStarterCard();
      setTimeout(()=>confirmStarter(), 120);
    });
  });
  function confirmStarter() {
    const names = ['BULBASAUR','CHARMANDER','SQUIRTLE'];
    const chosen = names[starterIdx];
    sfxLevelUp();
    playerPoke = deepClone(POKEMON[chosen]);
    playerHp   = playerPoke.maxHp; playerXp = 0; playerXpNext = 100;
    steps = 0; wins = 0;
    document.getElementById('starter-screen').classList.add('hidden');
    document.getElementById('game-wrap').classList.remove('hidden');
    gameState = 'overworld';
    resize();
    player.px = player.x * TILE; player.py = player.y * TILE;
    updateHUD();
    showDialog([
      `You chose ${playerPoke.name}!\nA fine choice!`,
      "My grandson also\nhas a POKÉMON!\nI hope you meet someday.",
      "Walk into TALL GRASS\nfor wild encounters.\nPress A near buildings & signs.",
      "Visit the POKÉMON\nCENTER to heal!\nCheck the MART too.",
    ], ()=>{ gameState='overworld'; }, '🎓', 'PROF. OAK');
  }

  // ─── DEEP CLONE ───────────────────────────────────────────────────
  function deepClone(o) { return JSON.parse(JSON.stringify(o)); }

  // ─── MAP HELPERS ──────────────────────────────────────────────────
  function getTile(tx, ty) {
    if (tx<0||ty<0||tx>=MW||ty>=MH) return T.WALL;
    return MAP[ty*MW+tx];
  }
  function isBlocked(tile, nx, ny) {
    if (tile===T.TREE||tile===T.WALL||tile===T.WATER||tile===T.FENCE) return true;
    // Check NPCs
    for (const n of NPCS) if (n.tx===nx&&n.ty===ny) return true;
    return false;
  }

  // ─── TILE RENDERING ───────────────────────────────────────────────
  const tileColorMap = {
    [T.GRASS]:'#9bbc0f',[T.TALL]:'#306230',[T.TREE]:'#0f380f',[T.PATH]:'#c8b560',
    [T.WATER]:'#2858b0',[T.HOUSE]:'#306230',[T.POKE_CENTER]:'#bf7070',[T.MART]:'#6090c0',
    [T.SIGN]:'#8bac0f',[T.WALL]:'#0f380f',[T.FLOWER]:'#9bbc0f',[T.SAND]:'#d4b060',
    [T.FENCE]:'#8b5a2b',[T.CAVE]:'#2a2a2a',[T.BRIDGE]:'#c8a050',
  };

  function drawTile(t, x, y, s) {
    ctx.fillStyle = tileColorMap[t] ?? '#9bbc0f';
    ctx.fillRect(x, y, s, s);
    const q = s/8;

    switch(t) {
      case T.TREE:
        ctx.fillStyle='#306230'; ctx.fillRect(x+q,y+q,s-2*q,s-2*q);
        ctx.fillStyle='#1c3808'; ctx.fillRect(x+2*q,y+2*q,s-4*q,s-4*q);
        ctx.fillStyle='#0f380f'; ctx.fillRect(x+3*q,y+5*q,2*q,3*q);
        break;
      case T.HOUSE:
        ctx.fillStyle='#d4c080'; ctx.fillRect(x+q,y+3*q,s-2*q,5*q);
        ctx.fillStyle='#0f380f'; ctx.fillRect(x+3*q,y+4*q,2*q,4*q);
        ctx.fillStyle='#90c8f0'; ctx.fillRect(x+5*q,y+4*q,2*q,2*q);
        ctx.fillStyle=C.red;     ctx.fillRect(x,y+q,s,3*q); ctx.fillRect(x+2*q,y,4*q,2*q);
        break;
      case T.POKE_CENTER:
        ctx.fillStyle='#c09090'; ctx.fillRect(x+q,y+3*q,s-2*q,5*q);
        ctx.fillStyle='#fff';    ctx.fillRect(x+2*q,y+4*q,4*q,4*q);
        ctx.fillStyle='#d04040'; ctx.fillRect(x,y+q,s,3*q); ctx.fillRect(x+2*q,y,4*q,2*q);
        ctx.fillStyle='#ff9090'; ctx.fillRect(x+3*q,y+q,2*q,2*q);
        break;
      case T.MART:
        ctx.fillStyle='#90b8d8'; ctx.fillRect(x+q,y+3*q,s-2*q,5*q);
        ctx.fillStyle='#4070a0'; ctx.fillRect(x,y+q,s,3*q);
        ctx.fillStyle='#fff';    ctx.fillRect(x+2*q,y+4*q,4*q,3*q);
        ctx.fillStyle='#70b8ff'; ctx.fillRect(x+3*q,y+q,2*q,2*q);
        break;
      case T.SIGN:
        ctx.fillStyle=C.path;  ctx.fillRect(x+2*q,y+2*q,4*q,3*q);
        ctx.fillStyle=C.dark;  ctx.fillRect(x+3*q,y+q,2*q,2*q); ctx.fillRect(x+3*q,y+5*q,2*q,3*q);
        break;
      case T.FLOWER: {
        const fa = Math.floor(frameCount/28)%2;
        ctx.fillStyle=C.flower;
        ctx.fillRect(x+(fa?4:2)*q,y+2*q,2*q,2*q);
        ctx.fillRect(x+(fa?2:5)*q,y+5*q,2*q,2*q);
        ctx.fillStyle='#50c820'; ctx.fillRect(x+3*q,y+3*q,q,4*q);
        break;
      }
      case T.WATER: {
        const w2 = Math.floor(frameCount/15)%3;
        ctx.fillStyle=C.waterL;
        ctx.fillRect(x+w2*q,y+2*q,3*q,q); ctx.fillRect(x+(5-w2)*q,y+5*q,3*q,q);
        break;
      }
      case T.TALL:
        ctx.fillStyle=C.light;
        ctx.fillRect(x+q,y,2*q,6*q); ctx.fillRect(x+5*q,y+q,2*q,5*q);
        ctx.fillStyle=C.bg; ctx.fillRect(x+q,y+6*q,2*q,2*q);
        break;
      case T.FENCE:
        ctx.fillStyle='#6b3a1f';
        ctx.fillRect(x,y+3*q,s,q); ctx.fillRect(x+2*q,y+q,q,6*q); ctx.fillRect(x+5*q,y+q,q,6*q);
        break;
      case T.BRIDGE:
        ctx.fillStyle='#b89040'; ctx.fillRect(x,y+2*q,s,4*q);
        ctx.fillStyle='#8a6020'; ctx.fillRect(x,y+2*q,q,4*q); ctx.fillRect(x+7*q,y+2*q,q,4*q);
        break;
      case T.CAVE:
        ctx.fillStyle='#1a1a1a'; ctx.fillRect(x+q,y+q,s-2*q,s-2*q);
        ctx.fillStyle='#333';    ctx.fillRect(x+2*q,y+2*q,2*q,q); ctx.fillRect(x+5*q,y+3*q,2*q,q);
        break;
    }
  }

  // ─── PLAYER SPRITE ────────────────────────────────────────────────
  function drawPlayer() {
    const sx = Math.round(player.px - cameraX);
    const sy = Math.round(player.py - cameraY);
    const q  = TILE/8;
    const bob = player.moving ? Math.floor(frameCount/4)%2 : 0;

    // Shadow
    ctx.fillStyle='rgba(0,0,0,.22)';
    ctx.beginPath();
    ctx.ellipse(sx+TILE/2, sy+TILE-q*.5, TILE/2.5, q*.7, 0, 0, Math.PI*2);
    ctx.fill();

    // Shoes
    ctx.fillStyle='#303030';
    if (bob) {
      ctx.fillRect(sx+2*q,sy+6*q,2*q,2*q);
      ctx.fillRect(sx+4*q,sy+7*q,2*q,q);
    } else {
      ctx.fillRect(sx+2*q,sy+7*q,2*q,q);
      ctx.fillRect(sx+4*q,sy+6*q,2*q,2*q);
    }
    // Pants
    ctx.fillStyle='#2040a0';
    ctx.fillRect(sx+2*q,sy+5*q,4*q,2*q);
    // Body
    ctx.fillStyle='#c42020';
    ctx.fillRect(sx+2*q,sy+3*q,4*q,3*q);
    ctx.fillStyle='#ffffff'; ctx.fillRect(sx+3*q,sy+3*q,2*q,q);
    // Arms
    ctx.fillStyle='#c42020';
    ctx.fillRect(sx+q,sy+3*q,q,bob?2*q:3*q);
    ctx.fillRect(sx+6*q,sy+3*q,q,bob?3*q:2*q);
    // Skin / head
    ctx.fillStyle='#f5c890';
    ctx.fillRect(sx+2*q,sy+q,4*q,3*q);
    // Eyes by direction
    ctx.fillStyle='#200808';
    if (player.dir===0) { ctx.fillRect(sx+2*q,sy+q,q,q); ctx.fillRect(sx+5*q,sy+q,q,q); }
    else                { ctx.fillRect(sx+2*q,sy+2*q,q,q); ctx.fillRect(sx+5*q,sy+2*q,q,q); }
    // Hat
    ctx.fillStyle='#c42020';
    ctx.fillRect(sx+q,sy-q,6*q,q*2); ctx.fillRect(sx+q,sy,7*q,q);
    ctx.fillStyle='#ffffff'; ctx.fillRect(sx+2*q,sy-q,2*q,q);
  }

  // ─── NPC RENDERING ────────────────────────────────────────────────
  function drawNpcs() {
    for (const npc of NPCS) {
      if (npcDefeated[npc.name] && npc.trainer) continue;
      const sx = Math.round(npc.tx * TILE - cameraX);
      const sy = Math.round(npc.ty * TILE - cameraY);
      if (sx < -TILE || sx > W+TILE || sy < -TILE || sy > H+TILE) continue;
      const q = TILE/8;

      // Shadow
      ctx.fillStyle='rgba(0,0,0,.18)';
      ctx.beginPath();
      ctx.ellipse(sx+TILE/2, sy+TILE-q*.5, TILE/2.5, q*.6, 0, 0, Math.PI*2);
      ctx.fill();

      // Emoji sprite
      ctx.font = `${TILE*0.72}px serif`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
      ctx.fillText(npc.emoji, sx+TILE/2, sy+TILE-q*.5);
      ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';

      // Trainer exclamation mark when near
      if (npc.trainer && !npcDefeated[npc.name]) {
        const dist = Math.abs(player.x-npc.tx)+Math.abs(player.y-npc.ty);
        if (dist <= 3) {
          const pulse = Math.abs(Math.sin(frameCount*0.12));
          ctx.font = `bold ${TILE*0.4}px sans-serif`;
          ctx.fillStyle = `rgba(255,80,0,${0.7+pulse*0.3})`;
          ctx.textAlign = 'center';
          ctx.fillText('!', sx+TILE/2, sy-q);
          ctx.textAlign = 'left';
        }
      }
    }
  }

  // ─── CANVAS SPRITE DRAWING (for battle) ───────────────────────────
  function drawPokemonSprite(c, emoji, size, frame, isEnemy) {
    if (!c) return;
    c.clearRect(0, 0, size, size);
    const bob = isEnemy
      ? Math.sin(frameCount * 0.05) * 8
      : Math.sin(frameCount * 0.06 + 1) * 6;
    c.font = `${size * 0.72}px serif`;
    c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillText(emoji, size/2, size/2 + bob);
    c.textAlign = 'left'; c.textBaseline = 'alphabetic';
  }

  // ─── BATTLE PARTICLE FX ───────────────────────────────────────────
  function spawnBattleParticles(x, y, color, count=18) {
    for (let i=0; i<count; i++) {
      const ang = Math.random()*Math.PI*2;
      const spd = 2+Math.random()*6;
      battleParts.push({
        x, y, vx:Math.cos(ang)*spd, vy:Math.sin(ang)*spd,
        life:1, decay:0.03+Math.random()*0.03, r:3+Math.random()*6,
        color, type:Math.random()<.3?'ring':'dot',
      });
    }
  }
  function updateBattleParticles() {
    if (!battleFxCtx) return;
    battleFxCtx.clearRect(0, 0, W, H);
    battleParts = battleParts.filter(p => p.life > 0);
    for (const p of battleParts) {
      p.x += p.vx; p.y += p.vy; p.vy += 0.15;
      p.vx *= 0.96; p.life -= p.decay;
      battleFxCtx.globalAlpha = p.life;
      if (p.type === 'ring') {
        battleFxCtx.strokeStyle = p.color;
        battleFxCtx.lineWidth = 2;
        battleFxCtx.beginPath();
        battleFxCtx.arc(p.x, p.y, p.r*(2-p.life)*2, 0, Math.PI*2);
        battleFxCtx.stroke();
      } else {
        battleFxCtx.fillStyle = p.color;
        battleFxCtx.beginPath();
        battleFxCtx.arc(p.x, p.y, p.r*p.life, 0, Math.PI*2);
        battleFxCtx.fill();
      }
    }
    battleFxCtx.globalAlpha = 1;
  }

  // ─── DAY / NIGHT SYSTEM ───────────────────────────────────────────
  function updateDayNight() {
    dayTime = (dayTime + 0.00008) % 1; // very slow cycle
    const overlay = document.getElementById('daynight-overlay');
    const timeBox  = document.getElementById('hud-time-box');
    if (!overlay) return;
    let col, icon;
    if (dayTime < 0.25) {
      // Night → Dawn
      const t = dayTime / 0.25;
      col = `rgba(0,0,60,${0.55-t*0.55})`;
      icon = t < 0.5 ? '🌙' : '🌅';
    } else if (dayTime < 0.5) {
      col = 'rgba(0,0,0,0)';
      icon = '☀️';
    } else if (dayTime < 0.75) {
      const t = (dayTime-0.5)/0.25;
      col = `rgba(255,100,0,${t*0.2})`;
      icon = t > 0.6 ? '🌇' : '☀️';
    } else {
      const t = (dayTime-0.75)/0.25;
      col = `rgba(0,0,60,${t*0.55})`;
      icon = '🌙';
    }
    overlay.style.background = col;
    if (timeBox) timeBox.textContent = icon;
  }

  // ─── WEATHER ──────────────────────────────────────────────────────
  function initWeather(type) {
    weather = type;
    weatherParts = [];
    const n = type==='rain'?120:type==='snow'?80:40;
    for (let i=0;i<n;i++) {
      if (type==='rain')  weatherParts.push({x:Math.random()*W,y:Math.random()*H,vx:-2,vy:16});
      if (type==='snow')  weatherParts.push({x:Math.random()*W,y:Math.random()*H,vy:.8,r:1+Math.random()*2.5,ph:Math.random()*Math.PI*2});
      if (type==='fog')   weatherParts.push({x:Math.random()*W,y:Math.random()*H,r:60+Math.random()*100,spd:.2+Math.random()*.3,ph:Math.random()*Math.PI*2});
    }
  }
  function drawWeather() {
    if (weather==='clear') return;
    if (weather==='rain') {
      ctx.strokeStyle='rgba(160,200,255,0.32)'; ctx.lineWidth=1;
      for (const p of weatherParts) {
        ctx.beginPath(); ctx.moveTo(p.x,p.y); ctx.lineTo(p.x-3,p.y+10); ctx.stroke();
        p.x+=p.vx; p.y+=p.vy;
        if (p.y>H){p.y=-10;p.x=Math.random()*W;}
      }
    } else if (weather==='snow') {
      ctx.fillStyle='rgba(255,255,255,.65)';
      for (const p of weatherParts) {
        ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2); ctx.fill();
        p.x+=Math.sin(frameCount*.02+p.ph)*.6; p.y+=p.vy;
        if (p.y>H){p.y=-5;p.x=Math.random()*W;}
      }
    } else if (weather==='fog') {
      for (const p of weatherParts) {
        const alpha=.04+.03*Math.abs(Math.sin(frameCount*.008+p.ph));
        ctx.fillStyle=`rgba(200,200,220,${alpha})`;
        ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2); ctx.fill();
        p.x+=p.spd; if (p.x>W+p.r){p.x=-p.r;}
      }
    }
  }

  // ─── MINIMAP ──────────────────────────────────────────────────────
  function drawMinimap() {
    if (!minimapCtx || !minimapVisible) return;
    const mc = minimapCanvas;
    const cw = mc.width, ch = mc.height;
    const tw = cw/MW, th = ch/MH;
    minimapCtx.fillStyle='#050e05';
    minimapCtx.fillRect(0,0,cw,ch);
    for (let ty=0;ty<MH;ty++) {
      for (let tx=0;tx<MW;tx++) {
        const t = getTile(tx,ty);
        let col;
        if (t===T.WATER||t===T.BRIDGE) col='#2858b0';
        else if (t===T.TREE||t===T.WALL) col='#0f2a0f';
        else if (t===T.TALL) col='#3a6a1a';
        else if (t===T.PATH||t===T.SAND) col='#a89040';
        else if (t===T.GRASS||t===T.FLOWER) col='#487828';
        else if (t===T.POKE_CENTER) col='#cc4444';
        else if (t===T.MART) col='#4488cc';
        else if (t===T.HOUSE) col='#886632';
        else col='#1a3a1a';
        minimapCtx.fillStyle=col;
        minimapCtx.fillRect(tx*tw,ty*th,Math.ceil(tw),Math.ceil(th));
      }
    }
    // Player dot
    minimapCtx.fillStyle='#ff3300';
    minimapCtx.fillRect(player.x*tw-1.5,player.y*th-1.5,3,3);
    // Viewport rect
    minimapCtx.strokeStyle='rgba(155,188,15,.7)';
    minimapCtx.lineWidth=1;
    const vx=(cameraX/TILE)*tw, vy=(cameraY/TILE)*th;
    const vw=(W/TILE)*tw, vh=(H/TILE)*th;
    minimapCtx.strokeRect(vx,vy,vw,vh);
  }
  function toggleMinimap() {
    minimapVisible=!minimapVisible;
    document.getElementById('minimap-wrap')?.classList.toggle('hidden',!minimapVisible);
  }

  // ─── CAMERA ───────────────────────────────────────────────────────
  function updateCamera() {
    const tx = player.px - W/2 + TILE/2;
    const ty = player.py - H/2 + TILE/2;
    cameraX = Math.max(0, Math.min(tx, MW*TILE-W));
    cameraY = Math.max(0, Math.min(ty, MH*TILE-H));
  }

  // ─── OVERWORLD RENDER ─────────────────────────────────────────────
  function drawOverworld() {
    ctx.fillStyle=C.dark; ctx.fillRect(0,0,W,H);
    const sx0=Math.max(0,Math.floor(cameraX/TILE));
    const sy0=Math.max(0,Math.floor(cameraY/TILE));
    const sx1=Math.min(MW,sx0+Math.ceil(W/TILE)+2);
    const sy1=Math.min(MH,sy0+Math.ceil(H/TILE)+2);
    for (let ty=sy0;ty<sy1;ty++)
      for (let tx=sx0;tx<sx1;tx++)
        drawTile(getTile(tx,ty), Math.round(tx*TILE-cameraX), Math.round(ty*TILE-cameraY), TILE);
    drawNpcs();
    drawPlayer();
    drawWeather();
    drawMinimap();
  }

  // ─── MOVEMENT ─────────────────────────────────────────────────────
  function tryMove(dx,dy,dir) {
    if (player.moving) return;
    player.dir = dir;
    const nx=player.x+dx, ny=player.y+dy;
    const tile=getTile(nx,ny);
    if (isBlocked(tile,nx,ny)) return;
    // Check trainer NPC aggro
    for (const npc of NPCS) {
      if (npc.trainer && !npcDefeated[npc.name] && npc.tx===nx && npc.ty===ny) {
        selectedNpc = npc;
        gameState = 'dialog';
        showDialog(npc.dialog.concat([`${npc.name} wants to battle!`]),
          ()=>{ triggerTrainerBattle(npc); }, npc.emoji, npc.name);
        return;
      }
    }
    player.x=nx; player.y=ny; player.moving=true; steps++;
    document.getElementById('hud-steps-num').textContent=steps;
    updateLocation(nx,ny);
    if (steps%1===0) sfxStep();
    // Encounter checks
    if (tile===T.TALL&&Math.random()<0.2)   player._pendingBattle='tall';
    else if (tile===T.GRASS&&Math.random()<0.05) player._pendingBattle='grass';
    else if (tile===T.WATER&&Math.random()<0.12)  player._pendingBattle='water';
  }
  function updateMovement() {
    if (player.moving) {
      const tx=player.x*TILE, ty=player.y*TILE;
      const spd=TILE*.28;
      const dx=tx-player.px, dy=ty-player.py;
      if (Math.abs(dx)<=spd&&Math.abs(dy)<=spd) {
        player.px=tx; player.py=ty; player.moving=false;
        if (player._pendingBattle) {
          const pool = player._pendingBattle==='water' ? WILD_WATER
                     : player._pendingBattle==='tall'  ? WILD_DEEP : WILD_TALL;
          player._pendingBattle=null;
          setTimeout(()=>triggerWildBattle(pool),60);
        }
      } else { player.px+=Math.sign(dx)*spd; player.py+=Math.sign(dy)*spd; }
    } else {
      if (keys['up'])    tryMove(0,-1,0);
      if (keys['right']) tryMove(1,0,1);
      if (keys['down'])  tryMove(0,1,2);
      if (keys['left'])  tryMove(-1,0,3);
    }
  }

  // ─── LOCATION TRACKER ─────────────────────────────────────────────
  function updateLocation(tx,ty) {
    let loc='PALLET TOWN';
    if (tx>=8&&tx<=13&&ty>=1&&ty<=14) loc='ROUTE 1';
    if (tx>=14&&tx<=36) loc='ROUTE 2';
    if (ty>=18&&ty<=19) loc='CERULEAN LAKE';
    if (ty>=23&&ty<=24&&tx<=15) loc='SOUTH PATH';
    if (loc!==location) {
      location=loc;
      document.getElementById('hud-location').textContent=loc;
      showToast(`Entered: ${loc}`);
    }
  }

  // ─── INTERACT ─────────────────────────────────────────────────────
  function interact() {
    const deltas=[[0,-1],[1,0],[0,1],[-1,0]];
    const [dx,dy]=deltas[player.dir];
    const tx=player.x+dx, ty=player.y+dy;
    const tile=getTile(tx,ty);
    const key=`${tx}-${ty}`;

    // NPC interaction
    for (const npc of NPCS) {
      if (npc.tx===tx&&npc.ty===ty) {
        if (npc.trainer && !npcDefeated[npc.name]) {
          showDialog(npc.dialog.concat([`${npc.name} wants to battle!`]),
            ()=>triggerTrainerBattle(npc), npc.emoji, npc.name);
        } else {
          showDialog(npc.dialog, ()=>{gameState='overworld';}, npc.emoji, npc.name);
        }
        return;
      }
    }
    if (SIGNS[key]) { showDialog([SIGNS[key]], ()=>{gameState='overworld';}, '📋', 'SIGN'); return; }
    if (tile===T.POKE_CENTER) {
      const old=playerHp; playerHp=playerPoke.maxHp; playerStatus=null; updateHUD();
      updateStatusBadge('player', null);
      showDialog([
        'NURSE JOY:\nWelcome to the\nPOKÉMON CENTER!',
        `Your ${playerPoke.name} has\nbeen fully restored!\nPlease come again!`,
        old<playerPoke.maxHp ? '✓ HP fully restored!' : '♥ Already at full HP!',
      ], ()=>{gameState='overworld';}, '💊', 'NURSE JOY');
      return;
    }
    if (tile===T.MART) { openShop(); return; }
    if (tile===T.HOUSE) {
      showDialog(['The door is locked.\nNobody seems to be home.',], ()=>{gameState='overworld';}, '🏠', 'HOUSE');
    }
  }

  // ─── DIALOG ───────────────────────────────────────────────────────
  const dlgBox    = document.getElementById('dialog-box');
  const dlgTextEl = document.getElementById('dialog-text');
  const dlgSpkrEl = document.getElementById('dialog-speaker');
  const dlgPortEl = document.getElementById('dialog-portrait');
  let twTimer=null, twFull='', twIdx=0;

  function showDialog(lines, cb, portrait, speaker) {
    gameState='dialog';
    dlgBox.classList.remove('hidden');
    dialogQueue=[...lines]; dialogCallback=cb||null;
    dialogPortrait=portrait||'💬'; dialogSpeaker=speaker||'';
    nextLine();
  }
  function nextLine() {
    if (!dialogQueue.length) {
      dlgBox.classList.add('hidden');
      if (dialogCallback){const cb=dialogCallback;dialogCallback=null;cb();}
      return;
    }
    const line=dialogQueue.shift();
    twFull=line; twIdx=0;
    dlgTextEl.textContent='';
    dlgPortEl.textContent=dialogPortrait;
    dlgSpkrEl.textContent=dialogSpeaker;
    clearTimeout(twTimer); typeChar();
  }
  function typeChar() {
    if (twIdx>=twFull.length) return;
    dlgTextEl.textContent+=twFull[twIdx++];
    twTimer=setTimeout(typeChar, twIdx<10?25:22);
  }
  function advanceDialog() {
    if (twIdx<twFull.length){clearTimeout(twTimer);twIdx=twFull.length;dlgTextEl.textContent=twFull;}
    else nextLine();
  }

  // ─── HUD UPDATE ───────────────────────────────────────────────────
  function updateHUD() {
    if (!playerPoke) return;
    const pct = playerHp / playerPoke.maxHp * 100;
    const xpPct = Math.min(100, playerXp / playerXpNext * 100);
    document.getElementById('hud-poke-icon').textContent   = playerPoke.emoji;
    document.getElementById('hud-pokemon-name').textContent = playerPoke.name;
    document.getElementById('hud-level-badge').textContent  = `Lv.${playerPoke.level}`;
    const hpBar = document.getElementById('hud-hp-bar');
    if (hpBar) {
      hpBar.style.width = pct+'%';
      hpBar.style.background = pct>50?'var(--hp-g)':pct>25?'var(--hp-y)':'var(--hp-r)';
    }
    document.getElementById('hud-hp-text').textContent = `${playerHp}/${playerPoke.maxHp}`;
    const xpBar = document.getElementById('hud-xp-bar');
    if (xpBar) xpBar.style.width = xpPct+'%';
    document.getElementById('hud-wins-num').textContent  = wins;
    document.getElementById('hud-money').textContent     = playerMoney;
    document.getElementById('sm-money-val').textContent  = playerMoney;
  }

  // ─── TOAST ────────────────────────────────────────────────────────
  function showToast(msg) {
    const t=document.getElementById('toast');
    if(!t)return;
    t.textContent=msg; t.classList.remove('hidden');
    clearTimeout(toastTimer);
    toastTimer=setTimeout(()=>t.classList.add('hidden'),2500);
  }

  // ─── BATTLE BG ────────────────────────────────────────────────────
  function drawBattleBg() {
    if (!battleBgCtx) return;
    const bw=battleBgCanvas.width, bh=battleBgCanvas.height;
    // Sky
    const sky=battleBgCtx.createLinearGradient(0,0,0,bh*.55);
    const isNight=dayTime<0.2||dayTime>0.8;
    if (isNight) {
      sky.addColorStop(0,'#050820'); sky.addColorStop(1,'#1a2855');
    } else {
      sky.addColorStop(0,'#5090d8'); sky.addColorStop(1,'#90c0f0');
    }
    battleBgCtx.fillStyle=sky; battleBgCtx.fillRect(0,0,bw,bh*.55);
    // Ground
    const gnd=battleBgCtx.createLinearGradient(0,bh*.55,0,bh);
    gnd.addColorStop(0,'#5a9830'); gnd.addColorStop(1,'#2a6010');
    battleBgCtx.fillStyle=gnd; battleBgCtx.fillRect(0,bh*.55,bw,bh*.45);
    // Grid
    battleBgCtx.strokeStyle='rgba(0,0,0,.15)'; battleBgCtx.lineWidth=1;
    for(let i=0;i<16;i++){
      const y=bh*.55+i*(bh*.45/16);
      battleBgCtx.beginPath(); battleBgCtx.moveTo(0,y); battleBgCtx.lineTo(bw,y); battleBgCtx.stroke();
    }
    // Stars at night
    if (isNight) {
      battleBgCtx.fillStyle='rgba(255,255,255,.8)';
      for(let i=0;i<50;i++){
        battleBgCtx.fillRect(Math.random()*bw,Math.random()*bh*.5,1,1);
      }
    } else {
      // Clouds
      battleBgCtx.fillStyle='rgba(255,255,255,.75)';
      for(const cl of [{x:bw*.12,y:bh*.1,r:50},{x:bw*.55,y:bh*.07,r:65},{x:bw*.82,y:bh*.13,r:42}]){
        battleBgCtx.beginPath(); battleBgCtx.arc(cl.x,cl.y,cl.r,0,Math.PI*2); battleBgCtx.fill();
        battleBgCtx.beginPath(); battleBgCtx.arc(cl.x+cl.r*.65,cl.y,cl.r*.7,0,Math.PI*2); battleBgCtx.fill();
      }
    }
    // Platform pads
    battleBgCtx.fillStyle='rgba(160,210,100,.5)';
    battleBgCtx.beginPath();
    battleBgCtx.ellipse(bw*.72,bh*.54,bw*.12,bh*.04,0,0,Math.PI*2); battleBgCtx.fill();
    battleBgCtx.beginPath();
    battleBgCtx.ellipse(bw*.28,bh*.7,bw*.1,bh*.035,0,0,Math.PI*2); battleBgCtx.fill();
  }

  // ─── BATTLE: TRIGGER ──────────────────────────────────────────────
  function triggerWildBattle(pool) {
    pool = pool || WILD_TALL;
    const key = pool[Math.floor(Math.random()*pool.length)];
    startBattle(deepClone(POKEMON[key]), false);
  }
  function triggerTrainerBattle(npc) {
    const poke = deepClone(POKEMON[npc.pokemon||'RATTATA']);
    poke.level = npc.level || 4;
    startBattle(poke, true, npc);
  }

  function startBattle(poke, isTrainer, npc) {
    sfxEncounter();
    enemyPoke = poke;
    // Scale enemy HP & stats slightly by level
    const scale = enemyPoke.level / 5;
    enemyPoke.maxHp = Math.max(8, Math.round(enemyPoke.maxHp * scale));
    enemyHp = enemyPoke.maxHp;
    enemyStatus = null; playerStatus = null;
    updateStatusBadge('enemy', null); updateStatusBadge('player', null);

    // Flash
    const fl=document.createElement('div');
    fl.className='flash-overlay';
    document.getElementById('game-wrap').appendChild(fl);
    setTimeout(()=>fl.remove(),500);

    setTimeout(()=>{
      drawBattleBg();
      // Setup sprite canvases
      const spSize = Math.min(160, W*.18);
      if (enemySpCanvas)  { enemySpCanvas.width=enemySpCanvas.height=spSize; }
      if (playerSpCanvas) { playerSpCanvas.width=playerSpCanvas.height=spSize*.85; }

      // Update info cards
      document.getElementById('enemy-tag').textContent  = isTrainer ? npc.name : 'WILD';
      document.getElementById('enemy-name').textContent = enemyPoke.name;
      document.getElementById('enemy-level').textContent = `Lv.${enemyPoke.level}`;
      document.getElementById('player-poke-name').textContent = playerPoke.name;
      document.getElementById('player-level').textContent = `Lv.${playerPoke.level}`;
      updateBattleHpBars();

      document.getElementById('battle-screen').classList.remove('hidden');
      gameState='battle'; battleState='choose';
      selectedBOpt=0; selectedMOpt=0;
      document.getElementById('move-menu').classList.add('hidden');
      document.getElementById('bag-battle-menu').classList.add('hidden');
      document.getElementById('battle-menu').style.display='';
      updateBattleOptUI();
      setBattleMsg(isTrainer ? `${npc.name} sent out ${enemyPoke.name}!` : `A wild ${enemyPoke.name} appeared!`);
    }, 220);
  }

  // ─── BATTLE: UI ───────────────────────────────────────────────────
  const battleMsgEl = document.getElementById('battle-msg');
  const battleOpts  = document.querySelectorAll('.b-opt');
  const moveMenuEl  = document.getElementById('move-menu');
  const moveGridEl  = document.getElementById('move-grid');
  const bagBattleEl = document.getElementById('bag-battle-menu');
  const bagBattleList = document.getElementById('bag-battle-list');
  const enemyHpBar  = document.getElementById('enemy-hp-bar');
  const playerHpBar = document.getElementById('player-hp-bar');
  const playerHpText= document.getElementById('player-hp-text');
  const playerXpBar = document.getElementById('player-xp-bar');

  function setBattleMsg(txt) { if(battleMsgEl) battleMsgEl.textContent=txt; }
  function updateBattleOptUI() { battleOpts.forEach((el,i)=>el.classList.toggle('selected',i===selectedBOpt)); }
  function updateMoveOptUI() {
    document.querySelectorAll('.move-item').forEach((el,i)=>el.classList.toggle('selected',i===selectedMOpt));
    const mv = playerPoke.moves[selectedMOpt];
    const md = MOVES[mv];
    if (md) {
      const ms_type = document.getElementById('ms-type');
      if(ms_type) { ms_type.textContent=md.type; ms_type.style.background=TYPE_COLOR[md.type]+'33'; ms_type.style.color=TYPE_COLOR[md.type]; ms_type.style.borderColor=TYPE_COLOR[md.type]; }
      const els = { 'ms-pwr':`PWR ${md.pwr||'—'}`, 'ms-acc':`ACC ${md.acc}%`, 'ms-pp':`PP ${md.pp}`, 'ms-cat':md.cat.toUpperCase() };
      for (const [id,v] of Object.entries(els)) { const el=document.getElementById(id); if(el) el.textContent=v; }
    }
  }
  function updateBattleHpBars() {
    const eP=Math.max(0,enemyHp/enemyPoke.maxHp*100);
    const pP=Math.max(0,playerHp/playerPoke.maxHp*100);
    if(enemyHpBar){ enemyHpBar.style.width=eP+'%'; enemyHpBar.style.background=eP>50?'var(--hp-g)':eP>25?'var(--hp-y)':'var(--hp-r)'; }
    if(playerHpBar){ playerHpBar.style.width=pP+'%'; playerHpBar.style.background=pP>50?'var(--hp-g)':pP>25?'var(--hp-y)':'var(--hp-r)'; }
    if(playerHpText) playerHpText.textContent=`${playerHp} / ${playerPoke.maxHp}`;
    const xpP=Math.min(100,playerXp/playerXpNext*100);
    if(playerXpBar) playerXpBar.style.width=xpP+'%';
    updateHUD();
  }

  function updateStatusBadge(who, status) {
    const el=document.getElementById(`${who}-status-badge`);
    if (!el) return;
    if (!status) { el.className='status-hidden'; return; }
    const map={psn:'s-psn',brn:'s-brn',slp:'s-slp',prz:'s-prz',frz:'s-frz'};
    const labels={psn:'PSN',brn:'BRN',slp:'SLP',prz:'PRZ',frz:'FRZ'};
    el.className=`status-badge ${map[status]||''}`;
    el.textContent=labels[status]||status.toUpperCase();
  }

  // ─── BATTLE: INPUT ────────────────────────────────────────────────
  function handleBattleInput(key) {
    if (battleState==='anim') return;
    if (battleState==='result') { if(key==='a'||key==='b'){sfxConfirm();endBattle();} return; }
    if (battleState==='catch')  return;

    if (battleState==='choose') {
      if(key==='up'&&selectedBOpt>1)    {selectedBOpt-=2;sfxMenu();}
      if(key==='down'&&selectedBOpt<2)  {selectedBOpt+=2;sfxMenu();}
      if(key==='left'&&selectedBOpt%2)  {selectedBOpt--;sfxMenu();}
      if(key==='right'&&!(selectedBOpt%2)){selectedBOpt++;sfxMenu();}
      updateBattleOptUI();
      if (key==='a') { sfxConfirm(); selectAction(['fight','bag','pokemon','run'][selectedBOpt]); }
      return;
    }
    if (battleState==='fight') {
      const n=playerPoke.moves.length;
      if(key==='up'&&selectedMOpt>1)   {selectedMOpt-=2;sfxMenu();}
      if(key==='down'&&selectedMOpt<n-1){selectedMOpt+=2;sfxMenu();}
      if(key==='left'&&selectedMOpt%2) {selectedMOpt--;sfxMenu();}
      if(key==='right'&&!(selectedMOpt%2)&&selectedMOpt+1<n){selectedMOpt++;sfxMenu();}
      updateMoveOptUI();
      if (key==='a') { sfxConfirm(); useMove(playerPoke.moves[selectedMOpt]); }
      if (key==='b') { sfxCancel(); battleState='choose'; moveMenuEl.classList.add('hidden'); document.getElementById('battle-menu').style.display=''; setBattleMsg(`What will ${playerPoke.name} do?`); }
      return;
    }
    if (battleState==='bag') {
      const bagItems = playerBag.filter(i=>i.qty>0);
      if(key==='up'&&selectedBagOpt>0)            {selectedBagOpt--;sfxMenu();}
      if(key==='down'&&selectedBagOpt<bagItems.length-1){selectedBagOpt++;sfxMenu();}
      updateBagOptUI(bagItems);
      if (key==='a') { sfxConfirm(); useBagItem(bagItems[selectedBagOpt]); }
      if (key==='b') { sfxCancel(); closeBagMenu(); }
    }
  }

  function selectAction(act) {
    if (act==='fight') {
      battleState='fight'; selectedMOpt=0;
      openMoveMenu();
    } else if (act==='run') {
      if (Math.random()<0.75) {
        setBattleMsg('Got away safely!');
        battleState='result';
      } else {
        setBattleMsg("Can't escape!"); doEnemyTurn();
      }
    } else if (act==='bag') {
      battleState='bag'; openBagMenu();
    } else if (act==='pokemon') {
      setBattleMsg('No other POKÉMON!'); battleState='result';
    }
  }

  function openMoveMenu() {
    document.getElementById('battle-menu').style.display='none';
    moveMenuEl.classList.remove('hidden');
    bagBattleEl.classList.add('hidden');
    moveGridEl.innerHTML='';
    playerPoke.moves.forEach((m,i)=>{
      const md=MOVES[m];
      const tc=md?TYPE_COLOR[md.type]||'#888':'#888';
      const div=document.createElement('div');
      div.className='move-item'+(i===0?' selected':'');
      div.innerHTML=`<span style="color:${tc};font-size:9px">■</span>${m}`;
      moveGridEl.appendChild(div);
    });
    updateMoveOptUI();
    setBattleMsg('Choose a move:');
  }

  function openBagMenu() {
    document.getElementById('battle-menu').style.display='none';
    moveMenuEl.classList.add('hidden');
    bagBattleEl.classList.remove('hidden');
    selectedBagOpt=0;
    const items=playerBag.filter(i=>i.qty>0);
    if (!items.length) {
      bagBattleList.innerHTML='<div class="bag-item">Bag is empty!</div>';
    } else {
      bagBattleList.innerHTML='';
      items.forEach((it,i)=>{
        const d=document.createElement('div');
        d.className='bag-item'+(i===0?' selected':'');
        d.innerHTML=`<span>${it.emoji} ${it.name}</span><span>×${it.qty}</span>`;
        bagBattleList.appendChild(d);
      });
    }
  }
  function updateBagOptUI(items) {
    document.querySelectorAll('#bag-battle-list .bag-item').forEach((el,i)=>el.classList.toggle('selected',i===selectedBagOpt));
  }
  function closeBagMenu() {
    battleState='choose';
    bagBattleEl.classList.add('hidden');
    document.getElementById('battle-menu').style.display='';
    setBattleMsg(`What will ${playerPoke.name} do?`);
    updateBattleOptUI();
  }

  function useBagItem(item) {
    if (!item) { closeBagMenu(); return; }
    if (item.effect==='catch'||item.effect==='catch_great') {
      closeBagMenu();
      attemptCatch(item);
      return;
    }
    if (item.effect==='heal20') {
      playerHp=Math.min(playerPoke.maxHp, playerHp+20);
      setBattleMsg(`${playerPoke.name} recovered\n20 HP!`);
    } else if (item.effect==='heal50') {
      playerHp=Math.min(playerPoke.maxHp, playerHp+50);
      setBattleMsg(`${playerPoke.name} recovered\n50 HP!`);
    } else if (item.effect==='cure_psn'&&playerStatus==='psn') {
      playerStatus=null; updateStatusBadge('player',null);
      setBattleMsg(`${playerPoke.name} was cured\nof POISON!`);
    } else if (item.effect==='cure_prz'&&playerStatus==='prz') {
      playerStatus=null; updateStatusBadge('player',null);
      setBattleMsg(`${playerPoke.name} was cured\nof PARALYSIS!`);
    } else {
      setBattleMsg(`Can't use that now!`);
    }
    item.qty--; updateBattleHpBars();
    closeBagMenu();
    battleState='anim';
    setTimeout(()=>doEnemyTurn(), 1200);
  }

  // ─── POKÉBALL CATCH ───────────────────────────────────────────────
  function attemptCatch(item) {
    sfxCatch();
    const catchOverlay = document.getElementById('catch-overlay');
    const pokeballAnim = document.getElementById('pokeball-anim');
    const catchResult  = document.getElementById('catch-result');
    pokeballAnim.textContent = item.id==='GREAT_BALL'?'🔵':'⚫';
    catchOverlay.classList.remove('hidden');
    battleState='catch';
    item.qty--;

    const hpFraction = enemyHp / enemyPoke.maxHp;
    const baseRate = item.id==='GREAT_BALL' ? 1.5 : 1;
    const catchChance = baseRate * (1 - hpFraction*.6);

    setTimeout(()=>{
      const caught = Math.random() < catchChance;
      catchResult.textContent = caught ? `${enemyPoke.name} was\ncaught! ★` : `${enemyPoke.name} broke free!`;
      setTimeout(()=>{
        catchOverlay.classList.add('hidden');
        if (caught) {
          wins++; updateHUD();
          showToast(`★ Caught ${enemyPoke.name}!`);
          setBattleMsg(`${enemyPoke.name} was caught!\nAdded to POKÉDEX!`);
        } else {
          setBattleMsg(`${enemyPoke.name} broke\nfree!`);
        }
        battleState='result';
      }, 1800);
    }, 1200);
  }

  // ─── DAMAGE CALCULATION ───────────────────────────────────────────
  function calcDmg(attacker, moveName, defender) {
    const md=MOVES[moveName];
    if (!md||md.pwr===0) return 0;
    const eff=typeEffectiveness(md.type, defender.type);
    const variance=0.85+Math.random()*.15;
    let dmg=Math.max(1, Math.round(md.pwr*(attacker.atk/defender.def)*variance*.65*eff));
    return {dmg, eff};
  }

  function floatDmg(dmg, x, y, color) {
    const el=document.createElement('div');
    el.className='dmg-float';
    el.textContent=`-${dmg}`;
    el.style.cssText=`left:${x}px;top:${y}px;color:${color||'#ff4444'}`;
    document.getElementById('game-wrap').appendChild(el);
    setTimeout(()=>el.remove(),1300);
  }
  function floatXp(xp, x, y) {
    const el=document.createElement('div');
    el.className='xp-float';
    el.textContent=`+${xp} XP`;
    el.style.cssText=`left:${x}px;top:${y}px`;
    document.getElementById('game-wrap').appendChild(el);
    setTimeout(()=>el.remove(),1600);
  }
  function floatCrit(x, y) {
    const el=document.createElement('div');
    el.className='crit-label';
    el.textContent='CRITICAL!';
    el.style.cssText=`left:${x}px;top:${y-30}px`;
    document.getElementById('game-wrap').appendChild(el);
    setTimeout(()=>el.remove(),900);
  }

  function shakeEl(el) {
    if(!el)return;
    el.classList.remove('shake-el');
    void el.offsetWidth;
    el.classList.add('shake-el');
    setTimeout(()=>el.classList.remove('shake-el'),450);
  }

  // ─── APPLY STATUS EFFECT ──────────────────────────────────────────
  function applyStatusEffect(moveName, target) {
    const md=MOVES[moveName];
    if (!md) return;
    if (moveName==='EMBER'&&Math.random()<.1) {
      if (target==='enemy'&&!enemyStatus){enemyStatus='brn';updateStatusBadge('enemy','brn');}
    }
    if (moveName==='THUNDER SHOCK'&&Math.random()<.1) {
      if (target==='enemy'&&!enemyStatus){enemyStatus='prz';updateStatusBadge('enemy','prz');}
    }
    if (moveName==='POISON STING'&&Math.random()<.3) {
      if (target==='enemy'&&!enemyStatus){enemyStatus='psn';updateStatusBadge('enemy','psn');}
    }
    if (moveName==='SING'&&Math.random()<.55) {
      if (target==='enemy'&&!enemyStatus){enemyStatus='slp';updateStatusBadge('enemy','slp');}
    }
    if (moveName==='EMBER'&&Math.random()<.1) {
      if (target==='player'&&!playerStatus){playerStatus='brn';updateStatusBadge('player','brn');}
    }
    if (moveName==='THUNDER SHOCK'&&Math.random()<.1) {
      if (target==='player'&&!playerStatus){playerStatus='prz';updateStatusBadge('player','prz');}
    }
    if (moveName==='POISON STING'&&Math.random()<.3) {
      if (target==='player'&&!playerStatus){playerStatus='psn';updateStatusBadge('player','psn');}
    }
  }

  // ─── BATTLE: PLAYER TURN ──────────────────────────────────────────
  function useMove(moveName) {
    document.getElementById('battle-menu').style.display='';
    moveMenuEl.classList.add('hidden');
    battleState='anim';

    // Paralysis check
    if (playerStatus==='prz'&&Math.random()<0.25) {
      setBattleMsg(`${playerPoke.name} is\nparalyzed! Can't move!`);
      setTimeout(()=>doEnemyTurn(),1200);
      return;
    }
    if (playerStatus==='slp') {
      setBattleMsg(`${playerPoke.name} is fast asleep!`);
      setTimeout(()=>doEnemyTurn(),1200);
      return;
    }

    const result = calcDmg(playerPoke, moveName, enemyPoke);
    const md = MOVES[moveName];
    const isCrit = Math.random() < 0.0625;

    let dmg = result.dmg;
    if (isCrit) dmg = Math.floor(dmg*1.5);

    // Effectiveness message
    let effMsg='';
    if (result.eff>1) effMsg=' Super effective!';
    else if (result.eff<1&&result.eff>0) effMsg=' Not very effective...';
    else if (result.eff===0) effMsg=' It had no effect!';

    if (dmg>0) {
      enemyHp=Math.max(0,enemyHp-dmg);
      shakeEl(document.getElementById('enemy-sprite-wrap'));
      floatDmg(dmg, W*.62, H*.25, result.eff>=1?'#ffdd44':'#ff8888');
      if (isCrit) floatCrit(W*.55, H*.22);
      sfxHit();
      spawnBattleParticles(W*.7,H*.38,TYPE_COLOR[md.type]||'#fff');
      updateBattleHpBars();
      setBattleMsg(`${playerPoke.name} used\n${moveName}!${effMsg}`);
      applyStatusEffect(moveName,'enemy');
    } else if (md?.pwr===0) {
      setBattleMsg(`${playerPoke.name} used\n${moveName}!`);
    } else {
      setBattleMsg(`${moveName} had\nno effect!`);
    }

    // Status damage tick
    if (playerStatus==='psn'||playerStatus==='brn') {
      playerHp=Math.max(1,playerHp-Math.floor(playerPoke.maxHp/8));
      updateBattleHpBars();
    }
    if (enemyStatus==='psn'||enemyStatus==='brn') {
      enemyHp=Math.max(0,enemyHp-Math.floor(enemyPoke.maxHp/8));
      updateBattleHpBars();
    }

    setTimeout(()=>{
      if (enemyHp<=0) { enemyFainted(); return; }
      doEnemyTurn();
    }, 1200);
  }

  function enemyFainted() {
    sfxFaint();
    const xpGain=Math.floor((enemyPoke.xpY||60)*(enemyPoke.level/5)*(.7+Math.random()*.6));
    playerXp+=xpGain;
    wins++;
    document.getElementById('hud-wins-num').textContent=wins;
    floatXp(xpGain, W*.58, H*.6);
    setBattleMsg(`Wild ${enemyPoke.name}\nfainted!\n+${xpGain} EXP Points!`);
    // Level up check
    if (playerXp>=playerXpNext) {
      playerXp-=playerXpNext;
      playerXpNext=Math.floor(playerXpNext*1.6);
      if (playerPoke.level<50) {
        playerPoke.level++;
        const hpg=Math.floor(2+Math.random()*4);
        const atkg=Math.floor(Math.random()*2);
        playerPoke.maxHp+=hpg; playerHp=Math.min(playerHp+hpg,playerPoke.maxHp);
        playerPoke.atk+=atkg; playerPoke.def+=Math.floor(Math.random()*2);
        sfxLevelUp();
        const banner=document.getElementById('levelup-banner');
        const bannerText=document.getElementById('levelup-text');
        if (banner&&bannerText) {
          bannerText.textContent=`${playerPoke.name} grew to Lv.${playerPoke.level}!`;
          banner.classList.remove('hidden');
          setTimeout(()=>banner.classList.add('hidden'),3000);
        }
        document.getElementById('player-level').textContent=`Lv.${playerPoke.level}`;
      }
    }
    updateBattleHpBars();
    battleState='result';
  }

  // ─── BATTLE: ENEMY TURN ───────────────────────────────────────────
  function doEnemyTurn() {
    if (enemyHp<=0) return;
    // Status checks
    if (enemyStatus==='slp') {
      setBattleMsg(`${enemyPoke.name} is fast asleep!`);
      if (Math.random()<.25) { enemyStatus=null; updateStatusBadge('enemy',null); }
      battleState='choose'; setTimeout(()=>{setBattleMsg(`What will ${playerPoke.name} do?`);updateBattleOptUI();},1000);
      return;
    }
    if (enemyStatus==='prz'&&Math.random()<.25) {
      setBattleMsg(`${enemyPoke.name} is\nparalyzed! Couldn't move!`);
      battleState='choose'; setTimeout(()=>{setBattleMsg(`What will ${playerPoke.name} do?`);updateBattleOptUI();},1000);
      return;
    }
    const atkMoves=enemyPoke.moves.filter(m=>(MOVES[m]?.pwr||0)>0);
    const em=atkMoves.length?atkMoves[Math.floor(Math.random()*atkMoves.length)]:enemyPoke.moves[0];
    const res=calcDmg(enemyPoke,em,playerPoke);
    const eDmg=res.dmg;

    if (eDmg>0) {
      playerHp=Math.max(0,playerHp-eDmg);
      shakeEl(document.getElementById('player-sprite-wrap'));
      floatDmg(eDmg, W*.22, H*.6, '#ff6666');
      sfxHit();
      spawnBattleParticles(W*.28,H*.72,TYPE_COLOR[MOVES[em]?.type||'NORMAL']||'#fff');
      applyStatusEffect(em,'player');
    }
    // Status tick
    if (enemyStatus==='psn'||enemyStatus==='brn') {
      enemyHp=Math.max(0,enemyHp-Math.floor(enemyPoke.maxHp/8));
    }
    if (playerStatus==='psn'||playerStatus==='brn') {
      playerHp=Math.max(1,playerHp-Math.floor(playerPoke.maxHp/8));
    }
    updateBattleHpBars();
    setBattleMsg(`${enemyPoke.name}\nused ${em}!`);

    if (playerHp<=0) {
      setTimeout(()=>{
        sfxFaint();
        playerHp=playerPoke.maxHp; updateBattleHpBars();
        setBattleMsg(`${playerPoke.name} fainted!\nHealed at POKÉMON CENTER.`);
        battleState='result';
      },1000);
      return;
    }
    setTimeout(()=>{
      battleState='choose';
      setBattleMsg(`What will ${playerPoke.name} do?`);
      updateBattleOptUI();
    },1300);
  }

  function endBattle() {
    document.getElementById('battle-screen').classList.add('hidden');
    battleParts=[];
    gameState='overworld';
    battleState='choose';
    updateHUD();
  }

  // ─── MENU ─────────────────────────────────────────────────────────
  const startMenuEl = document.getElementById('start-menu');
  const menuItems   = document.querySelectorAll('.menu-item');

  function openMenu() {
    gameState='menu'; selectedMenuOpt=0;
    menuItems.forEach((el,i)=>el.classList.toggle('selected',i===0));
    startMenuEl.classList.remove('hidden');
  }
  function closeMenu() { startMenuEl.classList.add('hidden'); gameState='overworld'; }
  function handleMenuInput(key) {
    if(key==='up'&&selectedMenuOpt>0)           {selectedMenuOpt--;sfxMenu();}
    if(key==='down'&&selectedMenuOpt<menuItems.length-1){selectedMenuOpt++;sfxMenu();}
    if(key==='b'||key==='start'){sfxCancel();closeMenu();return;}
    menuItems.forEach((el,i)=>el.classList.toggle('selected',i===selectedMenuOpt));
    if (key==='a') {
      sfxConfirm();
      const act=menuItems[selectedMenuOpt].dataset.action;
      closeMenu();
      if(act==='pokemon') openPokemonPanel();
      else if(act==='bag') showBagDialog();
      else if(act==='map') { minimapVisible=true; document.getElementById('minimap-wrap')?.classList.remove('hidden'); gameState='overworld'; }
      else if(act==='save') saveGame();
      else if(act==='options') showOptions();
      else if(act==='quit') backToTitle();
    }
  }

  function showBagDialog() {
    if (!playerBag.length) {
      showDialog(['Your bag is empty.\nVisit the POKÉ MART\nto buy items!'],()=>{gameState='overworld';},'🎒','BAG');
      return;
    }
    const lines=playerBag.map(it=>`${it.emoji} ${it.name} ×${it.qty}`);
    lines.unshift('YOUR BAG:');
    showDialog(lines,()=>{gameState='overworld';},'🎒','BAG');
  }
  function saveGame() {
    const data={name:player.name,pokemon:playerPoke.name,level:playerPoke.level,hp:playerHp,xp:playerXp,xpNext:playerXpNext,wins,steps,money:playerMoney,badges:playerBadges,bag:playerBag,npcDefeated,dayTime};
    try{localStorage.setItem('pokeSaveV2',JSON.stringify(data));}catch(e){}
    showDialog(['GAME SAVED!\n(Pokémon Red Fan Edition)'],()=>{gameState='overworld';},'💾','SAVE');
  }
  function showOptions() {
    showDialog(['OPTIONS\n\nTEXT SPEED: FAST\nBATTLE ANIMS: ON\nSEX: N/A\n\n(No changes in demo)'],()=>{gameState='overworld';},'⚙','OPTIONS');
  }
  function backToTitle() {
    document.getElementById('intro-screen').classList.remove('hidden');
    document.getElementById('game-wrap').classList.add('hidden');
    gameState='intro';
    frameCount=0;
    generateIntroStars(W,H);
    resize();
  }

  // ─── POKÉMON PANEL ────────────────────────────────────────────────
  const pokemonPanel=document.getElementById('pokemon-panel');
  document.getElementById('pp-close')?.addEventListener('click',()=>{sfxCancel();closePokemonPanel();});

  function openPokemonPanel() {
    gameState='pokemon-panel';
    const pp=playerPoke;
    const pct=playerHp/pp.maxHp*100;
    const hpCol=pct>50?'var(--hp-g)':pct>25?'var(--hp-y)':'var(--hp-r)';
    document.getElementById('pp-sprite-big').textContent=pp.emoji;
    // Type badges
    const tbd=document.getElementById('pp-type-badges');
    if(tbd){tbd.innerHTML='';pp.type.forEach(t=>{const d=document.createElement('span');d.className=`s-type-badge type-${t}`;d.textContent=t;tbd.appendChild(d);});}
    // Flavor
    const fl=document.getElementById('pp-flavor');
    if(fl) fl.textContent=pp.desc||'';
    // Stats grid
    const sg=document.getElementById('pp-stats-grid');
    if(sg){
      const stats=[
        {label:'NAME',val:pp.name,bar:false},
        {label:'TYPE',val:pp.type.join('/'),bar:false},
        {label:'LEVEL',val:pp.level,bar:false},
        {label:'HP',val:`${playerHp}/${pp.maxHp}`,bar:true,pct:pct,col:hpCol},
        {label:'ATK',val:pp.atk,bar:true,pct:Math.min(100,pp.atk*4),col:'#e84820'},
        {label:'DEF',val:pp.def,bar:true,pct:Math.min(100,pp.def*4),col:'#4888f8'},
        {label:'SPD',val:pp.spd||8,bar:true,pct:Math.min(100,(pp.spd||8)*4),col:'#f8d030'},
        {label:'WINS',val:wins,bar:false},
        {label:'STEPS',val:steps,bar:false},
      ];
      sg.innerHTML='';
      stats.forEach(s=>{
        const lbl=document.createElement('div'); lbl.className='stat-label'; lbl.textContent=s.label;
        const bar=document.createElement('div'); bar.className='stat-bar-wrap';
        if(s.bar){const inner=document.createElement('div');inner.className='stat-bar';inner.style.cssText=`width:${s.pct}%;background:${s.col}`;bar.appendChild(inner);}
        const val=document.createElement('div'); val.className='stat-val'; val.textContent=s.val;
        if(s.label==='HP') val.style.color=hpCol;
        sg.append(lbl,bar,val);
      });
    }
    // XP bar
    const xpBar=document.getElementById('pp-xp-bar');
    if(xpBar) xpBar.style.width=Math.min(100,playerXp/playerXpNext*100)+'%';
    document.getElementById('pp-xp-label').textContent=`${playerXp}/${playerXpNext}`;
    // Moves
    const ml=document.getElementById('pp-moves-list');
    if(ml){
      ml.innerHTML='';
      pp.moves.forEach(m=>{
        const md=MOVES[m];
        const tc=md?TYPE_COLOR[md.type]||'#888':'#888';
        const d=document.createElement('div');d.className='pp-move';
        d.innerHTML=`<span class="pp-move-name">${m}</span><span class="pp-move-type s-type-badge" style="background:${tc}22;color:${tc};border-color:${tc}">${md?.type||'—'}</span><span class="pp-move-pwr">PWR ${md?.pwr||'—'}</span>`;
        ml.appendChild(d);
      });
    }
    pokemonPanel.classList.remove('hidden');
  }
  function closePokemonPanel(){pokemonPanel.classList.add('hidden');gameState='overworld';}

  // ─── SHOP ─────────────────────────────────────────────────────────
  const shopPanel=document.getElementById('shop-panel');
  document.getElementById('shop-close')?.addEventListener('click',()=>{sfxCancel();closeShop();});
  document.getElementById('shop-buy-btn')?.addEventListener('click',()=>{sfxConfirm();buyItem();});

  function openShop() {
    gameState='shop'; selectedShopOpt=0; shopItem=null;
    const list=document.getElementById('shop-items');
    if(list){
      list.innerHTML='';
      SHOP_ITEMS.forEach((it,i)=>{
        const d=document.createElement('div');
        d.className='shop-item'+(i===0?' selected':'');
        d.innerHTML=`<span class="shop-item-icon">${it.emoji}</span><span class="shop-item-name">${it.name}</span><span class="shop-item-price">₽${it.price}</span>`;
        d.addEventListener('click',()=>{selectedShopOpt=i;sfxMenu();updateShopUI();});
        list.appendChild(d);
      });
    }
    updateShopUI();
    shopPanel.classList.remove('hidden');
    renderShopBag();
  }
  function closeShop(){shopPanel.classList.add('hidden');gameState='overworld';}
  function updateShopUI(){
    document.querySelectorAll('.shop-item').forEach((el,i)=>el.classList.toggle('selected',i===selectedShopOpt));
    const it=SHOP_ITEMS[selectedShopOpt];
    if(!it)return;
    shopItem=it;
    document.getElementById('shop-item-name').textContent=it.name;
    document.getElementById('shop-item-desc').textContent=it.desc;
    document.getElementById('shop-item-price').textContent=`₽${it.price}`;
    document.getElementById('shop-wallet-val').textContent=playerMoney;
    const buyBtn=document.getElementById('shop-buy-btn');
    if(buyBtn){ buyBtn.classList.toggle('hidden',playerMoney<it.price); }
  }
  function buyItem(){
    if(!shopItem||playerMoney<shopItem.price)return;
    playerMoney-=shopItem.price;
    const existing=playerBag.find(b=>b.id===shopItem.id);
    if(existing) existing.qty++;
    else playerBag.push({id:shopItem.id,name:shopItem.name,emoji:shopItem.emoji,effect:shopItem.effect,qty:1});
    sfxLevelUp();
    updateHUD();
    updateShopUI();
    renderShopBag();
    showToast(`Bought ${shopItem.name}!`);
  }
  function renderShopBag(){
    const el=document.getElementById('shop-bag-preview');
    if(!el)return;
    el.innerHTML='';
    if(!playerBag.length){el.innerHTML='<div class="bag-preview-item"><span>Empty</span></div>';return;}
    playerBag.forEach(it=>{
      const d=document.createElement('div');d.className='bag-preview-item';
      d.innerHTML=`<span>${it.emoji} ${it.name}</span><span>×${it.qty}</span>`;
      el.appendChild(d);
    });
  }
  function handleShopInput(key){
    if(key==='up'&&selectedShopOpt>0){selectedShopOpt--;sfxMenu();updateShopUI();}
    if(key==='down'&&selectedShopOpt<SHOP_ITEMS.length-1){selectedShopOpt++;sfxMenu();updateShopUI();}
    if(key==='a'){sfxConfirm();buyItem();}
    if(key==='b'){sfxCancel();closeShop();}
  }

  // ─── LOAD SAVE ────────────────────────────────────────────────────
  function tryLoadSave(){
    try{
      const raw=localStorage.getItem('pokeSaveV2');
      if(!raw)return null;
      return JSON.parse(raw);
    }catch(e){return null;}
  }

  // ─── MAIN LOOP ────────────────────────────────────────────────────
  function gameLoop() {
    frameCount++;

    if (gameState==='intro') {
      if(introBgCtx) drawIntroStars(introBgCtx, W, H);
    } else if (['overworld','dialog','menu','pokemon-panel','shop'].includes(gameState)) {
      ctx.clearRect(0,0,W,H);
      if(gameState==='overworld') updateMovement();
      updateCamera();
      drawOverworld();
      updateDayNight();
    } else if (gameState==='battle') {
      // Update animated sprites in battle
      if(enemySpCtx&&enemySpCanvas) drawPokemonSprite(enemySpCtx, enemyPoke.emoji, enemySpCanvas.width, frameCount, true);
      if(playerSpCtx&&playerSpCanvas) drawPokemonSprite(playerSpCtx, playerPoke.emoji, playerSpCanvas.width, frameCount, false);
      updateBattleParticles();
    }

    requestAnimationFrame(gameLoop);
  }

  // ─── INIT ─────────────────────────────────────────────────────────
  resize();
  generateIntroStars(W, H);
  dayTime = Math.random(); // Random time of day on start

  // Starter click handlers already bound above
  // Load save info
  const sv=tryLoadSave();
  if (sv) {
    const el=document.getElementById('intro-save-info');
    if(el) el.textContent=`Continue: ${sv.name} · ${sv.pokemon} Lv.${sv.level} · ${sv.wins} wins`;
  }

  // Random weather
  const weathers=['clear','clear','clear','clear','rain','snow','fog'];
  initWeather(weathers[Math.floor(Math.random()*weathers.length)]);

  // Space/Enter on intro
  document.addEventListener('keydown', e=>{
    if((e.key==='Enter'||e.key===' ')&&gameState==='intro'){ ensureAudio(); sfxConfirm(); showStarter(); }
  });

  gameLoop();

})();
