'use client';

import * as React from 'react';

interface TabsContextValue {
  value: string;
  setValue: (nextValue: string) => void;
}

const TabsContext = React.createContext<TabsContextValue | null>(null);

function useTabsContext() {
  const ctx = React.useContext(TabsContext);
  if (!ctx) {
    throw new Error('Tabs components must be used within <Tabs>.');
  }
  return ctx;
}

export interface TabsProps {
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  className?: string;
  children: React.ReactNode;
}

export function Tabs({
  defaultValue = '',
  value: controlledValue,
  onValueChange,
  className = '',
  children,
}: TabsProps) {
  const [uncontrolledValue, setUncontrolledValue] = React.useState(defaultValue);
  const isControlled = controlledValue !== undefined;
  const currentValue = isControlled ? controlledValue : uncontrolledValue;

  const setValue = React.useCallback(
    (nextValue: string) => {
      if (!isControlled) {
        setUncontrolledValue(nextValue);
      }
      onValueChange?.(nextValue);
    },
    [isControlled, onValueChange]
  );

  return (
    <TabsContext.Provider value={{ value: currentValue, setValue }}>
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  );
}

export interface TabsListProps extends React.HTMLAttributes<HTMLDivElement> {}

export function TabsList({
  className = '',
  children,
  ...props
}: TabsListProps) {
  return (
    <div
      role="tablist"
      className={`inline-flex items-center gap-1 rounded-[var(--radius-control)] bg-[var(--muted)] p-1 border border-[var(--border)] ${className}`.trim()}
      {...props}
    >
      {children}
    </div>
  );
}

export interface TabsTriggerProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  value: string;
}

export function TabsTrigger({
  value,
  className = '',
  disabled,
  children,
  onClick,
  ...props
}: TabsTriggerProps) {
  const { value: activeValue, setValue } = useTabsContext();
  const isActive = activeValue === value;

  return (
    <button
      type="button"
      role="tab"
      aria-selected={isActive}
      data-state={isActive ? 'active' : 'inactive'}
      disabled={disabled}
      onClick={(event) => {
        setValue(value);
        onClick?.(event);
      }}
      className={`cpki-btn cpki-btn-xs transition-colors ${
        isActive
          ? 'bg-[var(--card)] text-[var(--foreground)] border border-[var(--border)] shadow-[var(--shadow-xs)]'
          : 'bg-transparent text-[var(--muted-foreground)] border border-transparent hover:text-[var(--foreground)]'
      } ${disabled ? 'opacity-50 pointer-events-none' : ''} ${className}`.trim()}
      {...props}
    >
      {children}
    </button>
  );
}

export interface TabsContentProps
  extends React.HTMLAttributes<HTMLDivElement> {
  value: string;
}

export function TabsContent({
  value,
  className = '',
  children,
  ...props
}: TabsContentProps) {
  const { value: activeValue } = useTabsContext();

  if (activeValue !== value) {
    return null;
  }

  return (
    <div role="tabpanel" className={`mt-4 ${className}`.trim()} {...props}>
      {children}
    </div>
  );
}
