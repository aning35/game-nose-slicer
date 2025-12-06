
import { Particle, Splat, FloatingText } from '../types';
import { MAX_PARTICLES, MAX_SPLATS } from '../constants';
import { generateId } from '../utils/math';
import { Renderer } from './Renderer';

export class ParticleSystem {
    private particles: Particle[] = [];
    private splats: Splat[] = [];
    private texts: FloatingText[] = [];

    clear() {
        this.particles = [];
        this.splats = [];
        this.texts = [];
    }

    update() {
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

        // Limit maximums
        if (this.splats.length > MAX_SPLATS) this.splats.shift();
        if (this.particles.length > MAX_PARTICLES) this.particles = this.particles.slice(this.particles.length - MAX_PARTICLES);
    }

    draw(renderer: Renderer) {
        renderer.drawSplats(this.splats);
        renderer.drawParticles(this.particles);
        renderer.drawFloatingTexts(this.texts);
    }

    spawnSparkles(x: number, y: number) {
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

    createSplat(x: number, y: number, color: string) {
        this.splats.push({
            id: generateId(),
            x, y,
            color,
            size: Math.random() * 50 + 50,
            alpha: 0.8,
            rotation: Math.random() * Math.PI * 2
        });
    }

    createFloatingText(x: number, y: number, text: string, color: string) {
        this.texts.push({
            id: generateId(),
            x,
            y: y - 50,
            text,
            color,
            scale: 1,
            life: 1.0,
            vy: -2
        });
    }

    createExplosion(x: number, y: number, color: string, isBomb: boolean) {
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
            // Fire
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
            // Juice Core
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

            // Mist
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

            // Droplets
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
}
