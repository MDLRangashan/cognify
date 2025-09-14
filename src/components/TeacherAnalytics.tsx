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
import './TeacherAnalytics.css';

interface Student {
  id: string;
  firstName: string;
  lastName: string;
  assignedTeacherId: string;
  assignedTeacherName: string;
  performanceLevel?: 'High' | 'Middle' | 'Low';
  totalQuizzes?: number;
  averageScore?: number;
  lastQuizDate?: string;
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

interface TeacherAnalyticsProps {
  assignedStudents: Student[];
}

const TeacherAnalytics: React.FC<TeacherAnalyticsProps> = ({ assignedStudents }) => {
  const [quizResults, setQuizResults] = useState<QuizResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'all'>('month');

  // Fetch quiz results for assigned students
  useEffect(() => {
    const fetchQuizResults = async () => {
      console.log('=== TEACHER ANALYTICS DEBUG ===');
      console.log('Assigned students:', assignedStudents);
      console.log('Students count:', assignedStudents?.length);
      
      if (!assignedStudents || assignedStudents.length === 0) {
        console.log('No assigned students, setting loading to false');
        setLoading(false);
        return;
      }

      try {
        const studentIds = assignedStudents.map(student => student.id);
        console.log('Student IDs for query:', studentIds);
        
        // If no student IDs, return early
        if (studentIds.length === 0) {
          console.log('No student IDs found, returning empty results');
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
          
          // Check if this document belongs to one of our students
          if (!studentIds.includes(data.childId)) {
            console.log('Skipping document for different student:', data.childId);
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
  }, [assignedStudents, timeRange]);

  // Calculate analytics data
  const getAnalyticsData = () => {
    if (!assignedStudents || assignedStudents.length === 0) {
      return {
        studentCount: 0,
        totalQuizzes: 0,
        averageScore: 0,
        performanceDistribution: [],
        quizActivity: [],
        studentProgress: [],
        topPerformers: [],
        strugglingStudents: []
      };
    }

    // Student count
    const studentCount = assignedStudents.length;

    // Total quizzes and average score
    const totalQuizzes = quizResults.length;
    const averageScore = totalQuizzes > 0 
      ? quizResults.reduce((sum, result) => sum + result.accuracy, 0) / totalQuizzes 
      : 0;

    // Performance distribution
    const performanceDistribution = [
      { name: 'High Performers', value: assignedStudents.filter(s => s.performanceLevel === 'High').length, color: '#10B981' },
      { name: 'Middle Performers', value: assignedStudents.filter(s => s.performanceLevel === 'Middle').length, color: '#F59E0B' },
      { name: 'Low Performers', value: assignedStudents.filter(s => s.performanceLevel === 'Low').length, color: '#EF4444' }
    ];

    // Quiz activity over time (last 7 days)
    const quizActivity = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const dayQuizzes = quizResults.filter(result => {
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

    // Student progress (individual student performance)
    const studentProgress = assignedStudents.map(student => {
      const studentQuizzes = quizResults.filter(result => result.childId === student.id);
      const recentQuizzes = studentQuizzes.slice(0, 5); // Last 5 quizzes
      const averageAccuracy = recentQuizzes.length > 0
        ? recentQuizzes.reduce((sum, q) => sum + q.accuracy, 0) / recentQuizzes.length
        : 0;

      return {
        name: `${student.firstName} ${student.lastName}`,
        quizzes: studentQuizzes.length,
        averageScore: Math.round(averageAccuracy),
        lastQuiz: studentQuizzes.length > 0 
          ? studentQuizzes[0].completedAt?.toLocaleDateString() || 'Never'
          : 'Never'
      };
    });

    // Top performers (students with highest average scores)
    const topPerformers = studentProgress
      .filter(s => s.quizzes > 0)
      .sort((a, b) => b.averageScore - a.averageScore)
      .slice(0, 3);

    // Struggling students (students with low scores or no recent activity)
    const strugglingStudents = studentProgress
      .filter(s => s.averageScore < 60 || s.quizzes === 0)
      .sort((a, b) => a.averageScore - b.averageScore);

    return {
      studentCount,
      totalQuizzes,
      averageScore: Math.round(averageScore),
      performanceDistribution,
      quizActivity,
      studentProgress,
      topPerformers,
      strugglingStudents
    };
  };

  const analyticsData = getAnalyticsData();

  if (loading) {
    return (
      <div className="teacher-analytics">
        <div className="analytics-loading-simple">
          <p>Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="teacher-analytics">
      <div className="analytics-header">
        <h2>Student Analytics</h2>
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

      {/* Overview Cards */}
      <div className="analytics-overview">
        <div className="overview-card">
          <div className="card-icon">👥</div>
          <div className="card-content">
            <h3>{analyticsData.studentCount}</h3>
            <p>Assigned Students</p>
          </div>
        </div>
        <div className="overview-card">
          <div className="card-icon">📊</div>
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
            <p>Today's Quizzes</p>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="analytics-charts">
        {/* Performance Distribution */}
        <div className="chart-container">
          <h3>Performance Distribution</h3>
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
          <h3>Quiz Activity (Last 7 Days)</h3>
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

        {/* Student Performance Comparison */}
        <div className="chart-container full-width">
          <h3>Student Performance Overview</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analyticsData.studentProgress}>
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
      </div>

      {/* Top Performers and Struggling Students */}
      <div className="analytics-lists">
        <div className="list-container">
          <h3>🏆 Top Performers</h3>
          <div className="student-list">
            {analyticsData.topPerformers.length > 0 ? (
              analyticsData.topPerformers.map((student, index) => (
                <div key={index} className="student-item top-performer">
                  <div className="student-rank">#{index + 1}</div>
                  <div className="student-info">
                    <div className="student-name">{student.name}</div>
                    <div className="student-stats">
                      {student.averageScore}% avg • {student.quizzes} quizzes
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="no-data">No quiz data available</p>
            )}
          </div>
        </div>

        <div className="list-container">
          <h3>⚠️ Students Needing Attention</h3>
          <div className="student-list">
            {analyticsData.strugglingStudents.length > 0 ? (
              analyticsData.strugglingStudents.map((student, index) => (
                <div key={index} className="student-item struggling">
                  <div className="student-info">
                    <div className="student-name">{student.name}</div>
                    <div className="student-stats">
                      {student.averageScore}% avg • {student.quizzes} quizzes
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="no-data">All students are performing well! 🎉</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherAnalytics;
