import React, { useState, useEffect } from 'react';
import './MiniGames.css';

interface MiniGamesProps {
  onBack: () => void;
}

interface GameScore {
  score: number;
  level: number;
  time: number;
}

interface GameData {
  currentProblem?: any;
  timeLeft?: number;
  lives?: number;
  position?: number;
  obstacles?: any[];
  fallingNumbers?: any[];
  targetAnswer?: number;
  puzzlePieces?: any[];
  completedPieces?: number;
  cards?: any[];
  flippedCards?: number[];
  matchedPairs?: number;
  bubbles?: any[];
  targetNumber?: number;
  caughtCount?: number;
  poppedCount?: number;
  jumping?: boolean;
  problems?: any[];
  answers?: any[];
  selectedProblem?: any;
  selectedAnswer?: any;
}

const MiniGames: React.FC<MiniGamesProps> = ({ onBack }) => {
  const [selectedGame, setSelectedGame] = useState<string | null>(null);
  const [gameScore, setGameScore] = useState<GameScore>({ score: 0, level: 1, time: 0 });
  const [gameActive, setGameActive] = useState(false);
  const [gameData, setGameData] = useState<GameData | null>(null);
  const [gameCompleted, setGameCompleted] = useState(false);
  const [finalScore, setFinalScore] = useState(0);
  const [wrongAnswerMessage, setWrongAnswerMessage] = useState('');

  const games = [
    {
      id: 'addition-race',
      name: 'Addition Race',
      emoji: '🏃‍♂️',
      color: '#4CAF50',
      description: 'Race against time to solve addition problems!',
      difficulty: 'Easy'
    },
    {
      id: 'subtraction-jump',
      name: 'Subtraction Jump',
      emoji: '🦘',
      color: '#FF9800',
      description: 'Jump over obstacles by solving subtraction!',
      difficulty: 'Easy'
    },
    {
      id: 'multiplication-catch',
      name: 'Multiplication Catch',
      emoji: '🎯',
      color: '#2196F3',
      description: 'Catch falling numbers with correct answers!',
      difficulty: 'Medium'
    },
    {
      id: 'division-puzzle',
      name: 'Division Puzzle',
      emoji: '🧩',
      color: '#9C27B0',
      description: 'Solve division puzzles to complete the picture!',
      difficulty: 'Hard'
    },
    {
      id: 'math-memory',
      name: 'Math Memory',
      emoji: '🧠',
      color: '#E91E63',
      description: 'Match math problems with their answers!',
      difficulty: 'Medium'
    },
    {
      id: 'number-bubble',
      name: 'Number Bubble',
      emoji: '🫧',
      color: '#00BCD4',
      description: 'Pop bubbles with the right math answers!',
      difficulty: 'Easy'
    }
  ];

  const startGame = (gameId: string) => {
    setSelectedGame(gameId);
    setGameActive(true);
    setGameScore({ score: 0, level: 1, time: 0 });
    initializeGame(gameId);
  };

  const initializeGame = (gameId: string) => {
    // Initialize game-specific data
    switch (gameId) {
      case 'addition-race':
        setGameData({
          currentProblem: generateAdditionProblem(),
          timeLeft: 30,
          lives: 3
        });
        break;
      case 'subtraction-jump':
        setGameData({
          currentProblem: generateSubtractionProblem(),
          position: 0,
          obstacles: []
        });
        break;
      case 'multiplication-catch':
        const problem = generateMultiplicationProblem();
        console.log('Initializing multiplication catch with problem:', problem);
        setGameData({
          fallingNumbers: [],
          targetAnswer: 0,
          currentProblem: problem,
          caughtCount: 0,
          lives: 3
        });
        break;
      case 'division-puzzle':
        const puzzleData = generateDivisionPuzzle();
        setGameData({
          problems: puzzleData.problems,
          answers: puzzleData.answers,
          selectedProblem: null,
          selectedAnswer: null,
          matchedPairs: 0
        });
        break;
      case 'math-memory':
        setGameData({
          cards: generateMemoryCards(),
          flippedCards: [],
          matchedPairs: 0
        });
        break;
      case 'number-bubble':
        const bubbleProblem = generateRandomProblem();
        setGameData({
          bubbles: generateBubbles(bubbleProblem.answer),
          targetNumber: 0,
          currentProblem: bubbleProblem
        });
        break;
    }
  };

  const generateAdditionProblem = () => {
    const num1 = Math.floor(Math.random() * 20) + 1;
    const num2 = Math.floor(Math.random() * 20) + 1;
    return {
      question: `${num1} + ${num2}`,
      answer: num1 + num2,
      options: [num1 + num2, num1 + num2 + 1, num1 + num2 - 1, num1 + num2 + 2]
    };
  };

  const generateSubtractionProblem = () => {
    const num1 = Math.floor(Math.random() * 30) + 10;
    const num2 = Math.floor(Math.random() * 10) + 1;
    return {
      question: `${num1} - ${num2}`,
      answer: num1 - num2,
      options: [num1 - num2, num1 - num2 + 1, num1 - num2 - 1, num1 - num2 + 2]
    };
  };

  const generateMultiplicationProblem = () => {
    const num1 = Math.floor(Math.random() * 10) + 1;
    const num2 = Math.floor(Math.random() * 10) + 1;
    return {
      question: `${num1} × ${num2}`,
      answer: num1 * num2
    };
  };

  const generateDivisionPuzzle = () => {
    const problems = [];
    const answers = [];
    
    // Generate 6 division problems
    for (let i = 0; i < 6; i++) {
      const answer = Math.floor(Math.random() * 10) + 1;
      const divisor = Math.floor(Math.random() * 5) + 2;
      const dividend = answer * divisor;
      problems.push({
        id: `problem-${i}`,
        type: 'problem',
        content: `${dividend} ÷ ${divisor}`,
        answer: answer,
        matched: false
      });
      answers.push({
        id: `answer-${i}`,
        type: 'answer',
        content: answer.toString(),
        answer: answer,
        matched: false
      });
    }
    
    // Shuffle the answers
    const shuffledAnswers = answers.sort(() => Math.random() - 0.5);
    
    return { problems, answers: shuffledAnswers };
  };

  const generateMemoryCards = () => {
    const problems = [];
    for (let i = 0; i < 8; i++) {
      const num1 = Math.floor(Math.random() * 10) + 1;
      const num2 = Math.floor(Math.random() * 10) + 1;
      problems.push({
        id: i * 2,
        type: 'problem',
        content: `${num1} + ${num2}`,
        answer: num1 + num2
      });
      problems.push({
        id: i * 2 + 1,
        type: 'answer',
        content: (num1 + num2).toString(),
        answer: num1 + num2
      });
    }
    return problems.sort(() => Math.random() - 0.5);
  };

  const generateBubbles = (correctAnswer: number) => {
    const bubbles = [];
    
    // Always include the correct answer
    bubbles.push({
      id: 0,
      number: correctAnswer,
      x: Math.random() * 80 + 10,
      y: Math.random() * 60 + 20,
      size: Math.random() * 20 + 30
    });
    
    // Generate 11 more random bubbles
    for (let i = 1; i < 12; i++) {
      let randomNumber;
      do {
        randomNumber = Math.floor(Math.random() * 50) + 1;
      } while (randomNumber === correctAnswer); // Avoid duplicate correct answers
      
      bubbles.push({
        id: i,
        number: randomNumber,
        x: Math.random() * 80 + 10,
        y: Math.random() * 60 + 20,
        size: Math.random() * 20 + 30
      });
    }
    
    // Shuffle the bubbles so correct answer isn't always first
    const shuffledBubbles = bubbles.sort(() => Math.random() - 0.5);
    console.log('Generated bubbles with correct answer:', correctAnswer, shuffledBubbles);
    return shuffledBubbles;
  };

  const generateRandomProblem = () => {
    const operations = ['+', '-', '×', '÷'];
    const operation = operations[Math.floor(Math.random() * operations.length)];
    let num1: number, num2: number, answer: number;
    
    switch (operation) {
      case '+':
        num1 = Math.floor(Math.random() * 20) + 1;
        num2 = Math.floor(Math.random() * 20) + 1;
        answer = num1 + num2;
        break;
      case '-':
        num1 = Math.floor(Math.random() * 30) + 10;
        num2 = Math.floor(Math.random() * 10) + 1;
        answer = num1 - num2;
        break;
      case '×':
        num1 = Math.floor(Math.random() * 10) + 1;
        num2 = Math.floor(Math.random() * 10) + 1;
        answer = num1 * num2;
        break;
      case '÷':
        answer = Math.floor(Math.random() * 10) + 1;
        num2 = Math.floor(Math.random() * 5) + 2;
        num1 = answer * num2;
        break;
      default:
        num1 = 1;
        num2 = 1;
        answer = 2;
    }
    
    return {
      question: `${num1} ${operation} ${num2}`,
      answer: answer
    };
  };

  const startFallingNumbers = () => {
    const interval = setInterval(() => {
      setGameData((prev: GameData | null) => {
        if (prev && selectedGame === 'multiplication-catch' && prev.currentProblem) {
          const correctAnswer = prev.currentProblem.answer;
          const wrongAnswers = [
            correctAnswer + 1,
            correctAnswer - 1,
            correctAnswer + 2,
            correctAnswer - 2,
            Math.floor(Math.random() * 50) + 1
          ].filter(num => num !== correctAnswer && num > 0);
          
          const newNumber = {
            id: Date.now() + Math.random(),
            value: Math.random() < 0.3 ? correctAnswer : wrongAnswers[Math.floor(Math.random() * wrongAnswers.length)],
            x: Math.random() * 80 + 10, // Random horizontal position
            y: 0,
            isCorrect: false
          };
          
          return {
            ...prev,
            fallingNumbers: [...(prev.fallingNumbers || []), newNumber]
          };
        }
        return prev;
      });
    }, 1500);
    
    // Clean up interval after 30 seconds
    setTimeout(() => clearInterval(interval), 30000);
  };

  const handleGameAction = (action: string, value?: any) => {
    if (!selectedGame || !gameData) return;

    switch (selectedGame) {
      case 'addition-race':
        if (action === 'answer' && value === gameData.currentProblem.answer) {
          setGameScore(prev => ({ ...prev, score: prev.score + 10 }));
          setGameData((prev: GameData | null) => ({
            ...prev,
            currentProblem: generateAdditionProblem(),
            timeLeft: Math.min((prev?.timeLeft || 0) + 5, 30)
          }));
        } else if (action === 'answer') {
          const newLives = (gameData.lives || 0) - 1;
          setGameData((prev: GameData | null) => ({ 
            ...prev, 
            lives: newLives,
            currentProblem: generateAdditionProblem()
          }));
          if (newLives <= 0) {
            setTimeout(() => endGame(), 100);
          }
        }
        break;
      case 'subtraction-jump':
        if (action === 'jump' && value === gameData.currentProblem.answer) {
          setGameScore(prev => ({ ...prev, score: prev.score + 15 }));
          setGameData((prev: GameData | null) => ({
            ...prev,
            currentProblem: generateSubtractionProblem(),
            position: (prev?.position || 0) + 1
          }));
          // End game after 10 correct jumps
          if ((gameData.position || 0) >= 9) {
            endGame();
          }
        } else if (action === 'jump') {
          setGameData((prev: GameData | null) => ({ 
            ...prev, 
            lives: (prev?.lives || 0) - 1,
            currentProblem: generateSubtractionProblem()
          }));
          if ((gameData.lives || 0) <= 1) {
            endGame();
          }
        }
        break;
      case 'multiplication-catch':
        if (action === 'catch') {
          const numberId = value;
          const fallingNumber = gameData.fallingNumbers?.find(n => n.id === numberId);
          
          if (fallingNumber) {
            if (fallingNumber.value === gameData.currentProblem.answer) {
              // Correct catch!
              setGameScore(prev => ({ ...prev, score: prev.score + 20 }));
              setGameData((prev: GameData | null) => ({
                ...prev,
                caughtCount: (prev?.caughtCount || 0) + 1,
                fallingNumbers: prev?.fallingNumbers?.filter(n => n.id !== numberId) || []
              }));
              
              // Generate new problem after catching correct answer
              if ((gameData.caughtCount || 0) >= 4) {
                setGameData((prev: GameData | null) => ({
                  ...prev,
                  currentProblem: generateMultiplicationProblem()
                }));
              }
              
              // End game after catching 10 correct numbers
              if ((gameData.caughtCount || 0) >= 9) {
                setTimeout(() => endGame(), 500);
              }
            } else {
              // Wrong catch - lose a life
              const newLives = (gameData.lives || 0) - 1;
              setGameData((prev: GameData | null) => ({
                ...prev,
                lives: newLives,
                fallingNumbers: prev?.fallingNumbers?.filter(n => n.id !== numberId) || []
              }));
              
              if (newLives <= 0) {
                setTimeout(() => endGame(), 500);
              }
            }
          }
        }
        break;
      case 'division-puzzle':
        if (action === 'select-problem') {
          setGameData((prev: GameData | null) => ({
            ...prev,
            selectedProblem: value,
            selectedAnswer: null
          }));
        } else if (action === 'select-answer') {
          const selectedProblem = gameData.selectedProblem;
          if (selectedProblem && selectedProblem.answer === value.answer) {
            // Match found!
            setGameScore(prev => ({ ...prev, score: prev.score + 25 }));
            setGameData((prev: GameData | null) => ({
              ...prev,
              problems: prev?.problems?.map(p => 
                p.id === selectedProblem.id ? { ...p, matched: true } : p
              ),
              answers: prev?.answers?.map(a => 
                a.id === value.id ? { ...a, matched: true } : a
              ),
              selectedProblem: null,
              selectedAnswer: null,
              matchedPairs: (prev?.matchedPairs || 0) + 1
            }));
            // End game when all pairs are matched
            if ((gameData.matchedPairs || 0) >= 5) {
              setTimeout(() => endGame(), 500);
            }
          } else {
            // No match, reset selection
            setGameData((prev: GameData | null) => ({
              ...prev,
              selectedProblem: null,
              selectedAnswer: null
            }));
          }
        }
        break;
      case 'math-memory':
        if (action === 'flip') {
          const newFlippedCards = [...(gameData.flippedCards || []), value];
          setGameData((prev: GameData | null) => ({
            ...prev,
            flippedCards: newFlippedCards
          }));
          
          // Check for matches when 2 cards are flipped
          if (newFlippedCards.length === 2) {
            const [card1Id, card2Id] = newFlippedCards;
            const card1 = gameData.cards?.find(c => c.id === card1Id);
            const card2 = gameData.cards?.find(c => c.id === card2Id);
            
            if (card1 && card2 && card1.answer === card2.answer) {
              setGameScore(prev => ({ ...prev, score: prev.score + 50 }));
              setGameData((prev: GameData | null) => ({
                ...prev,
                matchedPairs: (prev?.matchedPairs || 0) + 1,
                flippedCards: []
              }));
              // End game when all pairs are matched
              if ((gameData.matchedPairs || 0) >= 7) {
                endGame();
              }
            } else {
              // Reset flipped cards after a delay
              setTimeout(() => {
                setGameData((prev: GameData | null) => ({
                  ...prev,
                  flippedCards: []
                }));
              }, 1000);
            }
          }
        }
        break;
      case 'number-bubble':
        console.log('Bubble clicked! Action:', action, 'Value:', value, 'Target answer:', gameData.currentProblem.answer);
        if (action === 'pop' && value === gameData.currentProblem.answer) {
          console.log('Correct bubble popped!');
          setGameScore(prev => ({ ...prev, score: prev.score + 30 }));
          const newProblem = generateRandomProblem();
          setGameData((prev: GameData | null) => ({
            ...prev,
            currentProblem: newProblem,
            bubbles: generateBubbles(newProblem.answer),
            poppedCount: (prev?.poppedCount || 0) + 1
          }));
          // End game after popping 15 correct bubbles
          if ((gameData.poppedCount || 0) >= 14) {
            endGame();
          }
        } else if (action === 'pop') {
          console.log('Wrong bubble clicked. Expected:', gameData.currentProblem.answer, 'Got:', value);
          // Show visual feedback for wrong answer
          setWrongAnswerMessage(`❌ Wrong! Try solving ${gameData.currentProblem.question} again`);
          setTimeout(() => setWrongAnswerMessage(''), 2000); // Clear message after 2 seconds
        }
        break;
    }
  };

  const endGame = () => {
    setFinalScore(gameScore.score);
    setGameCompleted(true);
  };

  const resetGame = () => {
    setGameActive(false);
    setSelectedGame(null);
    setGameData(null);
    setGameCompleted(false);
    setGameScore({ score: 0, level: 1, time: 0 });
    setFinalScore(0);
  };

  // Timer for addition race game
  useEffect(() => {
    if (selectedGame === 'addition-race' && gameData?.timeLeft !== undefined && gameActive) {
      const timer = setInterval(() => {
        setGameData((prev: GameData | null) => {
          if (prev && prev.timeLeft !== undefined) {
            if (prev.timeLeft <= 1) {
              setTimeout(() => endGame(), 100);
              return prev;
            }
            return { ...prev, timeLeft: prev.timeLeft - 1 };
          }
          return prev;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [selectedGame, gameData?.timeLeft, gameActive]);

  // Start falling numbers for multiplication catch
  useEffect(() => {
    if (selectedGame === 'multiplication-catch' && gameActive) {
      console.log('Starting multiplication catch game, gameData:', gameData);
      
      const interval = setInterval(() => {
        setGameData((prev: GameData | null) => {
          if (prev && prev.currentProblem) {
            const correctAnswer = prev.currentProblem.answer;
            const wrongAnswers = [
              correctAnswer + 1,
              correctAnswer - 1,
              correctAnswer + 2,
              correctAnswer - 2,
              Math.floor(Math.random() * 50) + 1
            ].filter(num => num !== correctAnswer && num > 0);
            
            const newNumber = {
              id: Date.now() + Math.random(),
              value: Math.random() < 0.3 ? correctAnswer : wrongAnswers[Math.floor(Math.random() * wrongAnswers.length)],
              x: Math.random() * 80 + 10,
              y: 0,
              isCorrect: false
            };
            
            console.log('Generating falling number:', newNumber);
            
            return {
              ...prev,
              fallingNumbers: [...(prev.fallingNumbers || []), newNumber]
            };
          } else {
            console.log('No current problem or prev is null');
          }
          return prev;
        });
      }, 1500);
      
      return () => clearInterval(interval);
    }
  }, [selectedGame, gameActive]);

  // Animation for falling numbers in multiplication catch
  useEffect(() => {
    if (selectedGame === 'multiplication-catch' && gameActive) {
      console.log('Animation useEffect triggered, gameData:', gameData);
      const animationInterval = setInterval(() => {
        setGameData((prev: GameData | null) => {
          if (prev && prev.fallingNumbers) {
            const updatedNumbers = prev.fallingNumbers
              .map(num => ({ ...num, y: num.y + 2 }))
              .filter(num => num.y < 100); // Remove numbers that fall off screen
            
            console.log('Animating falling numbers:', updatedNumbers.length, 'numbers');
            
            return { ...prev, fallingNumbers: updatedNumbers };
          }
          return prev;
        });
      }, 50);
      return () => clearInterval(animationInterval);
    }
  }, [selectedGame, gameActive, gameData]);

  if (gameCompleted) {
    return (
      <div className="mini-games">
        <div className="game-completion">
          <div className="completion-content">
            <h1>🎉 Game Completed! 🎉</h1>
            <div className="final-score">
              <h2>Final Score: {finalScore}</h2>
              <div className="score-message">
                {finalScore >= 100 ? "🌟 Amazing! You're a math superstar!" :
                 finalScore >= 50 ? "🎯 Great job! Keep practicing!" :
                 "👍 Good try! Practice makes perfect!"}
              </div>
            </div>
            <div className="completion-actions">
              <button className="play-again-btn" onClick={() => startGame(selectedGame!)}>
                🎮 Play Again
              </button>
              <button className="back-to-games-btn" onClick={resetGame}>
                ← Back to Games
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (selectedGame && gameActive) {
    return (
      <div className="mini-games">
        <div className="game-header">
          <button className="back-btn" onClick={resetGame}>
            ← Back to Games
          </button>
          <h1>🎮 {games.find(g => g.id === selectedGame)?.name}</h1>
          <div className="game-stats">
            <span>Score: {gameScore.score}</span>
            <span>Level: {gameScore.level}</span>
          </div>
        </div>

        <div className="game-content">
          {selectedGame === 'addition-race' && (
            <div className="addition-race-game">
              <div className="game-problem">
                <h2>{gameData?.currentProblem.question} = ?</h2>
                <div className="answer-options">
                  {gameData?.currentProblem.options.map((option: number, index: number) => (
                    <button
                      key={index}
                      className="option-btn"
                      onClick={() => handleGameAction('answer', option)}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>
              <div className="game-info">
                <div className={`lives ${(gameData?.lives || 0) <= 1 ? 'low-lives' : ''}`}>
                  ❤️ Lives: {gameData?.lives}
                </div>
                <div className={`timer ${(gameData?.timeLeft || 0) <= 5 ? 'low-time' : ''}`}>
                  ⏰ Time: {gameData?.timeLeft}s
                </div>
              </div>
              {(gameData?.lives || 0) <= 1 && (
                <div className="warning-message">⚠️ Last life! Be careful!</div>
              )}
              {(gameData?.timeLeft || 0) <= 5 && (
                <div className="warning-message">⏰ Time running out!</div>
              )}
            </div>
          )}

          {selectedGame === 'subtraction-jump' && (
            <div className="subtraction-jump-game">
              <div className="jump-area">
                <div className={`character ${gameData?.jumping ? 'jumping' : ''}`}>🦘</div>
                <div className="obstacle">🚧</div>
                <div className="ground"></div>
              </div>
              <div className="game-problem">
                <h2>Jump over: {gameData?.currentProblem.question} = ?</h2>
                <div className="answer-options">
                  {gameData?.currentProblem.options.map((option: number, index: number) => (
                    <button
                      key={index}
                      className="option-btn"
                      onClick={() => {
                        setGameData((prev: GameData | null) => ({ ...prev, jumping: true }));
                        setTimeout(() => {
                          setGameData((prev: GameData | null) => ({ ...prev, jumping: false }));
                        }, 1000);
                        handleGameAction('jump', option);
                      }}
                    >
                      {option}
                    </button>
                  ))}
                </div>
                <div className="jump-progress">
                  <div className="progress-bar">
                    <div 
                      className="progress-fill" 
                      style={{ width: `${((gameData?.position || 0) / 10) * 100}%` }}
                    ></div>
                  </div>
                  <span>Progress: {gameData?.position || 0}/10</span>
                </div>
              </div>
            </div>
          )}

          {selectedGame === 'multiplication-catch' && (
            <div className="multiplication-catch-game">
              <div className="catch-instructions">
                <h2>🎯 Multiplication Catch Game</h2>
                <p>Catch the correct answer numbers as they fall from the sky!</p>
                <div className="game-stats">
                  <div className="lives">❤️ Lives: {gameData?.lives}</div>
                  <div className="caught">🎯 Caught: {gameData?.caughtCount || 0}/10</div>
                </div>
              </div>
              
              <div className="catch-area">
                <div className="falling-numbers">
                  {gameData?.fallingNumbers?.map((num: any) => (
                    <div
                      key={num.id}
                      className={`falling-number ${num.value === gameData?.currentProblem.answer ? 'correct' : 'wrong'}`}
                      style={{
                        left: `${num.x}%`,
                        top: `${num.y}%`,
                        position: 'absolute'
                      }}
                      onClick={() => handleGameAction('catch', num.id)}
                    >
                      {num.value}
                    </div>
                  ))}
                </div>
                <div className="catcher">🎯</div>
              </div>
              
              <div className="game-problem">
                <h2>Catch: {gameData?.currentProblem.question} = ?</h2>
                <div className="target-answer">Target: {gameData?.currentProblem.answer}</div>
                <div className="game-hint">
                  <p>💡 Click on the falling numbers to catch them! Only catch the correct answer!</p>
                </div>
              </div>
            </div>
          )}

          {selectedGame === 'division-puzzle' && (
            <div className="division-puzzle-game">
              <div className="puzzle-instructions">
                <h2>🧩 Division Puzzle Game</h2>
                <p>Match each division problem with its correct answer!</p>
                <div className="progress">Matches: {gameData?.matchedPairs || 0}/6</div>
              </div>
              
              <div className="puzzle-container">
                <div className="problems-section">
                  <h3>Division Problems</h3>
                  <div className="problems-grid">
                    {gameData?.problems?.map((problem: any) => (
                      <div
                        key={problem.id}
                        className={`problem-card ${problem.matched ? 'matched' : ''} ${
                          gameData.selectedProblem?.id === problem.id ? 'selected' : ''
                        }`}
                        onClick={() => !problem.matched && handleGameAction('select-problem', problem)}
                      >
                        {problem.content}
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="answers-section">
                  <h3>Answers</h3>
                  <div className="answers-grid">
                    {gameData?.answers?.map((answer: any) => (
                      <div
                        key={answer.id}
                        className={`answer-card ${answer.matched ? 'matched' : ''} ${
                          gameData.selectedAnswer?.id === answer.id ? 'selected' : ''
                        }`}
                        onClick={() => !answer.matched && handleGameAction('select-answer', answer)}
                      >
                        {answer.content}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="game-hint">
                <p>💡 Click a problem first, then click its matching answer!</p>
              </div>
            </div>
          )}

          {selectedGame === 'math-memory' && (
            <div className="math-memory-game">
              <div className="memory-grid">
                {gameData?.cards?.map((card: any, index: number) => (
                  <div
                    key={card.id}
                    className={`memory-card ${gameData.flippedCards?.includes(card.id) ? 'flipped' : ''}`}
                    onClick={() => handleGameAction('flip', card.id)}
                  >
                    {gameData.flippedCards?.includes(card.id) ? card.content : '?'}
                  </div>
                ))}
              </div>
              <div className="game-problem">
                <h2>Match problems with answers!</h2>
                <div className="progress">Matches: {gameData?.matchedPairs}/8</div>
              </div>
            </div>
          )}

          {selectedGame === 'number-bubble' && (
            <div className="number-bubble-game">
              <div className="bubble-area">
                {gameData?.bubbles?.map((bubble: any, index: number) => (
                  <div
                    key={bubble.id}
                    className="bubble"
                    style={{
                      left: `${bubble.x}%`,
                      top: `${bubble.y}%`,
                      width: `${bubble.size}px`,
                      height: `${bubble.size}px`
                    }}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      console.log('Bubble clicked directly!', bubble);
                      handleGameAction('pop', bubble.number);
                    }}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      console.log('Bubble mouse down!', bubble);
                    }}
                  >
                    {bubble.number}
                  </div>
                ))}
              </div>
              <div className="game-problem">
                <h2>Pop bubbles with: {gameData?.currentProblem.question} = ?</h2>
                <div className="problem-hint">Solve the problem and find the answer in the bubbles!</div>
                {wrongAnswerMessage && (
                  <div className="wrong-answer-message">{wrongAnswerMessage}</div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="mini-games">
      <header className="games-header">
        <button className="back-btn" onClick={onBack}>
          ← Back to Dashboard
        </button>
        <h1>🎮 Mini Games 🎯</h1>
        <p>Choose a fun game to play and learn math at the same time!</p>
      </header>

      <main className="games-main">
        <div className="games-grid">
          {games.map((game) => (
            <div
              key={game.id}
              className="game-card"
              style={{ '--game-color': game.color } as React.CSSProperties}
              onClick={() => startGame(game.id)}
            >
              <div className="game-icon">
                {game.emoji}
              </div>
              <h2>{game.name}</h2>
              <p>{game.description}</p>
              <div className="game-difficulty">
                <span className={`difficulty-badge ${game.difficulty.toLowerCase()}`}>
                  {game.difficulty}
                </span>
              </div>
              <button className="play-btn">
                Play Now →
              </button>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default MiniGames;
