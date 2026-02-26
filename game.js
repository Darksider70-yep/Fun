// ══════════════════════════════════════════════════════════════════════
//  POKÉMON RED — Upgraded Fan Edition  ·  game.js  v2.0
//  IMPROVED: Bug fixes, Pokédex, evolved forms, more NPCs, move PP tracking,
//            Escape Rope, improved battle AI, new items, fishing, berry system,
//            map labels, improved day/night audio, combo/streak system
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
    if (introBgCtx && gameState === 'intro') drawIntroStars(introBgCtx, W, H);
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

  // NPC data
  const NPCS = [
    { tx:4,  ty:6,  emoji:'👴', dir:2, name:'OLD MAN',    dialog:["In my day, we used\nABRA to teleport!","Those were simpler times...","The POKÉMON CENTER\nnearby is free to use!"] },
    { tx:17, ty:5,  emoji:'👧', dir:1, name:'LASS',       dialog:["La la la! I love\nPOKÉMON so much!","CLEFAIRY is my\nfavourite!","Catch as many as\nyou can! Fill the DEX!"] },
    { tx:33, ty:6,  emoji:'👦', dir:0, name:'TRAINER BUG',dialog:["I raised my team\non bug Pokémon!","CATERPIE becomes\nBUTTERFREE! Amazing!", "Bug-type rules!"], trainer:true, pokemon:'CATERPIE', level:5 },
    { tx:19, ty:8,  emoji:'🧓', dir:3, name:'FISHERMAN',  dialog:["The lake to the south\nis full of MAGIKARP!","They're weak, but\nGYARADOS is fearsome.","Use a ROD to fish\nfor aquatic Pokémon!"] },
    { tx:25, ty:7,  emoji:'🧑', dir:2, name:'HIKER',      dialog:["These mountains\nhide many secrets.","GEODUDE and ZUBAT\nlurk in the caves!","Train hard, young\ntrainer!"], trainer:true, pokemon:'GEODUDE', level:7 },
    { tx:11, ty:2,  emoji:'🧒', dir:0, name:'KID',        dialog:["I caught 3 POKéMON\nalready! Can you\nbeat that?","Check your POKÉDEX\nin the menu!"] },
  ];

  // ─── POKÉMON DATABASE ─────────────────────────────────────────────
  const POKEMON = {
    BULBASAUR:   {name:'BULBASAUR',   emoji:'🌱', type:['GRASS','POISON'], maxHp:22, atk:9,  def:9,  spd:7,  moves:['TACKLE','VINE WHIP','GROWL','LEECH SEED'],       xpY:64,  evolveAt:16, evolveTo:'IVYSAUR',    desc:'A seed Pokémon. The bulb on its back grows larger as it evolves.'},
    IVYSAUR:     {name:'IVYSAUR',     emoji:'🌿', type:['GRASS','POISON'], maxHp:32, atk:14, def:13, spd:9,  moves:['VINE WHIP','RAZOR LEAF','TACKLE','LEECH SEED'],   xpY:142, evolveAt:32, evolveTo:'VENUSAUR',   desc:'The bud on its back blossoms when it is ready to evolve into VENUSAUR.'},
    VENUSAUR:    {name:'VENUSAUR',    emoji:'🌺', type:['GRASS','POISON'], maxHp:50, atk:20, def:18, spd:12, moves:['RAZOR LEAF','SOLAR BEAM','TACKLE','LEECH SEED'],   xpY:281, desc:'The flower on its back is magnificent. Its aroma soothes emotions.'},
    CHARMANDER:  {name:'CHARMANDER', emoji:'🔥', type:['FIRE'],           maxHp:18, atk:12, def:6,  spd:10, moves:['SCRATCH','EMBER','GROWL','TAIL WHIP'],             xpY:62,  evolveAt:16, evolveTo:'CHARMELEON', desc:'The flame on its tail flickers when it\'s happy and blazes in battle.'},
    CHARMELEON:  {name:'CHARMELEON', emoji:'🦎', type:['FIRE'],           maxHp:28, atk:18, def:10, spd:14, moves:['SCRATCH','EMBER','SLASH','DRAGON RAGE'],           xpY:142, evolveAt:36, evolveTo:'CHARIZARD',  desc:'Its claws are sharp. It lashes its tail powerfully to fell opponents.'},
    CHARIZARD:   {name:'CHARIZARD',  emoji:'🐉', type:['FIRE','FLYING'],  maxHp:45, atk:28, def:16, spd:20, moves:['SLASH','FLAMETHROWER','DRAGON RAGE','FLY'],        xpY:266, desc:'Its wings can carry this Pokémon close to an altitude of 4,600 feet. It breathes fire.'},
    SQUIRTLE:    {name:'SQUIRTLE',   emoji:'🐢', type:['WATER'],          maxHp:20, atk:10, def:11, spd:8,  moves:['TACKLE','WATER GUN','TAIL WHIP','GROWL'],           xpY:65,  evolveAt:16, evolveTo:'WARTORTLE',  desc:'Its shell hardens after it withdraws. A formidable defensive Pokémon.'},
    WARTORTLE:   {name:'WARTORTLE',  emoji:'🌊', type:['WATER'],          maxHp:30, atk:15, def:16, spd:11, moves:['WATER GUN','BITE','RAPID SPIN','SKULL BASH'],       xpY:142, evolveAt:36, evolveTo:'BLASTOISE',  desc:'When tucks its head into its shell, the fluffy tail tufts sweep mystically.'},
    BLASTOISE:   {name:'BLASTOISE',  emoji:'💧', type:['WATER'],          maxHp:48, atk:22, def:22, spd:14, moves:['HYDRO PUMP','BITE','RAPID SPIN','SKULL BASH'],      xpY:265, desc:'The pressurized water jets from its shell can pierce steel and concrete.'},
    PIKACHU:     {name:'PIKACHU',    emoji:'⚡', type:['ELECTRIC'],       maxHp:16, atk:14, def:6,  spd:14, moves:['THUNDER SHOCK','QUICK ATK','GROWL','TAIL WHIP'],    xpY:82,  evolveAt:0,  evolveTo:null, desc:'Its cheeks store electricity. When threatened, it discharges instantly.'},
    PIDGEY:      {name:'PIDGEY',     emoji:'🐦', type:['NORMAL','FLYING'],maxHp:14, atk:7,  def:5,  spd:9,  moves:['TACKLE','GUST','SAND-ATTACK'],                     xpY:55,  evolveAt:18, evolveTo:'PIDGEOTTO',  desc:'Very docile. Hides in grass. Excellent flier despite its small size.'},
    PIDGEOTTO:   {name:'PIDGEOTTO',  emoji:'🦅', type:['NORMAL','FLYING'],maxHp:22, atk:12, def:9,  spd:14, moves:['GUST','QUICK ATK','SAND-ATTACK','WING ATTACK'],    xpY:113, desc:'Very territorial. It flaps its wings powerfully to blast its enemies away.'},
    RATTATA:     {name:'RATTATA',    emoji:'🐭', type:['NORMAL'],         maxHp:12, atk:8,  def:4,  spd:11, moves:['TACKLE','QUICK ATK','BITE'],                       xpY:57,  evolveAt:20, evolveTo:'RATICATE',   desc:'It gnaws on anything with its powerful teeth to keep them sharp.'},
    RATICATE:    {name:'RATICATE',   emoji:'🐀', type:['NORMAL'],         maxHp:20, atk:14, def:8,  spd:16, moves:['QUICK ATK','BITE','HYPER FANG','SCARY FACE'],      xpY:116, desc:'Its whiskers sense air movements to predict the actions of opponents.'},
    CATERPIE:    {name:'CATERPIE',   emoji:'🐛', type:['BUG'],            maxHp:10, atk:5,  def:7,  spd:4,  moves:['TACKLE','STRING SHOT'],                           xpY:53,  evolveAt:7,  evolveTo:'METAPOD',    desc:'A voracious eater that devours leaves with reckless abandon.'},
    METAPOD:     {name:'METAPOD',    emoji:'🥚', type:['BUG'],            maxHp:14, atk:4,  def:14, spd:2,  moves:['HARDEN','TACKLE'],                                xpY:72,  evolveAt:10, evolveTo:'BUTTERFREE', desc:'It is encased in a hard shell. It is preparing its body to evolve.'},
    BUTTERFREE:  {name:'BUTTERFREE', emoji:'🦋', type:['BUG','FLYING'],   maxHp:20, atk:9,  def:8,  spd:12, moves:['CONFUSION','GUST','TACKLE','SLEEP POWDER'],        xpY:160, desc:'Covered in poisonous scales. It loves sweet flower nectar.'},
    WEEDLE:      {name:'WEEDLE',     emoji:'🐝', type:['BUG','POISON'],   maxHp:10, atk:7,  def:5,  spd:6,  moves:['POISON STING','STRING SHOT'],                     xpY:52,  evolveAt:7,  evolveTo:'KAKUNA',     desc:'Its needles are venomous. Avoid the tip at all costs!'},
    KAKUNA:      {name:'KAKUNA',     emoji:'🫙', type:['BUG','POISON'],   maxHp:14, atk:5,  def:14, spd:3,  moves:['HARDEN','POISON STING'],                          xpY:72,  evolveAt:10, evolveTo:'BEEDRILL',   desc:'Encased in a steel-hard shell. It awaits evolution without moving.'},
    BEEDRILL:    {name:'BEEDRILL',   emoji:'🐞', type:['BUG','POISON'],   maxHp:20, atk:15, def:7,  spd:14, moves:['POISON STING','TWINEEDLE','FURY ATTACK','RAGE'],   xpY:159, desc:'It has three poisonous stingers on its forelegs and tail. They are used to jab its enemy repeatedly.'},
    ZUBAT:       {name:'ZUBAT',      emoji:'🦇', type:['POISON','FLYING'],maxHp:13, atk:7,  def:5,  spd:9,  moves:['LEECH LIFE','SUPERSONIC','BITE'],                 xpY:54,  evolveAt:22, evolveTo:'GOLBAT',     desc:'Has no eyes. It relies on ultrasonic waves to navigate.'},
    GOLBAT:      {name:'GOLBAT',     emoji:'🦉', type:['POISON','FLYING'],maxHp:24, atk:13, def:9,  spd:15, moves:['BITE','CONFUSE RAY','WING ATTACK','LEECH LIFE'],   xpY:171, desc:'Once it bites, it won\'t stop draining energy from its prey even if full.'},
    GEODUDE:     {name:'GEODUDE',    emoji:'🪨', type:['ROCK','GROUND'],  maxHp:18, atk:10, def:16, spd:3,  moves:['TACKLE','ROCK THROW','DEFENSE CURL'],             xpY:86,  evolveAt:25, evolveTo:'GRAVELER',   desc:'Found on mountain paths. Climbers often mistake it for a boulder.'},
    GRAVELER:    {name:'GRAVELER',   emoji:'⛰', type:['ROCK','GROUND'],  maxHp:28, atk:16, def:22, spd:5,  moves:['ROCK THROW','EARTHQUAKE','DEFENSE CURL','SELF-DESTRUCT'],xpY:187,desc:'Very common on mountainsides. It falls to the ground while rolling down.'},
    JIGGLYPUFF:  {name:'JIGGLYPUFF',emoji:'🎤', type:['NORMAL','FAIRY'], maxHp:24, atk:7,  def:4,  spd:6,  moves:['TACKLE','SING','POUND','DISABLE'],                 xpY:76,  desc:'Its lullaby causes deep sleep. It keeps singing until the listener dozes off.'},
    MEOWTH:      {name:'MEOWTH',     emoji:'🐱', type:['NORMAL'],         maxHp:14, atk:9,  def:5,  spd:12, moves:['SCRATCH','BITE','GROWL','PAY DAY'],               xpY:69,  evolveAt:28, evolveTo:'PERSIAN',    desc:'Fascinated by round, shiny objects. It wanders the streets at night.'},
    PERSIAN:     {name:'PERSIAN',    emoji:'🐈', type:['NORMAL'],         maxHp:22, atk:14, def:9,  spd:18, moves:['SCRATCH','SLASH','BITE','FURY SWIPES'],           xpY:154, desc:'As graceful as a Pokémon can be. It has extremely sharp claws.'},
    MAGIKARP:    {name:'MAGIKARP',   emoji:'🐟', type:['WATER'],          maxHp:8,  atk:2,  def:4,  spd:10, moves:['SPLASH','TACKLE'],                               xpY:20,  evolveAt:20, evolveTo:'GYARADOS',   desc:'An almost entirely useless Pokémon. It is practically incapable of fighting.'},
    GYARADOS:    {name:'GYARADOS',   emoji:'🐉', type:['WATER','FLYING'], maxHp:48, atk:25, def:16, spd:16, moves:['BITE','TWISTER','HYDRO PUMP','DRAGON RAGE'],      xpY:214, desc:'Incredibly destructive and filled with rage. It practically never stops rampaging.'},
    EEVEE:       {name:'EEVEE',      emoji:'🦊', type:['NORMAL'],         maxHp:16, atk:11, def:9,  spd:11, moves:['TACKLE','QUICK ATK','GROWL','SAND-ATTACK'],       xpY:92,  desc:'An unstable genetic makeup makes it able to evolve into many different species.'},
    SNORLAX:     {name:'SNORLAX',    emoji:'😴', type:['NORMAL'],         maxHp:60, atk:18, def:12, spd:3,  moves:['TACKLE','AMNESIA','REST','BODY SLAM'],            xpY:154, desc:'Very lazy. It won\'t go anywhere as long as food is available.'},
    ABRA:        {name:'ABRA',       emoji:'🔮', type:['PSYCHIC'],        maxHp:12, atk:6,  def:4,  spd:16, moves:['TELEPORT','CONFUSION'],                          xpY:73,  evolveAt:16, evolveTo:'KADABRA',    desc:'Using its ability to read minds, it will identify impending danger and teleport to safety.'},
    KADABRA:     {name:'KADABRA',    emoji:'🌀', type:['PSYCHIC'],        maxHp:18, atk:10, def:6,  spd:20, moves:['CONFUSION','PSYBEAM','DISABLE','RECOVER'],        xpY:145, desc:'It emits special alpha waves from its body that induce headaches just by being close by.'},
  };

  // ─── MOVES DATABASE ───────────────────────────────────────────────
  const MOVES = {
    'TACKLE':        {pwr:12, type:'NORMAL',   pp:35, acc:100, cat:'physical', desc:'A full-body tackle.'},
    'SCRATCH':       {pwr:12, type:'NORMAL',   pp:35, acc:100, cat:'physical', desc:'Scratches with sharp claws.'},
    'POUND':         {pwr:10, type:'NORMAL',   pp:35, acc:100, cat:'physical', desc:'Pounds with long tails or forelegs.'},
    'WATER GUN':     {pwr:22, type:'WATER',    pp:25, acc:100, cat:'special',  desc:'Squirts water to attack.'},
    'HYDRO PUMP':    {pwr:40, type:'WATER',    pp:5,  acc:80,  cat:'special',  desc:'A huge volume of water is shot at high pressure.'},
    'SURF':          {pwr:32, type:'WATER',    pp:15, acc:100, cat:'special',  desc:'Soaks the foe with a huge wave.'},
    'SKULL BASH':    {pwr:26, type:'NORMAL',   pp:15, acc:100, cat:'physical', desc:'Tucks in the head to boost DEF, then attacks.'},
    'RAPID SPIN':    {pwr:10, type:'NORMAL',   pp:40, acc:100, cat:'physical', desc:'Spins the body at high speed.'},
    'VINE WHIP':     {pwr:20, type:'GRASS',    pp:25, acc:100, cat:'physical', desc:'Strikes with slender vines.'},
    'RAZOR LEAF':    {pwr:26, type:'GRASS',    pp:25, acc:95,  cat:'physical', desc:'Sharp leaves that often cause a CRITICAL HIT.'},
    'SOLAR BEAM':    {pwr:40, type:'GRASS',    pp:10, acc:100, cat:'special',  desc:'Absorbs light then fires a powerful beam.'},
    'EMBER':         {pwr:22, type:'FIRE',     pp:25, acc:100, cat:'special',  desc:'A weak flame. May BURN.'},
    'FLAMETHROWER':  {pwr:36, type:'FIRE',     pp:15, acc:100, cat:'special',  desc:'Scorching fire. May BURN the target.'},
    'SLASH':         {pwr:28, type:'NORMAL',   pp:20, acc:100, cat:'physical', desc:'High critical-hit ratio slashing attack.'},
    'DRAGON RAGE':   {pwr:30, type:'DRAGON',   pp:10, acc:100, cat:'special',  desc:'Powerful draconic energy attack.'},
    'FLY':           {pwr:28, type:'FLYING',   pp:15, acc:95,  cat:'physical', desc:'Flies up on the 1st turn, then attacks.'},
    'THUNDER SHOCK': {pwr:20, type:'ELECTRIC', pp:30, acc:100, cat:'special',  desc:'Zaps the foe with electricity. May PARALYZE.'},
    'THUNDERBOLT':   {pwr:36, type:'ELECTRIC', pp:15, acc:100, cat:'special',  desc:'Strong lightning attack. May PARALYZE.'},
    'THUNDER':       {pwr:50, type:'ELECTRIC', pp:10, acc:70,  cat:'special',  desc:'Massive lightning strike. May PARALYZE.'},
    'GUST':          {pwr:18, type:'FLYING',   pp:35, acc:100, cat:'special',  desc:'A gust of whirling winds.'},
    'WING ATTACK':   {pwr:24, type:'FLYING',   pp:35, acc:100, cat:'physical', desc:'Strikes the foe with wings.'},
    'QUICK ATK':     {pwr:16, type:'NORMAL',   pp:30, acc:100, cat:'physical', desc:'An almost invisible attack. Hits first.'},
    'BITE':          {pwr:20, type:'DARK',     pp:25, acc:100, cat:'physical', desc:'Bites hard. May cause flinching.'},
    'HYPER FANG':    {pwr:26, type:'NORMAL',   pp:15, acc:90,  cat:'physical', desc:'Attacks with sharp fangs.'},
    'FURY ATTACK':   {pwr:8,  type:'NORMAL',   pp:20, acc:85,  cat:'physical', desc:'Jabs with a beak or horn 2–5 times.'},
    'FURY SWIPES':   {pwr:8,  type:'NORMAL',   pp:15, acc:80,  cat:'physical', desc:'Rakes the foe 2–5 times.'},
    'TWINEEDLE':     {pwr:18, type:'BUG',      pp:20, acc:100, cat:'physical', desc:'Stabs the foe with two needles. May POISON.'},
    'RAGE':          {pwr:16, type:'NORMAL',   pp:20, acc:100, cat:'physical', desc:'Becomes enraged, boosting ATK each hit.'},
    'SCARY FACE':    {pwr:0,  type:'NORMAL',   pp:10, acc:100, cat:'status',   desc:'Frightens the foe, sharply reducing SPD.'},
    'POISON STING':  {pwr:16, type:'POISON',   pp:35, acc:100, cat:'physical', desc:'Stabs with a toxic needle. May POISON.'},
    'LEECH LIFE':    {pwr:12, type:'BUG',      pp:15, acc:100, cat:'physical', desc:'Drains blood to restore HP.'},
    'ROCK THROW':    {pwr:24, type:'ROCK',     pp:15, acc:90,  cat:'physical', desc:'Hurls small rocks at the foe.'},
    'EARTHQUAKE':    {pwr:40, type:'GROUND',   pp:10, acc:100, cat:'physical', desc:'Powerful quake that hits all on the ground.'},
    'SELF-DESTRUCT': {pwr:60, type:'NORMAL',   pp:5,  acc:100, cat:'physical', desc:'Causes an explosion. User faints.'},
    'CONFUSION':     {pwr:22, type:'PSYCHIC',  pp:25, acc:100, cat:'special',  desc:'A weak telekinetic attack. May confuse.'},
    'PSYBEAM':       {pwr:30, type:'PSYCHIC',  pp:20, acc:100, cat:'special',  desc:'Fires a peculiar ray. May confuse.'},
    'CONFUSE RAY':   {pwr:0,  type:'GHOST',    pp:10, acc:100, cat:'status',   desc:'Confuses the target.'},
    'BODY SLAM':     {pwr:30, type:'NORMAL',   pp:15, acc:100, cat:'physical', desc:'Slams the foe with the whole body. May PARALYZE.'},
    'AMNESIA':       {pwr:0,  type:'PSYCHIC',  pp:20, acc:100, cat:'status',   desc:'Sharply raises Sp. Def.'},
    'REST':          {pwr:0,  type:'PSYCHIC',  pp:10, acc:100, cat:'status',   desc:'User sleeps to fully restore HP.'},
    'TWISTER':       {pwr:20, type:'DRAGON',   pp:20, acc:100, cat:'special',  desc:'Whips up a vicious tornado.'},
    'BITE':          {pwr:20, type:'DARK',     pp:25, acc:100, cat:'physical', desc:'Bites hard. May cause flinching.'},
    'SPLASH':        {pwr:0,  type:'WATER',    pp:40, acc:100, cat:'status',   desc:'Nothing happens.'},
    'HARDEN':        {pwr:0,  type:'NORMAL',   pp:30, acc:100, cat:'status',   desc:'Stiffens the body\'s muscles to raise DEF.'},
    'SLEEP POWDER':  {pwr:0,  type:'GRASS',    pp:15, acc:75,  cat:'status',   desc:'Scatters a powder to induce sleep.'},
    'PAY DAY':       {pwr:18, type:'NORMAL',   pp:20, acc:100, cat:'physical', desc:'Coin attack. Earn money after battle!'},
    'GROWL':         {pwr:0,  type:'NORMAL',   pp:40, acc:100, cat:'status',   desc:'Lowers the foe\'s ATK.'},
    'TAIL WHIP':     {pwr:0,  type:'NORMAL',   pp:30, acc:100, cat:'status',   desc:'Lowers the foe\'s DEF.'},
    'SING':          {pwr:0,  type:'NORMAL',   pp:15, acc:55,  cat:'status',   desc:'Puts the foe to sleep.'},
    'SUPERSONIC':    {pwr:0,  type:'NORMAL',   pp:20, acc:55,  cat:'status',   desc:'Confuses the foe.'},
    'LEECH SEED':    {pwr:0,  type:'GRASS',    pp:10, acc:90,  cat:'status',   desc:'Plants a seed that drains HP each turn.'},
    'SAND-ATTACK':   {pwr:0,  type:'NORMAL',   pp:15, acc:100, cat:'status',   desc:'Reduces the foe\'s accuracy.'},
    'STRING SHOT':   {pwr:0,  type:'BUG',      pp:40, acc:95,  cat:'status',   desc:'Sprays string to lower SPD.'},
    'DEFENSE CURL':  {pwr:0,  type:'NORMAL',   pp:40, acc:100, cat:'status',   desc:'Raises the user\'s DEF.'},
    'DISABLE':       {pwr:0,  type:'NORMAL',   pp:20, acc:100, cat:'status',   desc:'Disables the foe\'s last move.'},
    'TELEPORT':      {pwr:0,  type:'PSYCHIC',  pp:20, acc:100, cat:'status',   desc:'Switches the user out immediately.'},
    'RECOVER':       {pwr:0,  type:'NORMAL',   pp:20, acc:100, cat:'status',   desc:'Restores up to half the user\'s max HP.'},
  };

  // Type effectiveness chart
  const TYPE_EFF = {
    FIRE:    {GRASS:2, ICE:2, BUG:2, STEEL:2,         WATER:.5, ROCK:.5, FIRE:.5, DRAGON:.5},
    WATER:   {FIRE:2, GROUND:2, ROCK:2,                GRASS:.5, WATER:.5, DRAGON:.5},
    GRASS:   {WATER:2, GROUND:2, ROCK:2,               FIRE:.5, GRASS:.5, POISON:.5, FLYING:.5, BUG:.5, DRAGON:.5, STEEL:.5},
    ELECTRIC:{WATER:2, FLYING:2,                       GRASS:.5, ELECTRIC:.5, DRAGON:.5, GROUND:0},
    NORMAL:  {ROCK:.5, STEEL:.5,                       GHOST:0},
    FLYING:  {GRASS:2, FIGHTING:2, BUG:2,              ROCK:.5, STEEL:.5, ELECTRIC:.5},
    ROCK:    {FIRE:2, ICE:2, FLYING:2, BUG:2,          FIGHTING:.5, GROUND:.5, STEEL:.5},
    POISON:  {GRASS:2, FAIRY:2,                        POISON:.5, GROUND:.5, ROCK:.5, GHOST:.5, STEEL:0},
    BUG:     {GRASS:2, PSYCHIC:2, DARK:2,              FIRE:.5, FIGHTING:.5, FLYING:.5, GHOST:.5, STEEL:.5, FAIRY:.5},
    DARK:    {PSYCHIC:2, GHOST:2,                      FIGHTING:.5, DARK:.5, FAIRY:.5},
    PSYCHIC: {FIGHTING:2, POISON:2,                    PSYCHIC:.5, DARK:0, STEEL:.5},
    DRAGON:  {DRAGON:2,                                STEEL:.5, FAIRY:0},
    GROUND:  {FIRE:2, ELECTRIC:2, POISON:2, ROCK:2, STEEL:2, FLYING:0},
    ICE:     {GRASS:2, GROUND:2, FLYING:2, DRAGON:2,   FIRE:.5, WATER:.5, ICE:.5, STEEL:.5},
  };

  function typeEffectiveness(atkType, defTypes) {
    let mult = 1;
    for (const dt of defTypes) mult *= (TYPE_EFF[atkType]?.[dt] ?? 1);
    return mult;
  }

  const TYPE_COLOR = {
    NORMAL:'#a0a080', FIRE:'#e84820',   WATER:'#4888f8',  GRASS:'#78c840',
    ELECTRIC:'#f8d030', BUG:'#a8b820', ROCK:'#b8a038',   POISON:'#a040a0',
    FLYING:'#a890f0',  DARK:'#705848',  ICE:'#98d8d8',    PSYCHIC:'#f85888',
    FAIRY:'#f0b6bc',   GROUND:'#d8b060', GHOST:'#705898', DRAGON:'#7038f8',
    STEEL:'#b8b8d0',   FIGHTING:'#c03020',
  };

  const WILD_TALL  = ['PIDGEY','RATTATA','CATERPIE','WEEDLE','JIGGLYPUFF','EEVEE'];
  const WILD_DEEP  = ['PIDGEY','RATTATA','ZUBAT','GEODUDE','MEOWTH','ABRA'];
  const WILD_WATER = ['MAGIKARP','MAGIKARP','MAGIKARP','RATTATA','ZUBAT'];

  // ─── SHOP ITEMS ───────────────────────────────────────────────────
  const SHOP_ITEMS = [
    { id:'POTION',       name:'POTION',       emoji:'💊', price:300,  desc:'Restores 20 HP to one Pokémon.',         effect:'heal20' },
    { id:'SUPER_POTION', name:'SUPER POTION', emoji:'💉', price:700,  desc:'Restores 50 HP to one Pokémon.',         effect:'heal50' },
    { id:'FULL_RESTORE', name:'FULL RESTORE', emoji:'✨', price:3000, desc:'Fully restores HP and cures status.',    effect:'fullrestore' },
    { id:'POKEBALL',     name:'POKÉ BALL',    emoji:'⚫', price:200,  desc:'A device used to catch wild Pokémon.',   effect:'catch' },
    { id:'GREAT_BALL',   name:'GREAT BALL',   emoji:'🔵', price:600,  desc:'A better Poké Ball. Higher catch rate.', effect:'catch_great' },
    { id:'ULTRA_BALL',   name:'ULTRA BALL',   emoji:'🟡', price:1200, desc:'Even better catch rate!',                effect:'catch_ultra' },
    { id:'ANTIDOTE',     name:'ANTIDOTE',     emoji:'🧪', price:100,  desc:'Cures a Pokémon of POISON.',             effect:'cure_psn' },
    { id:'PARALYZE_HEAL',name:'PARA-HEAL',    emoji:'⚡', price:200,  desc:'Cures PARALYSIS.',                       effect:'cure_prz' },
    { id:'AWAKENING',    name:'AWAKENING',    emoji:'☕', price:250,  desc:'Cures SLEEP status.',                    effect:'cure_slp' },
    { id:'BURN_HEAL',    name:'BURN HEAL',    emoji:'🧊', price:250,  desc:'Cures BURN status.',                    effect:'cure_brn' },
    { id:'FULL_HEAL',    name:'FULL HEAL',    emoji:'💫', price:600,  desc:'Cures all status conditions.',           effect:'full_heal' },
    { id:'ESCAPE_ROPE',  name:'ESCAPE ROPE',  emoji:'🪢', price:550,  desc:'Use to escape from caves instantly.',   effect:'escape' },
    { id:'RARE_CANDY',   name:'RARE CANDY',   emoji:'🍬', price:4800, desc:'Raises a Pokémon\'s level by 1.',        effect:'rare_candy' },
    { id:'ORAN_BERRY',   name:'ORAN BERRY',   emoji:'🫐', price:80,   desc:'Restores 10 HP. Held item effect.',     effect:'heal10' },
  ];

  // ─── GAME STATE ───────────────────────────────────────────────────
  let gameState     = 'intro';
  let playerPoke    = null;
  let playerHp      = 0, playerXp = 0, playerXpNext = 100;
  let playerMoney   = 500, playerBadges = 0;
  let playerBag     = [];
  let playerPokedex = new Set(); // caught/seen pokemon names
  let enemyPoke     = null, enemyHp = 0;
  let enemyStatus   = null, playerStatus = null;
  let battleState   = 'choose';
  let selectedBOpt  = 0, selectedMOpt = 0, selectedMenuOpt = 0, selectedBagOpt = 0;
  let selectedShopOpt = 0;
  let dialogQueue   = [], dialogCallback = null, dialogPortrait = '💬', dialogSpeaker = '';
  let cameraX = 0, cameraY = 0;
  let steps = 0, wins = 0, frameCount = 0;
  let location = 'PALLET TOWN';
  let weather = 'clear';
  let weatherParts  = [];
  let battleParts   = [];
  let minimapVisible = true;
  let hintFaded     = false;
  let dayTime       = 0;
  let starterIdx    = 1;
  let selectedNpc   = null;
  let toastTimer    = null;
  let shopItem      = null;
  let npcDefeated   = {};
  let introBgStars  = [];
  let battleStreak  = 0; // consecutive wins
  let movePP        = {}; // track PP per move: {moveName: currentPP}
  let enemyMovePP   = {};
  let leechSeedActive = false; // leech seed status for enemy
  let isTrainerBattle = false;
  let activeNpc     = null;

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
  function sfxStep()     { playTone(200+Math.random()*40, 0.04, 'square', 0.03); }
  function sfxConfirm()  { playTone(440,0.07,'square',0.1); playTone(660,0.1,'square',0.1,0.07); }
  function sfxCancel()   { playTone(300,0.06,'square',0.08); playTone(200,0.08,'square',0.08,0.06); }
  function sfxHit()      { playTone(180,0.12,'sawtooth',0.14); playTone(120,0.1,'sawtooth',0.1,0.06); }
  function sfxSuperHit() { playTone(280,0.14,'sawtooth',0.18); playTone(200,0.12,'sawtooth',0.15,0.06); playTone(160,0.1,'sawtooth',0.1,0.12); }
  function sfxFaint()    { [500,400,300,200,150].forEach((f,i)=>playTone(f,0.1,'square',0.1,i*0.1)); }
  function sfxLevelUp()  { [330,440,550,660,880,1100].forEach((f,i)=>playTone(f,0.14,'square',0.13,i*0.07)); }
  function sfxCatch()    { [440,330,220,330,440,550].forEach((f,i)=>playTone(f,0.1,'square',0.1,i*0.12)); }
  function sfxEncounter(){ [200,250,200,300,400].forEach((f,i)=>playTone(f,0.08,'sawtooth',0.15,i*0.06)); }
  function sfxMenu()     { playTone(330,0.05,'square',0.08); }
  function sfxEvolve()   { [330,440,550,660,770,880,1100,880,660].forEach((f,i)=>playTone(f,0.15,'square',0.15,i*0.09)); }
  function sfxCritical() { playTone(880,0.05,'square',0.2); playTone(660,0.1,'square',0.18,0.05); }
  function sfxHeal()     { [440,550,660,770].forEach((f,i)=>playTone(f,0.1,'sine',0.12,i*0.06)); }
  function sfxEscape()   { [330,220,110].forEach((f,i)=>playTone(f,0.1,'sawtooth',0.1,i*0.08)); }

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
    if (gameState === 'intro')         { if (key==='a'||key==='start') { sfxConfirm(); showStarter(); } return; }
    if (gameState === 'starter')       { handleStarterInput(key); return; }
    if (gameState === 'dialog')        { if (key==='a'||key==='b') { sfxConfirm(); advanceDialog(); } return; }
    if (gameState === 'battle')        { handleBattleInput(key); return; }
    if (gameState === 'menu')          { handleMenuInput(key); return; }
    if (gameState === 'pokemon-panel') { if (key==='b'||key==='start') closePokemonPanel(); return; }
    if (gameState === 'pokedex')       { if (key==='b'||key==='start') closePokedex(); return; }
    if (gameState === 'shop')          { handleShopInput(key); return; }
    if (gameState === 'overworld') {
      if (key === 'start') { sfxMenu(); openMenu(); }
      else if (key === 'a') { interact(); }
      else if (key === 'map') { toggleMinimap(); }
    }
  }

  // ─── INTRO ────────────────────────────────────────────────────────
  function generateIntroStars(w, h) {
    introBgStars = Array.from({length:140},()=>({
      x:Math.random()*w, y:Math.random()*h,
      r:Math.random()*1.8+.3, spd:Math.random()*.3+.1,
      twinkle:Math.random()*Math.PI*2, col:Math.random()<.1?'#ffcc44':Math.random()<.3?'#aaddff':'#e0f8d0',
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
    if (key==='a')     { confirmStarter(); }
  }
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
    playerPoke.level = 5;
    playerHp   = playerPoke.maxHp; playerXp = 0; playerXpNext = 100;
    steps = 0; wins = 0; battleStreak = 0;
    playerPokedex = new Set([chosen]);
    initMovePP(playerPoke);
    document.getElementById('starter-screen').classList.add('hidden');
    document.getElementById('game-wrap').classList.remove('hidden');
    gameState = 'overworld';
    resize();
    player.px = player.x * TILE; player.py = player.y * TILE;
    updateHUD();
    showDialog([
      `You chose ${playerPoke.name}!\nA fine choice!`,
      "My grandson also has\na POKÉMON! I hope\nyou meet someday.",
      "Walk into TALL GRASS\nfor wild encounters.\nPress Z near signs & buildings.",
      "Visit the POKÉMON\nCENTER to heal!\nCheck the MART for items.",
      "Check your POKÉDEX\nfrom the menu to track\nyour caught Pokémon!",
    ], ()=>{ gameState='overworld'; }, '🎓', 'PROF. OAK');
  }

  // ─── DEEP CLONE ───────────────────────────────────────────────────
  function deepClone(o) { return JSON.parse(JSON.stringify(o)); }

  // ─── MOVE PP INIT ─────────────────────────────────────────────────
  function initMovePP(poke, ppStore={}) {
    poke.moves.forEach(m => { if (!(m in ppStore)) ppStore[m] = MOVES[m]?.pp || 10; });
    return ppStore;
  }

  // ─── MAP HELPERS ──────────────────────────────────────────────────
  function getTile(tx, ty) {
    if (tx<0||ty<0||tx>=MW||ty>=MH) return T.WALL;
    return MAP[ty*MW+tx];
  }
  function isBlocked(tile, nx, ny) {
    if (tile===T.TREE||tile===T.WALL||tile===T.WATER||tile===T.FENCE) return true;
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
        // + cross symbol
        ctx.fillStyle='#ffffff'; ctx.fillRect(x+3.5*q,y+4.5*q,q,3*q); ctx.fillRect(x+2.5*q,y+5.5*q,3*q,q);
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

      ctx.fillStyle='rgba(0,0,0,.18)';
      ctx.beginPath();
      ctx.ellipse(sx+TILE/2, sy+TILE-q*.5, TILE/2.5, q*.6, 0, 0, Math.PI*2);
      ctx.fill();

      ctx.font = `${TILE*0.72}px serif`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
      ctx.fillText(npc.emoji, sx+TILE/2, sy+TILE-q*.5);
      ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';

      // Trainer exclamation mark when near
      if (npc.trainer && !npcDefeated[npc.name]) {
        const dist = Math.abs(player.x-npc.tx)+Math.abs(player.y-npc.ty);
        if (dist <= 3) {
          const pulse = Math.abs(Math.sin(frameCount*0.12));
          const q2 = TILE/8;
          ctx.font = `bold ${TILE*0.4}px sans-serif`;
          ctx.fillStyle = `rgba(255,80,0,${0.7+pulse*0.3})`;
          ctx.textAlign = 'center';
          ctx.fillText('!', sx+TILE/2, sy-q2);
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
      ? Math.sin(frameCount * 0.05) * 6
      : Math.sin(frameCount * 0.06 + 1) * 5;
    // Low HP pulse
    const hpPct = isEnemy ? enemyHp/enemyPoke?.maxHp : playerHp/playerPoke?.maxHp;
    const pulse = hpPct < 0.25 ? 0.9 + 0.1*Math.sin(frameCount*0.15) : 1;
    c.save();
    c.translate(size/2, size/2 + bob);
    c.scale(pulse, pulse);
    c.font = `${size * 0.72}px serif`;
    c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillText(emoji, 0, 0);
    c.restore();
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
    dayTime = (dayTime + 0.00008) % 1;
    const overlay = document.getElementById('daynight-overlay');
    const timeBox  = document.getElementById('hud-time-box');
    if (!overlay) return;
    let col, icon;
    if (dayTime < 0.25) {
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
    // NPC dots
    for (const npc of NPCS) {
      if (npcDefeated[npc.name] && npc.trainer) continue;
      minimapCtx.fillStyle = npc.trainer ? '#ff8800' : '#88cc88';
      minimapCtx.fillRect(npc.tx*tw-1, npc.ty*th-1, 3, 3);
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
    drawLocationLabel();
    drawMinimap();
  }

  // ─── LOCATION LABEL ON MAP ────────────────────────────────────────
  let locationLabelAlpha = 0, locationLabelTimer = 0;
  function drawLocationLabel() {
    if (locationLabelAlpha <= 0) return;
    locationLabelAlpha -= 0.008;
    ctx.save();
    ctx.globalAlpha = Math.max(0, locationLabelAlpha);
    const txt = location.toUpperCase();
    ctx.font = `bold ${TILE*0.35}px 'Press Start 2P', monospace`;
    ctx.textAlign = 'center';
    const tw2 = ctx.measureText(txt).width;
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(W/2 - tw2/2 - 12, H*0.12, tw2+24, TILE*0.5);
    ctx.fillStyle = '#e0f8d0';
    ctx.fillText(txt, W/2, H*0.12 + TILE*0.38);
    ctx.restore();
    ctx.textAlign = 'left';
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
    if (steps % 2 === 0) sfxStep();
    // Encounter checks
    if (tile===T.TALL && Math.random()<0.2)        player._pendingBattle='tall';
    else if (tile===T.GRASS && Math.random()<0.05) player._pendingBattle='grass';
    else if (tile===T.WATER && Math.random()<0.12) player._pendingBattle='water';
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
    if (tx>=8&&tx<=13&&ty>=1&&ty<=14)   loc='ROUTE 1';
    if (tx>=14&&tx<=36)                  loc='ROUTE 2';
    if (ty>=18&&ty<=19)                  loc='CERULEAN LAKE';
    if (ty>=23&&ty<=24&&tx<=15)          loc='SOUTH PATH';
    if (loc!==location) {
      location=loc;
      document.getElementById('hud-location').textContent=loc;
      locationLabelAlpha = 2.5;
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
        } else if (npc.trainer && npcDefeated[npc.name]) {
          showDialog(["...", "You beat me fair\nand square. Well done."], ()=>{gameState='overworld';}, npc.emoji, npc.name);
        } else {
          showDialog(npc.dialog, ()=>{gameState='overworld';}, npc.emoji, npc.name);
        }
        return;
      }
    }
    if (SIGNS[key]) { showDialog([SIGNS[key]], ()=>{gameState='overworld';}, '📋', 'SIGN'); return; }
    if (tile===T.POKE_CENTER) {
      sfxHeal();
      const old=playerHp; playerHp=playerPoke.maxHp; playerStatus=null;
      leechSeedActive=false;
      initMovePP(playerPoke, movePP); // restore all PP
      playerPoke.moves.forEach(m => movePP[m] = MOVES[m]?.pp || 10);
      updateHUD();
      updateStatusBadge('player', null);
      showDialog([
        'NURSE JOY:\nWelcome to the\nPOKÉMON CENTER!',
        `Your ${playerPoke.name} has\nbeen fully restored!\nMoves also healed!`,
        old<playerPoke.maxHp ? '✓ HP fully restored!' : '♥ Already at full HP!',
      ], ()=>{gameState='overworld';}, '💊', 'NURSE JOY');
      return;
    }
    if (tile===T.MART) { openShop(); return; }
    if (tile===T.HOUSE) {
      const houseDialogs = [
        ['The door is locked.\nNobody seems to be home.'],
        ['Smells of fresh bread\nfrom inside!'],
        ['A note on the door:\n"OUT FOR THE DAY."'],
      ];
      const d = houseDialogs[Math.floor(Math.random()*houseDialogs.length)];
      showDialog(d, ()=>{gameState='overworld';}, '🏠', 'HOUSE');
    }
    if (tile===T.WATER) {
      const rodInBag = playerBag.find(b=>b.id==='SUPER_ROD');
      if (rodInBag) {
        showDialog([
          'You cast your line...',
          `A wild ${WILD_WATER[Math.floor(Math.random()*WILD_WATER.length)]} appeared!`,
        ], ()=>{ triggerWildBattle(WILD_WATER); }, '🎣', 'FISHING');
      }
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
    twTimer=setTimeout(typeChar, 22);
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
    document.getElementById('hud-badge-count').textContent = playerBadges;
  }

  // ─── TOAST ────────────────────────────────────────────────────────
  function showToast(msg) {
    const t=document.getElementById('toast');
    if(!t)return;
    t.textContent=msg; t.classList.remove('hidden');
    clearTimeout(toastTimer);
    toastTimer=setTimeout(()=>t.classList.add('hidden'),2800);
  }

  // ─── BATTLE BG ────────────────────────────────────────────────────
  function drawBattleBg() {
    if (!battleBgCtx) return;
    const bw=battleBgCanvas.width, bh=battleBgCanvas.height;
    const sky=battleBgCtx.createLinearGradient(0,0,0,bh*.55);
    const isNight=dayTime<0.2||dayTime>0.8;
    if (isNight) {
      sky.addColorStop(0,'#050820'); sky.addColorStop(1,'#1a2855');
    } else if (weather==='rain') {
      sky.addColorStop(0,'#445566'); sky.addColorStop(1,'#667788');
    } else {
      sky.addColorStop(0,'#5090d8'); sky.addColorStop(1,'#90c0f0');
    }
    battleBgCtx.fillStyle=sky; battleBgCtx.fillRect(0,0,bw,bh*.55);
    const gnd=battleBgCtx.createLinearGradient(0,bh*.55,0,bh);
    gnd.addColorStop(0,'#5a9830'); gnd.addColorStop(1,'#2a6010');
    battleBgCtx.fillStyle=gnd; battleBgCtx.fillRect(0,bh*.55,bw,bh*.45);
    battleBgCtx.strokeStyle='rgba(0,0,0,.15)'; battleBgCtx.lineWidth=1;
    for(let i=0;i<16;i++){
      const y=bh*.55+i*(bh*.45/16);
      battleBgCtx.beginPath(); battleBgCtx.moveTo(0,y); battleBgCtx.lineTo(bw,y); battleBgCtx.stroke();
    }
    if (isNight) {
      battleBgCtx.fillStyle='rgba(255,255,255,.8)';
      for(let i=0;i<50;i++){
        battleBgCtx.fillRect(Math.random()*bw,Math.random()*bh*.5,1,1);
      }
    } else {
      battleBgCtx.fillStyle='rgba(255,255,255,.75)';
      for(const cl of [{x:bw*.12,y:bh*.1,r:50},{x:bw*.55,y:bh*.07,r:65},{x:bw*.82,y:bh*.13,r:42}]){
        battleBgCtx.beginPath(); battleBgCtx.arc(cl.x,cl.y,cl.r,0,Math.PI*2); battleBgCtx.fill();
        battleBgCtx.beginPath(); battleBgCtx.arc(cl.x+cl.r*.65,cl.y,cl.r*.7,0,Math.PI*2); battleBgCtx.fill();
      }
    }
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
    const poke = deepClone(POKEMON[key]);
    // Scale level near player level
    poke.level = Math.max(2, playerPoke.level + Math.floor(Math.random()*4)-2);
    startBattle(poke, false, null);
  }
  function triggerTrainerBattle(npc) {
    const poke = deepClone(POKEMON[npc.pokemon||'RATTATA']);
    poke.level = npc.level || 4;
    startBattle(poke, true, npc);
  }

  function startBattle(poke, trainer, npc) {
    sfxEncounter();
    isTrainerBattle = trainer;
    activeNpc = npc;
    enemyPoke = poke;
    const scale = enemyPoke.level / 5;
    enemyPoke.maxHp = Math.max(8, Math.round(enemyPoke.maxHp * scale));
    enemyHp = enemyPoke.maxHp;
    enemyStatus = null; playerStatus = null;
    leechSeedActive = false;
    enemyMovePP = initMovePP(enemyPoke, {});
    updateStatusBadge('enemy', null); updateStatusBadge('player', null);

    // Mark as seen in pokedex
    playerPokedex.add(enemyPoke.name);

    const fl=document.createElement('div');
    fl.className='flash-overlay';
    document.getElementById('game-wrap').appendChild(fl);
    setTimeout(()=>fl.remove(),500);

    setTimeout(()=>{
      drawBattleBg();
      const spSize = Math.min(160, W*.18);
      if (enemySpCanvas)  { enemySpCanvas.width=enemySpCanvas.height=spSize; }
      if (playerSpCanvas) { playerSpCanvas.width=playerSpCanvas.height=spSize*.85; }

      document.getElementById('enemy-tag').textContent  = trainer ? (npc?.name||'TRAINER') : 'WILD';
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
      setBattleMsg(trainer ? `${npc?.name||'TRAINER'} sent out ${enemyPoke.name}!` : `A wild ${enemyPoke.name} appeared!`);
    }, 220);
  }

  // ─── BATTLE: UI ───────────────────────────────────────────────────
  const battleMsgEl  = document.getElementById('battle-msg');
  const battleOpts   = document.querySelectorAll('.b-opt');
  const moveMenuEl   = document.getElementById('move-menu');
  const moveGridEl   = document.getElementById('move-grid');
  const bagBattleEl  = document.getElementById('bag-battle-menu');
  const bagBattleList= document.getElementById('bag-battle-list');
  const enemyHpBar   = document.getElementById('enemy-hp-bar');
  const playerHpBar  = document.getElementById('player-hp-bar');
  const playerHpText = document.getElementById('player-hp-text');
  const playerXpBar  = document.getElementById('player-xp-bar');

  function setBattleMsg(txt) { if(battleMsgEl) battleMsgEl.textContent=txt; }
  function updateBattleOptUI() { battleOpts.forEach((el,i)=>el.classList.toggle('selected',i===selectedBOpt)); }
  function updateMoveOptUI() {
    document.querySelectorAll('.move-item').forEach((el,i)=>el.classList.toggle('selected',i===selectedMOpt));
    const mv = playerPoke.moves[selectedMOpt];
    const md = MOVES[mv];
    if (md) {
      const ms_type = document.getElementById('ms-type');
      if(ms_type) { ms_type.textContent=md.type; ms_type.style.background=TYPE_COLOR[md.type]+'33'; ms_type.style.color=TYPE_COLOR[md.type]; ms_type.style.borderColor=TYPE_COLOR[md.type]; }
      const els = { 'ms-pwr':`PWR ${md.pwr||'—'}`, 'ms-acc':`ACC ${md.acc}%`, 'ms-pp':`PP ${movePP[mv]??md.pp}/${md.pp}`, 'ms-cat':md.cat.toUpperCase() };
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
    if (!status) { el.className='status-hidden'; el.textContent=''; return; }
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
      if(key==='up'&&selectedMOpt>1)    {selectedMOpt-=2;sfxMenu();}
      if(key==='down'&&selectedMOpt<n-1){selectedMOpt+=2;sfxMenu();}
      if(key==='left'&&selectedMOpt%2)  {selectedMOpt--;sfxMenu();}
      if(key==='right'&&!(selectedMOpt%2)&&selectedMOpt+1<n){selectedMOpt++;sfxMenu();}
      updateMoveOptUI();
      if (key==='a') { sfxConfirm(); useMove(playerPoke.moves[selectedMOpt]); }
      if (key==='b') { sfxCancel(); battleState='choose'; moveMenuEl.classList.add('hidden'); document.getElementById('battle-menu').style.display=''; setBattleMsg(`What will ${playerPoke.name} do?`); updateBattleOptUI(); }
      return;
    }
    if (battleState==='bag') {
      const bagItems = playerBag.filter(i=>i.qty>0);
      if(key==='up'&&selectedBagOpt>0)              {selectedBagOpt--;sfxMenu();}
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
      if (isTrainerBattle) {
        setBattleMsg("Can't flee from a\nTrainer battle!");
        return;
      }
      const escape = playerPoke.spd > enemyPoke.spd ? 0.85 : 0.6;
      if (Math.random() < escape) {
        sfxEscape();
        setBattleMsg('Got away safely!');
        battleState='result';
      } else {
        setBattleMsg("Can't escape!"); doEnemyTurn();
      }
    } else if (act==='bag') {
      battleState='bag'; openBagMenu();
    } else if (act==='pokemon') {
      setBattleMsg('No other POKÉMON!'); // Could expand to party system
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
      const pp=movePP[m]??md?.pp??10;
      const ppMax=md?.pp??10;
      const ppLow=pp<=Math.floor(ppMax/3);
      const div=document.createElement('div');
      div.className='move-item'+(i===0?' selected':'');
      div.innerHTML=`<span style="color:${tc};font-size:9px">■</span>${m}<span class="move-pp-inline" style="color:${ppLow?'#ff4444':'#aaa'}">${pp}/${ppMax}</span>`;
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
        d.addEventListener('click',()=>{selectedBagOpt=i;sfxMenu();updateBagOptUI(items);});
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
    if (item.effect==='catch'||item.effect==='catch_great'||item.effect==='catch_ultra') {
      if (isTrainerBattle) { setBattleMsg("Can't catch a\nTrainer's Pokémon!"); closeBagMenu(); return; }
      closeBagMenu();
      attemptCatch(item);
      return;
    }
    if (item.effect==='escape') {
      if (isTrainerBattle) { setBattleMsg("Can't use that\nin a Trainer battle!"); closeBagMenu(); return; }
      sfxEscape();
      item.qty--;
      setBattleMsg('Used ESCAPE ROPE!\nGot away safely!');
      battleState='result';
      closeBagMenu();
      return;
    }
    let msg = null;
    if (item.effect==='heal10') { playerHp=Math.min(playerPoke.maxHp, playerHp+10); msg=`${playerPoke.name} recovered\n10 HP!`; }
    else if (item.effect==='heal20') { playerHp=Math.min(playerPoke.maxHp, playerHp+20); msg=`${playerPoke.name} recovered\n20 HP!`; }
    else if (item.effect==='heal50') { playerHp=Math.min(playerPoke.maxHp, playerHp+50); msg=`${playerPoke.name} recovered\n50 HP!`; }
    else if (item.effect==='fullrestore') { playerHp=playerPoke.maxHp; playerStatus=null; updateStatusBadge('player',null); msg=`${playerPoke.name} fully\nrestored!`; }
    else if (item.effect==='full_heal') { playerStatus=null; updateStatusBadge('player',null); msg=`${playerPoke.name} cured\nof all status!`; }
    else if (item.effect==='cure_psn'&&playerStatus==='psn') { playerStatus=null; updateStatusBadge('player',null); msg=`${playerPoke.name} cured\nof POISON!`; }
    else if (item.effect==='cure_prz'&&playerStatus==='prz') { playerStatus=null; updateStatusBadge('player',null); msg=`${playerPoke.name} cured\nof PARALYSIS!`; }
    else if (item.effect==='cure_slp'&&playerStatus==='slp') { playerStatus=null; updateStatusBadge('player',null); msg=`${playerPoke.name} woke up!`; }
    else if (item.effect==='cure_brn'&&playerStatus==='brn') { playerStatus=null; updateStatusBadge('player',null); msg=`${playerPoke.name} cured\nof BURN!`; }
    else if (item.effect==='rare_candy') {
      levelUpPokemon(playerPoke, true);
      msg=`${playerPoke.name} leveled\nup to Lv.${playerPoke.level}!`;
    }
    else { setBattleMsg(`Can't use that now!`); closeBagMenu(); return; }
    item.qty--; sfxHeal();
    if (item.qty <= 0) playerBag = playerBag.filter(b=>b.qty>0);
    updateBattleHpBars();
    setBattleMsg(msg || 'Used an item!');
    closeBagMenu();
    battleState='anim';
    setTimeout(()=>doEnemyTurn(), 1300);
  }

  // ─── POKÉBALL CATCH ───────────────────────────────────────────────
  function attemptCatch(item) {
    sfxCatch();
    const catchOverlay = document.getElementById('catch-overlay');
    const pokeballAnim = document.getElementById('pokeball-anim');
    const catchResult  = document.getElementById('catch-result');
    const ballIcon = item.id==='ULTRA_BALL'?'🟡':item.id==='GREAT_BALL'?'🔵':'⚫';
    pokeballAnim.textContent = ballIcon;
    catchOverlay.classList.remove('hidden');
    battleState='catch';
    item.qty--;
    if (item.qty <= 0) playerBag = playerBag.filter(b=>b.qty>0);

    const hpFraction = enemyHp / enemyPoke.maxHp;
    const baseRate = item.id==='ULTRA_BALL' ? 2 : item.id==='GREAT_BALL' ? 1.5 : 1;
    const statusBonus = enemyStatus==='slp'||enemyStatus==='frz' ? 1.5 : enemyStatus ? 1.2 : 1;
    const catchChance = Math.min(0.95, baseRate * statusBonus * (1 - hpFraction*.65));

    let shakeCount = 0;
    const maxShakes = Math.floor(catchChance * 4);
    const shakeInterval = setInterval(()=>{
      shakeCount++;
      pokeballAnim.style.transform = `rotate(${shakeCount%2===0?-15:15}deg)`;
      if (shakeCount >= Math.min(maxShakes, 3)) { clearInterval(shakeInterval); }
    }, 500);

    setTimeout(()=>{
      clearInterval(shakeInterval);
      pokeballAnim.style.transform = '';
      const caught = Math.random() < catchChance;
      catchResult.textContent = caught ? `★ ${enemyPoke.name} was\ncaught!` : `${enemyPoke.name} broke free!`;
      setTimeout(()=>{
        catchOverlay.classList.add('hidden');
        if (caught) {
          wins++;
          battleStreak++;
          playerPokedex.add(enemyPoke.name);
          updateHUD();
          showToast(`★ Caught ${enemyPoke.name}!`);
          setBattleMsg(`${enemyPoke.name} was caught!\nAdded to POKÉDEX!`);
        } else {
          setBattleMsg(`${enemyPoke.name} broke\nfree!`);
          doEnemyTurn();
          return;
        }
        battleState='result';
      }, 1800);
    }, 1800);
  }

  // ─── DAMAGE CALCULATION ───────────────────────────────────────────
  function calcDmg(attacker, moveName, defender) {
    const md=MOVES[moveName];
    if (!md||md.pwr===0) return {dmg:0, eff:1};
    const eff=typeEffectiveness(md.type, defender.type);
    const variance=0.85+Math.random()*.15;
    // STAB bonus
    const stab = attacker.type.includes(md.type) ? 1.5 : 1;
    let dmg=Math.max(1, Math.round(md.pwr*(attacker.atk/defender.def)*variance*.65*eff*stab));
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
  function floatMsg(txt, x, y, color='#ffdd44') {
    const el=document.createElement('div');
    el.className='crit-label';
    el.textContent=txt;
    el.style.cssText=`left:${x}px;top:${y}px;color:${color}`;
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
  function applyStatusToEnemy(moveName) {
    if (enemyStatus) return; // can't stack status
    if (moveName==='EMBER'&&Math.random()<.15)          { enemyStatus='brn'; updateStatusBadge('enemy','brn'); setBattleMsg(getBattleMsg()+'BURNED!'); }
    else if (moveName==='FLAMETHROWER'&&Math.random()<.1){ enemyStatus='brn'; updateStatusBadge('enemy','brn'); }
    else if ((moveName==='THUNDER SHOCK'||moveName==='THUNDERBOLT')&&Math.random()<.15){ enemyStatus='prz'; updateStatusBadge('enemy','prz'); }
    else if ((moveName==='POISON STING'||moveName==='TWINEEDLE')&&Math.random()<.35)  { enemyStatus='psn'; updateStatusBadge('enemy','psn'); }
    else if ((moveName==='SING'||moveName==='SLEEP POWDER')&&Math.random()<.6)        { enemyStatus='slp'; updateStatusBadge('enemy','slp'); }
    else if (moveName==='BODY SLAM'&&Math.random()<.3)  { enemyStatus='prz'; updateStatusBadge('enemy','prz'); }
  }
  function applyStatusToPlayer(moveName) {
    if (playerStatus) return;
    if (moveName==='EMBER'&&Math.random()<.1)           { playerStatus='brn'; updateStatusBadge('player','brn'); }
    else if (moveName==='THUNDER SHOCK'&&Math.random()<.1){ playerStatus='prz'; updateStatusBadge('player','prz'); }
    else if (moveName==='POISON STING'&&Math.random()<.3){ playerStatus='psn'; updateStatusBadge('player','psn'); }
    else if (moveName==='SING'&&Math.random()<.5)        { playerStatus='slp'; updateStatusBadge('player','slp'); }
    else if (moveName==='BODY SLAM'&&Math.random()<.3)   { playerStatus='prz'; updateStatusBadge('player','prz'); }
  }
  function getBattleMsg() { return battleMsgEl?.textContent||''; }

  // ─── BATTLE: PLAYER TURN ──────────────────────────────────────────
  function useMove(moveName) {
    document.getElementById('battle-menu').style.display='';
    moveMenuEl.classList.add('hidden');
    battleState='anim';

    // Check PP
    if (!movePP[moveName] || movePP[moveName] <= 0) {
      setBattleMsg(`${moveName} has\nno PP left! STRUGGLE!`);
      moveName = 'TACKLE'; // use struggle (tackle substitute)
    } else {
      movePP[moveName]--;
    }

    // Status checks
    if (playerStatus==='prz'&&Math.random()<0.25) {
      setBattleMsg(`${playerPoke.name} is\nparalyzed! Can't move!`);
      setTimeout(()=>doEnemyTurn(),1200);
      return;
    }
    if (playerStatus==='slp') {
      if (Math.random()<0.33) { playerStatus=null; updateStatusBadge('player',null); setBattleMsg(`${playerPoke.name}\nwoke up!`); }
      else { setBattleMsg(`${playerPoke.name} is\nfast asleep!`); }
      setTimeout(()=>doEnemyTurn(),1200);
      return;
    }

    const md = MOVES[moveName];
    // Status moves
    if (md && md.pwr === 0) {
      handleStatusMove(moveName, 'enemy');
      return;
    }

    const result = calcDmg(playerPoke, moveName, enemyPoke);
    const isCrit = Math.random() < 0.0625;
    let dmg = result.dmg;
    if (isCrit) { dmg = Math.floor(dmg*1.5); sfxCritical(); }

    let effMsg='';
    if (result.eff>1.5)        effMsg='\nSuper effective!';
    else if (result.eff<0.8&&result.eff>0) effMsg='\nNot very effective...';
    else if (result.eff===0)   effMsg='\nNo effect!';

    // Accuracy check
    const hitRoll = Math.random() * 100;
    if (hitRoll > (md?.acc||100)) {
      setBattleMsg(`${playerPoke.name} used\n${moveName}!\nBut it missed!`);
      setTimeout(()=>doEnemyTurn(),1300);
      return;
    }

    if (dmg>0) {
      enemyHp=Math.max(0,enemyHp-dmg);
      shakeEl(document.getElementById('enemy-sprite-wrap'));
      floatDmg(dmg, W*.62, H*.25, result.eff>=2?'#ff4444':result.eff>=1?'#ffdd44':'#88aaff');
      if (isCrit) floatMsg('CRITICAL!', W*.55, H*.22, '#ff9900');
      if (result.eff>=2) floatMsg('SUPER!', W*.6, H*.18, '#ff4444');
      result.eff>=2 ? sfxSuperHit() : sfxHit();
      spawnBattleParticles(W*.7,H*.38,TYPE_COLOR[md?.type||'NORMAL']||'#fff', isCrit?28:18);
      updateBattleHpBars();
      setBattleMsg(`${playerPoke.name} used\n${moveName}!${effMsg}`);
      applyStatusToEnemy(moveName);
      // STAB notification
      if (playerPoke.type.includes(md?.type)) floatMsg('STAB!', W*.65, H*.28, '#88ffaa');
    }

    // Leech seed tick (enemy has leech seed)
    if (leechSeedActive) {
      const drain = Math.floor(enemyPoke.maxHp/8);
      enemyHp = Math.max(0, enemyHp - drain);
      playerHp = Math.min(playerPoke.maxHp, playerHp + Math.floor(drain/2));
      updateBattleHpBars();
    }

    // Status damage tick (player)
    if (playerStatus==='psn'||playerStatus==='brn') {
      playerHp=Math.max(1,playerHp-Math.floor(playerPoke.maxHp/8));
      updateBattleHpBars();
    }
    // Status damage tick (enemy)
    if (enemyStatus==='psn'||enemyStatus==='brn') {
      enemyHp=Math.max(0,enemyHp-Math.floor(enemyPoke.maxHp/8));
      updateBattleHpBars();
    }

    setTimeout(()=>{
      if (enemyHp<=0) { enemyFainted(); return; }
      doEnemyTurn();
    }, 1300);
  }

  function handleStatusMove(moveName, target) {
    let msg = `${playerPoke.name} used\n${moveName}!`;
    if (moveName==='LEECH SEED') {
      leechSeedActive = true;
      msg += '\nEnemy planted\nwith LEECH SEED!';
    } else if (moveName==='SING'||moveName==='SLEEP POWDER') {
      if (!enemyStatus&&Math.random()<.6) {
        enemyStatus='slp'; updateStatusBadge('enemy','slp');
        msg += '\nEnemy fell asleep!';
      } else {
        msg += '\nBut it failed!';
      }
    } else if (moveName==='RECOVER'||moveName==='REST') {
      const heal = Math.floor(playerPoke.maxHp/2);
      playerHp = Math.min(playerPoke.maxHp, playerHp+heal);
      if (moveName==='REST') playerStatus='slp';
      msg += `\n${playerPoke.name}\nrestored HP!`;
      sfxHeal();
      updateBattleHpBars();
    } else if (moveName==='GROWL') {
      enemyPoke.atk = Math.max(1, enemyPoke.atk - 1);
      msg += '\nEnemy ATK lowered!';
    } else if (moveName==='TAIL WHIP') {
      enemyPoke.def = Math.max(1, enemyPoke.def - 1);
      msg += '\nEnemy DEF lowered!';
    } else if (moveName==='DEFENSE CURL'||moveName==='HARDEN') {
      playerPoke.def += 2;
      msg += `\n${playerPoke.name}\nDEF raised!`;
    } else {
      msg += '\nBut nothing\nhappened...';
    }
    setBattleMsg(msg);
    setTimeout(()=>{ if(enemyHp<=0){enemyFainted();return;} doEnemyTurn(); }, 1300);
  }

  function enemyFainted() {
    sfxFaint();
    battleStreak++;
    const xpGain=Math.floor((enemyPoke.xpY||60)*(enemyPoke.level/5)*(.7+Math.random()*.6));
    // Streak bonus
    const streakBonus = battleStreak>=5 ? 1.5 : battleStreak>=3 ? 1.25 : 1;
    const finalXp = Math.floor(xpGain * streakBonus);
    playerXp+=finalXp;
    wins++;
    document.getElementById('hud-wins-num').textContent=wins;
    floatXp(finalXp, W*.58, H*.6);
    if (isTrainerBattle && activeNpc) {
      const prize = (activeNpc.level||4) * 50;
      playerMoney += prize;
      npcDefeated[activeNpc.name] = true;
      playerBadges++;
      setBattleMsg(`${activeNpc.name} was\ndefeated!\n+₽${prize}  +1 BADGE!`);
    } else {
      setBattleMsg(`Wild ${enemyPoke.name}\nfainted!${streakBonus>1?' STREAK BONUS!':''}\n+${finalXp} EXP!`);
    }
    // PAY DAY money
    if (playerPoke.moves.includes('PAY DAY')) playerMoney += Math.floor(playerPoke.level * 2);

    // Level up check
    while (playerXp >= playerXpNext && playerPoke.level < 100) {
      playerXp -= playerXpNext;
      playerXpNext = Math.floor(playerXpNext*1.6);
      levelUpPokemon(playerPoke, false);
    }
    updateBattleHpBars();
    battleState='result';
  }

  function levelUpPokemon(poke, silent) {
    if (poke.level >= 100) return;
    const oldLevel = poke.level;
    poke.level++;
    const hpg  = Math.floor(2+Math.random()*4);
    const atkg = Math.floor(Math.random()*2)+1;
    const defg = Math.floor(Math.random()*2);
    const spdg = Math.floor(Math.random()*2);
    poke.maxHp+=hpg; playerHp=Math.min(playerHp+hpg, poke.maxHp);
    poke.atk+=atkg; poke.def+=defg; poke.spd+=spdg;
    sfxLevelUp();
    const banner=document.getElementById('levelup-banner');
    const bannerText=document.getElementById('levelup-text');
    if (banner&&bannerText) {
      bannerText.textContent=`${poke.name} grew to Lv.${poke.level}!`;
      banner.classList.remove('hidden');
      setTimeout(()=>banner.classList.add('hidden'),3200);
    }
    document.getElementById('player-level')?.setAttribute && (document.getElementById('player-level').textContent=`Lv.${poke.level}`);
    updateHUD();

    // Evolution check
    if (poke.evolveAt && poke.level >= poke.evolveAt && poke.evolveTo && POKEMON[poke.evolveTo]) {
      setTimeout(()=>checkEvolution(poke), 2000);
    }
  }

  function checkEvolution(poke) {
    const evoTarget = POKEMON[poke.evolveTo];
    if (!evoTarget) return;
    sfxEvolve();
    const oldName = poke.name;
    // Apply evolution stats
    Object.assign(poke, deepClone(evoTarget));
    poke.level = playerPoke.level;
    // Restore HP proportionally
    const hpRatio = playerHp / playerPoke.maxHp;
    playerPoke.maxHp = poke.maxHp + Math.floor(poke.level * 1.5);
    playerHp = Math.max(1, Math.floor(hpRatio * playerPoke.maxHp));
    initMovePP(playerPoke, movePP);
    showToast(`✨ ${oldName} evolved into ${poke.name}!`);
    updateHUD();
    updateBattleHpBars();
  }

  // ─── BATTLE: ENEMY AI TURN ────────────────────────────────────────
  function doEnemyTurn() {
    if (enemyHp<=0) return;

    // Sleep check
    if (enemyStatus==='slp') {
      setBattleMsg(`${enemyPoke.name} is fast asleep!`);
      if (Math.random()<.33) { enemyStatus=null; updateStatusBadge('enemy',null); }
      battleState='choose'; setTimeout(()=>{setBattleMsg(`What will ${playerPoke.name} do?`);updateBattleOptUI();},1200);
      return;
    }
    // Paralysis check
    if (enemyStatus==='prz'&&Math.random()<.25) {
      setBattleMsg(`${enemyPoke.name} is\nparalyzed! Couldn't move!`);
      battleState='choose'; setTimeout(()=>{setBattleMsg(`What will ${playerPoke.name} do?`);updateBattleOptUI();},1200);
      return;
    }

    // Smart AI: use healing if low hp, otherwise best move
    const atkMoves=enemyPoke.moves.filter(m=>{
      const md=MOVES[m]; 
      return md&&md.pwr>0&&(enemyMovePP[m]??md.pp)>0;
    });
    const statusMoves=enemyPoke.moves.filter(m=>{
      const md=MOVES[m];
      return md&&md.pwr===0&&(enemyMovePP[m]??md.pp)>0;
    });

    let em;
    const hpRatio = enemyHp / enemyPoke.maxHp;
    // Use a status move occasionally
    if (statusMoves.length && Math.random()<0.25 && hpRatio>0.5) {
      em = statusMoves[Math.floor(Math.random()*statusMoves.length)];
    } else {
      em = atkMoves.length ? atkMoves[Math.floor(Math.random()*atkMoves.length)] : enemyPoke.moves[0];
    }

    if (enemyMovePP[em] !== undefined) enemyMovePP[em]--;
    const md = MOVES[em];

    // Handle enemy status moves
    if (!md || md.pwr===0) {
      let msg = `${enemyPoke.name} used\n${em}!`;
      if (em==='GROWL') { playerPoke.atk=Math.max(1,playerPoke.atk-1); msg+='\nYour ATK lowered!'; }
      else if (em==='TAIL WHIP') { playerPoke.def=Math.max(1,playerPoke.def-1); msg+='\nYour DEF lowered!'; }
      else if (em==='SING'&&!playerStatus&&Math.random()<.5) { playerStatus='slp'; updateStatusBadge('player','slp'); msg+='\nYou fell asleep!'; }
      else if (em==='SUPERSONIC'&&!playerStatus&&Math.random()<.5) { setBattleMsg(msg+'\nYou are confused!'); }
      setBattleMsg(msg);
      // Status ticks
      doStatusTicks();
      battleState='choose';
      setTimeout(()=>{setBattleMsg(`What will ${playerPoke.name} do?`);updateBattleOptUI();},1400);
      return;
    }

    const res=calcDmg(enemyPoke, em, playerPoke);
    let eDmg=res.dmg;
    const isCrit = Math.random()<0.05;
    if (isCrit) eDmg = Math.floor(eDmg*1.5);

    // Accuracy check
    if (Math.random()*100 > (md?.acc||100)) {
      setBattleMsg(`${enemyPoke.name} used\n${em}!\nBut it missed!`);
      doStatusTicks();
      battleState='choose';
      setTimeout(()=>{setBattleMsg(`What will ${playerPoke.name} do?`);updateBattleOptUI();},1400);
      return;
    }

    if (eDmg>0) {
      playerHp=Math.max(0,playerHp-eDmg);
      shakeEl(document.getElementById('player-sprite-wrap'));
      floatDmg(eDmg, W*.22, H*.6, res.eff>=2?'#ff4444':'#ff8888');
      if (isCrit) floatMsg('CRITICAL!', W*.18, H*.55, '#ff9900');
      res.eff>=2 ? sfxSuperHit() : sfxHit();
      spawnBattleParticles(W*.28,H*.72,TYPE_COLOR[md?.type||'NORMAL']||'#fff');
      applyStatusToPlayer(em);
    }

    doStatusTicks();
    updateBattleHpBars();
    setBattleMsg(`${enemyPoke.name}\nused ${em}!`);

    if (playerHp<=0) {
      setTimeout(()=>{
        sfxFaint();
        playerHp=Math.max(1, Math.floor(playerPoke.maxHp/4));
        updateBattleHpBars();
        battleStreak = 0; // reset streak on loss
        setBattleMsg(`${playerPoke.name} fainted!\nHealed at Pokémon Center.\n(HP restored to 25%)`)
        battleState='result';
      },1000);
      return;
    }
    setTimeout(()=>{
      battleState='choose';
      setBattleMsg(`What will ${playerPoke.name} do?`);
      updateBattleOptUI();
    },1400);
  }

  function doStatusTicks() {
    // Leech seed
    if (leechSeedActive && enemyHp > 0) {
      const drain = Math.floor(enemyPoke.maxHp/8);
      enemyHp = Math.max(0, enemyHp - drain);
      playerHp = Math.min(playerPoke.maxHp, playerHp + Math.floor(drain/2));
    }
    // Burn/poison damage
    if (playerStatus==='psn'||playerStatus==='brn') playerHp=Math.max(1,playerHp-Math.floor(playerPoke.maxHp/8));
    if (enemyStatus==='psn'||enemyStatus==='brn')   enemyHp=Math.max(0,enemyHp-Math.floor(enemyPoke.maxHp/8));
    updateBattleHpBars();
  }

  function endBattle() {
    document.getElementById('battle-screen').classList.add('hidden');
    battleParts=[];
    gameState='overworld';
    battleState='choose';
    leechSeedActive=false;
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
    if(key==='up'&&selectedMenuOpt>0)                  {selectedMenuOpt--;sfxMenu();}
    if(key==='down'&&selectedMenuOpt<menuItems.length-1){selectedMenuOpt++;sfxMenu();}
    if(key==='b'||key==='start'){sfxCancel();closeMenu();return;}
    menuItems.forEach((el,i)=>el.classList.toggle('selected',i===selectedMenuOpt));
    if (key==='a') {
      sfxConfirm();
      const act=menuItems[selectedMenuOpt].dataset.action;
      closeMenu();
      if(act==='pokemon')  openPokemonPanel();
      else if(act==='bag') showBagDialog();
      else if(act==='map') { minimapVisible=true; document.getElementById('minimap-wrap')?.classList.remove('hidden'); gameState='overworld'; }
      else if(act==='pokedex') openPokedex();
      else if(act==='save')    saveGame();
      else if(act==='options') showOptions();
      else if(act==='quit')    backToTitle();
    }
  }

  function showBagDialog() {
    if (!playerBag.length) {
      showDialog(['Your bag is empty.\nVisit the POKÉ MART\nto buy items!'],()=>{gameState='overworld';},'🎒','BAG');
      return;
    }
    const lines=['YOUR BAG:'].concat(playerBag.map(it=>`${it.emoji} ${it.name} ×${it.qty}`));
    showDialog(lines,()=>{gameState='overworld';},'🎒','BAG');
  }

  function saveGame() {
    const data={
      name:player.name, pokemon:playerPoke.name, level:playerPoke.level,
      pokeData:playerPoke, hp:playerHp, xp:playerXp, xpNext:playerXpNext,
      wins, steps, money:playerMoney, badges:playerBadges, bag:playerBag,
      npcDefeated, dayTime, movePP, battleStreak,
      pokedex: [...playerPokedex]
    };
    try{localStorage.setItem('pokeSaveV2',JSON.stringify(data));}catch(e){}
    showDialog([`GAME SAVED!\n${playerPoke.name} Lv.${playerPoke.level}\n${wins} wins · ₽${playerMoney}`],()=>{gameState='overworld';},'💾','SAVE');
  }

  function tryLoadSave(){
    try{
      const raw=localStorage.getItem('pokeSaveV2');
      if(!raw)return null;
      return JSON.parse(raw);
    }catch(e){return null;}
  }

  function showOptions() {
    showDialog([
      'OPTIONS:\nUse WASD or Arrow Keys\nto move.',
      'Z or Enter = Confirm\nX or Escape = Cancel\nSPACE = Menu',
      'M = Toggle Minimap\n\nVisit the NURSE in the\nPOKÉMON CENTER to\nrestore all moves\' PP!',
    ],()=>{gameState='overworld';},'⚙','OPTIONS');
  }

  function backToTitle() {
    document.getElementById('intro-screen').classList.remove('hidden');
    document.getElementById('game-wrap').classList.add('hidden');
    gameState='intro';
    frameCount=0;
    generateIntroStars(W,H);
    resize();
  }

  // ─── POKÉDEX ──────────────────────────────────────────────────────
  let pokedexEl = null;
  function openPokedex() {
    gameState = 'pokedex';
    // Create pokedex panel if not already
    let panel = document.getElementById('pokedex-panel');
    if (!panel) {
      panel = document.createElement('div');
      panel.id = 'pokedex-panel';
      panel.innerHTML = `
        <div id="pdx-header">
          <button id="pdx-close">✕</button>
          <span>📕 POKÉDEX</span>
          <span id="pdx-count"></span>
        </div>
        <div id="pdx-body"></div>
      `;
      document.getElementById('game-wrap').appendChild(panel);
      document.getElementById('pdx-close').addEventListener('click',()=>{sfxCancel();closePokedex();});
    }
    const count = playerPokedex.size;
    const total = Object.keys(POKEMON).length;
    document.getElementById('pdx-count').textContent = `${count}/${total} seen`;
    const body = document.getElementById('pdx-body');
    body.innerHTML = '';
    Object.entries(POKEMON).forEach(([k,p])=>{
      const seen = playerPokedex.has(k);
      const d = document.createElement('div');
      d.className = 'pdx-entry' + (seen?' pdx-seen':'');
      d.innerHTML = seen
        ? `<span class="pdx-emoji">${p.emoji}</span><span class="pdx-name">${p.name}</span><span class="pdx-types">${p.type.map(t=>`<span class="s-type-badge type-${t}">${t}</span>`).join('')}</span><span class="pdx-desc">${p.desc}</span>`
        : `<span class="pdx-emoji">❓</span><span class="pdx-name">???</span><span class="pdx-types">—</span><span class="pdx-desc">Not yet encountered.</span>`;
      body.appendChild(d);
    });
    panel.classList.remove('hidden');
  }
  function closePokedex() {
    document.getElementById('pokedex-panel')?.classList.add('hidden');
    gameState = 'overworld';
  }

  // ─── POKÉMON DETAIL PANEL ────────────────────────────────────────
  const pokemonPanel=document.getElementById('pokemon-panel');
  document.getElementById('pp-close')?.addEventListener('click',()=>{sfxCancel();closePokemonPanel();});

  function openPokemonPanel() {
    gameState='pokemon-panel';
    const pp=playerPoke;
    const pct=playerHp/pp.maxHp*100;
    const hpCol=pct>50?'var(--hp-g)':pct>25?'var(--hp-y)':'var(--hp-r)';
    document.getElementById('pp-sprite-big').textContent=pp.emoji;
    const tbd=document.getElementById('pp-type-badges');
    if(tbd){tbd.innerHTML='';pp.type.forEach(t=>{const d=document.createElement('span');d.className=`s-type-badge type-${t}`;d.textContent=t;tbd.appendChild(d);});}
    const fl=document.getElementById('pp-flavor');
    if(fl) fl.textContent=pp.desc||'';
    const sg=document.getElementById('pp-stats-grid');
    if(sg){
      const stats=[
        {label:'NAME',  val:pp.name,              bar:false},
        {label:'TYPE',  val:pp.type.join('/'),    bar:false},
        {label:'LEVEL', val:pp.level,              bar:false},
        {label:'HP',    val:`${playerHp}/${pp.maxHp}`, bar:true, pct:pct, col:hpCol},
        {label:'ATK',   val:pp.atk, bar:true, pct:Math.min(100,pp.atk*3), col:'#e84820'},
        {label:'DEF',   val:pp.def, bar:true, pct:Math.min(100,pp.def*3), col:'#4888f8'},
        {label:'SPD',   val:pp.spd, bar:true, pct:Math.min(100,pp.spd*3), col:'#f8d030'},
        {label:'WINS',  val:wins,   bar:false},
        {label:'STREAK',val:battleStreak, bar:false},
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
      // Evolution info
      if (pp.evolveAt && pp.evolveTo) {
        const evDiv = document.createElement('div');
        evDiv.className='stat-label'; evDiv.style.gridColumn='1/-1'; evDiv.style.marginTop='8px';
        evDiv.textContent = `→ Evolves into ${pp.evolveTo} at Lv.${pp.evolveAt}`;
        evDiv.style.color='#f8d030';
        sg.appendChild(evDiv);
      }
    }
    const xpBar=document.getElementById('pp-xp-bar');
    if(xpBar) xpBar.style.width=Math.min(100,playerXp/playerXpNext*100)+'%';
    document.getElementById('pp-xp-label').textContent=`${playerXp}/${playerXpNext}`;
    const ml=document.getElementById('pp-moves-list');
    if(ml){
      ml.innerHTML='';
      pp.moves.forEach(m=>{
        const md=MOVES[m];
        const tc=md?TYPE_COLOR[md.type]||'#888':'#888';
        const pp2=movePP[m]??md?.pp??10;
        const ppMax=md?.pp??10;
        const ppLow=pp2<=Math.floor(ppMax/3);
        const d=document.createElement('div');d.className='pp-move';
        d.innerHTML=`<span class="pp-move-name">${m}</span><span class="pp-move-type s-type-badge" style="background:${tc}22;color:${tc};border-color:${tc}">${md?.type||'—'}</span><span class="pp-move-pwr">PWR ${md?.pwr||'—'}</span><span style="font-size:5px;color:${ppLow?'#ff4444':'#888'}">${pp2}/${ppMax}</span>`;
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
    showToast(`Bought ${shopItem.name}! ₽${playerMoney} remaining`);
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
    if(key==='up'&&selectedShopOpt>0)               {selectedShopOpt--;sfxMenu();updateShopUI();}
    if(key==='down'&&selectedShopOpt<SHOP_ITEMS.length-1){selectedShopOpt++;sfxMenu();updateShopUI();}
    if(key==='a'){sfxConfirm();buyItem();}
    if(key==='b'){sfxCancel();closeShop();}
  }

  // ─── MAIN LOOP ────────────────────────────────────────────────────
  function gameLoop() {
    frameCount++;
    if (gameState==='intro') {
      if(introBgCtx) drawIntroStars(introBgCtx, W, H);
    } else if (['overworld','dialog','menu','pokemon-panel','shop','pokedex'].includes(gameState)) {
      ctx.clearRect(0,0,W,H);
      if(gameState==='overworld') updateMovement();
      updateCamera();
      drawOverworld();
      updateDayNight();
    } else if (gameState==='battle') {
      if(enemySpCtx&&enemySpCanvas) drawPokemonSprite(enemySpCtx, enemyPoke.emoji, enemySpCanvas.width, frameCount, true);
      if(playerSpCtx&&playerSpCanvas) drawPokemonSprite(playerSpCtx, playerPoke.emoji, playerSpCanvas.width, frameCount, false);
      updateBattleParticles();
    }
    requestAnimationFrame(gameLoop);
  }

  // ─── INIT ─────────────────────────────────────────────────────────
  resize();
  generateIntroStars(W, H);
  dayTime = Math.random();

  // Add Pokédex and load menu item to HTML menu
  const menuDiv = document.getElementById('start-menu');
  if (menuDiv) {
    const pdxItem = document.createElement('div');
    pdxItem.className = 'menu-item';
    pdxItem.dataset.action = 'pokedex';
    pdxItem.textContent = '📕 POKÉDEX';
    // Insert before SAVE
    const saveItem = menuDiv.querySelector('[data-action="save"]');
    if (saveItem) menuDiv.insertBefore(pdxItem, saveItem);
  }

  // Load save info
  const sv=tryLoadSave();
  if (sv) {
    const el=document.getElementById('intro-save-info');
    if(el) el.textContent=`Continue: ${sv.name} · ${sv.pokemon} Lv.${sv.level} · ${sv.wins} wins · ₽${sv.money||0}`;
  }

  // Random weather (weighted toward clear)
  const weathers=['clear','clear','clear','clear','clear','rain','snow','fog'];
  initWeather(weathers[Math.floor(Math.random()*weathers.length)]);

  // Space/Enter on intro
  document.addEventListener('keydown', e=>{
    if((e.key==='Enter'||e.key===' ')&&gameState==='intro'){ ensureAudio(); sfxConfirm(); showStarter(); }
  });

  gameLoop();
})();
