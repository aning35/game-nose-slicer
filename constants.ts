
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
    [EffectType.FRUIT_RAIN]:    { emoji: '🌧️', color: '#00BFFF', effect: EffectType.FRUIT_RAIN, weight: 10, duration: 600 },
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
    [EffectType.WIDE_BLADE]:    { emoji: '⚔️', color: '#F0F8FF', effect: EffectType.WIDE_BLADE, weight: 10, duration: 600 },
    [EffectType.ANTI_GRAVITY]:  { emoji: '🎈', color: '#FF00FF', effect: EffectType.ANTI_GRAVITY, weight: 10, duration: 600 },
    [EffectType.DISCO_FEVER]:   { emoji: '💃', color: '#9400D3', effect: EffectType.DISCO_FEVER, weight: 8, duration: 600 },
    [EffectType.GOLDEN_SNITCH]: { emoji: '🐝', color: '#FFD700', effect: EffectType.GOLDEN_SNITCH, weight: 5, duration: 0 }, // Instant capture
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
    gameOver: "游戏结束",
    score: "得分",
    mainMenu: "主菜单",
    go: "开始!",
    calibrationTitle: "头部控制校准",
    calibrationDesc: "请正对摄像头，用鼻尖移动光标"
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
    gameOver: "GAME OVER",
    score: "Score",
    mainMenu: "MAIN MENU",
    go: "GO!",
    calibrationTitle: "Head Calibration",
    calibrationDesc: "Face camera, move cursor with nose"
  }
};
