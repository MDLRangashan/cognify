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
  studentId: string;
  studentName: string;
  quizType: string;
  level: string;
  score: number;
  totalQuestions: number;
  accuracy: number;
  timeSpent: number;
  timestamp: any;
  performanceLevel: string;
  detailedAnswers?: any[];
}

interface ParentAnalyticsProps {
  children: Child[];
}

const ParentAnalytics: React.FC<ParentAnalyticsProps> = ({ children }) => {
  const [quizResults, setQuizResults] = useState<QuizResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'all'>('month');
  const [selectedChild, setSelectedChild] = useState<string>('all');

  // Fetch quiz results for children
  useEffect(() => {
    const fetchQuizResults = async () => {
      if (!children || children.length === 0) {
        setLoading(false);
        return;
      }

      try {
        const childIds = children.map(child => child.id);
        const quizResultsRef = collection(db, 'quizResults');
        
        let dateFilter;
        const now = new Date();
        if (timeRange === 'week') {
          dateFilter = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        } else if (timeRange === 'month') {
          dateFilter = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        }

        let q = query(
          quizResultsRef,
          where('studentId', 'in', childIds),
          orderBy('timestamp', 'desc')
        );

        if (dateFilter) {
          q = query(
            quizResultsRef,
            where('studentId', 'in', childIds),
            where('timestamp', '>=', dateFilter),
            orderBy('timestamp', 'desc')
          );
        }

        const snapshot = await getDocs(q);
        const results: QuizResult[] = [];
        
        snapshot.forEach((doc) => {
          const data = doc.data();
          results.push({
            id: doc.id,
            studentId: data.studentId,
            studentName: data.studentName,
            quizType: data.quizType || 'Unknown',
            level: data.level || 'Unknown',
            score: data.score || 0,
            totalQuestions: data.totalQuestions || 0,
            accuracy: data.accuracy || 0,
            timeSpent: data.timeSpent || 0,
            timestamp: data.timestamp,
            performanceLevel: data.performanceLevel || 'Unknown',
            detailedAnswers: data.detailedAnswers || []
          });
        });

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
    if (!children || children.length === 0) {
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
      : quizResults.filter(result => result.studentId === selectedChild);

    const selectedChildData = selectedChild === 'all' ? children : children.filter(c => c.id === selectedChild);

    // Basic stats
    const totalChildren = selectedChildData.length;
    const totalQuizzes = filteredResults.length;
    const averageScore = totalQuizzes > 0 
      ? filteredResults.reduce((sum, result) => sum + result.accuracy, 0) / totalQuizzes 
      : 0;

    // Child progress data
    const childProgress = selectedChildData.map(child => {
      const childQuizzes = filteredResults.filter(result => result.studentId === child.id);
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
          ? childQuizzes[0].timestamp?.toDate?.()?.toLocaleDateString() || 'Never'
          : 'Never',
        performanceLevel: child.performanceLevel || 'Unknown'
      };
    });

    // Performance distribution
    const performanceDistribution = [
      { name: 'High Performers', value: selectedChildData.filter(c => c.performanceLevel === 'High').length, color: '#10B981' },
      { name: 'Middle Performers', value: selectedChildData.filter(c => c.performanceLevel === 'Middle').length, color: '#F59E0B' },
      { name: 'Low Performers', value: selectedChildData.filter(c => c.performanceLevel === 'Low').length, color: '#EF4444' }
    ];

    // Quiz activity over time (last 7 days)
    const quizActivity = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const dayQuizzes = filteredResults.filter(result => {
        const resultDate = result.timestamp?.toDate?.() || new Date(result.timestamp);
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
        result.quizType?.toLowerCase().includes(subject.toLowerCase()) ||
        result.level?.toLowerCase().includes(subject.toLowerCase())
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
        childName: result.studentName,
        quizType: result.quizType,
        score: result.accuracy,
        date: result.timestamp?.toDate?.()?.toLocaleDateString() || 'Unknown'
      }));

    return {
      totalChildren,
      totalQuizzes,
      averageScore: Math.round(averageScore),
      childProgress,
      performanceDistribution,
      quizActivity,
      subjectPerformance,
      recentAchievements
    };
  };

  const analyticsData = getAnalyticsData();

  if (loading) {
    return (
      <div className="parent-analytics">
        <div className="analytics-loading">
          <div className="loading-spinner"></div>
          <p>Loading your children's progress...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="parent-analytics">
      <div className="analytics-header">
        <h2>Children's Progress Analytics</h2>
        <div className="header-controls">
          <div className="child-selector">
            <label>View:</label>
            <select 
              value={selectedChild} 
              onChange={(e) => setSelectedChild(e.target.value)}
              className="child-select"
            >
              <option value="all">All Children</option>
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
              Last Week
            </button>
            <button 
              className={timeRange === 'month' ? 'active' : ''} 
              onClick={() => setTimeRange('month')}
            >
              Last Month
            </button>
            <button 
              className={timeRange === 'all' ? 'active' : ''} 
              onClick={() => setTimeRange('all')}
            >
              All Time
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
            <p>{analyticsData.totalChildren === 1 ? 'Child' : 'Children'}</p>
          </div>
        </div>
        <div className="overview-card">
          <div className="card-icon">📚</div>
          <div className="card-content">
            <h3>{analyticsData.totalQuizzes}</h3>
            <p>Total Quizzes</p>
          </div>
        </div>
        <div className="overview-card">
          <div className="card-icon">🎯</div>
          <div className="card-content">
            <h3>{analyticsData.averageScore}%</h3>
            <p>Average Score</p>
          </div>
        </div>
        <div className="overview-card">
          <div className="card-icon">📈</div>
          <div className="card-content">
            <h3>{analyticsData.quizActivity[analyticsData.quizActivity.length - 1]?.quizzes || 0}</h3>
            <p>Today's Activity</p>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="analytics-charts">
        {/* Child Progress Overview */}
        <div className="chart-container full-width">
          <h3>📊 {selectedChild === 'all' ? 'All Children' : 'Child'} Progress Overview</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analyticsData.childProgress}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="quizzes" fill="#3B82F6" name="Total Quizzes" />
              <Bar dataKey="averageScore" fill="#10B981" name="Average Score %" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Performance Distribution */}
        <div className="chart-container">
          <h3>🎯 Performance Level</h3>
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
          <h3>📅 Activity Trend (Last 7 Days)</h3>
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
                name="Quizzes"
              />
              <Area 
                type="monotone" 
                dataKey="averageScore" 
                stackId="2" 
                stroke="#10B981" 
                fill="#10B981" 
                name="Avg Score %"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Subject Performance */}
        {analyticsData.subjectPerformance.length > 0 && (
          <div className="chart-container full-width">
            <h3>📖 Subject Performance</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analyticsData.subjectPerformance}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="subject" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="averageScore" fill="#8B5CF6" name="Average Score %" />
                <Bar dataKey="quizCount" fill="#F59E0B" name="Quiz Count" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Child Details and Achievements */}
      <div className="analytics-details">
        <div className="child-details">
          <h3>👶 Child Details</h3>
          <div className="child-cards">
            {analyticsData.childProgress.map((child, index) => (
              <div key={index} className="child-card">
                <div className="child-header">
                  <h4>{child.name}</h4>
                  <span className={`performance-badge ${child.performanceLevel?.toLowerCase()}`}>
                    {child.performanceLevel} Performer
                  </span>
                </div>
                <div className="child-stats">
                  <div className="stat">
                    <span className="stat-label">Age:</span>
                    <span className="stat-value">{child.age} years</span>
                  </div>
                  <div className="stat">
                    <span className="stat-label">Teacher:</span>
                    <span className="stat-value">{child.teacher}</span>
                  </div>
                  <div className="stat">
                    <span className="stat-label">Quizzes:</span>
                    <span className="stat-value">{child.quizzes}</span>
                  </div>
                  <div className="stat">
                    <span className="stat-label">Average Score:</span>
                    <span className="stat-value">{child.averageScore}%</span>
                  </div>
                  <div className="stat">
                    <span className="stat-label">Improvement:</span>
                    <span className={`stat-value ${child.improvement >= 0 ? 'positive' : 'negative'}`}>
                      {child.improvement >= 0 ? '+' : ''}{child.improvement}%
                    </span>
                  </div>
                  <div className="stat">
                    <span className="stat-label">Last Quiz:</span>
                    <span className="stat-value">{child.lastQuiz}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="recent-achievements">
          <h3>🏆 Recent Achievements</h3>
          <div className="achievements-list">
            {analyticsData.recentAchievements.length > 0 ? (
              analyticsData.recentAchievements.map((achievement, index) => (
                <div key={index} className="achievement-item">
                  <div className="achievement-icon">🎉</div>
                  <div className="achievement-content">
                    <div className="achievement-text">
                      <strong>{achievement.childName}</strong> scored {achievement.score}% in {achievement.quizType}
                    </div>
                    <div className="achievement-date">{achievement.date}</div>
                  </div>
                </div>
              ))
            ) : (
              <p className="no-achievements">No recent achievements yet. Keep encouraging your children! 💪</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ParentAnalytics;
