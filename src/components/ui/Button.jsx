import { Loader2 } from 'lucide-react';

const variants = {
  primary: 'bg-[var(--color-primary)] text-[var(--color-on-primary)] shadow-[var(--shadow-soft)] hover:shadow-[var(--shadow-hover)] hover:bg-[var(--color-primary-container)] active:scale-[0.98]',
  outline: 'bg-transparent text-[var(--color-on-surface-variant)] border border-[var(--color-outline-variant)] hover:bg-[var(--color-surface-container-low)] active:scale-[0.98]',
  ghost: 'bg-transparent text-[var(--color-on-surface-variant)] hover:text-[var(--color-on-surface)] hover:bg-[var(--color-surface-container-low)] active:scale-[0.98]',
  danger: 'bg-[var(--color-error)] text-[var(--color-on-error)] shadow-[var(--shadow-soft)] hover:bg-[var(--color-error-container)] hover:text-[var(--color-on-error-container)] active:scale-[0.98]',
};

const sizes = {
  sm: 'px-4 py-2 text-xs font-semibold rounded-[var(--radius-lg)]',
  md: 'px-5 py-2.5 text-sm font-semibold rounded-[var(--radius-xl)]',
  lg: 'px-6 py-3 text-sm font-semibold rounded-[var(--radius-2xl)]',
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
  const mappedVariant = variant === 'secondary' ? 'outline' : variant;

  return (
    <button
      className={`
        inline-flex items-center justify-center gap-2 font-medium tracking-wide
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
