import { useState, useCallback, useEffect, useRef } from 'react';

export type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';
export type Position = { x: number; y: number };
export type Difficulty = 'easy' | 'medium' | 'hard';
export type GameState = 'idle' | 'playing' | 'paused' | 'gameover';

const GRID_SIZE = 20;
const SPEEDS: Record<Difficulty, number> = {
  easy: 150,
  medium: 100,
  hard: 60,
};

const DIRECTION_MAP: Record<Direction, Position> = {
  UP: { x: 0, y: -1 },
  DOWN: { x: 0, y: 1 },
  LEFT: { x: -1, y: 0 },
  RIGHT: { x: 1, y: 0 },
};

const OPPOSITE: Record<Direction, Direction> = {
  UP: 'DOWN',
  DOWN: 'UP',
  LEFT: 'RIGHT',
  RIGHT: 'LEFT',
};

function getRandomPosition(snake: Position[]): Position {
  let pos: Position;
  do {
    pos = {
      x: Math.floor(Math.random() * GRID_SIZE),
      y: Math.floor(Math.random() * GRID_SIZE),
    };
  } while (snake.some((s) => s.x === pos.x && s.y === pos.y));
  return pos;
}

function getInitialSnake(): Position[] {
  const mid = Math.floor(GRID_SIZE / 2);
  return [
    { x: mid, y: mid },
    { x: mid - 1, y: mid },
    { x: mid - 2, y: mid },
  ];
}

export function useSnakeGame() {
  const [snake, setSnake] = useState<Position[]>(getInitialSnake());
  const [food, setFood] = useState<Position>(() => getRandomPosition(getInitialSnake()));
  const [direction, setDirection] = useState<Direction>('RIGHT');
  const [gameState, setGameState] = useState<GameState>('idle');
  const [score, setScore] = useState(0);
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [highScores, setHighScores] = useState<Record<Difficulty, number>>(() => {
    try {
      const stored = localStorage.getItem('snake-highscores');
      if (stored) return JSON.parse(stored);
    } catch {}
    return { easy: 0, medium: 0, hard: 0 };
  });

  const directionRef = useRef<Direction>(direction);
  const nextDirectionRef = useRef<Direction>(direction);
  const gameStateRef = useRef<GameState>(gameState);
  const gameLoopRef = useRef<number | null>(null);

  useEffect(() => {
    directionRef.current = direction;
  }, [direction]);

  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

  // Save high scores
  useEffect(() => {
    try {
      localStorage.setItem('snake-highscores', JSON.stringify(highScores));
    } catch {}
  }, [highScores]);

  const changeDirection = useCallback((newDir: Direction) => {
    if (OPPOSITE[newDir] !== directionRef.current) {
      nextDirectionRef.current = newDir;
    }
  }, []);

  const gameStep = useCallback(() => {
    if (gameStateRef.current !== 'playing') return;

    setDirection(nextDirectionRef.current);
    directionRef.current = nextDirectionRef.current;

    setSnake((prevSnake) => {
      const dir = DIRECTION_MAP[directionRef.current];
      const head = prevSnake[0];
      const newHead: Position = {
        x: head.x + dir.x,
        y: head.y + dir.y,
      };

      // Wall collision
      if (newHead.x < 0 || newHead.x >= GRID_SIZE || newHead.y < 0 || newHead.y >= GRID_SIZE) {
        setGameState('gameover');
        return prevSnake;
      }

      // Self collision
      if (prevSnake.some((s) => s.x === newHead.x && s.y === newHead.y)) {
        setGameState('gameover');
        return prevSnake;
      }

      const newSnake = [newHead, ...prevSnake];

      // Check food
      setFood((prevFood) => {
        if (newHead.x === prevFood.x && newHead.y === prevFood.y) {
          setScore((s) => s + 1);
          return getRandomPosition(newSnake);
        }
        newSnake.pop();
        return prevFood;
      });

      return newSnake;
    });
  }, []);

  // Game loop
  useEffect(() => {
    if (gameState === 'playing') {
      const speed = SPEEDS[difficulty];
      gameLoopRef.current = window.setInterval(gameStep, speed);
    }
    return () => {
      if (gameLoopRef.current) {
        clearInterval(gameLoopRef.current);
        gameLoopRef.current = null;
      }
    };
  }, [gameState, difficulty, gameStep]);

  // Update high score on game over
  useEffect(() => {
    if (gameState === 'gameover') {
      setHighScores((prev) => {
        if (score > prev[difficulty]) {
          return { ...prev, [difficulty]: score };
        }
        return prev;
      });
    }
  }, [gameState, score, difficulty]);

  const startGame = useCallback(() => {
    const initialSnake = getInitialSnake();
    setSnake(initialSnake);
    setFood(getRandomPosition(initialSnake));
    setDirection('RIGHT');
    directionRef.current = 'RIGHT';
    nextDirectionRef.current = 'RIGHT';
    setScore(0);
    setGameState('playing');
  }, []);

  const togglePause = useCallback(() => {
    setGameState((prev) => {
      if (prev === 'playing') return 'paused';
      if (prev === 'paused') return 'playing';
      return prev;
    });
  }, []);

  const restartGame = useCallback(() => {
    startGame();
  }, [startGame]);

  return {
    snake,
    food,
    direction,
    gameState,
    score,
    difficulty,
    highScores,
    gridSize: GRID_SIZE,
    changeDirection,
    startGame,
    togglePause,
    restartGame,
    setDifficulty,
  };
}
