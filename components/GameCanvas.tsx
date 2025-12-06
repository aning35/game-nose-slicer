
import React, { useRef, useEffect, useState } from 'react';
import { GameState, Difficulty, ActiveEffectState } from '../types';
import { GameEngine } from '../game/GameEngine';
import GameOverlay from './GameOverlay';

interface GameCanvasProps {
  gameState: GameState;
  score: number;
  highScore: number;
  difficulty: Difficulty;
  language: 'zh' | 'en';
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
  language,
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
  const [activeEffect, setActiveEffect] = useState<ActiveEffectState | null>(null);

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
    if (canvasRef.current && videoRef.current && !engineRef.current) {
        engineRef.current = new GameEngine(
            canvasRef.current,
            videoRef.current,
            {
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
                onCursorMove: (x, y) => onCursorMoveRef.current(x, y),
                onEffectChange: (effect) => setActiveEffect(effect)
            }
        );
        
        engineRef.current.setGameState(gameState);
        engineRef.current.setDifficulty(difficulty);
        engineRef.current.setLanguage(language);
    }
  }); 

  useEffect(() => {
    return () => {
        if (engineRef.current) {
            engineRef.current.cleanup();
            engineRef.current = null;
        }
    }
  }, []);

  useEffect(() => {
      if (engineRef.current) {
          engineRef.current.setGameState(gameState);
      }
  }, [gameState]);
  
  useEffect(() => {
      if (engineRef.current) {
          engineRef.current.setDifficulty(difficulty);
      }
  }, [difficulty]);
  
  useEffect(() => {
      if (engineRef.current) {
          engineRef.current.setLanguage(language);
      }
  }, [language]);

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
          activeEffect={activeEffect}
      />
    </>
  );
};

export default GameCanvas;
