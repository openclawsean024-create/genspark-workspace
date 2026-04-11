'use client';

import React from 'react';

interface ProgressBarProps {
  progress: number; // 0-100
  label?: string;
  color?: string;
}

export function ProgressBar({ progress, label, color }: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, progress));

  return (
    <div className="w-full">
      {label && (
        <div className="flex justify-between text-xs text-[var(--text-secondary)] mb-1">
          <span>{label}</span>
          <span>{clamped}%</span>
        </div>
      )}
      <div className="w-full h-2 bg-[var(--bg-tertiary)] rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-300 ease-out"
          style={{
            width: `${clamped}%`,
            background: color || 'var(--accent)',
          }}
        />
      </div>
    </div>
  );
}

// Global progress state manager
let globalProgressListeners: ((progress: number, label?: string) => void)[] = [];
let currentProgress = -1;
let currentLabel = '';

export function setGlobalProgress(progress: number, label?: string) {
  currentProgress = progress;
  currentLabel = label || '';
  globalProgressListeners.forEach(fn => fn(progress, label));
}

export function useGlobalProgress() {
  const [progress, setProgress] = React.useState(currentProgress);
  const [label, setLabel] = React.useState(currentLabel);

  React.useEffect(() => {
    const listener = (p: number, l?: string) => {
      setProgress(p);
      setLabel(l || '');
    };
    globalProgressListeners.push(listener);
    return () => {
      globalProgressListeners = globalProgressListeners.filter(fn => fn !== listener);
    };
  }, []);

  return { progress, label };
}

export function GlobalProgressBar() {
  const { progress, label } = useGlobalProgress();

  if (progress < 0) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 px-4 py-2 bg-[var(--bg-secondary)] border-b border-[var(--border)]">
      <ProgressBar progress={progress} label={label} />
    </div>
  );
}
