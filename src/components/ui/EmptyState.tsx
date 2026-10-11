import React from 'react';

export interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  className = '',
}) => {
  return (
    <div
      className={`flex flex-col items-center justify-center p-6 sm:p-12 lg:p-16 text-center border border-dashed border-[#282828] rounded-[18px] sm:rounded-[24px] bg-[#101010]/60 ${className}`}
    >
      <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-[#1A1A1A] border border-[#2E2E2E] flex items-center justify-center text-[#A6A6AC] mb-3.5 sm:mb-4 shadow-inner">
        {icon}
      </div>
      <h3 className="text-base sm:text-lg font-bold text-[#F5F5F5] mb-1.5">{title}</h3>
      <p className="text-xs sm:text-sm text-[#A6A6AC] max-w-sm mb-5 sm:mb-6 leading-relaxed">
        {description}
      </p>
      {action && <div>{action}</div>}
    </div>
  );
};
