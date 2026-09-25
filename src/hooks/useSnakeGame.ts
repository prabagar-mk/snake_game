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
  // Use refs for game-loop mutable state to avoid nested setState issues
  const snakeRef = useRef<Position[]>(getInitialSnake());
  const foodRef = useRef<Position>(getRandomPosition(getInitialSnake()));
  const directionRef = useRef<Direction>('RIGHT');
  const nextDirectionRef = useRef<Direction>('RIGHT');
  const scoreRef = useRef(0);
  const gameStateRef = useRef<GameState>('idle');

  // React state mirrors for rendering
  const [snake, setSnake] = useState<Position[]>(snakeRef.current);
  const [food, setFood] = useState<Position>(foodRef.current);
  const [direction, setDirection] = useState<Direction>('RIGHT');
  const [gameState, setGameState] = useState<GameState>('idle');
  const [score, setScore] = useState(0);
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [highScores, setHighScores] = useState<Record<Difficulty, number>>(() => {
    try {
      const stored = localStorage.getItem('snake-highscores');
      if (stored) return JSON.parse(stored);
    } catch {
      // ignore
    }
    return { easy: 0, medium: 0, hard: 0 };
  });

  const gameLoopRef = useRef<number | null>(null);

  // Keep refs in sync with state
  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

  // Save high scores to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('snake-highscores', JSON.stringify(highScores));
    } catch {
      // ignore
    }
  }, [highScores]);

  const changeDirection = useCallback((newDir: Direction) => {
    if (OPPOSITE[newDir] !== directionRef.current) {
      nextDirectionRef.current = newDir;
    }
  }, []);

  const gameStep = useCallback(() => {
    if (gameStateRef.current !== 'playing') return;

    // Apply queued direction
    directionRef.current = nextDirectionRef.current;
    setDirection(directionRef.current);

    const dir = DIRECTION_MAP[directionRef.current];
    const prevSnake = snakeRef.current;
    const head = prevSnake[0];
    const newHead: Position = {
      x: head.x + dir.x,
      y: head.y + dir.y,
    };

    // Wall collision
    if (
      newHead.x < 0 ||
      newHead.x >= GRID_SIZE ||
      newHead.y < 0 ||
      newHead.y >= GRID_SIZE
    ) {
      gameStateRef.current = 'gameover';
      setGameState('gameover');
      return;
    }

    // Self collision
    if (prevSnake.some((s) => s.x === newHead.x && s.y === newHead.y)) {
      gameStateRef.current = 'gameover';
      setGameState('gameover');
      return;
    }

    // Build new snake
    const newSnake = [newHead, ...prevSnake];
    const currentFood = foodRef.current;

    if (newHead.x === currentFood.x && newHead.y === currentFood.y) {
      // Ate food — grow
      scoreRef.current += 1;
      setScore(scoreRef.current);
      const newFood = getRandomPosition(newSnake);
      foodRef.current = newFood;
      setFood(newFood);
    } else {
      newSnake.pop();
    }

    snakeRef.current = newSnake;
    setSnake(newSnake);
  }, []);

  // Game loop
  useEffect(() => {
    if (gameState === 'playing') {
      const speed = SPEEDS[difficulty];
      gameLoopRef.current = window.setInterval(gameStep, speed);
    }
    return () => {
      if (gameLoopRef.current !== null) {
        clearInterval(gameLoopRef.current);
        gameLoopRef.current = null;
      }
    };
  }, [gameState, difficulty, gameStep]);

  // Update high score on game over
  useEffect(() => {
    if (gameState === 'gameover') {
      setHighScores((prev) => {
        if (scoreRef.current > prev[difficulty]) {
          return { ...prev, [difficulty]: scoreRef.current };
        }
        return prev;
      });
    }
  }, [gameState, difficulty]);

  const startGame = useCallback(() => {
    const initialSnake = getInitialSnake();
    const initialFood = getRandomPosition(initialSnake);

    snakeRef.current = initialSnake;
    foodRef.current = initialFood;
    directionRef.current = 'RIGHT';
    nextDirectionRef.current = 'RIGHT';
    scoreRef.current = 0;
    gameStateRef.current = 'playing';

    setSnake(initialSnake);
    setFood(initialFood);
    setDirection('RIGHT');
    setScore(0);
    setGameState('playing');
  }, []);

  const togglePause = useCallback(() => {
    setGameState((prev) => {
      if (prev === 'playing') {
        gameStateRef.current = 'paused';
        return 'paused';
      }
      if (prev === 'paused') {
        gameStateRef.current = 'playing';
        return 'playing';
      }
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
