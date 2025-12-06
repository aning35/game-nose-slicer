
export const GRAVITY = 0.035; // Very low gravity (Matrix style) for head control ease
export const FRICTION = 0.99;
export const BLADE_LIFE = 20; // Long trail
export const BLADE_WIDTH = 12; // Thick robust blade
export const SPAWN_RATE_INITIAL = 100; // Slower spawn rate

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
