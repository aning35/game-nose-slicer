import React, { useState, useEffect } from 'react';
import GameCanvas from './components/GameCanvas';
import { GameState } from './types';
import { Play, Trophy, Skull } from 'lucide-react';
import { playSliceSound, playBombSound, playStartSound, playGameOverSound, ensureAudioContext } from './audio';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(GameState.MENU);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [toast, setToast] = useState<{msg: string, color: string, id: number} | null>(null);

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

  return (
    <div className="relative w-full h-screen bg-gray-900 overflow-hidden select-none font-sans">
      <GameCanvas 
        gameState={gameState} 
        score={score}
        highScore={highScore}
        onScoreUpdate={handleScoreUpdate} 
        onGameOver={() => {
          playGameOverSound();
          setGameState(GameState.GAME_OVER);
        }}
        onCalibrationComplete={handleCalibrationComplete}
        setScore={setScore}
      />

      {/* Floating Toast */}
      {toast && (
        <div className="absolute top-1/3 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none z-30">
             <div className={`text-6xl font-black animate-ping ${toast.color} drop-shadow-2xl stroke-black`} style={{textShadow: '0 0 10px black'}}>
               {toast.msg}
             </div>
        </div>
      )}

      {/* Menu Overlay */}
      {gameState === GameState.MENU && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center z-10">
          <div className="text-center animate-bounce-in">
            <h1 className="text-7xl md:text-9xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 mb-4 drop-shadow-2xl" style={{filter: 'drop-shadow(0 0 20px rgba(0,255,255,0.5))'}}>
              Nose Slicer
            </h1>
            <h2 className="text-2xl text-white/80 font-light mb-12 tracking-widest uppercase">
               鼻控切水果
            </h2>
            <div className="flex gap-8 mb-12">
                 <div className="flex flex-col items-center gap-2 text-white/60">
                     <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center text-3xl">👃</div>
                     <span>转动头部</span>
                 </div>
                 <div className="flex flex-col items-center gap-2 text-white/60">
                     <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center text-3xl">🔪</div>
                     <span>切割水果</span>
                 </div>
                 <div className="flex flex-col items-center gap-2 text-white/60">
                     <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center text-3xl text-red-500"><Skull /></div>
                     <span>躲避炸弹</span>
                 </div>
            </div>
            
            <button 
              onClick={startGame}
              className="group relative px-16 py-6 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full text-white text-2xl font-black shadow-[0_0_30px_rgba(59,130,246,0.6)] hover:shadow-[0_0_50px_rgba(59,130,246,0.8)] transition-all hover:scale-110 active:scale-95 flex items-center gap-4 mx-auto overflow-hidden ring-4 ring-white/10"
            >
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
              <Play fill="currentColor" size={32} /> START GAME
            </button>
          </div>
        </div>
      )}
      
      {gameState === GameState.GAME_OVER && (
        <div className="absolute inset-0 bg-red-900/90 backdrop-blur-lg flex flex-col items-center justify-center z-50">
           <h2 className="text-8xl font-black text-white mb-2 tracking-tighter drop-shadow-xl">GAME OVER</h2>
           <p className="text-white/80 text-3xl mb-12 font-light">Score: <span className="text-yellow-400 font-bold">{score}</span></p>
           <button 
              onClick={() => setGameState(GameState.MENU)}
              className="px-12 py-4 bg-white text-black text-xl font-bold rounded-full hover:scale-105 transition-transform hover:bg-gray-200 shadow-xl"
            >
              再试一次
            </button>
        </div>
      )}
    </div>
  );
};

export default App;