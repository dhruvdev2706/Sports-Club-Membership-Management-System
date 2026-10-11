import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'accent' | 'outline' | 'ghost' | 'destructive' | 'tertiary';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  icon?: React.ReactNode;
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  icon,
  isLoading = false,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-semibold tracking-tight transition-all duration-180 select-none disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none active:scale-[0.98] cursor-pointer';
  
  const sizeStyles = {
    sm: 'text-xs px-3 py-1.5 rounded-lg gap-1.5 h-8',
    md: 'text-sm px-4 py-2 rounded-xl gap-2 h-10',
    lg: 'text-base px-5 py-2.5 rounded-xl gap-2.5 h-12',
    icon: 'p-2 rounded-xl h-10 w-10 flex items-center justify-center shrink-0',
  }[size];

  const variantStyles = {
    // Primary: Vivid Orange background, dark text, strong prominence
    primary: 'bg-[#FF4B16] text-[#111111] hover:bg-[#E03E0E] active:bg-[#C8340A] shadow-sm shadow-[#FF4B16]/20 font-bold',
    // Secondary: Charcoal background, light text, subtle border
    secondary: 'bg-[#242424] text-[#F5F5F5] border border-[#333333] hover:bg-[#2C2C2C] hover:border-[#444444]',
    // Accent: Electric purple with white text
    accent: 'bg-[#5035E8] text-white hover:bg-[#432BC7] shadow-sm shadow-[#5035E8]/25',
    // Outline: Transparent background, subtle border, clear text
    outline: 'bg-transparent text-[#F5F5F5] border border-[#2A2A2A] hover:bg-[#1A1A1A] hover:border-[#3A3A3A]',
    // Ghost: Clean hover without border
    ghost: 'bg-transparent text-[#A6A6AC] hover:text-[#F5F5F5] hover:bg-[#1A1A1A]',
    // Tertiary (alias to ghost/secondary-light)
    tertiary: 'bg-transparent text-[#A6A6AC] hover:text-[#F5F5F5] hover:bg-[#1A1A1A]',
    // Destructive: Dedicated accessible danger color distinct from orange
    destructive: 'bg-[#E63946] text-white hover:bg-[#D32F2F] shadow-sm shadow-[#E63946]/25',
  }[variant];

  return (
    <button
      className={`${baseStyles} ${sizeStyles} ${variantStyles} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin shrink-0" />
      ) : icon ? (
        <span className="shrink-0 flex items-center justify-center">{icon}</span>
      ) : null}
      {children}
    </button>
  );
};
