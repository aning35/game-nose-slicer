import React, { useRef, useEffect, useCallback, useState } from 'react';
import { GameEntity, Particle, SlicePoint, GameState, Point, Splat, FloatingText, CameraShake } from '../types';
import { 
  GRAVITY, 
  BLADE_LIFE, 
  SPAWN_RATE_INITIAL,
  FRUIT_TYPES, 
  BOMB_TYPE,
  POINTS_FRUIT,
  POINTS_BOMB,
  MAX_SPLATS,
  COMBO_TIMER_MAX,
  HITBOX_RADIUS
} from '../constants';
import { generateId, pointToSegmentDistance } from '../utils/math';
import { InputHandler } from '../systems/InputHandler';
import { Renderer } from '../systems/Renderer';
import { Heart, Trophy, Zap } from 'lucide-react';

interface GameCanvasProps {
  gameState: GameState;
  score: number;
  highScore: number;
  onScoreUpdate: (scoreChange: number) => void;
  onGameOver: () => void;
  onCalibrationComplete?: () => void;
  setScore: React.Dispatch<React.SetStateAction<number>>;
}

const GameCanvas: React.FC<GameCanvasProps> = ({ 
  gameState, 
  score,
  highScore,
  onScoreUpdate, 
  onGameOver, 
  onCalibrationComplete,
  setScore 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const requestRef = useRef<number>(0);
  
  // Systems
  const inputHandlerRef = useRef<InputHandler | null>(null);
  const rendererRef = useRef<Renderer | null>(null);

  // Entities
  const entitiesRef = useRef<GameEntity[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const splatsRef = useRef<Splat[]>([]);
  const textsRef = useRef<FloatingText[]>([]);
  const slicePathRef = useRef<SlicePoint[]>([]);
  
  // Gameplay State
  const spawnTimerRef = useRef<number>(0);
  const difficultyMultiplierRef = useRef<number>(1);
  const comboCountRef = useRef<number>(0);
  const comboTimerRef = useRef<number>(0);
  const shakeRef = useRef<CameraShake>({ intensity: 0, duration: 0 });
  
  // Dimensions
  const widthRef = useRef(window.innerWidth);
  const heightRef = useRef(window.innerHeight);

  // Cursor (Nose)
  const cursorRef = useRef<Point>({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
  const prevCursorRef = useRef<Point>({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
  const isCursorActiveRef = useRef<boolean>(false);
  const calibrationProgressRef = useRef(0);

  // Local UI State
  const [lives, setLives] = useState(3);
  const [isHit, setIsHit] = useState(false);

  // --- Initialization ---

  useEffect(() => {
    const handleResize = () => {
      widthRef.current = window.innerWidth;
      heightRef.current = window.innerHeight;
      if (canvasRef.current && rendererRef.current) {
        canvasRef.current.width = window.innerWidth;
        canvasRef.current.height = window.innerHeight;
        rendererRef.current.resize(window.innerWidth, window.innerHeight);
      }
      if (inputHandlerRef.current) {
          inputHandlerRef.current.updateDimensions(window.innerWidth, window.innerHeight);
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (canvasRef.current && videoRef.current) {
        const ctx = canvasRef.current.getContext('2d');
        if (ctx) {
            rendererRef.current = new Renderer(ctx, widthRef.current, heightRef.current);
        }

        inputHandlerRef.current = new InputHandler(
            videoRef.current, 
            widthRef.current, 
            heightRef.current,
            (results) => {
                if (results.length > 0) {
                    processNoseMovement(results[0].x, results[0].y);
                    isCursorActiveRef.current = true;
                } else {
                    isCursorActiveRef.current = false;
                }
            }
        );
        inputHandlerRef.current.initialize();
    }

    return () => {
        if (inputHandlerRef.current) inputHandlerRef.current.cleanup();
    };
  }, []);

  // --- Nose Processing Logic ---
  const processNoseMovement = (targetX: number, targetY: number) => {
      const prevX = cursorRef.current.x;
      const prevY = cursorRef.current.y;
      
      prevCursorRef.current = { x: prevX, y: prevY };

      // Heavy Kalman-like smoothing for steady head control
      const dx = targetX - prevX;
      const dy = targetY - prevY;
      
      const alpha = 0.2; // Lower value = smoother, heavier feel

      const newX = prevX + dx * alpha;
      const newY = prevY + dy * alpha;
      const clampedX = Math.max(0, Math.min(widthRef.current, newX));
      const clampedY = Math.max(0, Math.min(heightRef.current, newY));

      cursorRef.current = { x: clampedX, y: clampedY };

      // Generate Sparkles if moving fast
      const dist = Math.hypot(dx, dy);
      if (dist > 10) spawnSparkles(clampedX, clampedY);

      if (gameState === GameState.PLAYING) {
          handleInput(clampedX, clampedY, prevX, prevY);
      }
  };

  const spawnSparkles = (x: number, y: number) => {
      for(let i=0; i<2; i++) {
          particlesRef.current.push({
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
  };

  // Reset Game
  useEffect(() => {
    if (gameState === GameState.CALIBRATION) {
        cursorRef.current = { x: widthRef.current * 0.5, y: heightRef.current / 2 };
        calibrationProgressRef.current = 0;
        setLives(3);
    } else if (gameState === GameState.PLAYING) {
         entitiesRef.current = [];
         particlesRef.current = [];
         splatsRef.current = [];
         textsRef.current = [];
         slicePathRef.current = [];
         spawnTimerRef.current = 0;
         difficultyMultiplierRef.current = 1;
         comboCountRef.current = 0;
         setScore(0);
         setLives(3);
    }
  }, [gameState, setScore]);

  // Logic
  const spawnEntity = () => {
    const isBomb = Math.random() < 0.15 + (difficultyMultiplierRef.current * 0.05);
    const typeData = isBomb ? BOMB_TYPE : FRUIT_TYPES[Math.floor(Math.random() * FRUIT_TYPES.length)];
    
    const margin = 100;
    const x = margin + Math.random() * (widthRef.current - margin * 2);
    const y = heightRef.current + 50; // Spawn from bottom up

    const vx = (Math.random() - 0.5) * 4; 
    const vy = -(Math.random() * 5 + 8 + (difficultyMultiplierRef.current * 0.5)); 

    const entity: GameEntity = {
      id: generateId(),
      type: isBomb ? 'bomb' : 'fruit',
      x,
      y,
      vx,
      vy,
      rotation: Math.random() * Math.PI,
      rotationSpeed: (Math.random() - 0.5) * 0.1,
      radius: 60,
      emoji: typeData.emoji,
      color: typeData.color,
      isSliced: false,
      scoreValue: isBomb ? POINTS_BOMB : POINTS_FRUIT,
      scale: 1,
    };
    entitiesRef.current.push(entity);
  };

  const handleInput = useCallback((x: number, y: number, prevX: number, prevY: number) => {
    slicePathRef.current.push({ x, y, life: BLADE_LIFE, pointerId: 0 });
    checkCollisions({ x: prevX, y: prevY }, { x, y });
  }, []);

  const checkCollisions = (p1: Point, p2: Point) => {
    let hitSomething = false;

    entitiesRef.current.forEach(entity => {
      if (entity.isSliced) return;

      const distSeg = pointToSegmentDistance(entity.x, entity.y, p1.x, p1.y, p2.x, p2.y);
      const distPoint = Math.hypot(entity.x - p2.x, entity.y - p2.y);
      
      // Hitbox is slightly larger for nose control
      if (distSeg < entity.radius + HITBOX_RADIUS || distPoint < entity.radius + HITBOX_RADIUS) {
        sliceEntity(entity);
        hitSomething = true;
      }
    });

    if (hitSomething) {
        comboTimerRef.current = COMBO_TIMER_MAX;
        comboCountRef.current++;
        if (comboCountRef.current > 1) {
             textsRef.current.push({
                 id: generateId(),
                 x: p2.x,
                 y: p2.y - 50,
                 text: `${comboCountRef.current} COMBO!`,
                 color: '#ffd700',
                 scale: 1,
                 life: 1.0,
                 vy: -2
             });
        }
    }
  };

  const sliceEntity = (entity: GameEntity) => {
    entity.isSliced = true;
    createExplosion(entity.x, entity.y, entity.color, entity.type === 'bomb');
    onScoreUpdate(entity.scoreValue * (comboCountRef.current > 3 ? 2 : 1));
    
    if (entity.type === 'bomb') {
        shakeRef.current = { intensity: 30, duration: 30 };
        comboCountRef.current = 0;
        
        // Damage Logic
        setIsHit(true);
        setTimeout(() => setIsHit(false), 200);
        
        setLives(prev => {
            const newLives = prev - 1;
            if (newLives <= 0) {
                // Defer game over slightly so the user sees the bomb hit
                setTimeout(() => onGameOver(), 500);
            }
            return newLives;
        });

    } else {
        createSplat(entity.x, entity.y, entity.color);
    }
  };

  const createSplat = (x: number, y: number, color: string) => {
      if (splatsRef.current.length > MAX_SPLATS) splatsRef.current.shift();
      splatsRef.current.push({
          id: generateId(),
          x, y,
          color,
          size: Math.random() * 50 + 50,
          alpha: 0.8,
          rotation: Math.random() * Math.PI * 2
      });
  };

  const createExplosion = (x: number, y: number, color: string, isBomb: boolean) => {
    if (isBomb) {
        // 1. Smoke (Dark, floats up)
        for (let i = 0; i < 20; i++) {
            particlesRef.current.push({
                id: generateId(),
                x, y,
                vx: (Math.random() - 0.5) * 15,
                vy: (Math.random() - 0.5) * 15,
                life: 1.0,
                color: '#333333',
                size: Math.random() * 15 + 10,
                gravity: -0.05, // Float up
                decay: 0.02
            });
        }
        // 2. Fire (Orange, expands)
        for (let i = 0; i < 20; i++) {
            particlesRef.current.push({
                id: generateId(),
                x, y,
                vx: (Math.random() - 0.5) * 30,
                vy: (Math.random() - 0.5) * 30,
                life: 0.8,
                color: '#ff4500',
                size: Math.random() * 10 + 5,
                gravity: 0,
                decay: 0.05
            });
        }
        // 3. Sparks (Yellow, fast, short)
        for (let i = 0; i < 15; i++) {
            particlesRef.current.push({
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
        // Juicy Fruit Explosion
        const particleCount = 30;
        
        for (let i = 0; i < particleCount; i++) {
             // Mix base color with white mist for "Juice" effect
             const isMist = Math.random() > 0.6;
             const pColor = isMist ? 'rgba(255, 255, 255, 0.8)' : color;
             const pSize = isMist ? Math.random() * 5 + 2 : Math.random() * 12 + 4;
             const pDecay = isMist ? 0.04 : Math.random() * 0.03 + 0.01;
             
             particlesRef.current.push({
                id: generateId(),
                x, y,
                vx: (Math.random() - 0.5) * (isMist ? 20 : 25),
                vy: (Math.random() - 0.5) * (isMist ? 20 : 25),
                life: 1.0,
                color: pColor, 
                size: pSize,
                gravity: isMist ? 0.1 : 0.25,
                decay: pDecay
            });
        }
    }
  };

  // Main Loop
  const animate = useCallback(() => {
    if (!rendererRef.current) return;
    const renderer = rendererRef.current;
    
    // 1. Handle Shake
    if (shakeRef.current.duration > 0) {
        const dx = (Math.random() - 0.5) * shakeRef.current.intensity;
        const dy = (Math.random() - 0.5) * shakeRef.current.intensity;
        renderer.setShake(dx, dy);
        shakeRef.current.duration--;
        shakeRef.current.intensity *= 0.9;
    } else {
        renderer.resetTransform();
    }
    
    renderer.clear();

    // 2. Logic Updates
    if (gameState === GameState.CALIBRATION) {
        if (isCursorActiveRef.current) {
            calibrationProgressRef.current += 0.015;
            if (calibrationProgressRef.current >= 1.0) {
                calibrationProgressRef.current = 1.0;
                if (onCalibrationComplete) onCalibrationComplete();
            }
        } else {
            calibrationProgressRef.current = Math.max(0, calibrationProgressRef.current - 0.02);
        }
    }

    if (gameState === GameState.PLAYING) {
        spawnTimerRef.current--;
        if (spawnTimerRef.current <= 0) {
            spawnEntity();
            difficultyMultiplierRef.current = Math.min(3, difficultyMultiplierRef.current + 0.001);
            spawnTimerRef.current = Math.max(20, SPAWN_RATE_INITIAL / difficultyMultiplierRef.current);
        }

        if (comboTimerRef.current > 0) comboTimerRef.current--;
        else comboCountRef.current = 0;

        // Passive Collision (60FPS Nose Drill)
        if (isCursorActiveRef.current) {
            entitiesRef.current.forEach(entity => {
                if (entity.isSliced) return;
                const dist = Math.hypot(entity.x - cursorRef.current.x, entity.y - cursorRef.current.y);
                if (dist < entity.radius + HITBOX_RADIUS) sliceEntity(entity);
            });
        }
    }

    // 3. Physics Updates
    entitiesRef.current.forEach(entity => {
      entity.x += entity.vx;
      entity.y += entity.vy;
      entity.vy += GRAVITY;
      entity.rotation += entity.rotationSpeed;
      if (entity.y > heightRef.current + 100 && entity.vy > 0) entity.isSliced = true; // Off screen
    });
    entitiesRef.current = entitiesRef.current.filter(e => e.y <= heightRef.current + 200 && !e.isSliced);

    particlesRef.current.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += p.gravity;
      p.life -= p.decay;
    });
    particlesRef.current = particlesRef.current.filter(p => p.life > 0);

    textsRef.current.forEach(t => {
        t.y += t.vy;
        t.life -= 0.02;
    });
    textsRef.current = textsRef.current.filter(t => t.life > 0);

    slicePathRef.current.forEach(p => p.life--);
    slicePathRef.current = slicePathRef.current.filter(p => p.life > 0);

    // 4. Render Layers
    renderer.drawSplats(splatsRef.current); // Background
    renderer.drawEntities(entitiesRef.current); // Mid
    renderer.drawParticles(particlesRef.current); // Foreground
    renderer.drawFloatingTexts(textsRef.current); // GUI World Space
    
    // Draw Nose Trail (Rainbow if High Combo)
    const isRainbow = comboCountRef.current >= 5;
    renderer.drawTrails(slicePathRef.current, isRainbow);
    
    if (gameState === GameState.CALIBRATION) {
        renderer.drawCalibration(calibrationProgressRef.current, widthRef.current, heightRef.current);
    }
    
    requestRef.current = requestAnimationFrame(animate);
  }, [gameState, onCalibrationComplete, handleInput]);

  useEffect(() => {
    requestRef.current = requestAnimationFrame(animate);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [animate]);

  return (
    <>
      <canvas ref={canvasRef} className="absolute top-0 left-0 w-full h-full" />
      
      {/* Damage Flash Overlay */}
      <div 
        className={`absolute inset-0 bg-red-600/30 pointer-events-none transition-opacity duration-200 ${isHit ? 'opacity-100' : 'opacity-0'}`} 
      />

      {/* Arcade HUD */}
      <div className="absolute top-0 left-0 w-full p-4 pointer-events-none flex justify-between items-start">
         
         {/* Score Block */}
         <div className="flex flex-col transform skew-x-[-10deg]">
             <div className="bg-gradient-to-r from-yellow-400 to-orange-500 px-6 py-2 border-b-4 border-yellow-700 shadow-lg">
                 <div className="flex items-center gap-2">
                     <span className="text-xs font-black text-yellow-900 uppercase tracking-widest">Score</span>
                 </div>
                 <div key={score} className="text-4xl font-black text-white drop-shadow-[2px_2px_0px_rgba(0,0,0,0.5)] animate-pulse-short">
                     {score.toString().padStart(5, '0')}
                 </div>
             </div>
             <div className="bg-black/50 backdrop-blur-sm px-4 py-1 flex items-center gap-2 mt-1">
                 <Trophy size={14} className="text-yellow-400"/>
                 <span className="text-white/80 font-bold text-sm tracking-wider">{highScore}</span>
             </div>
         </div>

         {/* Lives Block */}
         <div className="flex gap-2 transform skew-x-[-10deg] bg-black/40 backdrop-blur-md p-2 rounded-lg border-2 border-red-500/30">
             {[1, 2, 3].map((i) => (
                 <Heart 
                    key={i} 
                    size={32} 
                    className={`transition-all duration-300 ${i <= lives ? 'fill-red-500 text-red-600 animate-pulse-slow' : 'fill-gray-800 text-gray-700 scale-75'}`} 
                    strokeWidth={2.5}
                 />
             ))}
         </div>

      </div>

      {/* Hidden Video */}
      <div className="absolute bottom-4 right-4 w-32 h-24 border-2 border-white/20 rounded-lg overflow-hidden bg-black/50 z-50 pointer-events-none transform -scale-x-100 opacity-50 hover:opacity-100 transition-opacity">
        <video 
            ref={videoRef} 
            className="w-full h-full object-cover"
            muted 
            playsInline
        />
        <div className="absolute top-1 right-1">
            <div className={`w-2 h-2 rounded-full ${isCursorActiveRef.current ? 'bg-green-500 shadow-[0_0_5px_#0f0]' : 'bg-red-500'}`} />
        </div>
      </div>
    </>
  );
};

export default GameCanvas;