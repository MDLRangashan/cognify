import React, { useState, useEffect } from 'react';
import './MathQuiz.css';
import PerformanceModal from './PerformanceModal';
import { categorizePerformance, QuizPerformance } from '../utils/performanceCategorizer';
import { QuizLevel } from '../utils/performanceBasedLevels';
import { fetchQuizByLevel, fetchAllQuizzesByLevel, AdminQuiz } from '../utils/quizFetcher';

interface Question {
  id: number;
  question: string;
  correctAnswer: number | string;
  operation: string;
  difficulty: string;
  timeLimit?: number;
  questionType?: 'multiple_choice' | 'open_ended';
  options?: number[];
}

interface LeveledMathQuizProps {
  level: QuizLevel;
  onComplete: (performance: QuizPerformance) => void;
  onBack: () => void;
}

const LeveledMathQuiz: React.FC<LeveledMathQuizProps> = ({ level, onComplete, onBack }) => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [typedAnswer, setTypedAnswer] = useState<string>('');
  const [score, setScore] = useState(0);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(level.questions.timeLimit);
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
  const [startTime, setStartTime] = useState<number>(Date.now());
  const [adminQuiz, setAdminQuiz] = useState<AdminQuiz | null>(null);

  // Generate quiz questions based on level
  const generateQuestions = (): Question[] => {
    const questions: Question[] = [];
    const questionCount = level.questions.count;
    const operations = level.questions.operations;
    
    for (let i = 0; i < questionCount; i++) {
      const operation = operations[Math.floor(Math.random() * operations.length)];
      let question: Question;
      
      switch (operation) {
        case 'addition':
        case 'addition_basic':
          question = generateAdditionQuestion(i + 1, level.difficulty);
          break;
        case 'subtraction':
        case 'subtraction_basic':
          question = generateSubtractionQuestion(i + 1, level.difficulty);
          break;
        case 'multiplication':
        case 'multiplication_basic':
          question = generateMultiplicationQuestion(i + 1, level.difficulty);
          break;
        case 'division':
        case 'division_basic':
          question = generateDivisionQuestion(i + 1, level.difficulty);
          break;
        case 'fraction':
        case 'fraction_basic':
          question = generateFractionQuestion(i + 1, level.difficulty);
          break;
        case 'decimal':
          question = generateDecimalQuestion(i + 1, level.difficulty);
          break;
        case 'word_problems':
        case 'multi_step':
          question = generateWordProblem(i + 1, level.difficulty);
          break;
        case 'counting':
          question = generateCountingQuestion(i + 1, level.difficulty);
          break;
        case 'number_recognition':
          question = generateNumberRecognitionQuestion(i + 1, level.difficulty);
          break;
        case 'percentage':
          question = generatePercentageQuestion(i + 1, level.difficulty);
          break;
        case 'all':
        case 'advanced':
        case 'challenge':
          question = generateAdvancedQuestion(i + 1, level.difficulty);
          break;
        default:
          question = generateAdditionQuestion(i + 1, level.difficulty);
      }
      
      questions.push(question);
    }
    
    return questions.sort(() => Math.random() - 0.5);
  };

  const generateAdditionQuestion = (id: number, difficulty: string): Question => {
    let maxNum = 50;
    if (difficulty === 'Medium') maxNum = 100;
    if (difficulty === 'Hard') maxNum = 200;
    if (difficulty === 'Expert') maxNum = 500;
    
    const a = Math.floor(Math.random() * maxNum) + 1;
    const b = Math.floor(Math.random() * maxNum) + 1;
    const correctAnswer = a + b;
    
    return {
      id,
      question: `${a} + ${b} = ?`,
      options: generateOptions(correctAnswer, difficulty),
      correctAnswer,
      operation: 'addition',
      difficulty,
      questionType: 'open_ended'
    };
  };

  const generateSubtractionQuestion = (id: number, difficulty: string): Question => {
    let maxNum = 50;
    if (difficulty === 'Medium') maxNum = 100;
    if (difficulty === 'Hard') maxNum = 200;
    if (difficulty === 'Expert') maxNum = 500;
    
    const a = Math.floor(Math.random() * maxNum) + 20;
    const b = Math.floor(Math.random() * 20) + 1;
    const correctAnswer = a - b;
    
    return {
      id,
      question: `${a} - ${b} = ?`,
      options: generateOptions(correctAnswer, difficulty),
      correctAnswer,
      operation: 'subtraction',
      difficulty,
      questionType: 'open_ended'
    };
  };

  const generateMultiplicationQuestion = (id: number, difficulty: string): Question => {
    let maxNum = 12;
    if (difficulty === 'Medium') maxNum = 15;
    if (difficulty === 'Hard') maxNum = 20;
    if (difficulty === 'Expert') maxNum = 25;
    
    const a = Math.floor(Math.random() * maxNum) + 1;
    const b = Math.floor(Math.random() * maxNum) + 1;
    const correctAnswer = a * b;
    
    return {
      id,
      question: `${a} × ${b} = ?`,
      options: generateOptions(correctAnswer, difficulty),
      correctAnswer,
      operation: 'multiplication',
      difficulty,
      questionType: 'open_ended'
    };
  };

  const generateDivisionQuestion = (id: number, difficulty: string): Question => {
    let maxDivisor = 10;
    if (difficulty === 'Medium') maxDivisor = 15;
    if (difficulty === 'Hard') maxDivisor = 20;
    if (difficulty === 'Expert') maxDivisor = 25;
    
    const b = Math.floor(Math.random() * maxDivisor) + 2;
    const correctAnswer = Math.floor(Math.random() * 15) + 1;
    const a = b * correctAnswer;
    
    return {
      id,
      question: `${a} ÷ ${b} = ?`,
      options: generateOptions(correctAnswer, difficulty),
      correctAnswer,
      operation: 'division',
      difficulty,
      questionType: 'open_ended'
    };
  };

  const generateFractionQuestion = (id: number, difficulty: string): Question => {
    const numerator = Math.floor(Math.random() * 8) + 1;
    const denominator = Math.floor(Math.random() * 8) + 2;
    const correctAnswer = Math.round((numerator / denominator) * 100) / 100;
    
    return {
      id,
      question: `What is ${numerator}/${denominator} as a decimal?`,
      options: generateFractionOptions(correctAnswer, difficulty),
      correctAnswer,
      operation: 'fraction',
      difficulty,
      questionType: 'open_ended'
    };
  };

  const generateDecimalQuestion = (id: number, difficulty: string): Question => {
    const decimal = Math.round((Math.random() * 10) * 100) / 100;
    const correctAnswer = Math.round(decimal * 100) / 100;
    
    return {
      id,
      question: `Round ${decimal} to 2 decimal places`,
      options: generateOptions(correctAnswer, difficulty),
      correctAnswer,
      operation: 'decimal',
      difficulty,
      questionType: 'open_ended'
    };
  };

  const generateWordProblem = (id: number, difficulty: string): Question => {
    const problems = [
      { question: "Sarah has 15 apples. She gives away 7. How many does she have left?", answer: 8 },
      { question: "Tom has 3 boxes with 12 pencils each. How many pencils total?", answer: 36 },
      { question: "A pizza has 8 slices. 5 friends each eat 1 slice. How many slices are left?", answer: 3 },
      { question: "Lisa saves $5 each week for 6 weeks. How much does she save?", answer: 30 },
      { question: "A classroom has 24 students. 18 are present. How many are absent?", answer: 6 }
    ];
    
    const problem = problems[Math.floor(Math.random() * problems.length)];
    
    return {
      id,
      question: problem.question,
      options: generateOptions(problem.answer, difficulty),
      correctAnswer: problem.answer,
      operation: 'word_problems',
      difficulty,
      questionType: 'open_ended'
    };
  };

  const generateCountingQuestion = (id: number, difficulty: string): Question => {
    const start = Math.floor(Math.random() * 10) + 1;
    const count = Math.floor(Math.random() * 5) + 3;
    const correctAnswer = start + count - 1;
    
    return {
      id,
      question: `Count from ${start} to ${start + count - 1}. What is the last number?`,
      options: generateOptions(correctAnswer, 'easy'),
      correctAnswer,
      operation: 'counting',
      difficulty,
      questionType: 'open_ended'
    };
  };

  const generateNumberRecognitionQuestion = (id: number, difficulty: string): Question => {
    const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const correctAnswer = numbers[Math.floor(Math.random() * numbers.length)];
    const options = numbers.filter(n => n !== correctAnswer).slice(0, 3).concat([correctAnswer]);
    
    return {
      id,
      question: `Which number comes after ${correctAnswer - 1}?`,
      options: options.sort(() => Math.random() - 0.5),
      correctAnswer,
      operation: 'number_recognition',
      difficulty,
      questionType: 'open_ended'
    };
  };

  const generatePercentageQuestion = (id: number, difficulty: string): Question => {
    const percentage = Math.floor(Math.random() * 50) + 10;
    const number = Math.floor(Math.random() * 100) + 10;
    const correctAnswer = Math.round((percentage / 100) * number);
    
    return {
      id,
      question: `What is ${percentage}% of ${number}?`,
      options: generateOptions(correctAnswer, difficulty),
      correctAnswer,
      operation: 'percentage',
      difficulty,
      questionType: 'open_ended'
    };
  };

  const generateAdvancedQuestion = (id: number, difficulty: string): Question => {
    const operations = ['addition', 'subtraction', 'multiplication', 'division'];
    const operation = operations[Math.floor(Math.random() * operations.length)];
    
    switch (operation) {
      case 'addition':
        return generateAdditionQuestion(id, 'Expert');
      case 'subtraction':
        return generateSubtractionQuestion(id, 'Expert');
      case 'multiplication':
        return generateMultiplicationQuestion(id, 'Expert');
      case 'division':
        return generateDivisionQuestion(id, 'Expert');
      default:
        return generateAdditionQuestion(id, 'Expert');
    }
  };

  const generateOptions = (correctAnswer: number, difficulty: string): number[] => {
    const options = [correctAnswer];
    let range = 10;
    
    if (difficulty === 'Medium') range = 20;
    if (difficulty === 'Hard') range = 30;
    if (difficulty === 'Expert') range = 50;
    
    while (options.length < 4) {
      const randomAnswer = correctAnswer + Math.floor(Math.random() * range * 2) - range;
      if (randomAnswer > 0 && !options.includes(randomAnswer)) {
        options.push(randomAnswer);
      }
    }
    
    return options.sort(() => Math.random() - 0.5);
  };

  const generateFractionOptions = (correctAnswer: number, difficulty: string): number[] => {
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
    const loadQuiz = async () => {
      try {
        // Map level category to admin quiz level
        const levelMapping: { [key: string]: 'High' | 'Middle' | 'Low' } = {
          'high': 'High',
          'middle': 'Middle', 
          'low': 'Low'
        };
        
        const adminLevel = levelMapping[level.category] || 'High';
        console.log(`Loading admin quiz for level: ${adminLevel} (from category: ${level.category}), order: ${level.id}`);
        
        // Get all quizzes for this level and find the one with matching order
        const allQuizzes = await fetchAllQuizzesByLevel(adminLevel);
        const quiz = allQuizzes.find(q => (q.order || 1) === level.id);
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
              questionType: (q.questionType as 'multiple_choice' | 'open_ended') || 'open_ended' // Default to open_ended if not specified
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
          console.warn(`No admin-created quiz found for level: ${adminLevel}, using auto-generated questions`);
          setQuestions(generateQuestions());
        }
        setStartTime(Date.now());
      } catch (error) {
        console.error('Error loading leveled quiz:', error);
        // Fallback to auto-generated questions
        setQuestions(generateQuestions());
        setStartTime(Date.now());
      }
    };
    
    loadQuiz();
  }, [level]);

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
    
    if (isCorrect) {
      setScore(score + 1);
    }
    
    // Create the new answer object
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
    
    // Update answers state
    const updatedAnswers = [...answers, newAnswer];
    setAnswers(updatedAnswers);
    
    console.log('Answer added:', newAnswer);
    console.log('Total answers so far:', updatedAnswers.length);

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedAnswer(null);
      setTypedAnswer('');
      setQuestionStartTime(Date.now());
    } else {
      // For the last question, pass the updated answers directly to avoid race condition
      finishQuiz(updatedAnswers);
    }
  };

  const finishQuiz = (finalAnswers = answers) => {
    const endTime = Date.now();
    const timeTaken = Math.floor((endTime - startTime) / 1000);
    
    // Calculate actual score from answers array to avoid state timing issues
    const actualScore = finalAnswers.filter(a => a.isCorrect).length;
    
    console.log('Leveled Quiz - Final scoring:', {
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
    // Add detailed answers data to performance
    const performanceWithDetails = {
      ...performanceData,
      detailedAnswers: finalAnswers,
      levelId: level.id,
      levelName: level.title,
      levelDifficulty: level.difficulty
    };
    
    console.log('Leveled Quiz - Detailed answers being passed:', finalAnswers);
    console.log('Leveled Quiz - Performance with details:', performanceWithDetails);
    
    setPerformance(performanceData);
    setShowPerformanceModal(true);
    
    setQuizCompleted(true);
    
    if (onComplete) {
      onComplete(performanceWithDetails);
    }
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
        <div className="loading">Preparing your {level.title} quiz...</div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  return (
    <>
      <div className="math-quiz">
        <div className="quiz-header" style={{ background: `linear-gradient(135deg, ${level.color}, ${level.color}dd)` }}>
          <div className="quiz-header-content">
            <div className="quiz-level-info">
              <h2>{level.emoji} {level.title}</h2>
              <div className="level-difficulty-badge">
                {level.difficulty} Level
              </div>
            </div>
            <button className="back-to-levels-btn" onClick={onBack}>
              ← Back to Levels
            </button>
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

export default LeveledMathQuiz;
