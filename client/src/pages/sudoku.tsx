import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Trophy, Lock, Clock, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type SudokuDifficulty = "easy" | "medium" | "hard";

interface SudokuGameProps {
  isBreakActive: boolean;
  onBreakEnd: () => void;
}

// Utility function to generate a valid Sudoku puzzle
const generateSudoku = (difficulty: SudokuDifficulty) => {
  // Start with a solved Sudoku board
  const solvedBoard = Array(9).fill(null).map(() => Array(9).fill(0));
  
  // Fill the diagonal boxes first (which can be filled without constraints)
  fillDiagonalBoxes(solvedBoard);
  
  // Fill the rest of the board
  solveSudoku(solvedBoard);
  
  // Make a deep copy of the solved board for the puzzle
  const puzzleBoard = solvedBoard.map(row => [...row]);
  
  // Remove numbers based on difficulty
  const cellsToRemove = {
    easy: 40,
    medium: 50,
    hard: 60
  };
  
  // Remove cells to create the puzzle
  removeNumbers(puzzleBoard, cellsToRemove[difficulty]);
  
  return {
    puzzle: puzzleBoard,
    solution: solvedBoard
  };
};

// Fill the diagonal 3x3 boxes
const fillDiagonalBoxes = (board: number[][]) => {
  for (let box = 0; box < 9; box += 3) {
    fillBox(board, box, box);
  }
};

// Fill a 3x3 box with random numbers
const fillBox = (board: number[][], row: number, col: number) => {
  const nums = [1, 2, 3, 4, 5, 6, 7, 8, 9];
  
  // Shuffle the numbers
  for (let i = nums.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [nums[i], nums[j]] = [nums[j], nums[i]];
  }
  
  let numIndex = 0;
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      board[row + i][col + j] = nums[numIndex++];
    }
  }
};

// Check if it's safe to place a number
const isSafe = (board: number[][], row: number, col: number, num: number) => {
  // Check row
  for (let x = 0; x < 9; x++) {
    if (board[row][x] === num) {
      return false;
    }
  }
  
  // Check column
  for (let y = 0; y < 9; y++) {
    if (board[y][col] === num) {
      return false;
    }
  }
  
  // Check 3x3 box
  const boxRow = Math.floor(row / 3) * 3;
  const boxCol = Math.floor(col / 3) * 3;
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      if (board[boxRow + i][boxCol + j] === num) {
        return false;
      }
    }
  }
  
  return true;
};

// Solve the Sudoku using backtracking
const solveSudoku = (board: number[][]) => {
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      // Find an empty cell
      if (board[row][col] === 0) {
        // Try placing a number 1-9
        for (let num = 1; num <= 9; num++) {
          if (isSafe(board, row, col, num)) {
            // Place the number if it's safe
            board[row][col] = num;
            
            // Recursively solve the rest of the board
            if (solveSudoku(board)) {
              return true;
            }
            
            // If placing the number doesn't lead to a solution, backtrack
            board[row][col] = 0;
          }
        }
        // If no number can be placed, backtrack
        return false;
      }
    }
  }
  // If we've filled all cells, the board is solved
  return true;
};

// Remove numbers to create a puzzle
const removeNumbers = (board: number[][], count: number) => {
  let removed = 0;
  while (removed < count) {
    const row = Math.floor(Math.random() * 9);
    const col = Math.floor(Math.random() * 9);
    
    if (board[row][col] !== 0) {
      board[row][col] = 0;
      removed++;
    }
  }
};

// Verify if the current board matches the solution
const checkSolution = (board: number[][], solution: number[][]) => {
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      if (board[row][col] !== 0 && board[row][col] !== solution[row][col]) {
        return false;
      }
    }
  }
  
  // Check if all non-zero cells match the solution
  return board.flat().filter(cell => cell !== 0).length === 81;
};

export default function SudokuPage({ isBreakActive, onBreakEnd }: SudokuGameProps) {
  const [difficulty, setDifficulty] = useState<SudokuDifficulty>("easy");
  const [game, setGame] = useState(() => generateSudoku(difficulty));
  const [board, setBoard] = useState<number[][]>([]);
  const [selectedCell, setSelectedCell] = useState<[number, number] | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  const [timer, setTimer] = useState(0);
  const { toast } = useToast();

  // Initialize the board when the game changes
  useEffect(() => {
    setBoard(game.puzzle.map(row => [...row]));
    setSelectedCell(null);
    setIsComplete(false);
    setTimer(0);
  }, [game]);

  // Timer effect
  useEffect(() => {
    let interval: number;
    
    if (isBreakActive && !isComplete) {
      interval = window.setInterval(() => {
        setTimer(prev => prev + 1);
      }, 1000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isBreakActive, isComplete]);

  // Format the timer as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Handle cell selection
  const handleCellSelect = (row: number, col: number) => {
    if (!isBreakActive) return;
    if (game.puzzle[row][col] === 0) {
      setSelectedCell([row, col]);
    }
  };

  // Handle number input
  const handleNumberInput = (num: number) => {
    if (!isBreakActive || !selectedCell) return;
    
    const [row, col] = selectedCell;
    if (game.puzzle[row][col] !== 0) return;
    
    const newBoard = board.map(r => [...r]);
    newBoard[row][col] = num === newBoard[row][col] ? 0 : num; // Toggle if same number
    setBoard(newBoard);
    
    // Check if the puzzle is complete and correct
    if (checkSolution(newBoard, game.solution)) {
      setIsComplete(true);
      
      // Determine next difficulty level
      let nextDifficulty: SudokuDifficulty = difficulty;
      if (difficulty === "easy") {
        nextDifficulty = "medium";
        toast({
          title: "Level Complete!",
          description: "Congratulations! You've been promoted to Medium difficulty.",
        });
      } else if (difficulty === "medium") {
        nextDifficulty = "hard";
        toast({
          title: "Level Complete!",
          description: "Impressive! You're now at Hard difficulty.",
        });
      } else {
        toast({
          title: "Sudoku Master!",
          description: "You've completed the hardest level. Amazing!",
        });
      }
      
      // Set new difficulty and generate new game after a delay
      setTimeout(() => {
        setDifficulty(nextDifficulty);
        setGame(generateSudoku(nextDifficulty));
      }, 2000);
    }
  };

  // Restart the game with current difficulty
  const handleRestart = () => {
    setGame(generateSudoku(difficulty));
  };

  // If not in break time, show locked message
  if (!isBreakActive) {
    return (
      <div className="container mx-auto px-4 py-10">
        <Card className="max-w-xl mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center justify-center text-2xl">
              <Lock className="mr-2 h-6 w-6" />
              Sudoku Game - Break Time Only
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Access Restricted</AlertTitle>
              <AlertDescription>
                The Sudoku game is only available during your break time. 
                Start a Pomodoro timer and wait for your break to begin.
              </AlertDescription>
            </Alert>
            <div className="flex justify-center">
              <Button onClick={() => window.history.back()}>
                Return to Main App
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-xl md:text-2xl">
              Sudoku Game - {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)} Level
            </CardTitle>
            <div className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              <span className="font-bold">{isComplete ? "Completed!" : "In Progress"}</span>
            </div>
          </div>
          <div className="flex justify-between items-center mt-2">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span>{formatTime(timer)}</span>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRestart}
              disabled={isComplete}
            >
              Restart
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Sudoku Board */}
          <div 
            className="grid grid-cols-9 gap-0.5 border-2 border-black mb-6 bg-black"
            style={{ aspectRatio: '1/1' }}
          >
            {board.map((row, rowIndex) =>
              row.map((cell, colIndex) => {
                const isSelected = selectedCell && selectedCell[0] === rowIndex && selectedCell[1] === colIndex;
                const isPrefilled = game.puzzle[rowIndex][colIndex] !== 0;
                const boxRow = Math.floor(rowIndex / 3);
                const boxCol = Math.floor(colIndex / 3);
                const isOddBox = (boxRow + boxCol) % 2 === 1;
                
                return (
                  <div
                    key={`${rowIndex}-${colIndex}`}
                    className={`
                      flex items-center justify-center
                      aspect-square cursor-pointer text-lg font-bold transition-colors
                      ${isSelected ? 'bg-primary/20' : isOddBox ? 'bg-gray-100' : 'bg-white'}
                      ${isPrefilled ? 'text-black' : 'text-primary'}
                      ${(rowIndex + 1) % 3 === 0 && rowIndex < 8 ? 'border-b-2 border-black' : ''}
                      ${(colIndex + 1) % 3 === 0 && colIndex < 8 ? 'border-r-2 border-black' : ''}
                    `}
                    onClick={() => handleCellSelect(rowIndex, colIndex)}
                  >
                    {cell !== 0 ? cell : ''}
                  </div>
                );
              })
            )}
          </div>
          
          {/* Number Input Buttons */}
          <div className="grid grid-cols-9 gap-1">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
              <Button
                key={num}
                variant="outline"
                className="aspect-square text-lg font-bold p-0"
                onClick={() => handleNumberInput(num)}
                disabled={isComplete || !selectedCell}
              >
                {num}
              </Button>
            ))}
          </div>
          
          {isComplete && (
            <Alert className="mt-4 border-green-500 bg-green-50">
              <Trophy className="h-4 w-4 text-green-500" />
              <AlertTitle>Congratulations!</AlertTitle>
              <AlertDescription>
                You've completed the {difficulty} level Sudoku puzzle!
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
}