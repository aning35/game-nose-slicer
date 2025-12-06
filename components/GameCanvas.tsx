
import React, { useRef, useEffect, useState } from 'react';
import { GameState, Difficulty } from '../types';
import { GameEngine } from '../game/GameEngine';
import GameOverlay from './GameOverlay';

interface GameCanvasProps {
  gameState: GameState;
  score: number;
  highScore: number;
  difficulty: Difficulty;
  onScoreUpdate: (scoreChange: number) => void;
  onGameOver: () => void;
  onCalibrationComplete?: () => void;
  setScore: React.Dispatch<React.SetStateAction<number>>;
  onCursorMove: (x: number, y: number) => void;
}

const GameCanvas: React.FC<GameCanvasProps> = ({ 
  gameState, 
  score,
  highScore,
  difficulty,
  onScoreUpdate, 
  onGameOver, 
  onCalibrationComplete,
  setScore,
  onCursorMove
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const engineRef = useRef<GameEngine | null>(null);

  // Local React State for UI
  const [lives, setLives] = useState(3);
  const [isHit, setIsHit] = useState(false);
  const [isCursorActive, setIsCursorActive] = useState(false);
  const [calibrationProgress, setCalibrationProgress] = useState(0);

  // Refs for callbacks to ensure stability
  const onScoreUpdateRef = useRef(onScoreUpdate);
  const onGameOverRef = useRef(onGameOver);
  const onCalibrationCompleteRef = useRef(onCalibrationComplete);
  const onCursorMoveRef = useRef(onCursorMove);

  // Update refs when props change
  useEffect(() => {
    onScoreUpdateRef.current = onScoreUpdate;
    onGameOverRef.current = onGameOver;
    onCalibrationCompleteRef.current = onCalibrationComplete;
    onCursorMoveRef.current = onCursorMove;
  }, [onScoreUpdate, onGameOver, onCalibrationComplete, onCursorMove]);

  useEffect(() => {
    // Only initialize if not already initialized
    // Removing the dependency array allows this to retry if refs are null on first render
    if (canvasRef.current && videoRef.current && !engineRef.current) {
        engineRef.current = new GameEngine(
            canvasRef.current,
            videoRef.current,
            {
                // Call via refs to avoid closure staleness without triggering re-init
                onScoreUpdate: (points) => onScoreUpdateRef.current(points),
                onLivesUpdate: (l) => setLives(l),
                onDamage: () => {
                    setIsHit(true);
                    setTimeout(() => setIsHit(false), 200);
                },
                onGameOver: () => onGameOverRef.current(),
                onCalibrationComplete: () => {
                    if (onCalibrationCompleteRef.current) onCalibrationCompleteRef.current();
                },
                onCursorActive: (active) => setIsCursorActive(active),
                onCalibrationProgress: (p) => setCalibrationProgress(p),
                onCursorMove: (x, y) => onCursorMoveRef.current(x, y)
            }
        );
        
        // Force state sync immediately after creation
        engineRef.current.setGameState(gameState);
        engineRef.current.setDifficulty(difficulty);
    }

    return () => {
        // We do NOT destroy the engine on re-renders, only on unmount
        // This is handled because we check !engineRef.current before creating
    };
  }); 

  // Cleanup on unmount only
  useEffect(() => {
    return () => {
        if (engineRef.current) {
            engineRef.current.cleanup();
            engineRef.current = null;
        }
    }
  }, []);

  // Sync GameState
  useEffect(() => {
      if (engineRef.current) {
          engineRef.current.setGameState(gameState);
      }
  }, [gameState]);
  
  // Sync Difficulty
  useEffect(() => {
      if (engineRef.current) {
          engineRef.current.setDifficulty(difficulty);
      }
  }, [difficulty]);

  return (
    <>
      <canvas ref={canvasRef} className="absolute top-0 left-0 w-full h-full" />
      
      <GameOverlay 
          gameState={gameState}
          score={score}
          highScore={highScore}
          lives={lives}
          isHit={isHit}
          isCursorActive={isCursorActive}
          calibrationProgress={calibrationProgress}
          videoRef={videoRef}
      />
    </>
  );
};

export default GameCanvas;
