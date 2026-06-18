import { forwardRef } from 'react';

const Input = forwardRef(function Input(
  { label, error, id, className = '', ...props },
  ref
) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label
          htmlFor={id}
          className="block text-sm font-medium text-surface-300"
        >
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={id}
        className={`
          w-full px-3.5 py-2.5 rounded-lg
          bg-surface-800/80 border border-surface-700
          text-surface-100 placeholder:text-surface-500
          transition-all duration-200
          hover:border-surface-600
          focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20
          ${error ? 'border-red-500/60 focus:border-red-500 focus:ring-red-500/20' : ''}
          ${className}
        `}
        {...props}
      />
      {error && (
        <p className="text-sm text-red-400 animate-slide-down">{error}</p>
      )}
    </div>
  );
});

export default Input;
