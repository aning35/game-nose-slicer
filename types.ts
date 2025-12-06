
export type EntityType = 'fruit' | 'bomb' | 'special';

export enum Difficulty {
  EASY = 'EASY',
  MEDIUM = 'MEDIUM',
  HARD = 'HARD'
}

export enum EffectType {
  NONE = 'NONE',
  INVINCIBILITY = 'INVINCIBILITY', // 1. 10s No damage
  FRUIT_RAIN = 'FRUIT_RAIN',       // 2. 10s Lots of fruit, no bombs
  GIANT_CURSOR = 'GIANT_CURSOR',   // 3. 10s Big cursor
  TINY_CURSOR = 'TINY_CURSOR',     // 4. 10s Small cursor
  MIRROR_MODE = 'MIRROR_MODE',     // 5. 10s Mirror cursor
  BOMB_TRAP = 'BOMB_TRAP',         // 6. Instant 5 bombs
  HIGH_STAKES = 'HIGH_STAKES',     // 7. 10s 2x Score, 2x Damage
  EXTRA_LIFE = 'EXTRA_LIFE',       // 8. Instant +1 Life
  MAGNET = 'MAGNET',               // 9. 10s Magnet
  SLOW_MOTION = 'SLOW_MOTION',     // 10. 10s Slow physics
  BLAST = 'BLAST',                 // 11. Instant clear screen
  FREEZE = 'FREEZE',               // 12. 10s Stop physics
  FRENZY = 'FRENZY',               // 13. 10s Fast spawns
  BONUS_POINTS = 'BONUS_POINTS',   // 14. Instant points
  WIDE_BLADE = 'WIDE_BLADE'        // 15. 10s Wider trail
}

export interface ActiveEffectState {
    type: EffectType;
    timer: number;
    maxDuration: number;
}

export interface Point {
  x: number;
  y: number;
}

export interface GameEntity {
  id: string;
  type: EntityType;
  effectType?: EffectType; // If it's a special fruit
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  rotationSpeed: number;
  radius: number;
  emoji: string;
  color: string; 
  isSliced: boolean;
  scoreValue: number;
  scale: number;
}

export interface Particle {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
  size: number;
  gravity: number;
  decay: number;
}

export interface SlicePoint {
  x: number;
  y: number;
  life: number; 
  pointerId: number; 
}

export interface Splat {
    id: string;
    x: number;
    y: number;
    color: string;
    size: number;
    alpha: number;
    rotation: number;
}

export interface FloatingText {
    id: string;
    x: number;
    y: number;
    text: string;
    color: string;
    scale: number;
    life: number;
    vy: number;
}

export interface CameraShake {
    intensity: number;
    duration: number;
}

export enum GameState {
  MENU = 'MENU',
  CALIBRATION = 'CALIBRATION',
  PLAYING = 'PLAYING',
  GAME_OVER = 'GAME_OVER'
}

export interface GameCallbacks {
  onScoreUpdate: (points: number) => void;
  onLivesUpdate: (lives: number) => void;
  onDamage: () => void;
  onGameOver: () => void;
  onCalibrationComplete: () => void;
  onCursorActive: (active: boolean) => void;
  onCalibrationProgress: (progress: number) => void;
  onCursorMove: (x: number, y: number) => void;
  onEffectChange: (effect: ActiveEffectState | null) => void;
}
