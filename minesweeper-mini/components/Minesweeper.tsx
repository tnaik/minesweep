'use client'

import { useState, useEffect, useCallback } from 'react';

interface CellProps {
  value: number;
  revealed: boolean;
  flagged: boolean;
  onClick: () => void;
  onRightClick: (e: React.MouseEvent) => void;
}

interface GameStatusProps {
  gameState: 'ready' | 'playing' | 'won' | 'lost';
  mineCount: number;
  flagCount: number;
  resetGame: () => void;
}

// Cell component for individual cells in the grid
const Cell = ({ value, revealed, flagged, onClick, onRightClick }: CellProps) => {
  let content: string | number = '';
  let bgColor = 'bg-gray-300';
  let textColor = 'text-black';
  
  if (flagged) {
    content = '🚩';
    bgColor = 'bg-gray-300';
  } else if (!revealed) {
    bgColor = 'bg-gray-400 hover:bg-gray-500';
  } else if (value === -1) {
    content = '💣';
    bgColor = 'bg-red-500';
  } else if (value > 0) {
    content = value;
    bgColor = 'bg-gray-200';
    
    // Different colors for different numbers
    if (value === 1) textColor = 'text-blue-600';
    else if (value === 2) textColor = 'text-green-600';
    else if (value === 3) textColor = 'text-red-600';
    else if (value === 4) textColor = 'text-purple-600';
    else if (value === 5) textColor = 'text-orange-600';
    else textColor = 'text-pink-600';
  } else {
    bgColor = 'bg-gray-200';
  }
  
  return (
    <button 
      className={`w-10 h-10 flex items-center justify-center border border-gray-500 font-bold ${bgColor} ${textColor}`}
      onClick={onClick}
      onContextMenu={onRightClick}
    >
      {content}
    </button>
  );
};

// Game status display component
const GameStatus = ({ gameState, mineCount, flagCount, resetGame }: GameStatusProps) => {
  let statusMessage = '';
  let statusColor = '';
  
  if (gameState === 'won') {
    statusMessage = 'You Win! 🎉';
    statusColor = 'text-green-600';
  } else if (gameState === 'lost') {
    statusMessage = 'Game Over! 💥';
    statusColor = 'text-red-600';
  } else {
    statusMessage = 'Mines: ' + (mineCount - flagCount);
    statusColor = 'text-blue-600';
  }
  
  return (
    <div className="flex justify-between items-center p-2 mb-4 bg-gray-100 rounded">
      <h2 className={`text-xl font-bold ${statusColor}`}>{statusMessage}</h2>
      <button 
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        onClick={resetGame}
      >
        New Game
      </button>
    </div>
  );
};

// Main game component
const Minesweeper = () => {
  const size = 9;
  const mineCount = 5;
  
  // Game state
  const [board, setBoard] = useState<number[][]>([]);
  const [revealed, setRevealed] = useState<boolean[][]>([]);
  const [flagged, setFlagged] = useState<boolean[][]>([]);
  const [gameState, setGameState] = useState<'ready' | 'playing' | 'won' | 'lost'>('ready');
  const [flagCount, setFlagCount] = useState(0);
  
  // Initialize game board
  const initializeGame = useCallback(() => {
    // Create empty board
    const newBoard: number[][] = Array(size).fill(null).map(() => Array(size).fill(0));
    
    // Place mines randomly
    let placedMines = 0;
    while (placedMines < mineCount) {
      const row = Math.floor(Math.random() * size);
      const col = Math.floor(Math.random() * size);
      
      if (newBoard[row][col] === 0) {
        newBoard[row][col] = -1;
        placedMines++;
      }
    }
    
    // Calculate numbers for each cell (number of adjacent mines)
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (newBoard[r][c] === -1) continue;
        
        let count = 0;
        // Check all 8 surrounding cells
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            const newRow = r + dr;
            const newCol = c + dc;
            
            // Skip if out of bounds or the current cell
            if (newRow < 0 || newRow >= size || newCol < 0 || newCol >= size || (dr === 0 && dc === 0)) {
              continue;
            }
            
            if (newBoard[newRow][newCol] === -1) {
              count++;
            }
          }
        }
        
        newBoard[r][c] = count;
      }
    }
    
    // Initialize revealed and flagged arrays
    const newRevealed: boolean[][] = Array(size).fill(null).map(() => Array(size).fill(false));
    const newFlagged: boolean[][] = Array(size).fill(null).map(() => Array(size).fill(false));
    
    setBoard(newBoard);
    setRevealed(newRevealed);
    setFlagged(newFlagged);
    setGameState('playing');
    setFlagCount(0);
  }, [size, mineCount]);
  
  // Initialize game on first render
  useEffect(() => {
    initializeGame();
  }, [initializeGame]);
  
  // Reveal cell function
  const revealCell = (r: number, c: number) => {
    if (gameState !== 'playing' || revealed[r][c] || flagged[r][c]) return;
    
    const newRevealed = [...revealed.map(row => [...row])];
    
    // If clicked on a mine, game over
    if (board[r][c] === -1) {
      newRevealed[r][c] = true;
      setRevealed(newRevealed);
      setGameState('lost');
      
      // Reveal all mines
      const finalRevealed = newRevealed.map((row, rowIndex) => 
        row.map((cell, colIndex) => 
          board[rowIndex][colIndex] === -1 ? true : cell
        )
      );
      setRevealed(finalRevealed);
      
      return;
    }
    
    // Recursive flood fill for empty cells
    const floodFill = (r: number, c: number) => {
      if (r < 0 || r >= size || c < 0 || c >= size || newRevealed[r][c] || flagged[r][c]) return;
      
      newRevealed[r][c] = true;
      
      // If it's an empty cell, reveal adjacent cells
      if (board[r][c] === 0) {
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            floodFill(r + dr, c + dc);
          }
        }
      }
    };
    
    floodFill(r, c);
    setRevealed(newRevealed);
    
    // Check for win
    const allNonMinesRevealed = newRevealed.every((row, rowIndex) => 
      row.every((cell, colIndex) => 
        cell || board[rowIndex][colIndex] === -1
      )
    );
    
    if (allNonMinesRevealed) {
      setGameState('won');
      
      // Flag all mines
      const winFlagged = flagged.map((row, rowIndex) => 
        row.map((cell, colIndex) => 
          board[rowIndex][colIndex] === -1 ? true : cell
        )
      );
      setFlagged(winFlagged);
      setFlagCount(mineCount);
    }
  };
  
  // Toggle flag on cell
  const toggleFlag = (r: number, c: number, e: React.MouseEvent) => {
    e.preventDefault();
    
    if (gameState !== 'playing' || revealed[r][c]) return;
    
    const newFlagged = [...flagged.map(row => [...row])];
    newFlagged[r][c] = !newFlagged[r][c];
    
    const newFlagCount = newFlagged.flat().filter(Boolean).length;
    
    setFlagged(newFlagged);
    setFlagCount(newFlagCount);
  };
  
  return (
    <div className="p-4 max-w-md mx-auto">
      <h1 className="text-2xl font-bold text-center mb-4">Minesweeper</h1>
      
      <GameStatus 
        gameState={gameState} 
        mineCount={mineCount} 
        flagCount={flagCount} 
        resetGame={initializeGame} 
      />
      
      <div className="border-4 border-gray-600 inline-block">
        {board.map((row, rowIndex) => (
          <div key={rowIndex} className="flex">
            {row.map((cell, colIndex) => (
              <Cell 
                key={colIndex}
                value={cell}
                revealed={revealed[rowIndex][colIndex]}
                flagged={flagged[rowIndex][colIndex]}
                onClick={() => revealCell(rowIndex, colIndex)}
                onRightClick={(e) => toggleFlag(rowIndex, colIndex, e)}
              />
            ))}
          </div>
        ))}
      </div>
      
      <div className="mt-4 text-sm text-gray-600">
        <p>Left-click to reveal a cell. Right-click to place a flag.</p>
        <p>Goal: Reveal all cells that don't contain mines.</p>
      </div>
    </div>
  );
};

export default Minesweeper;