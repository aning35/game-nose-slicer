

import { Difficulty, EffectType } from './types';

export const GRAVITY = 0.08; 
export const FRICTION = 0.995;
export const BLADE_LIFE = 20; 
export const BLADE_WIDTH = 12; 
export const SPAWN_RATE_INITIAL = 35; 

export const DIFFICULTY_SETTINGS = {
  [Difficulty.EASY]: {
    spawnRate: 55,
    bombChance: 0.05,
    speedMult: 0.85,
    burstChance: 0.1,
    maxMult: 1.5
  },
  [Difficulty.MEDIUM]: {
    spawnRate: 35,
    bombChance: 0.20,
    speedMult: 1.0,
    burstChance: 0.3,
    maxMult: 3.0
  },
  [Difficulty.HARD]: {
    spawnRate: 25,
    bombChance: 0.35,
    speedMult: 1.25,
    burstChance: 0.5,
    maxMult: 5.0
  }
};

export const HITBOX_RADIUS = 80;

export const FRUIT_TYPES = [
  { emoji: '🍎', color: '#ff4d4d' },
  { emoji: '🍌', color: '#ffe135' },
  { emoji: '🍉', color: '#ff6b6b' },
  { emoji: '🍇', color: '#ba55d3' },
  { emoji: '🍊', color: '#ffa500' },
  { emoji: '🍍', color: '#ffff00' },
  { emoji: '🥝', color: '#8ee53f' },
  { emoji: '🥥', color: '#f0f0f0' },
];

// Special Fruits Definition
// Weights determine how likely this specific special fruit is chosen when a special spawn triggers
export const SPECIAL_FRUITS: Record<string, { emoji: string, color: string, effect: EffectType, weight: number, duration: number }> = {
    [EffectType.INVINCIBILITY]: { emoji: '🌟', color: '#FFFF00', effect: EffectType.INVINCIBILITY, weight: 10, duration: 600 },
    [EffectType.FRUIT_RAIN]:    { emoji: '🌧️', color: '#00BFFF', effect: EffectType.FRUIT_RAIN, weight: 10, duration: 300 },
    [EffectType.GIANT_CURSOR]:  { emoji: '🍄', color: '#FF0000', effect: EffectType.GIANT_CURSOR, weight: 10, duration: 600 },
    [EffectType.TINY_CURSOR]:   { emoji: '🦐', color: '#FFC0CB', effect: EffectType.TINY_CURSOR, weight: 8, duration: 600 },
    [EffectType.MIRROR_MODE]:   { emoji: '🪞', color: '#C0C0C0', effect: EffectType.MIRROR_MODE, weight: 8, duration: 600 },
    [EffectType.BOMB_TRAP]:     { emoji: '💀', color: '#000000', effect: EffectType.BOMB_TRAP, weight: 5, duration: 0 }, // Instant
    [EffectType.HIGH_STAKES]:   { emoji: '💎', color: '#00FFFF', effect: EffectType.HIGH_STAKES, weight: 8, duration: 600 },
    [EffectType.EXTRA_LIFE]:    { emoji: '💖', color: '#FF1493', effect: EffectType.EXTRA_LIFE, weight: 5, duration: 0 }, // Instant
    [EffectType.MAGNET]:        { emoji: '🧲', color: '#FF4500', effect: EffectType.MAGNET, weight: 10, duration: 600 },
    [EffectType.SLOW_MOTION]:   { emoji: '🐌', color: '#ADFF2F', effect: EffectType.SLOW_MOTION, weight: 10, duration: 600 },
    [EffectType.BLAST]:         { emoji: '🧨', color: '#FF6347', effect: EffectType.BLAST, weight: 5, duration: 0 }, // Instant
    [EffectType.FREEZE]:        { emoji: '❄️', color: '#E0FFFF', effect: EffectType.FREEZE, weight: 8, duration: 600 },
    [EffectType.FRENZY]:        { emoji: '⚡', color: '#FFD700', effect: EffectType.FRENZY, weight: 8, duration: 600 },
    [EffectType.BONUS_POINTS]:  { emoji: '🪙', color: '#DAA520', effect: EffectType.BONUS_POINTS, weight: 8, duration: 0 }, // Instant
    [EffectType.CHAIN_REACTION]:{ emoji: '🔗', color: '#00FF7F', effect: EffectType.CHAIN_REACTION, weight: 10, duration: 600 },
    [EffectType.ANTI_GRAVITY]:  { emoji: '🎈', color: '#FF00FF', effect: EffectType.ANTI_GRAVITY, weight: 10, duration: 600 },
    [EffectType.DISCO_FEVER]:   { emoji: '💃', color: '#9400D3', effect: EffectType.DISCO_FEVER, weight: 8, duration: 600 },
    [EffectType.GOLDEN_SNITCH]: { emoji: '🐝', color: '#FFD700', effect: EffectType.GOLDEN_SNITCH, weight: 5, duration: 0 }, // Instant
    [EffectType.GHOST_MODE]:    { emoji: '👻', color: '#F8F8FF', effect: EffectType.GHOST_MODE, weight: 8, duration: 600 }, // Challenge
    [EffectType.PIXEL_STORM]:   { emoji: '👾', color: '#32CD32', effect: EffectType.PIXEL_STORM, weight: 8, duration: 600 }, // Visual
};

export const BOMB_TYPE = { emoji: '💣', color: '#333333' };

export const POINTS_FRUIT = 3;
export const POINTS_BOMB = -6;
export const POINTS_SPECIAL = 10;
export const MAX_LIVES = 6;

export const MAX_PARTICLES = 40; 
export const MAX_SPLATS = 20;

export const COMBO_TIMER_MAX = 60;

export const TRANSLATIONS = {
  zh: {
    title: "鼻尖切切乐",
    instruction: "使用鼻子移动光标",
    difficulty: {
      [Difficulty.EASY]: "简单",
      [Difficulty.MEDIUM]: "普通",
      [Difficulty.HARD]: "困难"
    },
    start: "开始游戏",
    howToPlay: "玩法说明",
    back: "返回",
    gameOver: "游戏结束",
    score: "得分",
    mainMenu: "主菜单",
    go: "开始!",
    calibrationTitle: "头部控制校准",
    calibrationDesc: "请正对摄像头，用鼻尖移动光标",
    rules: {
      basic: "移动鼻子控制光标。切开水果得分，不要碰到炸弹！",
      items: "特殊道具一览："
    },
    items: {
      bomb: "炸弹 (扣分扣血)",
      [EffectType.INVINCIBILITY]: "无敌星 (10秒无伤)",
      [EffectType.FRUIT_RAIN]: "水果雨 (大量水果)",
      [EffectType.GIANT_CURSOR]: "巨型光标 (范围变大)",
      [EffectType.TINY_CURSOR]: "微型光标 (范围变小)",
      [EffectType.MIRROR_MODE]: "镜像模式 (双光标)",
      [EffectType.BOMB_TRAP]: "炸弹陷阱 (小心!)",
      [EffectType.HIGH_STAKES]: "高风险 (双倍分/伤)",
      [EffectType.EXTRA_LIFE]: "加命 (生命+1)",
      [EffectType.MAGNET]: "磁铁 (自动吸附)",
      [EffectType.SLOW_MOTION]: "慢动作 (时间减缓)",
      [EffectType.BLAST]: "全屏清除 (炸掉所有)",
      [EffectType.FREEZE]: "冻结 (时间停止)",
      [EffectType.FRENZY]: "狂热 (极速生成)",
      [EffectType.BONUS_POINTS]: "奖励分 (+50分)",
      [EffectType.CHAIN_REACTION]: "连锁反应 (连环炸)",
      [EffectType.ANTI_GRAVITY]: "反重力 (向上飘)",
      [EffectType.DISCO_FEVER]: "迪斯科 (3倍得分)",
      [EffectType.GOLDEN_SNITCH]: "金飞贼 (+100分)",
      [EffectType.GHOST_MODE]: "幽灵模式 (隐形)",
      [EffectType.PIXEL_STORM]: "像素风暴 (8-bit)",
    }
  },
  en: {
    title: "Nose Slicer",
    instruction: "Use your nose to hover",
    difficulty: {
      [Difficulty.EASY]: "EASY",
      [Difficulty.MEDIUM]: "MEDIUM",
      [Difficulty.HARD]: "HARD"
    },
    start: "START GAME",
    howToPlay: "HOW TO PLAY",
    back: "BACK",
    gameOver: "GAME OVER",
    score: "Score",
    mainMenu: "MAIN MENU",
    go: "GO!",
    calibrationTitle: "Head Calibration",
    calibrationDesc: "Face camera, move cursor with nose",
    rules: {
      basic: "Move nose to control cursor. Slice fruits, avoid bombs!",
      items: "Special Items:"
    },
    items: {
      bomb: "Bomb (Damage)",
      [EffectType.INVINCIBILITY]: "Invincibility (10s)",
      [EffectType.FRUIT_RAIN]: "Fruit Rain (No Bombs)",
      [EffectType.GIANT_CURSOR]: "Giant Cursor (x3 Size)",
      [EffectType.TINY_CURSOR]: "Tiny Cursor (x0.3 Size)",
      [EffectType.MIRROR_MODE]: "Mirror Mode (Dual)",
      [EffectType.BOMB_TRAP]: "Bomb Trap (Watch out!)",
      [EffectType.HIGH_STAKES]: "High Stakes (2x Score/Dmg)",
      [EffectType.EXTRA_LIFE]: "Extra Life (+1 Life)",
      [EffectType.MAGNET]: "Magnet (Attract Fruits)",
      [EffectType.SLOW_MOTION]: "Slow Motion",
      [EffectType.BLAST]: "Blast (Clear Screen)",
      [EffectType.FREEZE]: "Freeze (Stop Time)",
      [EffectType.FRENZY]: "Frenzy (Fast Spawn)",
      [EffectType.BONUS_POINTS]: "Bonus Points (+50)",
      [EffectType.CHAIN_REACTION]: "Chain Reaction",
      [EffectType.ANTI_GRAVITY]: "Anti-Gravity",
      [EffectType.DISCO_FEVER]: "Disco Fever (3x Score)",
      [EffectType.GOLDEN_SNITCH]: "Golden Snitch (+100)",
      [EffectType.GHOST_MODE]: "Ghost Mode (Invisible)",
      [EffectType.PIXEL_STORM]: "Pixel Storm (8-bit)",
    }
  }
};