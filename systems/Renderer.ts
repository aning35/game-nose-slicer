
import { GameEntity, Particle, SlicePoint, Point, Splat, FloatingText, GameState } from '../types';
import { BLADE_WIDTH, TRANSLATIONS } from '../constants';
import { normalizeVector, perpendicularVector } from '../utils/math';

export class Renderer {
    private ctx: CanvasRenderingContext2D;
    private width: number;
    private height: number;
    private rainbowHue: number = 0;

    constructor(ctx: CanvasRenderingContext2D, width: number, height: number) {
        this.ctx = ctx;
        this.width = width;
        this.height = height;
    }

    clear() {
        this.ctx.clearRect(0, 0, this.width, this.height);
    }

    resize(w: number, h: number) {
        this.width = w;
        this.height = h;
    }

    setShake(offsetX: number, offsetY: number) {
        this.ctx.setTransform(1, 0, 0, 1, offsetX, offsetY);
    }

    drawDiscoBackground() {
        const hue = (Date.now() / 5) % 360;
        this.ctx.save();
        this.ctx.fillStyle = `hsla(${hue}, 100%, 50%, 0.1)`;
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        // Strobe lights
        this.ctx.globalCompositeOperation = 'overlay';
        const cols = 5;
        const time = Date.now() / 200;
        for(let i=0; i<cols; i++) {
            const x = (i / cols) * this.width;
            const alpha = (Math.sin(time + i) + 1) / 2 * 0.2;
            this.ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
            this.ctx.fillRect(x, 0, this.width/cols, this.height);
        }
        this.ctx.restore();
    }

    resetTransform() {
        this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    }

    // Draw background splatter "Juice"
    drawSplats(splats: Splat[]) {
        splats.forEach(s => {
            this.ctx.save();
            this.ctx.translate(s.x, s.y);
            this.ctx.rotate(s.rotation);
            this.ctx.globalAlpha = s.alpha;
            this.ctx.fillStyle = s.color;
            
            // Draw an organic blob shape
            this.ctx.beginPath();
            this.ctx.arc(0, 0, s.size, 0, Math.PI * 2);
            this.ctx.arc(s.size * 0.5, s.size * 0.5, s.size * 0.6, 0, Math.PI * 2);
            this.ctx.arc(-s.size * 0.4, s.size * 0.6, s.size * 0.5, 0, Math.PI * 2);
            this.ctx.fill();
            
            this.ctx.restore();
        });
        this.ctx.globalAlpha = 1.0;
    }

    drawEntities(entities: GameEntity[]) {
        entities.forEach(entity => {
            this.ctx.save();
            this.ctx.translate(entity.x, entity.y);
            this.ctx.rotate(entity.rotation);
            this.ctx.scale(entity.scale, entity.scale);
            
            this.ctx.shadowColor = 'rgba(0,0,0,0.5)';
            this.ctx.shadowBlur = 20;
            
            // Special Halo
            if (entity.type === 'special') {
                this.ctx.shadowColor = entity.color;
                this.ctx.shadowBlur = 30;
                this.ctx.beginPath();
                this.ctx.arc(0, 0, entity.radius, 0, Math.PI * 2);
                this.ctx.strokeStyle = `rgba(255, 255, 255, ${0.5 + Math.sin(Date.now() * 0.01) * 0.5})`;
                this.ctx.lineWidth = 5;
                this.ctx.stroke();
            }

            this.ctx.font = `${entity.radius * 2}px "Segoe UI Emoji", sans-serif`;
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(entity.emoji, 0, 8);
            this.ctx.restore();
        });
    }

    drawParticles(particles: Particle[]) {
        particles.forEach(p => {
            this.ctx.globalAlpha = Math.max(0, p.life);
            this.ctx.fillStyle = p.color;
            this.ctx.save();
            this.ctx.shadowColor = p.color;
            this.ctx.shadowBlur = 10;
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.restore();
            this.ctx.globalAlpha = 1.0;
        });
    }

    drawFloatingTexts(texts: FloatingText[]) {
        texts.forEach(t => {
            this.ctx.save();
            this.ctx.translate(t.x, t.y);
            const scale = t.scale * (1 + Math.sin(Date.now() / 50) * 0.1); // Pulse
            this.ctx.scale(scale, scale);
            
            this.ctx.font = "900 40px sans-serif";
            this.ctx.textAlign = "center";
            this.ctx.fillStyle = t.color;
            this.ctx.strokeStyle = "white";
            this.ctx.lineWidth = 3;
            
            this.ctx.shadowColor = t.color;
            this.ctx.shadowBlur = 10;
            
            this.ctx.strokeText(t.text, 0, 0);
            this.ctx.fillText(t.text, 0, 0);
            
            this.ctx.restore();
        });
    }

    drawTrails(points: SlicePoint[], options: { 
        isRainbow: boolean, 
        color?: string, 
        widthMultiplier?: number, 
        isFlickering?: boolean 
    }) {
        if (points.length < 2) return;

        this.rainbowHue = (this.rainbowHue + 5) % 360;
        
        // Determine Color
        let color = options.color;
        if (!color) {
             color = options.isRainbow ? `hsl(${this.rainbowHue}, 100%, 60%)` : '#00ffff';
        }

        // Determine Width
        const widthMult = options.widthMultiplier || 1;
        const baseWidth = BLADE_WIDTH * widthMult;
        
        const coreColor = '#ffffff';

        this.ctx.save();
        this.ctx.lineJoin = 'round';
        this.ctx.lineCap = 'round';
        
        // Flicker effect (Bomb hit)
        const alpha = options.isFlickering ? 0.3 + Math.random() * 0.4 : 0.5;
        
        // Pass 1: Outer Glow
        this.ctx.shadowColor = color;
        this.ctx.shadowBlur = options.isFlickering ? 40 : 25 * widthMult;
        this.ctx.fillStyle = color;
        this.ctx.globalAlpha = alpha;
        
        // Draw wider for glow
        this.drawRibbonPath(points, baseWidth + 15 * widthMult);
        this.ctx.fill();

        // Pass 2: Inner Core
        this.ctx.shadowBlur = 15;
        this.ctx.fillStyle = coreColor;
        this.ctx.globalAlpha = options.isFlickering ? 0.7 : 0.9;
        this.drawRibbonPath(points, baseWidth);
        this.ctx.fill();
        
        this.ctx.restore();

        // Head Orb
        const head = points[points.length - 1];
        this.ctx.save();
        this.ctx.shadowColor = color;
        this.ctx.shadowBlur = 30 * widthMult;
        this.ctx.fillStyle = (options.isRainbow || options.color) ? '#fff' : color;
        
        const headSize = options.isFlickering ? (baseWidth + 5) * (0.8 + Math.random() * 0.4) : baseWidth + 5;

        this.ctx.beginPath();
        this.ctx.arc(head.x, head.y, headSize, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.restore();
    }

    private drawRibbonPath(points: SlicePoint[], maxBaseWidth: number) {
        this.ctx.beginPath();
        const leftSide: Point[] = [];
        const rightSide: Point[] = [];

        for (let i = 0; i < points.length - 1; i++) {
            const p1 = points[i];
            const p2 = points[i+1];
            const dx = p2.x - p1.x;
            const dy = p2.y - p1.y;
            const norm = normalizeVector(dx, dy);
            const perp = perpendicularVector(norm.x, norm.y);
            const progress = i / (points.length - 1); 
            const width = maxBaseWidth * progress; // Taper to 0 at tail

            leftSide.push({ x: p1.x + perp.x * width, y: p1.y + perp.y * width });
            rightSide.push({ x: p1.x - perp.x * width, y: p1.y - perp.y * width });
        }

        const tip = points[points.length - 1];
        leftSide.push(tip);
        rightSide.push(tip);

        if (leftSide.length > 0) {
            this.ctx.moveTo(leftSide[0].x, leftSide[0].y);
            for (let i = 1; i < leftSide.length; i++) this.ctx.lineTo(leftSide[i].x, leftSide[i].y);
            for (let i = rightSide.length - 1; i >= 0; i--) this.ctx.lineTo(rightSide[i].x, rightSide[i].y);
            this.ctx.closePath();
        }
    }

    drawCalibration(progress: number, width: number, height: number, lang: 'zh' | 'en') {
        const text = TRANSLATIONS[lang];

        this.ctx.save();
        this.ctx.fillStyle = '#fff';
        this.ctx.font = 'bold 30px sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.shadowColor = 'cyan';
        this.ctx.shadowBlur = 10;
        this.ctx.fillText(text.calibrationTitle, width / 2, height * 0.3);
        
        this.ctx.font = '20px sans-serif';
        this.ctx.fillStyle = '#ccc';
        this.ctx.fillText(text.calibrationDesc, width / 2, height * 0.3 + 40);
        
        const barW = 300;
        const barH = 20;
        const barX = (width - barW) / 2;
        const barY = height * 0.7;

        this.ctx.strokeStyle = '#fff';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(barX, barY, barW, barH);
        
        this.ctx.fillStyle = progress > 0.9 ? '#00ff00' : 'cyan';
        this.ctx.fillRect(barX + 2, barY + 2, (barW - 4) * progress, barH - 4);
        this.ctx.restore();
    }
}
