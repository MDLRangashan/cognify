import React, { useState, useEffect } from 'react';
import './MathQuiz.css';
import PerformanceModal from './PerformanceModal';
import { categorizePerformance, getPerformanceDetails, QuizPerformance } from '../utils/performanceCategorizer';

interface Question {
  id: number;
  question: string;
  correctAnswer: number | string;
  operation: string;
  questionType?: 'multiple_choice' | 'open_ended';
  options?: number[];
}

interface MathQuizProps {
  onComplete?: (performance: QuizPerformance) => void;
}

const MathQuiz: React.FC<MathQuizProps> = ({ onComplete }) => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [typedAnswer, setTypedAnswer] = useState<string>('');
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes in seconds
  const [answers, setAnswers] = useState<{ questionId: number; answer: number | string; isCorrect: boolean }[]>([]);
  const [showPerformanceModal, setShowPerformanceModal] = useState(false);
  const [performance, setPerformance] = useState<QuizPerformance | null>(null);
  const [startTime, setStartTime] = useState<number>(Date.now());

  // Generate quiz questions
  const generateQuestions = (): Question[] => {
    const questions: Question[] = [];
    
    // Addition questions (5)
    for (let i = 0; i < 5; i++) {
      const a = Math.floor(Math.random() * 50) + 1;
      const b = Math.floor(Math.random() * 50) + 1;
      const correctAnswer = a + b;
      const options = generateOptions(correctAnswer);
      
      questions.push({
        id: i + 1,
        question: `${a} + ${b} = ?`,
        options,
        correctAnswer,
        operation: 'addition',
        questionType: 'open_ended'
      });
    }

    // Subtraction questions (5)
    for (let i = 0; i < 5; i++) {
      const a = Math.floor(Math.random() * 50) + 20;
      const b = Math.floor(Math.random() * 20) + 1;
      const correctAnswer = a - b;
      const options = generateOptions(correctAnswer);
      
      questions.push({
        id: i + 6,
        question: `${a} - ${b} = ?`,
        options,
        correctAnswer,
        operation: 'subtraction',
        questionType: 'open_ended'
      });
    }

    // Multiplication questions (5)
    for (let i = 0; i < 5; i++) {
      const a = Math.floor(Math.random() * 12) + 1;
      const b = Math.floor(Math.random() * 12) + 1;
      const correctAnswer = a * b;
      const options = generateOptions(correctAnswer);
      
      questions.push({
        id: i + 11,
        question: `${a} × ${b} = ?`,
        options,
        correctAnswer,
        operation: 'multiplication',
        questionType: 'open_ended'
      });
    }

    // Division questions (5)
    for (let i = 0; i < 5; i++) {
      const b = Math.floor(Math.random() * 10) + 2;
      const correctAnswer = Math.floor(Math.random() * 10) + 1;
      const a = b * correctAnswer;
      const options = generateOptions(correctAnswer);
      
      questions.push({
        id: i + 16,
        question: `${a} ÷ ${b} = ?`,
        options,
        correctAnswer,
        operation: 'division',
        questionType: 'open_ended'
      });
    }

    // Fraction questions (5)
    for (let i = 0; i < 5; i++) {
      const numerator = Math.floor(Math.random() * 8) + 1;
      const denominator = Math.floor(Math.random() * 8) + 2;
      const correctAnswer = Math.round((numerator / denominator) * 100) / 100;
      const options = generateFractionOptions(correctAnswer);
      
      questions.push({
        id: i + 21,
        question: `What is ${numerator}/${denominator} as a decimal?`,
        options,
        correctAnswer,
        operation: 'fraction',
        questionType: 'open_ended'
      });
    }

    return questions.sort(() => Math.random() - 0.5); // Shuffle questions
  };

  const generateOptions = (correctAnswer: number): number[] => {
    const options = [correctAnswer];
    
    while (options.length < 4) {
      const randomAnswer = correctAnswer + Math.floor(Math.random() * 20) - 10;
      if (randomAnswer > 0 && !options.includes(randomAnswer)) {
        options.push(randomAnswer);
      }
    }
    
    return options.sort(() => Math.random() - 0.5);
  };

  const generateFractionOptions = (correctAnswer: number): number[] => {
    const options = [correctAnswer];
    
    while (options.length < 4) {
      const randomAnswer = Math.round((Math.random() * 2) * 100) / 100;
      if (randomAnswer !== correctAnswer && !options.includes(randomAnswer)) {
        options.push(randomAnswer);
      }
    }
    
    return options.sort(() => Math.random() - 0.5);
  };

  useEffect(() => {
    setQuestions(generateQuestions());
    setStartTime(Date.now());
  }, []);

  useEffect(() => {
    if (timeLeft > 0 && !quizCompleted) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && !quizCompleted) {
      finishQuiz();
    }
  }, [timeLeft, quizCompleted]);

  const handleAnswerSelect = (answer: number) => {
    setSelectedAnswer(answer);
  };

  const handleAnswerChange = (answer: string) => {
    setTypedAnswer(answer);
  };

  const handleNext = () => {
    const currentQuestion = questions[currentQuestionIndex];
    let answer: number | string;
    let isCorrect: boolean;

    if (currentQuestion.questionType === 'open_ended') {
      if (!typedAnswer.trim()) {
        alert('Please enter your answer.');
        return;
      }
      answer = typedAnswer.trim();
      // Simple validation - can be enhanced for more complex answers
      isCorrect = answer === currentQuestion.correctAnswer.toString() || 
                  parseFloat(answer) === parseFloat(currentQuestion.correctAnswer.toString());
    } else {
      if (selectedAnswer === null) {
        alert('Please select an answer.');
        return;
      }
      answer = selectedAnswer;
      isCorrect = selectedAnswer === currentQuestion.correctAnswer;
    }
    
    if (isCorrect) {
      setScore(score + 1);
    }
    
    setAnswers([...answers, {
      questionId: currentQuestion.id,
      answer: answer,
      isCorrect
    }]);

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedAnswer(null);
      setTypedAnswer('');
    } else {
      finishQuiz();
    }
  };

  const finishQuiz = () => {
    const endTime = Date.now();
    const timeTaken = Math.floor((endTime - startTime) / 1000);
    
    const performanceData = categorizePerformance(score, questions.length, timeTaken);
    setPerformance(performanceData);
    setShowPerformanceModal(true);
    
    setQuizCompleted(true);
    setShowResult(true);
    
    if (onComplete) {
      onComplete(performanceData);
    }
  };

  const restartQuiz = () => {
    setQuestions(generateQuestions());
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setTypedAnswer('');
    setScore(0);
    setShowResult(false);
    setQuizCompleted(false);
    setTimeLeft(300);
    setAnswers([]);
    setShowPerformanceModal(false);
    setPerformance(null);
    setStartTime(Date.now());
  };

  const handlePerformanceModalClose = () => {
    setShowPerformanceModal(false);
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (questions.length === 0) {
    return (
      <div className="math-quiz">
        <div className="loading">Preparing your quiz...</div>
      </div>
    );
  }

  if (showResult) {
    const percentage = Math.round((score / questions.length) * 100);
    const grade = percentage >= 80 ? 'A' : percentage >= 60 ? 'B' : percentage >= 40 ? 'C' : 'D';
    
    return (
      <div className="math-quiz">
        <div className="quiz-result">
          <h2>🎉 Quiz Completed! 🎉</h2>
          <div className="result-stats">
            <div className="stat-item">
              <h3>Your Score</h3>
              <p className="score">{score}/{questions.length}</p>
            </div>
            <div className="stat-item">
              <h3>Percentage</h3>
              <p className="percentage">{percentage}%</p>
            </div>
            <div className="stat-item">
              <h3>Grade</h3>
              <p className="grade">{grade}</p>
            </div>
          </div>
          
          <div className="result-message">
            {percentage >= 80 ? (
              <p className="excellent">Excellent work! You're a math superstar! 🌟</p>
            ) : percentage >= 60 ? (
              <p className="good">Good job! Keep practicing to improve! 👍</p>
            ) : (
              <p className="encourage">Don't worry! Practice makes perfect! Keep trying! 💪</p>
            )}
          </div>

          <div className="question-review">
            <h3>Question Review</h3>
            {answers.map((answer, index) => (
              <div key={index} className={`review-item ${answer.isCorrect ? 'correct' : 'incorrect'}`}>
                <span>Question {index + 1}: {answer.isCorrect ? '✅' : '❌'}</span>
                <span>Your answer: {answer.answer}</span>
              </div>
            ))}
          </div>

          <button className="restart-btn" onClick={restartQuiz}>
            Take Quiz Again
          </button>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  return (
    <>
      <div className="math-quiz">
        <div className="quiz-header">
          <h2>🧮 Math Quiz</h2>
          <div className="quiz-info">
            <div className="timer">⏰ {formatTime(timeLeft)}</div>
            <div className="progress">
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
              <span>{currentQuestionIndex + 1} / {questions.length}</span>
            </div>
          </div>
        </div>

        <div className="question-container">
          <div className="question">
            <h3>Question {currentQuestionIndex + 1}</h3>
            <p className="question-text">{currentQuestion.question}</p>
          </div>

          {currentQuestion.questionType === 'open_ended' ? (
            <div className="open-ended-answer">
              <input
                type="text"
                value={typedAnswer}
                onChange={(e) => handleAnswerChange(e.target.value)}
                placeholder="Type your answer here..."
                className="answer-input"
                autoFocus
              />
            </div>
          ) : (
            <div className="options">
              {currentQuestion.options?.map((option, index) => (
                <button
                  key={index}
                  className={`option-btn ${selectedAnswer === option ? 'selected' : ''}`}
                  onClick={() => handleAnswerSelect(option)}
                >
                  {option}
                </button>
              ))}
            </div>
          )}

          <div className="quiz-actions">
            <button 
              className="next-btn"
              onClick={handleNext}
              disabled={currentQuestion.questionType === 'open_ended' ? !typedAnswer.trim() : selectedAnswer === null}
            >
              {currentQuestionIndex === questions.length - 1 ? 'Finish Quiz' : 'Next Question'}
            </button>
          </div>
        </div>
      </div>

      {performance && (
        <PerformanceModal
          isOpen={showPerformanceModal}
          onClose={handlePerformanceModalClose}
          performance={performance}
        />
      )}
    </>
  );
};

export default MathQuiz;
