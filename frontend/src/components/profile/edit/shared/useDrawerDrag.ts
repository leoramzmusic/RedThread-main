import { useState, useEffect, useRef } from 'react';

interface UseDrawerDragReturn {
  isDragging: boolean;
  dragOffsetY: number;
  handleDragStart: (e: React.MouseEvent | React.TouchEvent) => void;
  closeDrawers: () => void;
}

interface UseDrawerDragProps {
  onClose: () => void;
  closeThreshold?: number;
}

/**
 * Custom hook for handling drawer drag-to-close functionality
 * Supports both mouse and touch events
 */
export function useDrawerDrag({ onClose, closeThreshold = 100 }: UseDrawerDragProps): UseDrawerDragReturn {
  const [dragOffsetY, setDragOffsetY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const startYRef = useRef(0);

  // Global listeners for dragging to allow movement outside the handle
  useEffect(() => {
    if (!isDragging) return;

    const handleGlobalMouseMove = (e: MouseEvent) => {
      const delta = e.clientY - startYRef.current;
      // Only allow dragging down
      if (delta > 0) setDragOffsetY(delta);
    };

    const handleGlobalMouseUp = (e: MouseEvent) => {
      const delta = e.clientY - startYRef.current;
      setIsDragging(false);
      setDragOffsetY(0);
      if (delta > closeThreshold) {
        onClose();
      }
    };

    const handleGlobalTouchMove = (e: TouchEvent) => {
      const delta = e.touches[0].clientY - startYRef.current;
      if (delta > 0) setDragOffsetY(delta);
    };

    const handleGlobalTouchEnd = (e: TouchEvent) => {
      const delta = e.changedTouches[0].clientY - startYRef.current;
      setIsDragging(false);
      setDragOffsetY(0);
      if (delta > closeThreshold) {
        onClose();
      }
    };

    window.addEventListener('mousemove', handleGlobalMouseMove);
    window.addEventListener('mouseup', handleGlobalMouseUp);
    window.addEventListener('touchmove', handleGlobalTouchMove);
    window.addEventListener('touchend', handleGlobalTouchEnd);

    return () => {
      window.removeEventListener('mousemove', handleGlobalMouseMove);
      window.removeEventListener('mouseup', handleGlobalMouseUp);
      window.removeEventListener('touchmove', handleGlobalTouchMove);
      window.removeEventListener('touchend', handleGlobalTouchEnd);
    };
  }, [isDragging, onClose, closeThreshold]);

  const handleDragStart = (e: React.MouseEvent | React.TouchEvent) => {
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
    startYRef.current = clientY;
    setIsDragging(true);
  };

  const closeDrawers = () => {
    setDragOffsetY(0);
    setIsDragging(false);
    onClose();
  };

  return {
    isDragging,
    dragOffsetY,
    handleDragStart,
    closeDrawers
  };
}
