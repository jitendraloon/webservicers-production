'use client';

import * as React from 'react';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: React.ReactNode;
  children: React.ReactNode;
  maxWidth?: string;
}

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = '520px',
}: ModalProps) {
  const titleId = React.useId();

  React.useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  const isTailwindClass = maxWidth.startsWith('max-w-');

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-[2px]"
      onClick={onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        style={isTailwindClass ? undefined : { maxWidth }}
        className={`cpki-card w-full p-5 shadow-[var(--overlay-shadow)] ${isTailwindClass ? maxWidth : ''}`.trim()}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3 border-b border-[var(--border)] pb-3 mb-4">
          <h2
            id={titleId}
            className="text-base font-semibold text-[var(--foreground)]"
          >
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="cpki-btn cpki-btn-ghost cpki-btn-xs !px-1.5"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 14 14"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
              aria-hidden="true"
            >
              <path d="M2.5 2.5l9 9M11.5 2.5l-9 9" />
            </svg>
          </button>
        </div>
        <div>{children}</div>
      </div>
    </div>
  );
}
