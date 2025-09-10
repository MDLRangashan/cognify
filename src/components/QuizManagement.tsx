import React, { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import './QuizManagement.css';
import { db } from '../config/firebaseConfig';
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, orderBy } from 'firebase/firestore';

interface QuizQuestion {
  id: string;
  question: string;
  correctAnswer: number | string;
  operation: string;
  difficulty: string;
  timeLimit?: number; // in seconds
  questionType: 'multiple_choice' | 'open_ended';
  options?: number[]; // Only for multiple choice questions
}

interface Quiz {
  id: string;
  title: string;
  description: string;
  level: 'High' | 'Middle' | 'Low' | 'Initial Assessment';
  category: string;
  questions: QuizQuestion[];
  totalQuestions: number;
  timeLimit: number; // total time in minutes
  isActive: boolean;
  order?: number;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

const QuizManagement: React.FC = () => {
  const { t } = useLanguage();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingQuiz, setEditingQuiz] = useState<Quiz | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<'All' | 'High' | 'Middle' | 'Low' | 'Initial Assessment'>('All');

  // Form state for creating/editing quizzes
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    level: 'High' as 'High' | 'Middle' | 'Low' | 'Initial Assessment',
    category: '',
    timeLimit: 10,
    isActive: true,
    order: 1
  });

  const [questions, setQuestions] = useState<Omit<QuizQuestion, 'id'>[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState({
    question: '',
    questionType: 'open_ended' as 'multiple_choice' | 'open_ended',
    options: [0, 0, 0, 0] as number[],
    correctAnswer: '' as string | number,
    operation: 'addition',
    difficulty: 'Easy',
    timeLimit: 30
  });

  useEffect(() => {
    fetchQuizzes();
  }, []);

  const fetchQuizzes = async () => {
    try {
      setLoading(true);
      console.log('Fetching all quizzes from adminQuizzes collection...');
      const quizzesRef = collection(db, 'adminQuizzes');
      const q = query(quizzesRef, orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      
      console.log(`Found ${snapshot.size} quizzes in database`);
      
      const quizzesData: Quiz[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        console.log(`Quiz ${doc.id}:`, {
          title: data.title,
          level: data.level,
          isActive: data.isActive,
          questionsCount: data.questions?.length || 0
        });
        quizzesData.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date()
        } as Quiz);
      });
      
      setQuizzes(quizzesData);
      console.log('Quizzes loaded:', quizzesData.length);
    } catch (error) {
      console.error('Error fetching quizzes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateQuiz = async () => {
    if (questions.length === 0) {
      alert('Please add at least one question to the quiz.');
      return;
    }

    try {
      const quizData = {
        ...formData,
        questions: questions.map((q, index) => {
          let actualCorrectAnswer: number | string;
          
          if (q.questionType === 'multiple_choice') {
            // For multiple choice, convert correctAnswer from index (1-4) to actual value
            actualCorrectAnswer = q.options![q.correctAnswer as number - 1];
            console.log(`Converting multiple choice question ${index + 1}:`, {
              question: q.question,
              options: q.options,
              correctAnswerIndex: q.correctAnswer,
              actualCorrectAnswer: actualCorrectAnswer
            });
          } else {
            // For open-ended questions, use the correctAnswer as is
            actualCorrectAnswer = q.correctAnswer;
            console.log(`Open-ended question ${index + 1}:`, {
              question: q.question,
              correctAnswer: actualCorrectAnswer
            });
          }
          
          return {
            ...q,
            id: `q${index + 1}`,
            correctAnswer: actualCorrectAnswer
          };
        }),
        totalQuestions: questions.length,
        createdBy: 'admin', // In real app, get from auth context
        createdAt: new Date(),
        updatedAt: new Date()
      };

      console.log('Creating quiz with data:', quizData);
      console.log('Quiz level:', quizData.level);
      console.log('Quiz isActive:', quizData.isActive);
      
      const docRef = await addDoc(collection(db, 'adminQuizzes'), quizData);
      console.log('Quiz created with ID:', docRef.id);
      
      // Reset form
      setFormData({
        title: '',
        description: '',
        level: 'High',
        category: '',
        timeLimit: 10,
        isActive: true,
        order: 1
      });
      setQuestions([]);
      setCurrentQuestion({
        question: '',
        questionType: 'open_ended',
        options: [0, 0, 0, 0] as number[],
        correctAnswer: '' as string | number,
        operation: 'addition',
        difficulty: 'Easy',
        timeLimit: 30
      });
      setShowCreateForm(false);
      
      fetchQuizzes();
      alert('Quiz created successfully!');
    } catch (error) {
      console.error('Error creating quiz:', error);
      alert('Error creating quiz. Please try again.');
    }
  };

  const handleAddQuestion = () => {
    if (!currentQuestion.question.trim()) {
      alert('Please enter a question.');
      return;
    }

    if (currentQuestion.questionType === 'multiple_choice' && currentQuestion.options.some(opt => opt === 0)) {
      alert('Please fill in all answer options.');
      return;
    }

    if (currentQuestion.questionType === 'open_ended' && !currentQuestion.correctAnswer.toString().trim()) {
      alert('Please enter the correct answer.');
      return;
    }

    setQuestions([...questions, { ...currentQuestion }]);
    setCurrentQuestion({
      question: '',
      questionType: 'open_ended',
      options: [0, 0, 0, 0] as number[],
      correctAnswer: '' as string | number,
      operation: 'addition',
      difficulty: 'Easy',
      timeLimit: 30
    });
  };

  const handleRemoveQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const toggleQuizStatus = async (quizId: string, isActive: boolean) => {
    try {
      const quizRef = doc(db, 'adminQuizzes', quizId);
      await updateDoc(quizRef, {
        isActive: !isActive,
        updatedAt: new Date()
      });
      fetchQuizzes();
    } catch (error) {
      console.error('Error updating quiz status:', error);
    }
  };

  const handleDeleteQuiz = async (quizId: string) => {
    if (window.confirm('Are you sure you want to delete this quiz?')) {
      try {
        await deleteDoc(doc(db, 'adminQuizzes', quizId));
        fetchQuizzes();
        alert('Quiz deleted successfully!');
      } catch (error) {
        console.error('Error deleting quiz:', error);
        alert('Error deleting quiz. Please try again.');
      }
    }
  };

  const handleEditQuiz = (quiz: Quiz) => {
    setEditingQuiz(quiz);
    setFormData({
      title: quiz.title,
      description: quiz.description,
      level: quiz.level,
      category: quiz.category,
      timeLimit: quiz.timeLimit,
      isActive: quiz.isActive,
      order: (quiz as any).order || 1
    });
    
    // Convert questions back to editable format
    const editableQuestions = quiz.questions.map(q => {
      if (q.questionType === 'multiple_choice' && q.options) {
        // Find the index of the correct answer in the options array
        const correctAnswerIndex = q.options.findIndex(opt => opt === q.correctAnswer) + 1;
        return {
          question: q.question,
          questionType: q.questionType || 'multiple_choice',
          options: q.options,
          correctAnswer: correctAnswerIndex || 1,
          operation: q.operation,
          difficulty: q.difficulty,
          timeLimit: q.timeLimit || 30
        };
      } else {
        // For open-ended questions
        return {
          question: q.question,
          questionType: q.questionType || 'open_ended',
          options: [0, 0, 0, 0],
          correctAnswer: q.correctAnswer.toString(),
          operation: q.operation,
          difficulty: q.difficulty,
          timeLimit: q.timeLimit || 30
        };
      }
    });
    
    setQuestions(editableQuestions);
    setShowCreateForm(true);
  };

  const handleUpdateQuiz = async () => {
    if (questions.length === 0) {
      alert('Please add at least one question to the quiz.');
      return;
    }

    if (!editingQuiz) return;

    try {
      const quizData = {
        ...formData,
        questions: questions.map((q, index) => {
          let actualCorrectAnswer: number | string;
          
          if (q.questionType === 'multiple_choice') {
            // For multiple choice, convert correctAnswer from index (1-4) to actual value
            actualCorrectAnswer = q.options![q.correctAnswer as number - 1];
          } else {
            // For open-ended questions, use the correctAnswer as is
            actualCorrectAnswer = q.correctAnswer;
          }
          
          return {
            ...q,
            id: `q${index + 1}`,
            correctAnswer: actualCorrectAnswer
          };
        }),
        totalQuestions: questions.length,
        updatedAt: new Date()
      };

      const quizRef = doc(db, 'adminQuizzes', editingQuiz.id);
      await updateDoc(quizRef, quizData);
      
      // Reset form
      setFormData({
        title: '',
        description: '',
        level: 'High',
        category: '',
        timeLimit: 10,
        isActive: true,
        order: 1
      });
      setQuestions([]);
      setCurrentQuestion({
        question: '',
        questionType: 'open_ended',
        options: [0, 0, 0, 0] as number[],
        correctAnswer: '' as string | number,
        operation: 'addition',
        difficulty: 'Easy',
        timeLimit: 30
      });
      setShowCreateForm(false);
      setEditingQuiz(null);
      
      fetchQuizzes();
      alert('Quiz updated successfully!');
    } catch (error) {
      console.error('Error updating quiz:', error);
      alert('Error updating quiz. Please try again.');
    }
  };

  const filteredQuizzes = selectedLevel === 'All' 
    ? quizzes 
    : quizzes.filter(quiz => quiz.level === selectedLevel);

  const getOperationIcon = (operation: string) => {
    switch (operation) {
      case 'addition': return '➕';
      case 'subtraction': return '➖';
      case 'multiplication': return '✖️';
      case 'division': return '➗';
      case 'fraction': return '🥧';
      case 'decimal': return '🔢';
      case 'percentage': return '%';
      case 'word_problems': return '📝';
      case 'counting': return '🔢';
      case 'number_recognition': return '👁️';
      default: return '❓';
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'easy': return '#10b981';
      case 'medium': return '#f59e0b';
      case 'hard': return '#ef4444';
      case 'expert': return '#8b5cf6';
      default: return '#6b7280';
    }
  };

  if (loading) {
    return (
      <div className="quiz-management">
        <div className="loading-container">
          <div className="loading-spinner">
            <div className="spinner"></div>
            <p>Loading quizzes...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="quiz-management">
      <div className="quiz-header">
        <h2>📚 Quiz Management</h2>
        <div className="header-actions">
          <div className="level-filter">
            <label>Filter by Level:</label>
            <select 
              value={selectedLevel} 
              onChange={(e) => setSelectedLevel(e.target.value as any)}
            >
              <option value="All">{t('common.allLevels')}</option>
              <option value="Initial Assessment">{t('quiz.initialAssessment')}</option>
              <option value="High">{t('quiz.highPerformers')}</option>
              <option value="Middle">{t('quiz.middlePerformers')}</option>
              <option value="Low">{t('quiz.lowPerformers')}</option>
            </select>
          </div>
          <button 
            className="create-quiz-btn"
            onClick={() => setShowCreateForm(true)}
          >
            ➕ {t('quiz.createNewQuiz')}
          </button>
        </div>
      </div>

      {/* Quiz List */}
      <div className="quizzes-grid">
        {filteredQuizzes.map((quiz) => (
          <div key={quiz.id} className={`quiz-card ${quiz.isActive ? 'active' : 'inactive'}`}>
            <div className="quiz-card-header">
              <div className="quiz-title">
                <h3>{quiz.title}</h3>
                <span className={`level-badge ${quiz.level.toLowerCase().replace(' ', '-')}`}>
                  {quiz.level === 'Initial Assessment' ? 'Initial Assessment' : `${quiz.level} Performer`}
                </span>
              </div>
              <div className="quiz-actions">
                <button 
                  className="edit-btn"
                  onClick={() => handleEditQuiz(quiz)}
                >
                  ✏️ Edit
                </button>
                <button 
                  className={`status-btn ${quiz.isActive ? 'active' : 'inactive'}`}
                  onClick={() => toggleQuizStatus(quiz.id, quiz.isActive)}
                >
                  {quiz.isActive ? '✅ Active' : '⏸️ Inactive'}
                </button>
                <button 
                  className="delete-btn"
                  onClick={() => handleDeleteQuiz(quiz.id)}
                >
                  🗑️ Delete
                </button>
              </div>
            </div>
            
            <div className="quiz-details">
              <p className="quiz-description">{quiz.description}</p>
              <div className="quiz-stats">
                <span>📝 {quiz.totalQuestions} Questions</span>
                <span>⏱️ {quiz.timeLimit} minutes</span>
                <span>📂 {quiz.category}</span>
              </div>
            </div>

            <div className="quiz-questions-preview">
              <div className="preview-header">
                <h4>Questions Preview</h4>
                <span className="question-count">{quiz.questions.length} Questions</span>
              </div>
              <div className="questions-grid">
                {quiz.questions.slice(0, 3).map((question, index) => (
                  <div key={question.id} className="question-card">
                    <div className="question-header">
                      <div className="question-number">Q{index + 1}</div>
                      <div className="question-type-indicator">
                        {question.questionType === 'open_ended' ? (
                          <span className="type-badge open-ended">
                            <span className="type-icon">✏️</span>
                            Open Answer
                          </span>
                        ) : (
                          <span className="type-badge multiple-choice">
                            <span className="type-icon">🔘</span>
                            Multiple Choice
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="question-content">
                      <p className="question-text">{question.question}</p>
                    </div>
                    <div className="question-footer">
                      <div className="question-details">
                        <span className="operation-badge">
                          {getOperationIcon(question.operation)} {question.operation}
                        </span>
                        <span 
                          className="difficulty-badge"
                          style={{ backgroundColor: getDifficultyColor(question.difficulty) }}
                        >
                          {question.difficulty}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
                {quiz.questions.length > 3 && (
                  <div className="more-questions-card">
                    <div className="more-icon">+</div>
                    <div className="more-text">
                      <span className="more-count">{quiz.questions.length - 3}</span>
                      <span className="more-label">More Questions</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Create Quiz Modal */}
      {showCreateForm && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>{editingQuiz ? 'Edit Quiz' : 'Create New Quiz'}</h3>
              <button 
                className="close-btn"
                onClick={() => {
                  setShowCreateForm(false);
                  setEditingQuiz(null);
                  // Reset form when closing
                  setFormData({
                    title: '',
                    description: '',
                    level: 'High',
                    category: '',
                    timeLimit: 10,
                    isActive: true,
                    order: 1
                  });
                  setQuestions([]);
                  setCurrentQuestion({
                    question: '',
                    questionType: 'open_ended',
                    options: [0, 0, 0, 0] as number[],
                    correctAnswer: '' as string | number,
                    operation: 'addition',
                    difficulty: 'Easy',
                    timeLimit: 30
                  });
                }}
              >
                ✕
              </button>
            </div>

            <div className="modal-body">
              <div className="form-section">
                <h4>Quiz Information</h4>
                <div className="form-row">
                  <div className="form-group">
                    <label>Quiz Title</label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({...formData, title: e.target.value})}
                      placeholder="Enter quiz title"
                    />
                  </div>
                  <div className="form-group">
                    <label>Performance Level</label>
                    <select
                      value={formData.level}
                      onChange={(e) => setFormData({...formData, level: e.target.value as any})}
                    >
                      <option value="Initial Assessment">Initial Assessment</option>
                      <option value="High">{t('quiz.highPerformer')}</option>
                      <option value="Middle">{t('quiz.middlePerformer')}</option>
                      <option value="Low">{t('quiz.lowPerformer')}</option>
                    </select>
                  </div>
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label>Category</label>
                    <input
                      type="text"
                      value={formData.category}
                      onChange={(e) => setFormData({...formData, category: e.target.value})}
                      placeholder="e.g., Basic Math, Advanced Algebra"
                    />
                  </div>
                  <div className="form-group">
                    <label>Time Limit (minutes)</label>
                    <input
                      type="number"
                      value={formData.timeLimit}
                      onChange={(e) => setFormData({...formData, timeLimit: parseInt(e.target.value)})}
                      min="1"
                      max="60"
                    />
                  </div>
                  <div className="form-group">
                    <label>Quiz Order (1-6 for High, 1-9 for Middle, 1-12 for Low)</label>
                    <input
                      type="number"
                      value={formData.order}
                      onChange={(e) => setFormData({...formData, order: parseInt(e.target.value)})}
                      min="1"
                      max={formData.level === 'High' ? 6 : formData.level === 'Middle' ? 9 : 12}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    placeholder="Describe what this quiz covers"
                    rows={3}
                  />
                </div>
              </div>

              <div className="form-section">
                <h4>Add Questions ({questions.length} added)</h4>
                
                <div className="question-form">
                  <div className="form-group">
                    <label>Question</label>
                    <input
                      type="text"
                      value={currentQuestion.question}
                      onChange={(e) => setCurrentQuestion({...currentQuestion, question: e.target.value})}
                      placeholder="Enter the question"
                    />
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Question Type</label>
                      <select
                        value={currentQuestion.questionType}
                        onChange={(e) => setCurrentQuestion({...currentQuestion, questionType: e.target.value as 'multiple_choice' | 'open_ended'})}
                      >
                        <option value="open_ended">Open-ended (Type Answer)</option>
                        <option value="multiple_choice">Multiple Choice</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Operation Type</label>
                      <select
                        value={currentQuestion.operation}
                        onChange={(e) => setCurrentQuestion({...currentQuestion, operation: e.target.value})}
                      >
                        <option value="addition">Addition</option>
                        <option value="subtraction">Subtraction</option>
                        <option value="multiplication">Multiplication</option>
                        <option value="division">Division</option>
                        <option value="fraction">Fraction</option>
                        <option value="decimal">Decimal</option>
                        <option value="percentage">Percentage</option>
                        <option value="word_problems">Word Problems</option>
                        <option value="counting">Counting</option>
                        <option value="number_recognition">Number Recognition</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Difficulty</label>
                      <select
                        value={currentQuestion.difficulty}
                        onChange={(e) => setCurrentQuestion({...currentQuestion, difficulty: e.target.value})}
                      >
                        <option value="Easy">{t('quiz.easy')}</option>
                        <option value="Medium">{t('quiz.medium')}</option>
                        <option value="Hard">{t('quiz.hard')}</option>
                        <option value="Expert">{t('quiz.expert')}</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Time Limit (seconds)</label>
                      <input
                        type="number"
                        value={currentQuestion.timeLimit}
                        onChange={(e) => setCurrentQuestion({...currentQuestion, timeLimit: parseInt(e.target.value)})}
                        min="10"
                        max="300"
                      />
                    </div>
                  </div>

                  {currentQuestion.questionType === 'multiple_choice' ? (
                    <>
                      <div className="form-group">
                        <label>Answer Options</label>
                        <div className="options-grid">
                          {currentQuestion.options.map((option, index) => (
                            <input
                              key={index}
                              type="number"
                              value={option}
                              onChange={(e) => {
                                const newOptions = [...currentQuestion.options];
                                newOptions[index] = parseFloat(e.target.value) || 0;
                                setCurrentQuestion({...currentQuestion, options: newOptions});
                              }}
                              placeholder={`Option ${index + 1}`}
                            />
                          ))}
                        </div>
                      </div>

                      <div className="form-group">
                        <label>Correct Answer (1-4)</label>
                        <select
                          value={currentQuestion.correctAnswer}
                          onChange={(e) => setCurrentQuestion({...currentQuestion, correctAnswer: parseInt(e.target.value)})}
                        >
                          <option value={0}>Select correct option</option>
                          <option value={1}>Option 1</option>
                          <option value={2}>Option 2</option>
                          <option value={3}>Option 3</option>
                          <option value={4}>Option 4</option>
                        </select>
                      </div>
                    </>
                  ) : (
                    <div className="form-group">
                      <label>Correct Answer</label>
                      <input
                        type="text"
                        value={currentQuestion.correctAnswer}
                        onChange={(e) => setCurrentQuestion({...currentQuestion, correctAnswer: e.target.value})}
                        placeholder="Enter the correct answer (e.g., 15, 3.5, 25%)"
                      />
                      <small style={{color: '#6b7280', fontSize: '12px', marginTop: '4px', display: 'block'}}>
                        Students will type their answer. Be specific about the expected format (e.g., whole numbers, decimals, fractions).
                      </small>
                    </div>
                  )}

                  <button 
                    className="add-question-btn"
                    onClick={handleAddQuestion}
                  >
                    ➕ Add Question
                  </button>
                </div>

                {questions.length > 0 && (
                  <div className="questions-list">
                    <h5>Added Questions:</h5>
                    {questions.map((question, index) => (
                      <div key={index} className="question-item">
                        <div className="question-content">
                          <span className="question-number">Q{index + 1}</span>
                          <span className="question-text">{question.question}</span>
                          <div className="question-meta">
                            <span className="operation-icon">
                              {getOperationIcon(question.operation)}
                            </span>
                            <span 
                              className="difficulty-badge"
                              style={{ backgroundColor: getDifficultyColor(question.difficulty) }}
                            >
                              {question.difficulty}
                            </span>
                          </div>
                        </div>
                        <button 
                          className="remove-question-btn"
                          onClick={() => handleRemoveQuestion(index)}
                        >
                          🗑️
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="modal-footer">
              <button 
                className="cancel-btn"
                onClick={() => {
                  setShowCreateForm(false);
                  setEditingQuiz(null);
                  // Reset form when canceling
                  setFormData({
                    title: '',
                    description: '',
                    level: 'High',
                    category: '',
                    timeLimit: 10,
                    isActive: true,
                    order: 1
                  });
                  setQuestions([]);
                  setCurrentQuestion({
                    question: '',
                    questionType: 'open_ended',
                    options: [0, 0, 0, 0] as number[],
                    correctAnswer: '' as string | number,
                    operation: 'addition',
                    difficulty: 'Easy',
                    timeLimit: 30
                  });
                }}
              >
                Cancel
              </button>
              <button 
                className="create-btn"
                onClick={editingQuiz ? handleUpdateQuiz : handleCreateQuiz}
                disabled={questions.length === 0}
              >
                {editingQuiz ? 'Update Quiz' : 'Create Quiz'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuizManagement;
