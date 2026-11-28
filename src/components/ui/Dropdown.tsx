'use client';

import * as React from 'react';

export interface DropdownItem {
  label: React.ReactNode;
  onClick?: () => void;
  icon?: React.ReactNode;
  disabled?: boolean;
  danger?: boolean;
  separator?: boolean;
}

export interface DropdownProps {
  trigger: React.ReactNode;
  items?: DropdownItem[];
  children?: React.ReactNode;
  align?: 'left' | 'right';
  className?: string;
}

export function Dropdown({
  trigger,
  items,
  children,
  align = 'right',
  className = '',
}: DropdownProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div ref={containerRef} className={`relative inline-block ${className}`.trim()}>
      <div
        role="button"
        tabIndex={0}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((prev) => !prev)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            setIsOpen((prev) => !prev);
          }
        }}
        className="inline-flex cursor-pointer"
      >
        {trigger}
      </div>

      {isOpen && (
        <div
          role="menu"
          className={`absolute z-50 mt-1.5 min-w-[180px] rounded-[var(--radius-surface)] border border-[var(--border)] bg-[var(--popover)] text-[var(--popover-foreground)] p-1 shadow-[var(--overlay-shadow)] ${
            align === 'right' ? 'right-0' : 'left-0'
          }`}
        >
          {items
            ? items.map((item, idx) =>
                item.separator ? (
                  <div
                    key={idx}
                    role="separator"
                    className="my-1 h-px bg-[var(--border)]"
                  />
                ) : (
                  <button
                    key={idx}
                    type="button"
                    role="menuitem"
                    disabled={item.disabled}
                    onClick={() => {
                      if (item.disabled) return;
                      item.onClick?.();
                      setIsOpen(false);
                    }}
                    className={`flex w-full items-center gap-2 rounded-[var(--radius-control)] px-2.5 py-1.5 text-left text-xs transition-colors ${
                      item.danger
                        ? 'text-[var(--destructive)] hover:bg-[var(--danger-subtle)]'
                        : 'text-[var(--foreground)] hover:bg-[var(--muted)]'
                    } ${item.disabled ? 'opacity-50 pointer-events-none' : 'cursor-pointer'}`}
                  >
                    {item.icon && <span className="shrink-0">{item.icon}</span>}
                    <span className="truncate">{item.label}</span>
                  </button>
                )
              )
            : children}
        </div>
      )}
    </div>
  );
}
