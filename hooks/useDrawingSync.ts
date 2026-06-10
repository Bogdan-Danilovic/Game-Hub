'use client';

import { useCallback, useEffect, useRef } from 'react';
import { Stroke } from '@/lib/types/drawing';
import { commitStroke, pushPartialStroke } from '@/lib/firestore/drawing';

const FLUSH_INTERVAL = 150;
const RDP_EPSILON = 0.002;

function perpendicularDistance(
  point: [number, number],
  lineStart: [number, number],
  lineEnd: [number, number]
): number {
  const dx = lineEnd[0] - lineStart[0];
  const dy = lineEnd[1] - lineStart[1];
  if (dx === 0 && dy === 0) {
    return Math.hypot(point[0] - lineStart[0], point[1] - lineStart[1]);
  }
  const t = ((point[0] - lineStart[0]) * dx + (point[1] - lineStart[1]) * dy) /
    (dx * dx + dy * dy);
  const nearest: [number, number] = [lineStart[0] + t * dx, lineStart[1] + t * dy];
  return Math.hypot(point[0] - nearest[0], point[1] - nearest[1]);
}

function rdp(points: [number, number][], epsilon: number): [number, number][] {
  if (points.length <= 2) return points;
  let maxDist = 0;
  let maxIdx = 0;
  for (let i = 1; i < points.length - 1; i++) {
    const d = perpendicularDistance(points[i], points[0], points[points.length - 1]);
    if (d > maxDist) { maxDist = d; maxIdx = i; }
  }
  if (maxDist > epsilon) {
    const left = rdp(points.slice(0, maxIdx + 1), epsilon);
    const right = rdp(points.slice(maxIdx), epsilon);
    return [...left.slice(0, -1), ...right];
  }
  return [points[0], points[points.length - 1]];
}

interface UseDrawingSyncOptions {
  code: string;
  drawerId: string;
  color: string;
  width: number;
  tool: 'pen' | 'eraser';
  enabled: boolean;
  onLocalStroke: (stroke: Stroke) => void;
  onLocalPartial: (points: [number, number][]) => void;
}

export function useDrawingSync({
  code,
  drawerId,
  color,
  width,
  tool,
  enabled,
  onLocalStroke,
  onLocalPartial,
}: UseDrawingSyncOptions) {
  const isDrawing = useRef(false);
  const pointBuffer = useRef<[number, number][]>([]);
  const flushTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const strokeIdRef = useRef('');

  const normalize = useCallback(
    (clientX: number, clientY: number): [number, number] => {
      const canvas = canvasRef.current;
      if (!canvas) return [0, 0];
      const rect = canvas.getBoundingClientRect();
      return [
        (clientX - rect.left) / rect.width,
        (clientY - rect.top) / rect.height,
      ];
    },
    []
  );

  const flushBuffer = useCallback(() => {
    if (pointBuffer.current.length < 2) return;
    const compressed = rdp(pointBuffer.current, RDP_EPSILON);
    onLocalPartial(compressed);
    pushPartialStroke(code, {
      drawerId,
      points: compressed,
      color,
      width,
      tool,
    });
  }, [code, drawerId, color, width, tool, onLocalPartial]);

  const startStroke = useCallback(
    (clientX: number, clientY: number) => {
      if (!enabled) return;
      isDrawing.current = true;
      strokeIdRef.current = crypto.randomUUID();
      const pt = normalize(clientX, clientY);
      pointBuffer.current = [pt];
      onLocalPartial([pt]);

      flushTimer.current = setInterval(flushBuffer, FLUSH_INTERVAL);
    },
    [enabled, normalize, flushBuffer, onLocalPartial]
  );

  const continueStroke = useCallback(
    (clientX: number, clientY: number) => {
      if (!isDrawing.current || !enabled) return;
      const pt = normalize(clientX, clientY);
      pointBuffer.current = [...pointBuffer.current, pt];
      onLocalPartial(pointBuffer.current);
    },
    [enabled, normalize, onLocalPartial]
  );

  const endStroke = useCallback(() => {
    if (!isDrawing.current) return;
    isDrawing.current = false;

    if (flushTimer.current) {
      clearInterval(flushTimer.current);
      flushTimer.current = null;
    }

    const compressed = rdp(pointBuffer.current, RDP_EPSILON);
    if (compressed.length < 2) {
      pointBuffer.current = [];
      return;
    }

    const stroke: Stroke = {
      id: strokeIdRef.current,
      points: compressed,
      color,
      width,
      tool,
    };

    onLocalStroke(stroke);
    commitStroke(code, stroke);
    pointBuffer.current = [];
  }, [code, color, width, tool, onLocalStroke]);

  useEffect(() => {
    return () => {
      if (flushTimer.current) clearInterval(flushTimer.current);
    };
  }, []);

  function onMouseDown(e: React.MouseEvent<HTMLCanvasElement>) {
    startStroke(e.clientX, e.clientY);
  }
  function onMouseMove(e: React.MouseEvent<HTMLCanvasElement>) {
    continueStroke(e.clientX, e.clientY);
  }
  function onMouseUp() {
    endStroke();
  }
  function onMouseLeave() {
    if (isDrawing.current) endStroke();
  }

  function onTouchStart(e: React.TouchEvent<HTMLCanvasElement>) {
    e.preventDefault();
    const t = e.touches[0];
    startStroke(t.clientX, t.clientY);
  }
  function onTouchMove(e: React.TouchEvent<HTMLCanvasElement>) {
    e.preventDefault();
    const t = e.touches[0];
    continueStroke(t.clientX, t.clientY);
  }
  function onTouchEnd(e: React.TouchEvent<HTMLCanvasElement>) {
    e.preventDefault();
    endStroke();
  }

  return {
    canvasRef,
    handlers: {
      onMouseDown,
      onMouseMove,
      onMouseUp,
      onMouseLeave,
      onTouchStart,
      onTouchMove,
      onTouchEnd,
    },
  };
}
