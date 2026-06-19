import { Loader2 } from 'lucide-react';

const variants = {
  primary: 'bg-primary-600 text-white border border-transparent shadow-sm hover:bg-primary-700 active:bg-primary-800 hover:-translate-y-0.5',
  secondary: 'bg-surface-900 text-surface-200 border border-surface-700 shadow-sm hover:bg-surface-800 active:bg-surface-700 hover:-translate-y-0.5',
  danger: 'bg-red-500 text-white border border-transparent shadow-sm hover:bg-red-600 active:bg-red-700 hover:-translate-y-0.5',
  ghost: 'bg-transparent text-surface-400 hover:text-surface-200 hover:bg-surface-800 border border-transparent',
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
        inline-flex items-center justify-center gap-2 font-medium rounded-xl
        transition-all duration-200 cursor-pointer
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
