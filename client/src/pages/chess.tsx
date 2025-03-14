import { useState, useEffect, useCallback, useRef } from 'react';
import { Chessboard } from 'react-chessboard';
import { Chess } from 'chess.js';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CardContent } from "@/components/ui/card";
import { CardDescription } from "@/components/ui/card";
import { CardFooter } from "@/components/ui/card";
import { CardHeader } from "@/components/ui/card";
import { CardTitle } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { DialogContent } from "@/components/ui/dialog";
import { DialogDescription } from "@/components/ui/dialog";
import { DialogFooter } from "@/components/ui/dialog";
import { DialogHeader } from "@/components/ui/dialog";
import { DialogTitle } from "@/components/ui/dialog";
import { Tabs } from "@/components/ui/tabs";
import { TabsContent } from "@/components/ui/tabs";
import { TabsList } from "@/components/ui/tabs";
import { TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Sparkles, Loader, Clock, User, Trophy, ArrowLeftRight, Settings, RefreshCw,
  Home, BookOpen, ChevronUp, ChevronDown, AlertTriangle, Award, Zap, RotateCcw, Eye, Crown, Users } from 'lucide-react';
import { Switch } from "@/components/ui/switch";
// Import Stockfish as a worker
// @ts-ignore
import StockfishWorker from 'stockfish.js/stockfish.js?worker';
import { playSound, initAudio } from '@/components/chess-sounds';

// Types for our game state
type ChessGameMode = 'computer' | 'local' | 'online';
type GameResult = 'checkmate' | 'stalemate' | 'draw' | 'timeout' | null;
type GameDifficulty = 'beginner' | 'intermediate' | 'advanced' | 'master' | 'grandmaster';

// Stockfish difficulty configurations
const stockfishConfig = {
  beginner: {
    depth: 5,
    skill: 3,
    name: "Novice Bot",
    rating: 1000,
    description: "Basic chess understanding, suitable for beginners"
  },
  intermediate: {
    depth: 6,
    skill: 8,
    name: "Casual Bot",
    rating: 1500,
    description: "Decent tactical understanding and strategy"
  },
  advanced: {
    depth: 8,
    skill: 14,
    name: "Expert Bot",
    rating: 2000,
    description: "Strong player with excellent tactical awareness"
  },
  master: {
    depth: 10,
    skill: 18,
    name: "Master Bot",
    rating: 2300,
    description: "Master-level play with deep strategic understanding"
  },
  grandmaster: {
    depth: 12,
    skill: 20,
    name: "Grandmaster Bot",
    rating: 2600,
    description: "Grandmaster-level strength with exceptional play"
  }
};

function ChessPage() {
  const [game, setGame] = useState<Chess>(new Chess());
  const [gameHistory, setGameHistory] = useState<string[]>([]);
  const [capturedPieces, setCapturedPieces] = useState<{white: string[], black: string[]}>({
    white: [],
    black: []
  });
  const [playerColor, setPlayerColor] = useState<'white' | 'black'>('white');
  const [gameMode, setGameMode] = useState<ChessGameMode>('computer');
  const [thinking, setThinking] = useState(false);
  const [gameResult, setGameResult] = useState<GameResult>(null);
  const [openGameEndDialog, setOpenGameEndDialog] = useState(false);
  const [difficulty, setDifficulty] = useState<GameDifficulty>('intermediate');
  const [timeOption, setTimeOption] = useState<'1min' | '5min' | '10min'>('5min');
  const [timeControl, setTimeControl] = useState({
    white: 300,
    black: 300
  });
  const [selectedTab, setSelectedTab] = useState('play');
  const [showPossibleMoves, setShowPossibleMoves] = useState(true);
  const [possibleMoves, setPossibleMoves] = useState<{ [square: string]: string[] }>({});
  const [selectedPiece, setSelectedPiece] = useState<string | null>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const stockfishRef = useRef<any>(null);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  // Get time in seconds based on selected time option
  const getTimeInSeconds = useCallback(() => {
    switch(timeOption) {
      case '1min': return 60;
      case '5min': return 300;
      case '10min': return 600;
      default: return 300;
    }
  }, [timeOption]);

  // Function to start a new game
  const startNewGame = useCallback(() => {
    const newGame = new Chess();
    setGame(newGame);
    setGameHistory([]);
    setCapturedPieces({ white: [], black: [] });
    setGameResult(null);
    setOpenGameEndDialog(false);
    const timeInSeconds = getTimeInSeconds();
    setTimeControl({
      white: timeInSeconds,
      black: timeInSeconds
    });
    setIsTimerRunning(true);
    setPossibleMoves({});
    setSelectedPiece(null);

    // Play game start sound
    playSound('gameStart');

    // If computer is playing and computer is white, make a move
    if (gameMode === 'computer' && playerColor === 'black') {
      setTimeout(() => makeComputerMove(newGame), 500);
    }
  }, [gameMode, playerColor, getTimeInSeconds]);

  // Initialize Stockfish
  useEffect(() => {
    try {
      // Create a new Web Worker for Stockfish
      stockfishRef.current = new StockfishWorker();

      // Configure Stockfish
      stockfishRef.current.postMessage('uci');
      stockfishRef.current.postMessage('isready');

      // Log worker messages for debugging
      stockfishRef.current.onmessage = (event: { data: string }) => {
        console.log('Stockfish message:', event.data);
      };

      // Cleanup
      return () => {
        if (timerRef.current) {
          clearInterval(timerRef.current);
        }
        if (stockfishRef.current) {
          stockfishRef.current.terminate();
        }
      };
    } catch (error) {
      console.error('Error initializing Stockfish:', error);
    }
  }, []);

  // Configure Stockfish based on difficulty
  useEffect(() => {
    if (stockfishRef.current) {
      try {
        const config = stockfishConfig[difficulty];
        stockfishRef.current.postMessage(`setoption name Skill Level value ${config.skill}`);
        stockfishRef.current.postMessage(`setoption name MultiPV value 1`);
      } catch (error) {
        console.error('Error configuring Stockfish:', error);
      }
    }
  }, [difficulty]);

  // Function to make a computer move using Stockfish
  async function makeComputerMove(currentGame: Chess) {
    if (currentGame.isGameOver() || gameResult) return;

    setThinking(true);

    try {
      const move = await getStockfishMove(currentGame.fen());
      console.log('Stockfish suggested move:', move);

      if (!move) {
        console.error('No move received from Stockfish');
        setThinking(false);
        return;
      }

      // Check if the move is a capture
      const targetSquare = move.substring(2, 4);
      const targetPiece = currentGame.get(targetSquare as any);
      const isCapture = targetPiece !== null;

      // Make the move
      const result = currentGame.move({
        from: move.substring(0, 2),
        to: targetSquare,
        promotion: move.length > 4 ? move[4] : undefined
      });

      if (!result) {
        console.error('Invalid move from Stockfish:', move);
        setThinking(false);
        return;
      }

      // Play appropriate sound
      playSound(isCapture ? 'capture' : 'move');

      // Update the game state
      setGame(new Chess(currentGame.fen()));
      setGameHistory(prev => [...prev, move]);

      // Check if the game is over after computer's move
      if (currentGame.isGameOver()) {
        handleGameEnd();
      }
    } catch (error) {
      console.error('Error making computer move:', error);
    } finally {
      setThinking(false);
    }
  }

  // Stockfish move helper function
  const getStockfishMove = (fen: string): Promise<string> => {
    return new Promise((resolve) => {
      try {
        const config = stockfishConfig[difficulty];

        // Remove previous message handler
        if (stockfishRef.current) {
          stockfishRef.current.onmessage = null;
        }

        stockfishRef.current.onmessage = (event: { data: string }) => {
          const message = event.data;
          console.log('Stockfish response:', message);

          if (message.startsWith('bestmove')) {
            const move = message.split(' ')[1];
            resolve(move);
          }
        };

        // Send position and calculate command with movetime limit
        stockfishRef.current.postMessage(`position fen ${fen}`);
        // Add movetime parameter (in milliseconds) based on difficulty
        const moveTime = difficulty === 'grandmaster' ? 1500 :
                        difficulty === 'master' ? 1200 :
                        difficulty === 'advanced' ? 1000 :
                        difficulty === 'intermediate' ? 800 : 500;

        stockfishRef.current.postMessage(`go depth ${config.depth} movetime ${moveTime}`);
      } catch (error) {
        console.error('Error getting Stockfish move:', error);
        resolve(''); // Resolve with empty string in case of error
      }
    });
  };

  // Helper function to check if a square is controlled by a side
  function isSquareControlledBy(game: Chess, square: string, color: string): boolean {
    try {
      return game.moves({ square: square as any, verbose: true })
        .some(move => move.color === color);
    } catch {
      return false;
    }
  }

  // Helper function to check if a square is occupied by a specific piece
  function isSquareOccupied(game: Chess, square: string, color: string, pieceType: string): boolean {
    const piece = game.get(square as any);
    return piece !== null && piece !== undefined && piece.color === color && piece.type === pieceType;
  }

  // Function to handle game end
  function handleGameEnd() {
    if (game.isCheckmate()) {
      setGameResult('checkmate');
    } else if (game.isStalemate()) {
      setGameResult('stalemate');
    } else if (game.isDraw()) {
      setGameResult('draw');
    }

    setOpenGameEndDialog(true);
    setIsTimerRunning(false);
  }

  // Function to format time from seconds to MM:SS
  function formatTime(seconds: number) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  function getResultMessage() {
    if (!gameResult) return '';

    if (gameResult === 'checkmate') {
      const winner = game.turn() === 'w' ? 'Black' : 'White';
      return `Checkmate! ${winner} wins!`;
    } else if (gameResult === 'stalemate') {
      return 'Game ended in stalemate.';
    } else if (gameResult === 'draw') {
      return 'Game ended in a draw.';
    } else if (gameResult === 'timeout') {
      const winner = game.turn() === 'w' ? 'Black' : 'White';
      return `Time's up! ${winner} wins!`;
    }

    return '';
  }

  // Function to calculate possible moves for a selected piece
  const calculatePossibleMoves = useCallback((square: string) => {
    if (!showPossibleMoves || !square) return {};

    try {
      // Get all possible moves for the selected piece
      const legalMoves: string[] = [];

      // Square must be in a5, e4 format for the chess.js library
      const moves = game.moves({
        square: square as any, // Type assertion needed for chess.js compatibility
        verbose: true
      });

      // Extract target squares - move.to will be a square like "a5"
      moves.forEach(move => {
        if (typeof move === 'object' && 'to' in move) {
          legalMoves.push(move.to as string);
        }
      });

      return { [square]: legalMoves };
    } catch (e) {
      return {};
    }
  }, [game, showPossibleMoves]);

  // Handle square click to show possible moves
  const onSquareClick = useCallback((square: string) => {
    // Only show possible moves if showPossibleMoves is enabled and it's the player's turn
    const currentPlayerColor = game.turn() === 'w' ? 'white' : 'black';
    const isPlayerTurn = (gameMode === 'local') || (currentPlayerColor === playerColor);

    if (!showPossibleMoves || !isPlayerTurn || gameResult) {
      setPossibleMoves({});
      setSelectedPiece(null);
      return;
    }

    // Check if there's a piece on the square, using 'any' for chess.js compatibility
    const piece = game.get(square as any);

    // If clicking on a piece of the current player's color
    if (piece && (piece.color === game.turn())) {
      const moves = calculatePossibleMoves(square);
      setPossibleMoves(moves);
      setSelectedPiece(square);
    } else {
      // If clicking on an empty square or opponent's piece, clear selection
      setPossibleMoves({});
      setSelectedPiece(null);
    }
  }, [game, showPossibleMoves, playerColor, gameMode, gameResult, calculatePossibleMoves]);

  // Function to handle player moves
  function onDrop(sourceSquare: string, targetSquare: string) {
    if (gameResult) return false;

    // In computer mode, only allow moves for the player's chosen color
    if (gameMode === 'computer') {
      const currentTurn = game.turn() === 'w' ? 'white' : 'black';
      if (currentTurn !== playerColor) {
        return false; // Not player's turn
      }
    }

    try {
      // Check if target square has a piece (capture)
      const targetPiece = game.get(targetSquare as any);
      const isCapture = targetPiece !== null;

      // Try to make the move
      const move = game.move({
        from: sourceSquare,
        to: targetSquare,
        promotion: 'q' // Always promote to queen for simplicity
      });

      // If move is invalid
      if (!move) return false;

      // Play appropriate sound
      const soundType = isCapture ? 'capture' : 'move';
      console.log(`Playing ${soundType} sound...`);
      playSound(soundType).catch(error => {
        console.error(`Error playing ${soundType} sound:`, error);
      });

      // Clear possible moves
      setPossibleMoves({});
      setSelectedPiece(null);

      // Update game history
      setGameHistory(prev => [...prev, `${move.piece.toUpperCase()} ${sourceSquare}-${targetSquare}`]);

      // Check if the game is over
      if (game.isGameOver()) {
        handleGameEnd();
        return true;
      }

      // If playing against computer, make computer move
      if (gameMode === 'computer') {
        setTimeout(() => {
          makeComputerMove(game);
        }, 500);
      }

      return true;
    } catch (e) {
      console.error('Error making move:', e);
      return false;
    }
  }


  // Chess timer
  useEffect(() => {
    if (isTimerRunning) {
      timerRef.current = setInterval(() => {
        setTimeControl(prev => {
          const currentPlayer = game.turn() === 'w' ? 'white' : 'black';
          const newTime = { ...prev };

          if (newTime[currentPlayer] > 0) {
            newTime[currentPlayer] -= 1;
          } else {
            setGameResult('timeout');
            setOpenGameEndDialog(true);
            setIsTimerRunning(false);
            clearInterval(timerRef.current!);
          }

          return newTime;
        });
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isTimerRunning, game]);

  // Track captured pieces
  useEffect(() => {
    if (gameHistory.length > 0) {
      const currentFen = game.fen();
      const whitePieces = (currentFen.split(' ')[0].match(/[PNBRQK]/g) || []).length;
      const blackPieces = (currentFen.split(' ')[0].match(/[pnbrqk]/g) || []).length;

      const totalWhitePieces = 16 - whitePieces;
      const totalBlackPieces = 16 - blackPieces;

      const capturedWhite = Array(totalWhitePieces).fill('♙');
      const capturedBlack = Array(totalBlackPieces).fill('♟︎');

      setCapturedPieces({
        white: capturedWhite,
        black: capturedBlack
      });
    }
  }, [gameHistory, game]);

  // Initialize game
  useEffect(() => {
    startNewGame();

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [startNewGame]);

  // Initialize audio context on component mount and first interaction
  useEffect(() => {
    console.log('Initializing audio context...');
    const handleFirstInteraction = () => {
      try {
        console.log('First interaction detected, initializing audio...');
        initAudio();
        // Play a test sound to verify audio is working
        playSound('gameStart').then(() => {
          console.log('Game start sound played successfully');
        }).catch(error => {
          console.error('Error playing game start sound:', error);
        });
        document.removeEventListener('click', handleFirstInteraction);
      } catch (error) {
        console.error('Error initializing audio:', error);
      }
    };

    document.addEventListener('click', handleFirstInteraction);
    return () => {
      document.removeEventListener('click', handleFirstInteraction);
    };
  }, []);

  // Render the Chess.com-like UI
  return (
    <div className="container mx-auto px-4 py-6 min-h-screen">
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
        <TabsContent value="play" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Left sidebar */}
            <div className="space-y-4">
              <Card className="border-2 border-slate-200 dark:border-slate-700 shadow-md overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 border-b pb-3">
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Settings className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      <span>Game Setup</span>
                    </div>
                    <Button
                      variant="default"
                      size="sm"
                      onClick={startNewGame}
                      className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      <RefreshCw className="h-4 w-4" /> New Game
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <p className="text-sm font-medium flex items-center gap-2">
                        <User className="h-4 w-4 text-slate-500" />
                        Game Mode
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          variant={gameMode === 'computer' ? "default" : "outline"}
                          onClick={() => setGameMode('computer')}
                          className={`w-full ${gameMode === 'computer' ? 'bg-blue-600 hover:bg-blue-700 text-white' : ''}`}
                        >
                          Computer
                        </Button>
                        <Button
                          variant={gameMode === 'local' ? "default" : "outline"}
                          onClick={() => setGameMode('local')}
                          className={`w-full ${gameMode === 'local' ? 'bg-blue-600 hover:bg-blue-700 text-white' : ''}`}
                        >
                          Local Play
                        </Button>
                      </div>
                    </div>

                    {gameMode === 'computer' && (
                      <div className="space-y-2 border-t border-b py-3">
                        <p className="text-sm font-medium flex items-center gap-2">
                          <Crown className="h-4 w-4 text-amber-500" />
                          Stockfish Difficulty
                        </p>
                        <div className="grid grid-cols-5 gap-1 rounded-md overflow-hidden border border-slate-200 dark:border-slate-700">
                          <button
                            onClick={() => setDifficulty('beginner')}
                            className={`py-2 px-1 transition-all ${
                              difficulty === 'beginner'
                                ? 'bg-green-600 text-white font-medium'
                                : 'bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700'
                            }`}
                          >
                            <div className="flex flex-col items-center">
                              <span className="text-xs whitespace-nowrap">Novice</span>
                              <div className="flex mt-1">
                                <div className="h-1 w-3 bg-current rounded-full"></div>
                              </div>
                            </div>
                          </button>
                          <button
                            onClick={() => setDifficulty('intermediate')}
                            className={`py-2 px-1 transition-all ${
                              difficulty === 'intermediate'
                                ? 'bg-blue-600 text-white font-medium'
                                : 'bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700'
                            }`}
                          >
                            <div className="flex flex-col items-center">
                              <span className="text-xs whitespace-nowrap">Casual</span>
                              <div className="flex mt-1">
                                <div className="h-1 w-3 bg-current rounded-full"></div>
                                <div className="h-1 w-3 bg-current rounded-full ml-0.5"></div>
                              </div>
                            </div>
                          </button>
                          <button
                            onClick={() => setDifficulty('advanced')}
                            className={`py-2 px-1 transition-all ${
                              difficulty === 'advanced'
                                ? 'bg-amber-600 text-white font-medium'
                                : 'bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700'
                            }`}
                          >
                            <div className="flex flex-col items-center">
                              <span className="text-xs whitespace-nowrap">Expert</span>
                              <div className="flex mt-1">
                                <div className="h-1 w-3 bg-current rounded-full"></div>
                                <div className="h-1 w-3 bg-current rounded-full ml-0.5"></div>
                                <div className="h-1 w-3 bg-current rounded-full ml-0.5"></div>
                              </div>
                            </div>
                          </button>
                          <button
                            onClick={() => setDifficulty('master')}
                            className={`py-2 px-1 transition-all ${
                              difficulty === 'master'
                                ? 'bg-purple-600 text-white font-medium'
                                : 'bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700'
                            }`}
                          >
                            <div className="flex flex-col items-center">
                              <span className="text-xs whitespace-nowrap">Master</span>
                              <div className="flex mt-1">
                                {[...Array(4)].map((_, i) => (
                                  <div key={i} className="h-1 w-3 bg-current rounded-full ml-0.5"></div>
                                ))}
                              </div>
                            </div>
                          </button>
                          <button
                            onClick={() => setDifficulty('grandmaster')}
                            className={`py-2 px-1 transition-all ${
                              difficulty === 'grandmaster'
                                ? 'bg-red-600 text-white font-medium'
                                : 'bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700'
                            }`}
                          >
                            <div className="flex flex-col items-center">
                              <span className="text-xs whitespace-nowrap">GM</span>
                              <div className="flex mt-1">
                                {[...Array(5)].map((_, i) => (
                                  <div key={i} className="h-1 w-3 bg-current rounded-full ml-0.5"></div>
                                ))}
                              </div>
                            </div>
                          </button>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {stockfishConfig[difficulty].description} (Rating: {stockfishConfig[difficulty].rating})
                        </p>
                      </div>
                    )}

                    <div className="space-y-2">
                      <p className="text-sm font-medium flex items-center gap-2">
                        <Award className="h-4 w-4 text-yellow-500" />
                        Choose Side
                      </p>
                      <div className="grid grid-cols-2 gap-4">
                        <Button
                          variant={playerColor === 'white' ? "default" : "outline"}
                          onClick={() => setPlayerColor('white')}
                          size="sm"
                          className={`w-full relative overflow-hidden ${
                            playerColor === 'white'
                              ? 'bg-gradient-to-br from-slate-50 to-slate-200 text-slate-900 hover:from-slate-100 hover:to-slate-300 border-slate-200'
                              : ''
                          }`}
                        >
                          <div className="flex items-center justify-center gap-2">
                            <div className="bg-white border border-slate-200 rounded-full h-5 w-5"></div>
                            <span>White</span>
                          </div>
                        </Button>
                        <Button
                          variant={playerColor === 'black' ? "default" : "outline"}
                          onClick={() => setPlayerColor('black')}
                          size="sm"
                          className={`w-full relative overflow-hidden ${
                            playerColor === 'black'
                              ? 'bg-gradient-to-br from-slate-800 to-slate-900 text-white hover:from-slate-700 hover:to-slate-800'
                              : ''
                          }`}
                        >
                          <div className="flex items-center justify-center gap-2">
                            <div className="bg-black border border-slate-700 rounded-full h-5 w-5"></div>
                            <span>Black</span>
                          </div>
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <p className="text-sm font-medium flex items-center gap-2">
                        <Clock className="h-4 w-4 text-emerald-500" />
                        Time Control
                      </p>
                      <div className="grid grid-cols-3 gap-2">
                        <Button
                          variant={timeOption === '1min' ? "default" : "outline"}
                          onClick={() => setTimeOption('1min')}
                          size="sm"
                          className={`w-full ${timeOption === '1min' ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : ''}`}
                        >
                          1 min
                        </Button>
                        <Button
                          variant={timeOption === '5min' ? "default" : "outline"}
                          onClick={() => setTimeOption('5min')}
                          size="sm"
                          className={`w-full ${timeOption === '5min' ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : ''}`}
                        >
                          5 min
                        </Button>
                        <Button
                          variant={timeOption === '10min' ? "default" : "outline"}
                          onClick={() => setTimeOption('10min')}
                          size="sm"
                          className={`w-full ${timeOption === '10min' ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : ''}`}
                        >
                          10 min
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <p className="text-sm font-medium flex items-center gap-2">
                        <Eye className="h-4 w-4 text-purple-500" />
                        Show Possible Moves
                      </p>
                      <Switch
                        checked={showPossibleMoves}
                        onCheckedChange={setShowPossibleMoves}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-yellow-500" />
                    Game Status
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="bg-white border border-slate-200 rounded-full h-4 w-4"></div>
                        <span>White</span>
                      </div>
                      <span className="font-mono">{formatTime(timeControl.white)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="bg-black border border-slate-700 rounded-full h-4 w-4"></div>
                        <span>Black</span>
                      </div>
                      <span className="font-mono">{formatTime(timeControl.black)}</span>
                    </div>
                    <div className="pt-2">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium">Captured Pieces</span>
                      </div>
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1 text-lg">
                          {capturedPieces.white.map((piece, index) => (
                            <span key={index}>{piece}</span>
                          ))}
                        </div>
                        <div className="flex items-center gap-1 text-lg">
                          {capturedPieces.black.map((piece, index) => (
                            <span key={index}>{piece}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-blue-500" />
                    Move History
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[200px] overflow-y-auto space-y-1">
                    {gameHistory.map((move, index) => (
                      <div key={index} className="text-sm">
                        {index + 1}. {move}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Center - Chess Board */}<div className="col-span-2">
              <div className="aspect-square max-w-3xl mx-auto relative">
                {thinking && (
                  <div className="absolute inset-0 bg-black/10 backdrop-blur-sm rounded-lg flex items-center justify-center z-10">
                    <div className="flex items-center gap-3 bg-white dark:bg-slate-800 px-4 py-2 rounded-full shadow-lg">
                      <Loader className="h-5 w-5 animate-spin" />
                      <span>Thinking...</span>
                    </div>
                  </div>
                )}
                <Chessboard
                  position={game.fen()}
                  onPieceDrop={onDrop}
                  onSquareClick={onSquareClick}
                  customSquareStyles={{
                    ...(selectedPiece && possibleMoves[selectedPiece]
                      ? Object.fromEntries(
                          possibleMoves[selectedPiece].map(square => [
                            square,
                            {
                              background: 'radial-gradient(circle, rgba(0,0,0,.1) 25%, transparent 25%)',
                              borderRadius: '50%',
                            },
                          ])
                        )
                      : {}),
                  }}
                  boardOrientation={playerColor === 'black' ? 'black' : 'white'}
                />
              </div>
            </div>
          </div>
        </TabsContent>
        <TabsContent value="learn" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Learn Chess</CardTitle>
              <CardDescription>
                Master the game with tutorials and practice scenarios
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="space-y-2">
                  <h3 className="text-lg font-medium">How to PlayChess</h3>
                  <p className="text-muted-foreground">
                    Chess is a board game played between two players. It is played on a square board, made of 64 smaller squares, with eight squares on each side.
                  </p>
                  <Button variant="outline" className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4" />
                    View Full Tutorial
                  </Button>
                </div>

                <div className="space-y-2">
                  <h3 className="text-lg font-medium">Popular Openings</h3>
                  <div className="grid grid-cols-1md:grid-cols-2 gap-4">
                    <Card>
                      <CardHeader className="py-3">
                        <CardTitle className="text-base">Italian Game</CardTitle>
                      </CardHeader>
                      <CardContent className="py-2">
                        <p className="text-sm text-muted-foreground">
                          One of the oldest openings, emphasizing quick development.
                        </p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="py-3">
                        <CardTitle className="text-base">Sicilian Defense</CardTitle>
                      </CardHeader>
                      <CardContent className="py-2">
                        <p className="text-sm text-muted-foreground">
                          The most popular response to e4, aggressive counterplay.
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="puzzles" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Daily Chess Puzzles</CardTitle>
              <CardDescription>
                Train your chess skills with our daily puzzles
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center p-8 space-y-4">
                <Sparkles className="h-12 w-12 mx-auto text-blue-500" />
                <h3 className="text-lg font-medium">Puzzle Mode Coming Soon!</h3>
                <p className="text-muted-foreground">
                  We're working on a wide range of puzzles to help you improve your chess skills.
                  Check back soon!
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="settings" className="space-y-4">Settings</TabsContent>
      </Tabs>

      <Dialog open={openGameEndDialog} onOpenChange={setOpenGameEndDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Game Over</DialogTitle>
            <DialogDescription>{getResultMessage()}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={startNewGame}>Play Again</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default ChessPage;