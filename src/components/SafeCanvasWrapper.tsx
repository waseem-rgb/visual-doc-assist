import { useRef, useEffect, useState, useCallback } from 'react';
import { Canvas as FabricCanvas, Circle, FabricImage, Point } from 'fabric';

interface SafeCanvasWrapperProps {
  imageUrl: string;
  width: number;
  height: number;
  onImageLoaded: (canvas: FabricCanvas, image: FabricImage) => void;
  onCanvasReady: (canvas: FabricCanvas) => void;
  onError: (error: string) => void;
}

export const SafeCanvasWrapper = ({ 
  imageUrl, 
  width, 
  height, 
  onImageLoaded, 
  onCanvasReady, 
  onError 
}: SafeCanvasWrapperProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasElementRef = useRef<HTMLCanvasElement | null>(null);
  const fabricCanvasRef = useRef<FabricCanvas | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actualDimensions, setActualDimensions] = useState({ width, height });
  const mountedRef = useRef(true);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);

  // Safe canvas creation with proper timing
  const createCanvas = useCallback(async () => {
    if (!mountedRef.current || !containerRef.current || fabricCanvasRef.current) {
      return;
    }

    try {
      console.log('🎨 [SAFE CANVAS] Creating canvas with dimensions:', actualDimensions);
      
      // Create canvas element manually to avoid React conflicts
      const canvasElement = document.createElement('canvas');
      canvasElement.width = actualDimensions.width;
      canvasElement.height = actualDimensions.height;
      canvasElement.style.width = '100%';
      canvasElement.style.height = '100%';
      canvasElement.style.display = 'block';
      
      // Wait for next frame to ensure DOM is ready
      await new Promise(resolve => requestAnimationFrame(resolve));
      
      if (!mountedRef.current || !containerRef.current) {
        return;
      }

      // Clear container and append canvas
      containerRef.current.innerHTML = '';
      containerRef.current.appendChild(canvasElement);
      canvasElementRef.current = canvasElement;

      console.log('🎨 [SAFE CANVAS] Canvas element created, initializing Fabric');

      // Initialize Fabric.js canvas
      const fabricCanvas = new FabricCanvas(canvasElement, {
        width: actualDimensions.width,
        height: actualDimensions.height,
        selection: false,
        backgroundColor: '#f8fafc',
        enableRetinaScaling: true,
      });

      if (!mountedRef.current) {
        fabricCanvas.dispose();
        return;
      }

      fabricCanvasRef.current = fabricCanvas;
      
      console.log('🖼️ [SAFE CANVAS] Loading image:', imageUrl.substring(0, 50) + '...');

      // Load image with better error handling
      console.log('🖼️ [SAFE CANVAS] Attempting to load image from:', imageUrl);
      
      const img = await FabricImage.fromURL(imageUrl, {
        crossOrigin: imageUrl.startsWith('http') ? 'anonymous' : undefined
      });

      if (!mountedRef.current || !fabricCanvasRef.current) {
        console.log('🚫 [SAFE CANVAS] Component unmounted during image load');
        return;
      }

      console.log('📏 [SAFE CANVAS] Image loaded. Dimensions:', img.width, 'x', img.height);

      // Calculate scale to cover the canvas area completely
      const imgWidth = img.width || 1;
      const imgHeight = img.height || 1;
      const scaleX = actualDimensions.width / imgWidth;
      const scaleY = actualDimensions.height / imgHeight;
      // Use max to ensure image covers the full canvas area (no gaps)
      const scale = Math.max(scaleX, scaleY);
      
      console.log('🔧 [SAFE CANVAS] Image dimensions:', imgWidth, 'x', imgHeight);
      console.log('🔧 [SAFE CANVAS] Canvas dimensions:', actualDimensions.width, 'x', actualDimensions.height);
      console.log('🔧 [SAFE CANVAS] Scaling image by:', scale);
      
      // Apply scale and center the image
      const scaledWidth = imgWidth * scale;
      const scaledHeight = imgHeight * scale;
      
      img.scale(scale);
      img.set({
        left: (actualDimensions.width - scaledWidth) / 2,
        top: (actualDimensions.height - scaledHeight) / 2,
        selectable: false,
        evented: false,
        opacity: 1,
        originX: 'left',
        originY: 'top'
      });

      fabricCanvas.add(img);
      fabricCanvas.sendObjectToBack(img); // Ensure image is behind interactive elements
      fabricCanvas.renderAll();
      
      console.log('✅ [SAFE CANVAS] Image added to canvas and rendered');

      console.log('✅ [SAFE CANVAS] Canvas ready');
      
      setIsReady(true);
      setError(null);
      
      onCanvasReady(fabricCanvas);
      onImageLoaded(fabricCanvas, img);

    } catch (err) {
      console.error('💥 [SAFE CANVAS] Error:', err);
      const errorMsg = err instanceof Error ? err.message : 'Failed to create canvas';
      setError(errorMsg);
      onError(errorMsg);
    }
  }, [imageUrl, actualDimensions.width, actualDimensions.height, onImageLoaded, onCanvasReady, onError]);

  // Setup ResizeObserver to track container size
  useEffect(() => {
    if (!containerRef.current) return;

    resizeObserverRef.current = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width: containerWidth, height: containerHeight } = entry.contentRect;
        console.log('📐 [SAFE CANVAS] Container resized to:', containerWidth, 'x', containerHeight);
        
        if (containerWidth > 0 && containerHeight > 0) {
          setActualDimensions({
            width: Math.floor(containerWidth),
            height: Math.floor(containerHeight)
          });
        }
      }
    });

    resizeObserverRef.current.observe(containerRef.current);

    return () => {
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
      }
    };
  }, []);

  // Initialize canvas with proper timing
  useEffect(() => {
    if (!imageUrl || actualDimensions.width === 0 || actualDimensions.height === 0) {
      return;
    }

    mountedRef.current = true;

    // Delay initialization to ensure React has finished rendering
    const timer = setTimeout(() => {
      if (mountedRef.current) {
        createCanvas();
      }
    }, 100);

    return () => {
      clearTimeout(timer);
    };
  }, [createCanvas, imageUrl, actualDimensions.width, actualDimensions.height]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      
      if (fabricCanvasRef.current) {
        try {
          fabricCanvasRef.current.dispose();
        } catch (error) {
          console.warn('Canvas disposal error:', error);
        }
        fabricCanvasRef.current = null;
      }
    };
  }, []);

  return (
    <div className="relative w-full h-full">
      <div 
        ref={containerRef} 
        className="w-full h-full"
        style={{ minHeight: '300px' }}
      />
      
      {!isReady && !error && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground">Loading interactive diagram...</p>
          </div>
        </div>
      )}

      {error && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="text-destructive text-sm">
              Error loading canvas: {error}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};