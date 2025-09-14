import React, { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import './StudentPerformanceReport.css';
import { db } from '../config/firebaseConfig';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Extend jsPDF type to include autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
    lastAutoTable: {
      finalY: number;
    };
  }
}

interface PerformanceData {
  id: string;
  childId: string;
  childName: string;
  score: number;
  totalQuestions: number;
  accuracy: number;
  timeTaken: number;
  category: string;
  completedAt: Date;
  levelId?: number;
  levelName?: string;
  detailedAnswers?: Array<{
    questionId: number;
    answer: number;
    isCorrect: boolean;
    operation: string;
    difficulty: string;
    timeTaken: number;
    questionText: string;
    correctAnswer: number;
  }>;
  levelDifficulty?: string;
}

interface LevelProgress {
  childId: string;
  childName: string;
  performanceCategory: {
    id: string;
    name: string;
    emoji: string;
    color: string;
  };
  levels: Array<{
    id: number;
    name: string;
    title: string;
    isCompleted: boolean;
    bestScore?: number;
    bestAccuracy?: number;
    completionTime?: number;
  }>;
  totalPoints: number;
  completedLevels: number;
  lastUpdated: Date;
}

interface StudentPerformanceReportProps {
  studentId: string;
  studentName: string;
  userRole: 'parent' | 'teacher';
}

const StudentPerformanceReport: React.FC<StudentPerformanceReportProps> = ({ 
  studentId, 
  studentName, 
  userRole 
}) => {
  const { t } = useLanguage();
  const [performanceHistory, setPerformanceHistory] = useState<PerformanceData[]>([]);
  const [levelProgress, setLevelProgress] = useState<LevelProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedQuiz, setExpandedQuiz] = useState<string | null>(null);

  const formatQuestionText = (text: string) => {
    if (!text) return '';
    try {
      return text
        .toString()
        .replace(/\r?\n|<br\s*\/?>(\r?\n)?/gi, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    } catch {
      return text as any;
    }
  };

  useEffect(() => {
    fetchPerformanceData();
  }, [studentId]);

  const fetchPerformanceData = async () => {
    try {
      setLoading(true);
      console.log('=== PERFORMANCE REPORT DEBUG ===');
      console.log('Fetching performance data for student:', studentId);
      console.log('Student name:', studentName);
      console.log('User role:', userRole);
      
      // Fetch performance history
      const performanceQuery = query(
        collection(db, 'childrenPerformance'),
        where('childId', '==', studentId)
      );
      
      console.log('Query created:', performanceQuery);
      const performanceSnapshot = await getDocs(performanceQuery);
      console.log('Performance query snapshot size:', performanceSnapshot.size);
      
      const performanceData: PerformanceData[] = [];
      
      performanceSnapshot.forEach((doc) => {
        const data = doc.data();
        console.log('Performance document:', doc.id, data);
        console.log('Detailed answers in document:', data.detailedAnswers);
        
        // Only include quizzes that have detailed answers (completed quizzes)
        if (data.detailedAnswers && data.detailedAnswers.length > 0) {
          performanceData.push({
            id: doc.id,
            childId: data.childId,
            childName: data.childName,
            score: data.score,
            totalQuestions: data.totalQuestions,
            accuracy: data.accuracy,
            timeTaken: data.timeTaken,
            category: data.category,
            completedAt: data.completedAt?.toDate() || new Date(),
            levelId: data.levelId,
            levelName: data.levelName,
            detailedAnswers: data.detailedAnswers || [],
            levelDifficulty: data.levelDifficulty
          });
        } else {
          console.log('Skipping incomplete quiz entry:', doc.id, 'No detailed answers');
        }
      });

      // Remove duplicates based on levelId and keep the most recent one
      const uniquePerformanceData = performanceData.reduce((acc, current) => {
        const existing = acc.find(item => item.levelId === current.levelId);
        if (!existing) {
          acc.push(current);
        } else if (current.completedAt > existing.completedAt) {
          // Replace with more recent entry
          const index = acc.findIndex(item => item.levelId === current.levelId);
          acc[index] = current;
        }
        return acc;
      }, [] as PerformanceData[]);

      // Sort by completedAt descending (most recent first)
      uniquePerformanceData.sort((a, b) => b.completedAt.getTime() - a.completedAt.getTime());

      console.log('Performance data fetched:', uniquePerformanceData);
      console.log('Total completed quizzes:', uniquePerformanceData.length);
      setPerformanceHistory(uniquePerformanceData);

      // Fetch level progress
      const levelProgressQuery = query(
        collection(db, 'childrenLevelProgress'),
        where('childId', '==', studentId),
        limit(1)
      );
      
      const levelProgressSnapshot = await getDocs(levelProgressQuery);
      if (!levelProgressSnapshot.empty) {
        const data = levelProgressSnapshot.docs[0].data();
        console.log('Level progress data fetched:', data);
        setLevelProgress({
          childId: data.childId,
          childName: data.childName,
          performanceCategory: data.performanceCategory,
          levels: data.levels,
          totalPoints: data.totalPoints,
          completedLevels: data.completedLevels,
          lastUpdated: data.lastUpdated?.toDate() || new Date()
        });
      } else {
        console.log('No level progress data found for student:', studentId);
      }

    } catch (error) {
      console.error('Error fetching performance data:', error);
    } finally {
      setLoading(false);
    }
  };


  const calculateAverageAccuracy = () => {
    if (performanceHistory.length === 0) return 0;
    const totalAccuracy = performanceHistory.reduce((sum, item) => sum + item.accuracy, 0);
    return Math.round(totalAccuracy / performanceHistory.length);
  };

  const calculateAverageTime = () => {
    if (performanceHistory.length === 0) return 0;
    const totalTime = performanceHistory.reduce((sum, item) => sum + item.timeTaken, 0);
    return Math.round(totalTime / performanceHistory.length);
  };

  const getPerformanceTrend = () => {
    if (performanceHistory.length < 2) return 'stable';
    const recent = performanceHistory.slice(0, 3);
    const older = performanceHistory.slice(3, 6);
    
    if (recent.length === 0 || older.length === 0) return 'stable';
    
    const recentAvg = recent.reduce((sum, item) => sum + item.accuracy, 0) / recent.length;
    const olderAvg = older.reduce((sum, item) => sum + item.accuracy, 0) / older.length;
    
    if (recentAvg > olderAvg + 5) return 'improving';
    if (recentAvg < olderAvg - 5) return 'declining';
    return 'stable';
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving': return '📈';
      case 'declining': return '📉';
      default: return '➡️';
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'improving': return '#10b981';
      case 'declining': return '#ef4444';
      default: return '#6b7280';
    }
  };


  const toggleQuizExpansion = (quizId: string) => {
    console.log('Toggling quiz expansion for:', quizId);
    const quiz = performanceHistory.find(p => p.id === quizId);
    console.log('Quiz data:', quiz);
    console.log('Detailed answers:', quiz?.detailedAnswers);
    console.log('Detailed answers length:', quiz?.detailedAnswers?.length);
    setExpandedQuiz(expandedQuiz === quizId ? null : quizId);
  };

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

  const generatePDF = (performanceData: PerformanceData) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    
    // Colors
    const primaryColor: [number, number, number] = [102, 126, 234]; // #667eea
    const successColor: [number, number, number] = [16, 185, 129]; // #10b981
    const errorColor: [number, number, number] = [239, 68, 68]; // #ef4444
    const textColor: [number, number, number] = [31, 41, 55]; // #1f2937
    const lightGray: [number, number, number] = [243, 244, 246]; // #f3f4f6

    let yPosition = 20;

    // Header
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.rect(0, 0, pageWidth, 40, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text(t('common.assessmentAnalysisReport'), 20, 25);
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Student: ${performanceData.childName}`, 20, 35);
    doc.text(`Date: ${performanceData.completedAt.toLocaleDateString()}`, pageWidth - 80, 35);

    yPosition = 60;

    // Performance Summary Section
    doc.setTextColor(textColor[0], textColor[1], textColor[2]);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(t('common.performanceSummary'), 20, yPosition);
    yPosition += 15;

    // Summary cards
    const summaryData = [
      [t('common.score'), `${performanceData.score}/${performanceData.totalQuestions}`],
      [t('common.accuracy'), `${Math.round(performanceData.accuracy)}%`],
      [t('common.time'), formatTime(performanceData.timeTaken)],
      [t('common.level'), performanceData.levelName || 'N/A'],
      [t('common.difficulty'), performanceData.levelDifficulty || 'Medium'],
      [t('common.performance'), performanceData.category]
    ];

    autoTable(doc, {
      startY: yPosition,
      head: [[t('common.metric'), t('common.value')]],
      body: summaryData,
      theme: 'grid',
      headStyles: {
        fillColor: primaryColor,
        textColor: [255, 255, 255],
        fontStyle: 'bold'
      },
      bodyStyles: {
        textColor: textColor
      },
      alternateRowStyles: {
        fillColor: lightGray
      },
      margin: { left: 20, right: 20 },
      columnStyles: {
        0: { cellWidth: 60 },
        1: { cellWidth: 80 }
      }
    });

    yPosition = (doc as any).lastAutoTable.finalY + 20;

    // Question Analysis Section
    if (performanceData.detailedAnswers && performanceData.detailedAnswers.length > 0) {
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('Question-by-Question Analysis', 20, yPosition);
      yPosition += 15;

      // Question summary stats
      const correctAnswers = performanceData.detailedAnswers.filter(a => a.isCorrect).length;
      const totalQuestions = performanceData.detailedAnswers.length;
      const avgResponseTime = Math.round(
        performanceData.detailedAnswers.reduce((sum, a) => sum + a.timeTaken, 0) / totalQuestions
      );

      const questionSummaryData = [
        ['Total Questions', totalQuestions.toString()],
        ['Correct Answers', correctAnswers.toString()],
        ['Accuracy Rate', `${Math.round((correctAnswers / totalQuestions) * 100)}%`],
        ['Avg Response Time', `${avgResponseTime}s`]
      ];

      autoTable(doc, {
        startY: yPosition,
        head: [['Statistic', 'Value']],
        body: questionSummaryData,
        theme: 'grid',
        headStyles: {
          fillColor: [59, 130, 246], // Blue
          textColor: [255, 255, 255],
          fontStyle: 'bold'
        },
        bodyStyles: {
          textColor: textColor
        },
        alternateRowStyles: {
          fillColor: lightGray
        },
        margin: { left: 20, right: 20 },
        columnStyles: {
          0: { cellWidth: 80 },
          1: { cellWidth: 60 }
        }
      });

      yPosition = (doc as any).lastAutoTable.finalY + 20;

      // Individual Questions
      const sortedAnswers = performanceData.detailedAnswers.sort((a, b) => a.questionId - b.questionId);
      
      sortedAnswers.forEach((answer, index) => {
        // Check if we need a new page
        if (yPosition > pageHeight - 80) {
          doc.addPage();
          yPosition = 20;
        }

        // Question header
        const headerColor = answer.isCorrect ? successColor : errorColor;
        doc.setFillColor(headerColor[0], headerColor[1], headerColor[2]);
        doc.rect(20, yPosition - 5, pageWidth - 40, 15, 'F');
        
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text(`Question ${answer.questionId}`, 25, yPosition + 3);
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(`${answer.operation.toUpperCase()} • ${answer.difficulty}`, pageWidth - 100, yPosition + 3);
        doc.text(answer.isCorrect ? '✓ CORRECT' : '✗ INCORRECT', pageWidth - 50, yPosition + 3);

        yPosition += 20;

        // Question content
        doc.setTextColor(textColor[0], textColor[1], textColor[2]);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        
        // Question text
        const questionText = answer.questionText;
        const splitQuestion = doc.splitTextToSize(questionText, pageWidth - 40);
        doc.text(splitQuestion, 25, yPosition);
        yPosition += splitQuestion.length * 4 + 5;

        // Answer comparison
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.text('Student Answer:', 25, yPosition);
        doc.text('Correct Answer:', pageWidth - 100, yPosition);
        
        yPosition += 8;
        
        doc.setFont('helvetica', 'normal');
        doc.text(answer.answer.toString(), 25, yPosition);
        doc.text(answer.correctAnswer.toString(), pageWidth - 100, yPosition);
        
        yPosition += 8;
        
        // Response time
        doc.setFontSize(8);
        doc.setTextColor(107, 114, 128); // Gray
        doc.text(`Response Time: ${answer.timeTaken}s`, 25, yPosition);
        
        yPosition += 15;
      });
    }

    // Footer
    const footerY = pageHeight - 20;
    doc.setTextColor(107, 114, 128);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('Generated by Cognify Learning Platform', 20, footerY);
    doc.text(new Date().toLocaleString(), pageWidth - 60, footerY);

    // Download the PDF
    const fileName = `${performanceData.childName}_Quiz_${performanceData.completedAt.toLocaleDateString().replace(/\//g, '-')}.pdf`;
    doc.save(fileName);
  };

  const generateFullReportPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    
    // Colors
    const primaryColor: [number, number, number] = [102, 126, 234]; // #667eea
    const successColor: [number, number, number] = [16, 185, 129]; // #10b981
    const errorColor: [number, number, number] = [239, 68, 68]; // #ef4444
    const textColor: [number, number, number] = [31, 41, 55]; // #1f2937
    const lightGray: [number, number, number] = [243, 244, 246]; // #f3f4f6
    const accentColor: [number, number, number] = [59, 130, 246]; // #3b82f6

    let yPosition = 20;

    // Header
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.rect(0, 0, pageWidth, 50, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(28);
    doc.setFont('helvetica', 'bold');
    doc.text('Comprehensive Performance Report', 20, 30);
    
    doc.setFontSize(14);
    doc.setFont('helvetica', 'normal');
    doc.text(`Student: ${studentName}`, 20, 42);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, pageWidth - 100, 42);

    yPosition = 70;

    // Student Overview Section
    if (levelProgress) {
      doc.setTextColor(textColor[0], textColor[1], textColor[2]);
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('Student Overview', 20, yPosition);
      yPosition += 15;

      const overviewData = [
        ['Performance Category', levelProgress.performanceCategory.name],
        ['Total Levels', levelProgress.levels.length.toString()],
        ['Completed Levels', levelProgress.completedLevels.toString()],
        ['Total Points', levelProgress.totalPoints.toString()],
        ['Progress Percentage', `${Math.round((levelProgress.completedLevels / levelProgress.levels.length) * 100)}%`]
      ];

      autoTable(doc, {
        startY: yPosition,
        head: [[t('common.metric'), t('common.value')]],
        body: overviewData,
        theme: 'grid',
        headStyles: {
          fillColor: accentColor,
          textColor: [255, 255, 255],
          fontStyle: 'bold'
        },
        bodyStyles: {
          textColor: textColor
        },
        alternateRowStyles: {
          fillColor: lightGray
        },
        margin: { left: 20, right: 20 },
        columnStyles: {
          0: { cellWidth: 80 },
          1: { cellWidth: 100 }
        }
      });

      yPosition = (doc as any).lastAutoTable.finalY + 25;
    }

    // Performance Summary Statistics
    if (performanceHistory.length > 0) {
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('Performance Summary', 20, yPosition);
      yPosition += 15;

      const avgAccuracy = calculateAverageAccuracy();
      const avgTime = calculateAverageTime();
      const trend = getPerformanceTrend();
      const totalQuizzes = performanceHistory.length;

      const summaryData = [
        ['Total Quizzes', totalQuizzes.toString()],
        ['Average Accuracy', `${avgAccuracy}%`],
        ['Average Time', formatTime(avgTime)],
        ['Performance Trend', trend.charAt(0).toUpperCase() + trend.slice(1)],
        ['Best Score', `${Math.max(...performanceHistory.map(p => p.score))}/${Math.max(...performanceHistory.map(p => p.totalQuestions))}`],
        ['Latest Performance', performanceHistory[0].category]
      ];

      autoTable(doc, {
        startY: yPosition,
        head: [['Statistic', 'Value']],
        body: summaryData,
        theme: 'grid',
        headStyles: {
          fillColor: successColor,
          textColor: [255, 255, 255],
          fontStyle: 'bold'
        },
        bodyStyles: {
          textColor: textColor
        },
        alternateRowStyles: {
          fillColor: lightGray
        },
        margin: { left: 20, right: 20 },
        columnStyles: {
          0: { cellWidth: 80 },
          1: { cellWidth: 100 }
        }
      });

      yPosition = (doc as any).lastAutoTable.finalY + 25;
    }

    // Performance History Table
    if (performanceHistory.length > 0) {
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('Quiz Performance History', 20, yPosition);
      yPosition += 15;

      const historyData = performanceHistory.map((item, index) => [
        (index + 1).toString(),
        item.completedAt.toLocaleDateString(),
        `${item.score}/${item.totalQuestions}`,
        `${Math.round(item.accuracy)}%`,
        formatTime(item.timeTaken),
        item.levelName || 'N/A',
        item.levelDifficulty || 'N/A',
        item.category
      ]);

      autoTable(doc, {
        startY: yPosition,
        head: [['#', 'Date', 'Score', 'Accuracy', 'Time', 'Level', 'Difficulty', 'Performance']],
        body: historyData,
        theme: 'grid',
        headStyles: {
          fillColor: primaryColor,
          textColor: [255, 255, 255],
          fontStyle: 'bold'
        },
        bodyStyles: {
          textColor: textColor,
          fontSize: 9
        },
        alternateRowStyles: {
          fillColor: lightGray
        },
        margin: { left: 20, right: 20 },
        columnStyles: {
          0: { cellWidth: 15 },
          1: { cellWidth: 25 },
          2: { cellWidth: 20 },
          3: { cellWidth: 20 },
          4: { cellWidth: 20 },
          5: { cellWidth: 30 },
          6: { cellWidth: 25 },
          7: { cellWidth: 30 }
        }
      });

      yPosition = (doc as any).lastAutoTable.finalY + 25;
    }

    // Detailed Question Analysis (if available)
    const quizzesWithDetails = performanceHistory.filter(p => p.detailedAnswers && p.detailedAnswers.length > 0);
    if (quizzesWithDetails.length > 0) {
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('Detailed Question Analysis', 20, yPosition);
      yPosition += 15;

      // Show summary of all detailed quizzes
      const detailedSummaryData = quizzesWithDetails.map((quiz, index) => {
        const correctAnswers = quiz.detailedAnswers!.filter(a => a.isCorrect).length;
        const totalQuestions = quiz.detailedAnswers!.length;
        const avgResponseTime = Math.round(
          quiz.detailedAnswers!.reduce((sum, a) => sum + a.timeTaken, 0) / totalQuestions
        );

        return [
          (index + 1).toString(),
          quiz.completedAt.toLocaleDateString(),
          quiz.levelName || 'N/A',
          totalQuestions.toString(),
          correctAnswers.toString(),
          `${Math.round((correctAnswers / totalQuestions) * 100)}%`,
          `${avgResponseTime}s`
        ];
      });

      autoTable(doc, {
        startY: yPosition,
        head: [['#', 'Date', 'Level', 'Questions', 'Correct', 'Accuracy', 'Avg Time']],
        body: detailedSummaryData,
        theme: 'grid',
        headStyles: {
          fillColor: accentColor,
          textColor: [255, 255, 255],
          fontStyle: 'bold'
        },
        bodyStyles: {
          textColor: textColor,
          fontSize: 9
        },
        alternateRowStyles: {
          fillColor: lightGray
        },
        margin: { left: 20, right: 20 },
        columnStyles: {
          0: { cellWidth: 15 },
          1: { cellWidth: 25 },
          2: { cellWidth: 30 },
          3: { cellWidth: 20 },
          4: { cellWidth: 20 },
          5: { cellWidth: 20 },
          6: { cellWidth: 20 }
        }
      });

      yPosition = (doc as any).lastAutoTable.finalY + 25;
    }

    // Performance Insights
    if (performanceHistory.length > 0) {
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('Performance Insights', 20, yPosition);
      yPosition += 15;

      const insights = generatePerformanceInsights();
      
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      insights.forEach((insight, index) => {
        if (yPosition > pageHeight - 30) {
          doc.addPage();
          yPosition = 20;
        }
        
        doc.setTextColor(textColor[0], textColor[1], textColor[2]);
        doc.text(`• ${insight}`, 25, yPosition);
        yPosition += 8;
      });

      yPosition += 15;
    }

    // Footer
    const footerY = pageHeight - 20;
    doc.setTextColor(107, 114, 128);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('Generated by Cognify Learning Platform', 20, footerY);
    doc.text(new Date().toLocaleString(), pageWidth - 100, footerY);

    // Download the PDF
    const fileName = `${studentName}_Full_Performance_Report_${new Date().toLocaleDateString().replace(/\//g, '-')}.pdf`;
    doc.save(fileName);
  };

  const generatePerformanceInsights = () => {
    const insights: string[] = [];
    
    if (performanceHistory.length === 0) return insights;

    const avgAccuracy = calculateAverageAccuracy();
    const avgTime = calculateAverageTime();
    const trend = getPerformanceTrend();

    // Accuracy insights
    if (avgAccuracy >= 90) {
      insights.push("Excellent accuracy! This student demonstrates strong understanding of mathematical concepts.");
    } else if (avgAccuracy >= 80) {
      insights.push("Good accuracy with room for improvement. Focus on challenging areas to reach excellence.");
    } else if (avgAccuracy >= 70) {
      insights.push("Average accuracy. Consider additional practice and targeted support in weaker areas.");
    } else {
      insights.push("Accuracy needs improvement. Recommend focused tutoring and additional practice sessions.");
    }

    // Time insights
    if (avgTime <= 60) {
      insights.push("Fast response times indicate good confidence and familiarity with the material.");
    } else if (avgTime <= 120) {
      insights.push("Reasonable response times. Student is working at a comfortable pace.");
    } else {
      insights.push("Slower response times may indicate need for more practice or concept reinforcement.");
    }

    // Trend insights
    if (trend === 'improving') {
      insights.push("Positive trend detected! Student performance is consistently improving over time.");
    } else if (trend === 'declining') {
      insights.push("Performance trend shows decline. Consider identifying and addressing learning challenges.");
    } else {
      insights.push("Stable performance pattern. Consistent results indicate steady learning progress.");
    }

    // Level progression insights
    if (levelProgress) {
      const progressPercentage = (levelProgress.completedLevels / levelProgress.levels.length) * 100;
      if (progressPercentage >= 80) {
        insights.push("Outstanding progress! Student has completed most of the available levels.");
      } else if (progressPercentage >= 50) {
        insights.push("Good progress through the curriculum. Student is on track with learning objectives.");
      } else {
        insights.push("Early stage progress. Student is building foundational skills and gaining momentum.");
      }
    }

    // Recent performance insights
    if (performanceHistory.length >= 3) {
      const recent = performanceHistory.slice(0, 3);
      const recentAvg = recent.reduce((sum, item) => sum + item.accuracy, 0) / recent.length;
      if (recentAvg >= 85) {
        insights.push("Recent performance shows excellent consistency and mastery of concepts.");
      } else if (recentAvg >= 70) {
        insights.push("Recent performance indicates steady progress with some variability.");
      } else {
        insights.push("Recent performance suggests need for additional support and practice.");
      }
    }

    return insights;
  };

  if (loading) {
    return (
      <div className="performance-report">
        <div className="loading-container">
          <div className="loading-spinner">
            <div className="spinner"></div>
            <p>Loading performance data...</p>
          </div>
        </div>
      </div>
    );
  }

  const averageAccuracy = calculateAverageAccuracy();
  const averageTime = calculateAverageTime();
  const trend = getPerformanceTrend();

  return (
    <div className={`performance-report ${userRole ? 'professional' : ''}`}>
      <div className="report-header">
        <h2>📊 {t('navigation.reports')}: {studentName}</h2>
        <div className="header-actions">
          <button 
            className="download-full-report-btn"
            onClick={() => generateFullReportPDF()}
            title={t('common.downloadFullReport')}
          >
            📊 {t('common.downloadFullReport')}
            </button>
        </div>
      </div>


      {levelProgress && (
        <div className="performance-overview">
          <div className="overview-card">
            <div className="card-header">
              <h3>🎯 {t('common.performanceCategory')}</h3>
            </div>
            <div className="category-info">
              <div 
                className="category-badge"
                style={{ backgroundColor: levelProgress.performanceCategory.color }}
              >
                <span className="category-emoji">{levelProgress.performanceCategory.emoji}</span>
                <span className="category-name">{levelProgress.performanceCategory.name}</span>
              </div>
              <p className="category-description">
                {levelProgress.performanceCategory.name === 'High Performer' 
                  ? t('common.highPerformerDescription')
                  : levelProgress.performanceCategory.name === 'Middle Performer'
                  ? t('common.middlePerformerDescription')
                  : t('common.lowPerformerDescription')
                }
              </p>
            </div>
          </div>

          <div className="overview-card">
            <div className="card-header">
              <h3>🏆 Level Progress</h3>
            </div>
            <div className="progress-stats">
              <div className="stat-item">
                <span className="stat-value">{levelProgress.completedLevels}</span>
                <span className="stat-label">{t('common.levelsCompleted')}</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">{levelProgress.totalPoints}</span>
                <span className="stat-label">{t('common.totalPoints')}</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">{levelProgress.levels.length}</span>
                <span className="stat-label">{t('common.totalLevels')}</span>
              </div>
            </div>
            <div className="progress-bar">
              <div 
                className="progress-fill"
                style={{ 
                  width: `${(levelProgress.completedLevels / levelProgress.levels.length) * 100}%` 
                }}
              ></div>
            </div>
          </div>
        </div>
      )}

      <div className="performance-metrics">
        <div className="metric-card">
          <div className="metric-icon">🎯</div>
          <div className="metric-content">
            <div className="metric-value">{averageAccuracy}%</div>
            <div className="metric-label">Average Accuracy</div>
          </div>
        </div>
        
        <div className="metric-card">
          <div className="metric-icon">⏱️</div>
          <div className="metric-content">
            <div className="metric-value">{formatTime(averageTime)}</div>
            <div className="metric-label">Average Time</div>
          </div>
        </div>
        
        <div className="metric-card">
          <div className="metric-icon">📊</div>
          <div className="metric-content">
            <div className="metric-value">{performanceHistory.length}</div>
            <div className="metric-label">Quizzes Taken</div>
          </div>
        </div>
        
        <div className="metric-card">
          <div className="metric-icon" style={{ color: getTrendColor(trend) }}>
            {getTrendIcon(trend)}
          </div>
          <div className="metric-content">
            <div className="metric-value" style={{ color: getTrendColor(trend) }}>
              {trend.charAt(0).toUpperCase() + trend.slice(1)}
            </div>
            <div className="metric-label">Performance Trend</div>
          </div>
        </div>
      </div>

      <div className="performance-history">
        <h3>📈 {t('common.recentPerformanceHistory')}</h3>
        {performanceHistory.length === 0 ? (
          <div className="no-data">
            <p>{t('common.noPerformanceDataAvailable')}</p>
          </div>
        ) : (
          <div className="history-list">
            {performanceHistory.map((item, index) => (
              <div key={item.id} className="history-item">
                <div className="history-header">
                <div className="history-date">
                  {item.completedAt.toLocaleDateString()}
                  </div>
                  <button 
                    className="expand-btn"
                    onClick={() => toggleQuizExpansion(item.id)}
                  >
                    {expandedQuiz === item.id ? '▼' : '▶'} {t('common.viewAnalysis')}
                  </button>
                </div>
                <div className="history-details">
                  <div className="detail-item">
                    <span className="detail-label">{t('common.score')}:</span>
                    <span className="detail-value">{item.score}/{item.totalQuestions}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">{t('common.accuracy')}:</span>
                    <span className="detail-value">{Math.round(item.accuracy)}%</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">{t('common.time')}:</span>
                    <span className="detail-value">{formatTime(item.timeTaken)}</span>
                  </div>
                  {item.levelName && (
                    <div className="detail-item">
                      <span className="detail-label">{t('common.level')}:</span>
                      <span className="detail-value">{item.levelName}</span>
                    </div>
                  )}
                  {item.levelDifficulty && (
                    <div className="detail-item">
                      <span className="detail-label">{t('common.difficulty')}:</span>
                      <span 
                        className="detail-value"
                        style={{ color: getDifficultyColor(item.levelDifficulty) }}
                      >
                        {item.levelDifficulty}
                      </span>
                    </div>
                  )}
                </div>
                <div className="history-category">
                  <span className={`category-tag ${item.category.toLowerCase().replace(' ', '-')}`}>
                    {item.category}
                  </span>
                </div>
              </div>
            ))}

            {/* Detailed Question Analysis - Full Width Report */}
            {expandedQuiz && performanceHistory.find(item => item.id === expandedQuiz) && (
              <div className="detailed-analysis-report">
                {(() => {
                  const selectedItem = performanceHistory.find(item => item.id === expandedQuiz);
                  if (!selectedItem) return null;
                  
                  return (
                    <>
                      {/* Report Header */}
                      <div className="report-header-section">
                        <div className="report-title">
                          <h3>Assessment Analysis Report</h3>
                          <p className="report-date">{selectedItem.completedAt.toLocaleDateString()}</p>
                        </div>
                        <div className="report-actions">
                          <button 
                            className="download-pdf-btn"
                            onClick={() => generatePDF(selectedItem)}
                            title={t('common.downloadAsPDF')}
                          >
                            📄 {t('common.downloadPDF')}
                          </button>
                          <button 
                            className="close-analysis-btn"
                            onClick={() => setExpandedQuiz(null)}
                          >
                            ✕ Close Analysis
                          </button>
                        </div>
                      </div>

                      {/* Performance Summary */}
                      <div className="performance-summary-section">
                        <div className="summary-grid">
                          <div className="summary-card">
                            <div className="summary-label">Score</div>
                            <div className="summary-value">{selectedItem.score}/{selectedItem.totalQuestions}</div>
                          </div>
                          <div className="summary-card">
                            <div className="summary-label">Accuracy</div>
                            <div className="summary-value">{Math.round(selectedItem.accuracy)}%</div>
                          </div>
                          <div className="summary-card">
                            <div className="summary-label">Time</div>
                            <div className="summary-value">{formatTime(selectedItem.timeTaken)}</div>
                          </div>
                          <div className="summary-card">
                            <div className="summary-label">Level</div>
                            <div className="summary-value">{selectedItem.levelName || 'N/A'}</div>
                          </div>
                          <div className="summary-card">
                            <div className="summary-label">Difficulty</div>
                            <div className="summary-value" style={{ color: getDifficultyColor(selectedItem.levelDifficulty || 'Medium') }}>
                              {selectedItem.levelDifficulty || 'Medium'}
                            </div>
                          </div>
                          <div className="summary-card">
                            <div className="summary-label">Performance</div>
                            <div className="summary-value category-badge">{selectedItem.category}</div>
                          </div>
                        </div>
                      </div>

                      {/* Question Analysis */}
                      {selectedItem.detailedAnswers && selectedItem.detailedAnswers.length > 0 ? (
                        <div className="question-analysis-section">
                          <h4>Question-by-Question Analysis</h4>
                          
                          {/* Question Summary Stats */}
                          <div className="question-summary-stats">
                            <div className="stat-item">
                              <span className="stat-number">{selectedItem.detailedAnswers.length}</span>
                              <span className="stat-label">Total Questions</span>
                            </div>
                            <div className="stat-item">
                              <span className="stat-number">{selectedItem.detailedAnswers.filter(a => a.isCorrect).length}</span>
                              <span className="stat-label">Correct Answers</span>
                            </div>
                            <div className="stat-item">
                              <span className="stat-number">
                                {Math.round((selectedItem.detailedAnswers.filter(a => a.isCorrect).length / selectedItem.detailedAnswers.length) * 100)}%
                              </span>
                              <span className="stat-label">Accuracy Rate</span>
                            </div>
                            <div className="stat-item">
                              <span className="stat-number">
                                {Math.round(selectedItem.detailedAnswers.reduce((sum, a) => sum + a.timeTaken, 0) / selectedItem.detailedAnswers.length)}s
                              </span>
                              <span className="stat-label">Avg Response Time</span>
                            </div>
                          </div>

                          {/* Question Grid */}
                          <div className="questions-grid-full">
                            {selectedItem.detailedAnswers && selectedItem.detailedAnswers.length > 0 ? (
                              selectedItem.detailedAnswers
                                .sort((a, b) => a.questionId - b.questionId)
                                .map((answer, qIndex) => (
                              <div key={qIndex} className={`question-card ${answer.isCorrect ? 'correct' : 'incorrect'}`}>
                                <div className="question-card-header">
                                  <div className="question-number-badge">Q{answer.questionId}</div>
                                  <div className="question-meta">
                                    <span className="operation-badge">{getOperationIcon(answer.operation)} {answer.operation}</span>
                                    <span 
                                      className="difficulty-badge"
                                      style={{ backgroundColor: getDifficultyColor(answer.difficulty) }}
                                    >
                                      {answer.difficulty}
                                    </span>
                                    <span className={`status-indicator ${answer.isCorrect ? 'correct' : 'incorrect'}`}>
                                      {answer.isCorrect ? '✓' : '✗'}
                                    </span>
                                  </div>
                                </div>
                                
                                <div className="question-content">
                                  <div className="question-text horizontal">{formatQuestionText(answer.questionText)}</div>
                                  <div className="answer-row">
                                    <div className="answer-box student-answer">
                                      <div className="answer-label">Student Answer</div>
                                      <div className="answer-value">{answer.answer}</div>
                                    </div>
                                    <div className="answer-box correct-answer">
                                      <div className="answer-label">Correct Answer</div>
                                      <div className="answer-value">{answer.correctAnswer}</div>
                                    </div>
                                    <div className="response-time-box">
                                      <div className="answer-label">Response Time</div>
                                      <div className="time-chip">{answer.timeTaken}s</div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))
                            ) : (
                              <div className="no-detailed-answers">
                                <p>No detailed question data available for this quiz.</p>
                                <p>This quiz may not have been completed properly or detailed tracking was not available.</p>
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="no-detailed-answers">
                          <p>No detailed question data available for this assessment.</p>
                          <p>This may occur when:</p>
                          <ul>
                            <li>The assessment was completed before detailed tracking was implemented</li>
                            <li>Technical issues prevented detailed data from being saved</li>
                          </ul>
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            )}
          </div>
        )}
      </div>

      {levelProgress && levelProgress.levels.length > 0 && (
        <div className="level-breakdown">
          <h3>🎮 Level Breakdown</h3>
          <div className="levels-grid">
            {levelProgress.levels.map((level) => (
              <div key={level.id} className={`level-item ${level.isCompleted ? 'completed' : 'pending'}`}>
                <div className="level-info">
                  <h4>{level.title}</h4>
                  <p>Level {level.id}</p>
                </div>
                <div className="level-status">
                  {level.isCompleted ? (
                    <div className="completed-status">
                      <span className="status-icon">✅</span>
                      <div className="completion-details">
                        {level.bestScore && (
                          <span>Best: {level.bestScore}/{level.id === 1 ? 8 : level.id === 2 ? 10 : level.id === 3 ? 12 : 15}</span>
                        )}
                        {level.bestAccuracy && (
                          <span>Accuracy: {Math.round(level.bestAccuracy)}%</span>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="pending-status">
                      <span className="status-icon">⏳</span>
                      <span>Not Started</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="report-insights">
        <h3>💡 {t('common.insightsRecommendations')}</h3>
        <div className="insights-content">
          {averageAccuracy >= 80 ? (
            <div className="insight positive">
              <h4>🌟 {t('common.excellentPerformance')}</h4>
              <p>{t('common.excellentPerformanceText').replace('{accuracy}', averageAccuracy.toString())}</p>
            </div>
          ) : averageAccuracy >= 60 ? (
            <div className="insight neutral">
              <h4>👍 {t('common.goodProgress')}</h4>
              <p>{t('common.goodProgressText').replace('{accuracy}', averageAccuracy.toString())}</p>
            </div>
          ) : (
            <div className="insight supportive">
              <h4>🌱 {t('common.buildingConfidence')}</h4>
              <p>{t('common.buildingConfidenceText')}</p>
            </div>
          )}
          
          {trend === 'improving' && (
            <div className="insight positive">
              <h4>📈 {t('common.greatImprovement')}</h4>
              <p>{t('common.greatImprovementText')}</p>
            </div>
          )}
          
          {trend === 'declining' && (
            <div className="insight supportive">
              <h4>🤝 {t('common.extraSupportNeeded')}</h4>
              <p>{t('common.extraSupportNeededText')}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentPerformanceReport;
