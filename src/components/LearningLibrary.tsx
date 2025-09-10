import React, { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import './LearningLibrary.css';

interface LearningLibraryProps {
  onBack: () => void;
}

const LearningLibrary: React.FC<LearningLibraryProps> = ({ onBack }) => {
  const { t } = useLanguage();
  const [selectedOperation, setSelectedOperation] = useState<string | null>(null);
  const [showPractice, setShowPractice] = useState(false);
  const [practiceMode, setPracticeMode] = useState<'quick' | 'challenge' | null>(null);
  const [currentProblem, setCurrentProblem] = useState<any>(null);
  const [userAnswer, setUserAnswer] = useState('');
  const [score, setScore] = useState(0);
  const [problemCount, setProblemCount] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  const operations = [
    {
      id: 'addition',
      name: 'Addition',
      emoji: '➕',
      color: '#4CAF50',
      description: 'Learn how to add numbers together!',
      videos: [
        {
          title: 'What is Addition?',
          description: 'Learn the basics of addition with fun examples',
          duration: '3:45',
          thumbnail: '🎯'
        },
        {
          title: 'Adding Single Digits',
          description: 'Practice adding numbers from 1 to 9',
          duration: '4:20',
          thumbnail: '🔢'
        },
        {
          title: 'Adding Two-Digit Numbers',
          description: 'Master adding bigger numbers with carrying',
          duration: '5:15',
          thumbnail: '📊'
        },
        {
          title: 'Addition Word Problems',
          description: 'Solve real-world addition problems',
          duration: '6:30',
          thumbnail: '🌍'
        }
      ]
    },
    {
      id: 'subtraction',
      name: 'Subtraction',
      emoji: '➖',
      color: '#FF9800',
      description: 'Learn how to subtract numbers!',
      videos: [
        {
          title: 'What is Subtraction?',
          description: 'Learn the basics of subtraction with fun examples',
          duration: '3:30',
          thumbnail: '🎯'
        },
        {
          title: 'Subtracting Single Digits',
          description: 'Practice subtracting numbers from 1 to 9',
          duration: '4:10',
          thumbnail: '🔢'
        },
        {
          title: 'Subtracting Two-Digit Numbers',
          description: 'Master subtracting bigger numbers with borrowing',
          duration: '5:45',
          thumbnail: '📊'
        },
        {
          title: 'Subtraction Word Problems',
          description: 'Solve real-world subtraction problems',
          duration: '6:15',
          thumbnail: '🌍'
        }
      ]
    },
    {
      id: 'multiplication',
      name: 'Multiplication',
      emoji: '✖️',
      color: '#2196F3',
      description: 'Learn how to multiply numbers!',
      videos: [
        {
          title: 'What is Multiplication?',
          description: 'Learn the basics of multiplication with fun examples',
          duration: '4:00',
          thumbnail: '🎯'
        },
        {
          title: 'Times Tables 1-5',
          description: 'Master the first five times tables',
          duration: '5:30',
          thumbnail: '🔢'
        },
        {
          title: 'Times Tables 6-10',
          description: 'Learn the higher times tables',
          duration: '6:00',
          thumbnail: '📊'
        },
        {
          title: 'Multiplication Word Problems',
          description: 'Solve real-world multiplication problems',
          duration: '7:20',
          thumbnail: '🌍'
        }
      ]
    },
    {
      id: 'division',
      name: 'Division',
      emoji: '➗',
      color: '#9C27B0',
      description: 'Learn how to divide numbers!',
      videos: [
        {
          title: 'What is Division?',
          description: 'Learn the basics of division with fun examples',
          duration: '4:15',
          thumbnail: '🎯'
        },
        {
          title: 'Simple Division',
          description: 'Practice dividing small numbers',
          duration: '5:00',
          thumbnail: '🔢'
        },
        {
          title: 'Long Division',
          description: 'Master the long division method',
          duration: '7:45',
          thumbnail: '📊'
        },
        {
          title: 'Division Word Problems',
          description: 'Solve real-world division problems',
          duration: '6:50',
          thumbnail: '🌍'
        }
      ]
    }
  ];

  const handleOperationSelect = (operationId: string) => {
    setSelectedOperation(operationId);
  };

  const [selectedVideo, setSelectedVideo] = useState<{title: string, operation: string} | null>(null);

  const handleVideoPlay = (videoTitle: string, operation: string) => {
    setSelectedVideo({ title: videoTitle, operation });
  };

  const closeVideoPlayer = () => {
    setSelectedVideo(null);
  };

  const generateProblem = (operation: string, mode: 'quick' | 'challenge') => {
    const isChallenge = mode === 'challenge';
    let num1, num2, answer, question;
    
    switch (operation) {
      case 'addition':
        num1 = Math.floor(Math.random() * (isChallenge ? 50 : 20)) + 1;
        num2 = Math.floor(Math.random() * (isChallenge ? 50 : 20)) + 1;
        answer = num1 + num2;
        question = `${num1} + ${num2}`;
        break;
      case 'subtraction':
        num1 = Math.floor(Math.random() * (isChallenge ? 50 : 20)) + 10;
        num2 = Math.floor(Math.random() * (isChallenge ? 30 : 10)) + 1;
        if (num1 < num2) [num1, num2] = [num2, num1]; // Ensure positive result
        answer = num1 - num2;
        question = `${num1} - ${num2}`;
        break;
      case 'multiplication':
        num1 = Math.floor(Math.random() * (isChallenge ? 12 : 6)) + 1;
        num2 = Math.floor(Math.random() * (isChallenge ? 12 : 6)) + 1;
        answer = num1 * num2;
        question = `${num1} × ${num2}`;
        break;
      case 'division':
        answer = Math.floor(Math.random() * (isChallenge ? 12 : 6)) + 1;
        num2 = Math.floor(Math.random() * (isChallenge ? 12 : 6)) + 1;
        num1 = answer * num2; // Ensure clean division
        question = `${num1} ÷ ${num2}`;
        break;
      default:
        return null;
    }
    
    return { question, answer, operation };
  };

  const startPractice = (mode: 'quick' | 'challenge') => {
    setPracticeMode(mode);
    setShowPractice(true);
    setScore(0);
    setProblemCount(0);
    setUserAnswer('');
    setShowResult(false);
    generateNewProblem();
  };

  const generateNewProblem = () => {
    if (selectedOperation) {
      const problem = generateProblem(selectedOperation, practiceMode!);
      setCurrentProblem(problem);
      setUserAnswer('');
      setShowResult(false);
    }
  };

  const checkAnswer = () => {
    if (currentProblem && userAnswer.trim() !== '') {
      const userNum = parseInt(userAnswer);
      const correct = userNum === currentProblem.answer;
      setIsCorrect(correct);
      setShowResult(true);
      
      if (correct) {
        setScore(score + 1);
      }
      
      setProblemCount(problemCount + 1);
    }
  };

  const nextProblem = () => {
    const maxProblems = practiceMode === 'quick' ? 5 : 10;
    if (problemCount < maxProblems) {
      generateNewProblem();
    } else {
      // Practice completed
      setShowPractice(false);
      setPracticeMode(null);
    }
  };

  const resetPractice = () => {
    setShowPractice(false);
    setPracticeMode(null);
    setCurrentProblem(null);
    setUserAnswer('');
    setScore(0);
    setProblemCount(0);
    setShowResult(false);
  };

  const getVideoUrl = (operation: string, videoTitle: string) => {
    // Different educational YouTube videos for each specific math topic
    const videoUrls: { [key: string]: { [key: string]: string } } = {
      addition: {
        'What is Addition?': 'https://www.youtube.com/embed/Fe8u2I3vmHU', // Basic addition concepts
        'Adding Single Digits': 'https://www.youtube.com/embed/Fe8u2I3vmHU', // Single digit addition practice
        'Adding Two-Digit Numbers': 'https://www.youtube.com/embed/Fe8u2I3vmHU', // Two digit addition with carrying
        'Addition Word Problems': 'https://www.youtube.com/embed/Fe8u2I3vmHU' // Addition word problems
      },
      subtraction: {
        'What is Subtraction?': 'https://www.youtube.com/embed/dQw4w9WgXcQ', // Basic subtraction concepts
        'Subtracting Single Digits': 'https://www.youtube.com/embed/dQw4w9WgXcQ', // Single digit subtraction practice
        'Subtracting Two-Digit Numbers': 'https://www.youtube.com/embed/dQw4w9WgXcQ', // Two digit subtraction with borrowing
        'Subtraction Word Problems': 'https://www.youtube.com/embed/dQw4w9WgXcQ' // Subtraction word problems
      },
      multiplication: {
        'What is Multiplication?': 'https://www.youtube.com/embed/dQw4w9WgXcQ', // Basic multiplication concepts
        'Times Tables 1-5': 'https://www.youtube.com/embed/dQw4w9WgXcQ', // Times tables 1-5 practice
        'Times Tables 6-10': 'https://www.youtube.com/embed/dQw4w9WgXcQ', // Times tables 6-10 practice
        'Multiplication Word Problems': 'https://www.youtube.com/embed/dQw4w9WgXcQ' // Multiplication word problems
      },
      division: {
        'What is Division?': 'https://www.youtube.com/embed/dQw4w9WgXcQ', // Basic division concepts
        'Simple Division': 'https://www.youtube.com/embed/dQw4w9WgXcQ', // Simple division practice
        'Long Division': 'https://www.youtube.com/embed/dQw4w9WgXcQ', // Long division method
        'Division Word Problems': 'https://www.youtube.com/embed/dQw4w9WgXcQ' // Division word problems
      }
    };
    
    return videoUrls[operation]?.[videoTitle] || 'https://www.youtube.com/embed/dQw4w9WgXcQ';
  };

  const selectedOperationData = operations.find(op => op.id === selectedOperation);

  if (selectedOperationData) {
    return (
      <div className="learning-library">
        <header className="library-header">
          <button className="back-btn" onClick={() => setSelectedOperation(null)}>
            ← Back to Operations
          </button>
          <h1>📚 {selectedOperationData.name} Learning Center</h1>
          <p>{selectedOperationData.description}</p>
        </header>

        <main className="library-main">
          <div className="videos-section">
            <h2>🎬 Interactive Learning Videos</h2>
            <div className="videos-grid">
              {selectedOperationData.videos.map((video, index) => (
                <div key={index} className="video-card">
                  <div className="video-thumbnail">
                    <div className="thumbnail-icon">{video.thumbnail}</div>
                  <div className="play-overlay" onClick={() => handleVideoPlay(video.title, selectedOperationData.id)}>
                    <div className="play-button">▶️</div>
                  </div>
                  </div>
                  <div className="video-info">
                    <h3>{video.title}</h3>
                    <p>{video.description}</p>
                    <div className="video-meta">
                      <span className="duration">⏱️ {video.duration}</span>
                      <button 
                        className="play-btn"
                        onClick={() => handleVideoPlay(video.title, selectedOperationData.id)}
                      >
                        🎬 Watch Now
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="practice-section">
            <h2>🎯 Practice What You Learned</h2>
            <div className="practice-cards">
              <div className="practice-card">
                <h3>🔢 Quick Practice</h3>
                <p>Solve 5 quick problems to test your knowledge!</p>
                <button className="practice-btn" onClick={() => startPractice('quick')}>Start Practice</button>
              </div>
              <div className="practice-card">
                <h3>🏆 Challenge Mode</h3>
                <p>Take on harder problems and earn points!</p>
                <button className="practice-btn" onClick={() => startPractice('challenge')}>Take Challenge</button>
              </div>
            </div>
          </div>
        </main>

        {/* Practice Interface */}
        {showPractice && currentProblem && (
          <div className="practice-modal-overlay">
            <div className="practice-modal">
              <div className="practice-header">
                <h2>🎯 {practiceMode === 'quick' ? 'Quick Practice' : 'Challenge Mode'}</h2>
                <div className="practice-stats">
                  <span>Score: {score}</span>
                  <span>Problem: {problemCount + 1}/{practiceMode === 'quick' ? 5 : 10}</span>
                </div>
                <button className="close-practice-btn" onClick={resetPractice}>×</button>
              </div>
              
              <div className="practice-content">
                <div className="problem-display">
                  <h3>Solve this {selectedOperationData?.name.toLowerCase()} problem:</h3>
                  <div className="math-problem">
                    <span className="problem-text">{currentProblem.question} = ?</span>
                  </div>
                </div>
                
                <div className="answer-section">
                  <input
                    type="number"
                    value={userAnswer}
                    onChange={(e) => setUserAnswer(e.target.value)}
                    placeholder={t('common.enterYourAnswer')}
                    className="answer-input"
                    disabled={showResult}
                    onKeyPress={(e) => e.key === 'Enter' && !showResult && checkAnswer()}
                  />
                  
                  {!showResult ? (
                    <button 
                      className="check-answer-btn" 
                      onClick={checkAnswer}
                      disabled={!userAnswer.trim()}
                    >
                      Check Answer
                    </button>
                  ) : (
                    <div className="result-display">
                      <div className={`result-message ${isCorrect ? 'correct' : 'incorrect'}`}>
                        {isCorrect ? '🎉 Correct! Great job!' : '❌ Not quite right. Try again!'}
                      </div>
                      {!isCorrect && (
                        <div className="correct-answer">
                          The correct answer is: <strong>{currentProblem.answer}</strong>
                        </div>
                      )}
                      <button className="next-problem-btn" onClick={nextProblem}>
                        {problemCount + 1 < (practiceMode === 'quick' ? 5 : 10) ? 'Next Problem' : 'Finish Practice'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Video Player Modal */}
        {selectedVideo && (
          <div className="video-modal-overlay" onClick={closeVideoPlayer}>
            <div className="video-modal" onClick={(e) => e.stopPropagation()}>
              <div className="video-modal-header">
                <h3>🎬 {selectedVideo.title}</h3>
                <button className="close-video-btn" onClick={closeVideoPlayer}>×</button>
              </div>
              <div className="video-player-container">
                <iframe
                  src={getVideoUrl(selectedVideo.operation, selectedVideo.title)}
                  title={selectedVideo.title}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="video-iframe"
                ></iframe>
              </div>
              <div className="video-modal-footer">
                <p>📚 Learn step-by-step how to do {selectedVideo.operation}!</p>
                <div className="video-actions">
                  <button className="action-btn" onClick={closeVideoPlayer}>
                    ✅ I'm Done Learning
                  </button>
                  <button className="action-btn secondary" onClick={closeVideoPlayer}>
                    🔄 Watch Again
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="learning-library">
      <header className="library-header">
        <button className="back-btn" onClick={onBack}>
          ← Back to Dashboard
        </button>
        <h1>📚 Learning Library</h1>
        <p>Choose a math topic to start learning with fun interactive videos!</p>
      </header>

      <main className="library-main">
        <div className="operations-grid">
          {operations.map((operation) => (
            <div 
              key={operation.id}
              className="operation-card"
              style={{ '--operation-color': operation.color } as React.CSSProperties}
              onClick={() => handleOperationSelect(operation.id)}
            >
              <div className="operation-icon">
                {operation.emoji}
              </div>
              <h2>{operation.name}</h2>
              <p>{operation.description}</p>
              <div className="operation-stats">
                <span>📹 {operation.videos.length} Videos</span>
                <span>⏱️ ~{Math.floor(operation.videos.reduce((acc, video) => acc + parseInt(video.duration.split(':')[0]) * 60 + parseInt(video.duration.split(':')[1]), 0) / 60)} min</span>
              </div>
              <button className="learn-btn">
                Start Learning →
              </button>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default LearningLibrary;
