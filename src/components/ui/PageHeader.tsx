import React from 'react';

export interface PageHeaderProps {
  title: string;
  description?: string;
  badge?: React.ReactNode;
  actions?: React.ReactNode;
  breadcrumbs?: { label: string; href?: string }[];
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  description,
  badge,
  actions,
  breadcrumbs,
}) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 sm:pb-6 border-b border-[#1E1E1E] mb-6 sm:mb-8">
      <div className="min-w-0">
        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav className="flex items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs text-[#777777] mb-2 font-medium overflow-x-auto custom-scrollbar pb-1">
            {breadcrumbs.map((crumb, idx) => (
              <React.Fragment key={idx}>
                {idx > 0 && <span className="text-[#444444]">/</span>}
                {crumb.href ? (
                  <a
                    href={crumb.href}
                    className="hover:text-[#F5F5F5] transition-colors whitespace-nowrap"
                  >
                    {crumb.label}
                  </a>
                ) : (
                  <span className="text-[#A6A6AC] whitespace-nowrap">{crumb.label}</span>
                )}
              </React.Fragment>
            ))}
          </nav>
        )}
        <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap">
          <h1 className="text-xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-[#F5F5F5]">
            {title}
          </h1>
          {badge}
        </div>
        {description && (
          <p className="text-xs sm:text-sm text-[#A6A6AC] mt-1 sm:mt-1.5 max-w-2xl leading-relaxed">
            {description}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex items-center gap-2 sm:gap-3 shrink-0 flex-wrap w-full sm:w-auto">
          {actions}
        </div>
      )}
    </div>
  );
};
