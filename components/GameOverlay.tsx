import React from 'react';
import { Heart, Trophy } from 'lucide-react';
import { GameState } from '../types';

interface GameOverlayProps {
  gameState: GameState;
  score: number;
  highScore: number;
  lives: number;
  isHit: boolean;
  isCursorActive: boolean;
  calibrationProgress: number;
  videoRef: React.RefObject<HTMLVideoElement | null>; // Using the broader RefObject type
}

const GameOverlay: React.FC<GameOverlayProps> = ({
  gameState,
  score,
  highScore,
  lives,
  isHit,
  isCursorActive,
  calibrationProgress,
  videoRef
}) => {
  return (
    <>
      {/* Damage Flash Overlay */}
      <div 
        className={`absolute inset-0 bg-red-600/30 pointer-events-none transition-opacity duration-200 ${isHit ? 'opacity-100' : 'opacity-0'}`} 
      />

      {/* Arcade HUD */}
      <div className="absolute top-0 left-0 w-full p-4 pointer-events-none flex justify-between items-start z-20">
         
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

      {/* Hidden Video Preview */}
      <div className={`absolute bottom-4 right-4 w-32 h-24 border-2 border-white/20 rounded-lg overflow-hidden bg-black/50 z-50 pointer-events-none transform -scale-x-100 transition-opacity ${gameState === GameState.MENU ? 'opacity-0' : 'opacity-50 hover:opacity-100'}`}>
        <video 
            ref={videoRef} 
            className="w-full h-full object-cover"
            muted 
            playsInline
        />
        <div className="absolute top-1 right-1">
            <div className={`w-2 h-2 rounded-full ${isCursorActive ? 'bg-green-500 shadow-[0_0_5px_#0f0]' : 'bg-red-500'}`} />
        </div>
      </div>

      {/* Calibration Progress Overlay */}
      {gameState === GameState.CALIBRATION && (
          <div className="absolute top-1/3 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
               {/* Note: The canvas renders the main calibration text, this is just extra UI if needed, but keeping it clean for now */}
          </div>
      )}
    </>
  );
};

export default GameOverlay;
