import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  maxWidth = 'md',
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const maxWidthStyles = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
  }[maxWidth];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog Surface */}
      <div
        role="dialog"
        aria-modal="true"
        className={`relative w-full ${maxWidthStyles} max-h-[90vh] flex flex-col bg-[#141414] border border-[#282828] rounded-[10px] sm:rounded-[14px] p-5 sm:p-7 shadow-2xl text-[#F5F5F5] z-10 my-auto animate-in fade-in zoom-in-95 duration-200`}
      >
        <div className="flex items-start justify-between gap-3 sm:gap-4 mb-4 sm:mb-5 pb-3 border-b border-[#222222] shrink-0">
          <div>
            {title && (
              <h2 className="text-lg sm:text-xl font-bold tracking-tight text-[#F5F5F5]">
                {title}
              </h2>
            )}
            {description && (
              <p className="text-xs text-[#A6A6AC] mt-0.5 sm:mt-1">{description}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 sm:p-2 rounded-xl text-[#A6A6AC] hover:text-[#F5F5F5] hover:bg-[#242424] transition-colors cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="overflow-y-auto custom-scrollbar flex-1 -mr-1 pr-1">{children}</div>
      </div>
    </div>
  );
};
