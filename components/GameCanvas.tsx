import React, { useRef, useEffect, useState } from 'react';
import { GameState } from '../types';
import { GameEngine } from '../game/GameEngine';
import GameOverlay from './GameOverlay';

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

  // Update refs when props change
  useEffect(() => {
    onScoreUpdateRef.current = onScoreUpdate;
    onGameOverRef.current = onGameOver;
    onCalibrationCompleteRef.current = onCalibrationComplete;
  }, [onScoreUpdate, onGameOver, onCalibrationComplete]);

  useEffect(() => {
    // Only initialize if not already initialized
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
                onCalibrationProgress: (p) => setCalibrationProgress(p)
            }
        );
    }

    return () => {
        if (engineRef.current) {
            engineRef.current.cleanup();
            engineRef.current = null;
        }
    };
    // Empty dependency array ensures this runs ONCE on mount
  }, []);

  // Sync GameState
  useEffect(() => {
      if (engineRef.current) {
          engineRef.current.setGameState(gameState);
      }
  }, [gameState]);

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