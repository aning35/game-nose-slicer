

import { GameEntity, SlicePoint, GameState, Point, CameraShake, GameCallbacks, Difficulty, EffectType, ActiveEffectState } from '../types';
import { 
  BLADE_LIFE, 
  COMBO_TIMER_MAX,
  HITBOX_RADIUS,
  DIFFICULTY_SETTINGS,
  SPECIAL_FRUITS,
  MAX_LIVES,
  TRANSLATIONS
} from '../constants';
import { pointToSegmentDistance } from '../utils/math';
import { InputHandler } from '../systems/InputHandler';
import { Renderer } from '../systems/Renderer';
import { EntityManager } from '../systems/EntityManager';
import { ParticleSystem } from '../systems/ParticleSystem';

export class GameEngine {
    private canvas: HTMLCanvasElement;
    private video: HTMLVideoElement;
    private callbacks: GameCallbacks;
    
    private ctx: CanvasRenderingContext2D | null = null;
    private inputHandler: InputHandler | null = null;
    private renderer: Renderer | null = null;
    
    // Sub-Systems
    private entityManager: EntityManager;
    private particleSystem: ParticleSystem;

    private animationId: number = 0;

    // Game State
    private width: number;
    private height: number;
    private gameState: GameState = GameState.MENU;
    private difficulty: Difficulty = Difficulty.MEDIUM;
    private language: 'zh' | 'en' = 'zh';

    private slicePath: SlicePoint[] = [];

    // Gameplay Vars
    private spawnTimer: number = 0;
    private difficultyMultiplier: number = 1;
    private comboCount: number = 0;
    private comboTimer: number = 0;
    private shake: CameraShake = { intensity: 0, duration: 0 };
    private lives: number = 3;

    // Active Effect
    private activeEffect: ActiveEffectState | null = null;
    private specialCooldown: number = 0;

    // Trail Effects
    private trailEffect: {
        type: 'normal' | 'fruit' | 'bomb' | 'special';
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

        // Initialize Systems
        this.entityManager = new EntityManager(this.width, this.height);
        this.particleSystem = new ParticleSystem();

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
        this.entityManager.resize(this.width, this.height);
    };

    public setDifficulty(d: Difficulty) {
        this.difficulty = d;
    }

    public setLanguage(lang: 'zh' | 'en') {
        this.language = lang;
    }

    public setGameState(state: GameState) {
        this.gameState = state;
        
        if (state === GameState.CALIBRATION) {
            this.cursor = { x: this.width * 0.5, y: this.height / 2 };
            this.calibrationProgress = 0;
            this.lives = 3;
            this.callbacks.onLivesUpdate(3);
            this.resetEffects();
        } else if (state === GameState.PLAYING) {
             this.entityManager.clear();
             this.particleSystem.clear();
             this.slicePath = [];
             this.spawnTimer = 0;
             this.difficultyMultiplier = 1;
             this.comboCount = 0;
             this.lives = 3;
             this.specialCooldown = 0;
             this.callbacks.onLivesUpdate(3);
             this.resetEffects();
        }
    }

    private resetEffects() {
        this.activeEffect = null;
        this.callbacks.onEffectChange(null);
        this.trailEffect = { type: 'normal', timer: 0, color: '' };
        this.specialCooldown = 0;
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

        // Smoothing
        const alpha = 0.2; 
        const dx = targetX - prevX;
        const dy = targetY - prevY;
        const newX = prevX + dx * alpha;
        const newY = prevY + dy * alpha;
        
        const clampedX = Math.max(0, Math.min(this.width, newX));
        const clampedY = Math.max(0, Math.min(this.height, newY));

        this.cursor = { x: clampedX, y: clampedY };
        this.callbacks.onCursorMove(clampedX, clampedY);

        // Visuals
        if (Math.hypot(dx, dy) > 10) {
            this.particleSystem.spawnSparkles(clampedX, clampedY);
        }

        this.slicePath.push({ x: clampedX, y: clampedY, life: BLADE_LIFE, pointerId: 0 });
        
        if (this.gameState === GameState.PLAYING) {
            this.checkCollisions(this.prevCursor, this.cursor);
            
            // Mirror Mode Logic
            if (this.activeEffect?.type === EffectType.MIRROR_MODE) {
                const mirrorP1 = { x: this.width - this.prevCursor.x, y: this.prevCursor.y };
                const mirrorP2 = { x: this.width - this.cursor.x, y: this.cursor.y };
                // Add mirror trail for visuals (mocking it by just drawing in renderer, 
                // but checking collision here is key)
                this.checkCollisions(mirrorP1, mirrorP2);
            }
        }
    }

    private checkCollisions(p1: Point, p2: Point) {
        let hitSomething = false;
        
        // Determine Hitbox Size
        let currentHitbox = HITBOX_RADIUS;
        if (this.activeEffect?.type === EffectType.GIANT_CURSOR) currentHitbox *= 2.5;
        if (this.activeEffect?.type === EffectType.TINY_CURSOR) currentHitbox *= 0.4;
        
        // Chain reaction doesn't increase cursor, it increases logic area in sliceEntity... 
        // actually no, sliceEntity is only called IF collision happened.
        // So for chain reaction we rely on the first hit.

        this.entityManager.entities.forEach(entity => {
            if (entity.isSliced) return;

            const distSeg = pointToSegmentDistance(entity.x, entity.y, p1.x, p1.y, p2.x, p2.y);
            const distPoint = Math.hypot(entity.x - p2.x, entity.y - p2.y);
            
            if (distSeg < entity.radius + currentHitbox || distPoint < entity.radius + currentHitbox) {
                this.sliceEntity(entity);
                hitSomething = true;
            }
        });

        if (hitSomething) {
            this.comboTimer = COMBO_TIMER_MAX;
            this.comboCount++;
            if (this.comboCount > 1) {
                const t = TRANSLATIONS[this.language].gameplay;
                this.particleSystem.createFloatingText(
                    p2.x, p2.y,
                    `${this.comboCount} ${t.combo}`,
                    '#ffd700'
                );
            }
        }
    }

    private sliceEntity(entity: GameEntity) {
        if (entity.isSliced) return;
        entity.isSliced = true;
        
        // Visuals
        this.particleSystem.createExplosion(entity.x, entity.y, entity.color, entity.type === 'bomb');
        
        // Handle Special Effect Activation
        if (entity.type === 'special' && entity.effectType) {
            const t = TRANSLATIONS[this.language];
            this.activateEffect(entity.effectType);
            
            // Get short name for floating text
            const fullItemName = t.items[entity.effectType] || '';
            const shortName = fullItemName.split(' (')[0] || t.gameplay.powerUp;

            this.particleSystem.createFloatingText(entity.x, entity.y, shortName, '#ffffff');
            
            this.trailEffect = { type: 'special', timer: 20, color: entity.color };
            this.callbacks.onScoreUpdate(entity.scoreValue);
            return;
        }

        // Score Calculation
        let points = entity.scoreValue;
        if (this.comboCount > 3) points *= 2;
        if (this.activeEffect?.type === EffectType.HIGH_STAKES) points *= 2; // Double Score
        if (this.activeEffect?.type === EffectType.DISCO_FEVER) points *= 3; // Triple Score

        this.callbacks.onScoreUpdate(points);
        
        if (entity.type === 'bomb') {
            const t = TRANSLATIONS[this.language].gameplay;
            if (this.activeEffect?.type === EffectType.INVINCIBILITY) {
                // Shielded!
                this.particleSystem.createFloatingText(entity.x, entity.y, t.blocked, '#ffff00');
                return;
            }

            this.shake = { intensity: 60, duration: 40 };
            this.comboCount = 0;
            
            this.trailEffect = { type: 'bomb', timer: 20, color: '#ff0000' };
            this.callbacks.onDamage();
            
            let damage = 1;
            if (this.activeEffect?.type === EffectType.HIGH_STAKES) damage = 2; // Double Damage

            this.lives -= damage;
            this.callbacks.onLivesUpdate(this.lives);

            if (this.lives <= 0) {
                setTimeout(() => this.callbacks.onGameOver(), 500);
            }

        } else {
            this.particleSystem.createSplat(entity.x, entity.y, entity.color);
            if (this.trailEffect.type !== 'bomb' && this.trailEffect.type !== 'special') {
                this.trailEffect = { type: 'fruit', timer: 8, color: entity.color };
            }

            // CHAIN REACTION LOGIC
            if (this.activeEffect?.type === EffectType.CHAIN_REACTION) {
                this.entityManager.entities.forEach(neighbor => {
                    if (!neighbor.isSliced && neighbor.type !== 'bomb') {
                         const dist = Math.hypot(entity.x - neighbor.x, entity.y - neighbor.y);
                         if (dist < 300) { // Chain radius
                             // Visual electric arc
                             // We don't have a drawLine method easily accessible in logic, but we can spawn particles
                             const midX = (entity.x + neighbor.x) / 2;
                             const midY = (entity.y + neighbor.y) / 2;
                             this.particleSystem.spawnSparkles(midX, midY);
                             // Recursive slice? No, just slice immediate neighbors to prevent infinite loop/stack overflow if not careful
                             // But wait, sliceEntity checks isSliced, so recursion is safe.
                             setTimeout(() => this.sliceEntity(neighbor), 50); // Small delay for visual ripple
                         }
                    }
                });
            }
        }
    }

    private activateEffect(type: EffectType) {
        const config = SPECIAL_FRUITS[type];
        if (!config) return;
        const t = TRANSLATIONS[this.language].gameplay;

        // Instant Effects
        if (type === EffectType.EXTRA_LIFE) {
            this.lives = Math.min(MAX_LIVES, this.lives + 1);
            this.callbacks.onLivesUpdate(this.lives);
            this.particleSystem.createFloatingText(this.width/2, this.height/2, t.extraLife, '#ff0088');
            this.specialCooldown = 180;
            return;
        }
        if (type === EffectType.BOMB_TRAP) {
            this.entityManager.spawnBombSwarm();
             this.particleSystem.createFloatingText(this.width/2, this.height/2, t.trap, '#000000');
             this.specialCooldown = 180;
            return;
        }
        if (type === EffectType.BLAST) {
            let clearedCount = 0;
            this.entityManager.entities.forEach(e => {
                if (!e.isSliced && e.type !== 'special') {
                    e.isSliced = true;
                    this.particleSystem.createExplosion(e.x, e.y, e.color, e.type === 'bomb');
                    clearedCount++;
                }
            });
            this.callbacks.onScoreUpdate(clearedCount * 5);
             this.particleSystem.createFloatingText(this.width/2, this.height/2, t.blast, '#FF6347');
             this.specialCooldown = 180;
            return;
        }
        if (type === EffectType.BONUS_POINTS) {
            this.callbacks.onScoreUpdate(50);
            this.particleSystem.createFloatingText(this.width/2, this.height/2, t.bonusPoints, '#FFD700');
            this.specialCooldown = 180;
            return;
        }
        if (type === EffectType.GOLDEN_SNITCH) {
             // Instant logic handled in slicing score, just adding effect text
             this.particleSystem.createFloatingText(this.width/2, this.height/2, t.caughtIt, '#FFD700');
             this.specialCooldown = 180;
             return;
        }

        // Duration Effects
        this.activeEffect = {
            type: type,
            timer: config.duration,
            maxDuration: config.duration
        };
        this.callbacks.onEffectChange(this.activeEffect);
    }

    private animate = () => {
        if (!this.renderer) return;
        const config = DIFFICULTY_SETTINGS[this.difficulty];

        // 1. Shake Logic
        let shakeX = 0;
        let shakeY = 0;
        if (this.shake.duration > 0) {
            shakeX = (Math.random() - 0.5) * this.shake.intensity;
            shakeY = (Math.random() - 0.5) * this.shake.intensity;
            this.shake.duration--;
            this.shake.intensity = Math.max(0, this.shake.intensity * 0.9);
        }

        // 2. Setup Render
        this.renderer.resetTransform();
        this.renderer.clear();

        // New: Draw Disco Background if active
        if (this.activeEffect?.type === EffectType.DISCO_FEVER) {
            this.renderer.drawDiscoBackground();
        }

        if (shakeX !== 0 || shakeY !== 0) {
            this.renderer.setShake(shakeX, shakeY);
        }

        // 3. Update Systems
        if (this.gameState === GameState.CALIBRATION) {
             if (this.isCursorActive) {
                this.calibrationProgress = Math.min(1.0, this.calibrationProgress + 0.015);
                if (this.calibrationProgress >= 1.0) this.callbacks.onCalibrationComplete();
            } else {
                this.calibrationProgress = Math.max(0, this.calibrationProgress - 0.02);
            }
            this.callbacks.onCalibrationProgress(this.calibrationProgress);
        }

        if (this.gameState === GameState.PLAYING) {
            // Update Active Effect
            if (this.activeEffect) {
                this.activeEffect.timer--;
                if (this.activeEffect.timer <= 0) {
                    this.activeEffect = null;
                    this.callbacks.onEffectChange(null);
                    this.specialCooldown = 180; // Start 3s cooldown after effect ends
                }
            } else {
                // Cooldown for spawning next special
                if (this.specialCooldown > 0) {
                    this.specialCooldown--;
                }
            }

            // Spawning Logic
            this.spawnTimer--;
            let spawnRate = config.spawnRate;
            if (this.activeEffect?.type === EffectType.FRUIT_RAIN) spawnRate = 10; // Intense
            if (this.activeEffect?.type === EffectType.FRENZY) spawnRate = 8; // Super fast

            if (this.spawnTimer <= 0) {
                let spawnCount = 1;
                
                // Burst logic
                let chance = config.burstChance + (this.difficultyMultiplier * 0.05);
                if (this.activeEffect?.type === EffectType.FRUIT_RAIN) {
                    chance = 0.8;
                    spawnCount = 3; 
                }
                
                if (Math.random() < chance) {
                    spawnCount += Math.floor(Math.random() * 2) + 1;
                }
                if (this.difficultyMultiplier > 1.8 && Math.random() < 0.2) {
                    spawnCount += 2;
                }

                for (let i = 0; i < spawnCount; i++) {
                    this.entityManager.spawn(
                        this.difficulty, 
                        this.difficultyMultiplier,
                        this.activeEffect ? this.activeEffect.type : EffectType.NONE,
                        this.specialCooldown <= 0 // Pass allowSpecial
                    );
                }

                this.difficultyMultiplier = Math.min(config.maxMult, this.difficultyMultiplier + 0.002);
                this.spawnTimer = Math.max(10, (spawnRate / this.difficultyMultiplier) * (0.7 + Math.random() * 0.6));
            }

            if (this.comboTimer > 0) this.comboTimer--;
            else this.comboCount = 0;

            this.entityManager.update(
                this.activeEffect ? this.activeEffect.type : EffectType.NONE,
                this.cursor
            );
        }

        this.particleSystem.update();

        // Trail Update
        this.slicePath.forEach(p => p.life--);
        this.slicePath = this.slicePath.filter(p => p.life > 0);
        if (this.trailEffect.timer > 0) {
            this.trailEffect.timer--;
        } else {
            this.trailEffect.type = 'normal';
        }

        // 4. Render Systems
        // Check for Pixel Storm
        const isPixelated = this.activeEffect?.type === EffectType.PIXEL_STORM;

        this.particleSystem.draw(this.renderer); 
        this.renderer.drawEntities(this.entityManager.entities, this.activeEffect?.type);
        
        // Draw Trail
        const isRainbow = this.comboCount >= 5;
        let renderIsRainbow = false;
        let renderColor: string | undefined = undefined;
        let renderWidthMult = 1;
        let renderFlicker = false;

        if (this.trailEffect.type === 'bomb') {
            renderColor = '#ff0000';
            renderFlicker = true;
        } else if (this.trailEffect.type === 'special') {
             renderIsRainbow = true;
             renderWidthMult = 2.0;
        } else if (isRainbow) {
            renderIsRainbow = true;
            renderWidthMult = 1.3 + Math.sin(Date.now() / 150) * 0.3;
        } else if (this.trailEffect.type === 'fruit') {
            renderColor = this.trailEffect.color;
            renderWidthMult = 1.5;
        }

        if (this.activeEffect?.type === EffectType.CHAIN_REACTION) {
            // Chain reaction gets an electric trail visual? Or just wider?
            renderWidthMult *= 1.5;
            renderIsRainbow = true; // Electric look
        }

        this.renderer.drawTrails(this.slicePath, { 
            isRainbow: renderIsRainbow,
            color: renderColor,
            widthMultiplier: renderWidthMult,
            isFlickering: renderFlicker
        });

        // Draw Mirror Trail
        if (this.activeEffect?.type === EffectType.MIRROR_MODE) {
             const mirrorPath = this.slicePath.map(p => ({
                 ...p,
                 x: this.width - p.x
             }));
             this.renderer.drawTrails(mirrorPath, {
                 isRainbow: true,
                 widthMultiplier: renderWidthMult,
                 isFlickering: true
             });
        }

        if (this.gameState === GameState.CALIBRATION) {
            this.renderer.drawCalibration(this.calibrationProgress, this.width, this.height, this.language);
        }
    }
}
