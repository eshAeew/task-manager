import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  Trophy, Lock, Clock, AlertCircle, Brain, 
  Dices, ArrowRight, RefreshCw, Rocket, 
  BrainCircuit, Sparkles, CheckCircle2, XCircle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

type SudokuDifficulty = "easy" | "medium" | "hard";

interface SudokuGameProps {
  isBreakActive: boolean;
  onBreakEnd: () => void;
}

// Difficulty level styling
const difficultyStyles = {
  easy: {
    color: "text-green-600",
    bg: "bg-green-50",
    border: "border-green-200",
    icon: <Brain className="h-4 w-4 text-green-500" />,
    progress: 33
  },
  medium: {
    color: "text-amber-600",
    bg: "bg-amber-50",
    border: "border-amber-200",
    icon: <BrainCircuit className="h-4 w-4 text-amber-500" />,
    progress: 66
  },
  hard: {
    color: "text-red-600",
    bg: "bg-red-50",
    border: "border-red-200",
    icon: <Rocket className="h-4 w-4 text-red-500" />,
    progress: 100
  }
};

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
  const [progress, setProgress] = useState(0);
  const [tabView, setTabView] = useState<"game" | "help">("game");
  // Track valid/invalid entries and hints
  const [validMoves, setValidMoves] = useState(0);
  const [invalidMoves, setInvalidMoves] = useState(0);
  const [hintsUsed, setHintsUsed] = useState(0);
  const { toast } = useToast();

  // Initialize the board when the game changes
  useEffect(() => {
    setBoard(game.puzzle.map(row => [...row]));
    setSelectedCell(null);
    setIsComplete(false);
    setTimer(0);
    setValidMoves(0);
    setInvalidMoves(0);
    setHintsUsed(0);
    setProgress(0);
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

  // Calculate game progress
  useEffect(() => {
    if (!board.length) return;
    
    const totalCells = 81;
    const filledCells = board.flat().filter(cell => cell !== 0).length;
    const initialFilledCells = game.puzzle.flat().filter(cell => cell !== 0).length;
    const userFilledCells = filledCells - initialFilledCells;
    const totalEmptyCells = totalCells - initialFilledCells;
    
    const newProgress = Math.floor((userFilledCells / totalEmptyCells) * 100);
    setProgress(newProgress);
  }, [board, game.puzzle]);

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
    
    // If we're toggling the same number off, just clear it
    if (num === newBoard[row][col]) {
      newBoard[row][col] = 0;
      setBoard(newBoard);
      return;
    }
    
    // Check if this is a valid move against the solution
    const isValid = num === game.solution[row][col];
    
    // Update move statistics
    if (isValid) {
      setValidMoves(prev => prev + 1);
      // Visual feedback for correct move
      toast({
        description: "Correct move!",
        duration: 1000,
      });
    } else {
      setInvalidMoves(prev => prev + 1);
      // Visual feedback for incorrect move
      toast({
        description: "Not quite right...",
        duration: 1000,
      });
    }
    
    // Update the board with the new number
    newBoard[row][col] = num;
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
          duration: 5000,
        });
      }
      
      // Set new difficulty and generate new game after a delay
      setTimeout(() => {
        setDifficulty(nextDifficulty);
        setGame(generateSudoku(nextDifficulty));
      }, 2000);
    }
  };

  // Get a hint for the currently selected cell
  const getHint = () => {
    if (!selectedCell) return;
    
    const [row, col] = selectedCell;
    if (game.puzzle[row][col] !== 0 || board[row][col] === game.solution[row][col]) return;
    
    const newBoard = board.map(r => [...r]);
    newBoard[row][col] = game.solution[row][col];
    setBoard(newBoard);
    setHintsUsed(prev => prev + 1);
    
    toast({
      title: "Hint Used",
      description: `The correct number is ${game.solution[row][col]}.`,
    });
  };

  // Restart the game with current difficulty
  const handleRestart = () => {
    setGame(generateSudoku(difficulty));
    toast({
      description: "Game restarted with a new puzzle.",
    });
  };

  // Change difficulty level
  const changeDifficulty = (newDifficulty: SudokuDifficulty) => {
    if (newDifficulty === difficulty) return;
    
    setDifficulty(newDifficulty);
    setGame(generateSudoku(newDifficulty));
    toast({
      description: `Difficulty changed to ${newDifficulty}.`,
    });
  };

  // If not in break time, show locked message
  if (!isBreakActive) {
    return (
      <div className="container mx-auto px-4 py-10">
        <Card className="max-w-xl mx-auto">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center text-2xl text-red-500">
              <Lock className="mr-2 h-6 w-6" />
              Sudoku Game - Break Time Only
            </CardTitle>
            <CardDescription className="text-lg">
              Take a productive break with Sudoku
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="flex flex-col items-center justify-center p-4 rounded-lg border bg-amber-50 border-amber-200">
                <Brain className="h-12 w-12 text-amber-500 mb-2" />
                <h3 className="font-semibold text-amber-700">Exercise Your Mind</h3>
                <p className="text-center text-sm text-amber-600">
                  Sudoku improves concentration and logical thinking
                </p>
              </div>
              <div className="flex flex-col items-center justify-center p-4 rounded-lg border bg-blue-50 border-blue-200">
                <Clock className="h-12 w-12 text-blue-500 mb-2" />
                <h3 className="font-semibold text-blue-700">Perfect for Breaks</h3>
                <p className="text-center text-sm text-blue-600">
                  Mentally recharge before returning to work
                </p>
              </div>
            </div>
            
            <Alert className="border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4 text-red-500" />
              <AlertTitle>Access Restricted</AlertTitle>
              <AlertDescription>
                The Sudoku game is only available during your break time. 
                Start a Pomodoro timer and wait for your break to begin.
              </AlertDescription>
            </Alert>
            
            <div className="flex justify-center mt-4">
              <Button 
                onClick={() => window.history.back()}
                className="relative overflow-hidden group"
              >
                <div className="absolute inset-0 w-3 bg-green-500 transition-all duration-300 ease-out group-hover:w-full"></div>
                <span className="relative text-white group-hover:text-white">Return to Main App</span>
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
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <CardTitle className="text-xl md:text-2xl flex items-center">
                {difficultyStyles[difficulty].icon}
                <span className="ml-2">Sudoku</span>
                <Badge 
                  variant="outline" 
                  className={`ml-3 ${difficultyStyles[difficulty].bg} ${difficultyStyles[difficulty].color} ${difficultyStyles[difficulty].border}`}
                >
                  {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
                </Badge>
              </CardTitle>
              <CardDescription className="mt-1">
                Train your brain during your break
              </CardDescription>
            </div>
            
            <div className="flex items-center gap-2">
              {isComplete ? (
                <Badge className="bg-green-500">
                  <Trophy className="h-3 w-3 mr-1" />
                  Completed!
                </Badge>
              ) : (
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4 text-slate-500" />
                  <span className="font-mono font-medium text-slate-700">{formatTime(timer)}</span>
                </div>
              )}
            </div>
          </div>
          
          <Tabs value={tabView} onValueChange={(val) => setTabView(val as "game" | "help")} className="mt-2">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="game">
                <Dices className="h-4 w-4 mr-2" />
                Game
              </TabsTrigger>
              <TabsTrigger value="help">
                <AlertCircle className="h-4 w-4 mr-2" />
                How to Play
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        
        <CardContent className="pt-2">
          <TabsContent value="game" className="mt-0 space-y-4">
            {/* Game Progress */}
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span>Progress</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
            
            {/* Sudoku Board */}
            <div className="relative">
              <div 
                className="grid grid-cols-9 gap-0.5 border-2 border-slate-800 rounded-md mb-6 bg-slate-900 shadow-lg"
                style={{ aspectRatio: '1/1' }}
              >
                {board.map((row, rowIndex) =>
                  row.map((cell, colIndex) => {
                    const isSelected = selectedCell && selectedCell[0] === rowIndex && selectedCell[1] === colIndex;
                    const isPrefilled = game.puzzle[rowIndex][colIndex] !== 0;
                    const isCorrect = cell !== 0 && cell === game.solution[rowIndex][colIndex];
                    const isIncorrect = cell !== 0 && cell !== game.solution[rowIndex][colIndex];
                    const boxRow = Math.floor(rowIndex / 3);
                    const boxCol = Math.floor(colIndex / 3);
                    const isOddBox = (boxRow + boxCol) % 2 === 1;
                    
                    return (
                      <div
                        key={`${rowIndex}-${colIndex}`}
                        className={`
                          flex items-center justify-center
                          aspect-square cursor-pointer text-lg font-bold transition-all duration-150
                          ${isSelected ? 'bg-primary/20 shadow-inner' : isOddBox ? 'bg-slate-50' : 'bg-white'}
                          ${isPrefilled ? 'text-slate-700 font-extrabold' : isCorrect ? 'text-green-600' : isIncorrect ? 'text-red-500' : 'text-primary'}
                          ${(rowIndex + 1) % 3 === 0 && rowIndex < 8 ? 'border-b-2 border-slate-800' : 'border-b border-slate-200'}
                          ${(colIndex + 1) % 3 === 0 && colIndex < 8 ? 'border-r-2 border-slate-800' : 'border-r border-slate-200'}
                          hover:bg-blue-50
                        `}
                        onClick={() => handleCellSelect(rowIndex, colIndex)}
                      >
                        {cell !== 0 ? cell : ''}
                      </div>
                    );
                  })
                )}
              </div>
              
              {isComplete && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/80 rounded-md">
                  <div className="text-center space-y-3 p-6 bg-green-50 rounded-lg border border-green-200 shadow-lg">
                    <Sparkles className="h-12 w-12 text-yellow-500 mx-auto" />
                    <h3 className="text-xl font-bold text-green-700">Level Complete!</h3>
                    <p className="text-green-600">Moving to the next difficulty level...</p>
                  </div>
                </div>
              )}
            </div>
            
            {/* Game Controls */}
            <div className="space-y-4">
              {/* Number Input Buttons */}
              <div className="grid grid-cols-9 gap-1">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                  <Button
                    key={num}
                    variant="outline"
                    className="aspect-square text-lg font-bold p-0 hover:bg-blue-50 hover:border-blue-300"
                    onClick={() => handleNumberInput(num)}
                    disabled={isComplete || !selectedCell}
                  >
                    {num}
                  </Button>
                ))}
              </div>
              
              {/* Game Action Buttons */}
              <div className="flex justify-between mt-4">
                <div className="space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={getHint}
                    disabled={isComplete || !selectedCell}
                    className="text-amber-600 border-amber-200 bg-amber-50 hover:bg-amber-100"
                  >
                    <Sparkles className="h-4 w-4 mr-1" />
                    Hint
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRestart}
                    disabled={isComplete}
                    className="text-slate-600 border-slate-200 hover:bg-slate-100"
                  >
                    <RefreshCw className="h-4 w-4 mr-1" />
                    Restart
                  </Button>
                </div>
                
                <div className="space-x-2">
                  {difficulty !== "easy" && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => changeDifficulty("easy")}
                      disabled={isComplete || difficulty === "easy"}
                      className="text-green-600 border-green-200 bg-green-50 hover:bg-green-100"
                    >
                      Easy
                    </Button>
                  )}
                  {difficulty !== "medium" && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => changeDifficulty("medium")}
                      disabled={isComplete || difficulty === "medium"}
                      className="text-amber-600 border-amber-200 bg-amber-50 hover:bg-amber-100"
                    >
                      Medium
                    </Button>
                  )}
                  {difficulty !== "hard" && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => changeDifficulty("hard")}
                      disabled={isComplete || difficulty === "hard"}
                      className="text-red-600 border-red-200 bg-red-50 hover:bg-red-100"
                    >
                      Hard
                    </Button>
                  )}
                </div>
              </div>
              
              {/* Game Statistics */}
              <div className="grid grid-cols-3 gap-2 mt-4">
                <div className="p-2 bg-green-50 rounded border border-green-200 text-center">
                  <div className="flex items-center justify-center mb-1">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mr-1" />
                    <span className="text-sm font-medium text-green-700">Correct</span>
                  </div>
                  <span className="text-lg font-bold text-green-600">{validMoves}</span>
                </div>
                <div className="p-2 bg-red-50 rounded border border-red-200 text-center">
                  <div className="flex items-center justify-center mb-1">
                    <XCircle className="h-4 w-4 text-red-500 mr-1" />
                    <span className="text-sm font-medium text-red-700">Incorrect</span>
                  </div>
                  <span className="text-lg font-bold text-red-600">{invalidMoves}</span>
                </div>
                <div className="p-2 bg-amber-50 rounded border border-amber-200 text-center">
                  <div className="flex items-center justify-center mb-1">
                    <Sparkles className="h-4 w-4 text-amber-500 mr-1" />
                    <span className="text-sm font-medium text-amber-700">Hints</span>
                  </div>
                  <span className="text-lg font-bold text-amber-600">{hintsUsed}</span>
                </div>
              </div>
              
              {/* Progression Indicator */}
              <div className="pt-2 mt-4 border-t border-slate-200">
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <Brain className="h-5 w-5 text-green-500" />
                    <ArrowRight className="h-4 w-4 mx-1" />
                    <BrainCircuit className="h-5 w-5 text-amber-500" />
                    <ArrowRight className="h-4 w-4 mx-1" />
                    <Rocket className="h-5 w-5 text-red-500" />
                  </div>
                  <span className="text-sm text-slate-500">Difficulty Progression</span>
                </div>
                <Progress 
                  value={difficultyStyles[difficulty].progress} 
                  className="h-2 mt-1" 
                />
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="help" className="mt-0 space-y-4">
            <div className="space-y-4 text-slate-700">
              <div>
                <h3 className="font-bold text-lg mb-1">How to Play Sudoku</h3>
                <p className="text-sm">
                  Fill the 9×9 grid with digits so that each column, each row, and each of the nine 3×3 subgrids contain all of the digits from 1 to 9.
                </p>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-semibold text-slate-800">Game Rules:</h4>
                <ul className="list-disc pl-5 space-y-1 text-sm">
                  <li>Each row must contain the numbers 1-9 without repetition</li>
                  <li>Each column must contain the numbers 1-9 without repetition</li>
                  <li>Each 3×3 box must contain the numbers 1-9 without repetition</li>
                </ul>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-semibold text-slate-800">Controls:</h4>
                <ul className="list-disc pl-5 space-y-1 text-sm">
                  <li>Click on an empty cell to select it</li>
                  <li>Click a number button to place that number in the selected cell</li>
                  <li>Click the same number again to remove it</li>
                  <li>Use the Hint button if you're stuck (it will fill in the correct number)</li>
                </ul>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-semibold text-slate-800">Difficulty Levels:</h4>
                <ul className="list-disc pl-5 space-y-1 text-sm">
                  <li><span className="text-green-600 font-medium">Easy</span> - More numbers are provided, good for beginners</li>
                  <li><span className="text-amber-600 font-medium">Medium</span> - Fewer starting numbers, requires more deduction</li>
                  <li><span className="text-red-600 font-medium">Hard</span> - Minimal starting numbers, challenging puzzles</li>
                </ul>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-semibold text-slate-800">Tips:</h4>
                <ul className="list-disc pl-5 space-y-1 text-sm">
                  <li>Look for rows, columns, or boxes that are almost complete</li>
                  <li>Use the process of elimination - if a number can only go in one place, it must go there</li>
                  <li>Start with the easier puzzles and work your way up</li>
                </ul>
              </div>
              
              <div className="bg-blue-50 p-3 rounded-md border border-blue-200 mt-4">
                <p className="text-sm text-blue-700">
                  <span className="font-semibold">Pro Tip:</span> Sudoku is not just fun, it's also great for your brain! It improves concentration, logical thinking, and problem-solving skills.
                </p>
              </div>
            </div>
          </TabsContent>
        </CardContent>
      </Card>
    </div>
  );
}