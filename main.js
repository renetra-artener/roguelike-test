const CONFIG = {
  "general": {
    "targetFps": 60,
    "winTimeSec": 600,
    "cameraFollowSmoothing": 0.15,
    "pickupRadius": 120,
    "playerIFrameSec": 0.3,
    "contactTickSec": 0.25,
    "seed": null
  },
  "player": {
    "baseMoveSpeed": 220,
    "baseMaxHp": 100,
    "startWeapons": ["PISTOL"],
    "weaponSlots": 3,
    "multiplierSlots": 3,
    "otherItemSlots": 6
  },
  "xp": {
    "orbValue": 1,
    "levelCurve": [10, 20, 35, 55, 80, 110, 150, 200, 260, 330],
    "levelCurveScaleAfter": 1.2
  },
  "damage": {
    "useFloorOnDisplay": true,
    "bigNumberAbbrev": true,
    "sciNotationFrom": 1000000000
  },
  "spawn": {
    "ringRadius": 900,
    "enemiesPerSecStart": 1.0,
    "enemiesPerSecEnd": 5.0,
    "progressToEndSec": 600
  },
  "scaling": {
    "enemyHpAlphaPerSec": 0.004,
    "enemyDpsAlphaPerSec": 0.002
  },
  "chest": {
    "spawnEverySec": 30,
    "maxOnMap": 2,
    "lootWeights": {
      "WEAPON": 0.4,
      "MULTIPLIER": 0.3,
      "OTHER": 0.3
    }
  },
  "pillar": {
    "spawnEverySec": 40,
    "hpBase": 100,
    "hpPerSec": 2
  },
  "ui": {
    "hud": {
      "showTimer": true,
      "showHpBar": true,
      "showXpBar": true,
      "showLevel": true
    },
    "multiplierBanner": true,
    "rightPanel": true,
    "eventLogLineCount": 6
  },
  "weapons": {
    "PISTOL":   {"baseDmg": 2, "cooldown": 0.45, "bulletSpeed": 600, "range": 900, "levelUp": {"dmg": 2, "cooldownMul": 0.9}},
    "SHOTGUN":  {"baseDmg": 1, "pellets": 3, "spreadDeg": 20, "cooldown": 0.8, "bulletSpeed": 520, "range": 650, "levelUp": {"dmg": 1, "cooldownMul": 0.9}},
    "SWORD":    {"baseDmg": 3, "cooldown": 0.5, "arcDeg": 60, "radius": 120, "tickable": false, "levelUp": {"dmg": 3, "cooldownMul": 0.9}},
    "SPEAR":    {"baseDmg": 3, "cooldown": 0.5, "arcDeg": 30, "length": 170, "levelUp": {"dmg": 3, "cooldownMul": 0.9}},
    "BOMB":     {"baseDmg": 5, "cooldown": 1.4, "radius": 120, "frontConeDeg": 45, "levelUp": {"dmg": 5, "cooldownMul": 0.9}},
    "SATELLITE":{"baseDmg": 1, "orbitR": 110, "orbs": 1, "rotSpeedDegPerSec": 120, "levelUp": {"dmg": 1, "rotSpeedMul": 1.1, "extraOrbAtLevels": [3, 6]}}
  },
  "multipliers": {
    "STOP":   {"start": 1.1, "perSecAdd": 0.1,   "perLevelAccel": 0.05},
    "KILL":   {"start": 1.1, "perKillAdd": 0.001,"perLevelAccel": 0.03},
    "CHEST":  {"start": 2.0, "perOpenAdd": 1.0,  "perLevelAccel": 0.2},
    "PILLAR": {"start": 2.0, "perBreakAdd": 0.5, "perLevelAccel": 0.1}
  },
  "otherItems": {
    "AUTO_HEAL":        {"threshold": 0.3, "healRatio": 0.5, "cooldownSec": 60},
    "MAXHP_UP":         {"ratio": 0.2},
    "MOVESPD_UP":       {"ratio": 0.1},
    "ALL_MULT_LVUP":    {"levels": 1},
    "WEAPON_LEVEL_DMG": {"ratio": 0.2},
    "RICOCHET":         {"bounces": 1, "bulletSpeedPenalty": 0.1},
    "ALL_WEAPON_LVUP":  {"levels": 1},
    "PICKUP_UP":        {"ratio": 0.5},
    "REGEN":            {"perSec": 0.2},
    "AREA_UP":          {"ratio": 0.1}
  },
  "enemyArchetypes": {
    "ZOMBIE":  {"hp": 8,   "moveSpeed": 120, "contactDmg": 4},
    "RUNNER":  {"hp": 6,   "moveSpeed": 180, "contactDmg": 3},
    "SHOOTER": {"hp": 10,  "moveSpeed": 100, "contactDmg": 2, "shootCd": 1.5, "bulletDmg": 6, "bulletSpeed": 380},
    "TANK":    {"hp": 28,  "moveSpeed": 80,  "contactDmg": 8, "knockbackResist": 0.5},
    "SWARM":   {"hp": 3,   "moveSpeed": 160, "contactDmg": 2},
    "MINIBOSS":{"hp": 160, "moveSpeed": 110, "contactDmg": 10, "shootCd": 1.2, "bulletDmg": 10},
    "BOSS":    {"hp": 500, "moveSpeed": 120, "contactDmg": 12, "shootCd": 1.0, "bulletDmg": 14}
  },
  "caps": {
    "maxEnemies": 300,
    "maxPlayerBullets": 120
  }
};

const TWO_PI = Math.PI * 2;

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function formatNumber(n) {
  const cfg = CONFIG.damage;
  if (!isFinite(n)) return '∞';
  if (cfg.useFloorOnDisplay) {
    n = Math.floor(n);
  }
  const abs = Math.abs(n);
  if (abs >= cfg.sciNotationFrom) {
    const exp = Math.floor(Math.log10(abs));
    const mant = (abs / Math.pow(10, exp)).toFixed(2);
    return `${n < 0 ? '-' : ''}${mant}e${exp}`;
  }
  if (!cfg.bigNumberAbbrev || abs < 1000) {
    return n.toLocaleString();
  }
  const units = ['K', 'M', 'B', 'T'];
  let unitIndex = -1;
  let value = abs;
  while (value >= 1000 && unitIndex < units.length - 1) {
    value /= 1000;
    unitIndex++;
  }
  return `${n < 0 ? '-' : ''}${value.toFixed(2)}${units[unitIndex]}`;
}

class RNG {
  constructor(seed = Date.now()) {
    this.m = 0x80000000;
    this.a = 1103515245;
    this.c = 12345;
    this.state = seed % this.m;
  }
  nextInt() {
    this.state = (this.a * this.state + this.c) % this.m;
    return this.state;
  }
  next() {
    return this.nextInt() / (this.m - 1);
  }
  range(min, max) {
    return min + (max - min) * this.next();
  }
  pick(array) {
    return array[Math.floor(this.next() * array.length)];
  }
  weightedPick(entries) {
    const total = entries.reduce((sum, e) => sum + e.weight, 0);
    let r = this.next() * total;
    for (const entry of entries) {
      if (r < entry.weight) return entry.value;
      r -= entry.weight;
    }
    return entries[entries.length - 1].value;
  }
}

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const levelUpOverlay = document.getElementById('levelUpOverlay');
const levelUpOptions = document.getElementById('levelUpOptions');
const skipLevelUpBtn = document.getElementById('skipLevelUp');
const messageOverlay = document.getElementById('messageOverlay');

const INPUT = {
  up: false,
  down: false,
  left: false,
  right: false
};

window.addEventListener('keydown', (e) => {
  if (e.code === 'ArrowUp' || e.code === 'KeyW') INPUT.up = true;
  if (e.code === 'ArrowDown' || e.code === 'KeyS') INPUT.down = true;
  if (e.code === 'ArrowLeft' || e.code === 'KeyA') INPUT.left = true;
  if (e.code === 'ArrowRight' || e.code === 'KeyD') INPUT.right = true;
});
window.addEventListener('keyup', (e) => {
  if (e.code === 'ArrowUp' || e.code === 'KeyW') INPUT.up = false;
  if (e.code === 'ArrowDown' || e.code === 'KeyS') INPUT.down = false;
  if (e.code === 'ArrowLeft' || e.code === 'KeyA') INPUT.left = false;
  if (e.code === 'ArrowRight' || e.code === 'KeyD') INPUT.right = false;
});

const state = {
  rng: new RNG(CONFIG.general.seed || Date.now()),
  time: 0,
  dt: 0,
  lastFrame: performance.now(),
  running: true,
  paused: false,
  player: null,
  enemies: [],
  enemyBullets: [],
  playerBullets: [],
  xpOrbs: [],
  chests: [],
  pillars: [],
  events: [],
  camera: { x: 0, y: 0 },
  spawnTimer: 0,
  chestTimer: 0,
  pillarTimer: 0,
  nextMiniBossTimes: [300, 480],
  bossSpawned: false,
  victory: false,
  defeat: false,
  levelUpChoices: [],
  awaitingLevelChoice: false,
  rerolls: 2,
  pendingChestGuarantee: false
};

function initGame(cfg) {
  state.rng = new RNG(cfg.general.seed || Date.now());
  state.time = 0;
  state.dt = 0;
  state.lastFrame = performance.now();
  state.running = true;
  state.paused = false;
  state.enemies.length = 0;
  state.enemyBullets.length = 0;
  state.playerBullets.length = 0;
  state.xpOrbs.length = 0;
  state.chests.length = 0;
  state.pillars.length = 0;
  state.events.length = 0;
  state.camera.x = 0;
  state.camera.y = 0;
  state.spawnTimer = 0;
  state.chestTimer = 0;
  state.pillarTimer = 0;
  state.nextMiniBossTimes = [300, 480];
  state.bossSpawned = false;
  state.victory = false;
  state.defeat = false;
  state.levelUpChoices = [];
  state.awaitingLevelChoice = false;
  state.rerolls = 2;
  state.pendingChestGuarantee = false;

  const player = {
    pos: { x: 0, y: 0 },
    hp: cfg.player.baseMaxHp,
    maxHp: cfg.player.baseMaxHp,
    level: 1,
    xp: 0,
    nextXp: cfg.xp.levelCurve[0],
    moveSpeed: cfg.player.baseMoveSpeed,
    weapons: [],
    multipliers: [],
    others: new Set(),
    iframeSec: 0,
    pickupRadius: cfg.general.pickupRadius,
    areaMul: 1,
    baseDamageBonusRatio: 0,
    regenTimer: 0,
    regenPerSec: 0,
    autoHealCd: 0,
    stopChainTimer: 0,
    stopAccum: 0,
    lastPos: { x: 0, y: 0 },
    totalMultiplier: 1
  };

  for (const weaponId of cfg.player.startWeapons) {
    player.weapons.push(createWeaponState(weaponId));
  }

  state.player = player;

  hideLevelUp();
  hideMessage();
}

function startRun() {
  function loop(now) {
    if (!state.running) return;
    state.dt = (now - state.lastFrame) / 1000;
    if (state.dt > 0.1) state.dt = 0.1;
    state.lastFrame = now;
    if (!state.paused) {
      update(state.dt);
      render();
    }
    requestAnimationFrame(loop);
  }
  requestAnimationFrame((now) => {
    state.lastFrame = now;
    requestAnimationFrame(loop);
  });
}

function createWeaponState(kind) {
  const data = CONFIG.weapons[kind];
  return {
    kind,
    level: 1,
    cooldownLeft: 0,
    internal: {
      orbitAngle: 0,
      orbs: data.orbs || 0
    }
  };
}

function getWeaponData(state) {
  return CONFIG.weapons[state.kind];
}

function update(dt) {
  if (state.awaitingLevelChoice || state.defeat || state.victory) return;
  state.time += dt;

  const cfg = CONFIG;
  const player = state.player;

  // Update timers
  if (player.iframeSec > 0) player.iframeSec = Math.max(0, player.iframeSec - dt);
  if (player.autoHealCd > 0) player.autoHealCd = Math.max(0, player.autoHealCd - dt);

  // Regen
  if (player.regenPerSec > 0) {
    player.regenTimer += dt;
    if (player.regenTimer >= 1) {
      const ticks = Math.floor(player.regenTimer);
      player.regenTimer -= ticks;
      player.hp = Math.min(player.maxHp, player.hp + player.regenPerSec * ticks);
    }
  }

  const move = { x: 0, y: 0 };
  if (INPUT.up) move.y -= 1;
  if (INPUT.down) move.y += 1;
  if (INPUT.left) move.x -= 1;
  if (INPUT.right) move.x += 1;
  let moving = false;
  if (move.x !== 0 || move.y !== 0) {
    const len = Math.hypot(move.x, move.y);
    move.x /= len;
    move.y /= len;
    player.pos.x += move.x * player.moveSpeed * dt;
    player.pos.y += move.y * player.moveSpeed * dt;
    moving = true;
  }

  const distMoved = Math.hypot(player.pos.x - player.lastPos.x, player.pos.y - player.lastPos.y);
  if (distMoved > 0.5) moving = true;
  player.lastPos.x = player.pos.x;
  player.lastPos.y = player.pos.y;

  updateMultipliers(dt, moving);

  state.camera.x = lerp(state.camera.x, player.pos.x, CONFIG.general.cameraFollowSmoothing);
  state.camera.y = lerp(state.camera.y, player.pos.y, CONFIG.general.cameraFollowSmoothing);

  spawnEnemies(dt);
  spawnChests(dt);
  spawnPillars(dt);

  updateEnemies(dt);
  updateEnemyBullets(dt);
  updateWeapons(dt);
  updatePlayerBullets(dt);
  handleCollisions();
  updateXpOrbs(dt);
  updatePillars(dt);

  updateTimersAndEvents(dt);
  checkWinLoseConditions();
}

function updateTimersAndEvents(dt) {
  for (const evt of state.events) {
    evt.ttl -= dt;
  }
  state.events = state.events.filter((evt) => evt.ttl > 0);
}

function updatePillars(dt) {
  // Damage over time is applied by bullets / melee
  // Nothing special here for now
}

function spawnEnemies(dt) {
  const cfg = CONFIG.spawn;
  state.spawnTimer += dt;
  const rate = lerp(cfg.enemiesPerSecStart, cfg.enemiesPerSecEnd, clamp(state.time / cfg.progressToEndSec, 0, 1));
  const interval = 1 / Math.max(rate, 0.01);
  while (state.spawnTimer >= interval) {
    state.spawnTimer -= interval;
    if (state.enemies.length >= CONFIG.caps.maxEnemies) break;
    const kind = pickEnemyType();
    const enemy = createEnemy(kind);
    state.enemies.push(enemy);
  }
  // Mini bosses
  if (state.nextMiniBossTimes.length && state.time >= state.nextMiniBossTimes[0]) {
    state.nextMiniBossTimes.shift();
    const enemy = createEnemy('MINIBOSS');
    enemy.hp *= 1 + CONFIG.scaling.enemyHpAlphaPerSec * state.time;
    enemy.baseHp = enemy.hp;
    enemy.contactDmg *= 1 + CONFIG.scaling.enemyDpsAlphaPerSec * state.time;
    enemy.pos = randomPointOnRing(CONFIG.spawn.ringRadius);
    state.enemies.push(enemy);
  }
  // Boss
  if (!state.bossSpawned && state.time >= CONFIG.general.winTimeSec) {
    state.bossSpawned = true;
    const boss = createEnemy('BOSS');
    boss.hp *= 1 + CONFIG.scaling.enemyHpAlphaPerSec * state.time;
    boss.baseHp = boss.hp;
    boss.contactDmg *= 1 + CONFIG.scaling.enemyDpsAlphaPerSec * state.time;
    boss.pos = randomPointOnRing(CONFIG.spawn.ringRadius);
    state.enemies.push(boss);
  }
}

function pickEnemyType() {
  const types = ['ZOMBIE', 'RUNNER', 'SHOOTER', 'TANK', 'SWARM'];
  const weights = [3, 2, 1, 1, 2];
  const entries = types.map((t, i) => ({ value: t, weight: weights[i] }));
  return state.rng.weightedPick(entries);
}

function randomPointOnRing(radius) {
  const angle = state.rng.range(0, TWO_PI);
  return {
    x: state.player.pos.x + Math.cos(angle) * radius,
    y: state.player.pos.y + Math.sin(angle) * radius
  };
}

function createEnemy(kind) {
  const base = CONFIG.enemyArchetypes[kind];
  const enemy = {
    kind,
    pos: randomPointOnRing(CONFIG.spawn.ringRadius),
    hp: base.hp,
    baseHp: base.hp,
    moveSpeed: base.moveSpeed,
    contactDmg: base.contactDmg,
    shootCd: base.shootCd || 0,
    shootTimer: base.shootCd || 0,
    bulletDmg: base.bulletDmg || 0,
    bulletSpeed: base.bulletSpeed || 320,
    knockbackResist: base.knockbackResist || 0
  };
  const t = state.time;
  const hpScale = 1 + CONFIG.scaling.enemyHpAlphaPerSec * t;
  const dmgScale = 1 + CONFIG.scaling.enemyDpsAlphaPerSec * t;
  enemy.hp *= hpScale;
  enemy.baseHp = enemy.hp;
  enemy.contactDmg *= dmgScale;
  if (enemy.bulletDmg) enemy.bulletDmg *= dmgScale;
  return enemy;
}

function updateEnemies(dt) {
  const player = state.player;
  for (const enemy of state.enemies) {
    const dx = player.pos.x - enemy.pos.x;
    const dy = player.pos.y - enemy.pos.y;
    const dist = Math.hypot(dx, dy);
    if (dist > 0.001) {
      enemy.pos.x += (dx / dist) * enemy.moveSpeed * dt;
      enemy.pos.y += (dy / dist) * enemy.moveSpeed * dt;
    }
    if (enemy.shootCd) {
      enemy.shootTimer -= dt;
      if (enemy.shootTimer <= 0) {
        enemy.shootTimer = enemy.shootCd;
        shootEnemyBullet(enemy);
      }
    }
  }
}

function shootEnemyBullet(enemy) {
  const player = state.player;
  const dx = player.pos.x - enemy.pos.x;
  const dy = player.pos.y - enemy.pos.y;
  const dist = Math.hypot(dx, dy) || 1;
  const speed = enemy.bulletSpeed || 320;
  state.enemyBullets.push({
    pos: { x: enemy.pos.x, y: enemy.pos.y },
    vel: { x: (dx / dist) * speed, y: (dy / dist) * speed },
    dmg: enemy.bulletDmg || 5,
    life: 3
  });
}

function updateEnemyBullets(dt) {
  const player = state.player;
  const contactTick = CONFIG.general.contactTickSec;
  for (const bullet of state.enemyBullets) {
    bullet.life -= dt;
    bullet.pos.x += bullet.vel.x * dt;
    bullet.pos.y += bullet.vel.y * dt;
    const dx = player.pos.x - bullet.pos.x;
    const dy = player.pos.y - bullet.pos.y;
    if (Math.hypot(dx, dy) < 12) {
      applyPlayerDamage(bullet.dmg);
      bullet.life = 0;
    }
  }
  state.enemyBullets = state.enemyBullets.filter((b) => b.life > 0);
}

function applyPlayerDamage(amount) {
  const player = state.player;
  if (player.iframeSec > 0) return;
  player.hp -= amount;
  player.iframeSec = CONFIG.general.playerIFrameSec;
  addEventLog(`Hit -${formatNumber(amount)} HP`);
  if (player.hp <= 0) {
    player.hp = 0;
    state.defeat = true;
    showMessage('Defeat');
  }
}

function updateWeapons(dt) {
  const player = state.player;
  if (!player) return;
  const target = findNearestEnemy(player.pos, 1200);
  for (const weapon of player.weapons) {
    weapon.cooldownLeft -= dt;
    const data = getWeaponData(weapon);
    if (weapon.kind === 'SATELLITE') {
      const speed = data.rotSpeedDegPerSec * (data.levelUp?.rotSpeedMul ? Math.pow(data.levelUp.rotSpeedMul, weapon.level - 1) : 1);
      weapon.internal.orbitAngle += (speed * dt * Math.PI) / 180;
    }
    if (weapon.cooldownLeft <= 0) {
      if (state.playerBullets.length >= CONFIG.caps.maxPlayerBullets) {
        weapon.cooldownLeft = 0.05;
        continue;
      }
      fireWeapon(weapon, data, target);
    }
  }
}

function findNearestEnemy(pos, maxDist = Infinity) {
  let closest = null;
  let closestDist = maxDist;
  for (const enemy of state.enemies) {
    const d = Math.hypot(enemy.pos.x - pos.x, enemy.pos.y - pos.y);
    if (d < closestDist) {
      closest = enemy;
      closestDist = d;
    }
  }
  return closest;
}

function computeDamage(weaponState) {
  const player = state.player;
  const weaponData = getWeaponData(weaponState);
  const base = weaponData.baseDmg;
  let levelBonus = (weaponState.level - 1) * (weaponData.levelUp?.dmg || 0);
  if (player.others.has('WEAPON_LEVEL_DMG')) {
    const ratio = CONFIG.otherItems.WEAPON_LEVEL_DMG.ratio;
    levelBonus *= 1 + ratio;
  }
  const weaponDamage = base + levelBonus;
  const playerLevelBase = player.level * (1 + player.baseDamageBonusRatio);
  let multiplierProduct = 1;
  for (let i = 0; i < CONFIG.player.multiplierSlots; i++) {
    const mult = player.multipliers[i];
    if (mult) multiplierProduct *= mult.value;
  }
  player.totalMultiplier = multiplierProduct;
  const dmg = (weaponDamage + playerLevelBase) * multiplierProduct;
  return Math.floor(dmg);
}

function fireWeapon(weaponState, data, target) {
  const player = state.player;
  const dmg = computeDamage(weaponState);
  const pos = { x: player.pos.x, y: player.pos.y };
  const cooldownBase = data.cooldown * Math.pow(data.levelUp?.cooldownMul || 1, weaponState.level - 1);
  weaponState.cooldownLeft = cooldownBase;
  switch (weaponState.kind) {
    case 'PISTOL':
      fireBulletTowards(pos, target, dmg, data.bulletSpeed, data.range, weaponState);
      break;
    case 'SHOTGUN':
      const pellets = data.pellets || 3;
      for (let i = 0; i < pellets; i++) {
        const spread = ((i - (pellets - 1) / 2) / pellets) * data.spreadDeg;
        fireBulletTowards(pos, target, dmg, data.bulletSpeed, data.range, weaponState, spread);
      }
      break;
    case 'SWORD':
      swingArc(pos, dmg, data.radius * player.areaMul, data.arcDeg, target);
      break;
    case 'SPEAR':
      thrustCone(pos, dmg, data.length * player.areaMul, data.arcDeg, target);
      break;
    case 'BOMB':
      launchBomb(pos, dmg, data.radius * player.areaMul, data.frontConeDeg, target);
      break;
    case 'SATELLITE':
      orbitStrike(weaponState, dmg, data);
      weaponState.cooldownLeft = 0.1;
      break;
  }
}

function fireBulletTowards(origin, target, dmg, speed, range, weaponState, spreadDeg = 0) {
  const player = state.player;
  if (!target) target = { pos: { x: origin.x + 1, y: origin.y } };
  const dx = target.pos.x - origin.x;
  const dy = target.pos.y - origin.y;
  let angle = Math.atan2(dy, dx);
  angle += (spreadDeg * Math.PI) / 180;
  const vx = Math.cos(angle) * speed;
  const vy = Math.sin(angle) * speed;
  const ricochets = player.others.has('RICOCHET') ? CONFIG.otherItems.RICOCHET.bounces : 0;
  const speedPenalty = player.others.has('RICOCHET') ? CONFIG.otherItems.RICOCHET.bulletSpeedPenalty : 0;
  const adjustedSpeed = speed * (1 - speedPenalty);
  state.playerBullets.push({
    pos: { x: origin.x, y: origin.y },
    vel: { x: Math.cos(angle) * adjustedSpeed, y: Math.sin(angle) * adjustedSpeed },
    dmg,
    range,
    traveled: 0,
    radius: 6,
    ricochets,
    pierce: 0,
    kind: weaponState.kind
  });
}

function swingArc(origin, dmg, radius, arcDeg, target) {
  const facing = target ? Math.atan2(target.pos.y - origin.y, target.pos.x - origin.x) : 0;
  const enemies = state.enemies;
  for (const enemy of enemies) {
    const dx = enemy.pos.x - origin.x;
    const dy = enemy.pos.y - origin.y;
    const dist = Math.hypot(dx, dy);
    if (dist > radius) continue;
    const angleToEnemy = Math.atan2(dy, dx);
    const angleDiff = Math.abs(((angleToEnemy - facing + Math.PI) % TWO_PI) - Math.PI);
    if (angleDiff <= (arcDeg * Math.PI) / 360) {
      dealDamageToEnemy(enemy, dmg);
    }
  }
}

function thrustCone(origin, dmg, length, arcDeg, target) {
  const facing = target ? Math.atan2(target.pos.y - origin.y, target.pos.x - origin.x) : 0;
  const enemies = state.enemies;
  for (const enemy of enemies) {
    const dx = enemy.pos.x - origin.x;
    const dy = enemy.pos.y - origin.y;
    const dist = Math.hypot(dx, dy);
    if (dist > length) continue;
    const angle = Math.atan2(dy, dx);
    const diff = Math.abs(((angle - facing + Math.PI) % TWO_PI) - Math.PI);
    if (diff <= (arcDeg * Math.PI) / 360) {
      dealDamageToEnemy(enemy, dmg);
    }
  }
}

function launchBomb(origin, dmg, radius, coneDeg, target) {
  if (!target) target = findNearestEnemy(origin, 500) || { pos: { x: origin.x + 1, y: origin.y } };
  const dx = target.pos.x - origin.x;
  const dy = target.pos.y - origin.y;
  const dist = Math.hypot(dx, dy);
  const angle = Math.atan2(dy, dx);
  state.playerBullets.push({
    pos: { x: origin.x, y: origin.y },
    vel: { x: Math.cos(angle) * 280, y: Math.sin(angle) * 280 },
    dmg,
    range: dist + 50,
    traveled: 0,
    radius,
    explode: true,
    coneDeg
  });
}

function orbitStrike(weaponState, dmg, data) {
  const player = state.player;
  const orbitCount = data.orbs + (weaponState.internal.extraOrbs || 0);
  const angleStep = TWO_PI / Math.max(orbitCount, 1);
  const radius = data.orbitR * player.areaMul;
  for (let i = 0; i < orbitCount; i++) {
    const angle = weaponState.internal.orbitAngle + angleStep * i;
    const x = player.pos.x + Math.cos(angle) * radius;
    const y = player.pos.y + Math.sin(angle) * radius;
    const area = { x, y };
    for (const enemy of state.enemies) {
      const dist = Math.hypot(enemy.pos.x - x, enemy.pos.y - y);
      if (dist <= 24) {
        dealDamageToEnemy(enemy, dmg);
      }
    }
  }
}

function updatePlayerBullets(dt) {
  const player = state.player;
  for (const bullet of state.playerBullets) {
    if (bullet.explode) {
      bullet.traveled += Math.hypot(bullet.vel.x * dt, bullet.vel.y * dt);
      bullet.pos.x += bullet.vel.x * dt;
      bullet.pos.y += bullet.vel.y * dt;
      if (bullet.traveled >= bullet.range) {
        explodeBullet(bullet);
        bullet.range = -1;
      }
      continue;
    }
    bullet.pos.x += bullet.vel.x * dt;
    bullet.pos.y += bullet.vel.y * dt;
    const step = Math.hypot(bullet.vel.x * dt, bullet.vel.y * dt);
    bullet.traveled += step;
    if (bullet.traveled >= bullet.range) {
      bullet.range = -1;
    }
  }
  state.playerBullets = state.playerBullets.filter((b) => b.range > 0);
}

function explodeBullet(bullet) {
  for (const enemy of state.enemies) {
    const dist = Math.hypot(enemy.pos.x - bullet.pos.x, enemy.pos.y - bullet.pos.y);
    if (dist <= bullet.radius) {
      dealDamageToEnemy(enemy, bullet.dmg);
    }
  }
}

function handleCollisions() {
  const player = state.player;
  const contactTick = CONFIG.general.contactTickSec;
  const contactRadius = 20;
  for (const enemy of state.enemies) {
    const dx = enemy.pos.x - player.pos.x;
    const dy = enemy.pos.y - player.pos.y;
    const dist = Math.hypot(dx, dy);
    if (dist < contactRadius) {
      if (!enemy.contactTimer) enemy.contactTimer = 0;
      enemy.contactTimer -= state.dt;
      if (enemy.contactTimer <= 0) {
        enemy.contactTimer = contactTick;
        applyPlayerDamage(enemy.contactDmg);
      }
    }
  }
  for (const bullet of state.playerBullets) {
    if (bullet.explode) continue;
    for (const enemy of state.enemies) {
      const dist = Math.hypot(enemy.pos.x - bullet.pos.x, enemy.pos.y - bullet.pos.y);
      if (dist <= bullet.radius) {
        dealDamageToEnemy(enemy, bullet.dmg);
        if (bullet.ricochets > 0) {
          bullet.ricochets--;
          bullet.pos.x += bullet.vel.x * 0.01;
          bullet.pos.y += bullet.vel.y * 0.01;
          continue;
        } else {
          bullet.range = -1;
          break;
        }
      }
    }
  }
  // XP pickup
  for (const orb of state.xpOrbs) {
    const dist = Math.hypot(orb.pos.x - player.pos.x, orb.pos.y - player.pos.y);
    if (dist <= 16) {
      player.xp += orb.value;
      orb.value = 0;
    }
  }
  state.xpOrbs = state.xpOrbs.filter((orb) => orb.value > 0);

  // Chest open
  for (const chest of state.chests) {
    const dist = Math.hypot(chest.pos.x - player.pos.x, chest.pos.y - player.pos.y);
    if (dist <= 40) {
      openChest(chest);
      chest.opened = true;
    }
  }
  state.chests = state.chests.filter((c) => !c.opened);

  // Pillar damage by proximity
  for (const pillar of state.pillars) {
    const dist = Math.hypot(pillar.pos.x - player.pos.x, pillar.pos.y - player.pos.y);
    if (dist <= 50) {
      // Player damages pillar slowly
      pillar.hp -= state.dt * 10;
      if (pillar.hp <= 0) {
        pillar.dead = true;
        breakPillar();
      }
    }
  }
  state.pillars = state.pillars.filter((p) => !p.dead);

  // Level up check
  if (player.xp >= player.nextXp) {
    player.level++;
    player.xp -= player.nextXp;
    player.nextXp = computeNextXp(player.level);
    triggerLevelUp();
  }
}

function dealDamageToEnemy(enemy, amount) {
  enemy.hp -= amount;
  if (enemy.hp <= 0) {
    onEnemyKilled(enemy);
    enemy.dead = true;
  }
}

function onEnemyKilled(enemy) {
  const orbValue = CONFIG.xp.orbValue;
  state.xpOrbs.push({ pos: { x: enemy.pos.x, y: enemy.pos.y }, value: orbValue, speed: 0 });
  applyMultiplierEvent('KILL');
  if (enemy.kind === 'MINIBOSS' || enemy.kind === 'BOSS' || state.pendingChestGuarantee) {
    state.pendingChestGuarantee = false;
    state.chests.push({ pos: { x: enemy.pos.x, y: enemy.pos.y }, guaranteed: true });
  }
  if (enemy.kind === 'BOSS') {
    state.victory = true;
    showMessage('Victory!');
  }
}

function computeNextXp(level) {
  const curve = CONFIG.xp.levelCurve;
  if (level - 1 < curve.length) return curve[level - 1];
  const last = curve[curve.length - 1];
  const extraLevels = level - curve.length;
  return Math.ceil(last * Math.pow(CONFIG.xp.levelCurveScaleAfter, extraLevels));
}

function triggerLevelUp() {
  state.paused = true;
  state.awaitingLevelChoice = true;
  state.levelUpChoices = levelUpRoll();
  showLevelUp(state.levelUpChoices);
}

function updateXpOrbs(dt) {
  const player = state.player;
  const pickupRadius = player.pickupRadius;
  for (const orb of state.xpOrbs) {
    const dx = player.pos.x - orb.pos.x;
    const dy = player.pos.y - orb.pos.y;
    const dist = Math.hypot(dx, dy);
    if (dist <= pickupRadius && dist > 0.0001) {
      const speed = clamp(600 / Math.max(dist, 20), 60, 600);
      orb.pos.x += (dx / dist) * speed * dt;
      orb.pos.y += (dy / dist) * speed * dt;
    }
  }
}

function spawnChests(dt) {
  state.chestTimer += dt;
  if (state.chests.length >= CONFIG.chest.maxOnMap) return;
  if (state.chestTimer >= CONFIG.chest.spawnEverySec) {
    state.chestTimer = 0;
    const pos = randomPointOnRing(CONFIG.spawn.ringRadius * 0.7);
    state.chests.push({ pos });
  }
}

function spawnPillars(dt) {
  state.pillarTimer += dt;
  if (state.pillarTimer >= CONFIG.pillar.spawnEverySec) {
    state.pillarTimer = 0;
    const pos = randomPointOnRing(CONFIG.spawn.ringRadius * 0.5);
    const hp = CONFIG.pillar.hpBase + CONFIG.pillar.hpPerSec * state.time;
    state.pillars.push({ pos, hp });
  }
}

function levelUpRoll() {
  const player = state.player;
  const choices = [];
  const allOptions = [];
  const weaponKinds = Object.keys(CONFIG.weapons);
  const multiplierKinds = Object.keys(CONFIG.multipliers);
  const otherKinds = Object.keys(CONFIG.otherItems);

  // Weapon options
  for (const kind of weaponKinds) {
    const existing = player.weapons.find((w) => w.kind === kind);
    if (!existing && player.weapons.length >= CONFIG.player.weaponSlots) continue;
    allOptions.push({ type: 'WEAPON', id: kind });
  }
  // Multiplier options
  for (const kind of multiplierKinds) {
    const existing = player.multipliers.find((m) => m.kind === kind);
    if (!existing && player.multipliers.length >= CONFIG.player.multiplierSlots) continue;
    allOptions.push({ type: 'MULTIPLIER', id: kind });
  }
  // Other items
  for (const kind of otherKinds) {
    const existing = player.others.has(kind);
    if (!existing && player.others.size >= CONFIG.player.otherItemSlots) continue;
    allOptions.push({ type: 'OTHER', id: kind });
  }

  const attempts = 10;
  while (choices.length < 3 && allOptions.length > 0) {
    const index = Math.floor(state.rng.next() * allOptions.length);
    const candidate = allOptions.splice(index, 1)[0];
    choices.push(candidate);
  }
  while (choices.length < 3) {
    choices.push({ type: 'OTHER', id: 'REGEN' });
  }
  return choices;
}

function showLevelUp(options) {
  levelUpOptions.innerHTML = '';
  options.forEach((choice, index) => {
    const btn = document.createElement('button');
    btn.textContent = describeChoice(choice);
    btn.addEventListener('click', () => {
      applyChoice(choice);
      hideLevelUp();
    });
    levelUpOptions.appendChild(btn);
  });
  skipLevelUpBtn.onclick = () => {
    hideLevelUp();
  };
  levelUpOverlay.style.display = 'flex';
}

function describeChoice(choice) {
  switch (choice.type) {
    case 'WEAPON':
      return `Weapon: ${choice.id}`;
    case 'MULTIPLIER':
      return `Multiplier: ${choice.id}`;
    case 'OTHER':
      return `Item: ${choice.id}`;
    default:
      return choice.id;
  }
}

function hideLevelUp() {
  levelUpOverlay.style.display = 'none';
  state.paused = false;
  state.awaitingLevelChoice = false;
}

function applyChoice(choice) {
  switch (choice.type) {
    case 'WEAPON':
      addWeapon(choice.id);
      break;
    case 'MULTIPLIER':
      addMultiplier(choice.id);
      break;
    case 'OTHER':
      addOtherItem(choice.id);
      break;
  }
}

function addWeapon(kind) {
  const player = state.player;
  const existing = player.weapons.find((w) => w.kind === kind);
  if (!existing && player.weapons.length >= CONFIG.player.weaponSlots) {
    addEventLog('Weapon slots full');
    return;
  }
  if (existing) {
    existing.level++;
    const data = CONFIG.weapons[kind];
    if (kind === 'SATELLITE') {
      const extraLevels = data.levelUp?.extraOrbAtLevels || [];
      if (extraLevels.includes(existing.level)) {
        existing.internal.extraOrbs = (existing.internal.extraOrbs || 0) + 1;
      }
    }
  } else {
    player.weapons.push(createWeaponState(kind));
  }
  addEventLog(`Weapon ${kind} Lv${existing ? existing.level : 1}`);
}

function addMultiplier(kind) {
  const data = CONFIG.multipliers[kind];
  const player = state.player;
  const existing = player.multipliers.find((m) => m.kind === kind);
  if (!existing && player.multipliers.length >= CONFIG.player.multiplierSlots) {
    addEventLog('Multiplier slots full');
    return;
  }
  if (existing) {
    existing.level++;
  } else {
    player.multipliers.push({ kind, level: 1, value: data.start, chainSec: 0, accum: 0 });
  }
  addEventLog(`${kind} multiplier ready`);
}

function addOtherItem(kind) {
  const player = state.player;
  if (player.others.has(kind)) {
    addEventLog(`${kind} already owned`);
    return;
  }
  if (player.others.size >= CONFIG.player.otherItemSlots) {
    addEventLog('Item slots full');
    return;
  }
  player.others.add(kind);
  const data = CONFIG.otherItems[kind];
  switch (kind) {
    case 'MAXHP_UP':
      player.maxHp += player.maxHp * data.ratio;
      player.hp = Math.min(player.maxHp, player.hp + player.maxHp * 0.25);
      break;
    case 'MOVESPD_UP':
      player.moveSpeed += player.moveSpeed * data.ratio;
      break;
    case 'ALL_MULT_LVUP':
      for (const mult of player.multipliers) {
        mult.level += data.levels;
      }
      break;
    case 'WEAPON_LEVEL_DMG':
      player.baseDamageBonusRatio += data.ratio;
      break;
    case 'RICOCHET':
      break;
    case 'ALL_WEAPON_LVUP':
      for (const weapon of player.weapons) {
        weapon.level += data.levels;
      }
      break;
    case 'PICKUP_UP':
      player.pickupRadius *= 1 + data.ratio;
      break;
    case 'REGEN':
      player.regenPerSec += data.perSec;
      break;
    case 'AREA_UP':
      player.areaMul *= 1 + data.ratio;
      break;
    case 'AUTO_HEAL':
      player.autoHealCd = 0;
      break;
  }
  addEventLog(`Item ${kind} acquired`);
}

function updateMultipliers(dt, moving) {
  const player = state.player;
  for (const mult of player.multipliers) {
    if (mult.kind === 'STOP') {
      if (!moving) {
        mult.chainSec += dt;
        if (mult.chainSec >= 1) {
          const ticks = Math.floor(mult.chainSec);
          mult.chainSec -= ticks;
          const data = CONFIG.multipliers.STOP;
          const gainPerTick = data.perSecAdd * (1 + data.perLevelAccel * (mult.level - 1));
          const totalGain = gainPerTick * ticks;
          mult.value += totalGain;
          addEventLog(`STOP +${totalGain.toFixed(3)} → ×${mult.value.toFixed(3)}`);
        }
      } else {
        mult.chainSec = 0;
      }
    }
    if (mult.kind === 'AUTO') {
      // placeholder for future
    }
  }
  if (player.others.has('AUTO_HEAL')) {
    const data = CONFIG.otherItems.AUTO_HEAL;
    if (player.hp / player.maxHp < data.threshold && player.autoHealCd <= 0) {
      const heal = player.maxHp * data.healRatio;
      player.hp = Math.min(player.maxHp, player.hp + heal);
      player.autoHealCd = data.cooldownSec;
      addEventLog(`Auto heal +${formatNumber(heal)}`);
    }
  }
}

function applyMultiplierEvent(type) {
  const player = state.player;
  const mult = player.multipliers.find((m) => m.kind === type);
  if (!mult) return;
  const data = CONFIG.multipliers[type];
  let gain = 0;
  switch (type) {
    case 'KILL':
      gain = data.perKillAdd * (1 + data.perLevelAccel * (mult.level - 1));
      break;
    case 'CHEST':
      gain = data.perOpenAdd * (1 + data.perLevelAccel * (mult.level - 1));
      break;
    case 'PILLAR':
      gain = data.perBreakAdd * (1 + data.perLevelAccel * (mult.level - 1));
      break;
    case 'STOP':
      gain = 0; // handled elsewhere
      break;
  }
  if (gain > 0) {
    mult.value += gain;
    addEventLog(`${type} +${gain.toFixed(3)} → ×${mult.value.toFixed(3)}`);
  }
}

function openChest(chest) {
  applyMultiplierEvent('CHEST');
  const loot = rollChestLoot();
  applyChoice(loot);
  addEventLog(`Chest opened: ${describeChoice(loot)}`);
}

function rollChestLoot() {
  const weights = CONFIG.chest.lootWeights;
  const entries = [
    { value: 'WEAPON', weight: weights.WEAPON },
    { value: 'MULTIPLIER', weight: weights.MULTIPLIER },
    { value: 'OTHER', weight: weights.OTHER }
  ];
  const type = state.rng.weightedPick(entries);
  let id;
  switch (type) {
    case 'WEAPON':
      id = state.rng.pick(Object.keys(CONFIG.weapons));
      break;
    case 'MULTIPLIER':
      id = state.rng.pick(Object.keys(CONFIG.multipliers));
      break;
    case 'OTHER':
      id = state.rng.pick(Object.keys(CONFIG.otherItems));
      break;
  }
  return { type, id };
}

function breakPillar() {
  applyMultiplierEvent('PILLAR');
  addEventLog('Pillar destroyed');
}

function addEventLog(text) {
  state.events.push({ text, ttl: 4 });
  if (state.events.length > CONFIG.ui.eventLogLineCount) {
    state.events.shift();
  }
}

function checkWinLoseConditions() {
  if (!state.victory && state.time >= CONFIG.general.winTimeSec) {
    state.victory = true;
    showMessage('Victory! Survived 10 minutes');
  }
}

function showMessage(text) {
  messageOverlay.textContent = text;
  messageOverlay.style.display = 'flex';
  state.running = false;
}

function hideMessage() {
  messageOverlay.style.display = 'none';
}

function render() {
  ctx.save();
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawBackground();
  drawXpOrbs();
  drawChests();
  drawPillars();
  drawEnemies();
  drawEnemyBullets();
  drawPlayerBullets();
  drawPlayer();
  drawHud();
  ctx.restore();
}

function worldToScreen(pos) {
  const x = canvas.width / 2 + (pos.x - state.camera.x);
  const y = canvas.height / 2 + (pos.y - state.camera.y);
  return { x, y };
}

function drawBackground() {
  const tile = 64;
  const startX = Math.floor((state.camera.x - canvas.width / 2) / tile) * tile;
  const startY = Math.floor((state.camera.y - canvas.height / 2) / tile) * tile;
  ctx.fillStyle = '#101018';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = '#161626';
  ctx.lineWidth = 1;
  for (let x = startX; x < state.camera.x + canvas.width / 2; x += tile) {
    for (let y = startY; y < state.camera.y + canvas.height / 2; y += tile) {
      const screen = worldToScreen({ x, y });
      ctx.strokeRect(screen.x, screen.y, tile, tile);
    }
  }
}

function drawPlayer() {
  const screen = worldToScreen(state.player.pos);
  ctx.fillStyle = '#4caf50';
  ctx.beginPath();
  ctx.arc(screen.x, screen.y, 16, 0, TWO_PI);
  ctx.fill();
}

function drawEnemies() {
  for (const enemy of state.enemies) {
    if (enemy.dead) continue;
    const screen = worldToScreen(enemy.pos);
    ctx.fillStyle = '#e53935';
    ctx.beginPath();
    ctx.arc(screen.x, screen.y, 14, 0, TWO_PI);
    ctx.fill();
    const hpRatio = clamp(enemy.hp / enemy.baseHp, 0, 1);
    ctx.fillStyle = '#000';
    ctx.fillRect(screen.x - 16, screen.y - 22, 32, 4);
    ctx.fillStyle = '#66bb6a';
    ctx.fillRect(screen.x - 16, screen.y - 22, 32 * hpRatio, 4);
  }
  state.enemies = state.enemies.filter((e) => !e.dead);
}

function drawEnemyBullets() {
  ctx.fillStyle = '#ffb74d';
  for (const bullet of state.enemyBullets) {
    const screen = worldToScreen(bullet.pos);
    ctx.beginPath();
    ctx.arc(screen.x, screen.y, 6, 0, TWO_PI);
    ctx.fill();
  }
}

function drawPlayerBullets() {
  ctx.fillStyle = '#64b5f6';
  for (const bullet of state.playerBullets) {
    const screen = worldToScreen(bullet.pos);
    const radius = bullet.explode ? 8 : bullet.radius;
    ctx.beginPath();
    ctx.arc(screen.x, screen.y, radius, 0, TWO_PI);
    ctx.fill();
  }
}

function drawXpOrbs() {
  ctx.fillStyle = '#ffee58';
  for (const orb of state.xpOrbs) {
    const screen = worldToScreen(orb.pos);
    ctx.beginPath();
    ctx.arc(screen.x, screen.y, 6, 0, TWO_PI);
    ctx.fill();
  }
}

function drawChests() {
  ctx.fillStyle = '#8d6e63';
  for (const chest of state.chests) {
    const screen = worldToScreen(chest.pos);
    ctx.fillRect(screen.x - 12, screen.y - 12, 24, 24);
  }
}

function drawPillars() {
  ctx.strokeStyle = '#90caf9';
  ctx.lineWidth = 2;
  for (const pillar of state.pillars) {
    const screen = worldToScreen(pillar.pos);
    ctx.strokeRect(screen.x - 14, screen.y - 14, 28, 28);
  }
}

function drawHud() {
  const player = state.player;
  ctx.save();
  ctx.fillStyle = '#ffffff';
  ctx.font = '16px Segoe UI';
  let y = 24;
  if (CONFIG.ui.hud.showHpBar) {
    ctx.fillText(`HP ${Math.round(player.hp)}/${Math.round(player.maxHp)}`, 16, y);
    ctx.fillStyle = '#333';
    ctx.fillRect(16, y + 6, 200, 14);
    ctx.fillStyle = '#4caf50';
    const ratio = clamp(player.hp / player.maxHp, 0, 1);
    ctx.fillRect(16, y + 6, 200 * ratio, 14);
    ctx.fillStyle = '#ffffff';
    y += 32;
  }
  if (CONFIG.ui.hud.showXpBar) {
    ctx.fillText(`XP ${player.xp}/${player.nextXp}`, 16, y);
    ctx.fillStyle = '#333';
    ctx.fillRect(16, y + 6, 200, 10);
    ctx.fillStyle = '#42a5f5';
    ctx.fillRect(16, y + 6, 200 * clamp(player.xp / player.nextXp, 0, 1), 10);
    ctx.fillStyle = '#ffffff';
    y += 28;
  }
  if (CONFIG.ui.hud.showLevel) {
    ctx.fillText(`Level ${player.level}`, 16, y);
    y += 24;
  }
  if (CONFIG.ui.hud.showTimer) {
    const minutes = Math.floor(state.time / 60);
    const seconds = Math.floor(state.time % 60).toString().padStart(2, '0');
    ctx.fillText(`Time ${minutes}:${seconds}`, 16, y);
  }
  // Center multiplier
  if (CONFIG.ui.multiplierBanner) {
    const mults = player.multipliers.map((m) => m.value.toFixed(3)).join(' × ');
    const text = `Damage = (Weapon + Lv) × ${mults || '1.000'}`;
    ctx.font = '20px Segoe UI';
    const width = ctx.measureText(text).width;
    ctx.fillText(text, canvas.width / 2 - width / 2, 32);
  }
  // Right panel
  if (CONFIG.ui.rightPanel) {
    ctx.font = '16px Segoe UI';
    const x = canvas.width - 240;
    let yPos = 32;
    ctx.fillText('Weapons', x, yPos);
    yPos += 20;
    for (let i = 0; i < CONFIG.player.weaponSlots; i++) {
      const weapon = player.weapons[i];
      const text = weapon ? `${weapon.kind} Lv${weapon.level}` : '-';
      ctx.fillText(text, x, yPos);
      yPos += 20;
    }
    yPos += 8;
    ctx.fillText('Multipliers', x, yPos);
    yPos += 20;
    for (let i = 0; i < CONFIG.player.multiplierSlots; i++) {
      const mult = player.multipliers[i];
      const text = mult ? `${mult.kind} ×${mult.value.toFixed(2)}` : '-';
      ctx.fillText(text, x, yPos);
      yPos += 20;
    }
    yPos += 8;
    ctx.fillText('Items', x, yPos);
    yPos += 20;
    const items = Array.from(player.others);
    for (let i = 0; i < CONFIG.player.otherItemSlots; i++) {
      const item = items[i];
      ctx.fillText(item || '-', x, yPos);
      yPos += 20;
    }
  }

  // Event log bottom
  const logX = 16;
  let logY = canvas.height - 20;
  for (let i = state.events.length - 1; i >= 0; i--) {
    ctx.fillText(state.events[i].text, logX, logY);
    logY -= 20;
  }
  ctx.restore();
}

initGame(CONFIG);
startRun();
