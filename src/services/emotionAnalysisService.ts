export interface EmotionResponse {
  emotion: string;
  confidence: number;
  timestamp: string;
  success: boolean;
}

export interface EmotionAnalysisData {
  childId: string;
  quizType: string;
  emotions: EmotionResponse[];
  averageEmotion: string;
  modeEmotion: string;
  confidenceLevel: number;
  totalImages: number;
  analyzedAt: Date;
}

class EmotionAnalysisService {
  private apiUrl: string = 'http://localhost:5001/api/predict';

  /**
   * Send image directly to emotion detection API
   * @param imageBlob - The image blob from canvas
   * @returns Promise<EmotionResponse>
   */
  async analyzeEmotion(imageBlob: Blob): Promise<EmotionResponse> {
    try {
      console.log('Sending image to emotion analysis API...');
      
      // Create FormData to send image file
      const formData = new FormData();
      formData.append('image', imageBlob, 'captured_image.jpg');

      // Send request to emotion API
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Emotion API error: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      console.log('Raw emotion analysis result:', result);
      console.log('Available keys in result:', Object.keys(result));

      // Handle different possible response formats
      let emotion = 'unknown';
      let confidence = 0;

      if (result.emotion) {
        emotion = result.emotion;
      } else if (result.predicted_emotion) {
        emotion = result.predicted_emotion;
      } else if (result.prediction) {
        emotion = result.prediction;
      } else if (result.class) {
        emotion = result.class;
      }

      if (result.confidence !== undefined) {
        confidence = result.confidence;
      } else if (result.confidence_score !== undefined) {
        confidence = result.confidence_score;
      } else if (result.score !== undefined) {
        confidence = result.score;
      } else if (result.probability !== undefined) {
        confidence = result.probability;
      }

      // Ensure confidence is between 0 and 1
      if (confidence > 1) {
        confidence = confidence / 100;
      }

      // Standardize the response format
      const emotionResponse: EmotionResponse = {
        emotion: emotion,
        confidence: confidence,
        timestamp: new Date().toISOString(),
        success: true
      };

      console.log('Processed emotion response:', emotionResponse);
      return emotionResponse;

    } catch (error) {
      console.error('Error analyzing emotion:', error);
      
      // Check if it's a network error (API not running)
      if (error instanceof TypeError && error.message.includes('fetch')) {
        console.warn('Emotion prediction API is not available. Make sure the API is running on http://localhost:5001');
      }
      
      // Return error response
      return {
        emotion: 'api_error',
        confidence: 0,
        timestamp: new Date().toISOString(),
        success: false
      };
    }
  }

  /**
   * Calculate average and mode emotion from responses
   * @param emotions - Array of emotion responses
   * @returns Object with average and mode emotion
   */
  calculateEmotionSummary(emotions: EmotionResponse[]): {
    averageEmotion: string;
    modeEmotion: string;
    confidenceLevel: number;
  } {
    if (emotions.length === 0) {
      return {
        averageEmotion: 'unknown',
        modeEmotion: 'unknown',
        confidenceLevel: 0
      };
    }

    // Filter out error responses
    const validEmotions = emotions.filter(e => e.success && e.emotion !== 'error');
    
    if (validEmotions.length === 0) {
      return {
        averageEmotion: 'unknown',
        modeEmotion: 'unknown',
        confidenceLevel: 0
      };
    }

    // Calculate average confidence
    const averageConfidence = validEmotions.reduce((sum, e) => sum + e.confidence, 0) / validEmotions.length;
    
    // Ensure confidence is between 0 and 1
    const normalizedConfidence = Math.min(Math.max(averageConfidence, 0), 1);

    // Count emotions to find mode
    const emotionCounts: { [key: string]: number } = {};
    const emotionConfidences: { [key: string]: number[] } = {};

    validEmotions.forEach(e => {
      emotionCounts[e.emotion] = (emotionCounts[e.emotion] || 0) + 1;
      if (!emotionConfidences[e.emotion]) {
        emotionConfidences[e.emotion] = [];
      }
      emotionConfidences[e.emotion].push(e.confidence);
    });

    // Find mode emotion (most frequent)
    const modeEmotion = Object.keys(emotionCounts).reduce((a, b) => 
      emotionCounts[a] > emotionCounts[b] ? a : b
    );

    // Calculate weighted average emotion based on confidence scores
    const emotionScores: { [key: string]: number } = {};
    validEmotions.forEach(e => {
      emotionScores[e.emotion] = (emotionScores[e.emotion] || 0) + e.confidence;
    });

    const averageEmotion = Object.keys(emotionScores).reduce((a, b) => 
      emotionScores[a] > emotionScores[b] ? a : b
    );

    console.log('Emotion summary calculated:', {
      averageEmotion,
      modeEmotion,
      confidenceLevel: averageConfidence,
      emotionCounts,
      validEmotions: validEmotions.length,
      totalEmotions: emotions.length
    });

    return {
      averageEmotion,
      modeEmotion,
      confidenceLevel: Math.round(normalizedConfidence * 100) / 100
    };
  }

  /**
   * Convert canvas to blob for API submission
   * @param canvas - HTML Canvas element
   * @returns Promise<Blob>
   */
  canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Failed to convert canvas to blob'));
        }
      }, 'image/jpeg', 0.8);
    });
  }

  /**
   * Get emotion display information
   * @param emotion - The emotion string
   * @returns Object with emoji and color
   */
  getEmotionDisplay(emotion: string): { emoji: string; color: string; description: string } {
    const emotionMap: { [key: string]: { emoji: string; color: string; description: string } } = {
      'happy': { emoji: '😊', color: '#10b981', description: 'Happy and engaged' },
      'sad': { emoji: '😢', color: '#ef4444', description: 'Sad or discouraged' },
      'angry': { emoji: '😠', color: '#dc2626', description: 'Frustrated or angry' },
      'surprised': { emoji: '😮', color: '#f59e0b', description: 'Surprised or amazed' },
      'fear': { emoji: '😰', color: '#6b7280', description: 'Anxious or fearful' },
      'disgust': { emoji: '🤢', color: '#84cc16', description: 'Disgusted or uninterested' },
      'neutral': { emoji: '😐', color: '#6b7280', description: 'Neutral expression' },
      'focused': { emoji: '🤔', color: '#3b82f6', description: 'Focused and thinking' },
      'confused': { emoji: '😕', color: '#f59e0b', description: 'Confused or puzzled' },
      'excited': { emoji: '🤩', color: '#8b5cf6', description: 'Excited and enthusiastic' },
      'calm': { emoji: '😌', color: '#10b981', description: 'Calm and relaxed' },
      'fatigue': { emoji: '😴', color: '#6b7280', description: 'Tired or fatigued during the quiz' },
      'bored': { emoji: '😴', color: '#6b7280', description: 'Tired or bored during the quiz' },
      'unknown': { emoji: '❓', color: '#9ca3af', description: 'Unknown emotion' },
      'error': { emoji: '⚠️', color: '#ef4444', description: 'Analysis error' },
      'api_error': { emoji: '🔌', color: '#f59e0b', description: 'API not available - Make sure emotion prediction API is running' }
    };

    return emotionMap[emotion.toLowerCase()] || emotionMap['unknown'];
  }
}

export const emotionAnalysisService = new EmotionAnalysisService();
export { EmotionAnalysisService };
