import { Loader2 } from 'lucide-react';

const variants = {
  primary: 'bg-primary-600 text-white border-2 border-surface-100 shadow-[3px_3px_0px_0px_var(--color-surface-100)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_0px_var(--color-surface-100)] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none',
  secondary: 'bg-surface-900 text-surface-100 border-2 border-surface-100 shadow-[3px_3px_0px_0px_var(--color-surface-100)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_0px_var(--color-surface-100)] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none',
  danger: 'bg-red-600 text-white border-2 border-surface-100 shadow-[3px_3px_0px_0px_var(--color-surface-100)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_0px_var(--color-surface-100)] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none',
  ghost: 'bg-transparent text-surface-300 hover:text-surface-100 hover:bg-surface-800 border-2 border-transparent',
};

const sizes = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-2.5 text-base',
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
  return (
    <button
      className={`
        inline-flex items-center justify-center gap-2 font-semibold rounded-none
        transition-all duration-100 cursor-pointer
        disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none
        ${variants[variant]} ${sizes[size]} ${className}
      `}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Loader2 className="w-4 h-4 animate-spin" />}
      {children}
    </button>
  );
}
