# Camera Capture Feature for Initial Assessment Quiz

## Overview
This feature automatically captures photos of the child every 10 seconds during the initial assessment quiz to monitor their progress and ensure a secure testing environment.

## How It Works

### 1. Permission Request
- When a child starts the initial assessment quiz, a permission dialog appears
- The dialog explains why camera access is needed
- Child can choose to allow or deny camera access
- If denied, the quiz continues without camera monitoring

### 2. Camera Initialization
- If permission is granted, the system checks for camera availability
- Creates a hidden video element to access the camera
- Sets up automatic capture every 10 seconds

### 3. Image Capture Process
- Every 10 seconds, the current video frame is captured
- Image is converted to base64 format (JPEG, 80% quality)
- Image is automatically saved to Firestore in the `quizImages` collection

### 4. Data Storage
Each captured image is stored in Firestore with the following structure:
```javascript
{
  childId: string,           // ID of the child taking the quiz
  imageData: string,         // Base64 encoded image data
  timestamp: serverTimestamp, // Firestore server timestamp
  capturedAt: string,        // ISO string timestamp
  quizType: 'initial_assessment'
}
```

## Technical Implementation

### Files Modified/Created:
1. `src/utils/cameraCapture.ts` - Core camera capture functionality
2. `src/components/InitialAssessmentQuiz.tsx` - Integration with quiz component
3. `src/components/CameraPermissionDialog.tsx` - Permission request dialog
4. `src/components/CameraPermissionDialog.css` - Dialog styling
5. `src/components/MathQuiz.css` - Camera status indicator styling

### Key Features:
- **Automatic Capture**: Images captured every 10 seconds without user intervention
- **Background Operation**: Works seamlessly while child is taking the quiz
- **Error Handling**: Graceful fallback if camera is not available
- **Permission Management**: User-friendly permission request dialog
- **Real-time Status**: Visual indicator showing camera status and photo count
- **Secure Storage**: Images stored in Firestore with proper metadata

### Browser Compatibility:
- Requires HTTPS for camera access
- Works on modern browsers with camera support
- Gracefully handles devices without cameras

## Usage
The feature is automatically activated when:
1. A child starts the initial assessment quiz
2. The child ID is available
3. Camera permission is granted

No additional configuration is required - the feature works out of the box!

## Privacy & Security
- Images are only captured during the quiz session
- All images are stored securely in Firestore
- Camera access is automatically stopped when quiz ends
- Images are associated with specific child ID for proper tracking
