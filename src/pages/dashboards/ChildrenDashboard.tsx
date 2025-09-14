import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import MathQuiz from '../../components/MathQuiz';
import InitialAssessmentQuiz from '../../components/InitialAssessmentQuiz';
import LevelSelection from '../../components/LevelSelection';
import LeveledMathQuiz from '../../components/LeveledMathQuiz';
import LearningLibrary from '../../components/LearningLibrary';
import MiniGames from '../../components/MiniGames';
import LanguageSelector from '../../components/LanguageSelector';
import CapturedImagesGallery from '../../components/CapturedImagesGallery';
import { QuizPerformance } from '../../utils/performanceCategorizer';
import { QuizLevel, updateLevelProgress, getTotalPoints, getCompletedLevels, getLevelsForCategory, PerformanceCategory, updateLevelWithAdminQuiz } from '../../utils/performanceBasedLevels';
import { fetchQuizByLevel, fetchAllQuizzesByLevel, AdminQuiz } from '../../utils/quizFetcher';
import { db } from '../../config/firebaseConfig';
import { doc, setDoc, getDoc, collection, addDoc } from 'firebase/firestore';
import './ChildrenDashboard.css';

interface ChildData {
  id: string;
  parentId: string;
  firstName: string;
  lastName: string;
  username: string;
  dateOfBirth: string;
  gender: 'male' | 'female' | 'other';
  grade: string;
  school: string;
  assignedTeacherId: string;
  assignedTeacherName: string;
  emergencyContact: string;
  medicalInfo: string;
  allergies: string;
  createdAt: Date;
  updatedAt: Date;
}

const ChildrenDashboard: React.FC = () => {
  const { t } = useLanguage();
  const [childData, setChildData] = useState<ChildData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showQuiz, setShowQuiz] = useState(false);
  const [showInitialAssessment, setShowInitialAssessment] = useState(false);
  const [showLevelSelection, setShowLevelSelection] = useState(false);
  const [showLeveledQuiz, setShowLeveledQuiz] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState<QuizLevel | null>(null);
  const [performanceCategory, setPerformanceCategory] = useState<PerformanceCategory | null>(null);
  const [levels, setLevels] = useState<QuizLevel[]>([]);
  const [hasCompletedAssessment, setHasCompletedAssessment] = useState(false);
  const [showLearningLibrary, setShowLearningLibrary] = useState(false);
  const [showMiniGames, setShowMiniGames] = useState(false);
  const [showImageGallery, setShowImageGallery] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if child is logged in
    const storedChild = localStorage.getItem('childUser');
    if (storedChild) {
      try {
        const child = JSON.parse(storedChild);
        setChildData(child);
        
        // Check if quiz was completed before (for quick quiz)
        localStorage.getItem(`quizCompleted_${child.id}`);
        
        // Load performance data if available
        loadPerformanceData(child.id);
        loadLevelProgress(child.id);
        checkAssessmentStatus(child.id);
      } catch (error) {
        console.error('Error parsing child data:', error);
        navigate('/children-login');
      }
    } else {
      navigate('/children-login');
    }
    setLoading(false);
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('childUser');
    navigate('/children-login');
  };

  const handleStartQuiz = () => {
    setShowQuiz(true);
  };

  const handleStartInitialAssessment = () => {
    setShowInitialAssessment(true);
  };

  const handleStartLeveledQuiz = () => {
    console.log('handleStartLeveledQuiz called');
    console.log('hasCompletedAssessment:', hasCompletedAssessment);
    console.log('levels available:', levels.length);
    
    if (!hasCompletedAssessment) {
      console.log('Assessment not completed, showing initial assessment');
      setShowInitialAssessment(true);
    } else {
      console.log('Assessment completed, showing level selection');
      console.log('Available levels:', levels);
      setShowLevelSelection(true);
    }
  };

  const handleLevelSelect = (level: QuizLevel) => {
    setSelectedLevel(level);
    setShowLeveledQuiz(true);
    setShowLevelSelection(false);
  };

  const handleBackToLevels = () => {
    setShowLeveledQuiz(false);
    setShowLevelSelection(true);
  };

  const handleBackToDashboard = () => {
    setShowLevelSelection(false);
    setShowLeveledQuiz(false);
    setSelectedLevel(null);
  };

  const loadPerformanceData = async (childId: string) => {
    try {
      const performanceDoc = await getDoc(doc(db, 'childrenPerformance', childId));
      if (performanceDoc.exists()) {
        // Performance data loaded successfully
        console.log('Performance data loaded for child:', childId);
      }
    } catch (error) {
      console.error('Error loading performance data:', error);
    }
  };

  const loadLevelProgress = async (childId: string) => {
    try {
      const levelProgressDoc = await getDoc(doc(db, 'childrenLevelProgress', childId));
      if (levelProgressDoc.exists()) {
        const data = levelProgressDoc.data();
        const savedLevels = data.levels as QuizLevel[];
        const category = data.performanceCategory as PerformanceCategory;
        
        // Load all admin quizzes for this category and map them to levels
        const levelName = category.id === 'high' ? 'High' : 
                         category.id === 'middle' ? 'Middle' : 'Low';
        
        const adminQuizzes = await fetchAllQuizzesByLevel(levelName);
        console.log(`Found ${adminQuizzes.length} admin quizzes for ${levelName} level:`, adminQuizzes);
        
        // Map admin quizzes to level structure
        const updatedLevels = savedLevels.map((level, index) => {
          const adminQuiz = adminQuizzes.find(quiz => (quiz.order || 1) === level.id);
          let updatedLevel = level;
          
          if (adminQuiz) {
            updatedLevel = updateLevelWithAdminQuiz(level, adminQuiz);
            console.log(`Updated level ${level.id} with admin quiz data:`, {
              original: level,
              adminQuiz: adminQuiz,
              updated: updatedLevel
            });
          } else {
            console.log(`No admin quiz found for level ${level.id} (order ${level.id})`);
          }
          
          // Ensure proper sequential unlocking
          if (level.id === 1) {
            // First level is always unlocked
            updatedLevel.isUnlocked = true;
          } else if (level.id > 1) {
            // Check if previous level is completed to unlock current level
            const previousLevel = savedLevels.find(l => l.id === level.id - 1);
            if (previousLevel && previousLevel.isCompleted) {
              updatedLevel.isUnlocked = true;
              console.log(`Unlocking level ${level.id} because previous level ${level.id - 1} is completed`);
            }
          }
          
          return updatedLevel;
        });
        
        setLevels(updatedLevels);
        setPerformanceCategory(category);
      }
    } catch (error) {
      console.error('Error loading level progress:', error);
    }
  };

  const checkAssessmentStatus = async (childId: string) => {
    try {
      const assessmentDoc = await getDoc(doc(db, 'childrenAssessment', childId));
      if (assessmentDoc.exists()) {
        setHasCompletedAssessment(true);
      }
    } catch (error) {
      console.error('Error checking assessment status:', error);
    }
  };

  const savePerformanceData = async (performance: QuizPerformance) => {
    if (!childData) return;
    
    try {
      await addDoc(collection(db, 'childrenPerformance'), {
        ...performance,
        childId: childData.id,
        childName: `${childData.firstName} ${childData.lastName}`,
        completedAt: new Date(),
        parentId: childData.parentId
      });
      console.log('Performance data saved successfully');
    } catch (error) {
      console.error('Error saving performance data:', error);
    }
  };

  const saveLevelProgress = async (updatedLevels: QuizLevel[]) => {
    if (!childData) return;
    
    try {
      await setDoc(doc(db, 'childrenLevelProgress', childData.id), {
        childId: childData.id,
        childName: `${childData.firstName} ${childData.lastName}`,
        levels: updatedLevels,
        performanceCategory: performanceCategory,
        totalPoints: getTotalPoints(updatedLevels),
        completedLevels: getCompletedLevels(updatedLevels),
        lastUpdated: new Date(),
        parentId: childData.parentId
      });
      console.log('Level progress saved successfully');
    } catch (error) {
      console.error('Error saving level progress:', error);
    }
  };

  const saveAssessmentResult = async (performance: QuizPerformance, category: PerformanceCategory) => {
    if (!childData) return;
    
    console.log('=== SAVING ASSESSMENT RESULT ===');
    console.log('Child data:', childData);
    console.log('Child ID:', childData.id);
    console.log('Child name:', `${childData.firstName} ${childData.lastName}`);
    console.log('Performance data:', performance);
    console.log('Category:', category);
    
    try {
      const sanitizeForFirestore = (value: any): any => {
        if (value === undefined) return undefined;
        if (value === null) return null;
        if (value instanceof Date) return value;
        if (Array.isArray(value)) {
          return value.map((v) => sanitizeForFirestore(v)).filter((v) => v !== undefined);
        }
        if (typeof value === 'object') {
          const out: any = {};
          Object.keys(value).forEach((k) => {
            const sanitized = sanitizeForFirestore((value as any)[k]);
            if (sanitized !== undefined) {
              out[k] = sanitized;
            }
          });
          return out;
        }
        return value;
      };

      const safePerformance = sanitizeForFirestore(performance as any);
      const safeCategory = sanitizeForFirestore(category as any);

      // Save assessment result to childrenAssessment collection
      const assessmentPayload = sanitizeForFirestore({
        childId: childData.id,
        childName: `${childData.firstName} ${childData.lastName}`,
        performance: safePerformance,
        performanceCategory: safeCategory,
        completedAt: new Date(),
        parentId: childData.parentId ?? null
      });
      await setDoc(doc(db, 'childrenAssessment', childData.id), assessmentPayload);

      // Also save to childrenPerformance collection for reports
      const detailedAnswers = (performance as any).detailedAnswers || [];
      console.log('Saving assessment with detailed answers:', detailedAnswers);
      console.log('Detailed answers length:', detailedAnswers.length);
      
      const performancePayload = sanitizeForFirestore({
        childId: childData.id,
        childName: `${childData.firstName} ${childData.lastName}`,
        score: performance.score,
        totalQuestions: performance.totalQuestions,
        accuracy: performance.accuracy,
        timeTaken: performance.timeTaken,
        category: performance.category,
        levelId: 0,
        levelName: 'Initial Assessment',
        completedAt: new Date(),
        parentId: childData.parentId ?? null,
        detailedAnswers: detailedAnswers,
        levelDifficulty: (performance as any).levelDifficulty || 'Mixed'
      });
      const performanceDoc = await addDoc(collection(db, 'childrenPerformance'), performancePayload);

      console.log('Performance data saved with ID:', performanceDoc.id);

      // Initialize levels based on performance category
      const baseLevels = getLevelsForCategory(category.id);
      
      // Load all admin quizzes for this category and map them to levels
      const levelName = category.id === 'high' ? 'High' : 
                       category.id === 'middle' ? 'Middle' : 'Low';
      
      const adminQuizzes = await fetchAllQuizzesByLevel(levelName);
      console.log(`Found ${adminQuizzes.length} admin quizzes for ${levelName} level:`, adminQuizzes);
      
      // Map admin quizzes to level structure
      const initialLevels = baseLevels.map((level, index) => {
        const adminQuiz = adminQuizzes.find(quiz => (quiz.order || 1) === level.id);
        let updatedLevel = level;
        
        if (adminQuiz) {
          updatedLevel = updateLevelWithAdminQuiz(level, adminQuiz);
          console.log(`Updated initial level ${level.id} with admin quiz data:`, {
            original: level,
            adminQuiz: adminQuiz,
            updated: updatedLevel
          });
        } else {
          console.log(`No admin quiz found for initial level ${level.id} (order ${level.id})`);
        }
        
        return updatedLevel;
      });
      
      setLevels(initialLevels);
      setPerformanceCategory(category);
      setHasCompletedAssessment(true);
      
      // Save initial level progress
      const levelProgressPayload = sanitizeForFirestore({
        childId: childData.id,
        childName: `${childData.firstName} ${childData.lastName}`,
        levels: initialLevels,
        performanceCategory: safeCategory,
        totalPoints: 0,
        completedLevels: 0,
        lastUpdated: new Date(),
        parentId: childData.parentId ?? null
      });
      await setDoc(doc(db, 'childrenLevelProgress', childData.id), levelProgressPayload);

      console.log('Assessment result saved successfully');
    } catch (error) {
      console.error('Error saving assessment result:', error);
    }
  };

  const handleQuizComplete = (performance: QuizPerformance) => {
    setShowQuiz(false);
    
    if (childData) {
      localStorage.setItem(`quizCompleted_${childData.id}`, 'true');
      savePerformanceData(performance);
    }
  };

  const handleAssessmentComplete = async (performance: QuizPerformance, category: PerformanceCategory) => {
    console.log('Assessment completed:', performance, category);
    setShowInitialAssessment(false);
    await saveAssessmentResult(performance, category);
    
    // Reload level progress to ensure levels are properly loaded
    if (childData) {
      await loadLevelProgress(childData.id);
    }
  };

  const handleLeveledQuizComplete = async (performance: QuizPerformance) => {
    if (!selectedLevel || !childData) return;
    
    console.log('Leveled quiz completed:', performance, 'for level:', selectedLevel);
    
    try {
      // Save performance data to childrenPerformance collection
      const detailedAnswers = (performance as any).detailedAnswers || [];
      console.log('Saving leveled quiz with detailed answers:', detailedAnswers);
      console.log('Detailed answers length:', detailedAnswers.length);
      
      const performanceDoc = await addDoc(collection(db, 'childrenPerformance'), {
        childId: childData.id,
        childName: `${childData.firstName} ${childData.lastName}`,
        score: performance.score,
        totalQuestions: performance.totalQuestions,
        accuracy: performance.accuracy,
        timeTaken: performance.timeTaken,
        category: performance.category,
        levelId: selectedLevel.id,
        levelName: selectedLevel.title,
        completedAt: new Date(),
        parentId: childData.parentId,
        detailedAnswers: detailedAnswers,
        levelDifficulty: (performance as any).levelDifficulty || selectedLevel.difficulty
      });

      console.log('Leveled quiz performance saved with ID:', performanceDoc.id);

      // Update level progress
      const updatedLevels = updateLevelProgress(levels, {
        ...performance,
        levelId: selectedLevel.id
      });
      
      console.log('Level progress update:', {
        completedLevelId: selectedLevel.id,
        performance: performance,
        updatedLevels: updatedLevels.map(l => ({
          id: l.id,
          title: l.title,
          isCompleted: l.isCompleted,
          isUnlocked: l.isUnlocked
        }))
      });
      
      setLevels(updatedLevels);
      await saveLevelProgress(updatedLevels);
      
      console.log('Leveled quiz performance saved successfully');
    } catch (error) {
      console.error('Error saving leveled quiz performance:', error);
    }
    
    // Close quiz and return to level selection
    setShowLeveledQuiz(false);
    setShowLevelSelection(true);
    setSelectedLevel(null);
  };

  const calculateAge = (dateOfBirth: string) => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  };

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="loading">Loading your dashboard...</div>
      </div>
    );
  }

  if (!childData) {
    return (
      <div className="dashboard-container">
        <div className="error-container">
          <h2>Access Denied</h2>
          <p>Please log in to access your dashboard.</p>
          <button onClick={() => navigate('/children-login')} className="login-button">
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  if (showQuiz) {
    return (
      <div className="children-dashboard">
        <header className="children-header">
          <div className="children-header-content">
            <h1>🧮 Math Quiz Time! 🎯</h1>
            <div className="children-user-info">
              <span className="children-welcome">Good luck, {childData?.firstName}! 🌟</span>
              <button onClick={() => setShowQuiz(false)} className="children-logout-btn">
                Back to Dashboard
              </button>
            </div>
          </div>
        </header>
        <main className="children-main">
          <MathQuiz onComplete={handleQuizComplete} />
        </main>
      </div>
    );
  }

  if (showInitialAssessment) {
    return (
      <div className="children-dashboard">
        <header className="children-header">
          <div className="children-header-content">
            <h1>🎯 Initial Assessment 🎯</h1>
            <div className="children-user-info">
              <span className="children-welcome">Let's see how you do, {childData?.firstName}! 🌟</span>
              <button onClick={() => setShowInitialAssessment(false)} className="children-logout-btn">
                Back to Dashboard
              </button>
            </div>
          </div>
        </header>
        <main className="children-main">
          <InitialAssessmentQuiz onComplete={handleAssessmentComplete} childId={childData?.id} />
        </main>
      </div>
    );
  }

  if (showLevelSelection) {
    return (
      <LevelSelection
        levels={levels}
        onLevelSelect={handleLevelSelect}
        onBack={handleBackToDashboard}
      />
    );
  }

  if (showLeveledQuiz && selectedLevel) {
    return (
      <LeveledMathQuiz
        level={selectedLevel}
        onComplete={handleLeveledQuizComplete}
        onBack={handleBackToLevels}
      />
    );
  }

  if (showLearningLibrary) {
    return (
      <LearningLibrary
        onBack={() => setShowLearningLibrary(false)}
      />
    );
  }

  if (showMiniGames) {
    return (
      <MiniGames
        onBack={() => setShowMiniGames(false)}
      />
    );
  }

  return (
    <div className="children-dashboard">
      {/* Animated Forest Animals */}
      <div className="forest-animals">
        {/* Small Forest Animals */}
        <div className="animal rabbit">🐰</div>
        <div className="animal squirrel">🐿️</div>
        <div className="animal butterfly">🦋</div>
        <div className="animal bird">🐦</div>
        <div className="animal bee">🐝</div>
        <div className="animal ladybug">🐞</div>
        <div className="animal caterpillar">🐛</div>
        <div className="animal parrot">🦜</div>
        <div className="animal owl">🦉</div>
        <div className="animal deer">🦌</div>
        <div className="animal fox">🦊</div>
        <div className="animal hedgehog">🦔</div>
        <div className="animal frog">🐸</div>
        
        {/* Large Peeking Animals */}
        <div className="animal lion-peek">🦁</div>
        <div className="animal bear-peek">🐻</div>
        <div className="animal elephant-peek">🐘</div>
        <div className="animal giraffe-peek">🦒</div>
        <div className="animal rhino-peek">🦏</div>
        <div className="animal hippo-peek">🦛</div>
        <div className="animal tiger-peek">🐅</div>
        <div className="animal panda-peek">🐼</div>
      </div>

      <header className="children-header">
        <div className="floating-emojis">
          <span className="floating-emoji emoji-1">🎈</span>
          <span className="floating-emoji emoji-2">⭐</span>
          <span className="floating-emoji emoji-3">🎨</span>
          <span className="floating-emoji emoji-4">🎪</span>
          <span className="floating-emoji emoji-5">🌈</span>
          <span className="floating-emoji emoji-6">🎭</span>
          <span className="floating-emoji emoji-7">🎯</span>
          <span className="floating-emoji emoji-8">🎲</span>
        </div>
        
        <div className="children-header-content">
          <div className="header-left">
            <div className="magical-logo">
              <div className="logo-sparkle sparkle-1">✨</div>
              <div className="logo-sparkle sparkle-2">✨</div>
              <div className="logo-sparkle sparkle-3">✨</div>
              <h1 className="magical-title">
                <span className="title-word word-1">🌟</span>
                <span className="title-word word-2">{t('quiz.mySuperCoolInfo')}</span>
                <span className="title-word word-3">🌟</span>
              </h1>
            </div>
          </div>
          
          <div className="children-user-info">
            <div className="welcome-bubble">
              <span className="bouncing-text">
                {t('common.welcome')}, {childData.firstName}! 
                <span className="celebration-emoji">🎉</span>
              </span>
            </div>
            <LanguageSelector />
            <button onClick={handleLogout} className="children-logout-btn">
              <span className="btn-emoji">🚪</span>
              {t('common.logout')}
            </button>
          </div>
        </div>
        
        <div className="header-decoration">
          <div className="rainbow-line"></div>
          <div className="bouncing-dots">
            <span className="dot dot-1"></span>
            <span className="dot dot-2"></span>
            <span className="dot dot-3"></span>
            <span className="dot dot-4"></span>
            <span className="dot dot-5"></span>
          </div>
        </div>
      </header>

      <main className="children-main">
        <div className="children-welcome-section">
          <h2>{t('common.welcome')} {childData.firstName} {childData.lastName}! 👋</h2>
          <p>{t('dashboard.welcome')} 🎮✨</p>
        </div>

        <div className="children-info-section">
          <h3>📋 {t('quiz.mySuperCoolInfo')}! 📋</h3>
          <div className="children-info-grid">
            <div className="children-info-item">
              <h4>👤 {t('common.myName')}</h4>
              <p>{childData.firstName} {childData.lastName}</p>
            </div>
            <div className="children-info-item">
              <h4>🔑 {t('common.myUsername')}</h4>
              <p>{childData.username}</p>
            </div>
            <div className="children-info-item">
              <h4>🎂 {t('common.myAge')}</h4>
              <p>{calculateAge(childData.dateOfBirth)} {t('common.yearsOld')}</p>
            </div>
            <div className="children-info-item">
              <h4>👦👧 {t('common.gender')}</h4>
              <p>{childData.gender.charAt(0).toUpperCase() + childData.gender.slice(1)}</p>
            </div>
            <div className="children-info-item">
              <h4>📚 {t('common.myGrade')}</h4>
              <p>{childData.grade || t('common.notSpecified')}</p>
            </div>
            <div className="children-info-item">
              <h4>🏫 {t('common.mySchool')}</h4>
              <p>{childData.school || t('common.notSpecified')}</p>
            </div>
            <div className="children-info-item">
              <h4>👩‍🏫 {t('common.myAwesomeTeacher')}</h4>
              <p>{childData.assignedTeacherName || t('common.notAssigned')}</p>
            </div>
            <div className="children-info-item">
              <h4>📞 {t('common.emergencyContact')}</h4>
              <p>{childData.emergencyContact || t('common.notProvided')}</p>
            </div>
            {childData.allergies && (
              <div className="children-info-item">
                <h4>⚠️ {t('common.myAllergies')}</h4>
                <p>{childData.allergies}</p>
              </div>
            )}
            {childData.medicalInfo && (
              <div className="children-info-item">
                <h4>🏥 {t('common.medicalInfo')}</h4>
                <p>{childData.medicalInfo}</p>
              </div>
            )}
          </div>
        </div>

        {/* Math Quizzes Section */}
        <div className="children-quiz-section">
          <h3>🎯 {t('quiz.mathAdventures')}! 🎯</h3>
          <div className="children-quiz-grid">
            {!hasCompletedAssessment ? (
              <div className="children-activity-card children-quiz-card">
                <h4>🎯 {t('quiz.startAssessment')}! 🎯</h4>
                <p>{t('quiz.startAssessment')} 🌟</p>
                <div className="assessment-info">
                  <div className="info-item">
                    <span className="info-icon">📝</span>
                    <span className="info-text">{t('quiz.mixedQuestions')}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-icon">⏱️</span>
                    <span className="info-text">{t('quiz.timeLimit')}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-icon">🎯</span>
                    <span className="info-text">{t('quiz.allDifficultyLevels')}</span>
                  </div>
                </div>
                <button className="children-action-btn children-quiz-btn" onClick={handleStartInitialAssessment}>
                  🚀 {t('quiz.startAssessment')}! 🚀
                </button>
              </div>
            ) : (
              <>
                <div className="children-activity-card children-quiz-card">
                  <h4>🎮 {t('quiz.mathAdventureLevels')}! 🎯</h4>
                  <p>{t('quiz.continueMathJourney')} 🌟</p>
                  {performanceCategory && (
                    <div className="performance-category-info">
                      <div className="category-badge" style={{ backgroundColor: performanceCategory.color }}>
                        <span className="category-emoji">{performanceCategory.emoji}</span>
                        <span className="category-text">{performanceCategory.name}</span>
                      </div>
                      <p className="category-description">{performanceCategory.description}</p>
                    </div>
                  )}
                  <div className="level-progress-summary">
                    <div className="progress-item">
                      <span className="progress-icon">🏆</span>
                      <span className="progress-text">{t('quiz.levels')}: {getCompletedLevels(levels)}/{levels.length}</span>
                    </div>
                    <div className="progress-item">
                      <span className="progress-icon">⭐</span>
                      <span className="progress-text">{t('quiz.points')}: {getTotalPoints(levels)}</span>
                    </div>
                  </div>
                  <button 
                    className="children-action-btn children-quiz-btn" 
                    onClick={() => {
                      console.log('Continue Adventure clicked!');
                      console.log('hasCompletedAssessment:', hasCompletedAssessment);
                      console.log('levels:', levels);
                      console.log('levels.length:', levels.length);
                      console.log('performanceCategory:', performanceCategory);
                      handleStartLeveledQuiz();
                    }}
                  >
                    🚀 Continue Adventure! 🚀
                  </button>
                </div>
                
                <div className="children-activity-card">
                  <h4>🧮 Quick Math Quiz 🎯</h4>
                  <p>Take a quick practice quiz to warm up your math skills! Perfect for a quick challenge! ⚡</p>
                  <button className="children-action-btn" onClick={handleStartQuiz}>
                    🏃‍♂️ Quick Quiz! 🏃‍♂️
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Other Activities Section */}
        <div className="children-activities-section">
          <h3>🎮 {t('quiz.mySuperFunActivities')}! 🎮</h3>
          <div className="children-activities-grid">
            <div className="children-activity-card">
              <h4>📚 {t('navigation.learningLibrary')} 📖</h4>
              <p>{t('navigation.learningLibrary')} 📚✨</p>
              <button className="children-action-btn" onClick={() => setShowLearningLibrary(true)}>
                🎬 {t('common.start')} {t('navigation.learningLibrary')}! 🎬
              </button>
            </div>
            <div className="children-activity-card">
              <h4>🎮 {t('navigation.miniGames')} 🎯</h4>
              <p>{t('navigation.miniGames')} 🎪</p>
              <button className="children-action-btn" onClick={() => setShowMiniGames(true)}>
                🎮 {t('common.start')} {t('navigation.miniGames')}! 🎮
              </button>
            </div>
            <div className="children-activity-card">
              <h4>💬 {t('navigation.chatWithFriends')} 💬</h4>
              <p>{t('navigation.chatWithFriends')} 💌</p>
              <button className="children-action-btn" disabled>Coming Soon! 🚧</button>
            </div>
            <div className="children-activity-card">
              <h4>🎯 {t('navigation.myGoals')} 🎯</h4>
              <p>{t('navigation.myGoals')} 🌟</p>
              <button className="children-action-btn" disabled>Coming Soon! 🚧</button>
            </div>
          </div>
        </div>

        {/* Show View Photos button only after assessment completion */}
        {hasCompletedAssessment && (
          <div className="children-photos-section">
            <div className="children-photos-card">
              <h4>📸 {t('quiz.myQuizPhotos')} 📸</h4>
              <p>View photos captured during your assessment! 📷✨</p>
              <button 
                className="children-action-btn photos-btn" 
                onClick={() => setShowImageGallery(true)}
              >
                📸 {t('quiz.viewMyPhotos')}! 📸
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Image Gallery Modal */}
      <CapturedImagesGallery
        isOpen={showImageGallery}
        onClose={() => setShowImageGallery(false)}
        childId={childData?.id || ''}
      />
      
      {/* Debug info - remove in production */}
      {process.env.NODE_ENV === 'development' && (
        <div style={{ position: 'fixed', bottom: '10px', right: '10px', background: 'rgba(0,0,0,0.8)', color: 'white', padding: '10px', borderRadius: '5px', fontSize: '12px', zIndex: 9999 }}>
          <div>Child ID: {childData?.id || 'No ID'}</div>
          <div>Assessment Completed: {hasCompletedAssessment ? 'Yes' : 'No'}</div>
        </div>
      )}
    </div>
  );
};

export default ChildrenDashboard;
