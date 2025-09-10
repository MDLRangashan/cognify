import React, { useState, useEffect, useRef } from 'react';
import './MathQuiz.css';
import PerformanceModal from './PerformanceModal';
import { categorizePerformance, QuizPerformance } from '../utils/performanceCategorizer';
import { getPerformanceCategory, PerformanceCategory } from '../utils/performanceBasedLevels';
import { fetchInitialAssessmentQuiz, AdminQuiz } from '../utils/quizFetcher';

interface Question {
  id: number;
  question: string;
  correctAnswer: number | string;
  operation: string;
  difficulty: string;
  questionType?: 'multiple_choice' | 'open_ended';
  options?: number[];
}

interface InitialAssessmentQuizProps {
  onComplete: (performance: QuizPerformance, category: PerformanceCategory) => void;
}

const InitialAssessmentQuiz: React.FC<InitialAssessmentQuizProps> = ({ onComplete }) => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [typedAnswer, setTypedAnswer] = useState<string>('');
  const [score, setScore] = useState(0);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes
  const [answers, setAnswers] = useState<{ 
    questionId: number; 
    answer: number | string; 
    isCorrect: boolean; 
    operation: string;
    difficulty: string;
    timeTaken: number;
    questionText: string;
    correctAnswer: number | string;
  }[]>([]);
  const [questionStartTime, setQuestionStartTime] = useState<number>(Date.now());
  const [showPerformanceModal, setShowPerformanceModal] = useState(false);
  const [performance, setPerformance] = useState<QuizPerformance | null>(null);
  const [performanceCategory, setPerformanceCategory] = useState<PerformanceCategory | null>(null);
  const [startTime, setStartTime] = useState<number>(Date.now());
  const [adminQuiz, setAdminQuiz] = useState<AdminQuiz | null>(null);
  const hasSubmittedRef = useRef<boolean>(false);

  // Generate initial assessment questions (mix of all difficulty levels)
  const generateAssessmentQuestions = (): Question[] => {
    const questions: Question[] = [];
    
    // Easy questions (5)
    for (let i = 0; i < 5; i++) {
      const a = Math.floor(Math.random() * 20) + 1;
      const b = Math.floor(Math.random() * 20) + 1;
      const correctAnswer = a + b;
      const options = generateOptions(correctAnswer, 'easy');
      
      questions.push({
        id: i + 1,
        question: `${a} + ${b} = ?`,
        options,
        correctAnswer,
        operation: 'addition',
        difficulty: 'easy',
        questionType: 'open_ended'
      });
    }

    // Medium questions (5)
    for (let i = 0; i < 5; i++) {
      const a = Math.floor(Math.random() * 12) + 1;
      const b = Math.floor(Math.random() * 12) + 1;
      const correctAnswer = a * b;
      const options = generateOptions(correctAnswer, 'medium');
      
      questions.push({
        id: i + 11,
        question: `${a} × ${b} = ?`,
        options,
        correctAnswer,
        operation: 'multiplication',
        difficulty: 'medium',
        questionType: 'open_ended'
      });
    }

    // Hard questions (5)
    for (let i = 0; i < 5; i++) {
      const b = Math.floor(Math.random() * 10) + 2;
      const correctAnswer = Math.floor(Math.random() * 10) + 1;
      const a = b * correctAnswer;
      const options = generateOptions(correctAnswer, 'hard');
      
      questions.push({
        id: i + 16,
        question: `${a} ÷ ${b} = ?`,
        options,
        correctAnswer,
        operation: 'division',
        difficulty: 'hard',
        questionType: 'open_ended'
      });
    }

    return questions.sort(() => Math.random() - 0.5);
  };

  const generateOptions = (correctAnswer: number, difficulty: string): number[] => {
    const options = [correctAnswer];
    let range = 10;
    
    if (difficulty === 'medium') range = 20;
    if (difficulty === 'hard') range = 30;
    
    while (options.length < 4) {
      const randomAnswer = correctAnswer + Math.floor(Math.random() * range * 2) - range;
      if (randomAnswer > 0 && !options.includes(randomAnswer)) {
        options.push(randomAnswer);
      }
    }
    
    return options.sort(() => Math.random() - 0.5);
  };

  useEffect(() => {
    const loadQuiz = async () => {
      try {
        const quiz = await fetchInitialAssessmentQuiz();
        if (quiz) {
          setAdminQuiz(quiz);
          // Convert admin quiz questions to the format expected by the component
          const convertedQuestions: Question[] = quiz.questions.map((q, index) => {
            console.log(`Converting question ${index + 1}:`, {
              question: q.question,
              options: q.options,
              correctAnswer: q.correctAnswer,
              correctAnswerType: typeof q.correctAnswer,
              operation: q.operation,
              difficulty: q.difficulty
            });
            
            // Check if correctAnswer is an index (1-4) instead of actual value
            if (typeof q.correctAnswer === 'number' && q.correctAnswer >= 1 && q.correctAnswer <= 4 && q.options && q.options.length >= 4) {
              const actualCorrectAnswer = q.options[q.correctAnswer - 1];
              console.log(`⚠️  FIXING: correctAnswer is index ${q.correctAnswer}, should be value ${actualCorrectAnswer}`);
              console.log(`Options: [${q.options.join(', ')}]`);
              console.log(`Index ${q.correctAnswer} = Value ${actualCorrectAnswer}`);
              
              // Fix the correctAnswer to be the actual value
              q.correctAnswer = actualCorrectAnswer;
              console.log(`✅ Fixed: correctAnswer is now ${q.correctAnswer}`);
            }
            
            const convertedQuestion: Question = {
              id: index + 1,
              question: q.question,
              options: q.options?.map(opt => Number(opt)) || [], // Ensure all options are numbers
              correctAnswer: Number(q.correctAnswer), // This is now the actual value, not an index
              operation: q.operation,
              difficulty: q.difficulty,
              questionType: 'open_ended' // Force all initial assessment questions to be open-ended
            };
            
            console.log(`Converted question ${index + 1}:`, {
              original: {
                question: q.question,
                correctAnswer: q.correctAnswer,
                correctAnswerType: typeof q.correctAnswer,
                options: q.options
              },
              converted: {
                question: convertedQuestion.question,
                correctAnswer: convertedQuestion.correctAnswer,
                correctAnswerType: typeof convertedQuestion.correctAnswer,
                questionType: convertedQuestion.questionType
              }
            });
            
            return convertedQuestion;
          });
          setQuestions(convertedQuestions);
          setTimeLeft(quiz.timeLimit * 60); // Convert minutes to seconds
        } else {
          // Fallback to auto-generated questions if no admin quiz found
          console.warn('No admin-created initial assessment quiz found, using auto-generated questions');
          setQuestions(generateAssessmentQuestions());
        }
        setStartTime(Date.now());
      } catch (error) {
        console.error('Error loading initial assessment quiz:', error);
        // Fallback to auto-generated questions
        setQuestions(generateAssessmentQuestions());
        setStartTime(Date.now());
      }
    };
    
    loadQuiz();
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
    const questionEndTime = Date.now();
    const timeTakenForQuestion = Math.floor((questionEndTime - questionStartTime) / 1000);

    if (currentQuestion.questionType === 'open_ended') {
      if (!typedAnswer.trim()) {
        alert('Please enter your answer.');
        return;
      }
      answer = typedAnswer.trim();
      // Enhanced validation for open-ended answers
      const userAnswer = parseFloat(answer);
      const correctAnswer = parseFloat(currentQuestion.correctAnswer.toString());
      
      // Check for exact match or numeric equivalence
      isCorrect = answer === currentQuestion.correctAnswer.toString() || 
                  (!isNaN(userAnswer) && !isNaN(correctAnswer) && userAnswer === correctAnswer);
      
      console.log('Open-ended answer validation:', {
        userAnswer: answer,
        userAnswerNumeric: userAnswer,
        correctAnswer: currentQuestion.correctAnswer,
        correctAnswerNumeric: correctAnswer,
        isCorrect,
        questionType: currentQuestion.questionType
      });
    } else {
      if (selectedAnswer === null) {
        alert('Please select an answer.');
        return;
      }
      answer = selectedAnswer;
      isCorrect = selectedAnswer === currentQuestion.correctAnswer;
      
      console.log('Multiple choice answer validation:', {
        selectedAnswer,
        correctAnswer: currentQuestion.correctAnswer,
        isCorrect,
        questionType: currentQuestion.questionType
      });
    }
    
    console.log(`Answer validation for question ${currentQuestionIndex + 1}:`, {
      question: currentQuestion.question,
      answer,
      correctAnswer: currentQuestion.correctAnswer,
      answerType: typeof answer,
      correctAnswerType: typeof currentQuestion.correctAnswer,
      isCorrect,
      questionType: currentQuestion.questionType
    });
    
    if (isCorrect) {
      const newScore = score + 1;
      setScore(newScore);
      console.log('Answer is correct! Score updated from', score, 'to', newScore);
    } else {
      console.log('Answer is incorrect! Score remains:', score);
    }
    
    const newAnswer = {
      questionId: currentQuestion.id,
      answer: answer,
      isCorrect,
      operation: currentQuestion.operation,
      difficulty: currentQuestion.difficulty,
      timeTaken: timeTakenForQuestion,
      questionText: currentQuestion.question,
      correctAnswer: currentQuestion.correctAnswer
    };
    
    const updatedAnswers = [...answers, newAnswer];
    setAnswers(updatedAnswers);

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedAnswer(null);
      setTypedAnswer('');
      setQuestionStartTime(Date.now());
    } else {
      // Pass the updated answers directly to finishQuiz to avoid state timing issues
      finishQuiz(updatedAnswers);
    }
  };

  const finishQuiz = (finalAnswers = answers) => {
    const endTime = Date.now();
    const timeTaken = Math.floor((endTime - startTime) / 1000);
    
    // Calculate actual score from answers array to avoid state timing issues
    const actualScore = finalAnswers.filter(a => a.isCorrect).length;
    
    console.log('Quiz completed! Final scoring:', {
      scoreState: score,
      actualScore: actualScore,
      totalQuestions: questions.length,
      timeTaken,
      answers: finalAnswers.map(a => ({
        questionId: a.questionId,
        questionText: a.questionText,
        selectedAnswer: a.answer,
        correctAnswer: a.correctAnswer,
        isCorrect: a.isCorrect
      }))
    });
    
    const performanceData = categorizePerformance(actualScore, questions.length, timeTaken);
    const category = getPerformanceCategory({
      score: actualScore,
      accuracy: performanceData.accuracy,
      timeTaken,
      totalQuestions: questions.length
    });
    
    console.log('Performance data:', performanceData);
    console.log('Performance category:', category);
    
    // Construct full performance payload (with detailed answers) immediately
    const performanceWithDetails = {
      ...performanceData,
      detailedAnswers: finalAnswers,
      levelId: 0,
      levelName: 'Initial Assessment',
      levelDifficulty: 'Mixed'
    } as any;

    setPerformance(performanceData);
    setPerformanceCategory(category);
    setShowPerformanceModal(true);
    
    setQuizCompleted(true);

    // Immediately submit so data is persisted even if the modal isn't interacted with
    if (!hasSubmittedRef.current && category) {
      hasSubmittedRef.current = true;
      try {
        onComplete(performanceWithDetails, category);
      } catch (e) {
        console.error('Error submitting initial assessment completion:', e);
        hasSubmittedRef.current = false;
      }
    }
  };

  const handlePerformanceModalClose = () => {
    setShowPerformanceModal(false);
    if (performance && performanceCategory && !hasSubmittedRef.current) {
      console.log('Initial Assessment - Detailed answers being passed (modal close fallback):', answers);
      const performanceWithDetails = {
        ...performance,
        detailedAnswers: answers,
        levelId: 0,
        levelName: 'Initial Assessment',
        levelDifficulty: 'Mixed'
      } as any;
      hasSubmittedRef.current = true;
      onComplete(performanceWithDetails, performanceCategory);
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (questions.length === 0) {
    return (
      <div className="math-quiz">
        <div className="loading-container">
          <div className="loading-spinner">
            <div className="spinner"></div>
            <p>Preparing your assessment...</p>
          </div>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  return (
    <>
      <div className="math-quiz">
        <div className="quiz-header" style={{ background: 'linear-gradient(135deg, #667eea, #764ba2)' }}>
          <div className="quiz-header-content">
            <div className="quiz-level-info">
              <h2>🎯 Initial Assessment 🎯</h2>
              <div className="level-difficulty-badge">
                Let's see how you do!
              </div>
            </div>
          </div>
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
              {currentQuestionIndex === questions.length - 1 ? 'Finish Assessment' : 'Next Question'}
            </button>
          </div>
        </div>
      </div>

      {performance && performanceCategory && (
        <PerformanceModal
          isOpen={showPerformanceModal}
          onClose={handlePerformanceModalClose}
          performance={{
            ...performance,
            category: performanceCategory.name as 'High Performer' | 'Middle Performer' | 'Slow Performer',
            message: `Based on your performance, you are a ${performanceCategory.name}! ${performanceCategory.description}`,
            emoji: performanceCategory.emoji,
            color: performanceCategory.color
          }}
        />
      )}
    </>
  );
};

export default InitialAssessmentQuiz;
