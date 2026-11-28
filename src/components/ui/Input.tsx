import * as React from 'react';

interface FieldWrapperProps {
  label?: React.ReactNode;
  error?: string;
  hint?: string;
  htmlFor?: string;
  children: React.ReactNode;
}

function FieldWrapper({
  label,
  error,
  hint,
  htmlFor,
  children,
}: FieldWrapperProps) {
  if (!label && !error && !hint) {
    return <>{children}</>;
  }

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label
          htmlFor={htmlFor}
          className="text-xs font-medium text-[var(--foreground)]"
        >
          {label}
        </label>
      )}
      {children}
      {error && (
        <span className="text-[11px] text-[var(--destructive)]">{error}</span>
      )}
      {!error && hint && (
        <span className="text-[11px] text-[var(--muted-foreground)]">
          {hint}
        </span>
      )}
    </div>
  );
}

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: React.ReactNode;
  error?: string;
  hint?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  function Input({ label, error, hint, id, className = '', ...props }, ref) {
    const generatedId = React.useId();
    const inputId = id ?? (label ? generatedId : undefined);

    return (
      <FieldWrapper label={label} error={error} hint={hint} htmlFor={inputId}>
        <input
          ref={ref}
          id={inputId}
          aria-invalid={error ? true : undefined}
          className={`cpki-input ${error ? 'border-[var(--destructive)]' : ''} ${className}`.trim()}
          {...props}
        />
      </FieldWrapper>
    );
  }
);

export interface SelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: React.ReactNode;
  error?: string;
  hint?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  function Select(
    { label, error, hint, id, className = '', children, ...props },
    ref
  ) {
    const generatedId = React.useId();
    const selectId = id ?? (label ? generatedId : undefined);

    return (
      <FieldWrapper label={label} error={error} hint={hint} htmlFor={selectId}>
        <select
          ref={ref}
          id={selectId}
          aria-invalid={error ? true : undefined}
          className={`cpki-select ${error ? 'border-[var(--destructive)]' : ''} ${className}`.trim()}
          {...props}
        >
          {children}
        </select>
      </FieldWrapper>
    );
  }
);

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: React.ReactNode;
  error?: string;
  hint?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  function Textarea(
    { label, error, hint, id, className = '', ...props },
    ref
  ) {
    const generatedId = React.useId();
    const textareaId = id ?? (label ? generatedId : undefined);

    return (
      <FieldWrapper
        label={label}
        error={error}
        hint={hint}
        htmlFor={textareaId}
      >
        <textarea
          ref={ref}
          id={textareaId}
          aria-invalid={error ? true : undefined}
          className={`cpki-textarea ${error ? 'border-[var(--destructive)]' : ''} ${className}`.trim()}
          {...props}
        />
      </FieldWrapper>
    );
  }
);
