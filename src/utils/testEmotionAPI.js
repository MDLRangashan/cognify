// Test script to check emotion prediction API response format
// Run this in browser console or as a separate test

async function testEmotionAPI() {
  try {
    // Create a simple test image (1x1 pixel)
    const canvas = document.createElement('canvas');
    canvas.width = 100;
    canvas.height = 100;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'red';
    ctx.fillRect(0, 0, 100, 100);
    
    // Convert to blob
    const blob = await new Promise((resolve) => {
      canvas.toBlob(resolve, 'image/jpeg', 0.8);
    });
    
    // Create FormData
    const formData = new FormData();
    formData.append('image', blob, 'test-image.jpg');
    
    console.log('Testing emotion prediction API...');
    console.log('API URL: http://localhost:5001/api/predict');
    
    // Send request
    const response = await fetch('http://localhost:5001/api/predict', {
      method: 'POST',
      body: formData,
    });
    
    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }
    
    const result = await response.json();
    console.log('API Response:', result);
    console.log('Response keys:', Object.keys(result));
    console.log('Response type:', typeof result);
    
    // Test different possible field names
    const possibleEmotionFields = ['emotion', 'predicted_emotion', 'prediction', 'class', 'label'];
    const possibleConfidenceFields = ['confidence', 'confidence_score', 'score', 'probability', 'confidence_level'];
    
    console.log('\n--- Testing emotion fields ---');
    possibleEmotionFields.forEach(field => {
      console.log(`${field}:`, result[field]);
    });
    
    console.log('\n--- Testing confidence fields ---');
    possibleConfidenceFields.forEach(field => {
      console.log(`${field}:`, result[field]);
    });
    
    return result;
    
  } catch (error) {
    console.error('Test failed:', error);
    
    if (error.message.includes('fetch')) {
      console.error('❌ API is not running! Make sure your emotion prediction API is running on http://localhost:5001');
      console.log('To start your API, run:');
      console.log('python your_emotion_api.py');
      // or whatever command starts your API
    }
    
    return null;
  }
}

// Run the test
testEmotionAPI();
