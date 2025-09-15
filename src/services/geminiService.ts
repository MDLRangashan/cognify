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

interface AIInsightsRequest {
  studentName: string;
  performanceHistory: PerformanceData[];
  levelProgress: LevelProgress | null;
  averageAccuracy: number;
  averageTime: number;
  trend: 'improving' | 'declining' | 'stable';
}

interface AIInsightsResponse {
  insights: string[];
  recommendations: string[];
  strengths: string[];
  areasForImprovement: string[];
  nextSteps: string[];
}

class GeminiService {
  private apiKey: string;
  private baseUrl: string = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

  constructor() {
    this.apiKey = 'AIzaSyCpsJUm7pjVE2BFjly5ym2DYqbSch1B9BE';
  }

  async generateInsights(request: AIInsightsRequest): Promise<AIInsightsResponse> {
    try {
      const prompt = this.buildPrompt(request);
      
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-goog-api-key': this.apiKey,
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt
                }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 1024,
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
        throw new Error('Invalid response from Gemini API');
      }

      const aiResponse = data.candidates[0].content.parts[0].text;
      return this.parseAIResponse(aiResponse);
      
    } catch (error) {
      console.error('Error generating AI insights:', error);
      return this.getFallbackInsights(request);
    }
  }

  private buildPrompt(request: AIInsightsRequest): string {
    const { studentName, performanceHistory, levelProgress, averageAccuracy, averageTime, trend } = request;
    
    const recentQuizzes = performanceHistory.slice(0, 5);
    const quizDetails = recentQuizzes.map(quiz => 
      `- ${quiz.category}: ${quiz.accuracy.toFixed(1)}% accuracy, ${quiz.timeTaken}s time, ${quiz.score}/${quiz.totalQuestions} correct`
    ).join('\n');

    const levelProgressText = levelProgress ? 
      `Level Progress: ${levelProgress.completedLevels}/${levelProgress.levels.length} levels completed (${((levelProgress.completedLevels / levelProgress.levels.length) * 100).toFixed(1)}%)` : 
      'No level progress data available';

    return `You are an expert educational psychologist and math tutor. Analyze the following student performance data and provide personalized insights and recommendations.

STUDENT: ${studentName}

PERFORMANCE SUMMARY:
- Average Accuracy: ${averageAccuracy.toFixed(1)}%
- Average Time per Question: ${averageTime.toFixed(1)} seconds
- Performance Trend: ${trend}
- ${levelProgressText}

RECENT QUIZ PERFORMANCE:
${quizDetails}

Please provide a comprehensive analysis in the following JSON format:
{
  "insights": [
    "3-4 key insights about the student's performance patterns, strengths, and learning style"
  ],
  "recommendations": [
    "3-4 specific, actionable recommendations for improvement"
  ],
  "strengths": [
    "2-3 specific areas where the student excels"
  ],
  "areasForImprovement": [
    "2-3 specific areas that need attention"
  ],
  "nextSteps": [
    "2-3 concrete next steps for the student and teacher/parent"
  ]
}

Guidelines:
- Be encouraging and positive while being honest about areas for improvement
- Make recommendations specific and actionable
- Consider the student's age (elementary level) in your language
- Focus on mathematical concepts and learning strategies
- Keep each item concise (1-2 sentences)
- Use a supportive, growth-mindset tone

Respond ONLY with valid JSON, no additional text.`;
  }

  private parseAIResponse(response: string): AIInsightsResponse {
    try {
      // Clean the response to extract JSON
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const cleanedResponse = jsonMatch[0]
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();

      const parsed = JSON.parse(cleanedResponse);
      
      // Validate the response structure
      if (!parsed.insights || !parsed.recommendations || !parsed.strengths || !parsed.areasForImprovement || !parsed.nextSteps) {
        throw new Error('Invalid response structure');
      }

      return {
        insights: Array.isArray(parsed.insights) ? parsed.insights : [],
        recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : [],
        strengths: Array.isArray(parsed.strengths) ? parsed.strengths : [],
        areasForImprovement: Array.isArray(parsed.areasForImprovement) ? parsed.areasForImprovement : [],
        nextSteps: Array.isArray(parsed.nextSteps) ? parsed.nextSteps : []
      };
    } catch (error) {
      console.error('Error parsing AI response:', error);
      throw error;
    }
  }

  private getFallbackInsights(request: AIInsightsRequest): AIInsightsResponse {
    const { averageAccuracy, trend } = request;
    
    // Fallback insights based on performance
    const insights = [];
    const recommendations = [];
    const strengths = [];
    const areasForImprovement = [];
    const nextSteps = [];

    // Basic insights
    if (averageAccuracy >= 80) {
      insights.push("This student demonstrates strong mathematical understanding and consistent performance.");
      strengths.push("High accuracy in problem-solving");
    } else if (averageAccuracy >= 60) {
      insights.push("The student shows steady progress with room for improvement in accuracy.");
      areasForImprovement.push("Accuracy in mathematical calculations");
    } else {
      insights.push("The student is building foundational skills and needs additional support.");
      areasForImprovement.push("Basic mathematical concepts and problem-solving strategies");
    }

    // Trend-based insights
    if (trend === 'improving') {
      insights.push("Positive learning trajectory indicates effective study methods.");
      strengths.push("Consistent improvement over time");
    } else if (trend === 'declining') {
      insights.push("Recent performance suggests need for targeted intervention.");
      areasForImprovement.push("Maintaining consistent performance");
    }

    // Basic recommendations
    recommendations.push("Continue regular practice with varied problem types");
    recommendations.push("Focus on understanding concepts rather than memorization");
    recommendations.push("Use visual aids and hands-on activities for complex topics");

    // Next steps
    nextSteps.push("Set up a regular practice schedule");
    nextSteps.push("Review challenging concepts with additional examples");
    nextSteps.push("Celebrate progress and maintain motivation");

    return {
      insights,
      recommendations,
      strengths,
      areasForImprovement,
      nextSteps
    };
  }
}

export const geminiService = new GeminiService();
export type { AIInsightsRequest, AIInsightsResponse, PerformanceData, LevelProgress };
