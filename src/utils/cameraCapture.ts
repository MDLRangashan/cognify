import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebaseConfig';

export interface CameraCaptureOptions {
  childId: string;
  captureInterval: number; // in milliseconds
  onError?: (error: string) => void;
  onCapture?: (imageData: string) => void;
}

export class CameraCapture {
  private stream: MediaStream | null = null;
  private video: HTMLVideoElement | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private captureInterval: NodeJS.Timeout | null = null;
  private localStorageUpdateInterval: NodeJS.Timeout | null = null;
  private isCapturing = false;
  private options: CameraCaptureOptions;
  private capturedImages: string[] = [];

  constructor(options: CameraCaptureOptions) {
    this.options = options;
  }

  async startCapture(): Promise<void> {
    try {
      // Request camera permission
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user' // Front camera
        },
        audio: false
      });

      // Create video element (hidden)
      this.video = document.createElement('video');
      this.video.srcObject = this.stream;
      this.video.style.display = 'none';
      this.video.autoplay = true;
      this.video.muted = true;
      document.body.appendChild(this.video);

      // Create canvas element (hidden)
      this.canvas = document.createElement('canvas');
      this.canvas.style.display = 'none';
      document.body.appendChild(this.canvas);

      // Wait for video to be ready
      await new Promise<void>((resolve) => {
        this.video!.onloadedmetadata = () => {
          this.video!.play();
          resolve();
        };
      });

      // Start capturing at intervals
      this.isCapturing = true;
      this.captureInterval = setInterval(() => {
        this.captureImage();
      }, this.options.captureInterval);

      // Start updating localStorage every 5 seconds
      this.localStorageUpdateInterval = setInterval(() => {
        this.updateLocalStorage();
      }, 5000);

      console.log('Camera capture started successfully');
    } catch (error) {
      console.error('Error starting camera capture:', error);
      this.options.onError?.(`Failed to access camera: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  }

  private async captureImage(): Promise<void> {
    if (!this.video || !this.canvas || !this.isCapturing) return;

    try {
      // Set canvas dimensions to match video
      this.canvas.width = this.video.videoWidth;
      this.canvas.height = this.video.videoHeight;

      // Draw current video frame to canvas
      const ctx = this.canvas.getContext('2d');
      if (!ctx) {
        console.error('Could not get canvas context');
        return;
      }

      ctx.drawImage(this.video, 0, 0, this.canvas.width, this.canvas.height);

      // Convert canvas to base64
      const imageData = this.canvas.toDataURL('image/jpeg', 0.8); // 80% quality
      
      // Add to captured images array
      this.capturedImages.push(imageData);
      
      // Save to Firestore
      await this.saveImageToFirestore(imageData);
      
      // Notify callback
      this.options.onCapture?.(imageData);
      
      console.log('Image captured and saved successfully');
    } catch (error) {
      console.error('Error capturing image:', error);
      this.options.onError?.(`Failed to capture image: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private updateLocalStorage(): void {
    try {
      const localStorageKey = `quizImages_${this.options.childId}`;
      const imageData = {
        childId: this.options.childId,
        images: this.capturedImages,
        lastUpdated: new Date().toISOString(),
        totalImages: this.capturedImages.length
      };
      
      localStorage.setItem(localStorageKey, JSON.stringify(imageData));
      console.log(`Updated localStorage with ${this.capturedImages.length} images for child ${this.options.childId}`);
    } catch (error) {
      console.error('Error updating localStorage:', error);
    }
  }

  private async saveImageToFirestore(imageData: string): Promise<void> {
    try {
      const imageDoc = {
        childId: this.options.childId,
        imageData: imageData,
        timestamp: serverTimestamp(),
        capturedAt: new Date().toISOString(),
        quizType: 'initial_assessment'
      };

      console.log('Saving image to Firestore:', {
        childId: this.options.childId,
        imageDataLength: imageData.length,
        capturedAt: imageDoc.capturedAt,
        quizType: imageDoc.quizType
      });

      const docRef = await addDoc(collection(db, 'quizImages'), imageDoc);
      console.log('Image saved to Firestore successfully with ID:', docRef.id);
    } catch (error) {
      console.error('Error saving image to Firestore:', error);
      throw error;
    }
  }

  stopCapture(): void {
    this.isCapturing = false;
    
    if (this.captureInterval) {
      clearInterval(this.captureInterval);
      this.captureInterval = null;
    }

    if (this.localStorageUpdateInterval) {
      clearInterval(this.localStorageUpdateInterval);
      this.localStorageUpdateInterval = null;
    }

    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }

    if (this.video) {
      this.video.remove();
      this.video = null;
    }

    if (this.canvas) {
      this.canvas.remove();
      this.canvas = null;
    }

    console.log('Camera capture stopped');
  }

  isActive(): boolean {
    return this.isCapturing;
  }

  // Static method to get images from localStorage
  static getImagesFromLocalStorage(childId: string): string[] {
    try {
      const localStorageKey = `quizImages_${childId}`;
      const storedData = localStorage.getItem(localStorageKey);
      
      if (storedData) {
        const parsedData = JSON.parse(storedData);
        return parsedData.images || [];
      }
      
      return [];
    } catch (error) {
      console.error('Error getting images from localStorage:', error);
      return [];
    }
  }

  // Static method to get localStorage data
  static getLocalStorageData(childId: string): { images: string[], lastUpdated: string, totalImages: number } | null {
    try {
      const localStorageKey = `quizImages_${childId}`;
      const storedData = localStorage.getItem(localStorageKey);
      
      if (storedData) {
        const parsedData = JSON.parse(storedData);
        return {
          images: parsedData.images || [],
          lastUpdated: parsedData.lastUpdated || '',
          totalImages: parsedData.totalImages || 0
        };
      }
      
      return null;
    } catch (error) {
      console.error('Error getting localStorage data:', error);
      return null;
    }
  }

  // Static method to clear localStorage for a child
  static clearLocalStorage(childId: string): void {
    try {
      const localStorageKey = `quizImages_${childId}`;
      localStorage.removeItem(localStorageKey);
      console.log(`Cleared localStorage for child ${childId}`);
    } catch (error) {
      console.error('Error clearing localStorage:', error);
    }
  }
}

// Utility function to check camera availability
export const checkCameraAvailability = async (): Promise<boolean> => {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const hasVideoInput = devices.some(device => device.kind === 'videoinput');
    
    if (!hasVideoInput) {
      return false;
    }

    // Try to get user media to check permissions
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    stream.getTracks().forEach(track => track.stop());
    return true;
  } catch (error) {
    console.error('Camera not available:', error);
    return false;
  }
};
