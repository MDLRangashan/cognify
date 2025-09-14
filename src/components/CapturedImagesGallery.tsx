import React, { useState, useEffect } from 'react';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../config/firebaseConfig';
import { CameraCapture } from '../utils/cameraCapture';
import './CapturedImagesGallery.css';

interface CapturedImage {
  id: string;
  childId: string;
  imageData: string;
  timestamp: any;
  capturedAt: string;
  quizType: string;
}

interface CapturedImagesGalleryProps {
  isOpen: boolean;
  onClose: () => void;
  childId: string;
}

const CapturedImagesGallery: React.FC<CapturedImagesGalleryProps> = ({ isOpen, onClose, childId }) => {
  const [images, setImages] = useState<CapturedImage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<CapturedImage | null>(null);

  useEffect(() => {
    if (isOpen && childId) {
      fetchCapturedImages();
    }
  }, [isOpen, childId]);

  const fetchCapturedImages = async () => {
    if (!childId) {
      setError('No child ID provided');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      console.log('Fetching images for child ID:', childId);
      
      // First, try to get images from localStorage
      const localStorageData = CameraCapture.getLocalStorageData(childId);
      console.log('localStorage data:', localStorageData);
      
      if (localStorageData && localStorageData.images.length > 0) {
        console.log(`Found ${localStorageData.images.length} images in localStorage`);
        
        // Convert localStorage images to CapturedImage format
        const localStorageImages: CapturedImage[] = localStorageData.images.map((imageData, index) => ({
          id: `local_${index}`,
          childId: childId,
          imageData: imageData,
          timestamp: new Date(localStorageData.lastUpdated),
          capturedAt: localStorageData.lastUpdated,
          quizType: 'initial_assessment'
        }));
        
        setImages(localStorageImages);
        console.log('Using images from localStorage');
        setLoading(false);
        return;
      }
      
      const imagesRef = collection(db, 'quizImages');
      
      // First, let's try a simpler query to see if there are any images at all
      const allImagesQuery = query(imagesRef);
      const allImagesSnapshot = await getDocs(allImagesQuery);
      console.log('Total images in quizImages collection:', allImagesSnapshot.size);
      
      allImagesSnapshot.forEach((doc) => {
        const data = doc.data();
        console.log('Image document:', {
          id: doc.id,
          childId: data.childId,
          quizType: data.quizType,
          hasImageData: !!data.imageData,
          timestamp: data.timestamp
        });
      });
      
      // Try a simpler query first (without orderBy to avoid index issues)
      const simpleQuery = query(
        imagesRef,
        where('childId', '==', childId),
        where('quizType', '==', 'initial_assessment')
      );
      
      console.log('Executing simple query for child:', childId);
      const simpleSnapshot = await getDocs(simpleQuery);
      console.log('Simple query result size:', simpleSnapshot.size);
      
      // If simple query works, try with orderBy
      let querySnapshot;
      try {
        const q = query(
          imagesRef,
          where('childId', '==', childId),
          where('quizType', '==', 'initial_assessment'),
          orderBy('timestamp', 'desc')
        );
        
        console.log('Executing ordered query for child:', childId);
        querySnapshot = await getDocs(q);
        console.log('Ordered query result size:', querySnapshot.size);
      } catch (orderError) {
        console.warn('Ordered query failed, using simple query:', orderError);
        querySnapshot = simpleSnapshot;
      }
      
      const imagesData: CapturedImage[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        console.log('Processing image document:', {
          id: doc.id,
          childId: data.childId,
          quizType: data.quizType,
          hasImageData: !!data.imageData,
          imageDataLength: data.imageData ? data.imageData.length : 0
        });
        
        // Validate that the image has the required fields
        if (data.imageData && data.childId && data.timestamp) {
          imagesData.push({
            id: doc.id,
            ...data
          } as CapturedImage);
        } else {
          console.warn('Skipping invalid image document:', {
            id: doc.id,
            hasImageData: !!data.imageData,
            hasChildId: !!data.childId,
            hasTimestamp: !!data.timestamp
          });
        }
      });
      
      setImages(imagesData);
      console.log(`Successfully fetched ${imagesData.length} captured images for child ${childId}`);
      
      if (imagesData.length === 0) {
        console.log('No images found. This could mean:');
        console.log('1. Camera capture did not work during the quiz');
        console.log('2. Images were not saved to Firestore');
        console.log('3. Child ID does not match');
        console.log('4. Quiz type is not "initial_assessment"');
      }
    } catch (error) {
      console.error('Error fetching captured images:', error);
      setError(`Failed to load images: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const formatTimestamp = (timestamp: any) => {
    try {
      if (timestamp && timestamp.toDate) {
        return timestamp.toDate().toLocaleString();
      } else if (timestamp) {
        return new Date(timestamp).toLocaleString();
      }
      return 'Unknown time';
    } catch (error) {
      return 'Unknown time';
    }
  };

  const handleImageClick = (image: CapturedImage) => {
    setSelectedImage(image);
  };

  const handleCloseModal = () => {
    setSelectedImage(null);
  };

  if (!isOpen) return null;

  return (
    <div className="images-gallery-overlay">
      <div className="images-gallery-modal">
        <div className="images-gallery-header">
          <h2>📸 My Quiz Photos 📸</h2>
          <div className="header-actions">
            <button className="refresh-btn" onClick={fetchCapturedImages} title="Refresh images">
              🔄
            </button>
            <button className="close-btn" onClick={onClose}>
              ✕
            </button>
          </div>
        </div>
        
        <div className="images-gallery-content">
          {loading ? (
            <div className="loading">Loading your photos...</div>
          ) : error ? (
            <div className="error-container">
              <p>❌ {error}</p>
              <button className="retry-btn" onClick={fetchCapturedImages}>
                Try Again
              </button>
            </div>
          ) : images.length === 0 ? (
            <div className="no-images-container">
              <p>📷 No photos found from your quiz session.</p>
              <p>Photos are captured every 10 seconds during the assessment.</p>
              <p>This could mean:</p>
              <ul style={{ textAlign: 'left', margin: '10px 0' }}>
                <li>Camera permission was denied</li>
                <li>Camera was not available on your device</li>
                <li>Photos are still being processed</li>
              </ul>
              <button className="retry-btn" onClick={fetchCapturedImages}>
                🔄 Check Again
              </button>
            </div>
          ) : (
            <div className="images-grid">
              {images.map((image, index) => (
                <div 
                  key={image.id} 
                  className="image-card"
                  onClick={() => handleImageClick(image)}
                >
                  <img 
                    src={image.imageData} 
                    alt={`Quiz photo ${index + 1}`}
                    className="gallery-image"
                  />
                  <div className="image-info">
                    <span className="image-time">
                      {formatTimestamp(image.timestamp)}
                    </span>
                    <span className="image-number">
                      Photo {index + 1}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="images-gallery-footer">
          <p>📸 {images.length} photos captured during your quiz</p>
          {images.length > 0 && images[0].id.startsWith('local_') && (
            <p style={{ fontSize: '12px', color: '#7f8c8d', margin: '5px 0 0 0' }}>
              💾 Images loaded from local storage
            </p>
          )}
        </div>
      </div>

      {/* Image Modal */}
      {selectedImage && (
        <div className="image-modal-overlay" onClick={handleCloseModal}>
          <div className="image-modal" onClick={(e) => e.stopPropagation()}>
            <div className="image-modal-header">
              <h3>Quiz Photo</h3>
              <button className="close-btn" onClick={handleCloseModal}>
                ✕
              </button>
            </div>
            <div className="image-modal-content">
              <img 
                src={selectedImage.imageData} 
                alt="Full size quiz photo"
                className="full-size-image"
              />
              <div className="image-modal-info">
                <p><strong>Captured:</strong> {formatTimestamp(selectedImage.timestamp)}</p>
                <p><strong>Quiz Type:</strong> {selectedImage.quizType}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CapturedImagesGallery;
