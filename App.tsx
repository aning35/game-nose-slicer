
import React, { useState, useEffect, useRef } from 'react';
import GameCanvas from './components/GameCanvas';
import { GameState, Difficulty, EffectType, ActiveEffectState } from './types';
import { Play, Trophy, Skull, Globe, Info, CornerUpLeft } from 'lucide-react';
import { TRANSLATIONS, SPECIAL_FRUITS, BOMB_TYPE } from './constants';
import { 
    playSliceSound, 
    playBombSound, 
    playStartSound, 
    playGameOverSound, 
    ensureAudioContext,
    startBackgroundMusic,
    stopBackgroundMusic
} from './audio';

// --- Internal Component: Nose Hover Button ---
interface NoseButtonProps {
    label: string | React.ReactNode;
    onClick: () => void;
    cursorPos: React.MutableRefObject<{x: number, y: number}>;
    isActive?: boolean;
    className?: string;
    disabled?: boolean;
}

const NoseButton: React.FC<NoseButtonProps> = ({ label, onClick, cursorPos, isActive, className, disabled }) => {
    const btnRef = useRef<HTMLDivElement>(null);
    const [progress, setProgress] = useState(0);
    const requestRef = useRef<number>(0);
    const isHoveredRef = useRef(false);

    useEffect(() => {
        const checkHover = () => {
            if (disabled) return;
            
            if (btnRef.current) {
                const rect = btnRef.current.getBoundingClientRect();
                const cur = cursorPos.current;
                
                // Simple AABB collision
                const isInside = cur.x >= rect.left && cur.x <= rect.right && cur.y >= rect.top && cur.y <= rect.bottom;
                
                if (isInside) {
                    if (!isHoveredRef.current) {
                        isHoveredRef.current = true;
                        playSliceSound(); // Little tick sound
                    }
                    setProgress(p => {
                        const next = p + 0.02; // ~50 frames to fill (approx 0.8s)
                        if (next >= 1) {
                            onClick();
                            return 0; // Reset after click
                        }
                        return next;
                    });
                } else {
                    isHoveredRef.current = false;
                    setProgress(p => Math.max(0, p - 0.05));
                }
            }
            requestRef.current = requestAnimationFrame(checkHover);
        };
        
        requestRef.current = requestAnimationFrame(checkHover);
        return () => cancelAnimationFrame(requestRef.current);
    }, [onClick, cursorPos, disabled]);

    return (
        <div 
            ref={btnRef}
            className={`relative overflow-hidden group transition-all duration-300 transform 
            ${isActive 
                ? 'scale-110 bg-white text-black shadow-[0_0_20px_white]' 
                : 'bg-white/10 text-white/70 hover:bg-white/20 hover:scale-105'
            } ${className}`}
        >
            {/* Progress Fill Overlay */}
            <div 
                className="absolute inset-0 bg-green-500/50 transition-transform duration-75 origin-left"
                style={{ transform: `scaleX(${progress})` }}
            />
            
            {/* Content */}
            <div className="relative z-10">
                {label}
            </div>
            
            {/* Border Glow for Active */}
            {isActive && <div className="absolute inset-0 border-2 border-white animate-pulse" />}
        </div>
    );
};

// --- Main App ---

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(GameState.MENU);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [difficulty, setDifficulty] = useState<Difficulty>(Difficulty.MEDIUM);
  const [toast, setToast] = useState<{msg: string, color: string, id: number} | null>(null);
  const [language, setLanguage] = useState<'zh' | 'en'>('zh');
  const [activeEffectType, setActiveEffectType] = useState<EffectType>(EffectType.NONE);
  
  // Shared Mutable Ref for Cursor Position (avoids React rerenders)
  const cursorPosRef = useRef({ x: 0, y: 0 });
  const visualCursorRef = useRef<HTMLDivElement>(null);

  const t = TRANSLATIONS[language];

  useEffect(() => {
    const saved = localStorage.getItem('sliceMasterHighScore');
    if (saved) setHighScore(parseInt(saved));
  }, []);

  useEffect(() => {
    if (score > highScore) {
      setHighScore(score);
      localStorage.setItem('sliceMasterHighScore', score.toString());
    }
  }, [score, highScore]);

  // Manage Background Music based on state
  useEffect(() => {
    if (gameState === GameState.PLAYING) {
        startBackgroundMusic();
    } else {
        stopBackgroundMusic();
    }
    return () => stopBackgroundMusic();
  }, [gameState]);

  const handleScoreUpdate = (points: number) => {
    setScore(prev => prev + points);
    if (points > 0) {
      playSliceSound();
    } else {
      playBombSound();
    }
  };

  const showToast = (msg: string, color: string) => {
    setToast({ msg, color, id: Date.now() });
    setTimeout(() => setToast(null), 1000);
  };

  const startGame = () => {
    ensureAudioContext(); 
    playStartSound();
    setScore(0);
    setGameState(GameState.CALIBRATION);
  };

  const handleCalibrationComplete = () => {
    setGameState(GameState.PLAYING);
    playStartSound();
    showToast(t.go, "text-green-400");
  };

  const handleCursorMove = (x: number, y: number) => {
      cursorPosRef.current = { x, y };
      // Update visual cursor DOM element directly for performance
      if (visualCursorRef.current) {
          visualCursorRef.current.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      }
  };

  const toggleLanguage = () => {
      setLanguage(prev => prev === 'zh' ? 'en' : 'zh');
  };

  // Logic for Dynamic Cursor CSS
  const getCursorScaleClass = () => {
      if (activeEffectType === EffectType.GIANT_CURSOR) return 'scale-[3]';
      if (activeEffectType === EffectType.TINY_CURSOR) return 'scale-[0.3]';
      return 'scale-100';
  };

  return (
    <div className="relative w-full h-screen bg-gray-900 overflow-hidden select-none font-sans cursor-none">
      <GameCanvas 
        gameState={gameState} 
        score={score}
        highScore={highScore}
        difficulty={difficulty}
        language={language}
        onScoreUpdate={handleScoreUpdate} 
        onGameOver={() => {
          playGameOverSound();
          setGameState(GameState.GAME_OVER);
        }}
        onCalibrationComplete={handleCalibrationComplete}
        setScore={setScore}
        onCursorMove={handleCursorMove}
        onActiveEffectChange={(effect) => setActiveEffectType(effect ? effect.type : EffectType.NONE)}
      />

      {/* High Z-Index Visual Cursor */}
      <div 
        ref={visualCursorRef}
        className={`fixed top-0 left-0 w-8 h-8 pointer-events-none z-[100] -ml-4 -mt-4 mix-blend-screen transition-transform duration-500 ease-out`}
        style={{ willChange: 'transform' }}
      >
        <div className={`relative w-full h-full animate-pulse transition-transform duration-500 ${getCursorScaleClass()}`}>
             <div className="absolute top-1/2 left-1/2 w-2 h-2 bg-white rounded-full -translate-x-1/2 -translate-y-1/2 shadow-[0_0_10px_white]" />
             <div className="absolute inset-0 border-2 border-cyan-400/80 rounded-full shadow-[0_0_15px_cyan]" />
        </div>
      </div>

      {/* Floating Toast */}
      {toast && (
        <div className="absolute top-1/3 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none z-30">
             <div className={`text-6xl font-black animate-ping ${toast.color} drop-shadow-2xl stroke-black`} style={{textShadow: '0 0 10px black'}}>
               {toast.msg}
             </div>
        </div>
      )}

      {/* Instructions Overlay */}
      {gameState === GameState.INSTRUCTIONS && (
           <div className="absolute inset-0 z-40 bg-black/90 backdrop-blur-xl flex flex-col items-center justify-center p-4 md:p-8">
               <h2 className="text-3xl md:text-4xl font-black text-cyan-400 mb-2 md:mb-4 tracking-wider shrink-0">{t.howToPlay}</h2>
               
               <div className="flex flex-col gap-4 w-full max-w-7xl flex-1 overflow-hidden min-h-0">
                   {/* Basic Rules - Compact */}
                   <div className="bg-white/10 p-3 rounded-xl border border-white/10 shrink-0">
                       <h3 className="text-lg text-white font-bold mb-1 border-b border-white/20 pb-1">🎯 {t.rules.basic}</h3>
                       <p className="text-gray-300 text-sm md:text-base leading-snug">
                           {language === 'zh' ? 
                            '正对摄像头，移动鼻尖控制光标。切开水果得分，不要碰到炸弹！' : 
                            'Face camera, move nose to control cursor. Slice fruits, avoid bombs!'}
                       </p>
                   </div>
                   
                   {/* Special Items Grid - Full Screen, No Scroll */}
                   <div className="bg-white/10 p-3 rounded-xl border border-white/10 flex-1 flex flex-col min-h-0">
                       <h3 className="text-lg text-white font-bold mb-2 border-b border-white/20 pb-1 shrink-0">✨ {t.rules.items}</h3>
                       
                       <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-2 h-full content-start">
                           {/* Render Bomb Manually */}
                           <div className="flex items-center gap-2 bg-red-900/20 p-2 rounded border border-red-500/30 h-10 md:h-12">
                               <span className="text-xl md:text-2xl">{BOMB_TYPE.emoji}</span>
                               <span className="text-red-300 font-bold text-xs md:text-sm truncate leading-tight">{t.items.bomb}</span>
                           </div>

                           {/* Render all special fruits */}
                           {Object.values(SPECIAL_FRUITS).map((fruit) => (
                               <div key={fruit.effect} className="flex items-center gap-2 bg-white/5 p-2 rounded border border-white/10 h-10 md:h-12 overflow-hidden">
                                   <span className="text-xl md:text-2xl shrink-0">{fruit.emoji}</span>
                                   <span className="text-white font-medium text-xs md:text-sm truncate leading-tight" title={t.items[fruit.effect as keyof typeof t.items]}>
                                       {t.items[fruit.effect as keyof typeof t.items] || fruit.effect}
                                   </span>
                               </div>
                           ))}
                       </div>
                   </div>
               </div>

               <div className="mt-4 shrink-0">
                   <NoseButton 
                       onClick={() => setGameState(GameState.MENU)}
                       cursorPos={cursorPosRef}
                       className="px-8 py-2 md:px-12 md:py-3 bg-gray-700 hover:bg-gray-600 rounded-full text-white text-lg md:text-xl font-bold flex items-center gap-3 border-2 border-white/20"
                       label={
                           <>
                            <CornerUpLeft /> {t.back}
                           </>
                       }
                   />
               </div>
           </div>
      )}

      {/* Menu Overlay - Transparent to see Nose Trail */}
      {gameState === GameState.MENU && (
        <div className="absolute inset-0 flex flex-col items-center justify-center z-20">
            {/* Slight gradient to make text pop, but keep video visible */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/60 pointer-events-none" />
            
            {/* Top Bar: Language & Instructions */}
            <div className="absolute top-6 right-6 z-40 flex flex-col gap-4 items-end">
                <NoseButton 
                    onClick={() => {
                        toggleLanguage();
                        playSliceSound();
                    }}
                    cursorPos={cursorPosRef}
                    className="bg-white/10 text-white px-4 py-2 rounded-full font-bold border border-white/20 min-w-[160px] flex items-center justify-center gap-2"
                    label={
                        <div className="flex items-center gap-2">
                            <Globe size={18} />
                            <span>{language === 'zh' ? 'EN / 中文' : 'English / 中文'}</span>
                        </div>
                    }
                />
                
                <NoseButton 
                    onClick={() => {
                        setGameState(GameState.INSTRUCTIONS);
                        playSliceSound();
                    }}
                    cursorPos={cursorPosRef}
                    className="bg-cyan-500/20 hover:bg-cyan-500/40 text-cyan-200 px-4 py-2 rounded-full font-bold border border-cyan-500/30 min-w-[160px] flex items-center justify-center gap-2"
                    label={
                        <div className="flex items-center gap-2">
                            <Info size={18} />
                            <span>{t.howToPlay}</span>
                        </div>
                    }
                />
            </div>

            <div className="text-center animate-bounce-in flex flex-col items-center z-30">
                <h1 className="text-7xl md:text-9xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 mb-2 drop-shadow-2xl" style={{filter: 'drop-shadow(0 0 20px rgba(0,255,255,0.5))'}}>
                  {t.title}
                </h1>
                <div className="flex items-center gap-2 mb-8 bg-black/40 px-4 py-2 rounded-full border border-white/20 backdrop-blur-sm">
                     <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                     <p className="text-white text-sm uppercase tracking-widest font-bold">{t.instruction}</p>
                </div>
                
                <div className="flex gap-6 mb-12">
                    {[Difficulty.EASY, Difficulty.MEDIUM, Difficulty.HARD].map((d) => (
                        <NoseButton
                            key={d}
                            onClick={() => {
                                setDifficulty(d);
                                playSliceSound();
                            }}
                            cursorPos={cursorPosRef}
                            isActive={difficulty === d}
                            className="px-8 py-4 rounded-2xl font-black text-xl border-2 border-white/20 min-w-[140px]"
                            label={t.difficulty[d]}
                        />
                    ))}
                </div>

                <NoseButton 
                    onClick={startGame}
                    cursorPos={cursorPosRef}
                    className="group relative px-20 py-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full text-white shadow-[0_0_30px_rgba(59,130,246,0.6)] border-4 border-white/20"
                    label={
                        <div className="flex items-center gap-4 text-3xl font-black">
                             <Play fill="currentColor" size={32} /> 
                             <span>{t.start}</span>
                        </div>
                    }
                />
            </div>
        </div>
      )}
      
      {gameState === GameState.GAME_OVER && (
        <div className="absolute inset-0 bg-red-900/80 backdrop-blur-md flex flex-col items-center justify-center z-50">
           <h2 className="text-8xl font-black text-white mb-2 tracking-tighter drop-shadow-xl">{t.gameOver}</h2>
           <p className="text-white/80 text-3xl mb-12 font-light">{t.score}: <span className="text-yellow-400 font-bold">{score}</span></p>
           
           <NoseButton 
              onClick={() => setGameState(GameState.MENU)}
              cursorPos={cursorPosRef}
              className="px-16 py-6 bg-white text-black text-2xl font-bold rounded-full shadow-xl"
              label={t.mainMenu}
           />
        </div>
      )}
    </div>
  );
};

export default App;
