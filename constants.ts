
import { Difficulty } from './types';

export const GRAVITY = 0.08; // Increased gravity for faster, snappier gameplay
export const FRICTION = 0.995;
export const BLADE_LIFE = 20; // Long trail
export const BLADE_WIDTH = 12; // Thick robust blade
export const SPAWN_RATE_INITIAL = 35; // Fallback default

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

// Hitbox size for nose (larger than finger)
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

export const BOMB_TYPE = { emoji: '💣', color: '#333333' };

export const POINTS_FRUIT = 3;
export const POINTS_BOMB = -6;

export const MAX_PARTICLES = 40; 
export const MAX_SPLATS = 20;

export const COMBO_TIMER_MAX = 60; // Frames to chain a combo