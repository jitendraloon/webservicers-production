import * as React from 'react';

export type ButtonVariant = 'primary' | 'outline' | 'quiet' | 'ghost' | 'danger';
export type ButtonSize = 'default' | 'sm' | 'xs';

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary: 'cpki-btn-primary',
  outline: 'cpki-btn-outline',
  quiet: 'cpki-btn-quiet',
  ghost: 'cpki-btn-ghost',
  danger: 'cpki-btn-danger',
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  default: '',
  sm: 'cpki-btn-sm',
  xs: 'cpki-btn-xs',
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    {
      variant = 'primary',
      size = 'default',
      type = 'button',
      className = '',
      disabled,
      children,
      ...props
    },
    ref
  ) {
    const classes = [
      'cpki-btn',
      VARIANT_CLASSES[variant],
      SIZE_CLASSES[size],
      disabled ? 'opacity-50 pointer-events-none' : '',
      className,
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled}
        className={classes}
        {...props}
      >
        {children}
      </button>
    );
  }
);
