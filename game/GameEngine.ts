
import { GameEntity, Particle, SlicePoint, GameState, Point, Splat, FloatingText, CameraShake, GameCallbacks, Difficulty } from '../types';
import { 
  GRAVITY, 
  BLADE_LIFE, 
  FRUIT_TYPES, 
  BOMB_TYPE,
  POINTS_FRUIT,
  POINTS_BOMB,
  MAX_SPLATS,
  COMBO_TIMER_MAX,
  HITBOX_RADIUS,
  DIFFICULTY_SETTINGS
} from '../constants';
import { generateId, pointToSegmentDistance } from '../utils/math';
import { InputHandler } from '../systems/InputHandler';
import { Renderer } from '../systems/Renderer';

export class GameEngine {
    private canvas: HTMLCanvasElement;
    private video: HTMLVideoElement;
    private callbacks: GameCallbacks;
    
    private ctx: CanvasRenderingContext2D | null = null;
    private inputHandler: InputHandler | null = null;
    private renderer: Renderer | null = null;
    private animationId: number = 0;

    // Game State
    private width: number;
    private height: number;
    private gameState: GameState = GameState.MENU;
    private difficulty: Difficulty = Difficulty.MEDIUM;

    // Entities
    private entities: GameEntity[] = [];
    private particles: Particle[] = [];
    private splats: Splat[] = [];
    private texts: FloatingText[] = [];
    private slicePath: SlicePoint[] = [];

    // Gameplay Vars
    private spawnTimer: number = 0;
    private difficultyMultiplier: number = 1;
    private comboCount: number = 0;
    private comboTimer: number = 0;
    private shake: CameraShake = { intensity: 0, duration: 0 };
    private lives: number = 3;

    // Trail Effects
    private trailEffect: {
        type: 'normal' | 'fruit' | 'bomb';
        timer: number;
        color: string;
    } = { type: 'normal', timer: 0, color: '' };

    // Cursor
    private cursor: Point = { x: 0, y: 0 };
    private prevCursor: Point = { x: 0, y: 0 };
    private isCursorActive: boolean = false;
    private calibrationProgress: number = 0;

    constructor(
        canvas: HTMLCanvasElement, 
        video: HTMLVideoElement, 
        callbacks: GameCallbacks
    ) {
        this.canvas = canvas;
        this.video = video;
        this.callbacks = callbacks;
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        
        this.cursor = { x: this.width / 2, y: this.height / 2 };
        this.prevCursor = { x: this.width / 2, y: this.height / 2 };

        this.init();
    }

    private init() {
        this.ctx = this.canvas.getContext('2d');
        if (this.ctx) {
            this.renderer = new Renderer(this.ctx, this.width, this.height);
        }

        this.inputHandler = new InputHandler(
            this.video,
            this.width,
            this.height,
            (results) => {
                if (results.length > 0) {
                    this.processNoseMovement(results[0].x, results[0].y);
                    if (!this.isCursorActive) {
                        this.isCursorActive = true;
                        this.callbacks.onCursorActive(true);
                    }
                } else {
                    if (this.isCursorActive) {
                        this.isCursorActive = false;
                        this.callbacks.onCursorActive(false);
                    }
                }
            }
        );
        this.inputHandler.initialize();

        window.addEventListener('resize', this.handleResize);
        
        // Critical Fix: Force initial resize to ensure canvas matches window dimensions
        this.handleResize();
        
        this.startLoop();
    }

    private handleResize = () => {
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.canvas.width = this.width;
        this.canvas.height = this.height;
        if (this.renderer) this.renderer.resize(this.width, this.height);
        if (this.inputHandler) this.inputHandler.updateDimensions(this.width, this.height);
    };

    public setDifficulty(d: Difficulty) {
        this.difficulty = d;
    }

    public setGameState(state: GameState) {
        this.gameState = state;
        
        if (state === GameState.CALIBRATION) {
            this.cursor = { x: this.width * 0.5, y: this.height / 2 };
            this.calibrationProgress = 0;
            this.lives = 3;
            this.callbacks.onLivesUpdate(3);
            this.trailEffect = { type: 'normal', timer: 0, color: '' };
        } else if (state === GameState.PLAYING) {
             this.entities = [];
             this.particles = [];
             this.splats = [];
             this.texts = [];
             this.slicePath = [];
             this.spawnTimer = 0;
             this.difficultyMultiplier = 1;
             this.comboCount = 0;
             this.lives = 3;
             this.callbacks.onLivesUpdate(3);
             this.trailEffect = { type: 'normal', timer: 0, color: '' };
        }
    }

    public cleanup() {
        window.removeEventListener('resize', this.handleResize);
        if (this.inputHandler) this.inputHandler.cleanup();
        cancelAnimationFrame(this.animationId);
    }

    private startLoop() {
        const loop = () => {
            this.animate();
            this.animationId = requestAnimationFrame(loop);
        };
        requestAnimationFrame(loop);
    }

    private processNoseMovement(targetX: number, targetY: number) {
        const prevX = this.cursor.x;
        const prevY = this.cursor.y;
        
        this.prevCursor = { x: prevX, y: prevY };

        // Heavy Kalman-like smoothing for steady head control
        const dx = targetX - prevX;
        const dy = targetY - prevY;
        
        const alpha = 0.2; // Lower value = smoother, heavier feel

        const newX = prevX + dx * alpha;
        const newY = prevY + dy * alpha;
        const clampedX = Math.max(0, Math.min(this.width, newX));
        const clampedY = Math.max(0, Math.min(this.height, newY));

        this.cursor = { x: clampedX, y: clampedY };

        // Notify UI of cursor position
        this.callbacks.onCursorMove(clampedX, clampedY);

        // Generate Sparkles if moving fast
        const dist = Math.hypot(dx, dy);
        if (dist > 10) this.spawnSparkles(clampedX, clampedY);

        // Allow input processing in MENU for trails, but only slice in PLAYING
        // We track trails in all states for visual feedback
        this.slicePath.push({ x: clampedX, y: clampedY, life: BLADE_LIFE, pointerId: 0 });
        
        if (this.gameState === GameState.PLAYING) {
            this.checkCollisions({ x: prevX, y: prevY }, { x: clampedX, y: clampedY });
        }
    }

    private spawnSparkles(x: number, y: number) {
        for(let i=0; i<2; i++) {
            this.particles.push({
                id: generateId(),
                x: x + (Math.random() - 0.5) * 20,
                y: y + (Math.random() - 0.5) * 20,
                vx: (Math.random() - 0.5) * 2,
                vy: (Math.random() - 0.5) * 2,
                life: 0.6,
                color: Math.random() > 0.5 ? '#fff' : 'cyan',
                size: Math.random() * 3 + 1,
                gravity: 0,
                decay: 0.05
            });
        }
    }

    private spawnEntity() {
        const config = DIFFICULTY_SETTINGS[this.difficulty];

        // Increased bomb probability based on difficulty config
        const isBomb = Math.random() < config.bombChance + (this.difficultyMultiplier * 0.05);
        const typeData = isBomb ? BOMB_TYPE : FRUIT_TYPES[Math.floor(Math.random() * FRUIT_TYPES.length)];
        
        // Randomize spawn source: 
        // 0.0 - 0.6: Bottom
        // 0.6 - 0.8: Left
        // 0.8 - 1.0: Right
        const spawnSource = Math.random();
        
        let x, y, vx, vy;
        const speedMult = config.speedMult;

        if (spawnSource < 0.6) {
            // BOTTOM SPAWN (60%)
            const margin = 100;
            x = margin + Math.random() * (this.width - margin * 2);
            y = this.height + 60;
            
            // Bias horizontal velocity towards center
            const centerBias = (this.width/2 - x) * 0.015;
            vx = ((Math.random() - 0.5) * 10 + centerBias) * speedMult;
            // High upward velocity
            vy = -(Math.random() * 7 + 16 + (this.difficultyMultiplier * 0.5)) * speedMult; 
        } else if (spawnSource < 0.8) {
            // LEFT SPAWN (20%)
            x = -60;
            // Spawn lower half
            y = this.height * (0.5 + Math.random() * 0.4); 
            // Shoot Right
            vx = (Math.random() * 10 + 10 + (this.difficultyMultiplier)) * speedMult; 
            // Arc Up
            vy = -(Math.random() * 10 + 12) * speedMult; 
        } else {
            // RIGHT SPAWN (20%)
            x = this.width + 60;
            y = this.height * (0.5 + Math.random() * 0.4);
            // Shoot Left
            vx = -(Math.random() * 10 + 10 + (this.difficultyMultiplier)) * speedMult;
            vy = -(Math.random() * 10 + 12) * speedMult;
        }

        // Add slight randomness to prevent perfect stacking if multiple spawn same frame
        x += (Math.random() - 0.5) * 10;
        y += (Math.random() - 0.5) * 10;

        const entity: GameEntity = {
            id: generateId(),
            type: isBomb ? 'bomb' : 'fruit',
            x,
            y,
            vx,
            vy,
            rotation: Math.random() * Math.PI,
            rotationSpeed: (Math.random() - 0.5) * 0.4, // Fast rotation
            radius: 60,
            emoji: typeData.emoji,
            color: typeData.color,
            isSliced: false,
            scoreValue: isBomb ? POINTS_BOMB : POINTS_FRUIT,
            scale: 1,
        };
        this.entities.push(entity);
    }

    private checkCollisions(p1: Point, p2: Point) {
        let hitSomething = false;

        this.entities.forEach(entity => {
            if (entity.isSliced) return;

            const distSeg = pointToSegmentDistance(entity.x, entity.y, p1.x, p1.y, p2.x, p2.y);
            const distPoint = Math.hypot(entity.x - p2.x, entity.y - p2.y);
            
            if (distSeg < entity.radius + HITBOX_RADIUS || distPoint < entity.radius + HITBOX_RADIUS) {
                this.sliceEntity(entity);
                hitSomething = true;
            }
        });

        if (hitSomething) {
            this.comboTimer = COMBO_TIMER_MAX;
            this.comboCount++;
            if (this.comboCount > 1) {
                this.texts.push({
                    id: generateId(),
                    x: p2.x,
                    y: p2.y - 50,
                    text: `${this.comboCount} COMBO!`,
                    color: '#ffd700',
                    scale: 1,
                    life: 1.0,
                    vy: -2
                });
            }
        }
    }

    private sliceEntity(entity: GameEntity) {
        entity.isSliced = true;
        this.createExplosion(entity.x, entity.y, entity.color, entity.type === 'bomb');
        this.callbacks.onScoreUpdate(entity.scoreValue * (this.comboCount > 3 ? 2 : 1));
        
        if (entity.type === 'bomb') {
            this.shake = { intensity: 60, duration: 40 };
            this.comboCount = 0;
            
            this.trailEffect = { type: 'bomb', timer: 20, color: '#ff0000' };
            this.callbacks.onDamage();
            
            this.lives--;
            this.callbacks.onLivesUpdate(this.lives);

            if (this.lives <= 0) {
                setTimeout(() => this.callbacks.onGameOver(), 500);
            }

        } else {
            this.createSplat(entity.x, entity.y, entity.color);
            if (this.trailEffect.type !== 'bomb') {
                this.trailEffect = { type: 'fruit', timer: 8, color: entity.color };
            }
        }
    }

    private createSplat(x: number, y: number, color: string) {
        if (this.splats.length > MAX_SPLATS) this.splats.shift();
        this.splats.push({
            id: generateId(),
            x, y,
            color,
            size: Math.random() * 50 + 50,
            alpha: 0.8,
            rotation: Math.random() * Math.PI * 2
        });
    }

    private createExplosion(x: number, y: number, color: string, isBomb: boolean) {
        if (isBomb) {
            // Smoke
            for (let i = 0; i < 20; i++) {
                this.particles.push({
                    id: generateId(),
                    x, y,
                    vx: (Math.random() - 0.5) * 15,
                    vy: (Math.random() - 0.5) * 15,
                    life: 1.0,
                    color: '#333333',
                    size: Math.random() * 15 + 10,
                    gravity: -0.05,
                    decay: 0.02
                });
            }
            // Fire (Spectrum)
            for (let i = 0; i < 30; i++) {
                this.particles.push({
                    id: generateId(),
                    x, y,
                    vx: (Math.random() - 0.5) * 30,
                    vy: (Math.random() - 0.5) * 30,
                    life: 0.8,
                    color: Math.random() > 0.5 ? '#ff4500' : '#ff8800',
                    size: Math.random() * 10 + 5,
                    gravity: 0,
                    decay: 0.05
                });
            }
            // Sparks
            for (let i = 0; i < 20; i++) {
                this.particles.push({
                    id: generateId(),
                    x, y,
                    vx: (Math.random() - 0.5) * 60,
                    vy: (Math.random() - 0.5) * 60,
                    life: 0.5,
                    color: '#ffff00',
                    size: 3,
                    gravity: 0.1,
                    decay: 0.1
                });
            }
        } else {
            // 1. Heavy Juice Core
            for (let i = 0; i < 15; i++) {
                this.particles.push({
                    id: generateId(),
                    x, y,
                    vx: (Math.random() - 0.5) * 15,
                    vy: (Math.random() - 0.5) * 15,
                    life: 1.0 + Math.random() * 0.5,
                    color: color,
                    size: Math.random() * 12 + 6,
                    gravity: 0.2,
                    decay: 0.01 + Math.random() * 0.02
                });
            }

            // 2. Light Mist/Spray
            for (let i = 0; i < 15; i++) {
                this.particles.push({
                    id: generateId(),
                    x, y,
                    vx: (Math.random() - 0.5) * 35,
                    vy: (Math.random() - 0.5) * 35,
                    life: 0.8,
                    color: 'rgba(255, 255, 255, 0.7)',
                    size: Math.random() * 6 + 2,
                    gravity: 0.1,
                    decay: 0.03
                });
            }

            // 3. High Velocity Droplets
            for (let i = 0; i < 10; i++) {
                 this.particles.push({
                    id: generateId(),
                    x, y,
                    vx: (Math.random() - 0.5) * 50,
                    vy: (Math.random() - 0.5) * 50,
                    life: 0.6,
                    color: color,
                    size: Math.random() * 5 + 2,
                    gravity: 0.3,
                    decay: 0.05
                });
            }
        }
    }

    private animate = () => {
        if (!this.renderer) return;
        const config = DIFFICULTY_SETTINGS[this.difficulty];

        // 1. Calculate Shake
        let shakeX = 0;
        let shakeY = 0;

        if (this.shake.duration > 0) {
            shakeX = (Math.random() - 0.5) * this.shake.intensity;
            shakeY = (Math.random() - 0.5) * this.shake.intensity;
            this.shake.duration--;
            this.shake.intensity = Math.max(0, this.shake.intensity * 0.9);
        }

        // 2. Clear Screen
        this.renderer.resetTransform();
        this.renderer.clear();

        // 3. Apply Shake
        if (shakeX !== 0 || shakeY !== 0) {
            this.renderer.setShake(shakeX, shakeY);
        }

        // 4. Update Logic & Physics
        if (this.gameState === GameState.CALIBRATION) {
            if (this.isCursorActive) {
                this.calibrationProgress += 0.015;
                this.callbacks.onCalibrationProgress(this.calibrationProgress);
                if (this.calibrationProgress >= 1.0) {
                    this.calibrationProgress = 1.0;
                    this.callbacks.onCalibrationComplete();
                }
            } else {
                this.calibrationProgress = Math.max(0, this.calibrationProgress - 0.02);
                this.callbacks.onCalibrationProgress(this.calibrationProgress);
            }
        }

        if (this.gameState === GameState.PLAYING) {
            this.spawnTimer--;
            if (this.spawnTimer <= 0) {
                // Determine burst size
                let spawnCount = 1;
                if (Math.random() < config.burstChance + (this.difficultyMultiplier * 0.05)) {
                    spawnCount += Math.floor(Math.random() * 2) + 1;
                }
                if (this.difficultyMultiplier > 1.8 && Math.random() < 0.2) {
                    spawnCount += 2;
                }

                for (let i = 0; i < spawnCount; i++) {
                    this.spawnEntity();
                }

                this.difficultyMultiplier = Math.min(config.maxMult, this.difficultyMultiplier + 0.002);
                const rate = config.spawnRate;
                this.spawnTimer = Math.max(15, (rate / this.difficultyMultiplier) * (0.7 + Math.random() * 0.6));
            }

            if (this.comboTimer > 0) this.comboTimer--;
            else this.comboCount = 0;
        }

        // Always update physics for entities (so they fall off screen if game over)
        this.entities.forEach(entity => {
            entity.x += entity.vx;
            entity.y += entity.vy;
            entity.vy += GRAVITY;
            entity.rotation += entity.rotationSpeed;
            if (entity.y > this.height + 100 && entity.vy > 0) entity.isSliced = true;
        });

        // Filter out of bounds
        this.entities = this.entities.filter(e => {
            const outOfBoundsBottom = e.y > this.height + 200;
            const outOfBoundsSides = e.x < -200 || e.x > this.width + 200;
            return !(e.isSliced || outOfBoundsBottom || outOfBoundsSides);
        });

        // Update Particles
        this.particles.forEach(p => {
            p.x += p.vx;
            p.y += p.vy;
            p.vy += p.gravity;
            p.life -= p.decay;
        });
        this.particles = this.particles.filter(p => p.life > 0);

        // Update Text
        this.texts.forEach(t => {
            t.y += t.vy;
            t.life -= 0.02;
        });
        this.texts = this.texts.filter(t => t.life > 0);

        // Update Trail Life
        this.slicePath.forEach(p => p.life--);
        this.slicePath = this.slicePath.filter(p => p.life > 0);

        if (this.trailEffect.timer > 0) {
            this.trailEffect.timer--;
        } else {
            this.trailEffect.type = 'normal';
        }

        // 5. Render Everything
        this.renderer.drawSplats(this.splats);
        this.renderer.drawEntities(this.entities);
        this.renderer.drawParticles(this.particles);
        this.renderer.drawFloatingTexts(this.texts);

        // Draw Trail (Visible in MENU, CALIBRATION, PLAYING, GAMEOVER)
        const isRainbow = this.comboCount >= 5;
        let renderIsRainbow = false;
        let renderColor: string | undefined = undefined;
        let renderWidthMult = 1;
        let renderFlicker = false;

        if (this.trailEffect.type === 'bomb') {
            renderColor = '#ff0000';
            renderFlicker = true;
        } else if (isRainbow) {
            renderIsRainbow = true;
            renderWidthMult = 1.3 + Math.sin(Date.now() / 150) * 0.3;
            renderColor = undefined; 
        } else if (this.trailEffect.type === 'fruit') {
            renderColor = this.trailEffect.color;
            renderWidthMult = 1.5;
        }

        this.renderer.drawTrails(this.slicePath, { 
            isRainbow: renderIsRainbow,
            color: renderColor,
            widthMultiplier: renderWidthMult,
            isFlickering: renderFlicker
        });
        
        if (this.gameState === GameState.CALIBRATION) {
            this.renderer.drawCalibration(this.calibrationProgress, this.width, this.height);
        }
    }
}
