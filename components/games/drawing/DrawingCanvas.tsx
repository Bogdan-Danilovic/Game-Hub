'use client';

import { useEffect, useRef, useState } from 'react';
import { Stroke, PartialStroke } from '@/lib/types/drawing';

interface DrawingCanvasProps {
  strokes: Stroke[];
  currentStroke: PartialStroke | null;
  localPartialPoints?: [number, number][];
  localPartialColor?: string;
  localPartialWidth?: number;
  localPartialTool?: 'pen' | 'eraser';
  isDrawer: boolean;
  canvasHandlers?: {
    onMouseDown: (e: React.MouseEvent<HTMLCanvasElement>) => void;
    onMouseMove: (e: React.MouseEvent<HTMLCanvasElement>) => void;
    onMouseUp: () => void;
    onMouseLeave: () => void;
    onTouchStart: (e: React.TouchEvent<HTMLCanvasElement>) => void;
    onTouchMove: (e: React.TouchEvent<HTMLCanvasElement>) => void;
    onTouchEnd: (e: React.TouchEvent<HTMLCanvasElement>) => void;
  };
  canvasRef?: React.RefObject<HTMLCanvasElement | null>;
}

function drawStroke(
  ctx: CanvasRenderingContext2D,
  points: [number, number][],
  color: string,
  width: number,
  tool: 'pen' | 'eraser',
  canvasW: number,
  canvasH: number
) {
  if (points.length < 2) return;
  ctx.save();
  ctx.strokeStyle = tool === 'eraser' ? '#080b14' : color;
  ctx.lineWidth = width * Math.max(canvasW, canvasH);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.globalCompositeOperation = tool === 'eraser' ? 'destination-out' : 'source-over';
  ctx.beginPath();
  ctx.moveTo(points[0][0] * canvasW, points[0][1] * canvasH);
  for (let i = 1; i < points.length; i++) {
    ctx.lineTo(points[i][0] * canvasW, points[i][1] * canvasH);
  }
  ctx.stroke();
  ctx.restore();
}

export function DrawingCanvas({
  strokes,
  currentStroke,
  localPartialPoints,
  localPartialColor = '#000000',
  localPartialWidth = 0.004,
  localPartialTool = 'pen',
  isDrawer,
  canvasHandlers,
  canvasRef: externalCanvasRef,
}: DrawingCanvasProps) {
  const internalRef = useRef<HTMLCanvasElement | null>(null);
  const canvasRef = externalCanvasRef ?? internalRef;
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [dims, setDims] = useState({ w: 0, h: 0 });

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const e = entries[0];
      setDims({ w: e.contentRect.width, h: e.contentRect.height });
    });
    ro.observe(el);
    setDims({ w: el.clientWidth, h: el.clientHeight });
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || dims.w === 0) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = dims.w;
    canvas.height = dims.h;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, dims.w, dims.h);

    for (const stroke of strokes) {
      drawStroke(ctx, stroke.points, stroke.color, stroke.width, stroke.tool, dims.w, dims.h);
    }

    const partial = localPartialPoints?.length ? null : currentStroke;
    if (partial) {
      drawStroke(ctx, partial.points, partial.color, partial.width, partial.tool, dims.w, dims.h);
    }

    if (localPartialPoints && localPartialPoints.length >= 2) {
      drawStroke(ctx, localPartialPoints, localPartialColor, localPartialWidth, localPartialTool, dims.w, dims.h);
    }
  }, [strokes, currentStroke, localPartialPoints, localPartialColor, localPartialWidth, localPartialTool, dims, canvasRef]);

  const cursor = isDrawer ? 'crosshair' : 'default';

  return (
    <div ref={containerRef} className="relative w-full" style={{ aspectRatio: '4/3' }}>
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full rounded-xl"
        style={{ cursor, touchAction: 'none', background: '#ffffff' }}
        {...(isDrawer && canvasHandlers ? canvasHandlers : {})}
      />
    </div>
  );
}
