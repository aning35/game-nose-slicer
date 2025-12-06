
import { GameEntity, Difficulty, EntityType, EffectType, Point } from '../types';
import { 
  GRAVITY, 
  DIFFICULTY_SETTINGS, 
  FRUIT_TYPES, 
  BOMB_TYPE, 
  POINTS_FRUIT, 
  POINTS_BOMB,
  SPECIAL_FRUITS,
  POINTS_SPECIAL
} from '../constants';
import { generateId } from '../utils/math';
import { Renderer } from './Renderer';

export class EntityManager {
    public entities: GameEntity[] = [];
    private width: number;
    private height: number;

    constructor(width: number, height: number) {
        this.width = width;
        this.height = height;
    }

    resize(w: number, h: number) {
        this.width = w;
        this.height = h;
    }

    clear() {
        this.entities = [];
    }

    update(activeEffect: EffectType, cursor: Point) {
        // Update physics
        this.entities.forEach(entity => {
            if (activeEffect === EffectType.FREEZE) {
                // Do nothing, suspended animation
                return;
            }

            let vx = entity.vx;
            let vy = entity.vy;
            let gravity = GRAVITY;

            // Slow Motion Physics
            if (activeEffect === EffectType.SLOW_MOTION) {
                vx *= 0.5;
                vy *= 0.5;
                gravity *= 0.5;
            }

            // Magnet Physics
            if (activeEffect === EffectType.MAGNET && entity.type !== 'bomb') {
                const dx = cursor.x - entity.x;
                const dy = cursor.y - entity.y;
                const dist = Math.hypot(dx, dy);
                if (dist < 400) { // Range
                    entity.x += dx * 0.05;
                    entity.y += dy * 0.05;
                }
            }

            entity.x += vx;
            entity.y += vy;
            entity.vy += gravity;
            entity.rotation += entity.rotationSpeed * (activeEffect === EffectType.SLOW_MOTION ? 0.5 : 1);
            
            // Mark as sliced if it falls off bottom (missed)
            // But only if it was moving down (vy > 0) to avoid killing things just spawned at bottom
            if (entity.y > this.height + 100 && entity.vy > 0) {
                entity.isSliced = true;
            }
        });

        // Filter out dead/off-screen entities
        this.entities = this.entities.filter(e => {
            const outOfBoundsBottom = e.y > this.height + 200;
            const outOfBoundsSides = e.x < -200 || e.x > this.width + 200;
            return !(e.isSliced || outOfBoundsBottom || outOfBoundsSides);
        });
    }

    spawn(difficulty: Difficulty, difficultyMultiplier: number, activeEffect: EffectType) {
        const config = DIFFICULTY_SETTINGS[difficulty];

        let isBomb = false;
        let isSpecial = false;
        
        // 1. Determine Type based on Active Effect overrides
        if (activeEffect === EffectType.FRUIT_RAIN) {
            isBomb = false; // No bombs allowed
        } else if (activeEffect === EffectType.FRENZY) {
             isBomb = Math.random() < 0.1; // Reduced bomb chance in frenzy
        } else {
            // Normal Bomb Logic
            isBomb = Math.random() < config.bombChance + (difficultyMultiplier * 0.05);
        }

        // 2. Special Fruit Logic (Only if no effect active, and not a bomb turn)
        // Probability: 5% base
        if (activeEffect === EffectType.NONE && !isBomb && Math.random() < 0.08) {
            isSpecial = true;
        }

        let typeData;
        let effectType: EffectType | undefined = undefined;

        if (isSpecial) {
            const keys = Object.keys(SPECIAL_FRUITS);
            // Weighted random could go here, for now simple random
            const key = keys[Math.floor(Math.random() * keys.length)];
            typeData = SPECIAL_FRUITS[key];
            effectType = typeData.effect;
        } else if (isBomb) {
            typeData = BOMB_TYPE;
        } else {
            typeData = FRUIT_TYPES[Math.floor(Math.random() * FRUIT_TYPES.length)];
        }
        
        // 3. Spawn Position & Velocity
        const spawnSource = Math.random();
        
        let x, y, vx, vy;
        let speedMult = config.speedMult;

        if (activeEffect === EffectType.FRENZY) {
            speedMult *= 1.5;
        } else if (activeEffect === EffectType.SLOW_MOTION) {
            speedMult *= 0.6; // Launch slower too
        }

        if (spawnSource < 0.6) {
            // BOTTOM SPAWN (60%)
            const margin = 100;
            x = margin + Math.random() * (this.width - margin * 2);
            y = this.height + 60;
            
            // Bias horizontal velocity towards center
            const centerBias = (this.width/2 - x) * 0.015;
            vx = ((Math.random() - 0.5) * 10 + centerBias) * speedMult;
            vy = -(Math.random() * 7 + 16 + (difficultyMultiplier * 0.5)) * speedMult; 
        } else if (spawnSource < 0.8) {
            // LEFT SPAWN (20%)
            x = -60;
            y = this.height * (0.5 + Math.random() * 0.4); 
            vx = (Math.random() * 10 + 10 + (difficultyMultiplier)) * speedMult; 
            vy = -(Math.random() * 10 + 12) * speedMult; 
        } else {
            // RIGHT SPAWN (20%)
            x = this.width + 60;
            y = this.height * (0.5 + Math.random() * 0.4);
            vx = -(Math.random() * 10 + 10 + (difficultyMultiplier)) * speedMult;
            vy = -(Math.random() * 10 + 12) * speedMult;
        }

        // Add noise
        x += (Math.random() - 0.5) * 10;
        y += (Math.random() - 0.5) * 10;

        const entity: GameEntity = {
            id: generateId(),
            type: isSpecial ? 'special' : (isBomb ? 'bomb' : 'fruit'),
            effectType: effectType,
            x,
            y,
            vx,
            vy,
            rotation: Math.random() * Math.PI,
            rotationSpeed: (Math.random() - 0.5) * 0.4,
            radius: isSpecial ? 50 : 60, // Specials slightly smaller?
            emoji: typeData.emoji,
            color: typeData.color,
            isSliced: false,
            scoreValue: isSpecial ? POINTS_SPECIAL : (isBomb ? POINTS_BOMB : POINTS_FRUIT),
            scale: 1,
        };
        this.entities.push(entity);
    }

    spawnBombSwarm() {
        for (let i = 0; i < 5; i++) {
             const x = this.width * (0.2 + 0.6 * (i/4));
             const y = this.height + 50 + (i % 2) * 50;
             const entity: GameEntity = {
                id: generateId(),
                type: 'bomb',
                x,
                y,
                vx: (Math.random() - 0.5) * 5,
                vy: -(Math.random() * 5 + 15),
                rotation: 0,
                rotationSpeed: 0.1,
                radius: 60,
                emoji: BOMB_TYPE.emoji,
                color: BOMB_TYPE.color,
                isSliced: false,
                scoreValue: POINTS_BOMB,
                scale: 1
             };
             this.entities.push(entity);
        }
    }

    draw(renderer: Renderer) {
        renderer.drawEntities(this.entities);
    }
}
