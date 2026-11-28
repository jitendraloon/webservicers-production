import React from "react";

interface PageHeaderProps {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
}

export function PageHeader({ title, subtitle, actions }: PageHeaderProps) {
  return (
    <div className="mb-6 flex flex-col gap-2 border-b border-[var(--border)] pb-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-[var(--foreground)]">
          {title}
        </h1>
        {subtitle ? (
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            {subtitle}
          </p>
        ) : null}
      </div>
      {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
    </div>
  );
}
