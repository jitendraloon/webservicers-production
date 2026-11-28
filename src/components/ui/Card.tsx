import * as React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(function Card(
  { className = '', children, ...props },
  ref
) {
  return (
    <div ref={ref} className={`cpki-card ${className}`.trim()} {...props}>
      {children}
    </div>
  );
});

export const CardInsight = React.forwardRef<HTMLDivElement, CardProps>(
  function CardInsight({ className = '', children, ...props }, ref) {
    return (
      <div
        ref={ref}
        className={`cpki-card-insight ${className}`.trim()}
        {...props}
      >
        {children}
      </div>
    );
  }
);

export const CardLearning = React.forwardRef<HTMLDivElement, CardProps>(
  function CardLearning({ className = '', children, ...props }, ref) {
    return (
      <div
        ref={ref}
        className={`cpki-card-learning ${className}`.trim()}
        {...props}
      >
        {children}
      </div>
    );
  }
);
