import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  icon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, icon, className = '', id, required, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-xs font-medium text-[#A6A6AC] flex items-center justify-between">
            <span>
              {label} {required && <span className="text-[#FF4B16] ml-0.5">*</span>}
            </span>
          </label>
        )}
        <div className="relative flex items-center">
          {icon && (
            <div className="absolute left-3.5 text-[#777777] pointer-events-none flex items-center justify-center">
              {icon}
            </div>
          )}
          <input
            id={inputId}
            ref={ref}
            required={required}
            className={`w-full bg-[#121212] text-[#F5F5F5] border rounded-xl px-3.5 py-2.5 text-sm transition-all duration-180 placeholder:text-[#555555] focus:outline-none focus:border-[#FF4B16] focus:ring-2 focus:ring-[#FF4B16]/20 disabled:opacity-50 disabled:cursor-not-allowed ${
              icon ? 'pl-10' : ''
            } ${error ? 'border-[#E63946] focus:border-[#E63946] focus:ring-[#E63946]/20' : 'border-[#242424] hover:border-[#333333]'} ${className}`}
            {...props}
          />
        </div>
        {error ? (
          <span className="text-[11px] text-[#E63946] font-medium">{error}</span>
        ) : helperText ? (
          <span className="text-[11px] text-[#777777]">{helperText}</span>
        ) : null}
      </div>
    );
  }
);

Input.displayName = 'Input';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, helperText, children, className = '', id, required, ...props }, ref) => {
    const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full flex flex-col gap-1.5">
        {label && (
          <label htmlFor={selectId} className="text-xs font-medium text-[#A6A6AC] flex items-center justify-between">
            <span>
              {label} {required && <span className="text-[#FF4B16] ml-0.5">*</span>}
            </span>
          </label>
        )}
        <div className="relative">
          <select
            id={selectId}
            ref={ref}
            required={required}
            className={`w-full bg-[#121212] text-[#F5F5F5] border rounded-xl px-3.5 py-2.5 text-sm transition-all duration-180 focus:outline-none focus:border-[#FF4B16] focus:ring-2 focus:ring-[#FF4B16]/20 disabled:opacity-50 disabled:cursor-not-allowed appearance-none cursor-pointer ${
              error ? 'border-[#E63946]' : 'border-[#242424] hover:border-[#333333]'
            } ${className}`}
            {...props}
          >
            {children}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-[#A6A6AC]">
            <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
              <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
            </svg>
          </div>
        </div>
        {error ? (
          <span className="text-[11px] text-[#E63946] font-medium">{error}</span>
        ) : helperText ? (
          <span className="text-[11px] text-[#777777]">{helperText}</span>
        ) : null}
      </div>
    );
  }
);

Select.displayName = 'Select';
