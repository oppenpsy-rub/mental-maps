import React, { useRef, useEffect, useCallback, useState } from 'react';
import styled from 'styled-components';
import { HeatmapData, HeatmapPoint, HeatmapGradient } from '../../types/drawing';

interface HeatmapCanvasProps {
  width: number;
  height: number;
  data: HeatmapData;
  onDataChange?: (data: HeatmapData) => void;
  isDrawing?: boolean;
  className?: string;
}

const CanvasContainer = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
  
  canvas {
    position: absolute;
    top: 0;
    left: 0;
    pointer-events: auto;
  }
`;

const DEFAULT_GRADIENT: HeatmapGradient = {
  0.0: 'rgba(0, 0, 255, 0)',
  0.2: 'rgba(0, 0, 255, 0.5)',
  0.4: 'rgba(0, 255, 255, 0.7)',
  0.6: 'rgba(0, 255, 0, 0.8)',
  0.8: 'rgba(255, 255, 0, 0.9)',
  1.0: 'rgba(255, 0, 0, 1.0)'
};

export const HeatmapCanvas: React.FC<HeatmapCanvasProps> = ({
  width,
  height,
  data,
  onDataChange,
  isDrawing = false,
  className
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);
  const [isMouseDown, setIsMouseDown] = useState(false);
  const animationFrameRef = useRef<number>();

  // Initialize canvas context
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = width;
    canvas.height = height;
    
    const context = canvas.getContext('2d');
    if (!context) return;
    
    contextRef.current = context;
    
    // Initial render
    renderHeatmap();
  }, [width, height]);

  // Re-render when data changes
  useEffect(() => {
    renderHeatmap();
  }, [data]);



  const renderHeatmap = useCallback(() => {
    const canvas = canvasRef.current;
    const context = contextRef.current;
    if (!canvas || !context) return;

    // Clear canvas
    context.clearRect(0, 0, width, height);
    
    if (!data.points || data.points.length === 0) return;

    // Create a temporary canvas for drawing individual points
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = width;
    tempCanvas.height = height;
    const tempContext = tempCanvas.getContext('2d');
    if (!tempContext) return;

    // Set up blending mode for additive effect
    tempContext.globalCompositeOperation = 'lighter';

    // Draw each point
    data.points.forEach(point => {
      const radius = data.radius || 20;
      const intensity = Math.min(point.intensity, data.maxIntensity || 1);
      const normalizedIntensity = intensity / (data.maxIntensity || 1);

      // Create radial gradient for this point
      const gradient = tempContext.createRadialGradient(
        point.x, point.y, 0,
        point.x, point.y, radius
      );

      // Apply gradient based on intensity
      const gradientConfig = data.gradient || DEFAULT_GRADIENT;
      Object.entries(gradientConfig).forEach(([stop, color]) => {
        const alpha = normalizedIntensity * parseFloat(color.match(/[\d.]+(?=\))$/)?.[0] || '1');
        const colorWithAlpha = color.replace(/[\d.]+(?=\))$/, alpha.toString());
        gradient.addColorStop(parseFloat(stop), colorWithAlpha);
      });

      tempContext.fillStyle = gradient;
      tempContext.beginPath();
      tempContext.arc(point.x, point.y, radius, 0, 2 * Math.PI);
      tempContext.fill();
    });

    // Apply blur if specified
    if (data.blur && data.blur > 0) {
      tempContext.filter = `blur(${data.blur}px)`;
      tempContext.drawImage(tempCanvas, 0, 0);
      tempContext.filter = 'none';
    }

    // Draw the result to main canvas
    context.drawImage(tempCanvas, 0, 0);
  }, [width, height, data]);

  const addHeatmapPoint = useCallback((x: number, y: number, intensity: number = 1) => {
    const newPoint: HeatmapPoint = {
      x,
      y,
      intensity
    };

    const newData: HeatmapData = {
      ...data,
      points: [...data.points, newPoint],
      maxIntensity: Math.max(data.maxIntensity || 1, intensity)
    };

    onDataChange?.(newData);
  }, [data, onDataChange]);

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    
    setIsMouseDown(true);
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    addHeatmapPoint(x, y, data.maxIntensity || 1);
  }, [isDrawing, addHeatmapPoint, data.maxIntensity]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !isMouseDown) return;
    
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Throttle point addition for performance
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    
    animationFrameRef.current = requestAnimationFrame(() => {
      addHeatmapPoint(x, y, data.maxIntensity || 1);
    });
  }, [isDrawing, isMouseDown, addHeatmapPoint, data.maxIntensity]);

  const handleMouseUp = useCallback(() => {
    setIsMouseDown(false);
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsMouseDown(false);
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
  }, []);

  // Cleanup animation frame on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  return (
    <CanvasContainer className={className}>
      <canvas
        ref={canvasRef}
        role="presentation"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        style={{
          cursor: isDrawing ? 'crosshair' : 'default'
        }}
      />
    </CanvasContainer>
  );
};

export default HeatmapCanvas;