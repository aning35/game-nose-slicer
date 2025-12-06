
import React, { useState, useEffect, useRef } from 'react';
import GameCanvas from './components/GameCanvas';
import { GameState, Difficulty } from './types';
import { Play, Trophy, Skull } from 'lucide-react';
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
  
  // Shared Mutable Ref for Cursor Position (avoids React rerenders)
  const cursorPosRef = useRef({ x: 0, y: 0 });
  const visualCursorRef = useRef<HTMLDivElement>(null);

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
    showToast("GO!", "text-green-400");
  };

  const handleCursorMove = (x: number, y: number) => {
      cursorPosRef.current = { x, y };
      // Update visual cursor DOM element directly for performance
      if (visualCursorRef.current) {
          visualCursorRef.current.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      }
  };

  return (
    <div className="relative w-full h-screen bg-gray-900 overflow-hidden select-none font-sans cursor-none">
      <GameCanvas 
        gameState={gameState} 
        score={score}
        highScore={highScore}
        difficulty={difficulty}
        onScoreUpdate={handleScoreUpdate} 
        onGameOver={() => {
          playGameOverSound();
          setGameState(GameState.GAME_OVER);
        }}
        onCalibrationComplete={handleCalibrationComplete}
        setScore={setScore}
        onCursorMove={handleCursorMove}
      />

      {/* High Z-Index Visual Cursor */}
      <div 
        ref={visualCursorRef}
        className="fixed top-0 left-0 w-8 h-8 pointer-events-none z-[100] -ml-4 -mt-4 mix-blend-screen"
        style={{ willChange: 'transform' }}
      >
        <div className="relative w-full h-full animate-pulse">
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

      {/* Menu Overlay - Transparent to see Nose Trail */}
      {gameState === GameState.MENU && (
        <div className="absolute inset-0 flex flex-col items-center justify-center z-20">
            {/* Slight gradient to make text pop, but keep video visible */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/60 pointer-events-none" />

            <div className="text-center animate-bounce-in flex flex-col items-center z-30">
                <h1 className="text-7xl md:text-9xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 mb-2 drop-shadow-2xl" style={{filter: 'drop-shadow(0 0 20px rgba(0,255,255,0.5))'}}>
                  Nose Slicer
                </h1>
                <div className="flex items-center gap-2 mb-8 bg-black/40 px-4 py-2 rounded-full border border-white/20 backdrop-blur-sm">
                     <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                     <p className="text-white text-sm uppercase tracking-widest font-bold">Use your nose to hover</p>
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
                            label={d}
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
                             <span>START GAME</span>
                        </div>
                    }
                />
            </div>
        </div>
      )}
      
      {gameState === GameState.GAME_OVER && (
        <div className="absolute inset-0 bg-red-900/80 backdrop-blur-md flex flex-col items-center justify-center z-50">
           <h2 className="text-8xl font-black text-white mb-2 tracking-tighter drop-shadow-xl">GAME OVER</h2>
           <p className="text-white/80 text-3xl mb-12 font-light">Score: <span className="text-yellow-400 font-bold">{score}</span></p>
           
           <NoseButton 
              onClick={() => setGameState(GameState.MENU)}
              cursorPos={cursorPosRef}
              className="px-16 py-6 bg-white text-black text-2xl font-bold rounded-full shadow-xl"
              label="MAIN MENU"
           />
        </div>
      )}
    </div>
  );
};

export default App;
