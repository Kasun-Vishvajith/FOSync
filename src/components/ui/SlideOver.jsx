import { useEffect } from 'react';
import { X } from 'lucide-react';

export default function SlideOver({ isOpen, onClose, title, children }) {
  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/20 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />
      
      {/* Panel */}
      <div className="relative w-full max-w-md h-full sm:h-[calc(100%-2rem)] sm:my-4 sm:mr-4 sm:rounded-2xl bg-[var(--color-surface)] border-l sm:border border-[var(--color-border)] shadow-[var(--shadow-elevated)] flex flex-col animate-slide-up sm:animate-fade-in">
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-[var(--color-border)]">
          <h2 className="text-xl font-bold text-[var(--color-text-primary)]">{title}</h2>
          <button
            onClick={onClose}
            className="p-2 -mr-2 rounded-[var(--radius-sm)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          {children}
        </div>
      </div>
    </div>
  );
}
