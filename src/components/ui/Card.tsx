import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 
    | 'primary' 
    | 'secondary' 
    | 'elevated' 
    | 'deep' 
    | 'offWhite' 
    | 'orange' 
    | 'purple' 
    | 'pink' 
    | 'emerald';
  interactive?: boolean;
  radius?: 'default' | 'panel' | 'card';
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'primary',
  interactive = false,
  radius = 'card',
  className = '',
  ...props
}) => {
  const bgStyles = {
    primary: 'bg-[#121212] border-[#242424] text-[#F5F5F5]',
    secondary: 'bg-[#1A1A1A] border-[#2E2E2E] text-[#F5F5F5]',
    elevated: 'bg-[#242424] border-[#333333] text-[#F5F5F5]',
    deep: 'bg-[#000000] border-[#242424] text-[#F5F5F5]',
    offWhite: 'bg-[#F2F2F5] border-[#E0E2E5] text-[#111111]',
    orange: 'bg-[#FF4B16] border-[#FF4B16] text-[#111111]',
    purple: 'bg-[#5035E8] border-[#5035E8] text-[#FFFFFF]',
    pink: 'bg-[#E88BD2] border-[#E88BD2] text-[#111111]',
    emerald: 'bg-[#079C68] border-[#079C68] text-[#FFFFFF]',
  }[variant];

  const radiusStyles = {
    default: 'rounded-[8px] sm:rounded-[10px]',
    card: 'rounded-[8px] sm:rounded-[10px]',
    panel: 'rounded-[9px] sm:rounded-[13px]',
  }[radius];

  const interactiveStyles = interactive
    ? 'transition-all duration-200 hover:border-[#383838] hover:-translate-y-0.5 cursor-pointer'
    : '';

  return (
    <div
      className={`${radiusStyles} border p-4 sm:p-6 ${bgStyles} ${interactiveStyles} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children,
  className = '',
  ...props
}) => (
  <div className={`flex items-center justify-between gap-4 mb-4 ${className}`} {...props}>
    {children}
  </div>
);

export const CardTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({
  children,
  className = '',
  ...props
}) => (
  <h3 className={`text-base font-semibold tracking-tight ${className}`} {...props}>
    {children}
  </h3>
);

export const CardDescription: React.FC<React.HTMLAttributes<HTMLParagraphElement>> = ({
  children,
  className = '',
  ...props
}) => (
  <p className={`text-xs text-[#A6A6AC] mt-1 ${className}`} {...props}>
    {children}
  </p>
);

export const CardContent: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children,
  className = '',
  ...props
}) => (
  <div className={`${className}`} {...props}>
    {children}
  </div>
);
