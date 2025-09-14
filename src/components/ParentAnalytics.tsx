import React, { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart
} from 'recharts';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../config/firebaseConfig';
import { useLanguage } from '../contexts/LanguageContext';
import './ParentAnalytics.css';

interface Child {
  id: string;
  firstName: string;
  lastName: string;
  age: number;
  school: string;
  assignedTeacherId: string;
  assignedTeacherName: string;
  performanceLevel?: 'High' | 'Middle' | 'Low';
}

interface QuizResult {
  id: string;
  childId: string;
  childName: string;
  category: string;
  levelName: string;
  score: number;
  totalQuestions: number;
  accuracy: number;
  timeTaken: number;
  completedAt: Date;
  levelId?: number;
  levelDifficulty?: string;
  detailedAnswers?: any[];
}

interface ParentAnalyticsProps {
  children: Child[];
}

const ParentAnalytics: React.FC<ParentAnalyticsProps> = ({ children }) => {
  const { t } = useLanguage();
  const [quizResults, setQuizResults] = useState<QuizResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'all'>('month');
  const [selectedChild, setSelectedChild] = useState<string>('all');

  // Fetch quiz results for children
  useEffect(() => {
    const fetchQuizResults = async () => {
      console.log('=== PARENT ANALYTICS DEBUG ===');
      console.log('Children data received:', children);
      console.log('Children count:', children?.length);
      
      if (!children || children.length === 0) {
        console.log('No children data, setting loading to false');
        setLoading(false);
        return;
      }

      try {
        const childIds = children.map(child => child.id);
        console.log('Child IDs for query:', childIds);
        console.log('Children data structure:', children);
        
        // If no child IDs, return early
        if (childIds.length === 0) {
          console.log('No child IDs found, returning empty results');
          setQuizResults([]);
          setLoading(false);
          return;
        }
        
        const performanceRef = collection(db, 'childrenPerformance');
        
        let dateFilter: Date | undefined;
        const now = new Date();
        if (timeRange === 'week') {
          dateFilter = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        } else if (timeRange === 'month') {
          dateFilter = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        }

        // Use a simpler approach to avoid Firebase index requirements
        // Get all performance data and filter in memory
        let q = query(performanceRef);
        
        // If we have a date filter, we can still use it
        if (dateFilter) {
          q = query(
            performanceRef,
            where('completedAt', '>=', dateFilter)
          );
        }

        const snapshot = await getDocs(q);
        console.log('Firebase query snapshot size:', snapshot.size);
        const results: QuizResult[] = [];
        
        snapshot.forEach((doc) => {
          const data = doc.data();
          console.log('Document data:', doc.id, data);
          
          // Check if this document belongs to one of our children
          if (!childIds.includes(data.childId)) {
            console.log('Skipping document for different child:', data.childId);
            return;
          }
          
          // Apply date filter if needed (in case we couldn't use it in the query)
          if (dateFilter && data.completedAt) {
            const completedDate = data.completedAt.toDate ? data.completedAt.toDate() : new Date(data.completedAt);
            if (completedDate < dateFilter) {
              console.log('Skipping document due to date filter:', completedDate);
              return;
            }
          }
          
          // Only include quizzes that have detailed answers (completed quizzes)
          if (data.detailedAnswers && data.detailedAnswers.length > 0) {
            console.log('Adding quiz result:', data.childName, data.category);
            results.push({
              id: doc.id,
              childId: data.childId,
              childName: data.childName,
              category: data.category || 'Unknown',
              levelName: data.levelName || 'Unknown',
              score: data.score || 0,
              totalQuestions: data.totalQuestions || 0,
              accuracy: data.accuracy || 0,
              timeTaken: data.timeTaken || 0,
              completedAt: data.completedAt?.toDate() || new Date(),
              levelId: data.levelId,
              levelDifficulty: data.levelDifficulty,
              detailedAnswers: data.detailedAnswers || []
            });
          } else {
            console.log('Skipping quiz without detailed answers:', doc.id);
          }
        });
        
        // Sort results by completedAt date (most recent first)
        results.sort((a, b) => b.completedAt.getTime() - a.completedAt.getTime());

        console.log('Fetched quiz results:', results.length, 'quizzes');
        console.log('Quiz results data:', results);
        setQuizResults(results);
      } catch (error) {
        console.error('Error fetching quiz results:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchQuizResults();
  }, [children, timeRange]);

  // Calculate analytics data
  const getAnalyticsData = () => {
    console.log('=== ANALYTICS DATA CALCULATION ===');
    console.log('Children in calculation:', children);
    console.log('Quiz results in calculation:', quizResults);
    
    if (!children || children.length === 0) {
      console.log('No children data, returning empty analytics');
      return {
        totalChildren: 0,
        totalQuizzes: 0,
        averageScore: 0,
        childProgress: [],
        performanceDistribution: [],
        quizActivity: [],
        subjectPerformance: [],
        recentAchievements: []
      };
    }

    // Filter results by selected child
    const filteredResults = selectedChild === 'all' 
      ? quizResults 
      : quizResults.filter(result => result.childId === selectedChild);

    const selectedChildData = selectedChild === 'all' ? children : children.filter(c => c.id === selectedChild);

    // Basic stats
    const totalChildren = selectedChildData.length;
    const totalQuizzes = filteredResults.length;
    const averageScore = totalQuizzes > 0 
      ? filteredResults.reduce((sum, result) => sum + result.accuracy, 0) / totalQuizzes 
      : 0;

    // Child progress data
    const childProgress = selectedChildData.map(child => {
      const childQuizzes = filteredResults.filter(result => result.childId === child.id);
      const recentQuizzes = childQuizzes.slice(0, 10); // Last 10 quizzes
      const averageAccuracy = recentQuizzes.length > 0
        ? recentQuizzes.reduce((sum, q) => sum + q.accuracy, 0) / recentQuizzes.length
        : 0;

      // Calculate improvement trend
      const firstHalf = recentQuizzes.slice(0, Math.ceil(recentQuizzes.length / 2));
      const secondHalf = recentQuizzes.slice(Math.ceil(recentQuizzes.length / 2));
      
      const firstHalfAvg = firstHalf.length > 0 
        ? firstHalf.reduce((sum, q) => sum + q.accuracy, 0) / firstHalf.length 
        : 0;
      const secondHalfAvg = secondHalf.length > 0 
        ? secondHalf.reduce((sum, q) => sum + q.accuracy, 0) / secondHalf.length 
        : 0;
      
      const improvement = secondHalfAvg - firstHalfAvg;

      return {
        name: `${child.firstName} ${child.lastName}`,
        age: child.age,
        teacher: child.assignedTeacherName,
        quizzes: childQuizzes.length,
        averageScore: Math.round(averageAccuracy),
        improvement: Math.round(improvement),
        lastQuiz: childQuizzes.length > 0 
          ? childQuizzes[0].completedAt?.toLocaleDateString() || t('analytics.never')
          : t('analytics.never'),
        performanceLevel: child.performanceLevel || 'Unknown'
      };
    });

    // Performance distribution
    const performanceDistribution = [
      { name: t('analytics.highPerformers'), value: selectedChildData.filter(c => c.performanceLevel === 'High').length, color: '#10B981' },
      { name: t('analytics.middlePerformers'), value: selectedChildData.filter(c => c.performanceLevel === 'Middle').length, color: '#F59E0B' },
      { name: t('analytics.lowPerformers'), value: selectedChildData.filter(c => c.performanceLevel === 'Low').length, color: '#EF4444' }
    ];

    // Quiz activity over time (last 7 days)
    const quizActivity = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const dayQuizzes = filteredResults.filter(result => {
        const resultDate = result.completedAt;
        return resultDate.toISOString().split('T')[0] === dateStr;
      });

      quizActivity.push({
        date: date.toLocaleDateString('en-US', { weekday: 'short' }),
        quizzes: dayQuizzes.length,
        averageScore: dayQuizzes.length > 0 
          ? dayQuizzes.reduce((sum, q) => sum + q.accuracy, 0) / dayQuizzes.length 
          : 0
      });
    }

    // Subject performance analysis
    const subjectPerformance: { subject: string; averageScore: number; quizCount: number }[] = [];
    const subjects = ['Addition', 'Subtraction', 'Multiplication', 'Division', 'Fractions', 'Decimals'];
    
    subjects.forEach(subject => {
      const subjectQuizzes = filteredResults.filter(result => 
        result.category?.toLowerCase().includes(subject.toLowerCase()) ||
        result.levelName?.toLowerCase().includes(subject.toLowerCase())
      );
      
      if (subjectQuizzes.length > 0) {
        const avgScore = subjectQuizzes.reduce((sum, q) => sum + q.accuracy, 0) / subjectQuizzes.length;
        subjectPerformance.push({
          subject,
          averageScore: Math.round(avgScore),
          quizCount: subjectQuizzes.length
        });
      }
    });

    // Recent achievements (high scores)
    const recentAchievements = filteredResults
      .filter(result => result.accuracy >= 80)
      .slice(0, 5)
      .map(result => ({
        childName: result.childName,
        quizType: result.category,
        score: result.accuracy,
        date: result.completedAt?.toLocaleDateString() || 'Unknown'
      }));

    const finalData = {
      totalChildren,
      totalQuizzes,
      averageScore: Math.round(averageScore),
      childProgress,
      performanceDistribution,
      quizActivity,
      subjectPerformance,
      recentAchievements
    };
    
    console.log('Final analytics data:', finalData);
    return finalData;
  };

  const analyticsData = getAnalyticsData();

  if (loading) {
      return (
        <div className="parent-analytics">
          <div className="analytics-loading-simple">
            <p>{t('analytics.loadingMessage')}</p>
          </div>
        </div>
      );
  }

  return (
    <div className="parent-analytics">
      <div className="analytics-header">
        <h2>{t('analytics.title')}</h2>
        <div className="header-controls">
          <div className="child-selector">
            <label>{t('analytics.view')}</label>
            <select 
              value={selectedChild} 
              onChange={(e) => setSelectedChild(e.target.value)}
              className="child-select"
            >
              <option value="all">{t('analytics.allChildren')}</option>
              {children.map(child => (
                <option key={child.id} value={child.id}>
                  {child.firstName} {child.lastName}
                </option>
              ))}
            </select>
          </div>
          <div className="time-range-selector">
            <button 
              className={timeRange === 'week' ? 'active' : ''} 
              onClick={() => setTimeRange('week')}
            >
              {t('analytics.lastWeek')}
            </button>
            <button 
              className={timeRange === 'month' ? 'active' : ''} 
              onClick={() => setTimeRange('month')}
            >
              {t('analytics.lastMonth')}
            </button>
            <button 
              className={timeRange === 'all' ? 'active' : ''} 
              onClick={() => setTimeRange('all')}
            >
              {t('analytics.allTime')}
            </button>
          </div>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="analytics-overview">
        <div className="overview-card">
          <div className="card-icon">👶</div>
          <div className="card-content">
            <h3>{analyticsData.totalChildren}</h3>
            <p>{analyticsData.totalChildren === 1 ? t('analytics.child') : t('analytics.children')}</p>
          </div>
        </div>
        <div className="overview-card">
          <div className="card-icon">📚</div>
          <div className="card-content">
            <h3>{analyticsData.totalQuizzes}</h3>
            <p>{t('analytics.totalQuizzes')}</p>
          </div>
        </div>
        <div className="overview-card">
          <div className="card-icon">🎯</div>
          <div className="card-content">
            <h3>{analyticsData.averageScore}%</h3>
            <p>{t('analytics.averageScore')}</p>
          </div>
        </div>
        <div className="overview-card">
          <div className="card-icon">📈</div>
          <div className="card-content">
            <h3>{analyticsData.quizActivity[analyticsData.quizActivity.length - 1]?.quizzes || 0}</h3>
            <p>{t('analytics.todaysActivity')}</p>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="analytics-charts">
        {/* Child Progress Overview */}
        <div className="chart-container full-width">
          <h3>📊 {selectedChild === 'all' ? t('analytics.allChildren') : t('analytics.child')} {t('analytics.progressOverview')}</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analyticsData.childProgress}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="quizzes" fill="#3B82F6" name={t('analytics.totalQuizzes')} />
              <Bar dataKey="averageScore" fill="#10B981" name={t('analytics.averageScorePercent')} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Performance Distribution */}
        <div className="chart-container">
          <h3>🎯 {t('analytics.performanceLevel')}</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={analyticsData.performanceDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {analyticsData.performanceDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Quiz Activity Over Time */}
        <div className="chart-container">
          <h3>📅 {t('analytics.activityTrend')}</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={analyticsData.quizActivity}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Area 
                type="monotone" 
                dataKey="quizzes" 
                stackId="1" 
                stroke="#3B82F6" 
                fill="#3B82F6" 
                name={t('analytics.quizzes')}
              />
              <Area 
                type="monotone" 
                dataKey="averageScore" 
                stackId="2" 
                stroke="#10B981" 
                fill="#10B981" 
                name={t('analytics.averageScorePercent')}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Subject Performance */}
        {analyticsData.subjectPerformance.length > 0 && (
          <div className="chart-container full-width">
            <h3>📖 {t('analytics.subjectPerformance')}</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analyticsData.subjectPerformance}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="subject" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="averageScore" fill="#8B5CF6" name={t('analytics.averageScorePercent')} />
                <Bar dataKey="quizCount" fill="#F59E0B" name={t('analytics.quizzes')} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Child Details and Achievements */}
      <div className="analytics-details">
        <div className="child-details">
          <h3>👶 {t('analytics.childDetails')}</h3>
          <div className="child-cards">
            {analyticsData.childProgress.map((child, index) => (
              <div key={index} className="child-card">
                <div className="child-header">
                  <h4>{child.name}</h4>
                  <span className={`performance-badge ${child.performanceLevel?.toLowerCase()}`}>
                    {child.performanceLevel} {t('analytics.performer')}
                  </span>
                </div>
                <div className="child-stats">
                  <div className="stat">
                    <span className="stat-label">{t('common.age')}:</span>
                    <span className="stat-value">{child.age} {t('common.years')}</span>
                  </div>
                  <div className="stat">
                    <span className="stat-label">{t('analytics.teacher')}:</span>
                    <span className="stat-value">{child.teacher}</span>
                  </div>
                  <div className="stat">
                    <span className="stat-label">{t('analytics.quizzes')}:</span>
                    <span className="stat-value">{child.quizzes}</span>
                  </div>
                  <div className="stat">
                    <span className="stat-label">{t('analytics.averageScore')}:</span>
                    <span className="stat-value">{child.averageScore}%</span>
                  </div>
                  <div className="stat">
                    <span className="stat-label">{t('analytics.improvement')}:</span>
                    <span className={`stat-value ${child.improvement >= 0 ? 'positive' : 'negative'}`}>
                      {child.improvement >= 0 ? '+' : ''}{child.improvement}%
                    </span>
                  </div>
                  <div className="stat">
                    <span className="stat-label">{t('analytics.lastQuiz')}:</span>
                    <span className="stat-value">{child.lastQuiz}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="recent-achievements">
          <h3>🏆 {t('analytics.recentAchievements')}</h3>
          <div className="achievements-list">
            {analyticsData.recentAchievements.length > 0 ? (
              analyticsData.recentAchievements.map((achievement, index) => (
                <div key={index} className="achievement-item">
                  <div className="achievement-icon">🎉</div>
                  <div className="achievement-content">
                    <div className="achievement-text">
                      <strong>{achievement.childName}</strong> {t('analytics.scored')} {achievement.score}% {t('analytics.in')} {achievement.quizType}
                    </div>
                    <div className="achievement-date">{achievement.date}</div>
                  </div>
                </div>
              ))
            ) : (
              <p className="no-achievements">{t('analytics.noAchievementsYet')}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ParentAnalytics;
