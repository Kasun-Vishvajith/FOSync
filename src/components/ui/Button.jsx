import { Loader2 } from 'lucide-react';

const variants = {
  primary: 'bg-[var(--color-accent)] text-white shadow-[var(--shadow-soft)] hover:shadow-[var(--shadow-hover)] hover:bg-[var(--color-accent-hover)] active:scale-[0.98]',
  outline: 'bg-transparent text-[var(--color-text-primary)] border border-[var(--color-border)] hover:bg-[var(--color-surface-hover)] active:scale-[0.98]',
  ghost: 'bg-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)] active:scale-[0.98]',
  danger: 'bg-[#da1e28] text-white shadow-[var(--shadow-soft)] hover:bg-[#b81920] active:scale-[0.98]',
};

const sizes = {
  sm: 'px-3 py-1.5 text-sm rounded-[var(--radius-sm)]',
  md: 'px-4 py-2 text-sm rounded-[var(--radius-md)]',
  lg: 'px-6 py-2.5 text-base rounded-[var(--radius-lg)]',
};

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  className = '',
  ...props
}) {
  // Legacy mappings mapping to Noera ones
  const mappedVariant = variant === 'secondary' ? 'outline' : variant;

  return (
    <button
      className={`
        inline-flex items-center justify-center gap-2 font-medium
        transition-all duration-200 cursor-pointer
        disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none
        ${variants[mappedVariant] || variants.primary} ${sizes[size]} ${className}
      `}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Loader2 className="w-4 h-4 animate-spin" />}
      {children}
    </button>
  );
}
