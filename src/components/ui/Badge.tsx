import React from 'react';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 
    | 'orange' 
    | 'purple' 
    | 'pink' 
    | 'green' 
    | 'success' 
    | 'warning' 
    | 'danger' 
    | 'neutral' 
    | 'info' 
    | 'lime';
  size?: 'sm' | 'md' | 'lg';
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  size = 'md',
  className = '',
  ...props
}) => {
  const sizeStyles = {
    sm: 'text-[11px] px-2 py-0.5 rounded-full font-medium',
    md: 'text-xs px-2.5 py-1 rounded-full font-medium',
    lg: 'text-xs px-3 py-1.5 rounded-full font-semibold',
  }[size];

  const variantStyles = {
    orange: 'bg-[#FF4B16]/15 text-[#FF6E42] border border-[#FF4B16]/30',
    purple: 'bg-[#5035E8]/15 text-[#A594FF] border border-[#5035E8]/35',
    pink: 'bg-[#E88BD2]/15 text-[#F5B8E8] border border-[#E88BD2]/30',
    green: 'bg-[#079C68]/15 text-[#4CD9A0] border border-[#079C68]/30',
    success: 'bg-[#079C68]/15 text-[#4CD9A0] border border-[#079C68]/30',
    warning: 'bg-[#F59E0B]/15 text-[#FBBF24] border border-[#F59E0B]/30',
    danger: 'bg-[#E63946]/15 text-[#FF6B77] border border-[#E63946]/35',
    neutral: 'bg-[#242424] text-[#A6A6AC] border border-[#333333]',
    info: 'bg-[#5035E8]/15 text-[#A594FF] border border-[#5035E8]/30',
    lime: 'bg-[#FF4B16]/15 text-[#FF6E42] border border-[#FF4B16]/30', // Aliased to vivid orange
  }[variant];

  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap leading-none transition-colors ${sizeStyles} ${variantStyles} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
};
