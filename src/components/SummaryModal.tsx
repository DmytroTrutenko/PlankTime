import { useEffect } from 'react';

import { SummaryBar } from './SummaryBar';
import type { UserId, YearProgress } from '../types/progress';

interface SummaryModalProps {
  userId: UserId;
  progress: YearProgress;
  formatPlank: (value: number | null) => string;
  formatPushups: (value: number | null) => string;
  onClose: () => void;
}

// Full-screen overlay that hosts one user's SummaryBar card. Clicking the
// backdrop (anywhere outside the card) closes it; the Escape key does too.
// Card itself stops click propagation so taps inside the card don't dismiss.
export function SummaryModal({
  userId,
  progress,
  formatPlank,
  formatPushups,
  onClose,
}: SummaryModalProps) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 pt-16 backdrop-blur-sm sm:pt-24"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md"
      >
        <SummaryBar
          progress={progress}
          formatPlank={formatPlank}
          formatPushups={formatPushups}
          userId={userId}
        />
      </div>
    </div>
  );
}
