import React from 'react';

export interface StatCardProps {
  label: string;
  value: string | number;
  variant?: 'orange' | 'white' | 'purple' | 'pink' | 'green' | 'dark';
  change?: string;
  trend?: 'up' | 'down' | 'neutral' | string;
  icon?: React.ReactNode;
  description?: string;
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  variant = 'dark',
  change,
  trend = 'neutral',
  icon,
  description,
  className = '',
}) => {
  // Variant surface styling
  const variantStyles = {
    // Vivid Orange highlight card
    orange: {
      card: 'bg-[#FF4B16] border-[#FF4B16] text-[#111111]',
      label: 'text-[#111111]/80 font-medium',
      value: 'text-[#111111] font-extrabold',
      iconBox: 'bg-[#111111]/10 text-[#111111]',
      badge: 'bg-[#111111]/15 text-[#111111]',
      desc: 'text-[#111111]/70',
    },
    // Off-white contrast card
    white: {
      card: 'bg-[#F2F2F5] border-[#E0E2E5] text-[#111111]',
      label: 'text-[#555555] font-medium',
      value: 'text-[#111111] font-extrabold',
      iconBox: 'bg-[#000000]/5 text-[#111111]',
      badge: 'bg-[#000000]/10 text-[#111111]',
      desc: 'text-[#666666]',
    },
    // Electric purple analytics card
    purple: {
      card: 'bg-[#5035E8] border-[#5035E8] text-white',
      label: 'text-white/80 font-medium',
      value: 'text-white font-extrabold',
      iconBox: 'bg-white/15 text-white',
      badge: 'bg-white/20 text-white',
      desc: 'text-white/75',
    },
    // Soft pink category card
    pink: {
      card: 'bg-[#E88BD2] border-[#E88BD2] text-[#111111]',
      label: 'text-[#111111]/80 font-medium',
      value: 'text-[#111111] font-extrabold',
      iconBox: 'bg-[#111111]/10 text-[#111111]',
      badge: 'bg-[#111111]/15 text-[#111111]',
      desc: 'text-[#111111]/70',
    },
    // Emerald green status card
    green: {
      card: 'bg-[#079C68] border-[#079C68] text-white',
      label: 'text-white/85 font-medium',
      value: 'text-white font-extrabold',
      iconBox: 'bg-white/15 text-white',
      badge: 'bg-white/20 text-white',
      desc: 'text-white/80',
    },
    // Charcoal / deep dark card
    dark: {
      card: 'bg-[#121212] border-[#242424] text-[#F5F5F5]',
      label: 'text-[#A6A6AC] font-medium',
      value: 'text-[#F5F5F5] font-extrabold',
      iconBox: 'bg-[#242424] text-[#F5F5F5] border border-[#333333]',
      badge: 'bg-[#1A1A1A] text-[#A6A6AC] border border-[#2A2A2A]',
      desc: 'text-[#777777]',
    },
  }[variant];

  return (
    <div
      className={`rounded-[24px] border p-6 flex flex-col justify-between transition-all duration-200 min-h-[160px] ${variantStyles.card} ${className}`}
    >
      <div className="flex items-center justify-between gap-3 mb-4">
        <span className={`text-xs uppercase tracking-wider ${variantStyles.label}`}>
          {label}
        </span>
        {icon && (
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${variantStyles.iconBox}`}>
            {icon}
          </div>
        )}
      </div>

      <div>
        <div className="flex items-baseline gap-2.5 flex-wrap">
          <span className={`text-3xl sm:text-4xl tracking-tight leading-none ${variantStyles.value}`}>
            {value}
          </span>
          {change && (
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${variantStyles.badge}`}>
              {trend === 'up' ? '↑ ' : trend === 'down' ? '↓ ' : ''}
              {change}
            </span>
          )}
        </div>
        {description && (
          <p className={`text-xs mt-2 ${variantStyles.desc}`}>{description}</p>
        )}
      </div>
    </div>
  );
};
