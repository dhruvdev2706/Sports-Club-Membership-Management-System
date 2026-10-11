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
      className={`flex flex-col items-center justify-center p-12 sm:p-16 text-center border border-dashed border-[#282828] rounded-[24px] bg-[#101010]/60 ${className}`}
    >
      <div className="w-16 h-16 rounded-2xl bg-[#1A1A1A] border border-[#2E2E2E] flex items-center justify-center text-[#A6A6AC] mb-4 shadow-inner">
        {icon}
      </div>
      <h3 className="text-lg font-bold text-[#F5F5F5] mb-1.5">{title}</h3>
      <p className="text-sm text-[#A6A6AC] max-w-sm mb-6 leading-relaxed">
        {description}
      </p>
      {action && <div>{action}</div>}
    </div>
  );
};
