import * as React from 'react';

export type BadgeVariant = 'default' | 'sm';
export type BadgeTone =
  | 'neutral'
  | 'primary'
  | 'success'
  | 'warning'
  | 'danger'
  | 'lilac';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  tone?: BadgeTone;
}

const TONE_CLASSES: Record<BadgeTone, string> = {
  neutral: 'bg-[var(--secondary)] text-[var(--foreground)] border border-[var(--border)]',
  primary: 'bg-[var(--accent)] text-[var(--primary-text)]',
  success: 'bg-[var(--success-subtle)] text-[var(--success)]',
  warning: 'bg-[var(--warning-subtle)] text-[var(--warning)]',
  danger: 'bg-[var(--danger-subtle)] text-[var(--destructive)]',
  lilac: 'bg-[var(--lilac-subtle)] text-[var(--lilac-foreground)]',
};

export function Badge({
  variant = 'default',
  tone = 'neutral',
  className = '',
  children,
  ...props
}: BadgeProps) {
  const classes = [
    'cpki-badge',
    variant === 'sm' ? 'cpki-badge-sm' : '',
    TONE_CLASSES[tone],
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <span className={classes} {...props}>
      {children}
    </span>
  );
}
