
export type EntityType = 'fruit' | 'bomb';

export enum Difficulty {
  EASY = 'EASY',
  MEDIUM = 'MEDIUM',
  HARD = 'HARD'
}

export interface Point {
  x: number;
  y: number;
}

export interface GameEntity {
  id: string;
  type: EntityType;
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  rotationSpeed: number;
  radius: number;
  emoji: string;
  color: string; // Used for particle effects
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
  life: number; // For fading trail
  pointerId: number; 
}

// Background juice stains
export interface Splat {
    id: string;
    x: number;
    y: number;
    color: string;
    size: number;
    alpha: number;
    rotation: number;
}

// Pop-up text (Combo, Score)
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
}
