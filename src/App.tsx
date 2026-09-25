import { useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play,
  Pause,
  RotateCcw,
  Trophy,
  Zap,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useSnakeGame, type Difficulty, type Direction } from './hooks/useSnakeGame';

const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  easy: 'Easy',
  medium: 'Medium',
  hard: 'Hard',
};

const DIFFICULTY_COLORS: Record<Difficulty, string> = {
  easy: 'from-green-500 to-emerald-600',
  medium: 'from-yellow-500 to-orange-600',
  hard: 'from-red-500 to-rose-600',
};

function App() {
  const {
    snake,
    food,
    direction,
    gameState,
    score,
    difficulty,
    highScores,
    gridSize,
    changeDirection,
    startGame,
    togglePause,
    restartGame,
    setDifficulty,
  } = useSnakeGame();

  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const boardRef = useRef<HTMLDivElement>(null);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const keyMap: Record<string, Direction> = {
        ArrowUp: 'UP',
        ArrowDown: 'DOWN',
        ArrowLeft: 'LEFT',
        ArrowRight: 'RIGHT',
        w: 'UP',
        s: 'DOWN',
        a: 'LEFT',
        d: 'RIGHT',
        W: 'UP',
        S: 'DOWN',
        A: 'LEFT',
        D: 'RIGHT',
      };

      if (keyMap[e.key]) {
        e.preventDefault();
        if (gameState === 'playing') {
          changeDirection(keyMap[e.key]);
        }
      }

      if (e.key === ' ' || e.key === 'Escape') {
        e.preventDefault();
        if (gameState === 'playing' || gameState === 'paused') {
          togglePause();
        }
      }

      if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        restartGame();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, changeDirection, togglePause, restartGame]);

  // Touch controls (swipe)
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
  }, []);

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (!touchStartRef.current) return;
      const touch = e.changedTouches[0];
      const dx = touch.clientX - touchStartRef.current.x;
      const dy = touch.clientY - touchStartRef.current.y;
      const minSwipe = 30;

      if (Math.abs(dx) < minSwipe && Math.abs(dy) < minSwipe) return;

      if (Math.abs(dx) > Math.abs(dy)) {
        changeDirection(dx > 0 ? 'RIGHT' : 'LEFT');
      } else {
        changeDirection(dy > 0 ? 'DOWN' : 'UP');
      }
      touchStartRef.current = null;
    },
    [changeDirection]
  );

  // D-Pad handler
  const handleDPad = useCallback(
    (dir: Direction) => {
      if (gameState === 'playing') {
        changeDirection(dir);
      }
    },
    [gameState, changeDirection]
  );

  // Render the game board
  const renderBoard = () => {
    const cells = [];
    const snakeSet = new Set(snake.map((s) => `${s.x},${s.y}`));
    const headKey = `${snake[0].x},${snake[0].y}`;

    for (let y = 0; y < gridSize; y++) {
      for (let x = 0; x < gridSize; x++) {
        const key = `${x},${y}`;
        const isSnake = snakeSet.has(key);
        const isHead = key === headKey;
        const isFood = food.x === x && food.y === y;

        let cellClass = 'rounded-sm ';
        if (isHead) {
          cellClass += 'bg-emerald-400 shadow-lg shadow-emerald-400/50 scale-110 z-10';
        } else if (isSnake) {
          cellClass += 'bg-emerald-500/80';
        } else if (isFood) {
          cellClass += 'bg-red-400 shadow-lg shadow-red-400/50';
        } else {
          cellClass += 'bg-slate-800/40';
        }

        cells.push(
          <div
            key={key}
            className={`aspect-square transition-all duration-75 ${cellClass}`}
            style={
              isFood
                ? { animation: 'pulse-food 1s ease-in-out infinite' }
                : isHead
                ? { borderRadius: '30%' }
                : {}
            }
          />
        );
      }
    }
    return cells;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col items-center justify-center p-4 select-none overflow-hidden">
      {/* Background decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-20 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-20 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 text-center mb-4"
      >
        <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
          🐍 Snake Game
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Arrow keys / WASD / Swipe to move • Space to pause
        </p>
      </motion.div>

      {/* Score Panel */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="relative z-10 flex flex-wrap items-center justify-center gap-3 mb-4 w-full max-w-md"
      >
        {/* Current Score */}
        <div className="flex items-center gap-2 bg-slate-800/80 backdrop-blur-sm border border-slate-700 rounded-xl px-4 py-2">
          <Zap className="w-4 h-4 text-yellow-400" />
          <span className="text-slate-400 text-sm">Score:</span>
          <span className="text-white font-bold text-lg">{score}</span>
        </div>

        {/* High Score */}
        <div className="flex items-center gap-2 bg-slate-800/80 backdrop-blur-sm border border-slate-700 rounded-xl px-4 py-2">
          <Trophy className="w-4 h-4 text-amber-400" />
          <span className="text-slate-400 text-sm">Best:</span>
          <span className="text-amber-300 font-bold text-lg">{highScores[difficulty]}</span>
        </div>

        {/* Difficulty */}
        <div className="flex items-center gap-1 bg-slate-800/80 backdrop-blur-sm border border-slate-700 rounded-xl px-2 py-1">
          {(['easy', 'medium', 'hard'] as Difficulty[]).map((d) => (
            <button
              key={d}
              onClick={() => setDifficulty(d)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                difficulty === d
                  ? `bg-gradient-to-r ${DIFFICULTY_COLORS[d]} text-white shadow-lg`
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {DIFFICULTY_LABELS[d]}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Game Board */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2 }}
        className="relative z-10"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div
          ref={boardRef}
          className="relative bg-slate-900/90 backdrop-blur-sm border-2 border-slate-700/50 rounded-2xl p-2 shadow-2xl shadow-black/50"
        >
          {/* Grid */}
          <div
            className="grid gap-[1px] w-[min(80vw,400px)] h-[min(80vw,400px)]"
            style={{
              gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
              gridTemplateRows: `repeat(${gridSize}, 1fr)`,
            }}
          >
            {renderBoard()}
          </div>

          {/* Overlays */}
          <AnimatePresence>
            {gameState === 'idle' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/80 backdrop-blur-sm rounded-2xl"
              >
                <motion.div
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  className="text-center"
                >
                  <div className="text-6xl mb-4">🐍</div>
                  <h2 className="text-2xl font-bold text-white mb-2">Ready to Play?</h2>
                  <p className="text-slate-400 text-sm mb-6">
                    Choose difficulty and start!
                  </p>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={startGame}
                    className="flex items-center gap-2 mx-auto px-6 py-3 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-semibold rounded-xl shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 transition-shadow"
                  >
                    <Play className="w-5 h-5" />
                    Start Game
                  </motion.button>
                </motion.div>
              </motion.div>
            )}

            {gameState === 'paused' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/80 backdrop-blur-sm rounded-2xl"
              >
                <motion.div
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  className="text-center"
                >
                  <Pause className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
                  <h2 className="text-2xl font-bold text-white mb-4">Paused</h2>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={togglePause}
                    className="flex items-center gap-2 mx-auto px-6 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-semibold rounded-xl shadow-lg"
                  >
                    <Play className="w-5 h-5" />
                    Resume
                  </motion.button>
                </motion.div>
              </motion.div>
            )}

            {gameState === 'gameover' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/85 backdrop-blur-sm rounded-2xl"
              >
                <motion.div
                  initial={{ scale: 0.8, y: 20 }}
                  animate={{ scale: 1, y: 0 }}
                  transition={{ type: 'spring', stiffness: 200 }}
                  className="text-center"
                >
                  <div className="text-5xl mb-3">💀</div>
                  <h2 className="text-2xl font-bold text-red-400 mb-1">Game Over!</h2>
                  <p className="text-white text-3xl font-bold mb-1">{score}</p>
                  <p className="text-slate-400 text-sm mb-1">
                    {score >= highScores[difficulty] && score > 0
                      ? '🎉 New High Score!'
                      : `Best: ${highScores[difficulty]}`}
                  </p>
                  <p className="text-slate-500 text-xs mb-5">
                    Difficulty: {DIFFICULTY_LABELS[difficulty]}
                  </p>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={restartGame}
                    className="flex items-center gap-2 mx-auto px-6 py-3 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-semibold rounded-xl shadow-lg shadow-emerald-500/30"
                  >
                    <RotateCcw className="w-5 h-5" />
                    Play Again
                  </motion.button>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Controls */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="relative z-10 mt-4 flex flex-col items-center gap-3"
      >
        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          {gameState === 'playing' && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={togglePause}
              className="flex items-center gap-2 px-4 py-2 bg-slate-700/80 border border-slate-600 text-white rounded-xl hover:bg-slate-600/80 transition-colors"
            >
              <Pause className="w-4 h-4" />
              <span className="text-sm font-medium">Pause</span>
            </motion.button>
          )}
          {gameState === 'paused' && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={togglePause}
              className="flex items-center gap-2 px-4 py-2 bg-slate-700/80 border border-slate-600 text-white rounded-xl hover:bg-slate-600/80 transition-colors"
            >
              <Play className="w-4 h-4" />
              <span className="text-sm font-medium">Resume</span>
            </motion.button>
          )}
          {(gameState === 'playing' || gameState === 'paused') && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={restartGame}
              className="flex items-center gap-2 px-4 py-2 bg-slate-700/80 border border-slate-600 text-white rounded-xl hover:bg-slate-600/80 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              <span className="text-sm font-medium">Restart</span>
            </motion.button>
          )}
        </div>

        {/* D-Pad for mobile */}
        <div className="md:hidden grid grid-cols-3 gap-1 mt-2">
          <div />
          <button
            onTouchStart={(e) => { e.preventDefault(); handleDPad('UP'); }}
            className="w-14 h-14 flex items-center justify-center bg-slate-700/80 border border-slate-600 rounded-xl active:bg-slate-600 active:scale-95 transition-all"
          >
            <ChevronUp className="w-6 h-6 text-white" />
          </button>
          <div />
          <button
            onTouchStart={(e) => { e.preventDefault(); handleDPad('LEFT'); }}
            className="w-14 h-14 flex items-center justify-center bg-slate-700/80 border border-slate-600 rounded-xl active:bg-slate-600 active:scale-95 transition-all"
          >
            <ChevronLeft className="w-6 h-6 text-white" />
          </button>
          <button
            onTouchStart={(e) => { e.preventDefault(); handleDPad('DOWN'); }}
            className="w-14 h-14 flex items-center justify-center bg-slate-700/80 border border-slate-600 rounded-xl active:bg-slate-600 active:scale-95 transition-all"
          >
            <ChevronDown className="w-6 h-6 text-white" />
          </button>
          <button
            onTouchStart={(e) => { e.preventDefault(); handleDPad('RIGHT'); }}
            className="w-14 h-14 flex items-center justify-center bg-slate-700/80 border border-slate-600 rounded-xl active:bg-slate-600 active:scale-95 transition-all"
          >
            <ChevronRight className="w-6 h-6 text-white" />
          </button>
        </div>
      </motion.div>

      {/* Footer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="relative z-10 mt-4 text-center"
      >
        <p className="text-slate-500 text-xs">
          All-time High Scores — Easy: {highScores.easy} | Medium: {highScores.medium} | Hard: {highScores.hard}
        </p>
      </motion.div>
    </div>
  );
}

export default App;
